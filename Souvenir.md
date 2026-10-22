# Souvenirs, Meilensteine und Belohnungen

Stand: **22. Oktober 2026**. Zentrale, fortlaufend gepflegte Übersicht. **Der hier beschriebene Featurestand ist lokal implementiert und noch nicht auf Production veröffentlicht.** Die lokale Datenbank enthält Migrationen 014–019; deren Anwendung auf Production steht aus.

## Aktuelle Bedingungen auf einen Blick

| Auszeichnung | Bedingung für die Vergabe | Sichtbarkeit |
|---|---|---|
| **Reisestempel** | Erste erfolgreich gespeicherte Kategorie- oder kategorienbezogene Übungsrunde mit mindestens einer tatsächlich beantworteten Frage. Die Antwort darf falsch sein. Nur übersprungene Fragen genügen nicht. | Erst nach Vergabe, farbig in der Souvenir-Sammlung. |
| **Entdecker-Souvenir / Reisemarke** | Kategorienbesuch wie beim Reisestempel plus die festgelegte Anzahl **unterschiedlicher richtig beantworteter Fragen**, im ersten oder zweiten Versuch. | Bereits ab einer richtig gelösten Frage mit Fortschritt sichtbar. Vor Vergabe Sepia-Motiv und leicht grauer Kartenhintergrund; nach Vergabe farbig mit vollem Balken. |
| **Profilbild-Belohnung, derzeit Astra** | Mindestens eine Hero-Frage **im ersten Versuch richtig** beantworten und die Runde erfolgreich abschließen und speichern. Kategorie-, Themen- und Übungsrunden zählen. Das Profilbild muss aktiv sein und die Regel `hero_first_try` verwenden. | Vor Freischaltung verborgen, danach im Konto auswählbar. Keine Profilbilder auf der Souvenir-Seite und kein automatischer Wechsel des aktuellen Bildes. |
| **Frei verfügbares Profilbild** | Im Admin als frei und aktiv eingestellt; keine Spielleistung nötig. | In Registrierung und Profilbildauswahl im Konto. Keine verdiente Belohnung. |

Aktuell angelegte Städte:

| Kategorie | Reisestempel | Ziel für die Reisemarke |
|---|---|---|
| Rom | Erster Kategorienbesuch mit tatsächlicher Antwort | 20 unterschiedliche Fragen richtig lösen |
| Neapel | Erster Kategorienbesuch mit tatsächlicher Antwort | 5 unterschiedliche Fragen richtig lösen |
| Florenz | Erster Kategorienbesuch mit tatsächlicher Antwort | 20 unterschiedliche Fragen richtig lösen |
| Amalfi-Küste | Erster Kategorienbesuch mit tatsächlicher Antwort | 20 unterschiedliche Fragen richtig lösen |

Die persönlichen Vergaben gelten für angemeldete Accounts. Neue Souvenirvergaben benötigen eine aktive Definition und aktive Kategorie. Die Fragenanzahl wird nicht automatisch bei Katalogerweiterungen erhöht. Die interne Testkategorie erhält keine Souvenirdefinitionen.

### Entdecker-Regel Version 2

Seit dem 22.10.2026 zählen ausschließlich gespeicherte Ergebnisse `first_try` und `second_try`. Falsche, übersprungene oder lediglich angezeigte Fragen zählen nicht. Eine zunächst falsche Frage kann nach späterer richtiger Lösung einmalig beitragen.

- Gezählt werden unterschiedliche Fragen-IDs je Account und damaliger Kategorie. Wiederholungen und neue Versionen derselben Frage zählen nicht zusätzlich.
- Fortschritt entsteht aus erfolgreich gespeicherten, abgeschlossenen Runden; abgebrochene Runden zählen nicht.
- Themenrunden tragen anhand der beim Start eingefrorenen Fragenkategorie bei, ersetzen aber keinen Kategorienbesuch.
- Offener Fortschritt wird aus bestehenden Einzelantworten nach der aktuellen Regel berechnet und kann durch die Umstellung niedriger ausfallen.
- Bereits vergebene Souvenirs werden nicht entzogen; sie behalten ihre zugeordnete Definition. Die Regelumstellung benötigt keine Migration und löscht keine vorhandenen Daten.
- Die frühere Regel „jede beantwortete Frage zählt“ ist abgelöst. Reisestempel und Astra-Regel wurden dadurch nicht verändert.

