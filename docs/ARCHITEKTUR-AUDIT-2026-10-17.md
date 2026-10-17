# Quiz-Hero: Architektur-, Qualitäts- und Refactoring-Audit

Stand: 17.10.2026. Gegenstand: aktuelle lokale Hostinger-Projektkopie. Ergebnis ist eine Analyse und ein Umsetzungsplan; Anwendungscode, Produktionsdaten und Deployment wurden während dieses Audits nicht geändert. Dieser Bericht wurde nicht gepusht.

## Gesamturteil

Die Anwendung hat eine brauchbare technische Grundlage und mehrere gut umgesetzte Schutzmaßnahmen. Sie ist aber noch keine durchgehend sauber geschichtete Anwendung. Besonders Backend und Adminoberfläche bündeln zu viele Verantwortlichkeiten. Ein schrittweises Refactoring ist sinnvoll; ein kompletter Neubau oder ein Frameworkwechsel ist durch die Befunde nicht begründet.

Der Frontendkern mit `QuizState`, `QuizController`, `QuizView` und Datenservice ist bereits verständlich gegliedert. Die CSS-Struktur nach Grundlagen, Komponenten, Layout und Features ist grundsätzlich sinnvoll. Das gilt es zu erhalten. Die größten Probleme sind die vermischte Backendstruktur, verteilte Datenverträge, unvollständige Zustandsregeln und die Kopplung redaktioneller Veröffentlichungen an Code-Deployments.

## Prüfgrundlage und Grenzen

- Verzeichnis-, Quellcode-, Schema-, Test- und Deploymentprüfung.
- Lokale Browserprüfung von Startseite, Auswahl, Quiz und falscher Antwort, einschließlich einer Ansicht mit 390 Pixeln Breite.
- Lokale HTTP-Prüfung ausgewählter öffentlicher und nichtöffentlicher Dateipfade, ohne Inhalte von Zugangsdaten auszugeben.
- 12 bestehende JavaScript-Vertragstests bestanden; BEM-Prüfung bestanden.
- 42 bestehende Integrationsprüfungen bestanden: Migrationen, Accounts, Sitzungen, CSRF, Adminzugriff, Importvalidierung, URL-Validierung und lokale SMTP-Abläufe.
- Die Integrationstests liefen auf einer eigens gestarteten temporären MySQL-Datenbank. Diese wurde anschließend wieder entfernt. Die normale Entwicklungsdatenbank wurde nicht für die destruktiven Tests verwendet.
- Lighthouse-Snapshots der lokalen Start-/Quizansichten: jeweils 100 für Accessibility, Best Practices und SEO; keine gemeldeten Fehler in diesen Snapshots. Das ist kein vollständiger WCAG-Nachweis und keine Performancebewertung. Tastatur- und Zustandsprobleme wurden trotzdem gefunden.
- Kein neuer Produktions-Penetrationstest, kein Lasttest, kein vollständiger Screenreader-Test, kein aktueller Restore-Test eines Datenbankbackups. Die aktuelle Produktionsdatenbank wurde nicht fachlich geprüft.

## Was bereits gut ist

- PDO-Prepared-Statements, zentrale Methodenkontrolle und generische Fehlerantworten.
- Spieler-Sitzung nur als zufälliges HttpOnly-Cookie; in MySQL werden Token-Hashes gespeichert. Absolute und inaktive Ablaufzeiten sind vorhanden. Logout, Passwortwechsel und Passwortreset widerrufen Sitzungen.
- CSRF-Kontrolle bei geschützten Änderungen, Origin-Prüfungen, Admin-Session-ID-Wechsel beim Login.
- Größenlimits für JSON und Bilder sowie serverseitige MIME-/Bildprüfung und kontrollierte Uploadnamen.
- Häufige Verwendung von `textContent` statt ungeprüfter HTML-Ausgabe.
- Datenbankbetrieb fällt bei API-Fehlern nicht unbemerkt auf alte lokale JSON-Daten zurück.
- Schutz gegen doppelte Punkte für dieselbe bereits gelöste Frage; Fisher-Yates-Mischung der Fragen.
- Native Dialoge, Statusmeldungen, reduzierte Bewegung und Schutz vor dem Verwerfen von Formulareingaben.
- Hostinger-Releases trennen Code, private Konfiguration und dauerhafte Uploads. Datenbanken werden beim normalen Deployment nicht neu importiert.

