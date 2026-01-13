import { useRef, useState, type ReactNode } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useEffect } from "react";
import { useErreur } from "../../contexts/ErreurContext";
import useFavicon from "../../fonctions/gestionFavicon";
import ToggleTheme from "../../composants/ToogleTheme";
import { Loader2, Search } from "lucide-react";
import { useRequete } from "../../fonctions/requete";
export default function Generale({ children }: { children?: ReactNode }) {
    const { erreur, setErreur } = useErreur();
    const { estAuth, chargement } = useAuth();
    const requete = useRequete();

    const location = useLocation();
    const navigation = useNavigate();
    const debounceTimeout = useRef<number | null>(null);

    const [chargementActionRechercheEnCours, setChargementActionRequeteEnCours] = useState<boolean>(false);
    const [valeurRechercheAction, setValeurRechercheAction] = useState<string>("");
    const [indexSelectionner, setIndexSelectionner] = useState(-1);
    const [listeActions, setListeActions] = useState<[{ nom: string; ticker: string; place: string; rendementJourPourcentage: number; prix: string }] | []>([]);

    const rechercheInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        // setAction(null);
        setIndexSelectionner(-1);
        const value = e.target.value;

        // On annule le debounce précédent
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

        // On lance une nouvelle recherche après 500ms d'inactivité
        debounceTimeout.current = setTimeout(async () => {
            if (value !== "") {
                try {
                    setChargementActionRequeteEnCours(true);
                    const reponse = await requete({ url: "/bourse/recherche-action/" + value });
                    setListeActions(reponse);
                    setTimeout(() => {
                        setChargementActionRequeteEnCours(false);
                    }, 300);
                } catch (err) {
                    console.error("Erreur recherche :", err);
                    setListeActions([]);
                }
            } else {
                setListeActions([]);
            }
        }, 500); // délai de 500ms
    };

    useFavicon();

    useEffect(() => {
        if (erreur) {
            setErreur(null);
        }
    }, [location]);

    useEffect(() => {
        const gestionToucheNavigation = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key.toLowerCase() === "k") {
                e.preventDefault();
                const input = document.querySelector<HTMLInputElement>("#inputRechercheAction");
                input?.focus();
                return;
            }

            if (valeurRechercheAction !== "" && listeActions.length > 0) {
                switch (e.key) {
                    case "ArrowUp":
                        e.preventDefault();
                        setIndexSelectionner((prev) => Math.max(prev - 1, 0));
                        break;
                    case "ArrowDown":
                        e.preventDefault();
                        setIndexSelectionner((prev) => Math.min(prev + 1, listeActions.length - 1));
                        break;
                    case "Enter":
                        e.preventDefault();
                        navigation("/action/" + listeActions[indexSelectionner].ticker.replace(".", "_"));
                        break;
                    case "Escape":
                        break;
                    default:
                        break;
                }
            }
        };
        window.addEventListener("keydown", gestionToucheNavigation);
        return () => window.removeEventListener("keydown", gestionToucheNavigation);
    }, [listeActions, indexSelectionner, valeurRechercheAction]);

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
                                    <li>
                                        <div id="divInputRechercheActions">
                                            <input
                                                type="text"
                                                id="inputRechercheAction"
                                                className="input"
                                                placeholder="Rechercher action (CTRL + K)"
                                                value={valeurRechercheAction}
                                                onChange={(e) => {
                                                    setValeurRechercheAction(e.target.value);
                                                    rechercheInput(e);
                                                }}
                                            />
                                            <div id="divLoader">{chargementActionRechercheEnCours ? <Loader2 className="icone chargement" /> : <Search className="icone" />}</div>

                                            {listeActions.length > 0 && (
                                                <div id="divResultat">
                                                    {listeActions.map((a, index) => (
                                                        <div key={index} className={`resultat ${index == indexSelectionner ? "indexSelectionner" : ""}`}>
                                                            <div className="divPremierColonne">
                                                                <p className="nom">{a.nom}</p>
                                                                <p className="ticker">
                                                                    {a.ticker} - ({a.place})
                                                                </p>
                                                            </div>
                                                            <p className="prix">{a.prix}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
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

                            {/* <li>
                                <ToggleTheme />
                            </li> */}
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
