import e from "express";
import { autorisationAcces } from "../middlewares/autorisationAcces.js";
import { cotation, graphique, rechercheAction, recuperationPremierTrade } from "../controleurs/bourse.js";

const routeurBourse = e.Router();

routeurBourse.get("/recherche-action/:valeur", autorisationAcces, rechercheAction);
routeurBourse.get("/graphique", autorisationAcces, graphique);
routeurBourse.get("/recuperation-premier-trade", autorisationAcces, recuperationPremierTrade);
routeurBourse.get("/cotation", cotation);
export default routeurBourse;
