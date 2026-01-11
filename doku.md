# Doku

## SEO Einleitung (kurz)
Das Quiz wird clientseitig per JavaScript aufgebaut. Suchmaschinen sehen dabei oft nur wenig Inhalt. Darum erzeugen wir zusaetzliche, statische SEO-Seiten im Ordner `pages/`. Diese enthalten echten Text (Titel, Beschreibung, Beispielfragen) und verlinken ins interaktive Quiz. So koennen Google & Co. Inhalte indexieren, waehrend Nutzer weiterhin die App nutzen.

## Build-Prozess (kurz)
Windows .bat:
```bat
.\scripts\build-seo.bat
```

Production mit SITE_URL:
```bat
.\scripts\build-seo.bat "https://deine-domain.de"
```

## Was wurde umgesetzt
- Statische SEO-Seiten pro Kategorie in `pages/` (Layout wie Startseite).
- Uebersicht `pages/index.html`.
- Alle Fragen + Antworten auf den Landingpages (einklappbar).
- FAQPage JSON-LD fuer alle sichtbaren Fragen/Antworten.
- OpenGraph/Twitter-Bilder pro Kategorie (nutzt Kategorie-Icon, sonst Logo).
- Richtige Antworten werden gruen hervorgehoben.
- Optional: `sitemap.xml` und `robots.txt`, wenn `SITE_URL` gesetzt ist.
- Direkte Verlinkung in die App ueber `index.html?category=<id>`.
- Footer-Modale funktionieren auch auf den Landingpages.
- "Auch interessant": 3 thematisch passende Kategorien (Tag-Ueberschneidung).
- SEO-Fliesstext unter "Quiz starten" aus `categories.json` (`seoDescription`).

## Lokales Erzeugen der SEO-Seiten
```powershell
node scripts/build-seo-pages.js
```

Optional mit Sitemap/Robots:
```powershell
$env:SITE_URL="https://deine-domain.de"
node scripts/build-seo-pages.js
```

## Produktion (Go-Live)
1) Vor dem Deploy das Build-Script ausfuehren.
2) Folgende Dateien mit deployen:
   - `pages/`
   - `content/` (Impressum/Datenschutz/Cookies fuer Landingpages)
   - `js/footer.js` (Footer-Modal-Logik)
   - `fonts/` (Fonts werden in den Landingpages geladen)
   - `sitemap.xml` (falls erzeugt)
   - `robots.txt` (falls erzeugt)
   - `index.html`, `styles.css`, `js/`, `images/`, `data/`
3) Live pruefen:
   - `https://deine-domain.de/pages/index.html`
   - `https://deine-domain.de/pages/<kategorie>.html`

## Wie die Seiten zusammenspielen
- **App-Startseite:** `index.html` (interaktiv, JS)
- **SEO-Landingpages:** `pages/<kategorie>.html` (Text + Link ins Quiz)
- Suchmaschinen landen auf den SEO-Seiten, Nutzer starten von dort die App.

## Hinweise
- Landingpages zeigen alle Fragen/Antworten. Wenn du das reduzieren willst, kann der Generator angepasst werden.
- Der Build liest die JSON-Dateien direkt; BOM am Anfang wird automatisch entfernt.
- Kompression: In `.htaccess` ist gzip (mod_deflate) und optional brotli (mod_brotli) aktiviert. Falls brotli nicht verfuegbar ist, greift gzip.
- 404-Seite: `404.html` wird ueber `.htaccess` als Fehlerseite eingebunden und bietet einen Link zur Startseite inkl. Footer-Modalen.

## Neuer Stand live (Checkliste)
1) Inhalte/Assets aktualisieren (Fragen, Bilder, Kategorien, Texte).
2) Lokale Tests: Quiz starten, Kategorie/Tag wechseln, Ergebnis-Modal, Footer-Modale.
3) Cache-Buster/Version anpassen (index.html, ASSET_VERSION, SEO-Generator).
4) Build ausfuehren: `.\scripts\build-seo.bat "https://deine-domain.de"`.
5) Deploy der Dateien (siehe Produktion oben).
6) Nach dem Deploy kurz pruefen:
   - `https://deine-domain.de/index.html`
   - `https://deine-domain.de/pages/index.html`
   - `https://deine-domain.de/pages/<kategorie>.html`
6) Optional: Sitemap in der Search Console erneut einreichen.

## Neue Kategorie hinzufuegen (Checkliste)
1) `categories.json` erweitern:
   - `id`, `title`, `description`, `icon`, `questionsFile`, optional `seoDescription`, optional `badge`.
2) Neue Fragen-Datei anlegen: `data/questions-<id>.json`.
3) Fragen pruefen:
   - `question`, `answers[]`, `correct`, optional `difficulty`, optional `tag`, optional `imageUrl`.
4) Bildpfade pruefen (Icon/Kategorie-Bilder in `images/`).
5) Build ausfuehren: `.\scripts\build-seo.bat "https://deine-domain.de"`.
6) Lokal testen und danach deployen.
