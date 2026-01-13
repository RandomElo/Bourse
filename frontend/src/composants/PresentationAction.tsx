import { useEffect, useMemo, useState } from "react";
import { useRequete } from "../fonctions/requete";
import "../styles/composants/PresentationAction.css";
import Chargement from "./Chargement";
import Modal from "./Modal";
import ChampDonneesForm from "./ChampDonneesForm";
import RendementAction from "./RendementAction";
import Graphique from "./Graphique";
import DureeGraphique from "./DureeGraphique";
import { ArrowLeft } from "lucide-react";
import AjouterAchat from "./AjouterAchat";
import CreationPortefeuille from "./CreationPortefeuille";

// Définition du typage
// Type pour les transactions défini dans actions
interface TransactionsAction {
    id: number;
    type: "achat" | "vente";
    quantite: number;
    date: string;
    prix: number;
    gainTransactionValeur: string;
    gainTransactionPourcent: string;
}

// Type pour les transactions remoduler, où les transaction sont trier par actions
type Action = {
    nom: string;
    devise: string;
    prix: number;
    prixHier: number;
    quantiteTotale: number;
    valorisationTotale: number;
    gainJourValeur: number;
    gainJourPourcent: number;
    transactions: TransactionsAction[];
};
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
type PropsPresentationAction = {
    idComposant: string;
    typePresentation?: "portefeuille" | "action";
    donneesPortefeuille?: { devise: string | null; valorisation: number | "Calcul impossible" };
    cleRechargement?: number;
    afficherModal: boolean;
    setAfficherModal: React.Dispatch<React.SetStateAction<boolean>>;
    setDonneesAction?: React.Dispatch<React.SetStateAction<{ valorisation: number; rendement: number; devise: string;nom:string } | null>>;
};
export default function PresentationAction({ idComposant, typePresentation = "action", donneesPortefeuille, cleRechargement, afficherModal, setAfficherModal, setDonneesAction }: PropsPresentationAction) {
    const [typeDonneeModal, setTypeDonneeModal] = useState<"creationPortefeuille" | "achatAction" | null>(null);

    const [message, setMessage] = useState<string | null>(null);
    const [dureeGraphique, setDureeGraphique] = useState<DureeGraphique>(typePresentation == "action" ? "1 j" : "1 m");
    const [donnees, setDonnees] = useState<DonneesGraphique>();
    const [chargement, setChargement] = useState<boolean>(true);
    const [listePortefeuille, setListePortefeuille] = useState<Array<{ id: number; nom: string }> | null>(null);
    const [erreurFormModal, setErreurFormModal] = useState<string | null>(null);
    const [donneeeFormCreationPortefeuille, setDonneeFormCreationPortefeuille] = useState<{ prix?: string; nombre?: string; date?: string }>({});
    const [valorisationActuelle, setValorisationActuelle] = useState<null | number>(null);
    const [rendement, setRendement] = useState<number>(0);

    const requete = useRequete();

    useEffect(() => {
        // Récupération des données pour le graphique
        const recuperationDonnees = async () => {
            setChargement(true);
            if (typePresentation == "action") {
                const reponse = await requete({ url: `/bourse/graphique?ticker=${idComposant}&duree=${dureeGraphique}` });
                setTimeout(() => {
                    setChargement(false);
                }, 200); // ⬅ délai artificiel en millisecondes

                if (reponse.message) {
                    setMessage(reponse.message);
                    setDonnees(reponse.donnees);
                } else {
                    if (!valorisationActuelle) {
                        setValorisationActuelle(reponse.dernierPrix);
                    }
                    console.log(reponse);
                    setDonnees(reponse);
                    setRendement(reponse.rendement);
                    if (typePresentation == "action" && setDonneesAction) {
                        setDonneesAction({ valorisation: reponse.dernierPrix, rendement: Number(reponse.rendement), devise: reponse.devise, nom: reponse.nom });
                    }
                }
            } else {
                const reponse = await requete({ url: `/portefeuille/recuperation-graphique-valorisation?id=${idComposant}&duree=${dureeGraphique}` });

                setChargement(false);

                setRendement(Number((((reponse.tableauValorisation[reponse.tableauValorisation.length - 1].valeur - reponse.tableauValorisation[0].valeur) / reponse.tableauValorisation[0].valeur) * 100).toFixed(2)));
                setDonnees(reponse.tableauValorisation);
            }
        };

        // Récupération des informations pour le portefeuille
        const recuperationPortefeuille = async () => {
            const reponse = await requete({ url: "/portefeuille/liste" });
            setListePortefeuille(reponse);
        };

        if (typePresentation == "action") {
            recuperationPortefeuille();
        }
        recuperationDonnees();
    }, [idComposant, dureeGraphique, cleRechargement]); // 👈 se lance au premier rendu et à chaque changement

    return chargement ? (
        <Chargement />
    ) : (
        <>
            <div className="PresentationAction">
                {typePresentation == "action" && (
                    <>
                        <div id="divHeader">
                            <div id="divIdentifiantAction">
                                <p id="pTicker">{idComposant}</p>

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
                    </>
                )}

                {typePresentation == "action" ? (
                    donnees?.rendement &&
                    donnees.dernierPrix && (
                        <div id="divPrix">
                            <p id="pPrixAction">
                                {/* Je doit set valorisation actuelle car j'en ai bessoin dans ma page action */}
                                {valorisationActuelle} {donnees.devise}
                            </p>
                            <RendementAction valeur={rendement} mode={"defini"} id="pRendementAction" />
                        </div>
                    )
                ) : (
                    <div id="divPrix">
                        <p id="pPrixAction">{donneesPortefeuille.valorisation == "Calcul impossible" ? "Valorisation incalculable" : `${donneesPortefeuille.valorisation} ${donneesPortefeuille.devise}`}</p>
                        <RendementAction valeur={rendement} mode={"defini"} id="pRendementAction" />
                    </div>
                )}

                {typePresentation == "action" ? <DureeGraphique set={setDureeGraphique} dureeGraphique={dureeGraphique} /> : <DureeGraphique set={setDureeGraphique} dureeGraphique={dureeGraphique} tableauDurees={["5 j", "1 m", "6 m", "1 a", "5 a", "MAX"]} />}

                {message ? <p id="pMessage">{message}</p> : <div id="divGraphique">{donnees ? typePresentation == "action" ? <Graphique donnees={donnees} duree={dureeGraphique} rendement={rendement} /> : <Graphique donneesValorisation={donnees} duree={dureeGraphique} rendement={rendement} valorisation={donneesPortefeuille.valorisation} devise={donneesPortefeuille.devise} /> : ""}</div>}
            </div>
            {typePresentation == "action" && (
                <Modal estOuvert={afficherModal} fermeture={() => setAfficherModal(false)}>
                    {typeDonneeModal == "achatAction" && <AjouterAchat setAfficherModal={setAfficherModal} setTypeDonneeModal={setTypeDonneeModal} listePortefeuille={listePortefeuille} ticker={idComposant} premierTrade={donnees?.premierTrade} typeAchat="action" />}

                    {typeDonneeModal == "creationPortefeuille" && <CreationPortefeuille type="achat" setListePortefeuille={setListePortefeuille} setTypeDonneeModal={setTypeDonneeModal} />}
                </Modal>
            )}
        </>
    );
}
