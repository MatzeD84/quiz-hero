# Quiz-Reisepass

Lokaler Stand vom 22.10.2026: Die Souvenir-Sammlung liegt ausschliesslich auf ihrer separaten Seite; im Reisepass gibt es keine Souvenir-Sektion mehr. Seit dem 22.10.2026 auf Production. Regeln, Verwaltung, Datenhaltung und Tests stehen zentral in [Souvenir.md](../Souvenir.md). Der Login führt inzwischen zur Startseite.

Der private Quiz-Reisepass liegt lokal unter `reisepass.html`; die bisherige Adresse `passport.html` leitet dauerhaft dorthin weiter. Nach dem Login landest du auf der Startseite. Das Kontomenue bietet Mein Konto (`account.html`), Reisepass (`reisepass.html`) und die separate Sammlung (`souvenirs.html`). Erhaltene und begonnene Souvenirs stehen ausschliesslich auf der Souvenir-Seite ohne Kategorie- oder Artfilter. Die Adressumstellung ist seit dem 22.10.2026 auf Production veroeffentlicht. Interne Modul- und CSS-Namen bleiben unveraendert.

Die alte Adresse `passport.html` wird dauerhaft auf `reisepass.html` weitergeleitet; Queryparameter bleiben erhalten. Der Build nimmt `reisepass.html` und `souvenirs.html` auf. Aktuelle Abschlussprüfung und Freischaltregeln stehen in [Souvenir.md](../Souvenir.md).


## Erste Version

- Begruessung und echte Gesamtzahlen fuer abgeschlossene Runden, besuchte Kategorien und gespielte Themen.
- Naechste Runde in der zuletzt besuchten, noch spielbaren Auswahl; alternativ ein neues Kategorieziel.
- Spielbare Kategorie-Karten und bereits gespielte, spielbare Themen mit Rundenzahl und letztem Besuch. Archivierte/nicht spielbare Ziele werden nicht als Karten angezeigt; historische Gesamtzaehler bleiben erhalten.
- Karten nach beendeten Runden absteigend sortiert, bei Gleichstand alphabetisch nach deutschem Titel. Die Empfehlung bleibt davon unabhaengig die zuletzt gespielte, verfuegbare Auswahl; ein kurzer Hinweis erklaert dies.
- Bewusst kompakte Karten ohne Erfolgsdiagramm oder Prozentanzeige. Der Einleitungstext lautet „Bekannte Orte, neue Abenteuer. Wohin zieht es dich?“. Die Gesamtzaehler heissen „Runden beendet“, „Kategorien entdeckt“ und „Themen entdeckt“. Die im Backend vorbereiteten Summen und die dauerhaften Frageergebnisse bleiben fuer eine spaetere Auswertung erhalten.
- Die Einzelrundenliste wird nicht mehr angezeigt und nicht mehr im privaten Reisepass-Endpunkt uebertragen. Die Historie bleibt in der Datenbank erhalten.
- Unter dem naechsten Abenteuer stehen drei schmale Karten fuer die Erfolgsquote: Normal (easy) neutral, Schwer (medium) in der bestehenden Akzentfarbe, Hero in der bestehenden Hero-Farbe. Jede Karte zeigt den Prozentwert und die Anzahl ausgewerteter Fragen. Pro Stufe gilt: richtig im ersten oder zweiten Versuch / alle gespeicherten Frageergebnisse dieser Stufe. Wiederholungen zaehlen mit, falsche/uebersprungene Fragen bleiben im Nenner. Ohne Daten erscheinen ein Gedankenstrich und 0 Fragen. Die drei Karten bleiben auch mobil nebeneinander. Die Gesamtzaehler darueber verwenden einheitliche Zeilen fuer Zahlen und Beschriftungen.
- Ein leerer Reisepass motiviert zur ersten Runde. Fehler beim Laden bieten einen Wiederholungsversuch.

