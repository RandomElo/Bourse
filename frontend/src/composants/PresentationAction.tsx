import { useEffect, useState } from "react";
import { useRequete } from "../fonctions/requete";
import { type ReactNode } from "react";

import "../styles/composants/PresentationAction.css";
import GraphiqueBourse from "./GraphiqueBourse";
import Chargement from "./Chargement";
import Modal from "./Modal";
import ChampDonneesForm from "./ChampDonneesForm";
export default function PresentationAction({ ticker }: { ticker: string }) {
    const [afficherModal, setAfficherModal] = useState<boolean>(false);
    const [contenuModal, setContenuModal] = useState<ReactNode>(<div></div>);
    const tableauDuree = ["1 j", "5 j", "1 m", "6 m", "1 a", "5 a", "MAX"] as const;
    type DureeGraphique = (typeof tableauDuree)[number];

    interface DonneesGraphique {
        dates: Array<Date>;
        prixFermeture: Array<number>;
        nom: string;
        devise: string;
        ouverture?: string;
        fermeture?: string;
        dernierPrix?: number;
        rendement?: number;
    }

    const [message, setMessage] = useState<string | null>(null);
    const [dureeGraphique, setDureeGraphique] = useState<DureeGraphique>("1 j");
    const [donnees, setDonnees] = useState<DonneesGraphique>();
    const [chargement, setChargement] = useState<boolean>(false);
    const [listePortefeuille, setListePortefeuille] = useState<Array<{ id: number; nom: string }> | null>();
    const requete = useRequete();

    useEffect(() => {
        // Récupération des données pour le graphique
        const recuperationDonnees = async () => {
            setMessage(null);
            setChargement(true);

            const reponse = await requete({ url: `/bourse/graphique?ticker=${ticker}&duree=${dureeGraphique}` });

            setTimeout(() => {
                setChargement(false);
            }, 200); // ⬅ délai artificiel en millisecondes

            if (reponse.message) {
                setMessage(reponse.message);
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
                            setContenuModal(
                                <div id="divEnregistrementAction">
                                    <h2>Enregistrer l'action</h2>
                                    {listePortefeuille && listePortefeuille.length > 0 ? (
                                        <select id="selectNomPortefeuille">
                                            {listePortefeuille.map((portefeuille, index) => (
                                                <option key={index} value="">
                                                    {portefeuille.nom}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <p id="pAucunPortefeuille">Vous n'avez aucun portefeuille</p>
                                    )}
                                    <a
                                        id="boutonCreationPortefeuille"
                                        className="bouton"
                                        onClick={() => {
                                            console.log("je suis ici");
                                            setContenuModal(
                                                <div id="divCreationPortefeuille">
                                                    <h2>Création de portefeuille</h2>
                                                    <form>
                                                        <ChampDonneesForm id="champNom" label="Nom" />

                                                        <button type="submit" id="boutonCreePortefeuille">Crée</button>
                                                    </form>
                                                </div>
                                            );
                                        }}
                                    >
                                        Crée un portefeuille
                                    </a>
                                </div>
                            );
                            setAfficherModal(true);
                        }}
                    >
                        Enregistrer l'action
                    </a>
                </div>
                <div style={{ height: "2px", backgroundColor: "#f2f2f2" }}></div>
                {donnees?.rendement && donnees.dernierPrix && (
                    <div id="divPrix">
                        <p id="pPrixAction">
                            {donnees.dernierPrix} {donnees.devise}
                        </p>
                        <p id="pRendementAction" className={donnees.rendement > 0 ? "positif" : "negatif"}>
                            {donnees.rendement > 0 ? "+ " : "- "}
                            {Math.abs(donnees.rendement)} %
                        </p>
                    </div>
                )}
                <div id="divChoixEtenduGraphique">
                    {tableauDuree.map((duree, index) => (
                        <a key={index} className={`aDuree ${dureeGraphique == duree ? "selectionnee" : ""}`} onClick={() => setDureeGraphique(duree)}>
                            {duree}
                        </a>
                    ))}
                </div>
                {message ? <p id="pMessage">{message}</p> : <div id="divGraphique">{donnees ? <GraphiqueBourse key={dureeGraphique} donnees={donnees} duree={dureeGraphique} width={1000} /> : ""}</div>}
            </div>
            {afficherModal && (
                <Modal estOuvert={afficherModal} fermeture={() => setAfficherModal(false)}>
                    {contenuModal}
                </Modal>
            )}
        </>
    );
}