## Begriffe

| Begriff | Bedeutung | Beispiel |
|---|---|---|
| **Meilenstein** | Überprüfbare erreichte Bedingung; derzeit kein frei konfigurierbares eigenständiges System | 20 unterschiedliche Rom-Fragen richtig gelöst und Rom besucht |
| **Reisestempel** | Ortsbezogene Auszeichnung für den ersten belegten Besuch | Rom besucht |
| **Souvenir / Reisemarke** | Persönliches Sammelmotiv für ein Entdeckerziel | Römische Reisemarke |
| **Belohnung** | Oberbegriff für Sammelstücke und nutzbare Freischaltungen | Reisemarke oder Profilbild Astra |
| **Freischaltung** | Serverseitig bestätigter Übergang zur dauerhaften Berechtigung | Astra wird im Konto auswählbar |

Ein Meilenstein kann künftig mehrere Belohnungen auslösen. Eine allgemeine Zuordnung dafür ist noch nicht implementiert.

## Aktuelle Darstellung

Profilbildauswahl im Konto (lokale Anpassung vom 22.10.2026): Statt eines Dialogs liegt unter dem Benutzernamen ein aufklappbarer Bereich „Helden auswählen“. Verfügbare freie und freigeschaltete Helden erscheinen als Karten mit Motiv, Namen und Auswahlstatus. Die Wahl wird beim Auswählen automatisch gespeichert; Berechtigungsprüfung und Vergaberegeln bleiben unverändert. Der zusätzliche Link „Bild ändern“ am aktuellen Profilbild entfällt; dieses Bild ist nicht anklickbar. Der Ergebnislink `account.html#avatar` öffnet und scrollt zum Akkordeon. Auf der Souvenir-Seite werden weiterhin keine Profilbilder angezeigt.

### Souvenir-Seite

- Eigene private Seite `souvenirs.html`, über das Kontomenü nur für angemeldete Nutzer erreichbar. Gäste bekommen eine Anmeldung angeboten, keine persönlichen Sammlungsdaten.
- Beginn direkt mit „Deine Souvenirs“ und dem kurzen Untertitel. Kein zusätzlicher Einleitungstext oder Gesamtzähler darüber; keine Kategorie-/Artfilter.
- Je Kategorie stehen Reisestempel links und die zugehörige Reisemarke rechts. Mobil untereinander, Stempel vor Marke. Fehlt ein anzeigbares Gegenstück, wird kein unbegonnenes Ziel eingeblendet.
- Nur erhaltene Stücke und begonnene Entdecker-Souvenirs erscheinen. Keine Sektion „Deine nächsten Ziele“ und keine Vorschau unverdienter Reisestempel.
- Begonnene Marken zeigen die Zahl richtig gelöster Fragen, einen Fortschrittsbalken, einen leicht grauen Kartenhintergrund und exakt den zentralen Filter `--filter-sepia`, wie Kategorie-Bilder und Logo beim Hover. Das ist ein Sepia-Effekt, kein reiner Graustufenfilter.
- Erhaltene Marken zeigen den erreichten Zielwert mit vollem Balken; Stempel haben keinen Balken. Detaildialoge zeigen Motiv, Beschreibung, Bedingung und Vergabedatum. Einmalige Besuchserfolge haben keinen Link „Kategorie spielen“.
- Keine Sektion „Deine Heldenbilder“. Profilbilder bleiben ausschließlich im Konto auswählbar.

### Reisepass und Ergebnis

Im Reisepass gibt es **keine Souvenir-Sektion und keine Drei-Stücke-Vorschau** mehr. Der kleine Hinweis „Reisestempel erhalten“ auf einer Quizreise-Karte bleibt davon unabhängig bestehen.

Nach bestätigtem Speichern zeigt das Ergebnis alle neuen Stücke einzeln mit Motiv, Typ und Namen **vor „Freunde herausfordern“**. „Souvenirs ansehen“ führt zur separaten Sammlung. Neue Profilbild-Belohnungen tragen „Neue Heldenbelohnung“ und „Neues Profilbild freigeschaltet“; „Profilbild auswählen“ führt zu `account.html#avatar`. Ohne Vergabe erscheint kein Hinweis. Speicherfehler dürfen keine erfolgreiche Vergabe vortäuschen.

## Adminpflege – implementiert

### Souvenirs

