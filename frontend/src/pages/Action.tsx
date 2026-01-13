import { useNavigate, useParams } from "react-router-dom";
import "../styles/Action.css";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";
import { useRequete } from "../fonctions/requete";
import PresentationAction from "../composants/PresentationAction";
import RendementAction from "../composants/RendementAction";

export default function Action() {
    const { ticker } = useParams();
    const { estAuth } = useAuth();
    const navigation = useNavigate();
    const requete = useRequete();

    const [afficherModalPresentationAction, setAfficherModalPresentationAction] = useState<boolean>(false);
    const [donneesPresenceActionDansPortefeuille, setDonneesPresenceActionDansPortefeuille] = useState<{
        quantiteTotal: number;
        tableauListeVentes: Array<{
            quantite: number;
            prix: number;
            date: string;
            gainValeur: number;
            gainPourcentage: number;
        }>;
        valeurTotaleAchat: number;
    } | null>(null);
    const [donneesAction, setDonneesAction] = useState<{ valorisation: number; rendement: number; devise: string; nom: string } | null>(null);
    const [gainTotal, setGainTotal] = useState<{ pourcentage: string; valeurMontetaire: number } | null>(null);
    const miseEnFormeTicker = () => {
        return ticker!.replace("_", ".");
    };

    useEffect(() => {
        if (!estAuth) {
            navigation("/connexion");
        }
    }, [estAuth, navigation]);
    useEffect(() => {
        const presenceActionDansPortefeuille = async () => {
            const reponse = await requete({ url: `/portefeuille/presence-dans-portefeuille?ticker=${miseEnFormeTicker()}` });
            if (reponse.quantiteTotal !== 0) {
                setDonneesPresenceActionDansPortefeuille(reponse);
            }
        };
        presenceActionDansPortefeuille();
    }, [ticker]);

    useEffect(() => {
        if (donneesPresenceActionDansPortefeuille && donneesAction) {
            const valoDepart = donneesPresenceActionDansPortefeuille.valeurTotaleAchat;
            const valoActuelle = donneesPresenceActionDansPortefeuille.quantiteTotal * donneesAction.valorisation;

            setGainTotal({ pourcentage: (((valoActuelle - valoDepart) / valoDepart) * 100).toFixed(2), valeurMontetaire: valoActuelle - valoDepart });
        }
    }, [donneesPresenceActionDansPortefeuille, donneesAction]);

    return (
        <main className="Action">
            <PresentationAction idComposant={miseEnFormeTicker()} afficherModal={afficherModalPresentationAction} setAfficherModal={setAfficherModalPresentationAction} setDonneesAction={setDonneesAction} />

            {donneesAction && donneesPresenceActionDansPortefeuille && gainTotal && (
                <div id="divPresenceDansPortefeuilles">
                    <div id="divPossessionActuelle">
                        <div id="divEnTete">
                            <p id="pValorisationTotale">{(donneesAction.valorisation * donneesPresenceActionDansPortefeuille.quantiteTotal).toFixed(2)} €</p>
                            <p id="pNbrActions">{donneesPresenceActionDansPortefeuille.quantiteTotal} actions</p>
                        </div>
                        <div className="divSeparation"></div>
                        <div id="divGains">
                            <div id="divGainDuJour">
                                <p id="pEnTete">Gain du jour</p>
                                <RendementAction mode={"defini"} valeur={donneesAction.rendement} rendementDevise={(donneesAction.valorisation * (1 + donneesAction.rendement / 100) - Number(donneesAction.valorisation)) * donneesPresenceActionDansPortefeuille.quantiteTotal} />
                            </div>
                            <div id="divGainTotal">
                                <p id="pEnTete">Gain total</p>
                                <RendementAction mode={"defini"} valeur={Number(gainTotal.pourcentage)} rendementDevise={gainTotal.valeurMontetaire} />
                            </div>
                        </div>
                    </div>
                    {donneesPresenceActionDansPortefeuille.tableauListeVentes.length > 0 && (
                        <div id="divVentes">
                            <p id="titre">Historique ventes</p>
                            <table id="tableauVentes">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Valeur</th>
                                        <th>Rendement</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {donneesPresenceActionDansPortefeuille.tableauListeVentes.map((vente, index) => (
                                        <tr key={index}>
                                            <td>{vente.date}</td>
                                            <td>
                                                {vente.prix * vente.quantite} {donneesAction.devise}
                                            </td>
                                            <td>
                                                <RendementAction mode={"defini"} valeur={vente.gainPourcentage} rendementDevise={vente.gainValeur} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </main>
    );
}
