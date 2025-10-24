export const accesibliteBDD = (bdd) => {
    return (req, res, next) => {
        const { sequelize, Utilisateur, Erreur, Action, HistoriquePrix, PlaceCotation } = bdd;

        req.Sequelize = sequelize;
        req.Utilisateur = Utilisateur;
        req.Erreur = Erreur;
        req.Action = Action;
        req.HistoriquePrix = HistoriquePrix;
        req.PlaceCotation = PlaceCotation;

        next();
    };
};
