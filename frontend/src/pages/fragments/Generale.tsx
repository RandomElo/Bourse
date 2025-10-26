import { type ReactNode } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useEffect } from "react";
import { useErreur } from "../../contexts/ErreurContext";
import useFavicon from "../../fonctions/gestionFavicon";
import ToggleTheme from "../../composants/ToogleTheme";
export default function Generale({ children }: { children?: ReactNode }) {
    const { erreur, setErreur } = useErreur();
    const { estAuth, chargement } = useAuth();
    const location = useLocation();

    useFavicon();

    useEffect(() => {
        if (erreur) {
            setErreur(null);
        }
    }, [location]);

    if (chargement) {
        return null;
    }

    return (
        <>
            <header>
                <nav className="navbar">
                    <NavLink className="logo" to="/">
                        Bourse
                    </NavLink>
                    <div className="navLinks">
                        <ul>
                            <li>
                                <NavLink to="/">Accueil</NavLink>
                            </li>
                            {estAuth ? (
                                <>
                                    <li>
                                        <NavLink to="/mes-portefeuilles">Mes portefeuilles</NavLink>
                                    </li>
                                </>
                            ) : (
                                <>
                                    <li>
                                        <NavLink to="/inscription">Inscription</NavLink>
                                    </li>
                                    <li>
                                        <NavLink to="/connexion">Connexion</NavLink>
                                    </li>
                                </>
                            )}
                            <li>
                                <ToggleTheme />
                            </li>
                        </ul>
                    </div>
                </nav>
            </header>

            {erreur ? (
                <div className="Erreur">
                    <h1>🚨 Une erreur est survenue 🚨</h1>
                    <p>
                        <span className="gras souligner">Détail erreur :</span> {erreur?.message || "Une erreur inconnue est survenue."}
                    </p>
                    <button onClick={() => window.location.reload()} className="lien">
                        Recharger
                    </button>
                </div>
            ) : (
                children || <Outlet />
            )}
        </>
    );
}
