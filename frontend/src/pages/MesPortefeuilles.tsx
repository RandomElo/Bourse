import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../styles/MesPortefeuilles.css";
import { useEffect, useState } from "react";
import { useRequete } from "../fonctions/requete";
import { ChevronDown, ChevronUp } from "lucide-react";
import RendementAction from "../composants/RendementAction";
export default function MesPortefeuilles() {
    const navigation = useNavigate();
    const { estAuth, chargement } = useAuth();
    const requete = useRequete();
    const [idPortefeuilleSelectionne, setIdPortefeuilleSelectionne] = useState<number | null>(null);
    const [donnees, setDonnees] = useState<Array<{
        id: number;
        nom: string;
        valorisation: number | "Calcul impossible";
        devise: string | null;
        rendementAujourdhui: string;
        listeTransactions: Array<{
            id: number;
            type: "achat" | "vente";
            quantite: number;
            date: string;
            prixActuel: number;
            nomAction: string;
        }>;
    }> | null>(null);

    // Veification de l'auhtentification
    useEffect(() => {
        if (!estAuth) {
            navigation("/connexion");
        }
    }, [estAuth, navigation]);

    // Récupérationd des portefeuilles
    useEffect(() => {
        const recuperationDonnees = async () => {
            const reponse = await requete({ url: "/portefeuille/recuperer-portefeuille-transaction" });
            console.log(reponse);
            setDonnees(reponse);
        };
        recuperationDonnees();
    }, []);

    useEffect(() => {}, [donnees]);

    if (chargement) {
        return null;
    } else if (donnees) {
        return (
            <main className="MesPortefeuilles">
                <h1 id="titre">Mes portefeuilles</h1>
                <div id="divPresentationPortefeuilles">
                    <table>
                        <thead>
                            <tr>
                                <th>Nom</th>
                                <th>Rendement actuel</th>
                                <th>Valorisation</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {donnees.map((portefeuille) => (
                                <>
                                    <tr key={portefeuille.id}>
                                        <td>{portefeuille.nom}</td>
                                        <td>
                                            <RendementAction valeur={Number(portefeuille.rendementAujourdhui)} />
                                        </td>
                                        <td>{portefeuille.valorisation !== "Calcul impossible" ? `${portefeuille.valorisation} ${portefeuille.devise}` : portefeuille.valorisation}</td>
                                        <td>{idPortefeuilleSelectionne === portefeuille.id ? <ChevronUp className="chevron" onClick={() => setIdPortefeuilleSelectionne(null)} /> : <ChevronDown className="chevron" onClick={() => setIdPortefeuilleSelectionne(portefeuille.id)} />}</td>
                                    </tr>
                                    {idPortefeuilleSelectionne === portefeuille.id &&
                                        portefeuille.listeTransactions.map((action, index) => (
                                            <tr key={index}>
                                                <td>{action.nomAction}</td>
                                                <td>16</td>
                                                <td>16</td>
                                                <td>16</td>
                                            </tr>
                                        ))}
                                </>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        );
    }
}
