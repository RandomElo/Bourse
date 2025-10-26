import gestionErreur from "../middlewares/gestionErreur.js";

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

export const recupererListePortefeuilleEtTransaction = gestionErreur(async (req, res) => {
    let portefeuilles = await req.Portefeuille.findAll({ where: { idUtilisateur: req.idUtilisateur }, raw: true, attributes: { exclude: ["idUtilisateur"] } });
    for (const indexPortefeuille in portefeuilles) {
        console.log("ici");
        const portefeuille = portefeuilles[indexPortefeuille];
        const transactions = await req.Transaction.findAll({ where: { idPortefeuille: portefeuille.id }, attributes: { exclude: ["idPortefeuille"] } });
        portefeuilles[indexPortefeuille].listeTransactions = transactions;
        console.log(portefeuilles[indexPortefeuille].listeTransactions);
    }
    return res.json({ etat: true, detail: portefeuilles });
});
