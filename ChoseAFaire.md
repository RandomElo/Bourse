# Liste tâches
## Graphiques
- Régler la taille des tooltips sur le graphique du portefeuille  
- Vérifier la devise sur les tooltips  
- Cacher le graphique jusqu’à ce que le tracé soit chargé (éviter le re-render qui cause un bug)  

## Présentation actions
- Pourquoi quand je change de jour sela change de valorisation
- ~~Afficher un loader pour le champ de recherche d'action~~
- Corriger la valeur d’action à 0 lors de la recherche  
- ~~Ajouter une fleche retour lors de la recherche des action~~
- ~~Supprimer les actions parasites (pas beaucoup de changement, peu de volume, ...)~~
- Remettre en place un élément qui permet de séléctionner l'action au clavier 
```css
tr.ligneSelectionnee {
    outline: 1px solid #fff; /* contour visible même avec border-collapse */
    outline-offset: -1px; /* pour ne pas agrandir visuellement la ligne */
}
```
## Portefeuille
- Pouvoir rajouter des achats dans la page portefeuille
- Permettre la recherche d’actions directement depuis le portefeuille pour les ajouter  

# Formulaires
- Déterminer si les inputs de formulaire doivent être des float ou des int
- Lors de l’enregistrement d’un achat qui ne m’appartient pas, vérifier les messages retournés  
- Si je n’ai qu’un seul portefeuille, le sélectionner par défaut lors de l’enregistrement d’un achat  