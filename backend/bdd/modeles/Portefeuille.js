import { DataTypes } from "sequelize";

export default function (bdd) {
    const Portefeuille = bdd.define("Portefeuilles", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        nom: {
            type: DataTypes.STRING(30),
            allowNull: false,
        },
    });
    return Portefeuille;
}
