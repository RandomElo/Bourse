import "../styles/Portefeuille.css";
import { useRequete } from "../fonctions/requete";
import { ChevronDown, ChevronUp, Loader2, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import RendementAction from "../composants/RendementAction";
import CartePerformances from "../composants/CartePerformances";
import PresentationAction from "../composants/PresentationAction";
import Chargement from "../composants/Chargement";
import Modal from "../composants/Modal";
import RechercheAction from "../composants/RechercheAction";
import AjouterAchat from "../composants/AjouterAchat";
import AjouterVente from "../composants/AjouterVente";

// Type pour les transactions - reçu dans donner et trier apres pour remoduler les actions
interface Transactions {
    id: number;
    idAction: string;
    type: "achat" | "vente";
    quantite: number;
    date: string;
    prixActuel: number;
    prix: number; // Prix acheter
    prixHier: number;
    nom: string;
    devise: string;
    ticker: string;
    gainPourcentage?: number;
    gainValeur?: number;
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
export interface TransactionsAction {
    id: number;
    type: "achat" | "vente";
    quantite: number;
    date: string;
    prix: number;
    gainTransactionValeur: string;
    gainTransactionPourcent: string;

    gainPourcentage?: number;
    gainValeur?: number;
}

// Type pour les transactions remoduler, où les transaction sont trier par actions
export type Action = {
    nom: string;
    idAction: string;
    devise: string;
    prix: number;
    prixHier: number;
    quantiteTotale: number;
    valorisationTotale: number;
    gainJourValeur: number;
    gainJourPourcent: number;
    ticker: string;
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
    const [detailsModal, setDetailsModal] = useState<{ nom: string; idAction: string }>({ nom: "", idAction: "" });
    const [idLigneTransactionVenteSurvolee, setIdLigneTransactionVenteSurvolee] = useState<number>(-1);
    const [idLigneTransactionAchatSurvolee, setIdLigneTransactionAchatSurvolee] = useState<number>(-1);
    const [attenteSuppression, setAttenteSuppression] = useState<boolean>(false);
    const [typeModal, setTypeModal] = useState<string | null>(null);
    const [action, setAction] = useState<string | null>(null);
    const [valeurCle, setValeurCle] = useState<number>(0);
    const [premierTrade, setPremierTrade] = useState<string | null>(null);
    const [requeteFinie, setRequeteFinie] = useState<boolean>(false);
    const [gainTotal, setGainTotal] = useState<{ pourcentage: number; monetaire: number }>({ pourcentage: 0, monetaire: 0 });
    // Fonctions

    // Verification des infos et récupérations des données
    const miseEnFormeContenuPortefeuille = async ({ idAction }: { idAction?: null | string }) => {
        const reponse = await requete({ url: `/portefeuille/recuperation-details-un-portefeuille/${id}` });

        setDonnees(reponse);
        // objet avec une clé string et une valeur du type def
        const resultats: Record<string, Action> = {};
        reponse.listeTransactions.forEach((transaction: Transactions) => {
            // si cela n'existe pas déja je met en place les détails de l'action
            if (!resultats[transaction.nom]) {
                resultats[transaction.nom] = {
                    nom: transaction.nom,
                    idAction: transaction.idAction,
                    devise: transaction.devise,
                    prix: transaction.prixActuel,
                    prixHier: transaction.prixHier,
                    quantiteTotale: 0,
                    valorisationTotale: 0,
                    gainJourValeur: 0,
                    gainJourPourcent: 0,
                    ticker: transaction.ticker,
                    transactions: [],
                };
            }

            const action = resultats[transaction.nom];
            // Ajouter la transaction
            const gainTransactionValeur = (transaction.prixActuel - transaction.prix) * transaction.quantite;
            const gainTransactionPourcent = ((transaction.prixActuel - transaction.prix) / transaction.prix) * 100;

            // Je met en forme la liste des transactions pour chaque action
            const objetTransaction = {
                id: transaction.id,
                type: transaction.type,
                quantite: transaction.quantite,
                date: transaction.date,
                prix: transaction.prix,
                gainTransactionValeur: gainTransactionValeur.toFixed(2),
                gainTransactionPourcent: gainTransactionPourcent.toFixed(2),
                gainPourcentage: 0,
                gainValeur: 0,
            };
            if (transaction.type == "vente") {
                objetTransaction.gainPourcentage = transaction.gainPourcentage!;
                objetTransaction.gainValeur = transaction.gainValeur!;
            }
            action.transactions.push(objetTransaction);
            action.quantiteTotale += transaction.type === "achat" ? transaction.quantite : -transaction.quantite;
        });

        Object.values(resultats).forEach((action) => {
            const prixActuelGlobal = action.prix; // même prix pour toutes les transactions

            action.valorisationTotale = action.quantiteTotale * prixActuelGlobal;

            const valorisationHier = action.prixHier * action.quantiteTotale;
            action.gainJourValeur = Number((action.valorisationTotale - valorisationHier).toFixed(2));
            action.gainJourPourcent = valorisationHier > 0 ? Number(((action.gainJourValeur / valorisationHier) * 100).toFixed(2)) : 0;
        });
        setActions([...Object.values(resultats)]);

        // Il faut que je fasse la requete

        const reponseGraphiqueValorisation = await requete({ url: `/portefeuille/recuperation-graphique-valorisation?id=${id}&duree=5 j` });
        setDonneesDetails(reponseGraphiqueValorisation);

        if (idAction) return Object.values(resultats).filter((action) => action.idAction == idAction);
    };

    useEffect(() => {
        if (!estAuth) {
            navigation("/connexion");
        }
    }, [estAuth, navigation]);

    useEffect(() => {
        const verificationAcces = async () => {
            const reponse = await requete({ url: `/portefeuille/verification-acces/${id}` });
            if (reponse) {
                await miseEnFormeContenuPortefeuille({});
                setPagePrete(true);
            } else {
                navigation("/");
            }
        };
        verificationAcces();
    }, []);

    // Pour récuperer la date du premier trade lors de l'ajout d'un achat
    useEffect(() => {
        const recuperationPremierTrade = async () => {
            if (action) {
                const reponse = await requete({ url: `/bourse/recuperation-premier-trade?ticker=${action}` });
                setPremierTrade(reponse);
            }
        };
        recuperationPremierTrade();
    }, [action]);

    // Pour récuperer les nouvelles données suite a l'achat
    useEffect(() => {
        console.log("je suis ici");
        if (requeteFinie) {
            console.log("je suis dans le if");
            miseEnFormeContenuPortefeuille({});
            setValeurCle((prev) => prev + 1);
        }
    }, [requeteFinie]);

    useEffect(() => {
        if (!actions) return;
        let investiTotal = 0;
        let valeurActuelleTotal = 0;

        for (const action of actions) {
            for (const t of action.transactions) {
                const qte = Number(t.quantite);
                const gainPct = Number(t.gainTransactionPourcent);
                const gainVal = Number(t.gainTransactionValeur);

                // Skip si pas de gain
                if (gainPct === 0) continue;

                // Montant investi réel de cette transaction
                const investi = gainVal / (gainPct / 100);

                // Valeur actuelle de cette position
                const valeurActuelle = investi + gainVal;

                investiTotal += investi;
                valeurActuelleTotal += valeurActuelle;
            }
        }

        const rendementTotal = ((valeurActuelleTotal - investiTotal) / investiTotal) * 100;

        setGainTotal({ pourcentage: Number(rendementTotal.toFixed(2)), monetaire: Number((valeurActuelleTotal - investiTotal).toFixed(2)) });
    }, [actions]);

    if (!actions || !donnees || !donneesDetail || !pagePrete) return <Chargement />;

    return (
        <main className="Portefeuille">
            <h1 id="titre">{donnees.nom}</h1>
            {donnees.listeTransactions.length == 0 ? (
                <div id="divAucuneTransaction">
                    <p id="pAucuneTransaction">Aucune transaction enregistrée.</p>
                    <button
                        className="bouton"
                        onClick={() => {
                            setTypeModal("ajouterAchat");
                            setAction(null);
                            setAfficherModal(true);
                        }}
                    >
                        Ajouter un achat
                    </button>
                </div>
            ) : (
                <>
                    {donnees.valorisation !== "Calcul impossible" && (
                        <CartePerformances
                            gainDuJour={{
                                valeurMonetaire: (Number(donnees.valorisation) * donneesDetail.gainAujourdhui) / 100,
                                valeurPourcentage: Number(donneesDetail.gainAujourdhui.toFixed(2)),
                            }}
                            gainTotal={{
                                valeurMonetaire: gainTotal.monetaire,
                                valeurPourcentage: gainTotal.pourcentage,
                            }}
                            devise={donnees?.devise}
                        />
                    )}

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
                                        <td className="colonneNom caseNom" onClick={() => navigation("/action/" + action.ticker.replace(".", "_"))}>
                                            {action.nom}
                                        </td>
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
                                            <tr className="trListeTransactions">
                                                <th>Date d'achat</th>
                                                <th>Prix</th>
                                                <th>Quantité</th>
                                                <th>Valeur</th>
                                                <th>Rendement</th>
                                                <th></th>
                                            </tr>
                                            {detailsTransactions?.map(
                                                (transaction, index) =>
                                                    transaction.type == "achat" && (
                                                        <tr key={index} className={`trListeTransactions ${detailsTransactions.length - 1 == index ? "derniereLigneTransaction" : ""}`} onMouseEnter={() => setIdLigneTransactionAchatSurvolee(index)} onMouseLeave={() => setIdLigneTransactionAchatSurvolee(-1)}>
                                                            <td className="colonneCentrer">{transaction.date}</td>
                                                            <td className="colonneCentrer">{transaction.prix + " " + action.devise}</td>
                                                            <td className="colonneCentrer">{transaction.quantite}</td>
                                                            <td className="colonneCentrer">{(transaction.prix * transaction.quantite).toFixed(2) + " " + action.devise}</td>
                                                            <td>
                                                                <RendementAction mode={"defini"} valeur={Number(transaction.gainTransactionPourcent)} rendementDevise={Number(transaction.gainTransactionValeur)} />
                                                            </td>
                                                            <td
                                                                onClick={async () => {
                                                                    if (idLigneTransactionAchatSurvolee == index) {
                                                                        if (detailsTransactions.length == 1) {
                                                                            setIdLigneAfficherDetails(null);
                                                                        }
                                                                        let nbrActionsVendue = 0;
                                                                        const actionsVendue = detailsTransactions.filter((transaction) => transaction.type == "vente");
                                                                        for (const t of actionsVendue) {
                                                                            nbrActionsVendue += t.quantite;
                                                                        }
                                                                        const nombreActionsRestante = action.quantiteTotale - nbrActionsVendue;
                                                                        if (nombreActionsRestante !== 0 && nombreActionsRestante < transaction.quantite) {
                                                                            setTypeModal("problemeSuppressionAchat");
                                                                            setAfficherModal(true);
                                                                        } else {
                                                                            setAttenteSuppression(true);
                                                                            // Envoi au back la suppression
                                                                            await requete({ url: "/portefeuille/suppression-transaction", methode: "DELETE", corps: { id: transaction.id } });
                                                                            // Récupération des données mise a jour
                                                                            setActions(null);
                                                                            const actionMiseAJour = await miseEnFormeContenuPortefeuille({ idAction: action.idAction });

                                                                            setTimeout(() => {
                                                                                setAttenteSuppression(false);
                                                                            }, 200);

                                                                            setDetailsTransactions(actionMiseAJour![0].transactions);

                                                                            setValeurCle((prev) => prev + 1);
                                                                        }
                                                                    }
                                                                }}
                                                            >
                                                                {idLigneTransactionAchatSurvolee == index && attenteSuppression ? <Loader2 className="chargement" /> : <Trash2 />}
                                                            </td>
                                                        </tr>
                                                    )
                                            )}
                                            {detailsTransactions && detailsTransactions.filter((transaction) => transaction.type == "vente").length > 0 && (
                                                <>
                                                    <tr className="trListeTransactions">
                                                        <th>Date de vente</th>
                                                        <th>Prix</th>
                                                        <th>Quantité</th>
                                                        <th>Valeur</th>
                                                        <th>Gain total</th>
                                                        <th></th>
                                                    </tr>
                                                    {detailsTransactions.map(
                                                        (transaction, index) =>
                                                            transaction.type == "vente" && (
                                                                <tr key={index} className={`trListeTransactions ${detailsTransactions.length - 1 == index ? "derniereLigneTransaction" : ""}`} onMouseEnter={() => setIdLigneTransactionVenteSurvolee(index)} onMouseLeave={() => setIdLigneTransactionVenteSurvolee(-1)}>
                                                                    <td className="colonneCentrer">{transaction.date}</td>
                                                                    <td className="colonneCentrer">{transaction.prix + " " + action.devise}</td>
                                                                    <td className="colonneCentrer">{transaction.quantite}</td>
                                                                    <td className="colonneCentrer">{transaction.prix * transaction.quantite + " " + action.devise}</td>
                                                                    <td>
                                                                        <RendementAction mode={"defini"} valeur={transaction.gainPourcentage!} rendementDevise={transaction.gainValeur!} />
                                                                    </td>
                                                                    <td
                                                                        className="colonnePoubelle"
                                                                        onClick={async () => {
                                                                            if (idLigneTransactionVenteSurvolee == index) {
                                                                                setAttenteSuppression(true);
                                                                                // Envoi au back la suppression
                                                                                await requete({ url: "/portefeuille/suppression-transaction", methode: "DELETE", corps: { id: transaction.id } });

                                                                                // Récupération des données mise a jour
                                                                                const actionMiseAJour = await miseEnFormeContenuPortefeuille({ idAction: action.idAction });
                                                                                setDetailsTransactions(actionMiseAJour![0].transactions);

                                                                                setValeurCle((prev) => prev + 1);

                                                                                setTimeout(() => {
                                                                                    setAttenteSuppression(false);
                                                                                }, 200);
                                                                            }
                                                                        }}
                                                                    >
                                                                        {idLigneTransactionVenteSurvolee == index && <>{attenteSuppression ? <Loader2 className="chargement" /> : <Trash2 />}</>}
                                                                    </td>
                                                                </tr>
                                                            )
                                                    )}
                                                </>
                                            )}

                                            <tr className="trAjouterUneVente">
                                                <td colSpan={5}>
                                                    <a
                                                        className="bouton"
                                                        onClick={() => {
                                                            setDetailsModal({ nom: action.nom, idAction: action.idAction });
                                                            setTypeModal("ajouterVente");
                                                            setAfficherModal(true);
                                                        }}
                                                    >
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

                    <a
                        id="boutonAjouterAchat"
                        className="bouton"
                        onClick={() => {
                            setTypeModal("ajouterAchat");
                            setAction(null);
                            setAfficherModal(true);
                        }}
                    >
                        Ajouter un achat
                    </a>

                    <PresentationAction typePresentation="portefeuille" idComposant={id} donneesPortefeuille={{ devise: donnees?.devise ? donnees.devise : null, valorisation: donnees.valorisation }} cleRechargement={valeurCle} />
                </>
            )}
            <Modal estOuvert={afficherModal} fermeture={() => setAfficherModal(false)} taille={typeModal == "ajouterAchat" ? 650 : null}>
                {typeModal == "ajouterVente" && <AjouterVente mode={"pagePortefeuille"} nomAction={detailsModal.nom} idAction={detailsModal.idAction} idPortefeuille={id!} setValeurCle={setValeurCle} miseEnFormePortefeuille={miseEnFormeContenuPortefeuille} setDetailsTransactions={setDetailsTransactions} />}
                {typeModal == "problemeSuppressionAchat" && (
                    <div id="divProblemeSuppressionAchat">
                        <h2>Impossibilité de supprimer l'achat</h2>
                        <p id="p1">Cette suppression rendrait votre nombre d’actions négatif.</p>
                        <p id="p2">Supprimez d’abord des ventes pour corriger le solde.</p>
                    </div>
                )}
                {typeModal == "ajouterAchat" && (
                    <div id="divAjouterAchat">
                        {!action ? (
                            // Permet la recherche d'action
                            <>
                                <h2>Ajouter un achat</h2>
                                <RechercheAction action={action} setAction={setAction} />
                            </>
                        ) : (
                            // Permet de définir l'achat
                            <>
                                <AjouterAchat setAfficherModal={setAfficherModal} setTypeDonneeModal={setTypeModal} ticker={action} typeAchat="portefeuille" premierTrade={premierTrade} idPortefeuille={id} setRequeteFinie={setRequeteFinie} />
                            </>
                        )}
                    </div>
                )}
            </Modal>
        </main>
    );
}