Die Links oeffnen die vorhandene Quiz-Auswahl. Jede gestartete Runde wird weiterhin zufaellig gemischt; es wird keine alte Fragenfolge wiederaufgenommen.

## Fehlerwiederholung

Der kompakte Bereich „Diese Fragen uebe ich noch“ liegt ganz unten nach den Quiz-Reisen. Er bietet kompakte Kategorie-Zeilen mit Bild, Fragenanzahl und Ueben-Link fuer persoenlich noch offene Fragen. Ohne passende Daten erscheint ein ruhiger Leerzustand.

`practice` im privaten Journey-Endpunkt enthaelt nur Kategorie-ID, Titel und Anzahl offener Fragen fuer die angemeldete Sitzung, keine vollstaendige Fragen-ID-Liste. Massgeblich ist pro Frage die letzte tatsaechliche Antwort, nach Speicherzeit und Resultat-ID geordnet: Nur `incorrect` bleibt offen; `first_try` und `second_try` loesen die Frage. `skipped` erzeugt keinen Fehler und setzt bestehende Fehler nicht zurueck. Wiederholungen einer Frage werden dedupliziert. Der aktuelle Fragen-Fingerabdruck muss zum gespeicherten Fehler passen; veraenderte, geloeschte, inaktive Fragen und archivierte Kategorien werden nicht angeboten. Themenfehler werden der aktuellen Kategorie ihrer Frage zugeordnet. Alte Runden ohne Antwortdetails werden nicht erraten.

Der Link `index.html?category=…&practice=1` enthaelt keine persoenlichen IDs oder Antworten. Er laedt nach Sitzungspruefung die Anzahl offener Fragen und bietet einen ausdruecklichen Startbutton. `start-round` mit `practice:true` waehlt zum Startzeitpunkt serverseitig bis zu zehn unterschiedliche offene Fragen der Kategorie zufaellig aus. Vom Browser gelieferte Fragen-IDs oder Nutzer-IDs bestimmen diese Auswahl nicht. Ohne offene Fragen gibt es HTTP 409 statt einer normalen Ersatzrunde. Normale Kategorie- und Einladungsrunden bleiben unveraendert.

Migration `013_practice_round_mode.sql` ergaenzt `is_practice` in gestarteten Runden und Ergebnissen. Alte Runden bleiben als normal klassifiziert; ihr Modus wird nicht nachtraeglich geraten. Die Kennzeichnung erscheint waehrend des Quizzes und als „Uebungsrunde beendet“ im Ergebnis. Der Modus beim Speichern kommt aus der serverseitigen Runde. Die Runde verwendet weiterhin zwei Versuche und zaehlt in Gesamtzahlen und Erfolgsquoten mit. Spaeteres Falschbeantworten kann eine bereits geloeste Frage erneut aufnehmen.

Der Ergebnis-Button „Zurueck zum Reisepass“ wartet bei einer Uebungsrunde auf die Speicherantwort. Bei einem Fehler bleibt eine Rueckmeldung mit Wiederholen-Button sichtbar. Die Wiederholung sendet denselben eingefrorenen Rundenabschluss, wodurch die vorhandene Idempotenz doppelte Ergebnisse verhindert. Erfolg wird erst nach bestaetigtem Speichern angezeigt; der Reisepass fragt beim Oeffnen den aktuellen Stand erneut ab. Ein Simulationscheck im Browser prueft verzoegertes Speichern, Fehler und erfolgreichen Wiederholungsversuch ohne Testdaten im normalen Benutzerkonto zu speichern.

## Daten und Schutz

`POST api/index.php?action=account-journey` nutzt die vorhandene HttpOnly-Sitzung und CSRF-Pruefung. Alle Ergebnisabfragen sind per vorbereitetem Statement an die Benutzer-ID der Sitzung gebunden. Eine Benutzer-ID im Request wird nicht verwendet. Der Endpunkt schreibt keine Rundendaten und liefert keine Antworten, Zugangsdaten oder fremden Ergebnisse.

