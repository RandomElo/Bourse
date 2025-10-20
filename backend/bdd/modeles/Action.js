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
            type: DataTypes.STRING(255),
            allowNull: false,
        },
    });
    return Action;
}
