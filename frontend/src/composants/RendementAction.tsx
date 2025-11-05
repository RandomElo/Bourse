import { useEffect, useState } from "react";
interface RendementActionProps {
    valeur: number;
    id?: string;
    valorisation?: number;
    mode?: "calcul" | "defini";
    rendementDevise?: number;
}
export default function RendementAction({ valeur, id, valorisation, mode, rendementDevise }: RendementActionProps) {
    const [rendementEnDevise, setRendementEnDevise] = useState<number | null>(null); // Rendement en devise
    const [rendementEnPourcentage, setRendementEnPourcentage] = useState<string | null>(null); // Rendement en pourcentage

    const miseEnForme = (valeur: number) => {
        return `${valeur > 0 ? "+" : "-"} ${Math.abs(valeur).toFixed(2)}`;
    };

    useEffect(() => {
        if (valorisation) {
            if (mode == "calcul") {
                const calcul = valorisation - (valorisation - valorisation * (valeur / 100));
                setRendementEnDevise(calcul);
            }
        }
        if (rendementDevise) {
            setRendementEnDevise(rendementDevise);
        }
        setRendementEnPourcentage(`${miseEnForme(valeur)} %`);
    }, []);

    const styleDiv = {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "10px",
    };
    const styleCard = {
        padding: "5px 7px",
        fontSize: "1.2em",
        borderRadius: "8px",
        height: "25px",
        maxWidth: "max-content",
    };

    const styleCardSelonValeur = valeur > 0 ? { color: "#137333", backgroundColor: "#e6f4ea" } : { color: "#a50e0e", backgroundColor: "#fce8e6" };
    if (!valeur) return null;
    return (
        <div id={id} style={styleDiv}>
            {rendementEnDevise && <p style={rendementEnDevise > 0 ? { color: "#137333" } : { color: "#a50e0e" }}>{miseEnForme(rendementEnDevise)}</p>}
            <p style={{ ...styleCard, ...styleCardSelonValeur }}>{rendementEnPourcentage}</p>
        </div>
    );
}
