# 🌙 Dark Mode - Installation et Configuration

**Date** : 19 Octobre 2025  
**Statut** : ✅ Configuration terminée - Installation requise

---

## 📦 Installation Requise

### Installer next-themes

```bash
npm install next-themes
```

**OU**

```bash
yarn add next-themes
```

---

## ✅ Fichiers Créés

### 1. ThemeProvider

**Fichier** : `src/components/providers/ThemeProvider.tsx`

- Provider pour gérer le thème (light/dark/system)

### 2. ThemeToggle

**Fichier** : `src/components/theme/ThemeToggle.tsx`

- Bouton de changement de thème avec dropdown
- 3 options : Clair, Sombre, Système

### 3. Intégration Header

**Fichier** : `src/components/layout/Header.tsx`

- Bouton ThemeToggle ajouté entre notifications et menu utilisateur

### 4. Configuration Layout

**Fichier** : `src/app/layout.tsx`

- ThemeProvider intégré au layout racine

---

## 🎨 Couleurs Dark Mode Personnalisées

### Vos Couleurs Appliquées

| Élément        | Couleur HEX | HSL            | Usage          |
| -------------- | ----------- | -------------- | -------------- |
| **Sidebar**    | `#1a2537`   | `215° 37% 16%` | Cards, Popover |
| **Background** | `#111d2d`   | `215° 45% 13%` | Fond principal |

### Palette Complète Dark Mode

```css
.dark {
  /* Background */
  --background: 215 45% 13%; /* #111d2d */
  --foreground: 0 0% 98%; /* Blanc cassé */

  /* Cards & Sidebar */
  --card: 215 37% 16%; /* #1a2537 */
  --card-foreground: 0 0% 98%;

  /* Primary - Bleu SDIS */
  --primary: 215 75% 45%; /* Bleu SDIS clair */
  --primary-foreground: 0 0% 98%;

  /* Secondary */
  --secondary: 215 37% 20%; /* Bleu SDIS foncé */

  /* Borders */
  --border: 215 30% 25%; /* Bordures bleutées */
  --input: 215 30% 25%;
  --ring: 215 75% 45%; /* Focus bleu SDIS */
}
```

---

## 🎯 Fonctionnalités

### Bouton ThemeToggle

**Position** : Header (entre notifications et menu utilisateur)

**Options** :

- ☀️ **Clair** - Mode jour
- 🌙 **Sombre** - Mode nuit
- 💻 **Système** - Suit les préférences système

**Icônes** :

- Soleil (☀️) en mode clair
- Lune (🌙) en mode sombre
- Transition animée

---

## 🚀 Utilisation

### 1. Installer le package

```bash
npm install next-themes
```

### 2. Redémarrer le serveur

```bash
npm run dev
```

### 3. Tester le dark mode

1. Ouvrir l'application
2. Cliquer sur le bouton soleil/lune dans le header
3. Sélectionner "Sombre"
4. Observer les changements de couleurs

---

## 🎨 Aperçu des Couleurs

### Mode Clair

```
Background : Blanc (#FFFFFF)
Sidebar    : Blanc (#FFFFFF)
Primary    : Bleu SDIS (#144190)
```

### Mode Sombre

```
Background : #111d2d (Bleu très foncé)
Sidebar    : #1a2537 (Bleu foncé)
Primary    : Bleu SDIS clair (#4A8FE7)
```

---

## 📊 Architecture

```
app/layout.tsx
  └── ThemeProvider
      ├── attribute="class"
      ├── defaultTheme="system"
      └── enableSystem
          └── SessionProvider
              └── NavigationLoader
                  └── {children}

components/layout/Header.tsx
  └── ThemeToggle
      ├── Sun icon (light mode)
      ├── Moon icon (dark mode)
      └── Dropdown menu
          ├── Clair
          ├── Sombre
          └── Système
```

---

## 🔧 Personnalisation

### Changer les couleurs dark mode

**Fichier** : `src/app/globals.css`

```css
.dark {
  /* Modifier ces valeurs */
  --background: 215 45% 13%; /* Fond principal */
  --card: 215 37% 16%; /* Sidebar/Cards */
  --primary: 215 75% 45%; /* Couleur primaire */
}
```

### Changer le thème par défaut

**Fichier** : `src/app/layout.tsx`

```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="dark"  // ← Changer ici (light/dark/system)
  enableSystem
>
```

### Ajouter des transitions

**Fichier** : `src/app/globals.css`

```css
* {
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
}
```

---

## 🧪 Tests

### Test 1 : Changement de thème

```
1. Cliquer sur le bouton soleil/lune
2. Sélectionner "Sombre"
3. Vérifier : Background #111d2d, Sidebar #1a2537
```

### Test 2 : Persistance

```
1. Activer le mode sombre
2. Recharger la page (F5)
3. Vérifier : Mode sombre toujours actif
```

### Test 3 : Mode système

```
1. Sélectionner "Système"
2. Changer les préférences système (Windows/Mac)
3. Vérifier : Thème suit les préférences
```

---

## 📝 Composants Affectés

Tous les composants utilisant les classes Tailwind seront automatiquement adaptés :

- ✅ Header
- ✅ Sidebar
- ✅ Cards
- ✅ Buttons
- ✅ Inputs
- ✅ Dropdowns
- ✅ Tables
- ✅ Modals
- ✅ Toasts
- ✅ Badges

---

## 🎯 Avantages

### UX

- ✅ Confort visuel en environnement sombre
- ✅ Économie batterie (écrans OLED)
- ✅ Réduction fatigue oculaire

### Technique

- ✅ Persistance automatique (localStorage)
- ✅ Support préférences système
- ✅ Transitions fluides
- ✅ SSR compatible

---

## 🐛 Dépannage

### Le thème ne change pas

```bash
# 1. Vérifier que next-themes est installé
npm list next-themes

# 2. Vider le cache
rm -rf .next
npm run dev

# 3. Vider localStorage
# Dans la console navigateur :
localStorage.clear()
```

### Couleurs incorrectes

```
1. Vérifier globals.css (.dark section)
2. Vérifier que attribute="class" dans ThemeProvider
3. Inspecter l'élément <html> (doit avoir class="dark")
```

### Bouton ne s'affiche pas

```
1. Vérifier import ThemeToggle dans Header.tsx
2. Vérifier que ThemeProvider entoure l'app
3. Redémarrer le serveur
```

---

## 📚 Ressources

- [next-themes Documentation](https://github.com/pacocoursey/next-themes)
- [Tailwind Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [shadcn/ui Theming](https://ui.shadcn.com/docs/theming)

---

## ✅ Checklist

- [x] ThemeProvider créé
- [x] ThemeToggle créé
- [x] Intégré dans Header
- [x] Intégré dans Layout
- [x] Couleurs personnalisées appliquées
- [ ] **Package next-themes installé** ← À FAIRE
- [ ] Serveur redémarré
- [ ] Tests effectués

---

## 🚀 Prochaine Étape

**Exécuter cette commande** :

```bash
npm install next-themes
```

**Puis redémarrer le serveur** :

```bash
npm run dev
```

**Le dark mode sera alors fonctionnel ! 🌙**
