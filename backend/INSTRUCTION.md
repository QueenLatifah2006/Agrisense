# AgriSense AI - Instructions de Lancement

## Lancement du Backend (Node.js/Express)

L'erreur `MODULE_NOT_FOUND` que vous avez rencontrée est due au fait que le projet utilise **TypeScript**. Vous ne pouvez pas lancer `node index.ts` directement sans le compiler ou utiliser un exécuteur spécialisé.

### Option 1 : Utiliser le script configuré (Recommandé)
À la racine du projet (là où se trouve le fichier `package.json`), lancez :
```bash
npm install
npm run dev:backend
```
Cela utilise `tsx` pour gérer le TypeScript et la résolution des modules ESM.

### Option 2 : Lancer manuellement avec npx (si vous êtes dans le dossier backend)
Si vous préférez lancer depuis le dossier `backend`, utilisez :
```bash
# Depuis la racine du projet :
npx tsx backend/src/index.ts

# OU si vous êtes DANS le dossier backend :
npx tsx src/index.ts
```
**Important** : Ne lancez pas `node src/index.ts` directement car Node ne résoudra pas automatiquement les imports `.ts` mappés en `.js` dans le code source sans le loader `tsx`.

## Configuration de la Base de Données
Assurez-vous que votre base de données PostgreSQL est lancée et que les variables d'environnement dans votre fichier `.env` sont correctes.
- `DATABASE_URL` doit pointer vers votre instance PostgreSQL.
- Exécutez le script SQL se trouvant dans `backend/scripts/init.sql` pour créer les tables nécessaires.

## Lancement de l'application Flutter
```bash
cd flutter_app
flutter run -d chrome
```

---
Toutes les données statiques (Jean-Luc, Jean-Marc, etc.) ont été retirées et remplacées par des appels dynamiques à l'API.
