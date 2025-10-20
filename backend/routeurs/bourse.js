import e from "express";
import { autorisationAcces } from "../middlewares/autorisationAcces.js";
import { rechercheAction } from "../controleurs/bourse.js";
const routeurBourse = e.Router();
routeurBourse.get("/recherche-action/:valeur", autorisationAcces, rechercheAction);
export default routeurBourse;
