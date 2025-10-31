import { DataTypes } from "sequelize";

export default function (bdd) {
    const HistoriquePrix = bdd.define("HistoriquePrix", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        prix: {
            type: DataTypes.FLOAT(10, 2),
            allowNull: false,
        },
    });
    return HistoriquePrix;
}
