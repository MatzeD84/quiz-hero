# Quizwelten – erste Version

## Vorschau beim Entfernen von Kategorie-Quizwelten

Vor Upload und Speicherung zeigt eine Bestätigung die entfernten Welten, die Anzahl der Fragen, die mindestens eine Zuordnung verlieren, sowie die danach vollständig unzugeordneten Fragen. Direkte Ergänzungen bleiben erhalten; gleichzeitig neu gewählte Kategorie-Welten zählen mit. Abbrechen erhält die Eingaben. Grundlage ist der zuletzt geladene Adminbestand; die Versionsprüfung beim Speichern bleibt bestehen. Auf Production seit 23.10.2026. Ein Frontend-Vertragstest prüft direkte Ergänzungen, andere Kategorien, vollständige Entfernung und Ersatzwelten.

Stand: 23.10.2026. **Auf Production veröffentlicht; Migrationen 020 und 021 lokal und produktiv angewendet.** Dieses Dokument hält Definition, aktuellen Stand und spätere Ergänzungen fest.

## Modell

Eine Frage gehört weiterhin genau einer Kategorie, besitzt flexible Tags und kann **mehreren Quizwelten** zugeordnet werden. Beispiel: Kategorie Rom, Welten Italien und Kunst, Tag Architektur. Sie bleibt eine einzige Frage mit stabiler ID. „Quizwelten“ bezeichnet den übergeordneten Kontext; die bisherigen „Themen“-Runden bleiben Tag-Runden.

Quizwelten können jetzt auch direkt an Kategorien gepflegt werden. Die wirksamen Welten einer Frage sind die **Vereinigung aus Kategorie-Vorgaben und direkten Ergänzungen**, ohne Duplikate. Vererbung ist dynamisch, keine Kopie in jede Frage: Neue Fragen erben sofort, Änderungen an der Kategorie wirken auf bestehende Fragen. Ein Kategorienwechsel berechnet die geerbten Welten neu und behält direkte Ergänzungen. Beim Entfernen von Kategorie-Vorgaben können Fragen ohne direkte Ergänzung unzugeordnet werden; sie erscheinen im Adminfilter „Ohne Zuordnung“ und bleiben öffentlich sichtbar. Für das explizite Speichern einer Frage ist mindestens eine direkte oder geerbte Welt erforderlich.

## Umgesetzt

- Admin-Reiter **Quizwelten**: Anlegen, Name/Beschreibung bearbeiten, aktivieren/deaktivieren. Automatische, bei Namenskollision nummerierte IDs; Umbenennen behält die ID. Bearbeitung mit veraltetem Stand wird abgewiesen.
- Mehrfachauswahl an Kategorien und im Fragenformular. Dort stehen geerbte Welten separat als „Italien · über Kategorie Rom“; Checkboxen bezeichnen unabhängige direkte Ergänzungen. Die Fragenliste zeigt dieselbe Herkunft. Inaktive Welten bleiben gekennzeichnet pflegbar. Direkte Auswahl bleibt nach Speichern einer neuen Frage für die nächste Eingabe erhalten.
- Kombinierbarer Weltfilter und **Ohne Zuordnung** in der Fragenliste.
- Startseite vorerst **ohne Weltwahl oder Weltfilter**, wie am 23.10.2026 nach der ersten Umsetzung gewünscht. Alle verfügbaren Kategorien und Tag-Runden bleiben sichtbar, auch Fragen ohne Weltzuordnung. Es gibt keinen versteckten Italien-Standardfilter und keine Ausblendung bei fehlenden aktiven Welten.
- Kategorie-/Taglinks bleiben unverändert. Ein eventuell vorhandener `world`-Parameter aktiviert aktuell keinen Weltfilter und wird beim nächsten Auswahlwechsel entfernt. Der Einladungsbaustein kann Weltkontext für später übernehmen; die aktuelle öffentliche Oberfläche erzeugt ungetrennte Einladungen.
- Serverseitige Weltprüfung ist vorbereitet: Wird `worldId` ausdrücklich übergeben, prüft der Server Welt, Kategorie/Tag und jede Fragen-ID gemeinsam. Welt-ID und damaliger Titel werden mit Runde und Ergebnis eingefroren. Die aktuelle Startseite startet ohne Weltkontext. Änderungen während des Spiels verhindern keinen gültigen Abschluss.
- Import mit `worldIds` als direkten Ergänzungen aus vorhandenen IDs. Fehlendes Feld bzw. `[]` nutzt Kategorie-Vorgaben, ohne sie direkt zu kopieren. Ein leeres Array ohne geerbte Welt wird abgewiesen. Nur Altimporte ohne Feld **und ohne Kategorie-Vorgabe** erhalten mit Warnung Italien. Unbekannte Welten und falsche Typen werden abgewiesen. Neue nicht-italienische Dateien müssen direkte IDs oder eine passende Kategorie-Vererbung verwenden. Der lokale CLI-Validator kann Kategorie-Vorgaben nicht nachschlagen und weist bei leeren direkten Arrays auf diese Voraussetzung hin.
- JSON-Seed für leere Entwicklungsumgebungen übernimmt Zuordnungen. Keine Seeds auf bestehende Datenbanken anwenden.

