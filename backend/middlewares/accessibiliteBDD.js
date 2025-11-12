export const accesibliteBDD = (bdd) => {
    return (req, res, next) => {
        const { sequelize, Utilisateur, Erreur, Action, PlaceCotation, Portefeuille, Transaction, Recherche } = bdd;

        req.Sequelize = sequelize;
        req.Utilisateur = Utilisateur;
        req.Erreur = Erreur;
        req.Action = Action;
        req.PlaceCotation = PlaceCotation;
        req.Portefeuille = Portefeuille;
        req.Transaction = Transaction;
        req.Recherche = Recherche;

        next();
    };
};