## Prioritäten

P1: vor einer öffentlichen Produktionsfreigabe bzw. vor einer darauf aufbauenden Funktion behandeln.
P2: im eigentlichen Refactoring behandeln.
P3: nach Bedarf optimieren oder erweitern. Die Einstufung berücksichtigt die konkrete Nutzung; nicht jeder P1-Befund ist eine aus dem Internet ausnutzbare Lücke.

| ID | Priorität | Befund | Einordnung und konkrete Folge |
| --- | --- | --- | --- |
| A01 | P1 lokal | Docker veröffentlicht den ganzen Projektordner. | Reproduziert: `/.env`, `/.git/config` und `/database/schema.sql` liefern lokal HTTP 200; `.private` liefert 403. Docker bindet nur an localhost. Für Hostinger wird ein getrenntes Paket gebaut, daher ist dies kein Beleg für dieselbe Offenlegung auf Hostinger. Trotzdem ein unnötiger lokaler Vertrauensbruch und eine gefährliche Vorlage für künftige Deployments. |
| A02 | P1 bei verbindlichen Ergebnissen | Ergebnisse werden vom Browser berechnet und als Summen gespeichert. | `api/index.php:1149` prüft plausible Grenzen, aber keine serverseitige Runde, Fragenfolge oder Antworten. Der Browser erhält die richtigen Antwortindizes bereits über `public-data`. Ein angemeldeter Nutzer kann plausible Werte erfinden oder dieselbe Runde mehrfach einreichen. Für ein Lernspiel anders zu bewerten als für Bestenlisten oder Preise. |
| A03 | P1 im redaktionellen Betrieb | Statische Kategorieseiten werden nur beim Codebuild aktualisiert. | Adminänderungen wirken in der Quiz-API, aber nicht automatisch in bereits erzeugten HTML-Seiten. Korrigierte, deaktivierte oder entfernte Fragen können dort bis zum nächsten Deployment stehen bleiben. Das erfüllt den gewünschten ausschließlich redaktionellen Arbeitsablauf noch nicht vollständig. |
| A04 | P1 vor öffentlichem Login | Passwortprüfung berücksichtigt die bcrypt-Bytegrenze nicht. | `require_password_strength()` prüft nur mindestens 10 Zeichen. Lokal bestätigt: zwei unterschiedliche Passwörter mit gleichem 72-Byte-Präfix werden als gleich akzeptiert. PHP 8.3 verwendet hier bcrypt. Bei Unicode sind 72 Bytes nicht 72 Zeichen. |
| A05 | P1 vor Mehrbenutzerredaktion | Kein Schutz vor konkurrierendem Überschreiben im Adminbereich. | `admin_question_save()` aktualisiert per ID ohne Versionsvergleich, obwohl `updated_at` vorhanden ist. Zwei offene Bearbeitungen können Änderungen gegenseitig überschreiben. Für ein Update einer inzwischen entfernten Frage wird außerdem kein expliziter Nichtgefunden-Status anhand des Datensatzes geprüft. |
| A06 | P2 | Backend-Monolith mit 81 globalen Funktionen. | `api/index.php` hat 2.091 Zeilen: Routing, SQL, Validierung, Sitzungen, Mailtransport, umfangreiche Mailvorlagen, Importe, Medien und Redaktion. Die Zeilenzahl allein ist kein Fehler; die Mischung erschwert isolierte Tests und erhöht Änderungsrisiken. |
| A07 | P2 | Admin-Monolith und überladene Quizdarstellung. | `js/admin.js`: 1.530 Zeilen und viele gemeinsam veränderliche Zustände. `js/quiz-view.js`: 733 Zeilen einschließlich Account-/Modalbelangen. Fachliche Änderungen betreffen dadurch zu viele Stellen. |
| A08 | P2 | Login hängt an ungeschütztem `localStorage.setItem()`. | `js/user-service.js:47`: Lesen und Löschen fangen Speicherfehler ab, Schreiben nicht. Zustandslos reproduziert: blockierter Speicher wirft einen Fehler. Nach erfolgreicher Serveranmeldung kann die Oberfläche deshalb einen Fehler melden, obwohl das Cookie bereits gesetzt wurde. |
| A09 | P2 | Lückenhafte Fokusführung. | Im Browser bestätigt: Nach Kategorieauswahl und nach dem Deaktivieren einer falsch gewählten Antwort steht der Fokus auf `BODY`. Der Fragetext bekommt beim Rundenstart dagegen bereits gezielt Fokus. Tastaturnutzer verlieren an den anderen Übergängen ihre Position. |
| A10 | P2 | Quiz-Domainmodell schützt nicht alle Zustandsübergänge. | `applyCountLimit()` akzeptiert `-2` und `5abc`: aus 10 Fragen werden 8 bzw. 5. `nextQuestion()` kennt keine abgeschlossene Frage. Der Controller schützt derzeit wesentliche Fälle; das Modell sollte seine eigenen Invarianten sichern. Das ist keine neue serverseitige Berechtigungslücke, aber ein Refactoringrisiko. |
| A11 | P2 | Inkonsistente Daten- und Fehlerverträge. | Datenbankfelder, JSON-Payloads, Browservalidatoren, Importvalidatoren und Editorialfelder sind mehrfach abgebildet. `UserService`, Admin-API und Datenservice besitzen getrennte Fetch-/Fehlerlogik. Timeouts, Request-Abbruch, 401/403-Behandlung und nicht-JSON-Antworten sind nicht einheitlich. |
| A12 | P2 | Adminsitzungen haben keine eigene explizite Ablaufpolitik. | `loggedInAt` wird gesetzt, `require_admin()` prüft aber nur die Existenz der Session. Die effektive Lebensdauer hängt somit von PHP/Hosting-Garbage-Collection ab. Es fehlen im Anwendungscode eine bewusst festgelegte Inaktivitätsfrist und eine maximale Admin-Sitzungsdauer. |
| A13 | P2 | Rate-Limit- und Sitzungspflege sind unvollständig. | Rate-Limit-Dateien werden fortlaufend angelegt und nicht zentral aufgeräumt; bei Dateisystemproblemen entfällt die Begrenzung still. Für abgelaufene Benutzer-/Reset-/Verifikationseinträge ist keine zentrale Bereinigung erkennbar. Die Client-IP-Ermittlung hinter Hostinger/CDN sollte zusätzlich überprüft werden; eine konkrete Fehlzuordnung wurde hier nicht nachgewiesen. |
| A14 | P2 | Deployment benötigt Betriebspflege. | Snapshots, Releases und Archive werden ohne Aufbewahrungsgrenze angelegt. Bilder machen einzelne Artefakte bereits etwa 116 MB groß. Ein fehlgeschlagener Commit wird absichtlich nicht automatisch erneut gebaut; vorübergehende Ausfälle benötigen deshalb eine sichtbare Meldung und gezielte Wiederholungsmöglichkeit. Code-Rollback ersetzt kein Datenbank-/Uploadbackup. |
| A15 | P2 | Deployment-Helfer liegen veränderlich außerhalb der Releases. | Der Build kopiert Helfer nach `private/`, bevor ein Kandidat vollständig geprüft ist. Ein Dateirücksprung setzt diese Helfer nicht mit zurück. Auch die installierte Workerdatei wird durch einen normalen Code-Push nicht automatisch aktualisiert. Das sollte ein explizit versionierter Bootstrap-/Worker-Vertrag werden. |
| A16 | P2 | Deploymentprüfungen decken nicht alle zentralen Nutzerwege ab. | Aktuell laufen Contract-Tests, Syntax-, Migrationsstand- und HTTP-Grundprüfungen. Die 42 Integrationsprüfungen wurden hier zusätzlich lokal ausgeführt, sind aber nicht Bestandteil jedes Hostinger-Builds. Accountlogin, echte Ergebnisablage, Admin-Upload und komplette Quizrunden werden nicht als Browserablauf vor jeder Veröffentlichung geprüft. |
| A17 | P2/P3 | Content- und Quellenfelder sind technisch vorhanden, historisch aber kaum gefüllt. | Der lokale öffentliche Datenbestand umfasst 236 Fragen in 5 sichtbaren Kategorien; in diesem Export haben keine Fragen `sourceUrl` oder `imageAlt`. Das ist eine Bestandsbeobachtung, kein Urteil über die fachliche Richtigkeit. Sichtbare Bildtexte nutzen daher einen generischen Fallback. |
| A18 | P3 | Wachstum und Medienauslieferung. | Die gesamte aktive Fragenbank inklusive Antworten wird beim Start geladen: lokal etwa 152 KB unkomprimiert, im Browser rund 31 KB übertragen. Für den aktuellen Umfang vertretbar. Einige PNGs im Projekt sind dagegen über 3 MB groß. Responsive WebP/AVIF-Varianten und passende Abmessungen versprechen mehr unmittelbaren Nutzen als eine vorschnelle API-Großoptimierung. |
| A19 | P3 | Alte und erzeugte Dateien sind nicht klar genug getrennt. | Historische JSON-Seeds, SQL-Seeds, Schema-Snapshot, erzeugte Kategorieseiten, generiertes CSS, alte Analysen und Anleitungstexte liegen nebeneinander. `pages/` existiert noch. README verweist auf drei nicht vorhandene `UMSETZUNG-*.md`-Dateien. Das erschwert den Einstieg und suggeriert teilweise veraltete Abläufe. |
| A20 | P3 | Domain-/Umgebungswechsel ist noch nicht ausschließlich zentral. | `deployment/hostinger.json` ist zentral, aber die Homepage enthält feste `quiz-hero.de`-Werte in Canonical/JSON-LD. Der Produktionsmodus ist bewusst separat gesperrt. Domainwechsel muss deshalb als geprüfter Vorgang mit URL-, Mail-, HTTPS-, Indexierungs- und Konfigurationsabgleich erfolgen. |

