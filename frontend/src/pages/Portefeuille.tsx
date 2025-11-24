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
import ChampDonneesForm from "../composants/ChampDonneesForm";
import RechercheAction from "../composants/RechercheAction";
import AjouterAchat from "../composants/AjouterAchat";

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
interface TransactionsAction {
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
type Action = {
    nom: string;
    idAction: string;
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
    const [chargementRequete, setChargementRequete] = useState<boolean>(false);
    const [idLigneTransactionVenteSurvolee, setIdLigneTransactionVenteSurvolee] = useState<number>(-1);
    const [idLigneTransactionAchatSurvolee, setIdLigneTransactionAchatSurvolee] = useState<number>(-1);
    const [attenteSuppression, setAttenteSuppression] = useState<boolean>(false);

    // const [typeModal, setTypeModal] = useState<"ajouterVente" | "problemeSuppressionAchat" | "ajouterAchat" | null>(null);
    const [typeModal, setTypeModal] = useState<string | null>(null);
    const [action, setAction] = useState<string | null>(null);

    const [valeurCle, setValeurCle] = useState<number>(0);
    const [premierTrade, setPremierTrade] = useState<string | null>(null);
    const [requeteFinie, setRequeteFinie] = useState<boolean>(false);
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
        setActions(Object.values(resultats));

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
                console.log(action);
                const reponse = await requete({ url: `/bourse/recuperation-premier-trade?ticker=${action}` });
                setPremierTrade(reponse);
            }
        };
        recuperationPremierTrade();
    }, [action]);

    // Pour récuperer les nouvelles données suite a l'achat
    useEffect(() => {
        if (requeteFinie) {
            miseEnFormeContenuPortefeuille({});
            setValeurCle((prev) => prev + 1);
        }
    }, [requeteFinie]);

    if (chargement || !actions || !donnees || !donneesDetail || !pagePrete) return <Chargement />;

    return (
        <main className="Portefeuille">
            <h1 id="titre">{donnees.nom}</h1>
            {donnees.listeTransactions.length == 0 ? (
                <p id="pAucuneTransaction">Aucune transaction enregistrée.</p>
            ) : (
                <>
                    {donnees.valorisation !== "Calcul impossible" && (
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
                                                            <td className="colonneCentrer">{transaction.prix * transaction.quantite + " " + action.devise}</td>
                                                            <td>
                                                                <RendementAction mode={"defini"} valeur={Number(transaction.gainTransactionPourcent)} rendementDevise={Number(transaction.gainTransactionValeur)} />
                                                            </td>
                                                            <td
                                                                onClick={async () => {
                                                                    if (idLigneTransactionAchatSurvolee == index) {
                                                                        let nbrActionsVendue = 0;
                                                                        const actionsVendue = detailsTransactions.filter((transaction) => transaction.type == "vente");
                                                                        for (const t of actionsVendue) {
                                                                            nbrActionsVendue += t.quantite;
                                                                        }
                                                                        const nombreActionsRestante = action.quantiteTotale - transaction.quantite;
                                                                        if (nombreActionsRestante !== 0 && nombreActionsRestante < transaction.quantite) {
                                                                            setTypeModal("problemeSuppressionAchat");
                                                                            setAfficherModal(true);
                                                                        } else {
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
                                                                    }
                                                                }}
                                                            >
                                                                {idLigneTransactionAchatSurvolee == index && <>{attenteSuppression ? <Loader2 className="chargement" /> : <Trash2 />}</>}
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

                    <Modal estOuvert={afficherModal} fermeture={() => setAfficherModal(false)} taille={typeModal == "ajouterAchat" ? 650 : null}>
                        {typeModal == "ajouterVente" && (
                            <div id="divEnregistrerVente">
                                <h2>Enregistrer une vente</h2>
                                <form
                                    onSubmit={async (e) => {
                                        e.preventDefault();
                                        setChargementRequete(true);
                                        const quantite = e.currentTarget.querySelector<HTMLInputElement>("#inputQuantite")?.value;
                                        const prix = e.currentTarget.querySelector<HTMLInputElement>("#inputPrix")?.value;
                                        const date = e.currentTarget.querySelector<HTMLInputElement>("#inputDate")?.value;
                                        const contenuRequete = {
                                            quantite,
                                            prix,
                                            date,
                                            idAction: detailsModal.idAction,
                                            idPortefeuille: id,
                                        };

                                        const reponse = await requete({ url: "/portefeuille/enregistrer-vente", methode: "POST", corps: contenuRequete });
                                        // il faut que je m'occupe de trier les erreurs que peut me retourner le back

                                        const action = await miseEnFormeContenuPortefeuille({ idAction: detailsModal.idAction });
                                        setDetailsTransactions(action![0].transactions);

                                        setValeurCle((prev) => prev + 1);
                                        // je doit ajouter le reloader au autre élément (suppression vente et achat)

                                        setTimeout(() => {
                                            setChargementRequete(false);
                                        }, 200);
                                    }}
                                >
                                    <div id="divDonneesFormulaires">
                                        <ChampDonneesForm id="nomAction" label="Nom de l'action :" typeInput="text" value={detailsModal.nom} modificationDesactiver={true} />
                                        <ChampDonneesForm id="inputQuantite" label="Quantité :" typeInput="number" />
                                        <ChampDonneesForm id="inputPrix" label="Prix :" typeInput="number" />
                                        <ChampDonneesForm label="Date :" typeInput="date" id="inputDate" />
                                    </div>
                                    <div id="divBoutonEnregistrer">
                                        <button type="submit" className="bouton">
                                            {chargementRequete ? (
                                                <>
                                                    <Loader2 className="chargement" />
                                                    <span>Chargement ...</span>
                                                </>
                                            ) : (
                                                "Enregistrer"
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
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
                                    <>
                                        <h2>Ajouter un achat</h2>
                                        <RechercheAction action={action} setAction={setAction} />
                                    </>
                                ) : (
                                    <>
                                        <AjouterAchat setAfficherModal={setAfficherModal} setTypeDonneeModal={setTypeModal} ticker={action} typeAchat="portefeuille" premierTrade={premierTrade} idPortefeuille={id} setRequeteFinie={setRequeteFinie} />
                                    </>
                                )}
                            </div>
                        )}
                    </Modal>
                </>
            )}
        </main>
    );
}
