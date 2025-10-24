import React, { useState, useRef, useEffect } from "react";
import * as d3 from "d3";
import { useRequete } from "../fonctions/requete";

// ------------------------------
// 🧠 1️⃣ Typage des données et props
// ------------------------------

// Chaque point du graphique correspond à une date + une valeur numérique
interface Donnee {
    date: Date;
    value: number | null;
}
interface DonneesGraphique {
    dates: Array<Date>;
    prixFermeture: Array<number>;
    nom: string;
    devise: string;
    ouverture?: string;
    fermeture?: string;
}
// Les props du composant (dimensions du SVG)
interface TestProps {
    width?: number;
    height?: number;
    donnees: DonneesGraphique | undefined;
    duree: "1j" | "5j" | "1m" | "6m" | "1a" | "5a" | "max";
}
export default function GraphiqueBourse({ width = 800, height = 400, donnees, duree }: TestProps) {
    // ------------------------------
    // ⚙️ 2️⃣ États React
    // ------------------------------
    const [data, setData] = useState<Donnee[]>([]); // Données à tracer
    const [startValue, setStartValue] = useState<{ date: Date; value: number } | null>(null); // Valeur du clic (pour afficher la variation %)
    const [hoverData, setHoverData] = useState<Donnee | null>(null); // Donnée actuellement survolée
    const [ouverture, setOuverture] = useState<Date | null>(null); // Heure d'ouverture du marché
    const [fermeture, setFermeture] = useState<Date | null>(null); // Heure de fermeture du marché
    const [devise, setDevise] = useState<string | null>(null); // Devise
    const [themeSombre, setThemeSombre] = useState<boolean>(false);
    const [erreur, setErreur] = useState<string>("");
    const svgRef = useRef<SVGSVGElement | null>(null); // Référence vers le SVG D3

    // ------------------------------
    // 📦 3️⃣ Chargement des données au montage
    // ------------------------------
    useEffect(() => {
        // Déstructuration des données
        const { dates, prixFermeture, ouverture, fermeture, devise } = donnees;

        // 🔸 Si ouverture/fermeture sont définies, on les convertit en objets Date du jour
        if (ouverture && fermeture) {
            const today = new Date(); // Aujourd'hui (utile pour tracer sur la bonne journée)

            // Découpe "HH:MM:SS" → [HH, MM, SS]
            const [hO, mO, sO] = ouverture.split(":").map(Number);
            const [hF, mF, sF] = fermeture.split(":").map(Number);

            // Construit les objets Date pour ouverture/fermeture
            const ouvertureDate = new Date(today);
            ouvertureDate.setHours(hO, mO, sO, 0);

            const fermetureDate = new Date(today);
            fermetureDate.setHours(hF, mF, sF, 0);

            // Sauvegarde dans les états
            setOuverture(ouvertureDate);
            setFermeture(fermetureDate);
        }

        setDevise(devise);

        // 🔹 Nettoyage et formatage des données reçues
        // Si certaines valeurs sont null, on garde la dernière valide
        let lastValidValue: number | null = null;
        const formattedData: Donnee[] = dates.map((d, i) => {
            const value = prixFermeture[i];
            if (value !== null && !isNaN(value)) lastValidValue = value;
            return { date: new Date(d), value: lastValidValue };
        });

        // On filtre les points sans valeur
        setData(formattedData.filter((d) => d.value !== null));

        setThemeSombre(document.documentElement.classList.contains("darkMode"));
    }, [donnees]);

    // ------------------------------
    // 📈 4️⃣ Construction du graphique D3
    // ------------------------------

    useEffect(() => {
        if (!data.length || !devise) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const margin = { top: 20, right: 50, bottom: 30, left: 50 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        // ------------------------------
        // X Scale
        // ------------------------------
        let xData: Donnee[];
        if (duree === "1j" && ouverture && fermeture) {
            xData = data; // Intraday
        } else {
            // Multi-jours : on garde tous les points pour tracer correctement les jours
            xData = data;
        }

        const xDomain = d3.extent(xData, (d) => d.date) as [Date, Date];
        // const xScale = d3.scaleTime().domain(xDomain).range([0, innerWidth]);

        // On ne veut plus de scaleTime qui garde les trous
        // On crée une échelle linéaire basée sur l’index des points
        const xScale = d3
            .scaleLinear()
            .domain([0, xData.length - 1])
            .range([0, innerWidth]);

        // ------------------------------
        // Y Scale
        // ------------------------------
        const yScale = d3
            .scaleLinear()
            .domain([(d3.min(xData, (d) => d.value!) ?? 0) * 0.95, (d3.max(xData, (d) => d.value!) ?? 0) * 1.05])
            .range([innerHeight, 0]);

        g.append("g").call(d3.axisLeft(yScale));

        // ------------------------------
        // Ligne principale
        // ------------------------------
        // const line = d3
        //     .line<Donnee>()
        //     .x((d) => xScale(d.date))
        //     .y((d) => yScale(d.value!))
        //     .curve(d3.curveMonotoneX);

        const line = d3
            .line<Donnee>()
            .x((_, i) => xScale(i)) // index au lieu de d.date
            .y((d) => yScale(d.value!))
            .curve(d3.curveMonotoneX);

        // if (duree === "1j") {
        //     // Intraday : une seule ligne
        //     g.append("path")
        //         .datum(xData)
        //         .attr("fill", "none")
        //         .attr("stroke", (xData.at(-1)?.value ?? 0) >= (xData.at(0)?.value ?? 0) ? "green" : "red")
        //         .attr("stroke-width", 2)
        //         .attr("d", line);
        // } else {
        //     // Multi-jours : une ligne par jour
        //     const dataByDay = d3.group(xData, (d) => d.date.toISOString().slice(0, 10));
        //     dataByDay.forEach((points) => {
        //         g.append("path")
        //             .datum(points)
        //             .attr("fill", "none")
        //             .attr("stroke", (points.at(-1)?.value ?? 0) >= (points.at(0)?.value ?? 0) ? "green" : "red")
        //             .attr("stroke-width", 2)
        //             .attr("d", line);
        //     });
        // }
        g.append("path")
            .datum(xData)
            .attr("fill", "none")
            .attr("stroke", (xData.at(-1)?.value ?? 0) >= (xData.at(0)?.value ?? 0) ? "green" : "red")
            .attr("stroke-width", 2)
            .attr("d", line);

        // ------------------------------
        // Axe X
        // ------------------------------
        let formatTickX: (date: Date) => string;
        if (duree === "1j") {
            formatTickX = d3.timeFormat("%H:%M");
        } else if (["5j", "1m"].includes(duree)) {
            formatTickX = d3.timeFormat("%d %b");
        } else if (["6m", "1a"].includes(duree)) {
            formatTickX = d3.timeFormat("%b");
        } else {
            formatTickX = d3.timeFormat("%Y");
        }

        // g.append("g")
        //     .attr("transform", `translate(0,${innerHeight})`)
        //     .call(
        //         d3
        //             .axisBottom(xScale)
        //             .ticks(6)
        //             .tickFormat((d) => formatTickX(d as Date) as string)
        //     );
        const tickCount = 6;
        const tickIndexes = d3.range(0, xData.length, Math.floor(xData.length / tickCount));

        g.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(
                d3
                    .axisBottom(xScale)
                    .tickValues(tickIndexes)
                    .tickFormat((i) => {
                        const d = xData[Math.floor(i)].date;
                        return formatTickX(d);
                    })
            );
        // ------------------------------
        // Overlay pour hover et clic
        // ------------------------------
        const overlay = g.append("rect").attr("width", innerWidth).attr("height", innerHeight).attr("fill", "none").attr("pointer-events", "all");

        overlay.on("click", (event) => {
            if (startValue) {
                setStartValue(null);
            } else {
                // const [x] = d3.pointer(event);
                // const closest = data.reduce((prev, curr) => (Math.abs(xScale(curr.date) - x) < Math.abs(xScale(prev.date) - x) ? curr : prev));
                // setStartValue(closest as { date: Date; value: number });

                const [x] = d3.pointer(event);
                const closestIndex = Math.round(xScale.invert(x));
                const clampedIndex = Math.max(0, Math.min(data.length - 1, closestIndex));
                const point = data[clampedIndex];
                setStartValue(startValue ? null : { date: point.date, value: point.value! });
            }
        });

        overlay.on("mousemove", (event) => {
            // const [x] = d3.pointer(event);
            // const closest = data.reduce((prev, curr) => (Math.abs(xScale(curr.date) - x) < Math.abs(xScale(prev.date) - x) ? curr : prev));
            // setHoverData(closest);
            const [x] = d3.pointer(event);
            const closestIndex = Math.round(xScale.invert(x));
            const clampedIndex = Math.max(0, Math.min(data.length - 1, closestIndex));
            setHoverData(data[clampedIndex]);
        });

        overlay.on("mouseleave", () => setHoverData(null));

        // ------------------------------
        // Ligne horizontale du clic
        // ------------------------------
        if (startValue !== null) {
            const startY = yScale(startValue.value);
            g.append("line").attr("x1", 0).attr("y1", startY).attr("x2", innerWidth).attr("y2", startY).attr("stroke", "red").attr("stroke-dasharray", "4 4");
        }

        // ------------------------------
        // Tooltip
        // ------------------------------
        if (hoverData && hoverData.value != null) {
            // const hoverX = xScale(hoverData.date);
            // const hoverY = yScale(hoverData.value);
            
            const index = data.findIndex((d) => d.date.getTime() === hoverData.date.getTime());
            if (index === -1) return; // Sécurité si le point n’existe pas
            const hoverX = xScale(index);
            const hoverY = yScale(hoverData.value);


            g.selectAll(".tooltip-group").remove();
            const tooltipGroup = g.append("g").attr("class", "tooltip-group");

            tooltipGroup.append("line").attr("x1", hoverX).attr("y1", 0).attr("x2", hoverX).attr("y2", innerHeight).attr("stroke", "gray").attr("stroke-dasharray", "3 3");

            tooltipGroup.append("circle").attr("cx", hoverX).attr("cy", hoverY).attr("r", 5).attr("fill", "orange");

            const moisListe = ["janv", "févr", "mars", "avr", "mai", "juin", "juil", "août", "sept", "oct", "nov", "déc"];
            const formatHeure = (date: Date) => {
                const jour = date.getDate();
                const mois = moisListe[date.getMonth()];
                const heures = date.getHours().toString().padStart(2, "0");
                const minutes = date.getMinutes().toString().padStart(2, "0");
                return `${jour} ${mois}. à ${heures} h ${minutes}`;
            };

            let lignes: string[] = [];
            if (startValue !== null) {
                const comparaisonPrix = hoverData.value - startValue.value;
                const delta = (comparaisonPrix / startValue.value) * 100;
                lignes.push(`${comparaisonPrix > 0 ? " + " : "- "}${Math.abs(comparaisonPrix).toFixed(2)} (${delta.toFixed(2)}%)`, `${formatHeure(startValue.date)}-${formatHeure(hoverData.date)}`);
            } else {
                lignes = [`${formatHeure(hoverData.date)}`, `${hoverData.value.toFixed(2)} ${devise}`];
            }

            const fontSizeMain = 14;
            const lineHeight = 20;
            const largeur = startValue ? 230 : 150;
            const hauteur = lignes.length * lineHeight + 10;
            let tooltipX = hoverX + 10;
            let tooltipY = hoverY - hauteur - 10;

            if (tooltipX + largeur > innerWidth) tooltipX = hoverX - largeur - 15;
            if (tooltipY < 0) tooltipY = hoverY + 15;

            tooltipGroup.append("rect").attr("x", tooltipX).attr("y", tooltipY).attr("width", largeur).attr("height", hauteur).attr("rx", 6).attr("ry", 6).attr("fill", "#2c2f33");

            lignes.forEach((txt, i) => {
                const textEl = tooltipGroup
                    .append("text")
                    .attr("x", tooltipX + 8)
                    .attr("y", tooltipY + 20 + i * lineHeight)
                    .attr("fill", "white")
                    .attr("font-size", fontSizeMain);

                if (txt.length < 15 || txt.endsWith("%)")) textEl.attr("font-weight", "bold");
                if (txt.includes(")")) {
                    textEl.attr("fill", Number(txt.split("(")[1].replace(")", "").replace("%", "")) > 0 ? (themeSombre ? "palegreen" : "mediumseagreen") : "red");
                }
                textEl.text(txt);
            });
        }
    }, [data, ouverture, fermeture, startValue, hoverData, width, height, devise]);

    // ------------------------------
    // 🧩 5️⃣ Rendu JSX (le SVG)
    // ------------------------------
    return <svg ref={svgRef} width={width} height={height}></svg>;
}
