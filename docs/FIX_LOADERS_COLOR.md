# 🎨 Correction Couleur Loaders - Bleu SDIS #144190

## 📋 Loaders à Corriger

### Loaders SANS `text-primary` (à corriger)

1. **app/(dashboard)/tta/page.tsx** - ligne 403

   ```tsx
   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
   ```

2. **app/(dashboard)/tta/admin/validation/page.tsx** - ligne 408

   ```tsx
   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
   ```

3. **app/(dashboard)/tta/admin/export/page.tsx** - ligne 242

   ```tsx
   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
   ```

4. **app/(dashboard)/settings/notifications/page.tsx** - ligne 277

   ```tsx
   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
   ```

5. **app/(dashboard)/messages/[id]/page.tsx** - ligne 310

   ```tsx
   <Loader2 className="h-4 w-4 animate-spin" />
   ```

6. **app/(dashboard)/messages/new/page.tsx** - ligne 257

   ```tsx
   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
   ```

7. **app/(dashboard)/formations/[id]/page.tsx** - ligne 327

   ```tsx
   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
   ```

8. **app/(dashboard)/formations/nouvelle/page.tsx** - ligne 438

   ```tsx
   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
   ```

9. **app/(dashboard)/formations/admin/inscriptions/page.tsx** - ligne 346

   ```tsx
   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
   ```

10. **app/(dashboard)/agenda/nouveau/page.tsx** - ligne 313

    ```tsx
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
    ```

11. **app/(dashboard)/agenda/disponibilites/page.tsx** - ligne 273
    ```tsx
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
    ```

---

## ✅ Loaders AVEC `text-primary` (déjà corrects)

- app/(dashboard)/tta/page.tsx - ligne 420 ✅
- app/(dashboard)/tta/admin/validation/page.tsx - ligne 251 ✅
- app/(dashboard)/tta/admin/export/page.tsx - ligne 265 ✅
- app/(dashboard)/settings/notifications/page.tsx - ligne 106 ✅
- app/(dashboard)/messages/[id]/page.tsx - ligne 198 ✅
- app/(dashboard)/messages/new/page.tsx - ligne 194 ✅
- app/(dashboard)/formations/[id]/page.tsx - ligne 162 ✅
- app/(dashboard)/formations/admin/inscriptions/page.tsx - ligne 216 ✅
- app/(dashboard)/admin/queues/page.tsx - ligne 88 ✅

---

## 🔧 Correction à Appliquer

### Avant :

```tsx
<Loader2 className="mr-2 h-4 w-4 animate-spin" />
<Loader2 className="h-4 w-4 animate-spin" />
```

### Après :

```tsx
<Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
<Loader2 className="h-4 w-4 animate-spin text-primary" />
```

---

## 📊 Résumé

- **Total loaders** : 20
- **Déjà corrects** : 9 (45%)
- **À corriger** : 11 (55%)

---

## 🎨 Couleur Appliquée

**CSS Variable** : `--primary: 215 75% 32%`  
**HEX** : `#144190`  
**Nom** : Bleu SDIS

---

**Note** : La correction sera appliquée automatiquement dans les fichiers.
