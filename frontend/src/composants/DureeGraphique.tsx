const tableauDuree = ["1 j", "5 j", "1 m", "6 m", "1 a", "5 a", "MAX"] as const;
type DureeGraphique = (typeof tableauDuree)[number];

export default function DureeGraphique({ set, dureeGraphique }: { set: React.Dispatch<React.SetStateAction<DureeGraphique>>; dureeGraphique: DureeGraphique }) {
    return (
        <div id="divChoixEtenduGraphique">
            {tableauDuree.map((duree, index) => (
                <a key={index} className={`aDuree ${dureeGraphique === duree ? "selectionnee" : ""}`} onClick={() => set(duree)}>
                    {duree}
                </a>
            ))}
        </div>
    );
}
