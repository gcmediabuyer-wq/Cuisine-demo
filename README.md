# Landing pages — media buying (tracking Pixel + Conversions API)

Structure pensée pour pouvoir enchaîner plusieurs landing pages sans
repartir de zéro à chaque fois : **un seul site Netlify, une fonction de
tracking partagée, une nouvelle landing page = juste un nouveau dossier.**

```
site/
├── pages/
│   └── atelier-cuisines-paris/   ← une landing page = un dossier
│       ├── index.html
│       └── assets/
├── netlify/functions/capi.js     ← partagé par toutes les pages
├── netlify.toml
├── deploy.sh                     ← la seule commande à retenir
└── .env.example
```

Chaque dossier dans `pages/` devient automatiquement une URL : avec un site
nommé `monsite.netlify.app`, `pages/atelier-cuisines-paris/` sort sur
`monsite.netlify.app/atelier-cuisines-paris/`.

## Mise en place (une seule fois)

1. Remplir le Pixel ID dans chaque `index.html` (`PIXEL_ID_ICI`, 2 endroits)
   — en général le **même pixel** pour toutes les campagnes d'un même
   client, donc à faire une fois par client, pas par page.
2. Dans Meta Events Manager → le pixel → Conversions API → générer un
   **token d'accès système**.
3. `./deploy.sh` — la première fois, ça va :
   - installer la CLI Netlify si besoin
   - ouvrir ton navigateur pour te connecter à ton compte Netlify existant
   - créer le site
4. Configurer les variables d'environnement une fois le site créé :
   ```bash
   netlify env:set META_PIXEL_ID "123456789"
   netlify env:set META_ACCESS_TOKEN "EAAB...."
   ```

## Pour chaque nouvelle landing page (le workflow qui reste simple)

1. Demande-moi de construire la page — je la dépose dans un nouveau dossier
   `pages/<nom-de-la-campagne>/`.
2. Lance `./deploy.sh`.

C'est tout — pas de nouveau compte, pas de nouvelle configuration, pas de
GitHub. La fonction de tracking (`capi.js`) et les variables d'environnement
sont déjà en place et servent toutes les pages du dossier `pages/`.

## Comment fonctionne le tracking (rappel)

Au clic sur le CTA de réservation :

1. Le **Pixel** (navigateur) envoie l'événement `Lead` avec un `event_id`.
2. Le **même event_id** part en parallèle vers `/.netlify/functions/capi`,
   qui hash l'email/téléphone et relaie l'événement à l'API Graph de Meta.
3. Meta reçoit les deux envois avec le même `event_id` → une seule
   conversion comptée (déduplication), fiable même avec un bloqueur de pub
   ou sur Safari/iOS.

## Vérifier que ça tourne

- Extension Chrome **Meta Pixel Helper** → `PageView` au chargement,
  `Lead` après soumission du formulaire.
- Meta Events Manager → **Test Events** → les deux événements apparaissent
  et sont marqués comme dédupliqués.
