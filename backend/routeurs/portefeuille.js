import e from "express";
import { creation, enregistrerAchat, recuperationDetailsUnPortefeuille, recuperationGraphiqueValorisation, recupererListe, recupererListePortefeuilleEtTransaction, verificationAcces } from "../controleurs/portefeuille.js";
import { autorisationAcces } from "../middlewares/autorisationAcces.js";

const routeurPortefeuille = e.Router();

routeurPortefeuille.post("/creation", autorisationAcces, creation);
routeurPortefeuille.get("/liste", autorisationAcces, recupererListe);
routeurPortefeuille.post("/enregistrer-achat", autorisationAcces, enregistrerAchat);
routeurPortefeuille.get("/recuperation-portefeuilles-details", autorisationAcces, recupererListePortefeuilleEtTransaction);
routeurPortefeuille.get("/verification-acces/:id", autorisationAcces, verificationAcces);
routeurPortefeuille.get("/recuperation-details-un-portefeuille/:id", autorisationAcces, recuperationDetailsUnPortefeuille);
routeurPortefeuille.get("/recuperation-graphique-valorisation", autorisationAcces, recuperationGraphiqueValorisation);

export default routeurPortefeuille;
