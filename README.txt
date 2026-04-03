Bundle corrigé selon votre dernière consigne.

Structure livrée :
- backend/ : copie du back-end NestJS d'origine, sans modification.
- frontend/ : nouvelle base Next.js/i18n mobile-first construite sur l'architecture souhaitée (src/app, src/components, src/i18n, src/messages).

Pages front réalisées uniquement avec les APIs déjà exposées :
- /[locale]
- /[locale]/flotte
- /[locale]/agences
- /[locale]/connexion
- /[locale]/compte
- /[locale]/compte/reservations
- /[locale]/gestion-reservation

Choix volontairement NON livrés pour respecter votre contrainte :
- aucune compatibilité ajoutée côté back-end
- aucune page dépendante d'APIs non exposées publiquement (ex. politiques-age)
- aucun faux endpoint /api/* hérité de la maquette statique

Lancement conseillé :
1) back-end : démarrer NestJS sur http://localhost:3000
2) front-end : dans frontend/, copier .env.example vers .env.local si besoin puis installer les dépendances et lancer Next.js

Variable front utilisée :
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
