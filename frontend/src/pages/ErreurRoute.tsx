import { Link } from "react-router-dom";

export default function ErreurRoute() {
    return (
        <main className="Erreur404">
            <h1>Erreur 404</h1>
            <p>
                La page :
                <a href={window.location.href} id="lienPageIntrouvable">
                    {window.location.href}
                </a>
                est introuvable <span id="spanEmoji">🧐</span>
            </p>
            <Link to="/" className="lien">
                Retour à l'accueil
            </Link>
        </main>
    );
}
