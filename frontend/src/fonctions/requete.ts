import { useErreur } from "../contexts/ErreurContext";

interface RequeteParametres {
    url: string;
    methode?: "GET" | "POST" | "PUT" | "DELETE";
    corps?: object;
    enTete?: Record<string, string>;
}

export function useRequete() {
    const { setErreur } = useErreur();
    return async function requete({ url, methode = "GET", corps, enTete = {} }: RequeteParametres): Promise<any> {
        try {
            const req = await fetch(`${import.meta.env.VITE_API_URL_BACKEND + url}`, {
                method: methode,
                headers: {
                    "Content-Type": "application/json",
                    ...enTete,
                },
                credentials: "include",
                body: corps ? JSON.stringify(corps) : undefined,
            });

            if (!req.ok) {
                throw new Error(`Code ${req.status} | Erreur lors de l'envoi de la requête`);
            }
            const reponse = await req.json();
            if (!reponse.etat) {
                throw new Error(reponse.detail);
            }
            return reponse.detail;
        } catch (erreur) {
            setErreur(erreur as Error);
            return null;
        }
    };
}
