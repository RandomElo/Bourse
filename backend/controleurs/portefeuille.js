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
export const verificationSuiviValeurPortefeuilles = gestionErreur(
    async (req, res) => {
        res.json({ etat: true, detail: "Recu" });
        setImmediate(async () => {
            const finance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
            const transactions = await req.Transaction.findAll({ raw: true });

            const date = new Date();
            date.setDate(date.getDate() - 20);
            console.log(date);

            const tableauIdAction = [];
            for (const transaction of transactions) {
                // Si jamais je ne m'en suis pas encore occuper
                if (!tableauIdAction.includes(transaction.idAction)) {
                    tableauIdAction.push(transaction.idAction);

                    const action = await req.Action.findByPk(transaction.idAction);

                    const requete = await finance.chart(action.ticker, {
                        period1: date,
                        interval: "1d",
                        return: "object",
                    });
                    // Mise en forme des données reçu
                    const timestamps = requete.timestamp;
                    const fermetures = requete.indicators.quote[0].close;

                    const donneesFormatee = timestamps.map((ts, i) => ({
                        date: new Date(ts * 1000),
                        value: fermetures[i],
                    }));

                    // console.log(donneesFormatee);

                    // Récupérer de l'historique de prix pour l'action
                    const historiquePrix = await req.HistoriquePrix.findAll({ where: { idAction: transaction.idAction }, raw: true });

                    for (const donneesPrix of donneesFormatee) {
                        // prendre en charge l'enregistrement sans filter et apres désactiver et mettre uen verification
                        const date = new Date(donneesPrix.date).toISOString().split("T")[0];
                        const dateHistoriquePrix = historiquePrix.filter((enregistrement) => enregistrement.date == date);
                        console.log(dateHistoriquePrix);
                    }
                    // Je verifie qu'il y a bien une date pour chaque timestamp de requete

                    const heureActuelle = new Date().getHours();
                    if (heureActuelle >= 20) {
                        // si jamais il y a pas de date du jours alors corriger
                    }
                    console.log(heureActuelle);

                    const dernierDate = new Date(requete.timestamp[requete.timestamp.length - 1] * 1000).toLocaleDateString("fr-FR");
                    const dernierHeure = new Date(requete.timestamp[requete.timestamp.length - 1] * 1000).toLocaleTimeString("fr-FR");
                    console.log(action.ticker + " - " + dernierDate + " | " + dernierHeure);
                }
            }
        });
    },
    "controleurVerificationSuiviValeurPortefeuilles",
    "Erreur lors de la verification des valeurs en portefeuilles"
);
