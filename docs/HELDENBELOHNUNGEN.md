# Heldenbelohnungen: Regel-Baukasten

Stand: 31.10.2026. Erste Version lokal implementiert und geprüft, **noch nicht auf Production**. Bestehende Souvenirregeln bleiben unverändert. Übersicht: [Souvenirs und Belohnungen](Souvenir.md), [Profilbildverwaltung](MEDIA.md).

## Adminbedienung

Der Hauptreiter heißt jetzt **Belohnungen**. Unterbereiche: **Meilensteine & Souvenirs** sowie **Neue Helden**. Letzterer zeigt vorhandene Regeln als Bildkarten mit Bedingung und Status. Eine Karte öffnet ihren Editor; „Heldenbelohnung anlegen“ erstellt eine neue Regel. Desktop nutzt zwei Feldspalten und volle Abschnittsbreite, Mobile eine Spalte. Eine helle Hero-Fläche fasst die Regel automatisch als lesbaren Satz zusammen.

1. Unter **Mediathek → Profilbilder** ein quadratisches Bild hochladen. Anschließend unter **Helden** benennen, aktivieren und als **Belohnung** einstellen. „Später festlegen“ verhindert Vergabe bis zur Einrichtung. Bereits vorhandene Belohnungshelden sind ebenfalls auswählbar. Freie Profile und der Standardheld werden im Baukasten nicht umgestellt.
2. Unter **Belohnungen → Neue Helden** den Helden auswählen und die Bedingungen einstellen. Pro Held genau eine Regel; für vorhandene Regeln die Bildkarte bearbeiten.
3. Als Entwurf speichern oder aktivieren. Ein inaktiver Profilbildkatalogeintrag kann nur einen Entwurf/eine archivierte Regel erhalten; für aktive Vergabe zuerst das Profil unter Helden aktivieren.

| Feld | Möglichkeiten |
|---|---|
| Anzahl richtiger Fragen | Ganze Zahl 1–10.000 |
| Schwierigkeit | Alle, einfach, schwer (`medium`), Hero |
| Antwortversuch | Nur erster / erster oder zweiter Versuch |
| Heldenfähigkeiten | Ohne Hilfe / Hilfe erlaubt |
| Kategorie | Alle / eine bestehende Kategorie |
| Zeitrahmen | Über mehrere Questrunden sammeln (`total`) / innerhalb einer einzigen Questrunde (`round`) |
| Status | Entwurf, aktiv, archiviert |

Beispiele: „Beantworte insgesamt 5 unterschiedliche Hero-Fragen im ersten oder zweiten Versuch ohne Hilfe durch Heldenfähigkeiten richtig.“ Oder „Beantworte innerhalb einer einzigen Questrunde 10 unterschiedliche schwere Fragen im ersten Versuch … richtig.“ Die Einzelrundenbedingung muss in der gewählten Rundengröße tatsächlich erreichbar sein; der Baukasten verändert weder Fragenverteilung noch Rundengrößen.

## Zählung und Vergabe

### Lokale Testdatensätze (31.10.2026)

Vier aktive Beispielregeln sind ausschließlich lokal den bestehenden Helden zugeordnet. Die zunächst angelegten Testduplikate wurden am 31.10.2026 zusammengeführt: echte Helden jetzt als Belohnung, keine zusätzlichen Profile im sichtbaren Katalog. Kein Bestandteil einer Migration und nicht für den automatischen Produktionsimport vorgesehen.

| Profil / Schlüssel | Bedingung |
|---|---|
| Amphos (`amphos`) | Insgesamt 5 unterschiedliche Fragen richtig, beide Versuche, Hilfe erlaubt, alle Kategorien |
| Cassius (`cassius`) | In einer einzigen Runde 3 unterschiedliche Fragen richtig, beide Versuche, ohne Hilfe |
| Akuma (`akuma`) | Insgesamt 2 unterschiedliche Hero-Fragen im ersten Versuch ohne Hilfe richtig |
| Horus (`horus`) | Insgesamt 5 unterschiedliche Rom-Fragen richtig, beide Versuche, ohne Hilfe |

Die Einträge und ihre gespeicherten Kriterien wurden nach dem Zusammenführen per Datenbankabfrage kontrolliert; keine sichtbaren Testduplikate verblieben. Sicherung: `.private/before-hero-test-consolidation-20261031.sql`. In einer Transaktion wurden Regeln auf die echten Schlüssel übertragen, vorhandene Freischaltungen inklusive Vergabezeitpunkt und Snapshot übernommen und Testprofile mit Löschmarkierung versehen. Eventuelle ausgewählte Testprofile werden auf den echten Helden abgebildet; bei bisher frei ausgewählten echten Helden ohne Berechtigung gilt der Standardheld-Fallback. Beim Vorabcheck waren keine aktiven Profilzuweisungen auf diese acht Schlüssel vorhanden. Vorhandene passende Antwortbelege können beim nächsten Sammlungsabgleich bereits zur Freischaltung führen. Zum Pausieren im Admin archivieren; bereits verdiente Profile werden dadurch nicht entzogen. Es wurden keine Nutzerfortschritte zurückgesetzt und keine Freischaltungen direkt angelegt.