## Fortschritt und Grenzen

Bestehende Frage-, Kategorie-, Tag- und Nutzer-IDs bleiben erhalten. Fortschritt und Entdecker-Souvenirs verwenden weiterhin dieselben Fragen; zusätzliche Weltzuordnungen zählen nicht doppelt. Souvenirs bleiben an Kategorien gebunden: Eine spätere Rom-Kategorienrunde im Kunstkontext kann den bisherigen Rom-Reisestempel auslösen. Tag-Runden zählen nach der bestehenden Regel und sind derzeit öffentlich nicht nach Quizwelten getrennt.

Der Reisepass gruppiert weiterhin insgesamt nach Kategorien/Tags, noch ohne Weltstatistik. Übungsrunden bleiben bewusst serverseitige Sammlungen offener Fragen einer Kategorie **über alle Welten hinweg** und starten ohne Weltfilter. Historische Ergebnisse erhalten keinen erfundenen Weltkontext.

Quizwelten sind keine Zugriffsschranke für Fragen. Der öffentliche Katalog und die bestehenden SEO-Kategorieseiten bleiben kategoriebasiert. API-Clients ohne Weltkontext bleiben kompatibel; ausdrücklich gefilterte API-Runden werden auf den Weltkontext geprüft. In der normalen lokalen Datenbank wurde nur Italien angelegt; Kunst/andere Beispiele waren isolierte Testdaten.

## Datenbank und Migration 020

Datei: `database/migrations/020_quiz_worlds.sql`. Erstinstallations-Snapshot: `database/schema.sql`.

| Tabelle/Feld | Zweck |
|---|---|
| `quiz_worlds` | Stabile ID, Titel, Beschreibung, Aktivierung, Revision für konkurrierende Bearbeitung |
| `quiz_question_worlds` | n:m-Verknüpfung mit eindeutigem Schlüssel `(question_id, world_id)` und Weltindex |
| `quiz_rounds.world_id`, `.world_title` | Nullable, eingefrorener Kontext einer gestarteten Runde |
| `quiz_results.world_id`, `.world_title` | Derselbe Kontext beim Abschluss; alte Ergebnisse bleiben NULL |

Die Migration legt Italien an und ordnet bisher **unzugeordnete** Fragen der bekannten Kategorien `rom`, `neapel`, `florenz`, `amalfi`, `siena` zu. Andere Kategorien, beispielsweise Testinhalte, bleiben zur manuellen Prüfung unzugeordnet. Bereits gepflegte Zuordnungen werden beim Wiederholen nicht überschrieben. Keine Fragen, Ergebnisse oder Belohnungen werden gelöscht oder neu importiert.

