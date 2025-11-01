import { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRequete } from "../fonctions/requete";

import "../styles/Accueil.css";
import { NavLink } from "react-router-dom";
import { CornerDownLeft } from "lucide-react";
import PresentationAction from "../composants/PresentationAction";

export default function Accueil() {
    const requete = useRequete();
    const { estAuth } = useAuth();
    const debounceTimeout = useRef<number | null>(null);
    const refInputRecherche = useRef<HTMLInputElement | null>(null);

    const [indexSelectionner, setIndexSelectionner] = useState(-1);
    const [listeActions, setListeActions] = useState<[{ nom: string; ticker: string; place: string; rendementJourPourcentage: number; prix: string }] | []>([]);
    const [action, setAction] = useState<string | null>(null);

    useEffect(() => {
        document.title = "Accueil - Bourse";
    }, []);

    // Permet de détecter l'appui sur des touches
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowDown") {
                setIndexSelectionner((prev) => Math.min(prev + 1, listeActions.length - 1));
            } else if (e.key === "ArrowUp") {
                setIndexSelectionner((prev) => Math.max(prev - 1, 0));
            } else if (e.key === "Enter") {
                if (listeActions[indexSelectionner]?.ticker) {
                    setAction(listeActions[indexSelectionner].ticker);
                    setListeActions([]);
                }
            } else if (e.key == "Escape") {
                refInputRecherche.current?.focus();
                setListeActions([]);
                setAction(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [listeActions, indexSelectionner, action]);

    const rechercheInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAction(null);
        setIndexSelectionner(-1);
        const value = e.target.value;

        // On annule le debounce précédent
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

        // On lance une nouvelle recherche après 500ms d'inactivité
        debounceTimeout.current = setTimeout(async () => {
            if (value !== "") {
                try {
                    const reponse = await requete({ url: "/bourse/recherche-action/" + value });
                    setListeActions(reponse);
                } catch (err) {
                    console.error("Erreur recherche :", err);
                    setListeActions([]);
                }
            } else {
                setListeActions([]);
            }
        }, 500); // délai de 500ms
    };

    return (
        <main className="Accueil">
            {!estAuth ? (
                <>
                    <h1 id="titre">Pour pouvoir profiter de ce service, merci de vous connecter</h1>
                    <div style={{ textAlign: "center", marginTop: "20px" }}>
                        <NavLink to="/connexion" id="boutonSeConnecter" className="bouton">
                            Se connecter
                        </NavLink>
                    </div>
                </>
            ) : (
                <>
                    <h1 id="titre">Auth</h1>

                    <div id="divRechercheActions">
                        <input type="text" className="input" placeholder="Rechercher une action" onChange={rechercheInput} ref={refInputRecherche} />
                        {listeActions.length !== 0 && (
                            <table id="tableauPresentationAction">
                                <tbody>
                                    {listeActions.map((action, index) => (
                                        <tr key={index} className={`${index % 2 === 0 ? "ligneClaire" : "ligneSombre"} ${index === indexSelectionner ? "ligneSelectionnee" : ""}`} onClick={() => setIndexSelectionner(index)}>
                                            <td className="tdPresentation">
                                                <p className="nom">{action.nom}</p>
                                                <p className="detail">
                                                    {action.ticker}
                                                    {action.place && " - ( " + action.place + " )"}
                                                </p>
                                            </td>
                                            <td className="tdChiffres">
                                                <p className="prix">{action.prix}</p>
                                                <p className={`rendement ${action.rendementJourPourcentage > 0 ? "positif" : "negatif"}`}>{`${action.rendementJourPourcentage > 0 ? "+ " : "- "}${Math.abs(action.rendementJourPourcentage)} %`}</p>
                                            </td>

                                            <td className="tdIcone">{index === indexSelectionner && <CornerDownLeft />}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        {action && <PresentationAction ticker={action} />}
                    </div>
                </>
            )}
        </main>
    );
}
