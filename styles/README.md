# CSS-Design-System

`styles.css` ist ein generiertes Build-Artefakt. Bitte Styles in den Dateien unter `styles/` bearbeiten und danach das Bundle neu bauen:

```powershell
node scripts/build-css.js
```

Beim Arbeiten am CSS kann der Watcher laufen bleiben. Er baut `styles.css` automatisch neu, sobald sich eine Datei unter `styles/` aendert:

```powershell
node scripts/watch-css.js
```

## Struktur

- `abstracts/`: zentrale Tokens wie Farben, Abstaende, Radien, Borders und Shadows
- `base/`: Reset, Typografie, Links, Utilities und responsive Querschnittsregeln
- `layout/`: globale Seitenbereiche wie Container, Header, Footer und Account-Navigation
- `components/`: wiederverwendbare UI-Bloecke wie Buttons, Modals, Breadcrumbs, Badges, Forms, Statusboxen, Avatar-Picker und Action-Rows
- `features/quiz/`: Quiz-spezifische BEM-Bloecke
- `features/account/`: Login-, Registrierungs- und Profil-spezifische BEM-Bloecke
- `features/admin/`: Admin- und Upload-spezifische BEM-Bloecke
- `features/seo/`: SEO-Landingpage-spezifische BEM-Bloecke

## Regeln

- Neue Komponenten bekommen bevorzugt eine eigene Datei im passenden Ordner.
- Gemeinsame Werte zuerst in `abstracts/tokens.css` pruefen, bevor neue Farben, Border-Radien oder Schatten direkt in Komponenten entstehen.
- BEM-Bloecke bleiben moeglichst zusammen: Block, Elemente und Modifier liegen in derselben Datei.
- `styles/main.css` bestimmt die finale Reihenfolge der CSS-Ausgabe.
