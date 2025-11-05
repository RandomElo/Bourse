import gestionErreur from "../middlewares/gestionErreur.js";
import YahooFinance from "yahoo-finance2";

// Fonction qui permet de simplifier la récupération des portefeuilles utilisateur
const recuperationListePortefeuillesUtilisateur = async (req) => {
    const liste = await req.Portefeuille.findAll({ where: { idUtilisateur: req.idUtilisateur } });
    liste.map((portefeuille) => ({ id: portefeuille.id, nom: portefeuille.nom }));
    return liste;
};

// Fonction qui permet de récupérer transactions, etc dans les portefeuilles
const recuperationsDetailsPortefeuille = async (req, idPortefeuille) => {
    const finance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

    const transactions = await req.Transaction.findAll({
        where: { idPortefeuille },
        attributes: { exclude: ["idPortefeuille"] },
        raw: true,
    });

    const idActions = [...new Set(transactions.map((t) => t.idAction))];

    const actions = await Promise.all(idActions.map((id) => req.Action.findByPk(id)));
    const cotations = await Promise.all(actions.map((a) => finance.quote(a.ticker)));

    let devisePortefeuille = null;
    let calculerValorisation = true;

    const detailsActions = {};
    actions.forEach((action, i) => {
        const quote = cotations[i];
        const devise = quote.currency;

        if (!devisePortefeuille) devisePortefeuille = devise;
        if (devise !== devisePortefeuille) calculerValorisation = false;

        detailsActions[action.id] = {
            nom: action.nom,
            prixActuel: quote.regularMarketPrice,
            prixHier: quote.regularMarketPreviousClose,
            devise,
        };
    });

    const transactionsEnrichies = transactions.map((t) => ({
        ...t,
        ...detailsActions[t.idAction],
    }));

    let valorisationActuel = 0;
    let valorisationDepart = 0;
    let valorisationHier = 0;

    for (const t of transactionsEnrichies) {
        valorisationActuel += t.quantite * t.prixActuel;
        valorisationDepart += t.quantite * t.prix;
        valorisationHier += t.quantite * t.prixHier;
    }

    const gainTotal = ((valorisationActuel - valorisationDepart) / valorisationDepart) * 100;
    const gainAujourdhui = ((valorisationActuel - valorisationHier) / valorisationHier) * 100;

    return {
        valorisation: calculerValorisation ? valorisationActuel.toFixed(2) : "Calcul impossible",
        gainTotal: gainTotal.toFixed(2),
        gainAujourdhui: gainAujourdhui.toFixed(2),
        devise: devisePortefeuille,
        listeTransactions: transactionsEnrichies,
    };
};

// Permet de crée un portefeuille
export const creation = gestionErreur(
    async (req, res) => {
        await req.Portefeuille.create({ nom: req.body.nom, idUtilisateur: req.idUtilisateur });

        const liste = await recuperationListePortefeuillesUtilisateur(req);

        return res.json({ etat: true, detail: liste });
    },
    "controleurCreationPortefeuille",
    "Erreur lors de l'enregistrement du portefeuille"
);

// Permet de récupérer la liste des portefeuilles
export const recupererListe = gestionErreur(
    async (req, res) => {
        const liste = await recuperationListePortefeuillesUtilisateur(req);
        return res.json({ etat: true, detail: liste });
    },
    "controleurRecupererListePortefeuille",
    "Erreur lors de la récupération des portefeuilles"
);

// Permet d'enregistrer un achat
export const enregistrerAchat = gestionErreur(
    async (req, res) => {
        const { nombre, prix, ticker, idPortefeuille, date } = req.body;

        // Il faut récupérer la data

        const action = await req.Action.findOne({ where: { ticker } });
        // Je verifie que l'action existe
        if (action.id) {
            const portefeuille = await req.Portefeuille.findByPk(req.idUtilisateur);
            // Je verifie que le protefeuille existe et qu'il apparient au propriétaire
            if (portefeuille && portefeuille.idUtilisateur == req.idUtilisateur) {
                // Je vérifie la date de l'action
                if (date > action.premierTrade && date < new Date().toISOString().split("T")[0]) {
                    await req.Transaction.create({ type: "achat", quantite: nombre, prix, idPortefeuille, idAction: action.id, date });
                    return res.json({ etat: true, detail: true });
                } else {
                    return res.json({ etat: true, detail: { erreur: "Erreur lors de la validation de la date" } });
                }
            } else {
                return res.json({ etat: true, detail: { erreur: "Erreur lors de la recherche du portefeuille" } });
            }
        } else {
            return res.json({ etat: true, detail: { erreur: "Action introuvable" } });
        }
    },
    "controleurEnregistrerAchat",
    "Erreur lors de l'enregistrement d'achat de l'action"
);

export const recupererListePortefeuilleEtTransaction = gestionErreur(
    async (req, res) => {
        let portefeuilles = await req.Portefeuille.findAll({
            where: { idUtilisateur: req.idUtilisateur },
            raw: true,
            attributes: { exclude: ["idUtilisateur"] },
        });

        const details = await Promise.all(portefeuilles.map((portefeuille) => recuperationsDetailsPortefeuille(req, portefeuille.id)));

        portefeuilles = portefeuilles.map((p, i) => ({
            ...p,
            ...details[i],
        }));

        return res.json({ etat: true, detail: portefeuilles });
    },
    "controleurRecuperationListePortefeuilleEtTransaction",
    "Erreur lors de la récupération détaillée des portefeuilles et de leur contenu"
);

