# Quiz-Hero Design

Das bisherige Beta-Design ist seit dem 17.10.2026 der gemeinsame Standard auf `master`. Der separate Branch `design/beta` wird nach der Uebernahme entfernt. Alle spaeteren Designaenderungen bauen auf diesem Stand auf.

## Entwicklung und Deployment

Docker: `docker compose up -d app`. Startseite: http://localhost:8081/, Adminbereich: http://localhost:8081/admin/.

Hostinger veroeffentlicht weiterhin nur den Branch `hostinger`. Ein Push auf `master` alleine aktualisiert die Live-Seite nicht. Fuer einen freigegebenen Release den geprueften master-Stand in hostinger uebernehmen.

## Aufbau

`styles/abstracts/tokens.css` enthaelt die gemeinsamen Skalen und Rollen; `styles/themes/app-tokens.css` definiert die aktuelle Palette. Die Strukturbereinigung vom 22.10.2026 ordnet Gestaltung und responsive Regeln direkt den Basis-, Layout-, Komponenten- und Featuremodulen zu. Eine nachgeschaltete `themes/app.css` ist aufgeloest; die Bereinigung ist mit Release cb23f51a0cc4-20261022131903 veroeffentlicht (Rollout: HOSTINGER-PRODUCTION.md). `styles/main.css` legt die Importreihenfolge fest. Regeln: [CSS-Design-System](../styles/README.md), Pruefung: [Modularisierung](CSS-MODULARISIERUNG-2026-10-22.md).

Source Sans 3 fuer Fliesstext, Oswald fuer Headlines. Neun Schriftgroessen, zehn Abstandsstufen und drei Eckradien plus Pill/Kreis. Die Farbpalette verwendet helle Flaechen, dunkles Blau, Petrol und Mint. Karten bleiben beim Hover stehen; der Bildfilter blendet weich ein und aus.

Der Quizheader ist kompakt; alle Angaben sind vertikal zentriert. Quizfragen sind zentriert. Bilder behalten ihr Seitenverhaeltnis und schrumpfen bei Platzmangel, begrenzt durch `max-height: max(300px, 30vh)`. Die Fragen werden nicht automatisch fokussiert. Tastatur-Fokusmarkierungen bleiben erhalten.

Anpassung im Release vom 18. Oktober 2026: Der Quizbereich nutzt weniger vertikalen Leerraum, damit „Weiter“ auf Laptop-Displays leichter ohne Scrollen erreichbar ist. Oben/unten in der Fragenkarte 24 statt 48 Pixel Innenabstand auf Desktop, Antwortbuttons mindestens 56 statt 68 Pixel hoch, kleinere Abstaende im Quizheader, nach Frage/Bild und vor „Weiter“. Der bisher zusaetzliche obere Abstand direkt am Weiter-Button entfaellt. Horizontale Innenabstaende, Schriftgroessen und Bildbegrenzung bleiben erhalten; mobile Antwortbuttons behalten ihre mindestens 50 Pixel Hoehe. Es wird nichts abgeschnitten und kein Scrollen gesperrt: Besonders lange Fragen/Antworten, hohe Zoomstufen oder kleinere Viewports duerfen weiterhin Scrollen benoetigen.

Browserpruefung der Muenz-Bildfrage: „Weiter“ endet nach der Anpassung bei rund 629 Pixeln statt zuvor rund 725 Pixeln. Sichtbar bei 1366 × 650, 1280 × 640 und 1440 × 768 CSS-Pixeln; auch bei 390 × 844 und 320 × 740 kein horizontaler Ueberlauf. Eine laengere Bildfrage wurde zusaetzlich bei 1366 × 680 geprueft. Das sind emulierte Viewports, kein Test auf einem physischen Surface-Geraet.

## Pruefung

### Kategorieverwaltung ohne ID-/Sortierungsfelder (Release vom 18. Oktober 2026)

Das Adminformular fuehrt die bestehende Kategorie-ID nur noch intern als verstecktes Feld. Bei neuen Kategorien sendet es eine leere ID; `admin_category_save` erzeugt daraus einen Slug des Namens (Umlaute werden umgeschrieben) und sucht bei Kollisionen freie nummerierte Varianten. Ein separater INSERT verhindert, dass parallele Neuanlagen bestehende Kategorien ueberschreiben. Umbenennen behaelt die ID und damit Links/Fragenzuordnungen bei. Der Kategorie-Sortierwert wird beim Bearbeiten unveraendert uebernommen, bei Neuanlagen auf den bereits im Schema vorgesehenen Standard 100 gesetzt. Das Formular sendet keinen Sortierwert mehr; die Frage-Sortierung ist davon nicht betroffen. Keine Datenbankmigration erforderlich.

### Tag-Auswahl im Admin (Release vom 18. Oktober 2026)

`public/js/admin/tag-picker.js` kapselt die Chip-Darstellung und Vorschlaege aus den bereits geladenen Fragen. Das versteckte Feld `js-admin-tags` bleibt die komma-separierte Quelle fuer Speichern und Formularschutz; dynamische Entfernen-/Vorschlagsbuttons sind keinem Formular zugeordnet, damit sie dessen gespeicherten Zustand nicht verschieben. Beim Laden einer Frage und Verwerfen von Aenderungen wird die Darstellung aus dem Feld wiederhergestellt. Keine Datenbankmigration und keine Anfrage pro Tastendruck.

Ab zwei Buchstaben erscheinen bis zu acht vorhandene passende Tags. Pfeiltasten navigieren, Enter uebernimmt oder erstellt, Escape schliesst die Vorschlaege. Ein Combobox-/Listbox-Muster und Statusmeldungen unterstuetzen assistive Technik. Tags werden ohne HTML-Auswertung dargestellt; Gross-/Kleinschreibung und Rand-Leerzeichen erzeugen keine Duplikate. Kommagetrenntes Einfuegen bleibt moeglich, unfertige Eingaben werden beim Verlassen uebernommen.

