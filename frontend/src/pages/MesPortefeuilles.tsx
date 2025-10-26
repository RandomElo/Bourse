import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../styles/MesPortefeuilles.css";
import { useEffect, useState } from "react";
import { useRequete } from "../fonctions/requete";
export default function MesPortefeuilles() {
    const navigation = useNavigate();
    const { estAuth, chargement } = useAuth();
    const requete = useRequete();
    const [donnees, setDonnees] = useState();

    // Veification de l'auhtentification
    useEffect(() => {
        if (!estAuth) {
            navigation("/connexion");
        }
    }, [estAuth, navigation]);

    useEffect(() => {
        const recuperationDonnees = async () => {
            const reponse = await requete({ url: "/portefeuille/recuperer-portefeuille-transaction" });
            setDonnees(reponse);
        };
        recuperationDonnees();
    }, []);

    if (chargement) {
        return null;
    }

    return (
        <main className="MesPortefeuilles">
            <h1 id="titre">Mes portefeuilles</h1>
        </main>
    );
}
