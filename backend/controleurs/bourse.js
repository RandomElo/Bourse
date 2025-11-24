import YahooFinance from "yahoo-finance2";
import { Op } from "sequelize";
import gestionErreur from "../middlewares/gestionErreur.js";
import { raw } from "express";
// Fonction qui permet de récupérer le prix des actions
async function gestionValeursRecherche(tableauEntree) {
    const finance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

    for (const idAction in tableauEntree) {
        let action = tableauEntree[idAction];
        const requete = await finance.quote(action.ticker);
        const prixActuel = Number(requete.regularMarketPrice);
        const prixFermetureVeille = Number(requete.regularMarketPreviousClose);

        action.rendementJourPourcentage = (((prixActuel - prixFermetureVeille) / prixFermetureVeille) * 100).toFixed(2);
        action.prix = prixActuel.toFixed(2) + " " + requete.currency;
        tableauEntree[idAction] = action;
    }
    return tableauEntree;
}

// Fonction qui permet de calculer les heures de début et de fin d'une séane, utile lors de l'enregistrement de valeur
async function recupererHeureDebutHeureFin(donnees) {
    const timestamps = donnees.timestamp;
    const fermetures = donnees.indicators.quote[0].close;
    const donneesFormatee = await timestamps.map((ts, i) => ({
        date: new Date(ts * 1000),
        value: fermetures[i],
    }));

    // .filter((d) => d.value !== null); // filtrer valeurs null

    const premierPts = donneesFormatee[0];
    const dernierPts = donneesFormatee.at(-1);

    const heureOuverture = premierPts.date;
    const heureFermeture = dernierPts.date;
    return { ouverture: heureOuverture.toLocaleTimeString("fr-FR"), fermeture: heureFermeture.toLocaleTimeString("fr-FR") };
}

export const rechercheAction = gestionErreur(
    async (req, res) => {
        const { valeur } = req.params;
        const finance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

        // --- Étape 1 : Vérification d'abord dans la BDD locale ---

        const rechercheMotCle = await req.Recherche.findOne({ where: { motCle: valeur }, raw: true });
        if (rechercheMotCle) {
            const tableauActions = [];
            for (const idAction of JSON.parse(rechercheMotCle.tableauIdActions)) {
                const action = await req.Action.findByPk(idAction, { raw: true });
                tableauActions.push(action);
            }

            return res.json({
                etat: true,
                detail: await gestionValeursRecherche(
                    tableauActions.map((action) => ({
                        nom: action.nom,
                        ticker: action.ticker,
                        place: action.placeCotation,
                    }))
                ),
            });
        } else {
            // --- Fonctions de normalisation et de similarité ---
            function normaliserTexte(texte) {
                return texte
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-zA-Z0-9 ]/g, " ")
                    .replace(/\s+/g, " ")
                    .trim()
                    .toLowerCase();
            }

            function similariteTexte(a, b) {
                if (!a || !b) return 0;
                a = normaliserTexte(a);
                b = normaliserTexte(b);

                const getTrigrams = (s) => {
                    const tri = new Set();
                    for (let i = 0; i < s.length - 2; i++) tri.add(s.slice(i, i + 3));
                    return tri;
                };

                const setA = getTrigrams(a);
                const setB = getTrigrams(b);
                const intersection = [...setA].filter((x) => setB.has(x));
                return intersection.length / Math.max(setA.size, setB.size);
            }

            const resultat = await finance.search(valeur);
            const actionsFiltrees = [];

            for (const action of resultat.quotes) {
                if (!action.symbol || action.quoteType !== "EQUITY") continue;

                const aujourdHui = new Date();
                const jour = aujourdHui.getDay();
                const diff = ((jour + 6 - 2) % 7) + 1;
                const dernierMardi = new Date(aujourdHui);
                dernierMardi.setDate(aujourdHui.getDate() - diff);

                let donnees;
                try {
                    donnees = await finance.chart(action.symbol, {
                        period1: dernierMardi.toISOString().slice(0, 10),
                        interval: "1m",
                        return: "object",
                    });
                } catch (erreur) {
                    continue;
                }

                // --- Suppression des actions parasites ---
                const quote = donnees.indicators?.quote?.[0];
                if (!quote) continue;

                const volumes = quote.volume?.filter((v) => typeof v === "number" && v > 0) || [];
                if (volumes.length < 10) continue;

                const sommeVolumes = volumes.reduce((acc, v) => acc + v, 0);

                let ouverture = "";
                let fermeture = "";
                if (donnees.indicators.quote[0] != null) {
                    const reponse = await recupererHeureDebutHeureFin(donnees);
                    ouverture = reponse.ouverture;
                    fermeture = reponse.fermeture;
                }

                const premierTrade = donnees.meta.firstTradeDate ? new Date(donnees.meta.firstTradeDate).toISOString().split("T")[0] : null;

                actionsFiltrees.push({
                    nom: action.longname || action.shortname,
                    ticker: action.symbol,
                    placeCotation: action.exchDisp,
                    secteur: action?.sectorDisp,
                    industrie: action?.industryDisp,
                    ouverture,
                    fermeture,
                    devise: donnees.meta.currency,
                    premierTrade,
                    volume: sommeVolumes,
                });
            }

            // --- Détection et suppression des doublons ---
            actionsFiltrees.sort((a, b) => b.volume - a.volume);
            const actionsNettoyees = [];
            for (const action of actionsFiltrees) {
                const dejaPresente = actionsNettoyees.some((a) => similariteTexte(a.nom, action.nom) > 0.75);
                if (!dejaPresente) actionsNettoyees.push(action);
            }

            // --- Insertion en BDD ---
            for (const action of actionsNettoyees) {
                await req.Action.upsert({
                    nom: action.nom,
                    ticker: action.ticker,
                    placeCotation: action.placeCotation,
                    secteur: action.secteur,
                    industrie: action.industrie,
                    ouverture: action.ouverture,
                    fermeture: action.fermeture,
                    devise: action.devise,
                    premierTrade: action.premierTrade,
                });
            }

            res.json({
                etat: true,
                detail: await gestionValeursRecherche(
                    actionsNettoyees.map((action) => ({
                        nom: action.nom,
                        ticker: action.ticker,
                        place: action.placeCotation,
                    }))
                ),
            });
            const tableauIdActions = [];
            // --- Insertion en BDD ---
            for (const action of actionsNettoyees) {
                const { id } = await req.Action.findOne({ where: { nom: action.nom }, raw: true });
                tableauIdActions.push(id);
            }
            await req.Recherche.create({ motCle: valeur, tableauIdActions });
        }
    },
    "controleurRechercheValeur",
    "Erreur lors de la recherche de l'action"
);