## Empfohlene technische Maßnahmen

### Öffentlicher Verzeichnisbaum

`public/` sollte in Docker und auf Hostinger die einzige HTTP-Wurzel sein. PHP-Anwendungslogik, Datenbankwerkzeuge, Tests, Seeds und interne Konfiguration gehören außerhalb. Zusätzliche Dotfile-Sperren sind sinnvoll, ersetzen diese Trennung aber nicht. Die Privatkonfiguration und Laufzeitdaten gehören auch weiterhin nicht in Git.

Eine mögliche Zielstruktur, an vorhandenen Verantwortlichkeiten orientiert:

```text
public/                       # HTML-Einstiege, API-Einstieg, fertige Assets
  api/index.php               # dünner HTTP-Einstieg
  assets/
  admin/
src/
  frontend/
    quiz/                     # Modell, Controller, Darstellung
    account/
    admin/                    # Fragen, Kategorien, Medien, Nutzer, Import
    shared/                   # API-Client, Dialoge, Status, Storage
  backend/
    Http/                     # Router, Request/Response, Auth/CSRF
    Quiz/                     # Runden- und Bewertungsregeln
    Content/                  # Fragen, Kategorien, Import, Publikation
    Account/                  # Accounts und Sessions
    Infrastructure/           # PDO, Mail, Dateisystem
  styles/                     # bestehende CSS-Aufteilung beibehalten
templates/                    # wiederverwendbare HTML-/Mailvorlagen
database/
  migrations/
  fixtures/                   # explizite lokale/testweise Startdaten
scripts/
  build/
  deploy/
tests/
  unit/
  integration/
  e2e/
deployment/
docs/
```

