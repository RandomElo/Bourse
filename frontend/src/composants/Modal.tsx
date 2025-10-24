import { X } from "lucide-react";
import "../styles/composants/Modal.css";
import { type ReactNode } from "react";

interface Props {
    estOuvert: boolean;
    children?: ReactNode;
    fermeture: () => void;
}
export default function Modal({ estOuvert, fermeture, children }: Props) {
    if (!estOuvert) return null;
    return (
        <div className="Modal" onClick={fermeture}>
            <div className="modalContenu" onClick={(e) => e.stopPropagation()}>
                <X className="boutonFermer" width={30} height={30} />
                <div>{children}</div>
            </div>
        </div>
    );
}