Der Handler orchestriert getrennte Funktionen fuer Schwierigkeitsquoten (`journey_difficulty_stats`), verfuegbare Katalogziele (`journey_catalog_selections`) und aggregierte Rundenzahlen (`journey_result_summary`). Die Fehlerwiederholung liegt separat in `accounts/practice.php`. Es werden keine ungenutzten Einzelrunden mehr abgefragt. Die Tests decken auch Konten ohne Runden und Konten ausschliesslich mit alten Rundensummen ab.

Der angezeigte Rundenverlauf basiert auf `quiz_results`. Der aktuelle Katalog dient nur fuer Namen, Bilder und Spielbarkeit. Deaktivierte oder entfernte Kategorien behalten ihre Historie, erhalten aber keinen Startlink. Alte Ergebnisse ohne Auswahl erscheinen als Archiv und erhoehen keine erfundene Kategorien-/Themenzahl.

## Dauerhafte Frageergebnisse

Migration `011_question_result_difficulty.sql` ergaenzt eine nullable Schwierigkeit. Neue Ergebnisse speichern sie aus dem eingefrorenen Rundenstand, unabhaengig vom aktuellen Fragenkatalog. Alte Datensaetze bleiben NULL und werden nicht nachtraeglich erraten. Die persoenliche Aggregation `difficultyStats` im geschuetzten account-journey-Endpunkt beruecksichtigt nur Datensaetze mit bekannter Schwierigkeit und der Nutzer-ID aus der Sitzung. Beim Deployment beide neuen Migrationen vor Aktivierung des Codes ausfuehren; lokal sind sie bereits angewendet.

Migration `010_question_results.sql` ergaenzt `quiz_question_results`. Vor einem Deployment Datenbank sichern und `php database/migrate.php` explizit auf dem Zielsystem ausfuehren. Die Migration ist additiv; alte Rundenergebnisse bleiben unveraendert und werden nicht mit erfundenen Einzelantworten aufgefuellt.

Ab Migration speichert `save-result` fuer angemeldete Nutzer jede Frage einer vollstaendig eingereichten Runde: Rundenresultat, Nutzer, Fragen-ID, Position, gewaehlte Antwortindizes (maximal zwei), Ergebnis `first_try`/`second_try`/`incorrect`/`skipped`, erreichte und maximale Punkte sowie Speicherzeitpunkt. Ein SHA-256-Fingerabdruck aus Fragetext, Antwortreihenfolge, richtiger Antwort und Schwierigkeit dient weiterhin der Fehlerwiederholung. Zeitpunkt ist Rundenabschluss, keine Messung der Antwortdauer. Abgebrochene Runden und Gastspiele erhalten keinen dauerhaften Frageverlauf.

### Historische Inhalte und Namen (Migration 012)

`012_history_snapshots.sql` fuehrt `quiz_question_versions` ein. Die unveraenderliche JSON-Momentaufnahme umfasst Fragetext, Antwortreihenfolge, richtigen Antwortindex, Schwierigkeit, Fragentyp, Bild-URL, Bildbeschreibung und Hintergrundwissen. Der eindeutige Schluessel `(question_id, version_hash)` teilt identische Staende zwischen Ergebnissen; nur eine inhaltliche Aenderung erzeugt einen weiteren Stand. `quiz_question_results.version_id` verweist per Fremdschluessel darauf. Die Version entsteht bei erfolgreichem Rundenabschluss aus dem beim Start eingefrorenen Serverstand, in derselben Transaktion wie das Ergebnis. Wiederholte Uebermittlungen erzeugen keine weiteren Versionen. Der aktuelle Katalog wird dabei nicht erneut als historische Quelle gelesen.

Die Versionen haben keinen Fremdschluessel zum loeschbaren Fragenkatalog und bleiben nach Katalogloeschung oder temporaerer Rundenbereinigung erhalten. Referenzierte Versionen koennen nicht geloescht werden. Sie enthalten keine Nutzerzuordnung und bleiben als gemeinsame Inhaltsdaten nach einer Kontoloeschung bestehen; persoenliche Antwortdetails werden weiterhin entfernt. Es gibt keinen neuen oeffentlichen Versions-Endpunkt.