Das ist ein Zielbild, keine Aufforderung, alle Dateien gleichzeitig zu verschieben. Zunächst Modulgrenzen schaffen, danach kontrolliert umziehen. Bestehende öffentliche URLs bleiben währenddessen kompatibel. Laufzeit-Uploads bleiben im externen Shared-Verzeichnis.

### Backend und Datenverträge

- HTTP-Dispatcher von Fachlogik und Datenzugriff trennen. Fachfunktionen sollen Werte liefern und gezielte Fehler werfen, statt überall HTTP-Ausgabe und `exit` aufzurufen.
- Fragen/Kategorien, Accounts/Sessions, Medien und Redaktion in getrennte Module aufteilen. SQL hinter wenigen verständlichen Repository-Schnittstellen bündeln; kein generisches Datenbankframework um jeden Preis.
- Mailvorlagen aus der API herauslösen. Zustellung längerfristig über eine kleine Datenbank-Outbox und einen Hostinger-Worker entkoppeln, damit SMTP nicht in einer offenen Registrierungstransaktion liegt.
- Eine verbindliche Beschreibung der Request-/Responsefelder pflegen und mit Vertragsprüfungen absichern. Für das jetzige Projekt genügt eine überschaubare Dokumentation bzw. OpenAPI-Datei; Codegenerierung ist optional.
- Adminänderungen mit einer Datensatzversion oder `updated_at` vergleichen; bei Konflikten HTTP 409 mit brauchbarer UI zum Neuladen/Mergen. Fehlende Datensätze explizit als 404 behandeln.
- Antworten auf falsche Datentypen kontrolliert mit 422 statt zufälligen TypeError-500 beantworten.

