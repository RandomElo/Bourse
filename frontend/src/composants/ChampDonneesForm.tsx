import { Eye, EyeOff } from "lucide-react";
import "../styles/composants/ChampDonneesForm.css";
import { useState } from "react";
export default function ChampDonneesForm({ id, label, typeInput = "text", placeholder, onBlur, min, value, pas = 1, modificationDesactiver = false }: { id: string; label: string; placeholder?: string; typeInput?: "text" | "password" | "number" | "date"; onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void; min?: string; value?: string; pas?: number; modificationDesactiver?: boolean }) {
    const [afficherMdp, setAfficherMdp] = useState<boolean>(false);
    return (
        <div id={"div" + id} className="ChampDonneesForm">
            <label htmlFor={id}>{label}</label>
            {typeInput === "password" && (
                <div id="divInputMdp">
                    <input type={afficherMdp ? "texte" : "password"} id={id} className="input" placeholder={placeholder} onBlur={onBlur} required defaultValue={value} />
                    {afficherMdp ? <EyeOff color="#bfbfbf" onClick={() => setAfficherMdp(false)} /> : <Eye color="#bfbfbf" onClick={() => setAfficherMdp(true)} />}
                </div>
            )}
            {typeInput == "number" && <input type="number" id={id} className="input" placeholder={placeholder} onBlur={onBlur} required min={1} step={pas} defaultValue={value} />}

            {typeInput == "date" && <input type="date" id={id} className="input" required min={min} max={new Date().toISOString().split("T")[0]} defaultValue={value} />}

            {typeInput == "text" && <input type="text" id={id} className="input" placeholder={placeholder} onBlur={onBlur} required defaultValue={value} disabled={modificationDesactiver} />}
        </div>
    );
}
