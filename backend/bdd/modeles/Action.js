import { DataTypes } from "sequelize";

export default function (bdd) {
    const Action = bdd.define("Actions", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        nom: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        ticker: {
            type: DataTypes.STRING(30),
            allowNull: false,
        },
        placeCotation: {
            type: DataTypes.STRING(30),
        },
        secteur: {
            type: DataTypes.STRING(30),
        },
        industrie: {
            type: DataTypes.STRING(30),
        },
        ouverture: {
            type: DataTypes.TIME,
        },
        fermeture: {
            type: DataTypes.TIME,
        },
        devise: {
            type: DataTypes.STRING(5),
            allowNull: false,
        },
        premierTrade: {
            type: DataTypes.TIME,
        },
    });
    return Action;
}
