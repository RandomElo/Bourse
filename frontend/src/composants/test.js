{
    typeDonneeModal == "enregistrementAction" && (
        <div id="divEnregistrementAction">
            <h2>Ajouter un achat</h2>
            <div id="divContenu">
                {listePortefeuille && listePortefeuille.length > 0 ? (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            console.log(donneesFormulaire);
                            // await requete({url:"/portefeuille"})
                        }}
                    >
                        <select
                            id="selectNomPortefeuille"
                            defaultValue=""
                            required
                            onChange={(e) => {
                                setDonneeFormulaire(e.target.selectedIndex);
                            }}
                        >
                            <option value="" disabled>
                                -- Séléctionner un portefeuille --
                            </option>
                            {listePortefeuille.map((portefeuille, index) => (
                                <option key={index} value={portefeuille.id}>
                                    {portefeuille.nom}
                                </option>
                            ))}
                        </select>
                        <button type="submit" className="bouton">
                            Ajouter
                        </button>
                    </form>
                ) : (
                    <p id="pAucunPortefeuille">Vous n'avez aucun portefeuille</p>
                )}
                <p
                    id="pCreationPortefeuille"
                    onClick={() => {
                        console.log("je suis ici");
                        setErreurFormModal(null);
                        setTypeDonneeModal("creationPortefeuille");
                    }}
                >
                    Crée un portefeuille
                </p>
            </div>
        </div>
    );
}


    #divEnregistrementAction {
        text-align: center;
        #divContenu {
            display: flex;
            flex-direction: column;
            align-items: center;
            form {
                display: flex;
                flex-direction: column;
                align-items: center;
                select {
                    margin-top: 5px;
                    margin-bottom: 10px;
                }

            }
            #pAucunPortefeuille {
                margin-top: 15px;
                margin-bottom: 30px;
            }
            #pCreationPortefeuille {
                margin-top: 10px;
                font-weight: bold;
                text-decoration: underline;
                color: #0085ff;
            }
        }
    }