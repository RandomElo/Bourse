import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../styles/MesPortefeuilles.css";
import React, { useEffect, useState } from "react";
import { useRequete } from "../fonctions/requete";
import { ArrowRight } from "lucide-react";
import RendementAction from "../composants/RendementAction";
import Modal from "../composants/Modal";
import AjouterAchat from "../composants/AjouterAchat";
import CreationPortefeuille from "../composants/CreationPortefeuille";

export default function MesPortefeuilles() {
    const navigation = useNavigate();
    const { estAuth, chargement } = useAuth();
    const requete = useRequete();
    const [ligneSurvolee, setLigneSurvolee] = useState<number | null>(null);
    const [donnees, setDonnees] = useState<Array<{
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
    const [afficherModal, setAfficherModal] = useState<boolean>(false);

    // Veification de l'auhtentification
    useEffect(() => {
        if (!estAuth) {
            navigation("/connexion");
        }
    }, [estAuth, navigation]);

    // Récupérationd des portefeuilles
    useEffect(() => {
        const recuperationDonnees = async () => {
            const reponse = await requete({ url: "/portefeuille/recuperation-portefeuilles-details" });
            setDonnees(reponse);
        };
        recuperationDonnees();
    }, []);

    useEffect(() => {
        if (afficherModal) {
            console.log("je suis ici");
            setAfficherModal(false);
        }
    }, [donnees]);

    if (chargement) {
        return null;
    } else if (donnees) {
        return (
            <main className="MesPortefeuilles">
                <h1 id="titre">Mes portefeuilles</h1>
                {donnees.length != 0 ? (
                    <table id="tableauPresentationPortefeuilles">
                        <thead>
                            <tr>
                                <th className="celluleNom">Nom</th>
                                <th className="celluleGain">Gain du jour</th>
                                <th className="celluleValorisation">Valorisation</th>
                                <th className="celluleLienDetail"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {donnees.map((portefeuille, index) => (
                                <tr key={portefeuille.id} className={ligneSurvolee == portefeuille.id ? "survolee" : ""}>
                                    <td className="celluleNom">{portefeuille.nom}</td>
                                    {portefeuille.listeTransactions.length > 0 ? (
                                        <>
                                            <td className="celluleGain">{portefeuille.valorisation !== "Calcul impossible" ? <RendementAction valeur={Number(portefeuille.gainAujourdhui)} valorisation={portefeuille.valorisation} mode="calcul" /> : <RendementAction valeur={Number(portefeuille.gainAujourdhui)} />}</td>
                                            <td className="celluleValorisation">{portefeuille.valorisation !== "Calcul impossible" ? `${portefeuille.valorisation} ${portefeuille.devise}` : portefeuille.valorisation}</td>
                                        </>
                                    ) : (
                                        <>
                                            <td colSpan={2} className="celluleAucuneTransaction">
                                                Aucune transaction enregistrée.
                                            </td>
                                        </>
                                    )}
                                    <td
                                        className="celluleLienDetail"
                                        onMouseEnter={() => setLigneSurvolee(portefeuille.id)}
                                        onMouseLeave={() => setLigneSurvolee(null)}
                                        onClick={() => {
                                            setLigneSurvolee(null);
                                            navigation(`/portefeuille/${portefeuille.id}`, {
                                                state: {
                                                    donnees: donnees[index],
                                                },
                                            });
                                        }}
                                    >
                                        <ArrowRight className="fleche" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div id="divAucunPortefeuille">
                        <p>Vous n'avez aucun portefeuille enregistré.</p>
                        <a className="bouton" onClick={() => setAfficherModal(true)}>
                            Ajouter portefeuille
                        </a>
                    </div>
                )}
                <Modal estOuvert={afficherModal} fermeture={() => setAfficherModal(false)}>
                    <CreationPortefeuille type="portefeuille" setListePortefeuilleEtTransaction={setDonnees} />
                </Modal>
            </main>
        );
    }
}