Bilddateien werden NICHT kopiert oder archiviert: Gespeichert ist der damalige Pfad. Wird eine Datei ersetzt oder geloescht, ist das damalige Bild damit nicht gesichert. Fuer eine spaetere wort- und bildgetreue Historienansicht braucht es zusaetzlich unveraenderliche Mediendateien und passende Aufbewahrung; das ist hier nicht eingefuehrt.

`quiz_rounds` und `quiz_results` erhalten `category_title` und `tag_title`. Die Auswahlbezeichnung wird serverseitig beim Start eingefroren und bei Abschluss uebernommen. Einzelne historische Ergebnisse behalten diesen Namen in der Datenbank; aktuelle Stationskarten verwenden weiterhin aktuelle Katalognamen. Bei einer geloeschten Auswahl dient der gespeicherte Name als Archivbezeichnung, ohne sie wieder spielbar zu machen. Unterschiedliche Namen derselben Kategorie werden weiterhin zu einer Station aggregiert.

Migration und Schema-Snapshot sind additiv und wiederholbar. Vorhandene Antwortdetails behalten `version_id=NULL`; alte Runden und Ergebnisse behalten unbekannte Namen als NULL. Keine Rueckfuellung aus heutigen Katalogdaten. Vor Deployment sichern und Migration explizit anwenden. Die lokale Datenbank ist auf Migration 013 aktualisiert.

Rundensummen und Einzelresultate werden in derselben Transaktion serverseitig aus dem eingefrorenen Fragenstand berechnet. Rundensperre, Submission-Hash und zusammengesetzter Primaerschluessel verhindern Duplikate. Der Index `(user_id, question_id, created_at)` bereitet persoenliche Fortschrittsabfragen vor. Kategorie und Thema sind ueber `quiz_results` zugeordnet. Eine spaetere Auswertung muss `skipped` gesondert behandeln und verschiedene Fragenversionen beruecksichtigen.

Die temporaere `quiz_rounds`-Bereinigung nach 90 Tagen entfernt keine dauerhaften Frageergebnisse. Auch das Loeschen einer Katalogfrage entfernt sie nicht; die urspruengliche Fragen-ID bleibt als historische Referenz bestehen. Loeschen eines Rundenergebnisses entfernt dessen Details per Fremdschluessel. Kontoloeschung entfernt sowohl alle persoenlichen Frageergebnisse als auch temporaere Rundensnapshots, bevor bestehende Summenergebnisse anonymisiert werden. Physisches Loeschen eines Nutzers entfernt die Details ebenfalls per Fremdschluessel.

Die Datenbasis traegt die persoenlichen Schwierigkeitsquoten und Fehlerwiederholung. Eine historische Einzelantwortansicht und Admin-Auswertungen sind noch nicht eingefuehrt; es gibt keinen neuen oeffentlichen Zugriff auf Antwortdetails.

Rundensummen belegen keine unterschiedlichen gelösten Fragen. Das lokale Souvenirfeature wertet deshalb nur nachweisbare Einzelantworten aus. Aktuelle Regeln, Schemaergänzungen 014–019 und die separate Sammlung stehen zentral in [Souvenir.md](../Souvenir.md).

## Pruefung

- `node --test tests/contracts.test.mjs`
- `node scripts/build-css.js` und `node scripts/check-bem.js`
- `tests/integration.php` ausschliesslich mit einer leeren, wegwerfbaren `quiz_hero_audit_*`-Datenbank ausfuehren. Die Suite prueft unter anderem Anmeldung, CSRF, Nutzertrennung, Archivfaelle und die begrenzte Historie.
- Desktop/Mobile, leerer Verlauf, Ladefehler, Profil-Einstellungen und Quiz-Links im lokalen Browser pruefen.
