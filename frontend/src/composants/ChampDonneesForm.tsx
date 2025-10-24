import { Eye, EyeOff } from "lucide-react";
import "../styles/composants/ChampDonneesForm.css";
import { useState } from "react";
export default function ChampDonneesForm({ id, label, typeInput = "text", placeholder, onBlur }: { id: string; label: string; placeholder?: string; typeInput?: "text" | "password"; onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void }) {
    const [afficherMdp, setAfficherMdp] = useState<boolean>(false);

    return (
        <div id={"div" + id} className="ChampDonneesForm">
            <label htmlFor={id}>{label}</label>
            {typeInput === "password" ? (
                <div id="divInputMdp">
                    <input type={afficherMdp ? "texte" : "password"} id={id} className="input" placeholder={placeholder} onBlur={onBlur} required />
                    {afficherMdp ? <EyeOff color="#bfbfbf" onClick={() => setAfficherMdp(false)} /> : <Eye color="#bfbfbf" onClick={() => setAfficherMdp(true)} />}
                </div>
            ) : (
                <input type={typeInput} id={id} className="input" placeholder={placeholder} onBlur={onBlur} required />
            )}
        </div>
    );
}
