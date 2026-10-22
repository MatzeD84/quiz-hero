# Quiz-Hero – Feature-Übersicht

Stand: 18. Oktober 2026. Kompakter Überblick über den aktuellen Projektstand und mögliche nächste Erweiterungen. Die Ideen am Ende sind noch nicht implementiert und keine verbindliche Reihenfolge.

## Bereits implementiert

### Quiz spielen

- **Kategorien und Themen:** Quiz über eine Kategorie oder ein kategorienübergreifendes Thema auswählen.
- **Zufällige Runden:** Fragen werden für jede neue Runde gemischt; die Rundengröße ist auswählbar.
- **Text- und Bildfragen:** Vier Antwortmöglichkeiten, ergänzendes Hintergrundwissen und Bilder mit KI-Kennzeichnung.
- **Drei Schwierigkeitsgrade:** Normal, Schwer und Hero mit unterschiedlicher Punktewertung.
- **Lernmodus mit zwei Versuchen:** Zweiter richtiger Versuch bringt weiterhin einen Punkt; Lösungen werden nach dem letzten Versuch aufgedeckt.
- **Ergebniskarte:** Punkte, richtig gelöste Fragen, Kategorie und Kategoriebild nach Abschluss.
- **Fragenfeedback:** Probleme oder Anmerkungen zu einzelnen Fragen melden.

### Account und Profil

- **Gastmodus:** Quiz ohne Account spielen; dauerhafte persönliche Ergebnisse benötigen ein Konto.
- **Registrierung und Anmeldung:** E-Mail-Bestätigung, erneuter Bestätigungsversand und Passwort vergessen.
- **Eigene Profilseite:** Avatar, Benutzername und Passwort verwalten; Konto löschen.
- **Kontomenü:** Burger-Menü mit passenden Einträgen für Gäste und angemeldete Nutzer, Icons und Hintergrund-Overlay.
- **Transaktionsmails:** Versand für die vorgesehenen Account- und Feedback-Abläufe über die serverseitige Mailkonfiguration.

### Persönlicher Quiz-Reisepass

- **Eigene Reisepass-Seite:** Getrennt von den Kontoeinstellungen und nur nach Anmeldung zugänglich.
- **Gesamtzahlen:** Beendete Runden, entdeckte Kategorien und entdeckte Themen.
- **Nächstes Abenteuer:** Zuletzt gespieltes, noch verfügbares Quiz; gegebenenfalls eine neue Kategorie als Alternative.
- **Quiz-Reisen:** Karten nach Rundenzahl absteigend und bei Gleichstand alphabetisch sortiert; archivierte Ziele werden nicht als Karten angeboten.
- **Erfolgsquoten:** Drei kompakte Karten für Normal, Schwer und Hero mit Prozentwert und Anzahl ausgewerteter Fragen.
- **Fehlerwiederholung:** Pro Kategorie bis zu zehn zufällig ausgewählte, zuletzt falsch beantwortete Fragen üben. Später richtig gelöste Fragen fallen wieder heraus.
- **Klarer Übungsmodus:** Kennzeichnung im Spiel und Ergebnis, Rückweg zum Reisepass und erneuter Speicherversuch bei Fehlern.

Die Erfolgsquoten zählen beide Versuche und wiederholte Fragen mit. Alte Runden ohne einzelne Frageergebnisse werden nicht nachträglich ergänzt. „Kategorie entdeckt“ bedeutet mindestens eine beendete Runde, nicht sämtliche Fragen gemeistert.

### Teilen und Freunde herausfordern

- **Ergebnis als Bild:** Persönliche Ergebniskarte mit Logo, Kategorie, Bild und Punktzahl lokal im Browser erzeugen.
- **Vorschau und Download:** Eigenes Dialogfenster; Bild herunterladen oder bei Browser-Unterstützung über das native Teilen-Menü teilen.
- **Einladungslinks:** Kategorie und Rundengröße teilen oder Link kopieren. Freunde bekommen eine eigene, neu gemischte Runde.
- **Registrierungshinweis für Gäste:** Nach dem Ergebnis auf die Vorteile eines Accounts aufmerksam machen.

### Admin und Inhalte

- **Geschützter Adminbereich:** Fragen, Kategorien, Medien, Feedback und Spieler verwalten.
- **Fragenpflege:** Fragen anlegen, bearbeiten, löschen, aktivieren/deaktivieren sowie nach Kriterien suchen, filtern und sortieren.
- **Redaktionelle Angaben:** Schwierigkeit, Tags, Hintergrundwissen, Quellen, Bildbeschreibung und Prüfstatus pflegen.
- **Kategorienpflege:** Texte, Bilder, Verfügbarkeit und Hinweis-Badges verwalten.
- **JSON-Import:** Fragensätze mit Validierung und Beispielvorlage importieren.
- **Mediathek:** Bilder hochladen, suchen, zuordnen und im vorgesehenen Verwaltungsablauf löschen.
- **Feedback- und Spielerübersicht:** Eingegangene Meldungen sowie registrierte Konten einsehen und verwalten.

