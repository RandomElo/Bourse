export default function gestionErreur(action, emplacement, detailReponse) {
    return async (req, res, next) => {
        try {
            await action(req, res, next);
        } catch (erreur) {
            console.error(erreur);
            await req.Erreur.create({
                emplacement: emplacement,
                detail: JSON.stringify({ nom: erreur.name, message: erreur.message, stack: erreur.stack }),
            });
            res.json({ operation: false, detail: detailReponse });
        }
    };
}
