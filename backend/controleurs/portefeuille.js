import gestionErreur from "../middlewares/gestionErreur.js";

const recuperationListePortefeuillesUtilisateur = async (req) => {
    const liste = await req.Portefeuille.findAll({ where: { idUtilisateur: req.idUtilisateur } });
    liste.map((portefeuille) => ({ id: portefeuille.id, nom: portefeuille.nom }));
    return liste;
};

export const creation = gestionErreur(
    async (req, res) => {
        await req.Portefeuille.create({ nom: req.body.nom, idUtilisateur: req.idUtilisateur });

        const liste = await recuperationListePortefeuillesUtilisateur(req);

        return res.json({ etat: true, detail: liste });
    },
    "controleurCreationPortefeuille",
    "Erreur lors de l'enregistrement du portefeuille"
);

export const recupererListe = gestionErreur(
    async (req, res) => {
        const liste = await recuperationListePortefeuillesUtilisateur(req);
        return res.json({ etat: true, detail: liste });
    },
    "controleurRecupererListePortefeuille",
    "Erreur lors de la récupération des portefeuilles"
);
