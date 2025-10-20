import { DataTypes } from "sequelize";
import jwt from "jsonwebtoken";

export default function (bdd) {
    const Utilisateur = bdd.define(
        "Utilisateur",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },

            mail: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            motDePasse: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
        },
        {
            tableName: "Utilisateurs",
        }
    );
    Utilisateur.generationToken = async function (req, res, utilisateur) {
        try {
            const tokenJWT = jwt.sign({ id: utilisateur.id }, process.env.CHAINE_JWT_COOKIE, {
                expiresIn: "3d",
            });
            return res
                .cookie("utilisateur", tokenJWT, {
                    maxAge: 72 * 60 * 60 * 24 * 1000,
                    httpOnly: true,
                    sameSite: "Strict",
                    secure: process.env.MODE == "production",
                })
                .json({ etat: true, detail: { compte: true } });
        } catch (erreur) {
            await req.Erreur.create({
                emplacement: "generationCookie",
                detail: JSON.stringify({ nom: erreur.name, message: erreur.message, stack: erreur.stack }),
            });
            return res.json({ etat: false, detail: "Erreur lors de la génération du cookie d'authentification" });
        }
    };
    return Utilisateur;
}
