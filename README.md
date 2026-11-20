# Fanorona — Madagasikara

Une expérience web responsive autour du Fanorona, jeu de stratégie traditionnel malagasy. Le projet propose un plateau 3D interactif, trois formats de jeu et une interface en malagasy, français et anglais.

## Lancer le projet

```bash
npm install
npm start
```

Pour vérifier l’application et ses règles :

```bash
npm test -- --watchAll=false --runInBand
npm run build
```

## Jouer

- **Fanoron-telo** : plateau 3 × 3, 3 pions placés à tour de rôle par joueur ; aligner ses trois pions gagne, sinon la partie continue par déplacement.
- **Fanoron-dimy** : plateau 5 × 5, 12 pions par joueur.
- **Fanoron-tsivy** : plateau 9 × 5, 22 pions par joueur.
- Choisir une partie contre l’IA ou à deux sur le même appareil. Le niveau de l’IA repose sur Minimax avec élagage alpha-bêta.
- Cliquer sur un pion pour voir ses déplacements légaux, puis sur une intersection en surbrillance pour jouer.

## Règles intégrées

Au Fanoron-telo, chaque joueur place d’abord ses trois pions à tour de rôle. Aligner les trois pions fait gagner ; si personne n’y parvient pendant le placement, le jeu continue avec des déplacements. Dans les autres variantes, les déplacements suivent les lignes orthogonales et diagonales tracées sur le plateau. Une prise est obligatoire dès qu’elle est disponible : en **approche**, le joueur prend les pions adverses contigus après le point d’arrivée ; en **retrait**, il prend ceux contigus derrière son point de départ. La prise peut se poursuivre avec le même pion tant qu’une nouvelle prise est possible, sans revenir sur une intersection déjà visitée pendant cette séquence. La partie est gagnée en prenant tous les pions adverses ou en bloquant leurs déplacements.

Les règles de prise s’inspirent du Fanorona traditionnel ; certaines variantes régionales peuvent différer.

## Technologies

React, Three.js et CSS responsive. Le plateau et les pions sont rendus en 3D dans le navigateur.