### Gestaltung und technische Grundlage

- **Responsives Design:** Einheitliches Erscheinungsbild mit zentralen CSS-Tokens, Dialogen und mobilen Ansichten.
- **Datenschutz-Auswahl:** Cookie-Einstellungen und Laden von Google Analytics erst nach Zustimmung.
- **Dauerhafte Ergebnisse:** Serverseitige Wertung, einzelne Frageergebnisse und Schutz vor doppeltem Speichern.
- **Historische Inhalte:** Gemeinsam verwendete, unveränderliche Fragenversionen und gespeicherte Kategorie-/Themennamen. Alte Bilddateien werden noch nicht separat archiviert.
- **Zugriffsschutz:** Sitzungen, CSRF-Prüfungen und Begrenzung empfindlicher Anfragen.
- **SEO-Inhalte:** Kategorieseiten und Sitemap aus dem aktuellen Datenbankbestand.
- **Hostinger-Deployment:** Git-basierter Build mit Prüfungen, versionierten Releases und Rücksprungmöglichkeit. Inhalte und Uploads bleiben vom Code-Deployment getrennt.
- **Lokale Entwicklung und Tests:** Docker-Umgebung, automatisierte Prüfungen und isolierte Datenbanktests.

## Aktuelle Verbesserungen – Release vom 18. Oktober 2026

- **Ladehinweis in der Mediathek:** Kleiner Status mit Spinner unten links während Listenabruf und Laden sichtbarer/naher Bilder; verschwindet nach Abschluss oder beim Verlassen der Mediathek.
- **Bilder zentral austauschen:** In der Mediathek neues Bild mit Vorschau auswählen und bestätigen; alle aktuellen Fragen- und Kategorieverwendungen automatisch gemeinsam umstellen. Alte Dateien für historische und laufende Runden behalten, neue URL verhindert veraltete Browserbilder.
- **Kategorien ohne technische Eingaben:** IDs neuer Kategorien entstehen serverseitig aus dem Namen, bei Kollisionen mit nummeriertem Zusatz. ID und Sortierung sind keine sichtbaren Eingabefelder mehr; bestehende IDs und Sortierwerte bleiben erhalten.
- **Admin-Formularbreiten:** Neue Fragen und Kategorien nutzen die gesamte Panelbreite. Antwortfelder passen sich ihren Gridspalten an, ohne Überlappung oder seitlichen Überlauf.
- **Tags als Chips:** Einzelne Tags hinzufügen und entfernen; vorhandene Tags ab zwei Buchstaben vorschlagen. Auswahl per Maus oder Pfeiltasten/Enter, neue Tags per Enter, Komma oder beim Verlassen des Felds übernehmen. Schreibweise vorhandener Tags wiederverwenden und Duplikate verhindern; bisheriges Speicherformat bleibt erhalten.
- **Kompaktere Fragenbearbeitung:** Richtige Antwort und Schwierigkeit stehen auf Desktop nebeneinander, bis 600 Pixel Viewportbreite untereinander.
- **Schlankeres Fragenformular:** „Fachlich geprüft von“ entfernt; bestehende Angaben bleiben beim Bearbeiten erhalten. Keine Änderung am Datenbankschema.
- **Ausgewählte Admin-Frage:** Gleichmäßiger umlaufender Rahmen statt einseitigem linken Akzent; die dezente Hintergrundmarkierung bleibt bestehen.
- **Admin-Oberfläche vereinfacht:** Den globalen Button „Daten neu laden“ entfernt. Fragen und Kategorien werden weiterhin beim Öffnen, Einloggen und nach den vorgesehenen Speicheraktionen geladen.
- **Startseite nach Anmeldung:** Login und erfolgreiche E-Mail-Bestätigung einer Registrierung führen zur Kategorienübersicht. Der Reisepass bleibt über das Kontomenü erreichbar.
- **E-Mail-Bestätigung im passenden Schritt:** Registrierung erklärt die Bestätigung und führt danach in einen eigenen Hinweisbereich. Erneuten Versand nur nach Registrierung, bei unbestätigtem Login oder fehlgeschlagenem Bestätigungslink anbieten; beim Passwort-Zurücksetzen ausblenden.
- **Klarere Profilverwaltung:** Benutzername erst per Stift bearbeiten und separat speichern; Passwortwechsel mit eigener Bestätigung und Wiederholung. Kontolöschung in einem eigenen Bestätigungsdialog.
- **Profilbildauswahl im Konto (lokal):** Aufklappbarer Bereich unter dem Benutzernamen statt Profilbild-Dialog. Verfügbare Helden als Karten mit Namen und Auswahlmarkierung; automatisches Speichern bei Auswahl. Belohnungslinks öffnen den Bereich direkt.
- **Helden auswählen (lokal):** Das Konto-Akkordeon heißt „Helden auswählen“. Der zusätzliche Link „Bild ändern“ am aktuellen Profilbild entfällt; das Bild selbst ist nicht mehr anklickbar.
- **Ausgewählter Held in Hero-Farben (lokal):** Lila Rahmen und dezent lila Hintergrund über zentrale Tokens; andere Auswahlkomponenten behalten ihre bisherigen Farben.
- **Heldenkarten bei Registrierung (lokal):** Gleiche benannte Karten wie im Konto einschließlich lila Rahmen und dezent lila Hintergrund der Auswahl. Die Wahl wird weiterhin erst mit der Registrierung übermittelt.
- **Heldenprofil-Kopf (lokal):** Hero-lila Verlauf mit dezentem Lichtakzent und heller Schrift; aktuelles Profilbild bleibt auf weißer Kreisfläche sichtbar. Darstellung mit langen Namen und E-Mail-Adressen auf schmalen Ansichten abgesichert.
- **Erkennbare Konto-Akkordeons (lokal):** Profilbildauswahl und Passwortänderung mit durchgehendem dünnem Rahmen in der bestehenden Eingabefeld-Rahmenfarbe.
- **Profilabschluss ohne doppelten Trenner (lokal):** Zusätzliche Linie zwischen Passwort-Akkordeon und Kontoaktionen entfernt; Abstand und Akkordeonrahmen bleiben erhalten.
- **Abstand nach Benachrichtigungen (lokal):** Befüllte Konto-/Login-/Reisepass-/Souvenir-Statusmeldungen erhalten einen einheitlichen Abstand zum folgenden Inhalt; gilt für Erfolg, Fehler und Hinweise. Leere Meldungen erhalten keinen zusätzlichen Abstand.
- **Info-Icon im Hintergrundwissen:** Ein dezentes Symbol am Textanfang kennzeichnet die ergänzende Wissenskarte im Quiz.
- **Kompaktere Quizansicht auf Laptops:** Weniger vertikale Abstände und schlankere Antwortbuttons machen „Weiter“ bei typischen Laptop-Höhen ohne Scrollen erreichbar. Sehr lange Inhalte können weiterhin Scrollen benötigen; Schrift und Bildbegrenzung bleiben erhalten.