Eigener Haupttab mit Motivbestand, Suche, Kategorie-/Statusfiltern, Auswahl und Bearbeitung. Diese Adminfilter bleiben bestehen; entfernt wurden nur die Filter der privaten Sammlung.

- Feste Regeltypen `first_visit` und `discover`; Namen, Beschreibung, Motiv, Zielwert und Entwurf/Aktiv/Archiviert pflegen.
- Jede Speicherung erzeugt eine Definitionsrevision. Ein Entwurf verdrängt keine aktive Revision; Aktivierung oder Archivierung beendet die bisher aktive Revision desselben Schlüssels.
- Kategorie und Regeltyp einer bestehenden Belohnung bleiben stabil. Andere Bedeutung benötigt eine neue Belohnung.
- Bereits erhaltene Stücke behalten Titel, Motiv und Definitionsbezug ihrer Vergabe. Archivierung entzieht sie nicht.
- Aktivierung prüft aktive Kategorie, vorhandenes Motiv und erreichbares Ziel anhand aktiver Fragen. Spätere Bestandsänderungen können die Erreichbarkeit beeinflussen; die Verwaltung warnt, ändert Ziele aber nicht automatisch.
- Adminsession, CSRF-/Origin- und optimistische Versionsprüfung schützen Änderungen.

### Mediathek und Profilbilder

Die Mediathek trennt **Bilder**, **Profilbilder** und **Souvenir-Bilder**. Souvenirmotive erscheinen nicht im normalen Bilder-Reiter. Bestehende Definitionen einschließlich älterer Revisionen und die Souvenirordner bestimmen die Zuordnung. Neue Motivuploads liegen unter `images/uploads/souvenirs/`. Verwendete Motive werden über die versionierte Souvenir-Verwaltung gepflegt, nicht still über den allgemeinen Bildaustausch ersetzt.

Profilbilder haben einen eigenen Katalog mit Name, Motiv, frei/Belohnung und Aktivierung. Der Standardheld `hero` bleibt aktiv und frei verfügbar. Die Regel „Später festlegen“ vergibt noch nichts automatisch.

- Deaktivieren: aus der Auswahl entfernen, Berechtigungen erhalten, betroffene aktuelle Auswahl auf `hero` zurücksetzen.
- Reaktivieren: wieder anbieten, frühere Auswahl nicht automatisch wiederherstellen.
- Löschen: aus dem Katalog ausblenden, Berechtigungen entfernen und betroffene Auswahl auf `hero` setzen. Intern verhindert eine Löschmarkierung die Wiederanlage durch alte Seeds; die Bilddatei wird nicht automatisch gelöscht.
- Frei → Belohnung: aktuelle Auswahl ohne passende Berechtigung auf `hero` zurücksetzen.

Vollständige Pflege-, Upload- und Lifecycle-Regeln: [Mediathek](docs/MEDIA.md).

### Lokaler Test-Reset

Unter Spieler kann der Fortschritt zugelassener Testaccounts mit Bestätigung `RESET Benutzername` zurückgesetzt werden. Voraussetzungen: Serverflag `QUIZ_HERO_ENABLE_TEST_RESET=true`, `SITE_URL` mit Host localhost/127.0.0.1 und Zielaccount mit `@example.test`. Production bleibt auch bei versehentlich gesetztem Flag gesperrt.

Entfernt werden persönliche Runden, Einzelantworten, Ergebnisse, Souvenirvergaben und Avatar-Freischaltungen. Sitzungen werden widerrufen; alte Tabs können ihren Fortschritt nicht wiederherstellen. Ein ausgewählter Belohnungsavatar fällt auf den Standardhelden zurück. Zugangsdaten, E-Mail-Bestätigung und freie Profilbildauswahl bleiben erhalten. Globale Fragen, Medien, Definitionen und gemeinsame Fragenversionen werden nicht gelöscht. Der Vorgang wird knapp im Serverlog protokolliert.

## Datenhaltung und Vergabe

