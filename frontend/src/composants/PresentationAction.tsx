import { useEffect, useState } from "react";
import { useRequete } from "../fonctions/requete";
import "../styles/PresentationAction.css";
import GraphiqueBourse from "./GraphiqueBourse";
export default function ConteneurGraphiqueBourse({ ticker }: { ticker: string }) {
    const tableauDuree = ["1j", "5j", "1m", "6m", "1a", "5a", "max"] as const;
    type DureeGraphique = (typeof tableauDuree)[number];
    interface DonneesGraphique {
        dates: Array<Date>;
        prixFermeture: Array<number>;
        nom: string;
        devise: string;
        ouverture?: string;
        fermeture?: string;
    }
    const [message, setMessage] = useState<string | null>(null);
    const [nomvaleur, setNomvaleur] = useState<string | null>(null);
    const [dureeGraphique, setDureeGraphique] = useState<DureeGraphique>("1j");
    const [donnees, setDonnees] = useState<DonneesGraphique>();
    const requete = useRequete();

    useEffect(() => {
        const recuperationDonnees = async () => {
            const reponse = await requete({ url: `/bourse/graphique?ticker=${ticker}&duree=${dureeGraphique}` });
            setNomvaleur(reponse.nom);
            if (reponse.message) {
                setMessage(reponse.message);
            } else {
                setDonnees(reponse);
            }
        };
        recuperationDonnees();
    }, [ticker, dureeGraphique]); // 👈 se lance au premier rendu et à chaque changement

    return (
        <div className="PresentationAction">
            <div id="divHeader">
                <h2 id="h2NomValeur">{nomvaleur}</h2>
                <a className="bouton">Enregistrer l'action</a>
            </div>
            <div id="divChoixEtenduGraphique">
                {tableauDuree.map((duree, index) => (
                    <a key={index} className={`aDuree ${dureeGraphique == duree ? "selectionnee" : ""}`} onClick={() => setDureeGraphique(duree)}>
                        {duree}
                    </a>
                ))}
            </div>
            {message ? <p id="pMessage">{message}</p> : <div id="divGraphique">{donnees ? <GraphiqueBourse key={dureeGraphique} donnees={donnees} duree={dureeGraphique} /> : ""}</div>}
        </div>
    );
}