## Mögliche nächste Features

### Lokal umgesetzt – Souvenirs Version 1 (noch nicht veröffentlicht)

- **Städte-Sammlung:** Reisestempel für den ersten tatsächlichen Kategorienbesuch und Low-Poly-Reisemarke für Rom, Florenz und Amalfi-Küste nach 20, für Neapel nach fünf unterschiedlichen richtig gelösten Fragen; erster oder zweiter Versuch zählt. Serverseitige, einmalige Vergabe.
- **Ergebnishinweise:** Neue Erinnerungsstücke erscheinen einzeln mit Motiv und Namen vor „Freunde herausfordern“; der Ergebnislink führt zur separaten Souvenir-Seite. Keine Souvenir-Sektion im Reisepass. Belegbarer Altfortschritt wird berücksichtigt.
- **Eigene Souvenir-Seite:** `souvenirs.html` für angemeldete Nutzer, erreichbar über das Kontomenü. Erhaltene und begonnene Entdecker-Souvenirs je Kategorie: Stempel links, Marke rechts, mobil untereinander. Fortschritt nur durch richtige Antworten; Sepia-Motiv und dezenter grauer Hintergrund bis zur Vergabe. Ohne Filter, zusätzlichen Gesamtzähler oder Profilbildbereich.
- **Profilbild als Belohnung (lokal):** Neuer Low-Poly-Held Astra nach einer Hero-Frage, die im ersten Versuch richtig gelöst wurde. Vergabe beim bestätigten Rundenabschluss; vor Erhalt verborgen, dauerhafte Berechtigung danach, Ergebnishinweis „Neue Heldenbelohnung“ mit „Neues Profilbild freigeschaltet“. Kein automatischer Profilbildwechsel; lokaler Test-Reset entfernt die Freischaltung.
- **Profilbilder in der Mediathek (lokal):** Eigener Tab mit Namen, Suche, Upload und Motivwechsel. Frei oder Belohnung wählen, Bilder aktivieren/deaktivieren und löschen. Aktive freie Bilder stehen automatisch in der Profilbildauswahl; Belohnungen erst nach Erhalt. Betroffene Accounts fallen beim Deaktivieren/Löschen auf den geschützten Standardhelden zurück. Details: [Mediathek](docs/MEDIA.md).
- **Einheitliche Medienkacheln (lokal):** Profilbilder verwenden dieselben Bildflächen, Abstände, Rahmen und linksbündigen Beschriftungen wie Fragebilder. Heldenmotive bleiben vollständig sichtbar.
- **Souvenir-Bilder in der Mediathek (lokal):** Eigener Reiter für bestehende Motive und neue Uploads; diese erscheinen nicht mehr unter Bilder. Verwendete Motive werden über die versionierte Souvenir-Verwaltung bearbeitet. Details: [Mediathek](docs/MEDIA.md).
- **Adminpflege:** Feste Regeln, Zielwerte, Motive aus Mediathek/Upload, Entwurf/Aktiv/Archiviert und versionierte Änderungen. Lokaler Test-Reset für `@example.test`-Accounts; in Production gesperrt.
- **Souvenir-Bestand im Admin:** Motivübersicht mit Name, Kategorie, Regel/Zielwert und Status, Suche und Filtern. Klick auf eine Kachel öffnet die Bearbeitung darunter; neue Souvenirs werden über „Neu anlegen“ erstellt. Schutz ungespeicherter Änderungen bleibt erhalten.
- **Reisemarken und Adresse (lokal):** Auch erhaltene Reisemarken zeigen ihren erreichten Fortschritt als „20 von 20 Fragen richtig gelöst“ mit gefülltem Balken; Reisestempel bleiben ohne Balken. Reisepass unter `reisepass.html`, alte Adresse mit dauerhafter Weiterleitung.
- **Einheitlicher Admin-Ladehinweis (lokal):** Gemeinsamer Spinner unten links für Fragen/Kategorien, Spieler, Feedback, Souvenirs, Mediathek und sichtbare/nahe Bilder. Parallele Anfragen teilen sich eine Anzeige; Abschluss und Fehler beenden den jeweiligen Ladezustand. Details: [Mediathek und Ladeanzeige](docs/MEDIA.md).
- **Datenbank:** Migrationen 014 bis 019 lokal angewendet; vor einem späteren Deployment auf Production separat anwenden. Migration 019 ergänzt die Amalfi-Definitionen ohne Schemaänderung. Details, Tests und weitere Ideen: [Souvenir.md](Souvenir.md).

