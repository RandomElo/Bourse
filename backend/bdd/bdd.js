import { Sequelize } from "sequelize";
import Utilisateur from "./modeles/Utilisateur.js";
import Erreur from "./modeles/Erreur.js";
import fs from "fs";
import Action from "./modeles/Action.js";
import Portefeuille from "./modeles/Portefeuille.js";
import Transaction from "./modeles/Transaction.js";

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
    Portefeuille: Portefeuille(sequelize),
    Transaction: Transaction(sequelize),
};

// Définitions des relations
bdd.Action.hasMany(bdd.Transaction, { foreignKey: "idAction", onDelete: "CASCADE" });
bdd.Transaction.belongsTo(bdd.Action, { foreignKey: "idAction" });

bdd.Portefeuille.hasMany(bdd.Transaction, { foreignKey: "idPortefeuille", onDelete: "CASCADE" });
bdd.Transaction.belongsTo(bdd.Portefeuille, { foreignKey: "idPortefeuille" });

bdd.Utilisateur.hasMany(bdd.Portefeuille, { foreignKey: "idUtilisateur", onDelete: "CASCADE" });
bdd.Portefeuille.belongsTo(bdd.Utilisateur, { foreignKey: "idUtilisateur" });

const existanceBdd = fs.existsSync(cheminBDD);
if (!existanceBdd) {
    await bdd.sequelize.sync({ force: true });
    console.log("Base SQLite initialisée (première création)");
} else {
    await bdd.sequelize.sync();
}
export default bdd;
