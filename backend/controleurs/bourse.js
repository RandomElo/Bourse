import YahooFinance from "yahoo-finance2";
import { Op } from "sequelize";
import gestionErreur from "../middlewares/gestionErreur.js";

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
        // Vérification de la bdd
        const resultatsBdd = await req.Action.findAll({ where: { nom: { [Op.like]: `%${req.params.valeur}%` } }, order: [["nom", "ASC"]], limit: 3 });
        if (resultatsBdd.length == 3) {
            return res.json({ etat: true, detail: await gestionValeursRecherche(resultatsBdd.map((action) => ({ nom: action.nom, ticker: action.ticker, place: action?.placeCotation }))) });
        } else {
            const finance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
            // Récupération de nouvelle valeur
            const resultat = await finance.search(req.params.valeur);
            // Trie et enregistrement
            for (const action of resultat.quotes) {
                if (!action.symbol || action.quoteType != "EQUITY") continue;
                // Récupération pour une valeur témoin
                const donnees = await finance.chart(action.symbol, {
                    period1: "2025-10-21",
                    interval: "1m",
                    return: "object",
                });
                console.log(donnees.meta.firstTradeDate);

                let ouverture = "";
                let fermeture = "";
                if (donnees.indicators.quote[0] != null) {
                    const reponse = await recupererHeureDebutHeureFin(donnees);
                    ouverture = reponse.ouverture;
                    fermeture = reponse.fermeture;
                }

                // Construction d'un tableau avec date et valeur

                await req.Action.upsert({
                    nom: action.longname || action.shortname,
                    ticker: action.symbol,
                    placeCotation: action.exchDisp,
                    secteur: action?.sectorDisp,
                    industrie: action?.industryDisp,
                    ouverture,
                    fermeture,
                    devise: donnees.meta.currency,
                });
            }

            const resultatsBdd = await req.Action.findAll({ where: { nom: { [Op.like]: `%${req.params.valeur}%` } }, order: [["nom", "ASC"]], limit: 3 });

            return res.json({ etat: true, detail: await gestionValeursRecherche(resultatsBdd.map((action) => ({ nom: action.nom, ticker: action.ticker, place: action?.placeCotation }))) });
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
        const { ouverture, fermeture, devise, nom } = await req.Action.findOne({ where: { ticker: req.query.ticker } });

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
            return res.json({ etat: true, detail: { nom, message: "Impossible de récupérer les données dans la plage demandée." } });
        }
        const timestamps = graph.timestamp;
        const prixFermeture = graph.indicators.quote[0].close;

        const dates = timestamps.map((ts) => new Date(ts * 1000));

        // Calcul du rendement
        const premierPrix = Number(graph.meta.previousClose);
        let dernierPrix = Number(prixFermeture[prixFermeture.length - 1]);

        const rendement = (((dernierPrix - premierPrix) / premierPrix) * 100).toFixed(2);
        dernierPrix = dernierPrix.toFixed(2);

        if (!duree || duree == "1j") {
            return res.json({ etat: true, detail: { dates, prixFermeture, ouverture, fermeture, devise, nom, dernierPrix, rendement } });
        } else {
            return res.json({ etat: true, detail: { dates, prixFermeture, devise, nom, dernierPrix, rendement } });
        }
    },
    "controleurInformationsAction",
    "Erreur lors de la récupération d'information sur l'action"
);
