import e from "express";
import { creation, enregistrerAchat, recupererListe } from "../controleurs/portefeuille.js";
import { autorisationAcces } from "../middlewares/autorisationAcces.js";

const routeurPortefeuille = e.Router();

routeurPortefeuille.post("/creation", autorisationAcces, creation);
routeurPortefeuille.get("/liste", autorisationAcces, recupererListe);
routeurPortefeuille.post("/enregistrer-achat", autorisationAcces, enregistrerAchat);

export default routeurPortefeuille;
