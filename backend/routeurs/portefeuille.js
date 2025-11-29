import e from "express";
import { creation, enregistrerAchat, enregistrerVente, modifierNomPortefeuille, recuperationDetailsUnPortefeuille, recuperationGraphiqueValorisation, recupererListe, recupererListePortefeuilleEtTransaction, suppression, suppressionTransaction, verificationAcces } from "../controleurs/portefeuille.js";
import { autorisationAcces } from "../middlewares/autorisationAcces.js";

const routeurPortefeuille = e.Router();

routeurPortefeuille.post("/creation", autorisationAcces, creation);
routeurPortefeuille.get("/liste", autorisationAcces, recupererListe);
routeurPortefeuille.post("/enregistrer-achat", autorisationAcces, enregistrerAchat);
routeurPortefeuille.get("/recuperation-portefeuilles-details", autorisationAcces, recupererListePortefeuilleEtTransaction);
routeurPortefeuille.get("/verification-acces/:id", autorisationAcces, verificationAcces);
routeurPortefeuille.get("/recuperation-details-un-portefeuille/:id", autorisationAcces, recuperationDetailsUnPortefeuille);
routeurPortefeuille.get("/recuperation-graphique-valorisation", autorisationAcces, recuperationGraphiqueValorisation);
routeurPortefeuille.post("/enregistrer-vente", autorisationAcces, enregistrerVente);
routeurPortefeuille.delete("/suppression-transaction", autorisationAcces, suppressionTransaction);
routeurPortefeuille.post("/modifier-nom", autorisationAcces, modifierNomPortefeuille);
routeurPortefeuille.delete("/supprimer", autorisationAcces, suppression);
export default routeurPortefeuille;