# Quiz-Hero Design

Das bisherige Beta-Design ist seit dem 17.10.2026 der gemeinsame Standard auf `master`. Der separate Branch `design/beta` wird nach der Uebernahme entfernt. Alle spaeteren Designaenderungen bauen auf diesem Stand auf.

## Entwicklung und Deployment

Docker: `docker compose up -d app`. Startseite: http://localhost:8081/, Adminbereich: http://localhost:8081/admin/.

Hostinger veroeffentlicht weiterhin nur den Branch `hostinger`. Ein Push auf `master` alleine aktualisiert die Live-Seite nicht. Fuer einen freigegebenen Release den geprueften master-Stand in hostinger uebernehmen.

## Aufbau

`styles/abstracts/tokens.css` enthaelt die gemeinsamen Skalen und Rollen. `styles/themes/app-tokens.css` definiert die aktuelle Palette; `styles/themes/app.css` die abschliessende Gestaltung. `styles/main.css` legt die Importreihenfolge fest. Regeln: [CSS-Design-System](../styles/README.md).

Source Sans 3 fuer Fliesstext, Oswald fuer Headlines. Neun Schriftgroessen, zehn Abstandsstufen und drei Eckradien plus Pill/Kreis. Die Farbpalette verwendet helle Flaechen, dunkles Blau, Petrol und Mint. Karten bleiben beim Hover stehen; der Bildfilter blendet weich ein und aus.

Der Quizheader ist kompakt; alle Angaben sind vertikal zentriert. Quizfragen sind zentriert. Bilder behalten ihr Seitenverhaeltnis und schrumpfen bei Platzmangel, begrenzt durch `max-height: max(300px, 30vh)`. Die Fragen werden nicht automatisch fokussiert. Tastatur-Fokusmarkierungen bleiben erhalten.

## Pruefung

`node scripts/build-css.js` (inklusive Token-Pruefung), `node scripts/check-bem.js` und `node --test tests/contracts.test.mjs`. Der Hostinger-Produktionsbuild wird mit expliziter Produktionsfreigabe geprueft. Browserpruefungen umfassen mobile Quizansichten bei 320/390 Pixeln und Desktop bei 1440 Pixeln.

Produktionskonfiguration und Datenhaltung: [Hostinger Production](HOSTINGER-PRODUCTION.md). Ein Branchwechsel oder Deployment importiert keine Fragen und setzt die Datenbank nicht zurueck.
