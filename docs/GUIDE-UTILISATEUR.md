# SIS-MALI — Guide Utilisateur

**Version 1.0 — Octobre 2026**
**Pour : Direction, Secrétariat, Comptabilité**

---

## 1. Première Connexion

1. Ouvrez votre navigateur (Chrome, Firefox, Edge)
2. Allez sur l'adresse fournie par votre installateur (ex: `http://192.168.0.150`)
3. Connectez-vous avec :
   - **Email** : `admin@sis-mali.local` (ou celui fourni)
   - **Mot de passe** : le mot de passe temporaire fourni
4. **Important** : l'application vous demande de **changer le mot de passe** dès la première connexion
5. Notez votre nouveau mot de passe quelque part de sûr

---

## 2. Configurer l'École (Première fois)

1. Allez dans **Paramètres → Établissement**
2. Remplissez :
   - Nom de l'école
   - Sigle (ex: EPS)
   - Adresse, téléphone, email
   - Logo (cliquez pour uploader)
   - Cachet et signature (pour les documents officiels)
3. Cliquez **Enregistrer**

---

## 3. Créer une Année Scolaire

1. Allez dans **Système → Années Scolaires**
2. Cliquez **+ Nouvelle année**
3. Remplissez :
   - Libellé (ex: 2026-2027)
   - Date de début (ex: 01/10/2026)
   - Date de fin (ex: 30/06/2027)
4. Cochez **Année courante**
5. Enregistrer

**Étape suivante** : Créer les trimestres (1er, 2ème, 3ème) dans le même écran.

---

## 4. Configurer les Niveaux et Classes

1. **Scolarité → Niveaux** : Créez les niveaux (1ère Année, 2ème Année, …, 9ème Année)
2. **Scolarité → Classes** : Pour chaque niveau, créez les classes (ex: 1ère A, 1ère B)

---

## 5. Inscrire un Élève

1. **Scolarité → Élèves → + Nouvel Élève**
2. **Étape 1** : Identité (nom, prénom, date de naissance, matricule auto-généré)
3. **Étape 2** : Scolarité (classe, niveau)
4. **Étape 3** : Famille (tuteur, téléphone, profession)
5. **Étape 4** : Vérification → Enregistrer

**Astuce** : si vous avez beaucoup d'élèves, utilisez **Importer Excel** (Scolarité → Élèves → Importer Excel).

---

## 6. Configurer les Frais et Facturer

### 6.1 Créer les types de frais
1. **Finances → Configuration → Types de frais**
2. Cliquez **+ Nouveau**
3. Exemples : Inscription, Scolarité mensuelle, Tenue, Cantine
4. Sélectionnez la catégorie (SCOLARITE, INSCRIPTION, etc.)

### 6.2 Créer la grille tarifaire
1. **Finances → Configuration → Grille tarifaire**
2. Cliquez **+ Nouveau**
3. Remplissez :
   - Niveau (ex: 1ère Année)
   - Type de frais (ex: Scolarité)
   - Montant (ex: 110 000 FCFA)
   - Nombre d'échéances (ex: 10 pour mensuel, 3 pour trimestriel)
4. Enregistrer

### 6.3 Facturer les élèves
1. **Finances → Facturation → Factures → + Nouvelle facture**
2. Sélectionnez l'élève et ses frais → Enregistrer
3. **OU** (massif) : **Finances → Facturation → Bulk** → sélectionnez une classe entière

---

## 7. Encaisser un Paiement

### 7.1 Ouvrir la caisse
1. **Finances → Encaissement → Point de caisse**
2. Cliquez **Ouvrir une session de caisse**
3. Saisissez le montant d'ouverture (ex: 50 000 FCFA en espèces)
4. Valider

### 7.2 Encaisser
1. Recherchez l'élève (par nom, matricule ou téléphone du parent)
2. Cliquez sur l'élève → sa facture active apparaît
3. Saisissez le montant à encaisser
4. Choisissez le mode (Espèces, Mobile Money, etc.)
5. **Pour Mobile Money** : saisissez le N° de transaction (obligatoire)
6. Cliquez **Encaisser**

**Automatiques** :
- Un PDF du reçu s'ouvre
- Une proposition d'envoi WhatsApp au parent
- La facture est mise à jour

### 7.3 Encaissement famille (Fratrie)
Si un parent a plusieurs enfants :
1. Recherchez le tuteur par son téléphone
2. Cliquez sur **Encaisser pour la famille**
3. Le modal montre tous ses enfants
4. Saisissez un montant → il se répartit automatiquement (FIFO)

### 7.4 Clôturer la caisse
1. **Finances → Encaissement → Point de caisse → Clôturer**
2. Saisissez le montant compté en caisse
3. L'app calcule la différence (écart de caisse)

---

## 8. Saisir les Notes et Bulletins

1. **Pédagogie → Notes → + Nouvelle évaluation**
2. Sélectionnez classe, matière, type (Interrogation, Devoir, Composition)
3. Saisissez les notes des élèves
4. Une fois validées : **Pédagogie → Bulletins → Générer les bulletins**
5. Sélectionnez la classe et le trimestre → Générer
6. Les bulletins PDF sont téléchargeables

---

## 9. Notifier les Parents (WhatsApp)

Depuis le Point de caisse, après chaque paiement :
- Le modal WhatsApp s'ouvre automatiquement
- Le message est pré-rempli (montant, motif, N° reçu)
- Cliquez **Ouvrir WhatsApp** → envoyé au parent

---

## 10. Sauvegardes

**Automatique** : chaque jour à 23h00, l'app fait une sauvegarde dans `backups/`

**Manuelle** : Demandez à votre installateur de lancer `./backup.sh`

**Restauration** : `./restore.sh backups/db_YYYYMMDD_HHMMSS.sql.gz`

---

## 11. Support

- **Email** : dmsangare@gmail.com
- **Téléphone** : +223 73 65 14 67
- **WhatsApp** : +223 73 65 14 67

---

## 12. Raccourcis Clavier

- `Ctrl+K` (à venir V2) : Palette de commandes
- `Ctrl+Shift+R` : Rafraîchir la page (si bug d'affichage)
- `Échap` : Fermer une modale

---

**© 2026 SIS-MALI — Tous droits réservés**
