export const autorisationAcces = async (req, res, next) => {
    if (!req.idUtilisateur && process.env.MODE !== "developpement") {
        return res.status(403).json({ etat: false, detail: "Vous n'êtes pas connecté" });
    }
    next();
};
