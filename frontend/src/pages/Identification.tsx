import { TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ChampDonneesForm from "../composants/ChampDonneesForm";
import "../styles/Identification.css";
import { useRequete } from "../fonctions/requete";

export default function Identification({ mode }: { mode: "connexion" | "inscription" }) {
    const [erreur, setErreur] = useState<{ bloquante: boolean; detail: string } | null>();
    const { estAuth, verificationConnexion, chargement } = useAuth();
    const navigation = useNavigate();

    const requete = useRequete();
    const localisation = useLocation();

    // Si je suis déjà auth je retourne vers l'accueil
    useEffect(() => {
        if (estAuth) {
            navigation("/");
        }
    }, [estAuth, navigation]);

    // Si je change de mode d'auth alors je changer aussi
    useEffect(() => {
        setErreur(null);
    }, [localisation]);

    return (
        <main className="Identification">
            <h1 id="titre"> {mode.charAt(0).toUpperCase() + mode.slice(1)}</h1>
            <div className="ligneSeparation"></div>

            <form
                onSubmit={async (e) => {
                    e.preventDefault();

                    interface CorpsRequete {
                        mail: string;
                        mdp: string;
                    }
                    const corpsRequete: CorpsRequete = {
                        mail: document.querySelector<HTMLInputElement>("#champMail")!.value,
                        mdp: document.querySelector<HTMLInputElement>("#champMdp")!.value,
                    };

                    const reponse = await requete({ url: `/utilisateur/${mode}`, methode: "POST", corps: corpsRequete });

                    if (reponse.compte) {
                        await verificationConnexion();
                        if (!chargement) {
                            navigation("/");
                        }
                    } else {
                        setErreur({ bloquante: false, detail: reponse.detail });
                    }
                }}
            >
                <div id="divChamps">
                    <ChampDonneesForm
                        id="champMail"
                        label="Adresse mail"
                        placeholder="exemple@mail.com"
                        onBlur={(e) => {
                            const valeur = e.target.value.trim();
                            const regexMail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

                            if (valeur && !regexMail.test(valeur)) {
                                setErreur({ bloquante: true, detail: "Adresse mail invalide." });
                            } else {
                                setErreur(null);
                            }
                        }}
                    />
                    <ChampDonneesForm
                        id="champMdp"
                        label="Mot de passe"
                        typeInput="password"
                        placeholder="au moins 8 caractères"
                        onBlur={(e) => {
                            if (mode == "inscription") {
                                const valeur = e.target.value.trim();
                                const regexMdp = /^.{8,}$/;

                                if (valeur && !regexMdp.test(valeur)) {
                                    // setErreur({ bloquante: true, detail: "Mot de passe trop court ." });
                                } else {
                                    setErreur(null);
                                }
                            }
                        }}
                    />
                </div>

                {erreur && (
                    <div id="divErreurFormulaire">
                        <TriangleAlert />
                        <p id="pErreur">{erreur.detail}</p>
                    </div>
                )}

                <button type="submit" disabled={erreur?.bloquante}>
                    {mode === "connexion" ? "Se connecter" : "S'inscrire"}
                </button>
            </form>
            <div id="divChangementModeAuthentification">
                <div className="ligneSeparation"></div>
                {mode === "inscription" ? (
                    <>
                        <p>Vous avez déjà un compte ?</p>
                        <NavLink to="/connexion">Connectez vous</NavLink>
                    </>
                ) : (
                    <>
                        <p>Vous n'avez pas de compte ?</p>
                        <NavLink to="/inscription">Inscrivez vous</NavLink>
                    </>
                )}
            </div>
        </main>
    );
}