export const graphique = gestionErreur(
    async (req, res) => {
        // Initalisation de l'objet Yahoo Finance
        const finance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

        // Récupération des valeurs dans la bdd
        const { ouverture, fermeture, devise, nom, premierTrade } = await req.Action.findOne({ where: { ticker: req.query.ticker } });

        // GESTION DU GRAPHIQUE

        // Initialisation des variables
        const aujourdhui = new Date();
        const hier = new Date();
        hier.setDate(aujourdhui.getDate() - 1);

        let period1;
        let period2;
        let interval;
        const miseEnFormeDate = (date) => date.toISOString().split("T")[0];

        const duree = req.query.duree ? req.query.duree : null;

        // Gestion des dates
        if (!duree || duree == "1 j") {
            const heureActuelle = aujourdhui.toLocaleTimeString("fr-FR");
            if (heureActuelle < ouverture) {
                period1 = miseEnFormeDate(hier);
            } else {
                period1 = miseEnFormeDate(aujourdhui);
            }
            interval = "1m";
        } else if (duree == "5 j") {
            period1 = miseEnFormeDate(new Date(aujourdhui.getTime() - 5 * 24 * 60 * 60 * 1000));
            interval = "5m";
        } else if (duree == "1 m") {
            period1 = miseEnFormeDate(new Date(aujourdhui.getTime() - 30 * 24 * 60 * 60 * 1000));
            interval = "30m";
        } else if (duree == "6 m") {
            period1 = miseEnFormeDate(new Date(aujourdhui.getTime() - 183 * 24 * 60 * 60 * 1000));
            interval = "1d";
        } else if (duree == "1 a") {
            period1 = miseEnFormeDate(new Date(aujourdhui.getTime() - 365 * 24 * 60 * 60 * 1000));
            interval = "1d";
        } else if (duree == "5 a") {
            period1 = miseEnFormeDate(new Date(aujourdhui.getTime() - 5 * 365 * 24 * 60 * 60 * 1000));
            interval = "1wk";
        } else if (duree == "MAX") {
            period1 = "1970-01-01";
            interval = "1mo";
        }

        // Si c'est nécessaire j'ajoute un date de fin
        if (["1 m", "6 m", "1 a", "5 a", "MAX"].includes(duree)) {
            period2 = miseEnFormeDate(aujourdhui);
        }

        let options = {
            period1,
            interval,
            return: "object",
        };
        if (period2) options.period2 = period2;

        const graph = await finance.chart(req.query.ticker, options);
        if (!graph.indicators.quote[0]) {
            return res.json({ etat: true, detail: { donnees: { premierTrade, nom }, message: "Impossible de récupérer les données dans la plage demandée." } });
        }

        const timestamps = graph.timestamp;
        const prixFermeture = graph.indicators.quote[0].close;

        const dates = timestamps.map((ts) => new Date(ts * 1000));

        // Calcul du rendement
        const premierPrix = graph.meta.previousClose ? Number(graph.meta.previousClose) : Number(prixFermeture[0]);
        let dernierPrix = Number(prixFermeture[prixFermeture.length - 1]);
        const rendement = (((dernierPrix - premierPrix) / premierPrix) * 100).toFixed(2);
        dernierPrix = dernierPrix.toFixed(2);

        if (!duree || duree == "1j") {
            return res.json({ etat: true, detail: { dates, prixFermeture, devise, nom, dernierPrix, rendement, premierTrade } });
        } else {
            return res.json({ etat: true, detail: { dates, prixFermeture, devise, nom, dernierPrix, rendement, premierTrade } });
        }
    },
    "controleurInformationsAction",
    "Erreur lors de la récupération d'information sur l'action"
);
export const recuperationPremierTrade = gestionErreur(
    async (req, res) => {
        const { ticker } = req.query;

        if (!ticker) {
            throw new Error("Absence id action");
        }
        const action = await req.Action.findOne({ where: { ticker }, raw: true });

        return res.json({ etat: true, detail: action.premierTrade });
    },
    "controleurRecuperationPremierTrade",
    "Erreur lors de la récuépration du premier jour de cotation"
);
