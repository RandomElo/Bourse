import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useRequete } from "../fonctions/requete";

interface AuthContextType {
    estAuth: boolean;
    chargement: boolean;
    deconnexion: () => Promise<void>;
    verificationConnexion: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [chargement, setChargement] = useState(true);
    const [auth, setAuth] = useState(false);
    const requete = useRequete();

    const verificationConnexion = async () => {
        const reponse = await requete({ url: "/utilisateur/verification" });
        setAuth(reponse);
        setChargement(false);
    };

    useEffect(() => {
        verificationConnexion();
        const interval = setInterval(verificationConnexion, 2 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const deconnexion = async () => {
        await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
        setUser(null);
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
