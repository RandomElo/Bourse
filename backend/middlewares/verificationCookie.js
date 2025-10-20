import jwt from "jsonwebtoken";

export const verificationCookie = (req, res, next) => {
    if (req.cookies.utilisateur != undefined) {
        jwt.verify(req.cookies.utilisateur, process.env.CHAINE_JWT_COOKIE, async (error, decoder) => {
            if (error) {
                res.clearCookie("utilisateur");
                return res.json({ etat: true, detail: "accueil" });
            } else {
                const utilisateur = await req.Utilisateur.findByPk(decoder.id);
                if (utilisateur) {
                    req.idUtilisateur = decoder.id;
                    next();
                } else {
                    res.clearCookie("utilisateur");
                    return res.json({ etat: true, detail: "accueil" });
                }
            }
        });
    } else {
        next();
    }
};
