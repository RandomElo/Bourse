import { Op } from "sequelize";
import gestionErreur from "../middlewares/gestionErreur.js";

export const rechercheAction = gestionErreur(
    async (req, res) => {
        // Vérification de la bdd
        const resultatsBdd = await req.Action.findAll({ where: { nom: { [Op.like]: `%${req.params.valeur}%` } }, order: [["nom", "ASC"]], limit: 5 });
        if (resultatsBdd.length == 5) {
            return res.json({ etat: true, detail: resultatsBdd.map((action) => ({ nom: action.nom, ticker: action.ticker })) });
        } else {
            console.log("une requete part à la chausse");
            // Récupération par API
            const requete = await fetch(`https://finnhub.io/api/v1/search?q=${req.params.valeur}&token=${process.env.API_KEY_FINNHUB}`);
            if (requete.ok) {
                const reponse = await requete.json();
                res.json({ etat: true, detail: reponse });
                (async () => {
                    for (const action of reponse.result) {
                        await req.Action.upsert({
                            nom: action.description,
                            ticker: action.symbol,
                        });
                    }
                })();
            } else {
                console.log("⚠️Erreur lors de l'envoi de la requete");
                throw new Error("Erreur lors de l'envoi de la requête");
            }
        }
    },
    "controleurRechercheValeur",
    "Erreur lors de la recherche de l'action"
);

export const informationsAction = gestionErreur(
    async (req, res) => {
        const requete = await fetch(`https://yfapi.net/v8/finance/chart/${req.params.ticker}?comparisons=${encodeURIComponent(comparisons)}&range=${range}&region=US&interval=${interval}&lang=fr&events=div,split`, {
            headers: {
                accept: "application/json",
                "X-API-KEY": process.env.API_KEY_TH_FINANCE,
            },
        });
        if (requete.ok) {
            const reponse = await requete.json();
        } else {
            throw new Error("Erreur lors de l'envoi de la requete pour les infos d'une action");
        }
    },
    "controleurInformationsAction",
    "Erreur lors de la récupération d'information sur l'action"
);
