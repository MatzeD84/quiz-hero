> **Historisches Arbeitsprotokoll.** Enthält überholte Zwischenstände. Maßgeblich ist die [aktuelle Übersicht](../../DESIGN.md). Veröffentlichung: [Rollout](../../HELDEN-ROLLOUT-2026-10-31.md).

# Quiz-Hero Design

## Erfolgreiches Speichern im Dialog

Lokal seit 31.10.2026: `completeDialogSave(dialog, message)` in `dialog.js` schließt nach serverseitig bestätigtem Schreiben und zeigt über `save-notice.js` eine gemeinsame Bestätigung für vier Sekunden unten links. Kein automatisches Schließen auf Submit oder bei Fehlern. Abbrechen und bloße Vorauswahl bei Registrierung bleiben ohne gespeicherte Erfolgsmeldung. Konto-Heldenauswahl und Mediathek-Bildaustausch verwenden denselben Abschluss; erfolgreiches Fragefeedback schließt ebenfalls sofort und bestätigt die Speicherung.

Der Helden-Admin markiert nach bestätigtem Schreiben das Formular sauber und schließt bereits vor dem anschließenden Listenabruf. Ein Fehler dieses Abrufs wird außerhalb des Dialogs ausdrücklich als Aktualisierungsproblem nach erfolgreicher Speicherung gemeldet; kein irreführender Schreibfehler und kein zweiter Speicherauftrag. Nach Abruf und Entsperren kehrt der Fokus zur Heldenkarte zurück. Tatsächliche Schreibfehler bleiben im offenen Dialog, erhalten Werte und erlauben erneutes Speichern.

`viewport-status` ist der gemeinsame feste Bereich für bestehende Ladehinweise und die Speicherbestätigung. Elemente stehen in einem kompakten Raster untereinander; mobile Randabstände und maximale Breite bleiben erhalten. Erfolgsmeldung als `role=status`, `aria-live=polite`, `aria-atomic=true`, ohne Fokusübernahme. Wiederholte Erfolge aktualisieren dieselbe Meldung und starten ihre Anzeigedauer neu; keine unbeschränkte Meldungsliste. Bestehende Inline-Statusbereiche bleiben für Kontext und Fehler erhalten.

Prüfung: 56 Frontendtests, CSS-/Token-/BEM-Build und JS-Syntax erfolgreich. Browserfixture: fehlgeschlagenes Helden-Speichern hält Dialog und Eingaben, erfolgreiches Schreiben schließt auch bei anschließendem Listenfehler, Bestätigung und Loader überlagern sich nicht und erzeugen keinen horizontalen Überlauf. Keine echten Datensätze verändert, keine Backend-/Datenbankänderung und keine Veröffentlichung.

## Speicheraktionen nur bei Änderungen

Lokal seit 31.10.2026, noch nicht veröffentlicht: `public/js/save-button-state.js` steuert Datensatz-Speicherbuttons anhand von Änderungs- und Sperrzustand. Der bestehende `form-guard.js` bindet die Funktion zentral für alle geschützten Adminformulare ein. Nur geänderte Formularwerte aktivieren den nativen Submitbutton; Fokus/Klick ohne Wertänderung nicht. Rücknahme auf den geladenen Stand und erfolgreiches Speichern deaktivieren ihn wieder. Auch Enter beziehungsweise programmatische Submit-Ereignisse ohne Änderung werden vor den Speicherhandlern abgefangen. Neue Datensätze werden nach Eingabe/Upload speicherbar; bestehende Pflichtfeldvalidierung bleibt zusätzlich aktiv.

Die Snapshots ignorieren Aktionsbuttons, Fieldsets und ausdrücklich mit `data-save-ignore` markierte Hilfefelder (Tagsuche). Verbindlich ausgewählte Tags, Checkboxen, Textfelder und versteckte Bildpfade zählen. Nach programmgesteuerten Änderungen weiterhin `guard.refresh()`, nach Laden beziehungsweise bestätigtem Speichern `guard.clean(form)` aufrufen. `inert`/`aria-busy` am Formular oder seinen Vorfahren bleiben wirksam. Ein MutationObserver gleicht bestehende pauschale Button-Freigaben nach Lade-/Speicherende ab, ohne Erfolgsmeldungen zu löschen. Bei Fehlern wird der geänderte Stand nicht als gespeichert markiert; Abbrechen und Löschen werden von dieser Speicherlogik nicht gesperrt.

