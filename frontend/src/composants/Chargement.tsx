import "../styles/composants/Chargement.css";
export default function Chargement({ taille }: { taille?: number }) {
    return (
        <div className="Chargement" >
            <div id="divElementChargement" style={{ width: taille, height: taille }}></div>
        </div>
    );
}