### Quizregeln

Zuerst entscheiden, welche Verbindlichkeit gespeicherte Punkte haben sollen. Für ein Lernquiz kann die bestehende lokale Bewertung bewusst bleiben. Vor Bestenlisten, Belohnungen oder Wettbewerben benötigt es serverseitig gestartete Runden, Fragen-IDs, einen eindeutigen Rundenabschluss und eine serverseitige Punkteberechnung. Gegen unmittelbares Nachschlagen schützt dies allein nicht, wenn weiterhin alle Lösungen öffentlich geliefert werden; Lernmodus und Wettbewerbsmodus müssten getrennt werden.

Für beide Varianten: eine klare Zustandsfolge `Auswahl → laufende Frage → Antwort abgeschlossen → nächste Frage → Runde abgeschlossen`; erlaubte Anzahlwerte strikt prüfen; doppelte Ergebnisübermittlung über eine Runden-ID verhindern. Antwortreihenfolgen bei Bedarf samt korrektem Index gemeinsam mischen. Kategorie-/Tag-Auswahl und Metadaten aus derselben Quelle ableiten.

### Sicherheit

- bcrypt-Passwortgrenze ausdrücklich behandeln. Entweder zunächst eine verständliche Bytegrenze prüfen oder nach Verfügbarkeits- und Laufzeitprüfung auf Argon2id umstellen. Bestehende Hashes weiter mit `password_verify()` akzeptieren und nach erfolgreichem Login gezielt über `password_needs_rehash()` migrieren. Keine eigene improvisierte Kryptografie.
- Admin-Inaktivität, absolute Sitzungsdauer und erneute Passwortbestätigung für besonders sensible Aktionen festlegen. Mehrere Admins/Rollen oder MFA erst dann ergänzen, wenn die Nutzung das benötigt.
- Bereinigung und Fehlerüberwachung für Rate-Limits, Tokens und Sitzungen ergänzen. Keine ungeprüften Forwarded-Header als Client-IP übernehmen.
- Lokale und produktive Sicherheitskonfiguration auf dieselben Regeln bringen; die lokale Dev-Anmeldung bleibt ausschließlich lokal.
- Backup- und Wiederherstellungsprozess für Datenbank UND Uploads dokumentieren und einmal praktisch testen. Ein vorhandener Release-Rollback beweist das nicht.

### Bedienbarkeit und Performance

- Nach Ansichtswechseln Fokus auf die neue Überschrift; nach einer falschen Antwort auf eine sinnvolle noch aktive Antwort, nach Abschluss auf „Weiter“ bzw. die Ergebnisüberschrift.
- Blockierter Storage darf Anmeldung und Quiz nicht kaputtmachen. Servercookie als Autorität behandeln; Profilcache optional und fehlertolerant halten.
- Ein gemeinsamer API-Client mit verständlichen Fehlermeldungen, Zeitlimits und Abbruch alter Requests. Wiederholungen nur für sichere oder idempotent geschützte Operationen; POST nicht pauschal automatisch wiederholen.
- Langsame Ergebnisübermittlung soll sichtbar bleiben und erneut versucht werden können, ohne doppelte Datensätze anzulegen.
- Adminlisten bei steigendem Bestand filtern/paginieren und Konflikte sichtbar machen. Die aktuell vollständige Datenabfrage ist beim kleinen Bestand noch kein dringender Performancefehler.
- Bildvarianten und aussagekräftige Bildbeschreibungen priorisieren. Kein pauschales Zerstückeln jedes CSS-Fragments oder Einführen eines großen Frontendframeworks ohne gemessenen Nutzen.

