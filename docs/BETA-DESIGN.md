# Beta-Design

Isolierter Entwurf auf Branch `design/beta`, ausgehend von `hostinger` bei `8ad65a7`.
Das Hostinger-Deployment bleibt auf Branch `hostinger` und erhaelt diesen Entwurf nicht automatisch.

## Vorschau

Docker wie gewohnt starten: `docker compose up -d app`.

- Startseite und Quiz: http://localhost:8081/
- Anmeldung / Registrierung: http://localhost:8081/login.html
- Profil: http://localhost:8081/account.html
- Adminbereich: http://localhost:8081/admin/

Die existierenden lokalen Anmeldungen funktionieren weiter. Auf der Loginseite kann fuer das lokale Profil auch die vorhandene Funktion "Lokal testen" verwendet werden.

## Gestaltung

Helle kuehle Flaechen, dunkles Blau, Petrol und ein dezenter Mint-Akzent. Originale Schriftkombination: Source Sans 3 im Fliesstext (16px), Oswald fuer Ueberschriften (Gewicht 300, 2px Buchstabenabstand). Klarere Typografie, Bildkarten fuer Orte und kompakte Themenkarten. Quizantworten besitzen Buchstaben sowie erkennbare Richtig-/Falsch-Symbole. Formulare, Adminlisten, Navigation, Dialoge und Profil sind auf die gemeinsame Gestaltung abgestimmt.

Der Entwurf liegt bewusst als abschliessende Theme-Schicht unter `styles/themes/beta.css`. `styles/main.css` bindet sie ein; `node scripts/build-css.js` erzeugt `public/styles.css`. So bleibt der Vergleich mit der bisherigen Gestaltung einfach. Bei Uebernahme kann die Theme-Schicht schrittweise in die Komponenten aufgeteilt werden.

Es gibt keine neuen Abhaengigkeiten, externen Fonts oder Trackingdienste. Backend, Datenmodell und Quizwertung wurden nicht geaendert.

## Pruefung

- 15 Contracttests erfolgreich; BEM-Pruefung erfolgreich.
- Desktop- und Smartphone-Screens fuer Startseite, Fragenauswahl, Quiz, Ergebnis, Login, Registrierung, Profil und angemeldeten Adminbereich visuell geprueft.
- Alle Adminreiter bei 320, 768 und 1440 Pixeln Breite ohne horizontalen Seitenueberlauf geprueft; mobile Hauptansichten zusaetzlich bei 390 Pixeln.
- Komplette angemeldete Fuenf-Fragen-Runde mit richtigem zweiten Versuch und bestaetigter Ergebnisablage ausschliesslich in der lokalen Datenbank gespielt.
- Fokusmarkierung, reduzierte Bewegung und mindestens 44 Pixel hohe zentrale Bedienelemente beruecksichtigt.

## Zum bisherigen Design zurueck

Bei sauberem Arbeitsstand: `git switch hostinger`.
Docker liefert die Dateien des Arbeitsordners direkt aus; ein Datenbankwechsel oder Container-Neubau ist dafuer nicht erforderlich. Anschliessend die Browserseite neu laden.

Zur Beta zurueck: `git switch design/beta`.

Keine der beiden Fassungen muss fuer einen Vergleich geloescht werden. Die Datenbank wird beim Branchwechsel nicht zurueckgesetzt.

## Kompakte zweite Fassung

Die Startseite verwendet eine schmale Marken-Kopfzeile statt einer grossen Begruessungsflaeche. Mobil entfaellt der zusaetzliche Beschreibungstext. Im Quiz sitzen Kategorie, Fortschritt, Punkte und Abbrechen in einer kompakten Zeile. Die Accountnavigation ist waehrend der Runde ausgeblendet und nach dem Verlassen wieder verfuegbar. Fragen entsprechen mit 16 Pixeln und Gewicht 400 der urspruenglichen Quiztypografie. Bilder sind auf maximal 220 Pixel beziehungsweise 28 Prozent der Viewporthoehe begrenzt. Antwortflaechen bleiben mindestens 50 Pixel hoch; Abbrechen hat mobil ein 44-Pixel-Touchziel.
