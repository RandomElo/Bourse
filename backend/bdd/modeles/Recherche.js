import { DataTypes } from "sequelize";

export default function (bdd) {
    const Recherche = bdd.define("Recherches", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        motCle: {
            type: DataTypes.STRING(50),
        },
        tableauIdActions: {
            type: DataTypes.JSON,
            allowNull: false,
        },
    });
    return Recherche;
}
