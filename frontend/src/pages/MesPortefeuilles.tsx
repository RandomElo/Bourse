import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../styles/MesPortefeuilles.css";
import React, { useEffect, useState } from "react";
import { useRequete } from "../fonctions/requete";
import { ArrowRight, Pencil, Plus, Trash2 } from "lucide-react";
import RendementAction from "../composants/RendementAction";
import Modal from "../composants/Modal";
import CreationPortefeuille from "../composants/CreationPortefeuille";
import ChampDonneesForm from "../composants/ChampDonneesForm";

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
    const [modifierPortefeuilles, setModifierPortefeuilles] = useState<boolean>(false);
    const [typeModal, setTypeModal] = useState<string>("");
    const [donneesModal, setDonneesModal] = useState<{ id: number; nom: string } | null>(null);
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
                    <>
                        <table id="tableauPresentationPortefeuilles" className={!modifierPortefeuilles ? "tableauTailleNormal" : "tableauTailleModifications"}>
                            <thead>
                                <tr>
                                    <th className="celluleNom">Nom</th>
                                    {!modifierPortefeuilles ? (
                                        <>
                                            <th className="celluleGain">Gain du jour</th>
                                            <th className="celluleValorisation">Valorisation</th>
                                            <th className="celluleLienDetail"></th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="celluleModifierNom">Modifier nom</th>
                                            <th className="celluleSupprimer">Supprimer</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {donnees.map((portefeuille, index) => (
                                    <tr key={portefeuille.id} className={ligneSurvolee == portefeuille.id ? "survolee" : ""}>
                                        <td className="celluleNom">{portefeuille.nom}</td>

                                        {!modifierPortefeuilles ? (
                                            <>
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
                                            </>
                                        ) : (
                                            <>
                                                <td className="celluleModifierNom">
                                                    <Pencil
                                                        id="icone"
                                                        onClick={() => {
                                                            setTypeModal("modifierNom");
                                                            setDonneesModal({ id: portefeuille.id, nom: portefeuille.nom });
                                                            setAfficherModal(true);
                                                        }}
                                                    />
                                                </td>
                                                <td className="celluleSupprimer">
                                                    <Trash2
                                                        id="icone"
                                                        onClick={async () => {
                                                            await requete({ url: `/portefeuille/supprimer`, methode: "DELETE", corps: { id: portefeuille.id } });

                                                            setDonnees((prev) => prev!.filter((item) => item.id !== portefeuille.id));
                                                            setModifierPortefeuilles(false);
                                                        }}
                                                    />
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                                {!modifierPortefeuilles && (
                                    <tr className={`trAjouterPortefeuille ${ligneSurvolee == -1 && "survolee"}`}>
                                        <td></td>
                                        <td colSpan={2} id="tdTexte">
                                            Ajouter un portefeuille
                                        </td>
                                        <td
                                            id="tdIcone"
                                            onMouseEnter={() => setLigneSurvolee(-1)}
                                            onMouseLeave={() => setLigneSurvolee(null)}
                                            onClick={() => {
                                                setTypeModal("creePortefeuille");
                                                setAfficherModal(true);
                                            }}
                                        >
                                            <Plus />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        {!modifierPortefeuilles ? (
                            <button id="boutonModifierPortefeuilles" className="bouton" onClick={() => setModifierPortefeuilles(true)}>
                                Modifier les portefeuilles
                            </button>
                        ) : (
                            <button id="boutonModifierPortefeuilles" className="bouton" onClick={() => setModifierPortefeuilles(false)}>
                                Sortir des modifications
                            </button>
                        )}
                    </>
                ) : (
                    <div id="divAucunPortefeuille">
                        <p>Vous n'avez aucun portefeuille enregistré.</p>
                        <a
                            className="bouton"
                            onClick={() => {
                                setTypeModal("creePortefeuille");
                                setAfficherModal(true);
                            }}
                        >
                            Ajouter portefeuille
                        </a>
                    </div>
                )}
                <Modal estOuvert={afficherModal} fermeture={() => setAfficherModal(false)}>
                    {typeModal == "creePortefeuille" && <CreationPortefeuille type="portefeuille" setListePortefeuilleEtTransaction={setDonnees} />}
                    {typeModal == "modifierNom" && (
                        <div id="divEnregistrerVente">
                            <h2>Modifier le nom</h2>
                            <form
                                onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
                                    e.preventDefault();
                                    const nom = e.currentTarget.parentNode!.querySelector<HTMLInputElement>("input")!.value;
                                    if (nom == donneesModal?.nom) {
                                        setAfficherModal(false);
                                    } else {
                                        const corps = {
                                            nom,
                                            id: donneesModal?.id,
                                        };

                                        await requete({ url: `/portefeuille/modifier-nom`, methode: "POST", corps });

                                        setDonnees((prev) => prev!.map((item) => (item.id === Number(donneesModal?.id) ? { ...item, nom: nom } : item)));
                                        setModifierPortefeuilles(false);
                                        setAfficherModal(false);
                                    }
                                }}
                            >
                                <ChampDonneesForm id="nouveauNom" label="Nouveau nom :" placeholder={donneesModal?.nom} />
                                <button type="submit" className="bouton">
                                    Enregistrer
                                </button>
                            </form>
                        </div>
                    )}
                </Modal>
            </main>
        );
    }
}
