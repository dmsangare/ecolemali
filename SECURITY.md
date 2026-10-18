# SIS-MALI — Note de sécurité

**Dernière mise à jour** : octobre 2026 — Audit complet

---

## 1. Mesures de sécurité en place

### Authentification
- JWT signé HMAC SHA-256 obligatoire sur les routes sensibles
- Refresh tokens avec rotation + révocation
- Verrouillage de compte après échecs répétés
- bcrypt cost 12 pour les mots de passe
- Mot de passe temporaire aléatoire généré par `crypto.randomInt`

### Autorisation
- RBAC strict (rôles : SUPER_ADMIN, DIRECTOR, SECRETARY, TEACHER, ACCOUNTANT, SUPERVISOR, PARENT, STUDENT)
- Isolation multi-tenant par schoolId sur chaque requête (vérifications explicites dans les services)
- Audit trail des actions sensibles (`audit_logs` + `system_logs`)

### Protection HTTP
- Helmet (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy)
- CORS configuré strictement
- Rate limiting (throttler) par IP et par utilisateur
- Validation Zod sur la majorité des endpoints (paiements, notes, etc.)

### Fichiers & uploads
- Taille limitée : 10 Mo max
- Types autorisés contrôlés (images uniquement pour les logos/photos)
- **Stockage interne non accessible directement** : `/documents/` et `/uploads/` sont servis uniquement via des routes API authentifiées (`GET /api/v1/files/...`)
- Noms de fichiers UUID (imprévisibles)

### Sauvegardes
- `backup.sh` : dump quotidien avec rétention graduée (7j / 4sem / 6mois)
- `restore.sh` : restauration avec backup de sécurité automatique
- Mot de passe DB passé via `PGPASSWORD` (pas de fuite dans le shell)
- Cron quotidien automatique (23h00)

---

## 2. Limitations connues (à ce jour)

Les points suivants **ne sont pas encore traités** et doivent être pris en compte avant une mise en production sur Internet public :

- **HTTPS/TLS** : la configuration Nginx actuelle ne fournit pas de certificat TLS. **L'application est conçue pour un déploiement en réseau local fermé (LAN)**. Pour un accès depuis Internet, ajoutez un certificat (Let's Encrypt) et activez HSTS.
- **Validation Zod** : certains endpoints (`admin-reports`, `users`) utilisent encore `body: any` et seront migrés dans une version ultérieure.
- **Test de restauration** : non encore effectué automatiquement. Un test manuel est recommandé avant chaque déploiement.
- **Contrôle des fichiers uploadés** : le type MIME est vérifié, mais pas les magic bytes (bytes binaires du fichier). Une vérification approfondie sera ajoutée dans une version ultérieure.
- **Tests automatisés** : pas encore de couverture de tests. À ajouter progressivement.

---

## 3. Signalement

Pour signaler une vulnérabilité : **dmsangare@gmail.com**

---

**© 2026 SIS-MALI — Tous droits réservés**