## Sinnvolle Produkterweiterungen nach der Stabilisierung

1. **Persönlicher Lernverlauf:** gespeicherte Runden im Profil anzeigen. Die Daten werden bereits gespeichert, eine eigentliche Ergebnisübersicht für Spieler ist derzeit nicht erkennbar.
2. **Fehler gezielt wiederholen:** falsche Fragen in eine Wiederholungsrunde übernehmen; optional spätere Wiederholung nach festen Lernintervallen. Dafür Antworten/Fragenbezug gezielt modellieren statt nur Summen zu speichern.
3. **Redaktionelle Veröffentlichung:** Entwurf, geprüft, veröffentlicht; sichtbare Quellen und Änderungsverlauf. Veröffentlichung aktualisiert automatisch Quiz und Kategorieseiten.
4. **Ergebnis verständlicher erklären:** Erstversuch, Zweitversuch, gelöst und erreichbare Punkte unterscheiden. Schwierigkeit beeinflusst Punkte; Prozent der gelösten Fragen und Punktequote sind verschiedene Kennzahlen.
5. **Später optional:** Tagesquiz oder Vergleichsfunktionen erst auf Grundlage verbindlicher serverseitiger Runden.

Für diese Erweiterungen ist keine zusätzliche KI-API nötig. Die bestehende Kostenpräferenz bleibt gewahrt.

## Umsetzung in kontrollierten Etappen

| Etappe | Ziel | Abnahme |
| --- | --- | --- |
| 1 | Sicherheits- und Verhaltensbasis: Public-Webroot, Storagefehler, Passwortgrenze, Fokus, strikte Quizanzahl | Private Pfade liefern 403/404; bestehende Login-/Quizabläufe und 12+42 Prüfungen bleiben erfolgreich; Regressionen für die gefundenen Grenzfälle |
| 2 | Backend modularisieren, Mailvorlagen und Transport isolieren | Gleiche API-Verträge, keine Layoutänderung; Integrationstests gegen leere Testdatenbank bestehen |
| 3 | Adminmodule und gemeinsamer API-Client; Versionskonflikte | Gleiches sichtbares Verhalten; zwei konkurrierende Bearbeitungen verlieren keine Änderung unbemerkt |
| 4 | Datenmodell für verbindliche Runden, falls fachlich gewünscht; sonst expliziter Lernmodus | Bewertung nachvollziehbar, Abschluss idempotent, manipulierte Eingaben angemessen abgewiesen |
| 5 | Veröffentlichung aus dem Adminbereich und Betriebsrobustheit | Korrektur/Deaktivierung ohne Git-Push auf API und Kategorieseiten konsistent; Backup/Restore, Aufbewahrung, Wiederholungen und Meldungen geprüft |
| 6 | Lernverlauf und redaktionelle Komfortfunktionen | Neue Funktionen erhalten eigene fachliche Tests und klaren Nutzen |

Eine Etappe nach der anderen abschließen. Besonders die Public-Webroot-Umstellung und Backend-Aufteilung sollten nicht gleichzeitig mit Änderungen an Punkten, Datenmodell und Darstellung vermischt werden. Das aktuelle Frontend kann dabei optisch erhalten bleiben.

## Verwendete externe Referenzen

- [OWASP: Business Logic Security](https://cheatsheetseries.owasp.org/cheatsheets/Business_Logic_Security_Cheat_Sheet.html): wichtige Geschäftsregeln und vertrauenswürdige Werte serverseitig ableiten.
- [OWASP: Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html): Sitzungsablauf und Schutzmaßnahmen bewusst in der Anwendung definieren.
- [PHP: password_hash](https://www.php.net/manual/en/function.password-hash.php): dokumentierte bcrypt-Grenze von 72 Bytes.
- [W3C: Focus Order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html) und [Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html): manuelle Interaktionsprüfung ergänzend zu automatischen Snapshots.
