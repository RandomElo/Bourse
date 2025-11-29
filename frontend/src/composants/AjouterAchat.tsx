import { useState } from "react";
import { useRequete } from "../fonctions/requete";
import ChampDonneesForm from "./ChampDonneesForm";
type PropsAjouterAchat = {
    setAfficherModal: React.Dispatch<React.SetStateAction<boolean>>;
    setTypeDonneeModal: React.Dispatch<React.SetStateAction<string | null>>;
    listePortefeuille?: Array<{ id: number; nom: string }> | null | undefined;
    ticker: string;
    premierTrade: string | null;
    typeAchat: "action" | "portefeuille";
    idPortefeuille?: string;
    setRequeteFinie?: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function AjouterAchat({ setAfficherModal, setTypeDonneeModal, listePortefeuille, ticker, premierTrade, typeAchat, idPortefeuille, setRequeteFinie }: PropsAjouterAchat) {
    const requete = useRequete();
    const [erreurFormModal, setErreurFormModal] = useState<string | null>(null);
    const [donneeeFormCreationPortefeuille, setDonneeFormCreationPortefeuille] = useState<{ prix?: string; nombre?: string; date?: string }>({});

    const gestionCliqueCreePortefeuille = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        const base = e.currentTarget.parentNode?.parentNode;
        const nbrAction = base?.querySelector<HTMLInputElement>("#inputNbrAction")?.value;
        const prixAction = base?.querySelector<HTMLInputElement>("#inputPrixAction")?.value;
        const dateAchat = base?.querySelector<HTMLInputElement>("#inputDateAchat")?.value;

        setDonneeFormCreationPortefeuille({ nombre: nbrAction, prix: prixAction, date: dateAchat });
        setTypeDonneeModal("creationPortefeuille");
    };

    return (
        <div id="divAjouterAchat">
            <h2>Ajouter un achat</h2>
            <form
                onSubmit={async (e) => {
                    e.preventDefault();
                    const nbrAction = e.currentTarget.querySelector<HTMLInputElement>("#inputNbrAction")?.value;
                    const prixAction = e.currentTarget.querySelector<HTMLInputElement>("#inputPrixAction")?.value;
                    const selectPortefeuille = e.currentTarget.querySelector<HTMLInputElement>("#selectNomPortefeuille")?.value;
                    const dateAchat = e.currentTarget.querySelector<HTMLInputElement>("#inputDateAchat")?.value;

                    const corpsBase = { ticker: ticker, nombre: nbrAction, prix: prixAction, date: dateAchat };

                    let corps = {};
                    if (typeAchat == "action") {
                        corps = {
                            ...corpsBase,
                            idPortefeuille: selectPortefeuille,
                        };
                    } else {
                        corps = {
                            ...corpsBase,
                            idPortefeuille,
                        };
                    }
                    const reponse = await requete({ url: "/portefeuille/enregistrer-achat", methode: "POST", corps });

                    if (reponse.erreur) {
                        setErreurFormModal(reponse.erreur);
                    } else {
                        if (typeAchat == "portefeuille" && setRequeteFinie) {
                            setRequeteFinie(true);
                        }
                        setAfficherModal(false);
                    }
                }}
            >
                <div id="divChamps">
                    <ChampDonneesForm label="Nombre d'action :" typeInput="number" id="inputNbrAction" value={donneeeFormCreationPortefeuille?.nombre} />
                    <ChampDonneesForm label="Prix :" typeInput="number" id="inputPrixAction" value={donneeeFormCreationPortefeuille?.prix} pas={0.01} />
                    <ChampDonneesForm label="Date d'achat :" typeInput="date" id="inputDateAchat" min={premierTrade ? premierTrade : ""} value={donneeeFormCreationPortefeuille?.date} />

                    {typeAchat == "action" ? (
                        listePortefeuille && listePortefeuille.length > 0 ? (
                            <div id="divSelectionPortefeuille">
                                <select id="selectNomPortefeuille" defaultValue={listePortefeuille.length == 1 ? listePortefeuille[0].id : ""} required>
                                    <option value="" disabled>
                                        -- Sélectionner un portefeuille --
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
                        )
                    ) : (
                        ""
                    )}
                </div>
                {erreurFormModal && <p id="pErreurForm">{erreurFormModal}</p>}
                <button type="submit" className="bouton">
                    Enregistrer
                </button>
            </form>
        </div>
    );
}