| Migration | Tabellen / Felder | Zweck und Auswirkungen |
|---|---|---|
| **014** `014_souvenirs.sql` | `quiz_question_results.category_id_at_play` samt Index; `quiz_souvenir_definitions`; `quiz_user_souvenirs` | Historische Fragenkategorie, versionierte Definitionen und einmalige persönliche Vergaben. Alte Kategoriendetails nur anhand belegbarer Rundenauswahl ergänzen; alte Themenzuordnungen bleiben bei fehlendem Beleg NULL. Zwei Rom-Definitionen als Seed. |
| **015** `015_souvenirs_neapel_florenz.sql` | Weitere Definitionen | Stempel und Reisemarken für Neapel und Florenz; bestehende Rom-Daten erhalten. |
| **016** `016_avatar_rewards.sql` | `quiz_user_avatar_unlocks` | Dauerhafte Berechtigung je Account/Avatar, Regel, Vergabezeit, optionales Quellergebnis und Backfill-Kennzeichnung. |
| **017** `017_avatar_catalog.sql` | `quiz_avatars` | Stabiler Schlüssel, Name, Motiv, Regel, Sortierung und Revision; initial 27 Profile einschließlich Astra. Seeds überschreiben spätere Adminpflege nicht. `data/avatars.json` ist nur historische Ausgangsliste. |
| **018** `018_avatar_lifecycle.sql` | `quiz_avatars.enabled`, `deleted_at` | Aktivierung und logisches Löschen; bestehende Profile bleiben zunächst aktiv. |
| **019** `019_souvenirs_amalfi.sql` | Zwei weitere Zeilen in `quiz_souvenir_definitions` | Aktiver Amalfi-Reisestempel und Entdecker-Reisemarke mit Ziel 20. Stabile Schlüssel `amalfi-first-visit` und `amalfi-discoverer`; idempotente Seeds überschreiben keine Adminänderungen oder vorhandenen Vergaben. Keine Schemaänderung. |

Souvenirvergaben sind je Nutzer und stabilem Souvenir-Schlüssel eindeutig und referenzieren die konkrete Definitionsrevision. Fortschritt wird aus Einzelantworten berechnet; keine zusätzliche Fortschrittstabelle. Motive werden gemeinsam gespeichert, nicht pro Account kopiert. Regeltypen sind Backendcode, keine im Admin ausführbaren Formeln. „Entdecker-Regel Version 2“ bezeichnet die dokumentierte Auswertungsänderung; sie erzeugt keine neue Datenbank-Definitionsrevision.

### Ablauf und Bestandsschutz

1. Session, eingefrorenen Rundenstand und Antworten serverseitig prüfen.
2. Ergebnis und Einzelantworten speichern, Regeln auswerten und Vergaben in derselben Transaktion sichern.
3. Neue Freischaltungen erst mit bestätigter Speicherantwort anzeigen.

Nutzer-/Rundensperren und eindeutige Schlüssel verhindern doppelte Vergaben. Ein identischer Speicherretry liefert die zum Ergebnis gehörenden Auszeichnungen erneut; spätere Runden melden bereits erhaltene Belohnungen nicht nochmals als neu.

`account-souvenir-sync` ist ein geschützter POST für den Abgleich nachweisbaren Altfortschritts. `account-journey` bleibt lesend. Alte Gesamtsummen belegen keine unterschiedlichen gelösten Fragen. Für den Stempel können ältere Ergebnisse mit `solved > 0` einen Besuch belegen; fehlende Details werden nicht erfunden. Backfills verwenden das tatsächliche heutige Vergabedatum und sind als Ergänzung gekennzeichnet.

Ergebnislöschung entzieht erhaltene Souvenirs oder Avatarrechte nicht automatisch; ein Quellbezug darf NULL werden. Reset und Kontolöschung entfernen persönliche Vergaben ausdrücklich. Neue Fragenversionen ändern keine bereits gezählten Fragen-IDs; die damalige Kategorie bleibt eingefroren. Keine Vergabe aus behaupteten Clientpunkten oder manipulierter Avatarwahl.

## Prüfung und Veröffentlichung

### Amalfi-Erweiterung: Betrieb und Motive

Lokal angewendet und geprüft: beide aktiven Regeln mit Ziel 1/20, beide transparenten RGBA-PNGs mit 1254 × 1254 Pixeln per HTTP 200. 179 Integrationstests und 32 Frontendtests erfolgreich, einschließlich Amalfi-Schwelle, einmaliger Vergabe und Seed-Wiederholung ohne Überschreiben einer Adminänderung. Lokaler Deployment-Build enthält beide Motive und Migration 019. Testdatenbank entfernt; keine Vergaben am echten Testaccount erzeugt, kein Production-Deployment.

