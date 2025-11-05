import "../styles/Portefeuille.css";
import { useRequete } from "../fonctions/requete";
import { ChevronDown, ChevronUp } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import RendementAction from "../composants/RendementAction";
import CartePerformances from "../composants/CartePerformances";
import PresentationAction from "../composants/PresentationAction";
import Chargement from "../composants/Chargement";
import Modal from "../composants/Modal";

// Type pour les transactions - reçu dans donner et trier apres pour remoduler les actions
interface Transactions {
    id: number;
    type: "achat" | "vente";
    quantite: number;
    date: string;
    prixActuel: number;
    prix: number; // Prix acheter
    prixHier: number;
    nom: string;
    devise: string;
}
// Type pour les données que je recoit
interface Donnees {
    id: number;
    nom: string;
    valorisation: number | "Calcul impossible";
    devise: string | null;
    gainTotal: string;
    gainAujourdhui: string;
    listeTransactions: Array<Transactions>;
}

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

type DonneesDetails = {
    nom: string;
    valorisation: number;
    gainTotal: number;
    gainAujourdhui: number;
    tableauValorisation: Array<{ date: Date; valeur: number }>;
};

export default function Portefeuille() {
    const { id } = useParams();
    const location = useLocation();
    const navigation = useNavigate();
    const requete = useRequete();
    const { estAuth, chargement } = useAuth();

    const [donnees, setDonnees] = useState<Donnees | null>(null);
    const [donneesDetail, setDonneesDetails] = useState<DonneesDetails>();
    const [actions, setActions] = useState<Array<Action> | null>(null);

    const [idLigneSurvolee, setIdLigneSurvolee] = useState<number | null>(null);
    const [idLigneAfficherDetail, setIdLigneAfficherDetails] = useState<number | null>(null);
    const [detailsTransactions, setDetailsTransactions] = useState<TransactionsAction[] | null>(null);
    const [pagePrete, setPagePrete] = useState<boolean>(false);
    const [afficherModal, setAfficherModal] = useState<boolean>(false);
    useEffect(() => {
        if (!estAuth) {
            navigation("/connexion");
        }
    }, [estAuth, navigation]);

    useEffect(() => {
        const verificationAccesMiseEnFormeDonnees = async () => {
            const reponse = await requete({ url: `/portefeuille/verification-acces/${id}` });
            if (reponse) {
                setDonnees(location.state?.donnees);

                // objet avec une clé string et une valeur du type def
                const resultats: Record<string, Action> = {};

                location.state?.donnees.listeTransactions.forEach((transaction: Transactions) => {
                    // si cela n'existe pas déja je met en place les détails de l'action
                    if (!resultats[transaction.nom]) {
                        resultats[transaction.nom] = {
                            nom: transaction.nom,
                            devise: transaction.devise,
                            prix: transaction.prixActuel,
                            prixHier: transaction.prixHier,
                            quantiteTotale: 0,
                            valorisationTotale: 0,
                            gainJourValeur: 0,
                            gainJourPourcent: 0,
                            transactions: [],
                        };
                    }

                    const action = resultats[transaction.nom];

                    // Ajouter la transaction
                    const gainTransactionValeur = (transaction.prixActuel - transaction.prix) * transaction.quantite;
                    const gainTransactionPourcent = ((transaction.prixActuel - transaction.prix) / transaction.prix) * 100;

                    // Je met en forme la liste des transactions pour chaque action
                    action.transactions.push({
                        id: transaction.id,
                        type: transaction.type,
                        quantite: transaction.quantite,
                        date: transaction.date,
                        prix: transaction.prix,
                        gainTransactionValeur: gainTransactionValeur.toFixed(2),
                        gainTransactionPourcent: gainTransactionPourcent.toFixed(2),
                    });
                    action.quantiteTotale += transaction.type === "achat" ? transaction.quantite : -transaction.quantite;
                });

                Object.values(resultats).forEach((action) => {
                    const prixActuelGlobal = action.prix; // même prix pour toutes les transactions

                    action.valorisationTotale = action.quantiteTotale * prixActuelGlobal;

                    const valorisationHier = action.prixHier * action.quantiteTotale;
                    action.gainJourValeur = Number((action.valorisationTotale - valorisationHier).toFixed(2));
                    action.gainJourPourcent = valorisationHier > 0 ? Number(((action.gainJourValeur / valorisationHier) * 100).toFixed(2)) : 0;
                });

                setActions(Object.values(resultats));

                // Il faut que je fasse la requete

                const reponseGraphiqueValorisation = await requete({ url: `/portefeuille/recuperation-graphique-valorisation?id=${id}&duree=5 j` });
                setDonneesDetails(reponseGraphiqueValorisation);
                setPagePrete(true);
            } else {
                navigation("/");
            }
        };

        verificationAccesMiseEnFormeDonnees();
    }, []);

    if (chargement || !actions || !donnees || !donneesDetail || !pagePrete) return <Chargement />;

    return (
        <main className="Portefeuille">
            <h1 id="titre">{donnees.nom}</h1>
            <CartePerformances
                gainDuJour={{
                    valeurMonetaire: (Number(donnees.valorisation) * donneesDetail.gainAujourdhui) / 100,
                    valeurPourcentage: donneesDetail.gainAujourdhui,
                }}
                gainTotal={{
                    valeurMonetaire: Number(donnees.valorisation) * (1 + donneesDetail.gainTotal / 100) - Number(donnees.valorisation),
                    valeurPourcentage: donneesDetail.gainTotal,
                }}
                devise={donnees?.devise}
            />

            <table>
                <thead>
                    <tr id="trEntete">
                        <th className="colonneNom">Nom</th>
                        <th className="colonnePrix">Prix</th>
                        <th className="colonneQuantite">Quantité</th>
                        <th className="colonneValeur">Valeur</th>
                        <th className="colonneGainDuJour">Gain du jour</th>
                        <th className="colonneChevron"></th>
                    </tr>
                </thead>
                <tbody>
                    {actions.map((action, index) => (
                        <React.Fragment key={index}>
                            <tr id={`tr${index}`} className={`${idLigneSurvolee == index ? "survolee" : ""} ${idLigneAfficherDetail === index ? "actionSelectionnee" : ""}`}>
                                <td className="colonneNom">{action.nom}</td>
                                <td className="colonnePrix">{action.prix + " " + action.devise}</td>
                                <td className="colonneCentrer">{action.quantiteTotale}</td>
                                <td className="colonneCentrer">{action.valorisationTotale.toFixed(2) + " " + action.devise}</td>

                                <td>
                                    <RendementAction mode={"defini"} valeur={Number(action.gainJourPourcent)} rendementDevise={action.gainJourValeur} />
                                </td>
                                <td
                                    onMouseEnter={() => setIdLigneSurvolee(index)}
                                    onMouseLeave={() => setIdLigneSurvolee(null)}
                                    onClick={() => {
                                        if (idLigneAfficherDetail !== null && idLigneAfficherDetail == index) {
                                            setIdLigneAfficherDetails(null);
                                            setDetailsTransactions(null);
                                        } else {
                                            setIdLigneAfficherDetails(index);
                                            setDetailsTransactions(action.transactions);
                                        }
                                    }}
                                    className="colonneChevron"
                                >
                                    {idLigneAfficherDetail === index ? <ChevronUp /> : <ChevronDown />}
                                </td>
                            </tr>
                            {idLigneAfficherDetail === index && (
                                <>
                                    <tr className={`trListeTransactions`}>
                                        <th>Date</th>
                                        <th>Prix</th>
                                        <th>Quantité</th>
                                        <th>Valeur</th>
                                        <th>Rendement</th>
                                    </tr>
                                    {detailsTransactions?.map((transaction, index) => (
                                        <tr key={index} className={`trListeTransactions ${detailsTransactions.length - 1 == index ? "derniereLigneTransaction" : ""}`}>
                                            <td className="colonneCentrer">{transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1) + " le : " + transaction.date}</td>
                                            <td className="colonneCentrer">{transaction.prix + " " + action.devise}</td>
                                            <td className="colonneCentrer">{transaction.quantite}</td>
                                            <td className="colonneCentrer">{transaction.prix * transaction.quantite + " " + action.devise}</td>
                                            <td>
                                                <RendementAction mode={"defini"} valeur={Number(transaction.gainTransactionPourcent)} rendementDevise={Number(transaction.gainTransactionValeur)} />
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="trAjouterUneVente">
                                        <td colSpan={5}>
                                            <a className="bouton" onClick={() => setAfficherModal(true)}>
                                                Ajouter une vente
                                            </a>
                                        </td>
                                    </tr>
                                </>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>

            <PresentationAction typePresentation="portefeuille" idComposant={id} donneesPortefeuille={{ devise: donnees?.devise ? donnees.devise : null, valorisation: donnees.valorisation }} />

            <Modal estOuvert={afficherModal} fermeture={() => setAfficherModal(false)} />
        </main>
    );
}
