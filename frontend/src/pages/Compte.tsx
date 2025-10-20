import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useEffect } from "react";

export default function Compte() {
    const { estAuth } = useAuth();
    const navigation = useNavigate();

    useEffect(() => {
        if (!estAuth) {
            navigation("/");
        }
    }, [estAuth]);

    return (
        <main className="Compte">
            <h1>Mon compte</h1>
        </main>
    );
}
