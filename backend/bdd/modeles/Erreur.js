import { DataTypes } from "sequelize";

export default function (bdd) {
    const Erreur = bdd.define(
        "Erreurs",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            emplacement: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            date: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            detail: {
                type: DataTypes.JSON,
                allowNull: false,
            },
            visionner: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
        },
        {
            tableName: "Erreurs",
        }
    );
    return Erreur;
}
