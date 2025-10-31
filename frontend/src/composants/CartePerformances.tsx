import "../styles/composants/CartePerformances.css";
interface GainObjet {
    valeurMonetaire: number;
    valeurPourcentage: number;
}
export default function CartePerformances({ gainDuJour, gainTotal, devise }: { gainDuJour: GainObjet; gainTotal: GainObjet; devise?: string | null }) {
    return (
        <div className="CartePerformances">
            <p className="titre">Performances</p>
            <div className="divCartesPerformances">
                <div className="divGainDuJour">
                    <p className="titreCarte">Gain du jour</p>
                    <div className={`divCarte ${gainDuJour.valeurMonetaire > 0 ? " positif" : " negatif"}`}>
                        <p>{Math.abs(gainDuJour.valeurMonetaire).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " " + devise}</p>
                        <p>{gainDuJour.valeurPourcentage + " " + "%"}</p>
                    </div>
                </div>
                <div className="divGainTotal">
                    <p className="titreCarte">Gain total</p>
                    <div className={`divCarte ${gainTotal.valeurMonetaire > 0 ? " positif" : " negatif"}`}>
                        <p>
                            {gainTotal.valeurMonetaire > 0 ? "+ " : "- "}
                            {Math.abs(gainTotal.valeurMonetaire).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " " + devise}
                        </p>
                        <p>{gainTotal.valeurPourcentage + " " + "%"}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
