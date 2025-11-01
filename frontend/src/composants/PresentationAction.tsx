import { useEffect, useState } from "react";
import { useRequete } from "../fonctions/requete";

import "../styles/composants/PresentationAction.css";
import Chargement from "./Chargement";
import Modal from "./Modal";
import ChampDonneesForm from "./ChampDonneesForm";
import RendementAction from "./RendementAction";
import Graphique from "./Graphique";
import DureeGraphique from "./DureeGraphique";
export default function PresentationAction({ ticker }: { ticker: string }) {
    const [afficherModal, setAfficherModal] = useState<boolean>(false);
    const [typeDonneeModal, setTypeDonneeModal] = useState<string>();
    type DureeGraphique = "1 j" | "5 j" | "1 m" | "6 m" | "1 a" | "5 a" | "MAX";
    interface DonneesGraphique {
        dates: Array<Date>;
        prixFermeture: Array<number>;
        nom: string;
        devise: string;
        dernierPrix?: number;
        rendement?: number;
        premierTrade?: string;
    }

    const [message, setMessage] = useState<string | null>(null);
    const [dureeGraphique, setDureeGraphique] = useState<DureeGraphique>("1 j");
    const [donnees, setDonnees] = useState<DonneesGraphique>();
    const [chargement, setChargement] = useState<boolean>(true);
    const [listePortefeuille, setListePortefeuille] = useState<Array<{ id: number; nom: string }> | null>();
    const [erreurFormModal, setErreurFormModal] = useState<string | null>(null);
    const [donneeeFormCreationPortefeuille, setDonneeFormCreationPortefeuille] = useState<{ prix?: string; nombre?: string; date?: string }>({});
    const requete = useRequete();

    useEffect(() => {
        // Récupération des données pour le graphique
        const recuperationDonnees = async () => {
            setChargement(true);

            const reponse = await requete({ url: `/bourse/graphique?ticker=${ticker}&duree=${dureeGraphique}` });

            setTimeout(() => {
                setChargement(false);
            }, 200); // ⬅ délai artificiel en millisecondes

            if (reponse.message) {
                setMessage(reponse.message);
                setDonnees(reponse.donnees);
            } else {
                setDonnees(reponse);
            }
        };

        // Récupération des informations pour le portefeuille
        const recuperationPortefeuille = async () => {
            const reponse = await requete({ url: "/portefeuille/liste" });
            setListePortefeuille(reponse);
        };

        recuperationDonnees();
        recuperationPortefeuille();
    }, [ticker, dureeGraphique]); // 👈 se lance au premier rendu et à chaque changement

    const gestionCliqueCreePortefeuille = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        const base = e.currentTarget.parentNode?.parentNode;
        const nbrAction = base?.querySelector<HTMLInputElement>("#inputNbrAction")?.value;
        const prixAction = base?.querySelector<HTMLInputElement>("#inputPrixAction")?.value;
        const dateAchat = base?.querySelector<HTMLInputElement>("#inputDateAchat")?.value;

        setDonneeFormCreationPortefeuille({ nombre: nbrAction, prix: prixAction, date: dateAchat });
        setTypeDonneeModal("creationPortefeuille");
    };

    return chargement ? (
        <Chargement />
    ) : (
        <>
            <div className="PresentationAction">
                <div id="divHeader">
                    <div id="divIdentifiantAction">
                        <p id="pTicker">{ticker}</p>

                        <h2 id="h2NomValeur">{donnees?.nom}</h2>
                    </div>
                    <a
                        className="bouton"
                        onClick={() => {
                            // Je doit faire une requete pour connaitre la liste des portefeuilles
                            setDonneeFormCreationPortefeuille({});
                            setErreurFormModal(null);
                            setTypeDonneeModal("achatAction");
                            setAfficherModal(true);
                        }}
                    >
                        Ajouter un achat
                    </a>
                </div>
                <div style={{ height: "2px", backgroundColor: "#f2f2f2" }}></div>
                {donnees?.rendement && donnees.dernierPrix && (
                    <div id="divPrix">
                        <p id="pPrixAction">
                            {donnees.dernierPrix} {donnees.devise}
                        </p>
                        <RendementAction valeur={donnees.rendement} mode={"defini"} id="pRendementAction" />
                    </div>
                )}
                <DureeGraphique set={setDureeGraphique} dureeGraphique={dureeGraphique} />

                {message ? <p id="pMessage">{message}</p> : <div id="divGraphique">{donnees ? <Graphique donnees={donnees} duree={dureeGraphique} rendement={Number(donnees.rendement)} /> : ""}</div>}
            </div>
            {afficherModal && (
                <Modal estOuvert={afficherModal} fermeture={() => setAfficherModal(false)}>
                    {typeDonneeModal == "achatAction" && (
                        <div id="divAjouterAchat">
                            <h2>Ajouter un achat</h2>
                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    const nbrAction = e.currentTarget.querySelector<HTMLInputElement>("#inputNbrAction")?.value;
                                    const prixAction = e.currentTarget.querySelector<HTMLInputElement>("#inputPrixAction")?.value;
                                    const selectPortefeuille = e.currentTarget.querySelector<HTMLInputElement>("#selectNomPortefeuille")?.value;
                                    const dateAchat = e.currentTarget.querySelector<HTMLInputElement>("#inputDateAchat")?.value;

                                    const corps = { ticker, idPortefeuille: selectPortefeuille, nombre: nbrAction, prix: prixAction, date: dateAchat };

                                    const reponse = await requete({ url: "/portefeuille/enregistrer-achat", methode: "POST", corps });
                                    if (reponse.erreur) {
                                        setErreurFormModal(reponse.erreur);
                                    } else {
                                        setAfficherModal(false);
                                    }
                                }}
                            >
                                <div id="divChamps">
                                    <ChampDonneesForm label="Nombre d'action :" typeInput="number" id="inputNbrAction" value={donneeeFormCreationPortefeuille?.nombre} />
                                    <ChampDonneesForm label="Prix :" typeInput="number" id="inputPrixAction" value={donneeeFormCreationPortefeuille?.prix} pas={0.01} />
                                    <ChampDonneesForm label="Date d'achat :" typeInput="date" id="inputDateAchat" min={donnees?.premierTrade} value={donneeeFormCreationPortefeuille?.date} />
                                    {listePortefeuille && listePortefeuille.length > 0 ? (
                                        <div id="divSelectionPortefeuille">
                                            <select id="selectNomPortefeuille" defaultValue="" required>
                                                <option value="" disabled>
                                                    -- Séléctionner un portefeuille --
                                                </option>
                                                {listePortefeuille?.map((portefeuille, index) => (
                                                    <option key={index} value={portefeuille.id}>
                                                        {portefeuille.nom}
                                                    </option>
                                                ))}
                                                alstom
                                            </select>
                                            <p>ou</p>
                                            <a onClick={(e) => gestionCliqueCreePortefeuille(e)}>En crée un</a>
                                        </div>
                                    ) : (
                                        <p id="pAucunPortefeuille">
                                            Vous n'avez pas de portefeuille - <a onClick={(e) => gestionCliqueCreePortefeuille(e)}>En crée un</a>
                                        </p>
                                    )}
                                </div>
                                {erreurFormModal && <p id="pErreurForm">{erreurFormModal}</p>}
                                <button type="submit" className="bouton">
                                    Enregistrer
                                </button>
                            </form>
                            <p id="pAjouterVente">Ajouter une vente</p>
                        </div>
                    )}

                    {typeDonneeModal == "creationPortefeuille" && (
                        <div id="divCreationPortefeuille">
                            <h2>Création de portefeuille</h2>
                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    const valeur = document.querySelector<HTMLInputElement>("#champNom")!.value;
                                    const reponse = await requete({ url: "/portefeuille/creation", methode: "POST", corps: { nom: valeur } });

                                    setListePortefeuille(reponse);
                                    setTypeDonneeModal("achatAction");
                                }}
                            >
                                <ChampDonneesForm
                                    id="champNom"
                                    label="Nom : "
                                    onBlur={(e) => {
                                        if (e.target.value.length > 30) {
                                            setErreurFormModal("Taille max : 30 caractères.");
                                        } else {
                                            setErreurFormModal(null);
                                        }
                                    }}
                                />
                                {erreurFormModal && <p id="pErreur">{erreurFormModal}</p>}
                                <button type="submit" id="boutonCreePortefeuille" className="bouton" disabled={!!erreurFormModal}>
                                    Crée
                                </button>
                            </form>
                        </div>
                    )}
                </Modal>
            )}
        </>
    );
}
