import { useRouteError } from "react-router-dom";
import Generale from "./fragments/Generale";

export default function ErreurElement() {
    const erreur = useRouteError() as Error;

    return (
        <Generale>
            <div className="Erreur">
                <h1>🚨 Une erreur est survenue 🚨</h1>
                <p>
                    <span className="gras souligner">Détail erreur :</span> {erreur?.message || "Une erreur inconnue est survenue."}
                </p>
                <button onClick={() => window.location.reload()} className="lien">
                    Recharger
                </button>
            </div>
        </Generale>
    );
}
