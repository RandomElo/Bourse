import e from "express";
import { connexion, inscription, verificationAuthentification } from "../controleurs/utilisateur.js";

const routeurUtilisateur = e.Router();

routeurUtilisateur.get("/verification", verificationAuthentification);
routeurUtilisateur.post("/connexion", connexion);
routeurUtilisateur.post("/inscription", inscription);

export default routeurUtilisateur;
