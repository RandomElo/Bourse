import { DataTypes } from "sequelize";

export default function (bdd) {
    const Transaction = bdd.define("Transactions", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        type: {
            type: DataTypes.ENUM("achat", "vente"),
            allowNull: false,
        },
        quantite: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        prix: {
            type: DataTypes.DECIMAL(20, 8),
            allowNull: false,
        },
        date: {
            type: DataTypes.STRING(10),
            allowNull: false,
        },
        gainValeur: {
            type: DataTypes.DECIMAL(20, 8),
        },
        gainPourcentage: {
            type: DataTypes.DECIMAL(20, 8),
        },
    });
    return Transaction;
}
