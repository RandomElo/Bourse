import { Sequelize } from "sequelize";
import Utilisateur from "./modeles/Utilisateur.js";
import Erreur from "./modeles/Erreur.js";
import fs from "fs";
import Action from "./modeles/Action.js";
import HistoriquePrix from "./modeles/HistoriquePrix.js";

const cheminBDD = "./bdd/bdd.sqlite";

const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: cheminBDD,
    logging: false,
    define: {
        freezeTableName: true,
        timestamps: false,
    },
});
const bdd = {
    sequelize,
    Utilisateur: Utilisateur(sequelize),
    Erreur: Erreur(sequelize),
    Action: Action(sequelize),
    HistoriquePrix: HistoriquePrix(sequelize),
};

// Définitions des relations
bdd.Action.hasMany(bdd.HistoriquePrix, { foreignKey: "actionId", onDelete: "CASCADE" });
bdd.HistoriquePrix.belongsTo(bdd.Action, { foreignKey: "actionId" });

const existanceBdd = fs.existsSync(cheminBDD);
if (!existanceBdd) {
    await bdd.sequelize.sync({ force: true });
    console.log("Base SQLite initialisée (première création)");
} else {
    await bdd.sequelize.sync();
}
export default bdd;
