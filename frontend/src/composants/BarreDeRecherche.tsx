import { Loader2, Search } from "lucide-react";
import type { RefObject } from "react";

export default function BarreDeRecherche({ onChange, ref, chargement }: { onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; ref: RefObject<HTMLInputElement | null>; chargement: boolean }) {
    return (
        <div id="divInput">
            <input type="text" className="input" placeholder="Rechercher une action" onChange={onChange} ref={ref} />
            <div id="divLoader">{chargement ? <Loader2 className="chargement" /> : <Search />}</div>
        </div>
    );
}
