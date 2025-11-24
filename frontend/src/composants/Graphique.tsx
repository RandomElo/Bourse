import React, { useEffect, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import "../styles/composants/Graphique.css";
// --- Types ------------------------------------------------------------

interface Quote {
    date: string; // format YYYY-MM-DD
    close: number;
}
interface DonneesGraphique {
    dates: Array<Date>;
    prixFermeture: Array<number>;
    nom: string;
    devise: string;
    ouverture?: string;
    fermeture?: string;
    dernierPrix?: number;
    rendement?: number;
    premierTrade?: string;
}
type DureeGraphique = "1 j" | "5 j" | "1 m" | "6 m" | "1 a" | "5 a" | "MAX";

// --- Composant principal ---------------------------------------------
const formatDate = (date: Date, format: "moisAnnee" | "dateMois" | "dateMoisAnnee" | "dateMoisHeure" | "heure") => {
    const moisListe = ["janv", "févr", "mars", "avr", "mai", "juin", "juil", "août", "sept", "oct", "nov", "déc"];

    const jour = date.getDate();
    const mois = moisListe[date.getMonth()];
    const annee = date.getFullYear();
    const heures = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    switch (format) {
        case "moisAnnee":
            return `${mois} ${annee}.`;
        case "dateMois":
            return `${jour} ${mois}.`;
        case "dateMoisAnnee":
            return `${jour} ${mois}. ${annee}`;
        case "dateMoisHeure":
            return `${jour} ${mois}. à ${heures} h ${minutes}`;
        case "heure":
            return `${heures} h ${minutes}`;
    }
};

export default function Graphique({ donnees, donneesValorisation, duree, rendement, valorisation, devise }: { donnees?: DonneesGraphique; donneesValorisation?: Array<{ date: string; valeur: number }>; duree: DureeGraphique; rendement: number; valorisation?: number | "Calcul impossible" | null; devise?: string | null }) {
    const [data, setData] = useState<Quote[]>([]);
    const [indiceFixe, setIndiceFixe] = useState<string | null>(null);
    const [indiceSurvol, setIndiceSurvol] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            if (donnees) {
                let dernierPrixValide: number;
                const donneesFiltree = donnees.dates.map((dateStr: Date, index: number) => {
                    const prix = donnees.prixFermeture[index];
                    if (prix != null) {
                        dernierPrixValide = prix;
                    }
                    return {
                        date: new Date(dateStr).toISOString(),
                        close: dernierPrixValide,
                    };
                });
                setData(donneesFiltree);
            } else if (donneesValorisation) {
                const donneesFiltree = donneesValorisation.map((element) => {
                    return {
                        date: new Date(element.date).toISOString(),
                        close: element.valeur,
                    };
                });
                setData(donneesFiltree);
            }
        })();
    }, [donnees, donneesValorisation]);

    const CustomTooltip: React.FC<{
        active?: boolean;
        payload?: { payload: Quote }[];
        label?: string;
    }> = ({ active, payload, label }) => {
        if (!active || !payload || !payload.length) return null;
        const data = payload[0].payload as Quote;

        // Mise en forme de la date

        if (difference) {
            const date1 = new Date(difference.de);
            const date2 = new Date(difference.a);

            const memeAnnee = date1.getFullYear() === date2.getFullYear();
            const typeDate = memeAnnee ? "dateMois" : "dateMoisAnnee";

            const date =
                date1 > date2 ? (
                    <p>
                        {formatDate(date2, typeDate)} - {formatDate(date1, typeDate)}
                    </p>
                ) : (
                    <p>
                        {formatDate(date1, typeDate)} - {formatDate(date2, typeDate)}
                    </p>
                );
            return (
                <div className="tooltipDifference">
                    {valorisation != "Calcul impossible" && (
                        <p className={Number(difference.delta) > 0 ? "positif" : "negatif"}>
                            {Number(difference.delta) > 0 ? "+" : "-"} {Math.abs(Number(difference.delta))} {devise || donnees?.devise} ({difference.pourcentage}%)
                        </p>
                    )}
                    {date}
                </div>
            );
        } else {
            return (
                <div className={`tooltipBasique duree${duree.replace(" ", "")}`}>
                    {valorisation !== "Calcul impossible" && (
                        <p id="prix">
                            {data.close.toFixed(2)} {donnees?.devise || devise}
                        </p>
                    )}

                    {label && duree == "1 j" && <p id="date">{formatDate(new Date(label), "heure")}</p>}
                    {label && duree == "5 j" && <p id="date">{formatDate(new Date(label), "dateMoisHeure")}</p>}
                    {label && duree == "1 m" && <p id="date">{formatDate(new Date(label), "dateMois")}</p>}
                    {label && (duree == "6 m" || duree == "1 a" || duree == "5 a" || duree == "MAX") && <p id="date">{formatDate(new Date(label), "dateMoisAnnee")}</p>}
                </div>
            );
        }
    };

    const difference = useMemo(() => {
        if (indiceFixe && indiceSurvol && data[Number(indiceFixe)] && data[Number(indiceSurvol)]) {
            const donneeA = data[Number(indiceFixe)];
            const donneeB = data[Number(indiceSurvol)];
            const delta = donneeB.close - donneeA.close;
            const pourcentage = ((delta / donneeA.close) * 100).toFixed(2);

            return { delta: delta.toFixed(2), pourcentage, de: donneeA.date, a: donneeB.date };
        } else {
            return null;
        }
    }, [indiceFixe, indiceSurvol, data]);

    return (
        <div className="Graphique">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={data}
                    onClick={(e) => {
                        if (e && typeof e.activeTooltipIndex === "string") {
                            if (indiceFixe) {
                                setIndiceFixe(null);
                            } else {
                                setIndiceFixe(e.activeTooltipIndex);
                            }
                        }
                    }}
                    onMouseMove={(e) => {
                        if (e && typeof e.activeTooltipIndex === "string" && indiceFixe) {
                            setIndiceSurvol(e.activeTooltipIndex);
                        }
                    }}
                >
                    <CartesianGrid horizontal={true} vertical={false} stroke="#d0d0d0ff" />
                    <XAxis
                        dataKey="date"
                        tickFormatter={(dateStr: string) => {
                            if (duree == "1 j") return formatDate(new Date(dateStr), "heure");

                            if (new Date(data[0].date).getFullYear() == new Date(data[data.length - 1].date).getFullYear()) {
                                return formatDate(new Date(dateStr), "dateMois");
                            } else {
                                return formatDate(new Date(dateStr), "moisAnnee");
                            }
                        }}
                        interval={Math.floor(data.length / 6)}
                    />
                    <YAxis domain={["auto", "auto"]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="close" stroke={rendement > 0 ? "#137333" : "#a50e0e"} dot={false} strokeWidth={2} isAnimationActive={false} />

                    {indiceFixe && (
                        <ReferenceLine
                            x={data[Number(indiceFixe)].date}
                            // stroke="#ffcc00"
                            stroke="red"
                            strokeDasharray="3 3"
                            label={{
                                value: "Point A",
                                position: "top",
                                // fill: "#ffcc00",
                                fill: "red",
                            }}
                        />
                    )}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