### Bereits gemeinsam vertieft / vorgemerkt

| Idee | Kurzer Ausblick |
|---|---|
| **Souvenirs und Reisepass-Meilensteine** | Ortsbezogene Reisestempel und besondere Sammelkarten; Regeln, Status und weitere Belohnungsideen stehen zentral in [Souvenir.md](Souvenir.md). |
| **Sammlung erweitern** | Weitere Städte und Belohnungsarten auf der separaten Souvenir-Seite ergänzen; Regeln vor Umsetzung festlegen. |
| **Private Freunde und interne Einladungen** | Andere Accounts nach gegenseitiger Zustimmung verbinden und innerhalb von Quiz-Hero zu eigenen, neu gemischten Runden einladen. |
| **Admin-Auswertung der Quizaktivität** | Beendete Runden und Ergebnisse je Nutzer und Kategorie nachvollziehen; später häufige Stolperfragen erkennen. |

### Weitere interessante Optionen – noch offen

| Idee | Kurzer Ausblick |
|---|---|
| **Gezielte Lernwiederholung** | Schwierige Fragen nach passenden Zeitabständen wieder anbieten, statt nur die aktuell offenen Fehler zu sammeln. |
| **Fortschritt über unterschiedliche Fragen** | Zwischen gesehenen, beantworteten und sicher gelösten Fragen unterscheiden, ohne einen Kategorienabschluss vorzutäuschen. |
| **Kleines Tagesquiz** | Eine kurze wechselnde Runde als unkomplizierter Anlass zum Wiederkommen. |
| **Eigene Themenverwaltung im Admin** | Themen unabhängig von der Tag-Eingabe an Fragen vollständig pflegen. |
| **Redaktionelles Änderungsprotokoll** | Änderungen an Inhalten nachvollziehen und versehentliche Eingriffe leichter erkennen. |
| **Historische Rückblicke mit Bildern** | Alte Antworten samt damaligem Fragenstand anzeigen; dafür zusätzlich unveränderliche Mediendateien aufbewahren. |

Ausführlichere Ideen und Überlegungen stehen in [hinweise.md](hinweise.md). Diese Übersicht ersetzt die persönliche Ideensammlung nicht.
