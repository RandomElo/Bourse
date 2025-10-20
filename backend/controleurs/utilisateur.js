import bcrypt from "bcrypt";
import gestionErreur from "../middlewares/gestionErreur.js";

export const verificationAuthentification = gestionErreur(
    (req, res) => {
        return res.json({ etat: true, detail: !!req.idUtilisateur });
    },
    "controleurVerificationAuthentification",
    "Erreur lors de la vérification de l'authentification"
);

export const inscription = gestionErreur(
    async (req, res) => {
        // Verification des valeurs reçues
        const regexMail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const regexMdp = /^.{8,}$/;
        if (!regexMail.test(req.body.mail) || !regexMdp.test(req.body.mdp)) {
            return res.json({ etat: true, detail: { compte: false, detail: "Les informations d'authentification ne respectent pas les règles définies." } });
        }

        const utilisateurEmail = await req.Utilisateur.findOne({ where: { mail: req.body.mail } });

        if (utilisateurEmail) {
            return res.json({ etat: true, detail: { compte: false, detail: "L'adresse mail est déjà utilisée" } });
        }

        const motDePasseHash = await bcrypt.hash(req.body.mdp, 12);

        const utilisateur = await req.Utilisateur.create({
            mail: req.body.mail,
            motDePasse: motDePasseHash,
        });
        return await req.Utilisateur.generationToken(req, res, utilisateur);
    },
    "controleurInscription",
    "Erreur survenue lors de l'inscription"
);
export const connexion = gestionErreur(
    async (req, res) => {
        const utilisateur = await req.Utilisateur.findOne({ where: { mail: req.body.mail } });
        if (!utilisateur) {
            return res.json({ etat: true, detail: { compte: false, detail: "Mail ou mot de passe incorrect" } });
        }
        if (await bcrypt.compare(req.body.mdp, utilisateur.motDePasse)) {
            return await req.Utilisateur.generationToken(req, res, utilisateur);
        } else {
            return res.json({ etat: true, detail: { compte: false, detail: "Mail ou mot de passe incorrect" } });
        }
    },
    "controleurConnexion",
    "Erreur survenue lors de la connexion"
);