Migration 019 ergänzt ausschließlich zwei Definitionen, keine Accountdaten oder Tabellenfelder. Vor lokalem Anwenden wurde der Definitions- und Migrationsbestand privat unter `.private/before-souvenirs-amalfi-20261022.sql` gesichert. Anwendung über `php database/migrate.php` nach Bereitstellung beider Bilddateien; `database/schema.sql` enthält dieselben Seeds und den Migrationsmarker. Keine Freischaltung allein durch die Migration: Nachweisbar erfüllte Bedingungen können beim nächsten geschützten Abgleich beziehungsweise Rundenabschluss berücksichtigt werden.

Die beiden neuen Assets liegen unter `public/images/souvenirs/amalfi-stamp-v1.png` und `amalfi-token-v1.png`. Die Mediathek ordnet sie automatisch dem Tab Souvenir-Bilder zu; die bestehenden Sammlungskarten und Vergaberegeln benötigen keinen Sondercode für Amalfi. Generiert mit dem eingebauten Imagegen-Werkzeug, echter Transparenz und ohne separat abgerechnete API. Motivvorgaben:

- **Stempel:** Eigenständiges rundes petrolfarbenes Low-Poly-Siegel mit schmalem Goldrand und vier kleinen Kompassakzenten; gestaffelte bunte Häuser von Positano, Küstenfelsen, kleine Kuppel und türkisfarbenes Meer. Vollständiges Motiv auf transparentem quadratischem Hintergrund, keine Schrift oder Wasserzeichen.
- **Reisemarke:** Wertigeres goldenes Low-Poly-Medaillon mit Petrolakzenten, Küstenhäusern und Meer; zwei Zitronen mit grünen Blättern am unteren Rand. Gleiche Lesbarkeit bei 112 Pixeln, transparentes Umfeld, keine Schrift oder Wasserzeichen.

Vor Production weiterhin vollständige Datenbank-/Uploadsicherung und ausstehende Migrationen anwenden. Ein Rücksprung auf Code vor 019 entfernt die Definitionen nicht automatisch. Bei Problemen neue Amalfi-Vergaben über Archivierung pausieren und vorwärts korrigieren; Definitionen mit persönlichen Vergaben nicht löschen. Keine destruktive Rückmigration. Historische erhaltene Stücke bleiben erhalten.

### Gesamtcheck

**Letzte ausgeführte Prüfung:** 179 isolierte Integrationstests und 32 Frontendtests erfolgreich; PHP-/JS-Syntax geprüft. CSS-Build, Token-/BEM-Prüfung und lokaler Deployment-Build erfolgreich. Umfang, Bereinigung, Browserbefunde und verbleibende Deployment-Schritte: [Abschlussprüfung](docs/SOUVENIRS-ABSCHLUSSPRUEFUNG.md). Keine Production-Veröffentlichung.

Abgedeckt sind unter anderem erste/zweite richtige Antworten, falsche und übersprungene Antworten, spätere Korrektur, Wiederholungen, Schwellen 5/20, Kategorie-/Themenrunden, eingefrorene Zuordnung, Backfill, Retry, Archivierung, Definitionsrevisionen, Adminschutz, Avatarberechtigungen/Lifecycle, Medienzuordnung, Reset und Kontolöschung. Integrationstests verwenden ausschließlich wegwerfbare `quiz_hero_audit_*`-Datenbanken; echte Accounts wurden dafür nicht zurückgesetzt.

Der lokale Browserabschlusscheck bei 390 und 1440 Pixeln prüft leere und begonnene Sammlungen, alle vier Stadtpaare, Filter, Fortschritt und Dialoge anhand temporärer Darstellungsdaten. Gastzugriff bleibt gesperrt, alle acht Bilder laden und kein horizontaler Überlauf tritt auf. Frühere Screenshot-Aufnahmen über das Browserwerkzeug konnten nicht zuverlässig abgeschlossen werden; dies ist eine DOM-/Layoutprüfung.

Vor Production:

1. Lokaler Gesamtcheck erfolgreich; beim Deployment aktuellen Production-Bestand und Migrationsstand erneut abgleichen.
2. Vollständige Datenbank- und Uploadsicherung; Wiederherstellungspfad prüfen.
3. Ausstehende Migrationen 014–019 ausdrücklich vor Aktivierung des neuen Codes anwenden. Ein Push allein führt sie nicht aus.
4. Über den bestehenden dokumentierten Deploymentprozess veröffentlichen und anschließend prüfen.