Die Kontoseite verwendet dieselbe Steuerung für Benutzername und Passwort; keine Änderung der bisherigen Navigation oder Einführung weiterer Verwerfen-Dialoge. Der bereits gewählte Held hat im Vorstellungsdialog eine deaktivierte Auswahlaktion. Authentifizierung, Registrierung und andere ausdrücklich ausgelöste Aktionen sind keine Änderung eines geladenen Datensatzes und erhalten ihre bisherige Bedienlogik. Der Bildaustauschdialog besitzt bereits seine Dateiauswahl-Sperre. Vorhandener zentraler Disabled-Stil (`--opacity-disabled`, 0.45, kein Hover, `cursor: not-allowed`) unverändert.

Prüfung: 55 Frontendtests und JS-Syntax erfolgreich. Browserfixtures prüfen Grundzustand, Fokus, Änderung/Rücknahme, Checkboxen, Bildpfadänderung, Tastatur-Submit ohne Schreibaufruf, Busy-Sperre, Erneutversuch nach Fehler und Sperre nach Erfolg einschließlich nachträglicher pauschaler Buttonfreigabe. Zusätzlich echter Helden-Dialog mit simuliertem Speicherfehler/Erfolg sowie Konto-Benutzername und Passwortreset geprüft. Native Deaktivierung und Deckkraft 0.45 bestätigt. Keine echten Kontodaten verändert, keine Backend-/Datenbankänderung; Production unverändert.

Das bisherige Beta-Design ist seit dem 17.10.2026 der gemeinsame Standard auf `master`. Der separate Branch `design/beta` wird nach der Uebernahme entfernt. Alle spaeteren Designaenderungen bauen auf diesem Stand auf.

## Entwicklung und Deployment

Docker: `docker compose up -d app`. Startseite: http://localhost:8081/, Adminbereich: http://localhost:8081/admin/.

Hostinger veroeffentlicht weiterhin nur den Branch `hostinger`. Ein Push auf `master` alleine aktualisiert die Live-Seite nicht. Fuer einen freigegebenen Release den geprueften master-Stand in hostinger uebernehmen.

## Aufbau

`styles/abstracts/tokens.css` enthaelt die gemeinsamen Skalen und Rollen; `styles/themes/app-tokens.css` definiert die aktuelle Palette. Die Strukturbereinigung vom 22.10.2026 ordnet Gestaltung und responsive Regeln direkt den Basis-, Layout-, Komponenten- und Featuremodulen zu. Eine nachgeschaltete `themes/app.css` ist aufgeloest; die Bereinigung ist mit Release cb23f51a0cc4-20261022131903 veroeffentlicht (Rollout: HOSTINGER-PRODUCTION.md). `styles/main.css` legt die Importreihenfolge fest. Regeln: [CSS-Design-System](../../../styles/README.md), Pruefung: [Modularisierung](../../CSS-MODULARISIERUNG-2026-10-22.md).

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

Produktionskonfiguration und Datenhaltung: [Hostinger Production](../../HOSTINGER-PRODUCTION.md). Ein Branchwechsel oder Deployment importiert keine Fragen und setzt die Datenbank nicht zurueck.
# Mobile Dialogabstände (lokale Anpassung, 31.10.2026)

Standarddialoge verwenden unterhalb beziehungsweise bei 768 Pixeln für `.modal__content` die Breite `min(calc(100% - var(--space-24)), 600px)` mit `border-box`. Das ergibt mindestens 12 Pixel seitlichen Abstand. Bestehende engere Maximalbreiten bleiben wirksam. Die Regel liegt nach den allgemeinen Modalregeln, welche die frühere mobile Breite überschrieben hatten. Desktoplayout und bestehende Innenabstände bleiben erhalten. Der separate Teilen-Dialog besitzt bereits eigenen seitlichen Abstand und wird nicht geändert.

Browserprüfung bei 430 Pixeln: Footer-, Ergebnis- und Fragenfeedbackdialog jeweils 12 Pixel links/rechts, kein horizontaler Überlauf. Bei 320 Pixeln Footer ebenfalls 12 Pixel je Seite ohne Überlauf. CSS-Build mit Token- und BEM-Prüfung erfolgreich. Keine Anwendung oder Datenbank veröffentlicht; Änderung nur lokal.
