import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useRequete } from "../fonctions/requete";
import { useNavigate } from "react-router-dom";
interface AuthContextType {
    estAuth: boolean;
    chargement: boolean;
    deconnexion: () => void;
    verificationConnexion: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [chargement, setChargement] = useState(true);
    const [auth, setAuth] = useState(false);

    const verificationConnexion = async () => {
        const requete = await fetch(import.meta.env.VITE_API_URL_BACKEND + "/utilisateur/verification", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });

        const reponse = await requete.json();
        if (!reponse.etat) {
            setAuth(false);
            throw new Error(reponse.detail);
        } else {
            setAuth(reponse.detail);
        }

        setChargement(false);
    };

    useEffect(() => {
        verificationConnexion();
        const interval = setInterval(verificationConnexion, 2 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const deconnexion = () => {
        setAuth(false);
    };

    return <AuthContext.Provider value={{ estAuth: auth, chargement, verificationConnexion, deconnexion }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth doit être utilisé dans un AuthProvider");
    }
    return context;
};