// Verifie si j'ai le droit d'accèder a ce portefeuille
export const verificationAcces = gestionErreur(
    async (req, res) => {
        const { id } = req.params;

        if (!id) {
            throw new Error("Absence id portefeuille");
        }
        const portefeuille = await req.Portefeuille.findByPk(id);
        if (!portefeuille || portefeuille.idUtilisateur !== req.idUtilisateur) {
            return res.json({ etat: true, detail: false });
        } else {
            return res.json({ etat: true, detail: true });
        }
    },
    "controleurVerificationAcces",
    "Erreur lors de la vérification d'autorisation d'accès au portefeuille"
);

// Récupére les transactions pour un portefeuille
export const recuperationDetailsUnPortefeuille = gestionErreur(
    async (req, res) => {
        const { id } = req.params;
        const detail = await recuperationsDetailsPortefeuille(req, id);
        return res.json({ etat: true, detail });
    },
    "controleurRecuperationDetailsUnPortefeuille",
    "Erreur lors de la récupération des détails du portefeuille"
);

export const recuperationGraphiqueValorisation = gestionErreur(
    async (req, res) => {
        const { id, duree } = req.query;

        const portefeuille = await req.Portefeuille.findByPk(id);
        if (!portefeuille || portefeuille.idUtilisateur !== req.idUtilisateur) {
            return res.json({ etat: false, detail: "Accès interdit" });
        }

        const finance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

        // Récupération des transactions
        const transactions = await req.Transaction.findAll({
            where: { idPortefeuille: id },
            order: [["date", "ASC"]],
            raw: true,
        });

        if (transactions.length === 0) {
            return res.json({ etat: true, detail: [] });
        }

        // Regroupement par action
        const actionsMap = {};
        for (const transaction of transactions) {
            if (!actionsMap[transaction.idAction]) actionsMap[transaction.idAction] = [];
            actionsMap[transaction.idAction].push(transaction);
        }

        //Récupération des cours des actions
        const historiqueActions = {};
        const quantitesCumul = {}; // idAction → { date → quantité }

        const aujourdHui = new Date();

        for (const idAction of Object.keys(actionsMap)) {
            const action = await req.Action.findByPk(idAction, { raw: true });
            if (!action) continue;

            const { ticker } = action;

            // Récupération du cours depuis 1970
            const donneesGraphiques = await finance.chart(ticker, {
                period1: "1970-01-01",
                interval: "1d",
                return: "object",
            });
            const timestamps = donneesGraphiques.timestamp;
            const fermetures = donneesGraphiques.indicators.quote[0].close;

            const historique = {};
            timestamps.forEach((ts, i) => {
                const d = new Date(ts * 1000).toISOString().slice(0, 10);
                historique[d] = fermetures[i];
            });
            historiqueActions[idAction] = historique;

            // Construction de la quantité détenue jour par jour
            const listeDatesCours = Object.keys(historique).sort();
            let quantite = 0;
            const quantParJour = {};

            for (const date of listeDatesCours) {
                // Ajustement quantité si transaction ce jour
                const transactionsDuJour = actionsMap[idAction].filter((t) => t.date === date);

                for (const transaction of transactionsDuJour) {
                    quantite += transaction.type === "achat" ? transaction.quantite : -transaction.quantite;
                }
                quantParJour[date] = quantite;
            }
            quantitesCumul[idAction] = quantParJour;
        }

        // Construction de la valorisation totale du portefeuille jour par jour
        const datesReference = Object.values(historiqueActions)[0] ? Object.keys(Object.values(historiqueActions)[0]).sort() : [];

        let valorisationTotale = [];

        for (const date of datesReference) {
            let somme = 0;

            for (const idAction of Object.keys(historiqueActions)) {
                const prix = historiqueActions[idAction][date];
                const quant = quantitesCumul[idAction][date] || 0;

                if (prix && quant > 0) somme += prix * quant;
            }
            const sommeFinale = Number(somme.toFixed(2));

            if (sommeFinale !== 0) {
                valorisationTotale.push({
                    date: date,
                    valeur: sommeFinale,
                });
            }
        }
        let valorisationFinale;
        switch (duree) {
            case "5 j":
                valorisationFinale = valorisationTotale.slice(-5);
                break;
            case "1 m":
                valorisationFinale = valorisationTotale.slice(-30);
                break;
            case "6 m":
                valorisationFinale = valorisationTotale.slice(-180);
                break;
            case "1 a":
                valorisationFinale = valorisationTotale.slice(-365);
                break;
            case "5 a":
                valorisationFinale = valorisationTotale.slice(-1825);
                break;
            default:
                // rien à faire pour MAX
                valorisationFinale = valorisationTotale;
                break;
        }
        const premierValorisation = Number(valorisationTotale[0].valeur);
        const valorisationHier = Number(valorisationFinale[valorisationFinale.length - 2].valeur);
        const valorisationAujourdhui = Number(valorisationFinale[valorisationFinale.length - 1].valeur);
        const reponse = {
            nom: portefeuille.nom,
            valorisation: valorisationAujourdhui,
            gainTotal: Number((((valorisationAujourdhui - premierValorisation) / premierValorisation) * 100).toFixed(2)),
            gainAujourdhui: Number((((valorisationAujourdhui - valorisationHier) / valorisationHier) * 100).toFixed(2)),
            tableauValorisation: valorisationFinale,
        };

        return res.json({ etat: true, detail: reponse });
    },
    "controleurRecuperationGraphiqueValorisation",
    "Erreur lors de les récupérations des informations sur la valorisation des actifs dans le portefeuilles"
);
