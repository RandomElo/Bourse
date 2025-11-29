import { Loader2, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRequete } from "../fonctions/requete";
import "../styles/composants/RechercheAction.css";

type PropsRechercheAction = {
    action: string | null;
    setAction: React.Dispatch<React.SetStateAction<string | null>>;
};

export default function RechercheAction({ action, setAction }: PropsRechercheAction) {

    const requete = useRequete();

    const debounceTimeout = useRef<number | null>(null);

    const [indexSelectionner, setIndexSelectionner] = useState(-1);
    const [listeActions, setListeActions] = useState<[{ nom: string; ticker: string; place: string; rendementJourPourcentage: number; prix: string }] | []>([]);
    const [recuperationActions, setRecuperationActions] = useState<boolean>(false);
    const [valeurRecherche, setValeurRecherche] = useState<string>("");

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
                    console.log(reponse);
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
                        e.preventDefault();
                        setIndexSelectionner((prev) => Math.max(prev - 1, 0));
                        break;
                    case "ArrowDown":
                        e.preventDefault();
                        setIndexSelectionner((prev) => Math.min(prev + 1, listeActions.length - 1));
                        break;
                    case "Enter":
                        e.preventDefault();
                        if (indexSelectionner !== -1) setAction(listeActions[indexSelectionner].ticker);
                        break;
                    case "ArrowLeft":
                        if (action) {
                            setAction(null);
                        }
                        break;
                    default:
                        break;
                }
            }
        };
        window.addEventListener("keydown", gestionToucheNavigation);
        return () => window.removeEventListener("keydown", gestionToucheNavigation);
    }, [listeActions, indexSelectionner, action, valeurRecherche]);
    return (
        <div id="divRechercheAction">
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
                valeurRecherche !== "" && <p id="pAucuneAction">Aucune valeur trouvée. Essayer de chercher la valeur avec son ticker.</p>
            )}
        </div>
    );
}