Ein Code-Rollback ist kein Datenbank-Restore. Code vor 017/018 kennt neue Katalogeinträge beziehungsweise Aktivierung/Löschmarkierungen nicht zuverlässig. Keine destruktive Rückmigration oder isolierte Entfernung von Migrationsmarkierungen. Vorwärts korrigieren oder Code und Daten konsistent aus Sicherung wiederherstellen; dabei möglichen Verlust neuer Fortschritte berücksichtigen. Lokale private Sicherungen sind kein Ersatz für ein frisches Productionbackup.

Technische Ergänzungen und bestehende Prozesse: [Quiz-Reisepass](docs/QUIZ-REISEPASS.md), [Mediathek](docs/MEDIA.md), [Feature-Übersicht](FEATURES.md). Keine Veröffentlichung durch diese Dokumentationsbereinigung.

## Nächste Erweiterungen – noch nicht implementiert

| Idee | Inhalt | Offene Definition |
|---|---|---|
| Weitere Städte | Individuelle Stempel und Reisemarken | Geeignete Kategorien, erreichbare Ziele und Motive |
| Reise durch Italien | Kategorienübergreifendes Sammelmotiv | Zahl und Kombination besuchter Kategorien |
| Drangeblieben | Lernbelohnung für später gelöste Fehlerfragen | Anzahl, Zeitbezug und Versuche |
| Hero-Master / besonderer Hero-Moment | Anspruchsvollere Auszeichnung für mehrere Hero-Fragen | Ziel, Erst-/Zweitversuche und erlaubte Hilfen |
| Fehlerfreie Runde / Zweiter Versuch gerettet | Besondere Leistungs- oder Lernerfolge | Mindestgröße, Fehlerbegriff und Wertung |
| Weitere Profilbilder / Avatar-Rahmen | Kosmetische Belohnungen | Motive und Freischaltbedingungen; Rahmen noch ohne Darstellung |
| Lieblingssouvenir | Erhaltenes Stück als Favorit wählen | Profilplatz und Darstellung |
| Geteiltes Souvenir | Optionales Motiv auf der Teilen-Karte | Gestaltung, ohne automatische Veröffentlichung |
| Neue Fragen entdecken | Gezieltere Runde für fehlenden Fortschritt | Auswahlregeln; normale Zufallsauswahl bislang unverändert |
| Allgemeine Meilensteinverwaltung | Mehrere Belohnungen einem Meilenstein zuordnen | Datenmodell, Adminvorschau und Auswirkungen |

Frühere Motivideen bleiben vorgemerkt: Florenz-Skizzenbuch, Neapel-Postkarte, Amalfiküsten-Keramikkachel und Siena-Erinnerungsstück. Die vorhandenen ersten Stadtmotive sind stattdessen Stempel und Medaillons. Keine tägliche Pflichtserie, Zufallsbelohnungen oder zusätzliche Punktewährung für den Einstieg vorgesehen. Eine kleine Sammlung klarer Ziele bleibt die Leitidee.

### Heldenfähigkeiten / Joker

**Nutzeridee, noch nicht implementiert:** Wenige dauerhaft freigeschaltete Fähigkeiten, freiwillig einsetzbar. Dauerhafte Berechtigung und Nutzungslimit sind getrennte Regeln. Empfehlung, noch nicht beschlossen: höchstens zwei Fähigkeiten zum Einstieg und ein klares Limit pro Runde.

| Arbeitstitel | Wirkung | Vorschlag und offene Punkte |
|---|---|---|
| Heldenblick | Eine garantiert falsche Antwort ausblenden | Einmal pro Runde vor dem ersten Versuch, zunächst Schwer (`medium`); Hero-Zulässigkeit, Freischaltziel, Punkte und Erfolgsregeln klären. |
| Neues Abenteuer | Unbeantwortete Frage gegen eine zufällige Ersatzfrage tauschen | Auswahlart und Größe erhalten, möglichst gleiche Schwierigkeit; Ersatzbestand, Übungsmodus und Statistik klären. |

Vor Umsetzung festlegen:

- Welche Leistung schaltet die Fähigkeit frei? Bleibt sie accountbezogen auch bei Profilbildwechsel erhalten?
- Welche Runden, Schwierigkeitsgrade und Fragezustände erlauben den Einsatz?
- Wie wirken Hilfen auf Punkte, Erfolgsquoten, Astra und andere Leistungsziele? Korrektheit allein darf diese Entscheidung nicht vorwegnehmen.
- Kein automatischer Einsatz. Wirkung, verbleibendes Limit und Verbrauch verständlich anzeigen.
- Keine Ersatzfrage vorhanden: deaktivieren, begründen und keinen Einsatz verbrauchen. Keine in der Runde vorhandene oder bereits herausgetauschte Frage erneut ziehen. Eine unbeantwortet getauschte Frage zählt weder als Lösung noch Fehler.
- Übungsrunden nicht still in normale Runden verwandeln. Gegebenenfalls nur aus passenden offenen Fehlerfragen ersetzen.
- Backend prüft Berechtigung, Eigentümer, Limit und Fragezustand. Transaktionen, Rundensperre und eindeutige Aktionskennung sichern Parallelität, Reload und wiederholte Requests ab.
- Unterstützte Antworten und Einsätze historisch speichern; dauerhafte Freischaltung und Rundenaktionen getrennt modellieren. Lösungen dürfen nicht an den Browser verraten werden.
- Admin darf geprüfte Regel-/Effekttypen mit zulässigen Parametern pflegen; neue Spiellogik braucht Code und Tests. Freie Formeln oder SQL bleiben ausgeschlossen.

Weitere spätere Adminideen: manuelle Einzelvergabe, Vergabevorschau mit betroffenen Accounts und allgemeine Verknüpfung mehrerer Belohnungen. Kein weitergehender Production-Reset ohne neue ausdrückliche Entscheidung. Gäste erhalten bislang keine dauerhaften Belohnungen; eine spätere Übernahme anonymer Leistungen ist nicht zugesagt.

## Entscheidungen und Historie

| Datum | Entscheidung / Umsetzung |
|---|---|
| 20.–21.10.2026 | Lokale erste Version: Rom, danach Neapel und Florenz; versionierte Adminpflege, Medienbestand, Test-Reset und Astra. Erweiterung des Avatar-Katalogs und Lifecycle mit Migrationen 016–018. |
| 22.10.2026 | Sammlung ohne Nutzerfilter oder Profilbildbereich; nur erhaltene und begonnene Stücke, Kategoriepaare, Sepia-Filter und dezenter Fortschrittshintergrund. Souvenir-Sektion aus Reisepass entfernt. |
| 22.10.2026 | Entdecker-Regel Version 2: nur unterschiedliche richtige Antworten in erstem oder zweitem Versuch. Erhaltene Vergaben bleiben bestehen. |
| 22.10.2026 | Dokumentation konsolidiert; bisheriges Arbeitsprotokoll archiviert. |
| 22.10.2026 | Amalfi-Küste mit Reisestempel und 20-Fragen-Reisemarke ergänzt. Lokaler Bestand zur Zielprüfung: 27 aktive Fragen. Zwei neue transparente Low-Poly-Motive, keine Änderung an bestehenden Städten. |

Die vollständige frühere Arbeitsfassung einschließlich aller ursprünglichen Vorschläge, Zwischenprüfungen und Generierungsprompts liegt im [historischen Archiv](docs/archive/SOUVENIRS-ARBEITSSTAND-2026-10-22.md). Sie enthält überholte Angaben und ist **keine aktuelle Spezifikation**. Vorhandene Assets: acht Stadtmotive unter `public/images/souvenirs/` und Astra unter `public/images/website/avatar/astra-v1.png`. Erzeugt mit dem eingebauten Imagegen-Werkzeug; keine separat abgerechnete KI-API und keine Laufzeitgenerierung im Spiel.

## Pflege dieser Datei

Bei jeder Änderung im selben Arbeitsschritt aktualisieren:

1. Bedingungen und Zielwerte ganz oben, einschließlich Sichtbarkeit und Bestandsschutz.
2. Tatsächlich implementierte Nutzer-/Adminabläufe und technische Datenhaltung.
3. Migrationen, Auswirkungen auf bestehende Daten und Wiederherstellungsgrenzen.
4. Relevante Prüfungen sowie lokalen und veröffentlichten Stand getrennt.
5. Offene Ideen als solche kennzeichnen; erledigte Ideen in den aktuellen Stand übernehmen.

Historische Entscheidungen kurz im Protokoll halten, keine widersprüchlichen Nachträge als aktuelle Regeln anhängen. `hinweise.md` bleibt die persönliche Erinnerung des Nutzers und wird nur auf ausdrücklichen Wunsch verändert.
