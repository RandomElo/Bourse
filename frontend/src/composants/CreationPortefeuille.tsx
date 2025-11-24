import { useState } from "react";
import { useRequete } from "../fonctions/requete";
import ChampDonneesForm from "./ChampDonneesForm";
type PropsCreationPortefeuille = {
    type: "portefeuille" | "achat";
    setListePortefeuille?: React.Dispatch<React.SetStateAction<Array<{ id: number; nom: string }> | null>>;
    setTypeDonneeModal?: React.Dispatch<React.SetStateAction<"creationPortefeuille" | "achatAction" | null>>;
    setListePortefeuilleEtTransaction?: React.Dispatch<
        React.SetStateAction<Array<{
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
        }> | null>
    >;
};
export default function CreationPortefeuille({ type, setListePortefeuille, setTypeDonneeModal, setListePortefeuilleEtTransaction }: PropsCreationPortefeuille) {
    const requete = useRequete();
    const [erreurFormModal, setErreurFormModal] = useState<string | null>(null);
    return (
        <div id="divCreationPortefeuille">
            <h2>Création de portefeuille</h2>
            <form
                onSubmit={async (e) => {
                    e.preventDefault();
                    const valeur = document.querySelector<HTMLInputElement>("#champNom")!.value;
                    const reponse = await requete({ url: "/portefeuille/creation", methode: "POST", corps: { nom: valeur, type } });

                    if (type == "achat" && setListePortefeuille && setTypeDonneeModal) {
                        setListePortefeuille(reponse);
                        setTypeDonneeModal("achatAction");
                    } else if (type == "portefeuille" && setListePortefeuilleEtTransaction) {
                        setListePortefeuilleEtTransaction(reponse);
                    }
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
    );
}