- Gezählt werden ausschließlich serverseitig bewertete Einzelantworten aus erfolgreich gespeicherten Runden, einschließlich Übungsrunden. Falsche und übersprungene Antworten zählen nicht.
- Insgesamt: unterschiedliche Fragen-IDs über alle passenden Runden. Wiederholungen, auch nach Bearbeitung derselben Frage, erhöhen die Anzahl nicht erneut.
- Einzelrunde: passende unterschiedliche Fragen je `result_id`; es gilt die beste einzelne gespeicherte Runde. Teilfortschritte verschiedener Runden werden niemals addiert. Eine bereits früher absolvierte passende Einzelrunde kann bei späterer Aktivierung berücksichtigt werden.
- Schwierigkeit und Kategorie stammen aus den eingefrorenen Antwortdaten (`difficulty`, `category_id_at_play`), nicht aus dem heutigen Fragenkatalog. Gelöschte/geänderte Katalogfragen verlieren ihren belegbaren historischen Beitrag nicht. Altbestände ohne passende Einzelbelege werden nicht geraten.
- „Ohne Hilfe“ schließt eine Frage aus, sobald für diese Frage eine Heldenfähigkeit verwendet wurde (`assisted_ability`). Einsätze bei anderen Fragen beeinträchtigen sie nicht. Bei „Hilfe erlaubt“ gelten weiterhin die ausgewählte Versuchsregel und eine richtige Antwort.
- Aktivierung vergibt nicht sofort an alle Accounts. Auswertung erfolgt beim nächsten gespeicherten Rundenabschluss oder über den bestehenden authentifizierten Sammlungsabgleich (`account-souvenir-sync`). Dieser kann belegbaren Altfortschritt nachtragen.
- Vergabe ist je Account und Held einmalig. Wiederholte Ergebnisübermittlung erzeugt keine zweite Freischaltung. Die bestehenden Ergebnisanzeige, Kontoauswahl und Souvenir-Heldenübersicht erhalten die neuen Belohnungen automatisch.
- Änderungen und Archivierung entziehen keine verdienten Helden. Die Bedingungen werden bei neuer Vergabe als unveränderlicher Snapshot gespeichert. Vorhandene Altvergaben bekommen keinen erfundenen Snapshot.

## Zusammenspiel mit der Mediathek und Astra

### Freischaltgrund im Quiz-Ergebnis

Lokal seit 31.10.2026: Jede Heldenbelohnung liefert ein zusätzliches Feld `reason`. Im Quiz-Ergebnis steht dieser kurze Text unter dem Heldennamen, in kleinerer Schrift und gedämpfter Textfarbe. Bild, Überschrift und Link zur Profilbildauswahl bleiben erhalten. Beispiele: „2 unterschiedliche Hero-Fragen insgesamt im ersten Versuch ohne Hilfe richtig beantwortet.“ oder „3 unterschiedliche Fragen in einer Questrunde ohne Hilfe richtig beantwortet.“ Bei beiden erlaubten Antwortversuchen genügt „richtig beantwortet“; erlaubte Hilfe wird nicht als zusätzliche Voraussetzung formuliert.

Der Grund wird aus `quiz_user_avatar_unlocks.rule_snapshot` gebildet. Spätere Änderungen oder Archivierung der aktuellen Belohnungsregel ändern frühere Begründungen nicht. Neue Vergabe-Snapshots speichern bei Kategoriebindung zusätzlich `category_title`, sodass spätere Umbenennungen den Vergabetext nicht verändern. Bei älteren Snapshots ohne Titel dient der aktuelle Kategoriename, ersatzweise die gespeicherte Kategorie-ID als lesbare Bezeichnung. Keine Umschreibung vorhandener Snapshots und keine neue Migration oder Datenbankspalte.

Für alte Vergaben mit bekannter fester Erstversuchsregel ist deren Bedingung als Fallback verfügbar. Bei fehlenden oder nicht verwertbaren Baukasten-Snapshots bleibt die Begründung leer; die Oberfläche blendet sie vollständig aus. Heutige Regeln werden nicht als angebliche historische Ursache ausgegeben. Texte werden im Browser als Textknoten eingefügt.

Prüfung: 57 Frontendtests, 290 isolierte Integrationstests, fünf zusätzliche Formatprüfungen (Singular, Kategorie/Zeitraum, feste Altregel, fehlender/ungültiger Snapshot), JS-/PHP-Syntax und CSS-/BEM-Build erfolgreich. API-Prüfung bestätigt unveränderte historische Begründung nach Regeländerung und Unterscheidung insgesamt/Einzelrunde. Browserfixture zeigt vier Belohnungen mit 12-Pixel-Begründung gegenüber 16-Pixel-Heldennamen ohne horizontalen Überlauf. Keine echten Freischaltungen verändert; Testdatenbank entfernt. Production unverändert.