Im Browser mit isolierten UI-Testdaten geprueft: Vorschlag Antike, Tastaturauswahl, doppelte Schreibweise, mehrere eingefuegte Tags, Entfernen sowie Wiederherstellung nach Verwerfen. Dabei wurden keine Fragen gespeichert.

### Kontextbezogene E-Mail-Bestaetigung (Release vom 18. Oktober 2026)

Nach erfolgreichem Login und erfolgreicher E-Mail-Bestaetigung einer Registrierung fuehrt die gemeinsame Weiterleitung zur Startseite (`index.html`). Direkt nach dem Absenden der Registrierung bleibt der Bestaetigungsschritt sichtbar, bis die Adresse bestaetigt ist. Auch lokaler Testlogin und erfolgreicher Passwort-Reset verwenden dasselbe Startseitenziel.

Im normalen Login, Registrierungsformular und beiden Passwort-Reset-Ansichten ist die Versandhilfe ausgeblendet. Die Registrierung erklaert vorab den E-Mail-Schritt und zeigt nach Erfolg einen eigenen Bestaetigungsbereich mit erneutem Versand und vorbelegter E-Mail. Bei korrekten Login-Daten und unbestaetigter Adresse meldet die API den stabilen Fehlercode `EMAIL_NOT_VERIFIED`; nur dann wird die Hilfe im Login eingeblendet. Ein fehlgeschlagener Bestaetigungslink fuehrt ebenfalls zur Versandhilfe. Jeder Ansichtswechsel blendet sie wieder aus und leert ihre Adresse. Der Versand behaelt seine neutrale Antwort zum Schutz vor Kontoabfragen.

Browserpruefung der Ansichtswechsel, Registrierungserfolg und unbestaetigtem Login mit simulierten Service-Antworten (keine Testmails). JS- und PHP-Syntax sowie alle 28 Vertragstests erfolgreich. Keine Datenbankmigration erforderlich.

### Profilverwaltung (Release vom 18. Oktober 2026)

Die gemeinsame Avatar-Auswahl fuer Registrierung und Profilbilddialog erzwingt quadratische Bildflaechen mit `aspect-ratio: 1`, automatischer Hoehe und Kreisradius. Dadurch bleiben Auswahl-, Hover- und Fokusring rund, auch wenn das Grid die Bildbreite verkleinert. `object-fit: contain` zeigt die Motive unverzerrt.

Der gemeinsame Avatar-Ring verwendet das kraeftige Link-Petrol ohne Transparenz und die vorhandene Fokusbreite von 3 statt bisher 4 Pixeln.

Die ausgeloggte Ansicht hat 24 Pixel Abstand zwischen Statusmeldung und Ueberschrift. Ueberschrift und Erklaerung verwenden innerhalb des Grids nur dessen Abstand statt zusaetzlicher Standardraender, damit die Texte weder an der Statusbox kleben noch unnoetig weit auseinanderstehen.

Der Benutzername ist anfangs schreibgeschuetzt. Der Stift aktiviert die Bearbeitung mit eigenen Speichern-/Abbrechen-Aktionen. Eine Namensaenderung erfordert wie bisher kein aktuelles Passwort. Avatar, Benutzername und Passwort werden unabhaengig gespeichert.

„Passwort aendern“ oeffnet einen separaten Bereich: aktuelles Passwort zur Identitaetsbestaetigung, neues Passwort und Wiederholung. Nach Erfolg werden die Felder geleert und der Bereich geschlossen; andere Sitzungen werden wie bisher serverseitig widerrufen. Abbrechen oder Zuklappen verwirft die Passworteingaben.

Die Kontoloeschung hat einen eigenen Dialog mit aktuellem Passwort und der Bestaetigung DELETE. Abbrechen loescht nichts. Serverseitige Sicherheitsregeln und Datenbankschema bleiben unveraendert. Profilinhalte erscheinen erst nach erfolgreicher Sitzungspruefung, nicht allein anhand des Browsercaches.

Geprueft mit einem wegwerfbaren Account in einer isolierten lokalen Datenbank: Benutzername speichern/abbrechen, ungleiche neue Passwoerter, falsches aktuelles Passwort, erfolgreicher Passwortwechsel, Loeschdialog abbrechen, abgelehnte und erfolgreiche Kontoloeschung. Mobile Browseremulation bei 390 Pixeln ohne horizontalen Ueberlauf; CSS-Build, BEM-Pruefung, JS-Syntax und alle 28 Vertragstests erfolgreich. Keine echten Benutzerkonten veraendert.

Weitere Ergaenzung im selben Release: Die Hintergrundwissenskarte beginnt mit einem kleinen dekorativen Info-SVG. Ein eigenes Textelement wird weiterhin ausschliesslich ueber `textContent` befuellt; mehrzeiliger Text steht neben dem Icon. Das Symbol ist fuer Screenreader ausgeblendet und nicht fokussierbar. Farben, Groesse und Abstand nutzen bestehende Tokens.

`node scripts/build-css.js` (inklusive Token-Pruefung), `node scripts/check-bem.js` und `node --test tests/contracts.test.mjs`. Der Hostinger-Produktionsbuild wird mit expliziter Produktionsfreigabe geprueft. Browserpruefungen umfassen mobile Quizansichten bei 320/390 Pixeln und Desktop bei 1440 Pixeln.

Produktionskonfiguration und Datenhaltung: [Hostinger Production](HOSTINGER-PRODUCTION.md). Ein Branchwechsel oder Deployment importiert keine Fragen und setzt die Datenbank nicht zurueck.
