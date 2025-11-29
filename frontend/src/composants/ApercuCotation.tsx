import { useEffect, useState } from "react";
import { useRequete } from "../fonctions/requete";
import "../styles/composants/ApercuCotation.css";
import Chargement from "./Chargement";
import { useNavigate } from "react-router-dom";
type PropsApercuCotation = {
    mode?: "indice" | "portefeuille";
    ticker?: string;
    donneesDefinie?: {
        nom: string;
        valeurActuelle: number;
        variationPourcentage: number;
        devise: string;
    };
    idPortefeuille?: number;
};
export default function ApercuCotation({ mode = "indice", ticker, donneesDefinie, idPortefeuille }: PropsApercuCotation) {
    const requete = useRequete();
    const navigation = useNavigate();
    const [donnees, setDonnees] = useState<{
        nom: string;
        valeurActuelle: number;
        variationPourcentage: number;
        variationMonetaire: number;
        devise: string;
    } | null>(null);

    useEffect(() => {
        const recuperationDonnees = async () => {
            const reponse = await requete({ url: `/bourse/cotation?ticker=${ticker}` });
            setDonnees(reponse);
        };
        if (mode == "indice") {
            recuperationDonnees();
        } else if (mode == "portefeuille" && donneesDefinie) {
            const { nom, valeurActuelle, variationPourcentage, devise } = donneesDefinie;

            const valeurPrecedente = variationPourcentage !== 0 ? valeurActuelle - (valeurActuelle * variationPourcentage) / 100 : valeurActuelle;

            const variationMonetaire = valeurActuelle - valeurPrecedente;

            setDonnees({
                nom,
                valeurActuelle,
                variationPourcentage,
                variationMonetaire,
                devise,
            });
        }
    }, []);
    const miseEnFormeValeur = (valeur: number, id: string, additif?: string) => {
        return (
            <p id={id} className={valeur > 0 ? "positif" : "negatif"}>
                {valeur > 0 ? "+" : "-"} {Math.abs(valeur).toFixed(2)}
                {additif}
            </p>
        );
    };
    return (
        <div
            className="ApercuCotation"
            onClick={() => {
                if (mode == "portefeuille") {
                    navigation("/portefeuille/" + idPortefeuille);
                }
            }}
        >
            {!donnees ? (
                <Chargement taille={25} />
            ) : (
                <div id="divDonnees">
                    <div id="divPremiereLigne">
                        <p id="pNom">{donnees.nom}</p>
                        {miseEnFormeValeur(donnees.variationPourcentage, "pVariationPourcentage", " %")}
                    </div>
                    <div id="divSecondeLigne">
                        <p id="pValeur">{donnees.valeurActuelle + " " + donnees.devise}</p>
                        {miseEnFormeValeur(donnees.variationMonetaire, "pVariationMonetaire")}
                    </div>
                </div>
            )}
        </div>
    );
}