Speichern im Baukasten setzt `quiz_avatars.unlock_rule` auf `configured`. Die Heldenverwaltung bietet „Regel im Bereich Belohnungen verwalten“ an. `manual` pausiert automatische Vergabe; freie oder deaktivierte/gelöschte Profile werden nicht neu vergeben. Der Bestandsüberblick weist auf abweichende Katalog-Zustände hin. Erneutes Speichern im Baukasten aktiviert dessen Regelquelle wieder, abhängig vom gewählten Regelstatus.

Die bisherige Freischaltoption `hero_first_try` bleibt aus Kompatibilitätsgründen unterstützt. Sie verwendet weiterhin ihre feste Erstversuchsregel; die frei konfigurierbare Definition gilt erst nach Speichern im Baukasten (`configured`). Migration 025 legt für Astra eine entsprechende Regelvorlage mit Ziel 1, Hero, erster Versuch, ohne Hilfe, insgesamt und aktiv an, **ohne** ihren bisherigen Marker, Namen, Bild, Freischaltungen oder Profilzuweisungen zu verändern. Bereits gelöschte/manuell konfigurierte Astra-Einträge werden nicht wiederbelebt. Benutzerdefinierte Regeln werden bei Migrationswiederholung nicht überschrieben.

Keine freien UND-/ODER-Gruppen, Zeitlimits, manuelle Einzelvergabe oder öffentliche Vorschau gesperrter Belohnungshelden in Version 1. Die persönliche Sammlung zeigt weiterhin nur bereits freigeschaltete Helden.

## Datenmodell und Betrieb

Migration: `database/migrations/025_avatar_reward_rules.sql`, ebenfalls in `database/schema.sql` enthalten.

- Neue Tabelle `quiz_avatar_reward_rules`: `avatar_key` als Primär-/Fremdschlüssel auf den Profilbildkatalog, `target`, `difficulty`, `attempts`, `without_help`, `category_id`, `period`, `state`, `revision`.
- Neue nullable JSON-Spalte `quiz_user_avatar_unlocks.rule_snapshot`. Bestehende Einträge und Vergabedaten bleiben unverändert.
- Neue Admin-Endpunkte `GET admin-avatar-rewards` und `POST admin-avatar-reward-save`. Schreiben verlangt Admin-CSRF; Versionsprüfung berücksichtigt auch zwischenzeitliche Änderungen am Profilbild. Neue Regelanlagen prüfen die Katalogrevision. Keine vom Client übermittelte Nutzer-ID oder Fortschrittszahl wird ausgewertet.
- Regeländerungen erhöhen die Regel- und Profilbildrevision. Bilder bleiben im bestehenden Profilbildbestand; kein eigener Bildduplikatbestand.

Lokal vor Anwendung gesichert: `.private/before-avatar-rule-builder-20261031.sql`; danach `docker exec quiz-hero-hostinger php database/migrate.php`. Keine bestehenden Testschwellen oder Heldenfähigkeitszuordnungen geändert. Vor einem späteren Production-Deployment vollständiges frisches Datenbank-/Uploadbackup und ausstehende Migrationen nach dem bestehenden [Deploymentablauf](../deployment/README.md) anwenden; keine Seeds auf Bestandsdaten importieren.

Rücksprung: Tabelle und additive Spalte können bestehen bleiben, aber Code vor 025 kennt den Baukasten und die automatische Vergabe für `configured` nicht. Bevorzugt vorwärts korrigieren. Eine Datenbankwiederherstellung verliert nach dem Sicherungszeitpunkt erfolgte Änderungen; keine destruktive Rückmigration oder Löschung persönlicher Vergaben vornehmen.

## Prüfung und Grenzen

49 Frontendtests, 272 isolierte Integrationstests, PHP-/JS-Syntax sowie CSS-/Token-/BEM-Build erfolgreich. Neue Tests: unterschiedliche Fragen über mehrere Runden gegenüber Einzelrunde; erster/zweiter Versuch; unterstützte Antworten; unveränderliche Schwierigkeit/Kategorie trotz Katalogänderung; nachträgliche Vergabe; Entwurf/Archiv; Snapshot- und Rechteerhalt nach Änderung; Ergebniswiederholung; fehlende Berechtigung/CSRF; ungültige Kriterien; Versionskonflikte; geschützter Standardheld und Migrationswiederholung.

Browser mit simulierten Adminantworten: beide Unterbereiche, Motivbestand, Neuanlage und Schreibpayload, Live-Zusammenfassung für Einzelrunde, erfolgreiche Aktualisierung der Bestandskarten, Fehler mit erhaltenen Eingaben. Bei 320 Pixeln eine Feldspalte ohne Überlauf; bei 1280 Pixeln zwei Feldspalten mit voller Abschnittsbreite ohne Überlauf. Keine echten Admin-Regeln über Browserfixtures gespeichert. Testdatenbank anschließend entfernt. Produktionsstand unverändert.
