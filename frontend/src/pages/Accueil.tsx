import { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRequete } from "../fonctions/requete";
import "../styles/Accueil.css";
import { NavLink } from "react-router-dom";
import { Loader2, Search } from "lucide-react";
import PresentationAction from "../composants/PresentationAction";
import ApercuCotation from "../composants/ApercuCotation";

export default function Accueil() {
    const requete = useRequete();
    const { estAuth } = useAuth();
    const debounceTimeout = useRef<number | null>(null);

    const [indexSelectionner, setIndexSelectionner] = useState(-1);
    const [listeActions, setListeActions] = useState<[{ nom: string; ticker: string; place: string; rendementJourPourcentage: number; prix: string }] | []>([]);
    const [action, setAction] = useState<string | null>(null);
    const [recuperationActions, setRecuperationActions] = useState<boolean>(false);
    const [valeurRecherche, setValeurRecherche] = useState<string>("");
    const [afficherModal, setAfficherModal] = useState<boolean>(false);
    const [donneesDetailsPortefeuilles, setDonneesDetailsPortefeuilles] = useState<Array<{
        id: number;
        nom: string;
        valorisation: number | "Calcul impossible";
        devise: string | null;
        gainTotal: string;
        gainAujourdhui: string;
        listeTransactions: Array<{
            id: number;
            type: "achat" | "vente";
            quantite: number;
            date: string;
            prixActuel: number;
            nom: string;
        }>;
    }> | null>(null);
    useEffect(() => {
        document.title = "Accueil - Bourse";
    }, []);
    useEffect(() => {
        const recuperationPortefeuilles = async () => {
            const reponse = await requete({ url: "/portefeuille/recuperation-portefeuilles-details" });
            console.log(reponse);
            setDonneesDetailsPortefeuilles(reponse);
        };
        if (estAuth) {
            recuperationPortefeuilles();
        }
    }, [estAuth]);

    // Permet de détecter l'appui sur des touches

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
                    setRecuperationActions(true);
                    const reponse = await requete({ url: "/bourse/recherche-action/" + value });
                    setListeActions(reponse);
                    setTimeout(() => {
                        setRecuperationActions(false);
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

    useEffect(() => {
        const gestionToucheNavigation = (e: KeyboardEvent) => {
            if (valeurRecherche !== "") {
                switch (e.key) {
                    case "ArrowUp":
                        // e.preventDefault();
                        setIndexSelectionner((prev) => Math.max(prev - 1, 0));
                        break;
                    case "ArrowDown":
                        // e.preventDefault();
                        setIndexSelectionner((prev) => Math.min(prev + 1, listeActions.length - 1));
                        break;
                    case "Enter":
                        e.preventDefault();
                        if (indexSelectionner !== -1) setAction(listeActions[indexSelectionner].ticker);
                        break;
                    case "ArrowLeft":
                        if (action) {
                            if (!afficherModal) {
                                setAction(null);
                            }
                        }
                        break;
                    default:
                        break;
                }
            }
        };
        window.addEventListener("keydown", gestionToucheNavigation);
        return () => window.removeEventListener("keydown", gestionToucheNavigation);
    }, [listeActions, indexSelectionner, action, valeurRecherche, afficherModal]);

    return (
        <main className="Accueil">
            <div id="divConteneurCotations" style={{ width: donneesDetailsPortefeuilles && donneesDetailsPortefeuilles.length != 0 && donneesDetailsPortefeuilles.filter((portefeuille) => portefeuille.listeTransactions.length !== 0).length !== 0 ? `${donneesDetailsPortefeuilles.length * 212}px` : "848px" }}>
                {/* Probleme avec la taille je doit regarder  */}
                {!estAuth || donneesDetailsPortefeuilles?.length == 0 || donneesDetailsPortefeuilles?.filter((portefeuille) => portefeuille.listeTransactions.length !== 0).length == 0 ? (
                    <>
                        <p id="pTitreCotation">Performances des marchés :</p>
                        <div id="divApercuCotations">
                            <ApercuCotation ticker="^FCHI" />
                            <ApercuCotation ticker="^GSPC" />
                            <ApercuCotation ticker="^GDAXI" />
                            <ApercuCotation ticker="^N225" />
                        </div>
                    </>
                ) : (
                    <>
                        <p id="pTitreCotation">Mes portefeuilles :</p>
                        <div id="divApercuCotations">{donneesDetailsPortefeuilles && donneesDetailsPortefeuilles.filter((portefeuille) => portefeuille.listeTransactions.length !== 0).map((portefeuille, index) => <ApercuCotation mode="portefeuille" donneesDefinie={{ nom: portefeuille.nom, valeurActuelle: Number(portefeuille.valorisation), variationPourcentage: Number(portefeuille.gainAujourdhui), devise: portefeuille.devise! }} idPortefeuille={portefeuille.id} key={index} />)}</div>
                    </>
                )}
            </div>
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
                    {estAuth && donneesDetailsPortefeuilles && <div id="divApercuCotationPortefeuille" style={{ width: `${donneesDetailsPortefeuilles.length * 212}px` }}></div>}
                    <h1 id="titre">Auth</h1>

                    <div id="divRechercheActions">
                        <div id="divInput">
                            <input
                                type="text"
                                className="input"
                                placeholder="Rechercher une action"
                                value={valeurRecherche}
                                onChange={(e) => {
                                    setValeurRecherche(e.target.value);
                                    rechercheInput(e);
                                }}
                            />
                            <div id="divLoader">{recuperationActions ? <Loader2 className="chargement" /> : <Search />}</div>
                        </div>

                        {!action && listeActions.length > 0 ? (
                            <table id="tableauPresentationAction">
                                <tbody>
                                    {listeActions.map((action, index) => (
                                        <tr
                                            key={index}
                                            className={`${index === indexSelectionner ? "ligneSelectionnee" : ""}`}
                                            onClick={() => {
                                                setAction(listeActions[index].ticker);
                                            }}
                                        >
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
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            valeurRecherche !== "" && !recuperationActions && !action && <p id="pAucuneAction">Aucune valeur trouvée. Essayer de chercher la valeur avec son ticker.</p>
                        )}

                        {action && <PresentationAction idComposant={action} setAction={setAction} afficherModal={afficherModal} setAfficherModal={setAfficherModal} />}
                    </div>
                </>
            )}
        </main>
    );
}
