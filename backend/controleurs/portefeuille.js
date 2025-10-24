import gestionErreur from "../middlewares/gestionErreur.js";

export const creation = gestionErreur(async (req, res) => {}, "controleurCreationPortefeuille", "Erreur lors de l'enregistrement du portefeuille");

export const recupererListe = gestionErreur(
    async (req, res) => {
        const liste = await req.Portefeuille.findAll({ where: { idUtilisateur: req.idUtilisateur } });
        liste.map((portefeuille) => ({ id: portefeuille.id, nom: portefeuille.nom }));

        return res.json({ etat: true, detail: liste });
    },
    "controleurRecupererListePortefeuille",
    "Erreur lors de la récupération des portefeuilles"
);
