import { useState } from "react";
import { useRequete } from "../fonctions/requete";
import ChampDonneesForm from "./ChampDonneesForm";
import { Loader2 } from "lucide-react";
import type { Action, TransactionsAction } from "../pages/Portefeuille";

type PropsAjouterVente = {
    mode: "pageAction" | "pagePortefeuille";
    nomAction: string;
    idAction?: string;
    idPortefeuille?: string;
    ticker?: string;
    setValeurCle?: React.Dispatch<React.SetStateAction<number>>;
    miseEnFormePortefeuille?: (args: { idAction?: string | null }) => Promise<Action[] | void>;
    setDetailsTransactions?: React.Dispatch<React.SetStateAction<TransactionsAction[] | null>>;
    setDonnees?: React.Dispatch<
        React.SetStateAction<{
            quantiteTotal: number;
            tableauListeVentes: Array<{
                quantite: number;
                prix: number;
                date: string;
                gainValeur: number;
                gainPourcentage: number;
            }>;
            valeurTotaleAchat: number;
        } | null>
    >;
    mesPortefeuilles?: Array<{ nom: string }> | null;
};
export default function AjouterVente({ mode, nomAction, idAction, idPortefeuille, ticker, setValeurCle, miseEnFormePortefeuille, setDetailsTransactions, setDonnees, mesPortefeuilles }: PropsAjouterVente) {
    const requete = useRequete();
    const [erreurForm, setErreurForm] = useState<string | null>(null);
    const [chargementRequete, setChargementRequete] = useState<boolean>(false);

    return (
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
                        idAction: idAction ?? ticker,
                        idPortefeuille,
                    };

                    const reponse = await requete({ url: "/portefeuille/enregistrer-vente", methode: "POST", corps: contenuRequete });

                    if (reponse.erreur) {
                        setErreurForm(reponse.erreur);
                    } else {
                        if (mode == "pagePortefeuille") {
                            const action = await miseEnFormePortefeuille!({ idAction: idAction });
                            setDetailsTransactions!([...action![0].transactions]);
                            setValeurCle!((prev) => prev + 1);
                        } else {
                            setDonnees!(reponse);
                        }
                    }

                    setTimeout(() => {
                        setChargementRequete(false);
                    }, 200);
                }}
            >
                <div id="divDonneesFormulaires">
                    <ChampDonneesForm id="nomAction" label="Nom de l'action :" typeInput="text" value={nomAction} modificationDesactiver={true} />
                    <ChampDonneesForm id="inputQuantite" label="Quantité :" typeInput="number" />
                    <ChampDonneesForm id="inputPrix" label="Prix :" typeInput="number" />
                    <ChampDonneesForm label="Date :" typeInput="date" id="inputDate" />
                    {mode == "pageAction" && mesPortefeuilles!.length > 1 && <ChampDonneesForm label="Date :" typeInput="date" id="inputDate" />}
                </div>
                {erreurForm && <p id="pErreurForm">{erreurForm}</p>}

                <div id="divBoutonEnregistrer">
                    <button type="submit" id="boutonEnregistrerVente" className="bouton">
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
    );
}
