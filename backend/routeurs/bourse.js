import e from "express";
import { autorisationAcces } from "../middlewares/autorisationAcces.js";
import { graphique, rechercheAction } from "../controleurs/bourse.js";
const routeurBourse = e.Router();
routeurBourse.get("/recherche-action/:valeur", autorisationAcces, rechercheAction);
routeurBourse.get("/graphique", autorisationAcces, graphique);
export default routeurBourse;
