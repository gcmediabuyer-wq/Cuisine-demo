#!/usr/bin/env bash
# Déploie TOUTES les landing pages (tout le contenu de pages/) en une seule
# commande, sur le même site Netlify. Une nouvelle page = un nouveau dossier
# sous pages/, puis on relance ce script, c'est tout.
#
# Premier lancement : fait "netlify login" + "netlify init" si besoin.
# Lancements suivants : redéploie directement.

set -e

if ! command -v netlify >/dev/null 2>&1; then
  echo "→ Installation de la CLI Netlify (une seule fois)..."
  npm install -g netlify-cli
fi

if [ ! -f ".netlify/state.json" ]; then
  echo "→ Connexion à ton compte Netlify (ouvre le navigateur)..."
  netlify login
  echo "→ Création / liaison du site Netlify..."
  netlify init
fi

echo "→ Déploiement en production..."
netlify deploy --prod

echo ""
echo "C'est en ligne. Pour ajouter une nouvelle landing page :"
echo "  1. Crée un nouveau dossier dans pages/ (ex: pages/nouvelle-campagne/index.html)"
echo "  2. Relance ce script : ./deploy.sh"
