import gestionErreur from "../middlewares/gestionErreur.js";
import YahooFinance from "yahoo-finance2";

// Fonction qui permet de simplifier la récupération des portefeuilles utilisateur
const recuperationListePortefeuillesUtilisateur = async (req) => {
    const liste = await req.Portefeuille.findAll({ where: { idUtilisateur: req.idUtilisateur } });
    liste.map((portefeuille) => ({ id: portefeuille.id, nom: portefeuille.nom }));
    return liste;
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
    "Erreur lors de l'enregistrelent d'achat de l'action"
);

export const recupererListePortefeuilleEtTransaction = gestionErreur(
    async (req, res) => {
        const finance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
        let portefeuilles = await req.Portefeuille.findAll({
            where: { idUtilisateur: req.idUtilisateur },
            raw: true,
            attributes: { exclude: ["idUtilisateur"] },
        });

        for (const indexPortefeuille in portefeuilles) {
            const portefeuille = portefeuilles[indexPortefeuille];

            const transactions = await req.Transaction.findAll({ where: { idPortefeuille: portefeuille.id }, attributes: { exclude: ["idPortefeuille"] }, raw: true });

            let devisePortefeuille = null;
            let calculerValorisation = true;

            // Création d'un tableau qui contient les id de facon unique
            // map permet de crée un tableau simple avec les id, et set permet de supprimer les doublons
            const idActions = [...new Set(transactions.map((t) => t.idAction))];

            // Récupérations des informations complémentaires
            const detailsActions = {};
            for (const id of idActions) {
                const action = await req.Action.findByPk(id);
                const cotation = await finance.quote(action.ticker);
                const devise = cotation.currency;

                // Gestion de la valorisation total du portefeuille
                if (!devisePortefeuille) {
                    devisePortefeuille = devise;
                }
                if (cotation.currency !== devisePortefeuille) {
                    calculerValorisation = false;
                }

                detailsActions[id] = { nom: action.nom, prixActuel: cotation.regularMarketPrice, devise };
            }

            // ajout des données enrichies
            const transactionsEnrichies = transactions.map((t) => ({
                ...t,
                nomAction: detailsActions[t.idAction].nom,
                prixActuel: detailsActions[t.idAction].prixActuel,
                devise: detailsActions[t.idAction].devise,
            }));

            portefeuilles[indexPortefeuille].listeTransactions = transactionsEnrichies;

            // GESTION DU CALCUL DE LA VALORISATION

            let valorisationActuel = 0;
            let valorisationDepart = 0;
            for (const transaction of transactionsEnrichies) {
                const info = detailsActions[transaction.idAction];
                valorisationActuel += transaction.quantite * info.prixActuel;
                valorisationDepart += transaction.quantite * transaction.prix;
            }

            portefeuilles[indexPortefeuille].valorisation = valorisationActuel.toFixed(2);
            portefeuilles[indexPortefeuille].devise = devisePortefeuille;
            portefeuilles[indexPortefeuille].rendementAujourdhui = (((valorisationActuel - valorisationDepart) / valorisationDepart) * 100).toFixed(2);
            if (!calculerValorisation) {
                portefeuilles[indexPortefeuille].valorisation = "Calcul impossible";
            }

            // il faut que je récupére le nom de chaque transaction
            // la valorisation actuel de chaque titre
        }
        return res.json({ etat: true, detail: portefeuilles });
    },
    "controleurRecuperationListePortefeuilleEtTransaction",
    "Erreur lors de la récupération détaillée des portefeuilles et de leur contenu"
);
