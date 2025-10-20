import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRequete } from "../fonctions/requete";

import "../styles/Accueil.css";
import { NavLink } from "react-router-dom";
import { CornerDownLeft } from "lucide-react";

export default function Accueil() {
    const requete = useRequete();
    const { estAuth } = useAuth();
    const [indexSelectionner, setIndexSelectionner] = useState(-1);
    const [listeActions, setListeActions] = useState<[{ nom: string; ticker: string }] | []>([]);
    const [action, setAction] = useState<string | null>(null);

    useEffect(() => {
        document.title = "Accueil - Bourse";
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowDown") {
                setIndexSelectionner((prev) => Math.min(prev + 1, listeActions.length - 1));
            } else if (e.key === "ArrowUp") {
                setIndexSelectionner((prev) => Math.max(prev - 1, 0));
            } else if (e.key === "Enter") {
                setAction(listeActions[indexSelectionner].ticker);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [listeActions, indexSelectionner]);

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
                        <input
                            type="text"
                            className="input"
                            placeholder="Rechercher une action"
                            onInput={async (e) => {
                                const element = e.target as HTMLInputElement;
                                if (element.value !== "") {
                                    const reponse = await requete({ url: "/bourse/recherche-action/" + element.value });
                                    setListeActions(reponse);
                                } else {
                                    setListeActions([]);
                                }
                            }}
                        />
                        {listeActions.length !== 0 && (
                            <div id="divPresentationAction">
                                {listeActions.map((action, index) => (
                                    <div id="divAction" key={index} className={`${index % 2 === 0 ? "ligneClaire" : "ligneSombre"} ${index === indexSelectionner ? "ligneSelectionnee" : ""}`}>
                                        <div>
                                            <p className="pNom">{action.nom}</p>
                                            <p className="pTicker">{action.ticker}</p>
                                        </div>
                                        {index === indexSelectionner && <CornerDownLeft />}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {action && <div id="divPresentationAction">{listeActions[indexSelectionner].nom}</div>}
                </>
            )}
        </main>
    );
}
