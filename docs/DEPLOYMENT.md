# Guide de deploiement — SIS-MALI sur Ubuntu Server

Ce guide explique comment deployer SIS-MALI sur un serveur Ubuntu LTS en production.

## Prerequis serveur

- Ubuntu Server 22.04 LTS ou 24.04 LTS
- 4 vCPU minimum (8 recommande)
- 8 Go RAM minimum (16 recommande)
- 100 Go SSD minimum
- Acces SSH avec utilisateur sudo
- IP fixe ou nom de domaine

## Etape 1 : Preparer le serveur

Se connecter en SSH :

    ssh user@votre-serveur-ip

Mettre a jour le systeme :

    sudo apt update && sudo apt upgrade -y

Installer les outils de base :

    sudo apt install -y curl wget git ufw fail2ban htop

## Etape 2 : Installer Docker

Installer Docker officiel (methode recommandee) :

    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh

Ajouter votre utilisateur au groupe docker :

    sudo usermod -aG docker $USER
    newgrp docker

Verifier l installation :

    docker --version
    docker compose version

## Etape 3 : Configurer le pare-feu

Configurer ufw :

    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    sudo ufw allow ssh
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw enable

Verifier :

    sudo ufw status

## Etape 4 : Recuperer le projet

Cloner le projet :

    cd /opt
    sudo git clone <url-du-repo> sis-mali
    sudo chown -R $USER:$USER /opt/sis-mali
    cd /opt/sis-mali

## Etape 5 : Configurer les variables d environnement

Copier le fichier exemple :

    cp .env.example .env
    nano .env

Modifier les valeurs critiques :

    POSTGRES_PASSWORD=<mot-de-passe-fort>
    JWT_SECRET=<64-caracteres-aleatoires>
    JWT_REFRESH_SECRET=<64-caracteres-aleatoires-differents>
    FRONTEND_URL=http://votre-domaine.com

Generer des secrets forts :

    openssl rand -hex 32

## Etape 6 : Demarrer les services

Lancer tous les conteneurs :

    docker compose up -d

Verifier que tout est demarre :

    docker compose ps

Tous les services doivent etre en etat "running" ou "healthy".

## Etape 7 : Initialiser la base de donnees

Appliquer les migrations :

    docker compose exec api npx prisma migrate deploy

Charger les donnees initiales (roles, ecole demo, etc.) :

    docker compose exec api npm run prisma:seed

## Etape 8 : Verifier l installation

Tester l API :

    curl http://localhost/api/v1/health

Tester l interface web :

    curl -I http://localhost

Ouvrir dans un navigateur :

    http://votre-ip-serveur

## Etape 9 : Configurer le nom de domaine (optionnel)

Si vous avez un nom de domaine, installer Certbot pour HTTPS :

    sudo apt install -y certbot python3-certbot-nginx

Generer un certificat SSL :

    sudo certbot --nginx -d votre-domaine.com

## Etape 10 : Configurer les sauvegardes automatiques

Creer un script de backup :

    sudo mkdir -p /opt/backups
    sudo nano /opt/backups/backup.sh

Contenu du script :

    #!/bin/bash
    DATE=$(date +%Y%m%d-%H%M%S)
    BACKUP_DIR=/opt/backups
    cd /opt/sis-mali
    docker compose exec -T postgres pg_dump -U sis_user sis_mali > $BACKUP_DIR/sis_mali_$DATE.sql
    find $BACKUP_DIR -name "sis_mali_*.sql" -mtime +30 -delete

Rendre executable :

    sudo chmod +x /opt/backups/backup.sh

Ajouter au cron (tous les jours a 23h) :

    sudo crontab -e

Ajouter cette ligne :

    0 23 * * * /opt/backups/backup.sh

## Maintenance

Voir les logs d un service :

    docker compose logs -f api
    docker compose logs -f web
    docker compose logs -f postgres

Redemarrer un service :

    docker compose restart api

Mettre a jour l application :

    cd /opt/sis-mali
    git pull
    docker compose build
    docker compose up -d

Voir l utilisation des ressources :

    docker stats

Nettoyer les images inutilisees :

    docker system prune -a

## Depannage

Si un conteneur ne demarre pas :

    docker compose logs <service>

Si PostgreSQL ne repond pas :

    docker compose restart postgres
    docker compose exec postgres pg_isready

Si l API ne repond pas :

    docker compose restart api
    curl http://localhost/api/v1/health

Si le probleme persiste, verifier les variables d environnement :

    docker compose config

## Restauration

Restaurer une sauvegarde :

    docker compose exec -T postgres psql -U sis_user sis_mali < /opt/backups/sis_mali_YYYYMMDD-HHMMSS.sql

## Securite en production

Checklist avant mise en production :

- Changer tous les mots de passe par defaut
- Generer des secrets JWT uniques (openssl rand -hex 32)
- Activer HTTPS avec Certbot
- Configurer le pare-feu (ufw)
- Activer fail2ban pour SSH
- Configurer des sauvegardes automatiques
- Tester la restauration
- Surveiller les logs regulierement

## Support

Pour toute question technique, consulter :
- README.md a la racine du projet
- Documentation API : http://votre-serveur/api/docs
- Logs : docker compose logs