Beim Löschen einer Frage entfallen ihre Zuordnungen mit. Welten mit Verweisen sind per Fremdschlüssel gegen Löschen geschützt; die erste Version bietet stattdessen Deaktivieren. Adminänderungen verlangen Sitzung/CSRF. Fragen- und Weltzuordnungsänderungen sind eine gemeinsame Transaktion und werden zusammen auf veraltete Bearbeitungsstände geprüft.

### Kategorie-Vererbung: Migration 021

`database/migrations/021_category_worlds.sql` ergänzt `quiz_category_worlds` als n:m-Tabelle mit eindeutigem Schlüssel `(category_id, world_id)`, Weltindex und Fremdschlüsseln. Kategorie löschen entfernt deren Links; referenzierte Welten bleiben gegen Löschen geschützt. Der Erstinstallations-Snapshot enthält beide Migrationen; historische JSON-Kategorien für italienische Städte enthalten die passende Vorgabe für neue Entwicklungsdatenbanken.

Die einmalige Datenbereinigung setzt Italien für bekannte Stadtkategorien ohne bestehende Kategorie-Vorgabe (`rom`, `neapel`, `florenz`, `amalfi`, `siena`). Sie entfernt dort redundante direkte Italien-Links nur, wenn Italien bereits über die Kategorie gilt. Direkte weitere Welten und vorhandene abweichende Kategorie-Vorgaben bleiben erhalten. Nach registrierter Migration 021 überspringt ein erneutes Ausführen diese Datenbereinigung, damit spätere Adminänderungen nicht rückgängig gemacht werden. Test-/unbekannte Kategorien werden nicht pauschal Italien zugeordnet.

API-Ausgabe: Kategorien liefern `worldIds`; Fragen liefern `worldIds` (wirksame Vereinigung), `directWorldIds` und `inheritedWorldIds`. Beim Fragen-Speichern und Import bedeutet das Eingabefeld `worldIds` weiterhin **nur direkte Zuordnungen**; ein API-Leseobjekt daher nicht unverändert als Schreibpayload verwenden. Kategorien-Speichern verwendet `worldIds` als Vorgaben. Fehlendes Feld bei einer bestehenden Kategorie bewahrt deren Vorgaben. Eine veränderte Vererbung ändert auch die Frage-Contentversion, sodass veraltete Editoren keine unbemerkt falschen Zuordnungen speichern. Fragen-/Import-Schreibzugriffe sperren die Zielkategorie während der Transaktion.

### Anwendung und Rücksprung

1. Datenbank, private Konfiguration und Uploads sichern; vorheriges Dateirelease behalten.
2. Vollständigen neuen Backend-/Migrationsstand außerhalb des Webroots bereitstellen und auf der vorgesehenen Umgebung `php database/migrate.php` ausführen. Lokal: `docker exec quiz-hero-hostinger php database/migrate.php`.
3. Weltzuordnungen prüfen, insbesondere **Ohne Zuordnung**, danach Code aktivieren. Der Deploymentcheck verlangt Migrationen 020 und 021 vor Freigabe. Keine JSON-Seeds auf Production anwenden.

Lokales Vorabbackup: ignorierte `.private/quiz-worlds-before-20261023.sql`. Productionbackup und Rollout sind in [Hostinger Production](HOSTINGER-PRODUCTION.md) dokumentiert. MySQL-DDL ist nicht als Ganzes transaktional zurückrollbar: bei Abbruch Schema-/Migrationsstand prüfen und vorwärts abschließen. Alte Software kann additive Tabellen/Spalten ignorieren, pflegt aber keine Weltzuordnungen und zeigt keine Welttrennung. Ein Dateirücksprung ist kein vollständiger Feature-Rollback und kein Datenbank-Restore. Kein automatisches DROP-/Restore-Skript bereitgestellt.

