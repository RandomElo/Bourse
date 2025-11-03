const durees = ["1 j", "5 j", "1 m", "6 m", "1 a", "5 a", "MAX"] as const;
type DureeGraphique = (typeof durees)[number];

export default function DureeGraphique({ set, dureeGraphique, tableauDurees }: { set: React.Dispatch<React.SetStateAction<DureeGraphique>>; dureeGraphique: DureeGraphique; tableauDurees?: DureeGraphique[] }) {
    return (
        <div id="divChoixEtenduGraphique">
            {tableauDurees
                ? tableauDurees.map((duree, index) => (
                      <a key={index} className={`aDuree ${dureeGraphique === duree ? "selectionnee" : ""}`} onClick={() => set(duree)}>
                          {duree}
                      </a>
                  ))
                : durees.map((duree, index) => (
                      <a key={index} className={`aDuree ${dureeGraphique === duree ? "selectionnee" : ""}`} onClick={() => set(duree)}>
                          {duree}
                      </a>
                  ))}
        </div>
    );
}
