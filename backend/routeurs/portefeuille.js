import e from "express";
import { creation, recupererListe } from "../controleurs/portefeuille.js";
import { autorisationAcces } from "../middlewares/autorisationAcces.js";

const routeurPortefeuille = e.Router();

routeurPortefeuille.put("/creation", autorisationAcces, creation);
routeurPortefeuille.get("/liste", autorisationAcces, recupererListe);

export default routeurPortefeuille;