Vor Migration 021 zusätzlich `.private/category-worlds-before-20261023.sql` gesichert. Ein lokaler Vorher-Nachher-Abgleich bestätigt unveränderte Fragenzeilen, wirksame Quizweltmengen und Anzahlen von Ergebnissen, Souvenirs sowie Avatar-Freischaltungen. Software vor 021 kennt die Vererbung nicht: Nach der Bereinigung würden ihr die entfernten direkten Italien-Links fehlen. Deshalb keinen alleinigen Dateirücksprung auf die alte Weltimplementation durchführen; bevorzugt vorwärts korrigieren oder Verknüpfungen vor einem Rücksprung kontrolliert materialisieren. Ein Backup-Restore würde spätere Fortschritte zurücksetzen und muss gesondert entschieden werden.

## Prüfstand

- 204 isolierte PHP-Integrationstests: leere Datenbank, Schema-Snapshot, wiederholte Migration; Weltpflege/CSRF/Versionierung, Mehrfachzuordnung, Vererbung, Kategorienwechsel, Import, Weltgrenzen, unveränderte Punkte und eingefrorene Ergebnisse. Migration 021 erhält effektive Zuordnungen und direkte Ergänzungen; Wiederholung überschreibt keine späteren Kategorie-Vorgaben. Keine Production-Testdaten verändert.
- Browser: die anfängliche öffentliche Weltwahl wurde mit Testdaten geprüft und anschließend auf Nutzerwunsch entfernt. Der aktuelle Stand zeigt wieder alle verfügbaren Kategorien ohne Weltfilter. Admin-Anlegen/Speichern und Mehrfachauswahl wurden mit rein browserseitigen API-Testantworten geprüft; echte Schreibpfade separat in der Wegwerfdatenbank. Bei 390 und 1440 Pixeln kein horizontaler Überlauf. Testdatenbank und flüchtige Browserfixtures nach Abschluss entfernt.
- 40 Frontendtests einschließlich Weltfilter, Mehrfachzuordnung, geerbter Importvalidierung, Einladungen und Übermittlung der Welt beim Rundenstart erfolgreich. CSS-/BEM-Prüfung und lokaler Hostinger-Build mit ausdrücklicher JSON-SEO-Vorschau erfolgreich. Emulierte Ansichten ersetzen keine Prüfung auf physischen Geräten.
- Kategorie-Vererbung zusätzlich im Browser mit flüchtigen Admin-API-Testantworten geprüft: Kategorie ändern aktualisiert die angezeigte Herkunft; Frage ergänzen sendet nur direkte IDs; Kategorie wechseln und Änderungen verwerfen stellt auch den geerbten Hinweis wieder korrekt her. Kategorieauswahl und Herkunftsanzeige passen bei 390 und 1440 Pixeln. Tatsächliche lokale API bestätigt Italien-Vererbung aller Rom-Fragen, keine direkten redundanten Italien-Links und weiterhin ungefilterte Startseite.
- Prüfgrenze: In einer browserseitigen Formular-Testansicht ohne Fragebild lief das unveränderte unsichtbare Datei-Input des bestehenden Uploadbereichs horizontal über. Die neuen Vererbungsfelder selbst passen in den Viewport; der allgemeine Upload-Code wurde im Rahmen dieser Änderung nicht angepasst.

## Später möglich, noch nicht umgesetzt

- Öffentliche Weltwahl und Filterung mit eigener gestalteter Darstellung, beispielsweise Weltkarten und Motiven. Der erste Dropdown-Entwurf wurde zurückgenommen.
- Kategorienübergreifende Welt-Runde ohne Kategorie-/Tagvorauswahl.
- Weltfilter im Reisepass und Statistiken, weltbezogene Belohnungen.
- Massenbearbeitung und Zuordnungsvorschläge.
- Eigene SEO-Landingpages für Quizwelten.
