import { DataTypes } from "sequelize";

export default function (bdd) {
    const HistoriquePrix = bdd.define("HistoriquePrix", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
      
        prix: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        horaire: {
            type: DataTypes.TIME,
            allowNull: false,
        },
    });
    return HistoriquePrix;
}
