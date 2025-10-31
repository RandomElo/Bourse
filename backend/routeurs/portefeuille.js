import e from "express";
import { creation, enregistrerAchat, recuperationDetailsUnPortefeuille, recupererListe, recupererListePortefeuilleEtTransaction, verificationAcces, verificationSuiviValeurPortefeuilles } from "../controleurs/portefeuille.js";
import { autorisationAcces } from "../middlewares/autorisationAcces.js";

const routeurPortefeuille = e.Router();

routeurPortefeuille.post("/creation", autorisationAcces, creation);
routeurPortefeuille.get("/liste", autorisationAcces, recupererListe);
routeurPortefeuille.post("/enregistrer-achat", autorisationAcces, enregistrerAchat);
routeurPortefeuille.get("/recuperation-portefeuilles-detailles", autorisationAcces, recupererListePortefeuilleEtTransaction);
routeurPortefeuille.get("/verification-acces/:id", autorisationAcces, verificationAcces);
routeurPortefeuille.get("/recuperation-details-un-portefeuille/:id", autorisationAcces, recuperationDetailsUnPortefeuille);
routeurPortefeuille.get("/verification-suivi-valeurs", verificationSuiviValeurPortefeuilles);

export default routeurPortefeuille;
