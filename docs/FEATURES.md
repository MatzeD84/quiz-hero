# Quiz-Hero – Feature-Übersicht

Stand: 23. Oktober 2026. Kompakter Überblick über den aktuellen Projektstand und mögliche nächste Erweiterungen. Lokale Änderungen sind gesondert gekennzeichnet. Die Ideen am Ende sind noch nicht implementiert und keine verbindliche Reihenfolge.

## Bereits implementiert

- **Startfähigkeiten mit 0 Runden (lokal, 31.10.2026):** Fähigkeiteneditor akzeptiert 0–100 Runden. Null bedeutet sofort verfügbar für zugeordnete Helden und sichtbar in Registrierung/Konto; positive Werte bleiben erlernbar. Startfähigkeiten erzeugen keine falsche Lernerfolgsmeldung. Bestehende Schwellen und Zuordnungen unverändert, keine Migration, noch nicht veröffentlicht. [Regeln](Heldenfähigkeit.md#startfähigkeiten-mit-0-runden-31102026-lokal).

- **Heldenvorstellung nur mit freigeschalteten Fähigkeiten (lokal, 31.10.2026):** Konto zeigt ausschließlich persönlich für diesen Helden erlernte und aktuell verfügbare Fähigkeiten. Registrierung zeigt bei Start ohne Freischaltungen keine Fähigkeitskarten. Leere Vorschau ohne Einsatzhinweis/Leerleiste, stattdessen kurzer Freischalthinweis. Admin-Repertoire und Lernregeln unverändert; keine neuen Sofort- oder Grundfähigkeiten. Keine Migration, noch nicht veröffentlicht.

- **Lernerfolg nennt den Helden (lokal, 31.10.2026):** Quiz-Ergebnis formuliert „Burgo hat eine neue Heldenfähigkeit erlernt“ beziehungsweise „… zwei/drei neue Heldenfähigkeiten erlernt“. Der bei Rundenstart übernommene Heldenname wird für die Ergebnisansicht festgehalten; kein späterer Profilwechsel als Textquelle. 57 Frontendtests und Browserprüfung erfolgreich. Keine Migration oder Vergabeänderung, noch nicht veröffentlicht.

- **Freischaltgrund bei neuen Helden im Quiz-Ergebnis (lokal, 31.10.2026):** Kleine Beschreibung unter dem Heldennamen erklärt Anzahl, Schwierigkeit, Zeitraum, Kategorie und relevante Erstversuchs-/Hilfebedingungen. Grundlage sind historische Vergabe-Snapshots statt heutiger Regeln. 57 Frontendtests, 290 Integrationstests und Browser-/CSS-Prüfung erfolgreich. Keine Migration, noch nicht veröffentlicht. [Regeln und Daten](HELDENBELOHNUNGEN.md#freischaltgrund-im-quiz-ergebnis).

- **Speicherdialoge nach Erfolg schließen (lokal, 31.10.2026):** Heldenbearbeitung schließt nach bestätigtem gemeinsamen Speichern. Einheitliche kurze Bestätigung unten links, auch für Bildaustausch und gespeicherten Konto-Helden; Feedbackdialog schließt nach erfolgreicher Übermittlung sofort. Speicherfehler behalten Dialog und Eingaben. Ladeanzeige und Bestätigung stehen ohne Überlagerung untereinander. 56 Frontendtests, Browser-, CSS-/BEM- und Syntaxprüfung erfolgreich. Keine Migration, noch nicht veröffentlicht.

- **Speichern nur bei Änderungen (lokal, 31.10.2026):** Gemeinsame Sperre für Datensatzformulare in Fragen, Kategorien, Quizwelten, Profilbild-Mediathek, Souvenirs, Heldenbelohnungen sowie Helden und Fähigkeiten. Speicherbuttons sind ohne Änderung nativ deaktiviert, nach Rücknahme oder Erfolg erneut gesperrt; Eingaben bleiben nach Fehlern erneut speicherbar. Konto: Benutzername/Passwort und bereits ausgewählter Held ebenfalls berücksichtigt. 55 Frontendtests und Browserprüfungen erfolgreich. Keine Migration, noch nicht veröffentlicht. [Technik und Grenzen](DESIGN.md#speicheraktionen-nur-bei-änderungen).

- **Motive für Scharfblick und Glücksanker (lokal, 31.10.2026):** Zwei transparente Low-Poly-Medaillons erzeugt, im Projekt gespeichert und per Migration 027 mit den Fähigkeiten verknüpft. Bestehende Motivverwaltung und Mediathek-Reiter verwenden sie automatisch. [Dateien und Prompts](HELDENFAEHIGKEITEN-BILDER.md). Noch nicht veröffentlicht.

- **Scharfblick und Glücksanker (lokal, 31.10.2026):** Zwei falsche Antworten vor dem ersten Versuch bei maximal zwei Punkten beziehungsweise ein Trostpunkt nach zwei Fehlversuchen. Trostpunkt bleibt falsch beantwortet; keine Kombination dieser Hilfen an derselben Frage. Adminpflege und persönliche Freischaltung integriert, Migration 026 lokal angewendet. Beispielzuordnung: Anubia/Bobo. Spurensuche, Dunkler Pakt und Revanche bleiben Ideen. [Regeln und Betrieb](Heldenfähigkeit.md#scharfblick-und-glücksanker-31102026-lokal-implementiert). Noch nicht veröffentlicht.

Dokumentierter Ausblick, **nicht implementiert**: Spurensuche, Dunkler Pakt und Revanche mit Einsatzbedingungen und Wertungsideen in [Heldenfähigkeit.md](Heldenfähigkeit.md#vorschlagsrunde-vom-31102026-fünf-zusätzliche-fähigkeiten). Scharfblick und Glücksanker aus dieser Vorschlagsrunde sind inzwischen umgesetzt, siehe oben.

- **Kompakte Fähigkeitsübersicht auf Admin-Heldenkarten (lokal, 31.10.2026):** Anzahl als „1 Fähigkeit“/„2 Fähigkeiten“ statt „von 3“. Zugeordnete Namen als kleine, umbrechende Labels mit dezenter Hero-Fläche; leere Zuordnungen nur mit „Keine Fähigkeiten“, ohne zusätzliche Leerzeile. Keine Verhaltensänderung, noch nicht veröffentlicht.

- **Heldenverwaltung übersichtlicher (lokal, 31.10.2026):** Freischalt-Dropdown entfernt; bestehende Regelquelle bleibt beim Speichern erhalten, neue Belohnungszuordnung verweist auf den Baukasten unter Belohnungen. Belohnungshelden tragen dasselbe „Belohnung“-Tag wie im Konto. Inaktive Heldenbilder verwenden dauerhaft den zentralen Sepia-Filter; Karten bleiben bearbeitbar. Keine Migration, noch nicht veröffentlicht.

- **Held gemeinsam speichern (lokal, 31.10.2026):** Fähigkeiten im Heldenformular oberhalb von „Held speichern“. Ein Button und ein Request übernehmen Stammdaten und Zuordnung atomar; Versionskonflikte oder ungültige Fähigkeiten verhindern auch Teiländerungen. Kein separater Zuordnungsbutton und keine neue Migration. Noch nicht veröffentlicht.

- **Belohnungshelden im Konto markieren (lokal, 31.10.2026):** Freigeschaltete Belohnungshelden tragen in der Heldenauswahl unter ihrem Namen ein kleines „Belohnung“-Tag mit heller Hero-Fläche und lila Text. Freie Helden und Registrierung unverändert; keine neue Datenbanklogik. Noch nicht veröffentlicht.

- **Heldenpflege getrennt von Mediathek (lokal, 31.10.2026):** Name, Verfügbarkeit, Freischaltquelle und Aktivstatus im Heldenkarten-Dialog; Mediathek-Profilbilder nur mit Bildaustausch und Löschen. Neue Uploads vorläufig nach Datei benannt und inaktiv. Bestehender Standardheld-Fallback unverändert. 49 Frontendtests und Browserprüfung mit simulierten Speicherantworten erfolgreich; noch nicht veröffentlicht. [Bedienung](MEDIA.md#trennung-von-bildern-und-heldenpflege-31102026-lokal).

- **Lokale Testbelohnungen (31.10.2026):** Vier aktive Beispielregeln für Gesamtfortschritt, Einzelrunde, Hero-Fragen und Rom direkt Amphos, Cassius, Akuma und Horus zugeordnet. Ursprüngliche Testduplikate zusammengeführt und aus dem sichtbaren Bestand entfernt; Freischaltungen erhalten, Datenbankabgleich erfolgreich. Die vier echten Helden sind lokal jetzt Belohnungshelden; kein Produktionsimport. [Testbedingungen](HELDENBELOHNUNGEN.md#lokale-testdatensätze-31102026).

- **Heldenbelohnungen frei konfigurieren (lokal, 31.10.2026, noch nicht veröffentlicht):** Hauptreiter „Souvenirs“ heißt „Belohnungen“, mit Unterbereichen für Souvenirs und neue Helden. Regel-Baukasten für Anzahl, Schwierigkeit, Versuch, Hilfe, Kategorie und beide Zeitrahmen (insgesamt/eine Questrunde); Live-Zusammenfassung, Bildauswahl aus Belohnungsprofilen, Entwurf/aktiv/archiviert. Unterschiedliche gespeicherte Fragen zählen, bestehende Freischaltungen bleiben erhalten. Migration 025 lokal angewendet; 49 Frontendtests und 272 Integrationstests erfolgreich. [Regeln, Pflege und Betrieb](HELDENBELOHNUNGEN.md).

- **Admin-Reiter „Helden“ (lokal):** Bisherigen Hauptreiter „Heldenfähigkeiten“ umbenannt. Heldenkarten und Fähigkeitszuordnung stehen zuerst, darunter die Bearbeitung vorhandener Fähigkeiten. Zwei kleine Sprunglinks navigieren innerhalb der Ansicht, ohne Änderungen zu verwerfen. Mediathek-Reiter „Heldenfähigkeiten“ und bestehende Speicherlogik bleiben erhalten. 48 Frontendtests, CSS-/BEM-Build und mobile Browserprüfung erfolgreich.

- **Mobile Dialogränder (lokal):** Gemeinsame Standardmodale behalten bis 768 Pixel Breite mindestens 12 Pixel Abstand links und rechts. Die mobile Breitenregel steht nach der allgemeinen Modalbreite und wird nicht mehr überschrieben. Browserprüfung bei 320/430 Pixeln ohne Überlauf; CSS-/Token-/BEM-Build erfolgreich.

- **Ruhigere Fähigkeitenauswahl (lokal):** Fähigkeitskarten in Quiz, Profil und Registrierung standardmäßig transparent, ausgewählte Karte auf derselben hellen Surface wie die Erklärung. Keine reduzierte Deckkraft aktiver Karten. Quiz-Einstieg rahmenlos ohne Hintergrund, kleines Sepia-Heldenbild mit „Hilfe · N Fähigkeiten bereit“; Einzahl und leerer Zustand ausdrücklich sichtbar. Hover unterstreicht nur „Hilfe“.

- **Fähigkeitserklärung hervorgehoben (lokal):** In der Heldenvorstellung erscheint die angeklickte Fähigkeit als helle Infokarte mit durchgehendem dünnem lila Rahmen und kleiner Überschrift „[Fähigkeit] · Deine Fähigkeit“. Beschreibung bleibt gut lesbar in normaler Textfarbe; jeweils nur eine Erklärung sichtbar.

- **Kürzerer Hinweis im Heldendialog (lokal):** „Jede erlernte Fähigkeit ist einmal pro Questrunde nutzbar.“ Kein zusätzlicher Hinweis zur Mindestfragenzahl; Spiellogik unverändert.

- **Einheitliche Dialogdetails (lokal, 31.10.2026):** Fähigkeiten in der Heldenvorstellung als kompakte Karten mit dezentem lila Rahmen/Hintergrund, Namen in normaler Textfarbe. Standarddialoge erhalten ihr Schließen-SVG zentral aus `public/js/dialog.js`, einschließlich der Heldenvorstellung; Position, Hover und Fokus bleiben über die gemeinsamen Modal-Klassen geregelt. Browservergleich und 47 Frontendtests erfolgreich; noch nicht veröffentlicht.

- **Heldenvorstellung vor Auswahl (lokal, 31.10.2026, noch nicht veröffentlicht):** In Konto und Registrierung öffnet die Heldenkarte zuerst einen kompakten Dialog mit Bild, Name und Fähigkeiten. Fähigkeiten stehen als kompakte Bild-/Namensleiste mit anklickbarer gemeinsamer Erklärung bereit. Keine Statuszusätze an Helden oder Fähigkeiten; Auswahl bleibt farblich und zugänglich markiert. Dialog in Hero-Lila. Erst „Helden auswählen“ speichert im Konto beziehungsweise merkt die Auswahl für die Registrierung vor. Abbrechen ändert nichts. Neue lesende Vorschau-Endpunkte, keine Migration; 47 Frontendtests und 254 isolierte Integrationstests erfolgreich.

- **Dokumentation gebündelt (lokal, 31.10.2026):** Feature-Übersicht, Souvenir- und Heldenfähigkeitenkonzept sowie persönliche Hinweise liegen unter `docs/`. [Dokumentationsübersicht](README.md) als Einstieg; interne Verweise und Projektanweisungen angepasst. Keine Anwendungs- oder Datenbankänderung.

### Quizwelten – erste Version auf Production (23.10.2026)

- Nachbesserung auf Production (23.10.2026): Geerbte Quizwelten sind in bestehenden und neuen Fragen angekreuzt und gesperrt. Zusätzliche Welten bleiben wählbar; ein Kategorienwechsel berechnet die Vererbung neu, ohne geerbte Werte als direkte Zuordnung zu speichern.

- Bestätigung vor dem Entfernen von Kategorie-Quizwelten: zeigt betroffene und danach unzugeordnete Fragen unter Berücksichtigung direkter Ergänzungen. Abbrechen erhält die Eingaben.

- Neue Ebene über Kategorien und Tags: eine Frage kann mehreren Quizwelten wie Italien und Kunst zugeordnet werden, ohne kopiert zu werden.
- Admin-Reiter für Weltpflege und Aktivierung; Mehrfachauswahl im Fragenformular, Filter nach Welt oder fehlender Zuordnung, Import mit `worldIds`.
- Quizwelten an Kategorien werden automatisch an bestehende und neue Fragen vererbt. Direkte Ergänzungen bleiben erhalten; Fragenliste und Formular unterscheiden „über Kategorie …“ und „direkt“. Migration 021 lokal und auf Production angewendet, bekannte italienische Stadtkategorien zu Italien verknüpft und redundante Einzelzuordnungen bereinigt.
- Die Startseite zeigt weiterhin alle verfügbaren Kategorien und Tag-Runden ohne Quizweltfilter. Eine gestaltete öffentliche Weltwahl folgt später. Serverseitige Weltprüfung und Weltkontext in Einladungen sind für später vorbereitet.
- Bekannte italienische Stadtkategorien lokal und auf Production zu Italien migriert. Bestehende Fragen-IDs, Fortschritte und Souvenirs bleiben erhalten; keine separate Weltstatistik in dieser Version.
- Migrationen 020 und 021 lokal und auf Production angewendet; Details zu Schema, Altimporten, Grenzen und Erweiterungen: [Quizwelten](QUIZWELTEN.md).

### Heldenfähigkeiten – Version 1 lokal (23.10.2026, noch nicht veröffentlicht)

- Heldenblick, Schutzschild und Neues Abenteuer; maximal drei Fähigkeiten je Held, jede freigeschaltete automatisch einmal pro Runde ab fünf Fragen nutzbar.
- Erwerb standardmäßig nach drei gespeicherten Runden mit mindestens fünf beantworteten Fragen mit dem jeweiligen Helden. Globale Definitionen technisch vorbereitet; neue Fähigkeiten werden in der Entwicklung ergänzt. Keine rückwirkende Zuordnung alter Runden.
- Der Fähigkeitenbereich im Profil ist vorerst entfernt und wird später neu gestaltet; Ergebnis meldet weiterhin neue Freischaltungen. Admin zum Bearbeiten vorhandener Fähigkeiten mit Namen, Texten, Rundenanzahl und Zuordnung je Held über Bildkarten und Bearbeitungsdialog; keine Anlagefunktion. Die Abstände im Fähigkeitenformular sind vereinheitlicht.
- Drei eigene Low-Poly-Motive; neue Fähigkeiten erscheinen im Ergebnis einzeln mit Bild und Beschreibung vor „Freunde herausfordern“. Admin mit Motivvorschau, Mediatheksauswahl und Drag-and-drop-Upload. Eigener Mediathek-Reiter „Heldenfähigkeiten“.
- Ergebnisdarstellung vereinheitlicht: Fähigkeitsmotive nutzen dieselbe Bildgröße wie Souvenirs, Fähigkeitsnamen die kleine fette Souvenir-Typografie in Hero-Lila. Fähigkeitsflächen verwenden den bestehenden Hero-Surface-Token.
- Im laufenden Quiz ein rahmenloser Einstieg mit kleinem Sepia-Heldenbild und „Hilfe · N Fähigkeiten bereit“; keine farbige Hintergrundfläche, Hover unterstreicht nur den Linktext. Im Dialog steht der Heldenname als Überschrift, darunter die verfügbare Anzahl als „1 Heldenfähigkeit verfügbar“ beziehungsweise „2 Heldenfähigkeiten verfügbar“. Dialog mit Fähigkeitskarten und kurzer Erklärung; erst „Jetzt einsetzen“ verbraucht die Fähigkeit und schließt nach Erfolg. Nicht erfüllte Voraussetzungen blenden die Karte aus. Verbrauchte Fähigkeiten bleiben im Dialog ausgegraut. Der Hilfe-Einstieg wird nur angezeigt, solange eine Fähigkeit einsetzbar ist; keine Leeranzeige, auch wenn alle Einsätze verbraucht sind. Unklare Netzwerkanfragen bleiben mit derselben Aktionskennung erneut prüfbar; Antworten bleiben bis zur Klärung gesperrt. Ersetzt die vorherigen einzelnen Icons/Popover. 48 Frontendtests und mobile Browserprüfungen erfolgreich; nur lokal.
- Migrationen 022–024 lokal angewendet. Keine Grundfähigkeit-Unterscheidung. Wissensfunke bewusst vertagt. Regeln, Testbelegung und Betrieb: [Heldenfähigkeit.md](Heldenfähigkeit.md).

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
- **Profilbildauswahl im Konto:** Aufklappbarer Bereich unter dem Benutzernamen mit benannten Heldenkarten und Auswahlmarkierung. Lokal seit 31.10.2026 öffnet der Kartenklick erst den Vorstellungsdialog mit Fähigkeiten; Speicherung nach „Helden auswählen“. Belohnungslinks öffnen den Bereich direkt.
- **Helden auswählen:** Das Konto-Akkordeon heißt „Helden auswählen“. Der zusätzliche Link „Bild ändern“ am aktuellen Profilbild entfällt; das Bild selbst ist nicht mehr anklickbar.
- **Ausgewählter Held in Hero-Farben:** Lila Rahmen und dezent lila Hintergrund über zentrale Tokens; andere Auswahlkomponenten behalten ihre bisherigen Farben.
- **Heldenkarten bei Registrierung:** Gleiche benannte Karten wie im Konto einschließlich lila Rahmen und dezent lila Hintergrund der Auswahl. Die Wahl wird weiterhin erst mit der Registrierung übermittelt.
- **Heldenprofil-Kopf:** Hero-lila Verlauf mit dezentem Lichtakzent und heller Schrift; aktuelles Profilbild bleibt auf weißer Kreisfläche sichtbar. Darstellung mit langen Namen und E-Mail-Adressen auf schmalen Ansichten abgesichert.
- **Erkennbare Konto-Akkordeons:** Profilbildauswahl und Passwortänderung mit durchgehendem dünnem Rahmen in der bestehenden Eingabefeld-Rahmenfarbe.
- **Profilabschluss ohne doppelten Trenner:** Zusätzliche Linie zwischen Passwort-Akkordeon und Kontoaktionen entfernt; Abstand und Akkordeonrahmen bleiben erhalten.
- **Abstand nach Benachrichtigungen:** Befüllte Konto-/Login-/Reisepass-/Souvenir-Statusmeldungen erhalten einen einheitlichen Abstand zum folgenden Inhalt; gilt für Erfolg, Fehler und Hinweise. Leere Meldungen erhalten keinen zusätzlichen Abstand.
- **Info-Icon im Hintergrundwissen:** Ein dezentes Symbol am Textanfang kennzeichnet die ergänzende Wissenskarte im Quiz.
- **Kompaktere Quizansicht auf Laptops:** Weniger vertikale Abstände und schlankere Antwortbuttons machen „Weiter“ bei typischen Laptop-Höhen ohne Scrollen erreichbar. Sehr lange Inhalte können weiterhin Scrollen benötigen; Schrift und Bildbegrenzung bleiben erhalten.

## Souvenirs und Heldenbelohnungen – veröffentlicht am 22.10.2026

- **Städte-Sammlung:** Reisestempel für den ersten tatsächlichen Kategorienbesuch und Low-Poly-Reisemarke für Rom, Florenz und Amalfi-Küste nach 20, für Neapel nach fünf unterschiedlichen richtig gelösten Fragen; erster oder zweiter Versuch zählt. Serverseitige, einmalige Vergabe.
- **Ergebnishinweise:** Neue Erinnerungsstücke erscheinen einzeln mit Motiv und Namen vor „Freunde herausfordern“; der Ergebnislink führt zur separaten Souvenir-Seite. Keine Souvenir-Sektion im Reisepass. Belegbarer Altfortschritt wird berücksichtigt.
- **Eigene Souvenir-Seite:** `souvenirs.html` für angemeldete Nutzer, erreichbar über das Kontomenü. Erhaltene und begonnene Entdecker-Souvenirs je Kategorie: Stempel links, Marke rechts, mobil untereinander. Fortschritt nur durch richtige Antworten; Sepia-Motiv und dezenter grauer Hintergrund bis zur Vergabe. Ohne Filter oder zusätzlichen Gesamtzähler. Lokal ergänzt (31.10.2026, noch nicht veröffentlicht): reine Übersicht freigeschalteter Belohnungshelden mit Bild, Name und Anzahl, verborgen ohne Freischaltungen; Link „Profilbild auswählen“ öffnet im Konto direkt das Akkordeon „Helden auswählen“.
- **Profilbild als Belohnung:** Neuer Low-Poly-Held Astra nach einer Hero-Frage, die im ersten Versuch richtig gelöst wurde. Vergabe beim bestätigten Rundenabschluss; vor Erhalt verborgen, dauerhafte Berechtigung danach, Ergebnishinweis „Neue Heldenbelohnung“ mit „Neues Profilbild freigeschaltet“. Kein automatischer Profilbildwechsel; lokaler Test-Reset entfernt die Freischaltung.
- **Profilbilder in der Mediathek:** Eigener Tab mit Namen, Suche, Upload und Motivwechsel. Frei oder Belohnung wählen, Bilder aktivieren/deaktivieren und löschen. Aktive freie Bilder stehen automatisch in der Profilbildauswahl; Belohnungen erst nach Erhalt. Betroffene Accounts fallen beim Deaktivieren/Löschen auf den geschützten Standardhelden zurück. Details: [Mediathek](MEDIA.md).
- **Einheitliche Medienkacheln:** Profilbilder verwenden dieselben Bildflächen, Abstände, Rahmen und linksbündigen Beschriftungen wie Fragebilder. Heldenmotive bleiben vollständig sichtbar.
- **Souvenir-Bilder in der Mediathek:** Eigener Reiter für bestehende Motive und neue Uploads; diese erscheinen nicht mehr unter Bilder. Verwendete Motive werden über die versionierte Souvenir-Verwaltung bearbeitet. Details: [Mediathek](MEDIA.md).
- **Adminpflege:** Feste Regeln, Zielwerte, Motive aus Mediathek/Upload, Entwurf/Aktiv/Archiviert und versionierte Änderungen. Lokaler Test-Reset für `@example.test`-Accounts; in Production gesperrt.
- **Souvenir-Bestand im Admin:** Motivübersicht mit Name, Kategorie, Regel/Zielwert und Status, Suche und Filtern. Klick auf eine Kachel öffnet die Bearbeitung darunter; neue Souvenirs werden über „Neu anlegen“ erstellt. Schutz ungespeicherter Änderungen bleibt erhalten.
- **Reisemarken und Adresse:** Auch erhaltene Reisemarken zeigen ihren erreichten Fortschritt als „20 von 20 Fragen richtig gelöst“ mit gefülltem Balken; Reisestempel bleiben ohne Balken. Reisepass unter `reisepass.html`, alte Adresse mit dauerhafter Weiterleitung.
- **Einheitlicher Admin-Ladehinweis:** Gemeinsamer Spinner unten links für Fragen/Kategorien, Spieler, Feedback, Souvenirs, Mediathek und sichtbare/nahe Bilder. Parallele Anfragen teilen sich eine Anzeige; Abschluss und Fehler beenden den jeweiligen Ladezustand. Details: [Mediathek und Ladeanzeige](MEDIA.md).
- **Datenbank:** Migrationen 014 bis 019 lokal und auf Production angewendet. Migration 019 ergänzt die Amalfi-Definitionen ohne Schemaänderung. Details, Tests und weitere Ideen: [Souvenir.md](Souvenir.md).

## Release vom 22.10.2026 – Quizdarstellung und CSS-Pflege

Auf Production veröffentlicht als `cb23f51a0cc4-20261022131903`. Aktiven Stand und Rolloutprotokoll siehe [Production](HOSTINGER-PRODUCTION.md).

### Schwierigkeit und Punkte im Quiz

Antwortbuttons erhalten beim Hover eine dezente Fläche und einen Rahmen passend zur Schwierigkeit: dunkles Blau für einfache, Petrol für schwere, vorhandenes helles Hero-Lila für Hero-Fragen. Gesperrte und bereits bewertete Antworten behalten ihre Ergebnisdarstellung; andere Komponenten sind nicht betroffen.

Links neben dem Hinweis steht ein kleines Schwierigkeitstag: „Einfache Frage“ in dunklem Blau, „Schwere Frage“ in Petrol, „Hero-Frage“ im bestehenden Lila, jeweils mit weißer Schrift. Zentrale semantische Farbrollen halten die Zuordnung fest. Das Tag bleibt beim Hinweis auf die zweite Chance sichtbar; bei aufgelöster Frage verschwindet die Hinweiszeile wie bisher. Der Header zeigt nur den Fragenzähler „1 von 25“, keine zusätzliche Schwierigkeitsbezeichnung.

Zu Beginn jeder Frage steht direkt vor den Antwortmöglichkeiten und unter einem eventuell vorhandenen Bild die mögliche Punktzahl im ersten Versuch: normale Fragen 2, schwere Fragen 3, Hero-Fragen 5 Punkte. Die dezente Textzeile verwendet dieselbe Wertungsfunktion wie die Punktevergabe. Nach der ersten falschen Antwort ersetzt der Hinweis auf die zweite Chance die Punktanzeige an derselben Stelle; im Header steht keine zusätzliche Punktanzeige.

Nach der ersten falschen Quizantwort erscheint an derselben Stelle über den Antwortmöglichkeiten „Noch eine Chance – jetzt für 1 Punkt.“ Die Punktzahl stammt aus der bestehenden Wertungsregel. Kleine Schrift ohne zusätzliche Kachel; bei Auflösung verschwindet der Hinweis, die nächste Frage beginnt wieder mit ihrer Punktzahl. Für Screenreader als Statusmeldung ausgezeichnet. Wertung und Anzahl der Versuche bleiben unverändert.

### CSS-Strukturpflege

Die Farbpalette liegt ausschließlich in `styles/themes/app-tokens.css`; gemeinsame Skalen, Typografie und Bewegung in `styles/abstracts/tokens.css`. Doppelte zentrale Token-Definitionen wurden bei unveränderten wirksamen Werten entfernt.

Die zentrale Theme-/Responsive-Überschreibung ist in die zuständigen Layout-, Komponenten- und Featuredateien aufgeteilt. Kartenstyling zusammengeführt, doppelte Deklarationen bereinigt und Theme-Dateien automatisch auf reine Token-Definitionen begrenzt. Bestehende Darstellung als Browser-Vergleichsbasis erhalten; keine neue Funktion und keine Datenbankänderung. Details: [CSS-Modularisierung](CSS-MODULARISIERUNG-2026-10-22.md).

## Mögliche nächste Features

### Bereits gemeinsam vertieft / vorgemerkt


Siena ist als weitere Kategorie vorgesehen. Ein zusätzliches Kategorienmotiv im bestehenden Low-Poly-Stil ist als Asset vorbereitet; Kategorie und Fragen sind noch nicht angelegt. [Bild und Generierungsauftrag](SIENA-KATEGORIENBILD.md).

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
