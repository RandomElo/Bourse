import { X } from "lucide-react";
import "../styles/composants/Modal.css";
import { type ReactNode } from "react";

interface Props {
    estOuvert: boolean;
    children?: ReactNode;
    fermeture: () => void;
    taille?: number | null;
}
export default function Modal({ estOuvert, fermeture, children, taille }: Props) {
    if (!estOuvert) return null;
    return (
        <div className="Modal" onClick={fermeture}>
            <div className="modalContenu" onClick={(e) => e.stopPropagation()} style={{ width: taille ? taille : undefined }}>
                <X className="boutonFermer" width={30} height={30} onClick={fermeture} />
                <div>{children}</div>
            </div>
        </div>
    );
}
