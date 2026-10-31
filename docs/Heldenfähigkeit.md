# Heldenfähigkeiten

**Production-Stand 31.10.2026:** Der aktuelle implementierte Helden-/Belohnungsstand ist mit Release `97ff6254492f-20261031202004` veröffentlicht. Datierte lokale Prüfnotizen darunter dokumentieren die Vorabprüfung; vorgemerkte Ideen bleiben nicht implementiert. Nachweis und Datenübertragung: [Helden-Rollout](HELDEN-ROLLOUT-2026-10-31.md).

Stand: **31.10.2026**. Fortlaufende Übersicht über Regeln, Umsetzung, Adminpflege und neue Ideen. **Version 1 ist lokal implementiert und Migrationen 022–027 lokal angewendet. Noch nicht auf Production.**

Diese Datei bei jeder Änderung ergänzen. Tatsächliche Funktionen, verbindliche Regeln und spätere Ideen getrennt halten. Verwandte Dokumentation: [Souvenirs](Souvenir.md), [Feature-Übersicht](FEATURES.md), [Production](HOSTINGER-PRODUCTION.md).

## Aktuelle Regeln auf einen Blick

### Startfähigkeiten mit 0 Runden (31.10.2026, lokal)

Im Fähigkeiteneditor sind **0–100 abgeschlossene Runden** erlaubt. **0 bedeutet Startfähigkeit**: sofort verfügbar, sofern die Definition aktiv und dem Helden zugeordnet ist. Positive Werte bleiben persönlich je Held erlernbar; global definierte Fähigkeiten gelten weiterhin kontoübergreifend für dessen Helden. Die Lernschwelle ist wie bisher ein Feld der Fähigkeitsdefinition, kein gesonderter Wert je Held. Eine Änderung auf 0 betrifft deshalb alle Helden mit dieser Zuordnung. Adminhinweis und Checkboxtexte benennen die Startfähigkeit ausdrücklich; Laden/Speichern erhält den Wert 0 unverändert.

Startfähigkeiten erscheinen bereits in der Registrierung und bei Konten ohne Spielfortschritt in der Heldenvorstellung. Der API-Inventareintrag kennzeichnet sie mit `isDefault: true` und `unlocked: true`. Die Vorschau zeigt somit sofort verfügbare Startfähigkeiten plus tatsächlich erlernte Fähigkeiten, niemals noch gesperrte Ziele. Die bisherige Begrenzung auf drei Fähigkeiten und die jeweiligen Einsatzzeitpunkte bleiben bestehen. Sofort verfügbar bedeutet daher nicht, dass beispielsweise Heldenblick bereits vor dem ersten Fehlversuch eingesetzt werden kann.

Die Verfügbarkeit wird aus der aktuellen Definition berechnet; keine künstlichen persönlichen Lernfreischaltungen oder Benachrichtigungen „neu erlernt“ für Startfähigkeiten und keine Massenänderung vorhandener Konten. Steigt eine Schwelle später von 0 auf einen positiven Wert, endet der implizite Startzugang, falls keine echte persönliche Freischaltung existiert. Tatsächlich erworbene Berechtigungen bleiben erhalten. Deaktivierung und Entfernen der Heldenzuordnung sperren wie bisher die Nutzung in neuen Runden; laufende Runden behalten ihre eingefrorenen Regeln.

Keine Migration erforderlich: `quiz_abilities.rounds_required` ist bereits `INT UNSIGNED` und erlaubt 0. Standardwert 3, alle vorhandenen Schwellen, Zuweisungen und persönlichen Rechte bleiben unverändert. Der Admin stellt gewünschte Startfähigkeiten ausdrücklich selbst auf 0. Keine neue gesonderte „Grundfähigkeit“-Rolle. API-Validierung weist negative Werte, Brüche und Werte über 100 weiterhin zurück. Production unverändert.

Prüfung: 57 Frontendtests und 301 isolierte Integrationstests erfolgreich. Neue Fälle decken Startvorschau, sofortige Nutzung ohne Fortschritt, keine erfundene Lernvergabe, Deaktivierung bei fortbestehender Rundensnapshot-Nutzung, Heldenwechsel, Anheben der Schwelle, erhaltene echte Rechte und ungültige Grenzwerte ab. Browserfixture bestätigt Eingabewert 0 (min 0, gültig), Checkboxtext Startfähigkeit und sichtbare Standardfähigkeit in der Vorschau ohne horizontalen Überlauf. PHP-/JS-Syntax erfolgreich; Testdatenbank entfernt. Keine echten Freischaltungen oder Schwellen verändert.

### Vorschau zeigt nur erlernte Fähigkeiten (31.10.2026, lokal)

Konto und Registrierung bewerben keine künftig lernbaren Fähigkeiten mehr als bereits vorhanden. `account-hero-preview` filtert das aktuell zugeordnete, aktive Repertoire auf persönlich freigeschaltete Fähigkeiten dieses Helden (einschließlich gegebenenfalls persönlich freigeschalteter globaler Definitionen). `hero-preview` für die Registrierung liefert nur konfigurierte Startfähigkeiten (0 Runden), keine später zu erlernenden Fähigkeiten. Die gemeinsame Oberfläche filtert zusätzlich auf `unlocked === true`.

Ohne freigeschaltete Fähigkeit werden Kartenleiste und Einsatzhinweis ausgeblendet; der neutrale Text lautet „Fähigkeiten werden im Spiel freigeschaltet.“ Mit einer oder mehreren Freischaltungen erscheinen nur diese Fähigkeiten samt Beschreibung. Admin-Zuordnung bestimmt das Repertoire. Nur ausdrücklich auf 0 Runden gestellte Definitionen sind sofort verfügbar; siehe Startfähigkeiten oben. Eine gesonderte Grundfähigkeitsrolle gibt es weiterhin nicht. Adminpflege, Quiz-Zeitpunkte, bestehende Berechtigungen und Fortschritt bleiben unverändert. Keine Migration.

Prüfung: 57 Frontendtests, 291 isolierte Integrationstests sowie PHP-/JS-Syntax und CSS-/BEM-Build erfolgreich. API-Fälle: Registrierung trotz Sitzung ohne Fähigkeiten, persönliche erlernte Auswahl, anderer Held ohne übernommene Freischaltungen und nur eine erlernte Fähigkeit aus drei zugeordneten. Browserfixture: keine leere Kartenleiste, kein Einsatzhinweis ohne Freischaltung, nur erlernte Karte mit funktionierender Beschreibung und kein horizontaler Überlauf. Keine echten Kontodaten oder Freischaltungen verändert; Testdatenbank entfernt. Noch nicht veröffentlicht.

### Scharfblick und Glücksanker (31.10.2026, lokal implementiert)

Der Katalog umfasst jetzt fünf implementierte Effekte. **Scharfblick** (`focus`) entfernt vor der ersten Antwort bei vier Antwortmöglichkeiten genau zwei zufällige, garantiert falsche Antworten. Für diese Frage sinken Erstversuchspunkte und erreichbare Höchstpunkte auf zwei; ein richtiger zweiter Versuch bleibt einen Punkt wert. **Glücksanker** (`lucky`) ist nach dem ersten Fehlversuch verfügbar: richtige zweite Antwort regulär ein Punkt, falsche zweite Antwort ein Trostpunkt. Eine Trostpunkt-Frage bleibt `incorrect`, zählt weder als gelöst noch als richtige Antwort für Entdeckersouvenirs oder Antwort-Belohnungen.

Beide neuen Hilfen schließen jede weitere Fähigkeit an derselben Fragenposition aus und sind nach einer anderen Hilfe dort nicht einsetzbar, auch nicht nach einem Fragewechsel. Bestehende Kombinationen der ursprünglichen drei Effekte bleiben unverändert. Jeder neue Effekt einmal je Runde, nur nach persönlichem Erlernen und aktueller Zuordnung. Kategorie-, Themen- und geeignete Übungsrunden unterstützt. Zeitpunkte, Ausschlüsse, verborgene Antwortindizes und Punkte werden serverseitig geprüft; wiederholte Aktionskennung liefert dieselbe Antwort. Manipuliertes Absenden ausgeblendeter Antworten wird abgewiesen. Beide Effekte markieren die Frage als unterstützt; Bedingungen „ohne Hilfe“ bleiben ausgeschlossen. Gestartete Runden behalten ihre bisherigen Snapshots.

Admin: Beide Definitionen sind im bestehenden Fähigkeiteneditor samt Name, Beschreibung, Motiv, Aktivierung und Lernschwelle pflegbar und unter Helden zuweisbar. Standard-Lernschwelle drei qualifizierende Runden. Keine Änderung vorhandener Testschwellen. Eigene transparente Low-Poly-Medaillons (Lupe und Anker) sind per Migration 027 verknüpft; Details, Prompts und Betrieb siehe [Bilddokumentation](HELDENFAEHIGKEITEN-BILDER.md). Vorhandene Motivverwaltung unterstützt späteren Austausch. Lokal zum Einstieg **Anubia zusätzlich Scharfblick**, **Bobo zusätzlich Glücksanker** zugeordnet, jeweils in einen freien Platz. Bestehende Fähigkeiten und persönliche Freischaltungen bleiben erhalten. Diese lokalen Beispielzuordnungen sind kein automatischer Production-Seed.

Migration `026_focus_and_lucky_abilities.sql` ergänzt ausschließlich zwei Zeilen in `quiz_abilities`; keine neuen Tabellen oder Spalten. `INSERT IGNORE` erhält spätere Änderungen bei Wiederholung. Schema-Snapshot enthält dieselben Einträge. Lokal nach vollständiger Sicherung `.private/before-focus-lucky-20261031.sql` mit `php database/migrate.php` angewendet. Vor späterem Deployment normales Datenbank-/Uploadbackup, Migration und passenden Anwendungscode gemeinsam bereitstellen. Code vor 026 kennt die neuen Effekte nicht: Ein Rücksprung muss deren Nutzung und gestartete neue Runden berücksichtigen; bevorzugt vorwärts korrigieren, keine historischen Ergebnisdaten umschreiben. Production unverändert.

Prüfung dieser Erweiterung: 53 Frontendtests und 287 isolierte Integrationstests erfolgreich. Abgedeckt: Lernfreischaltung, Einsatzzeitpunkt, zwei garantiert falsche Antworten, Manipulationsabwehr, Kombinationssperren, Erst-/Zweitversuchspunkte, angepasste Höchstpunkte, Trostpunkt bei unverändert falschem Ergebnis, Hilfemarkierungen und idempotente Aktionen/Ergebnisse sowie Migrationserhalt. Browserfixture prüft nur passende verfügbare Karten, Beschreibungen, Aktivierung und Ausblenden nach Einsatz. Keine echten Spielerfreischaltungen zu Testzwecken angelegt.

### Heldenauswahl mit Vorstellung (31.10.2026, lokal)

Aktuelle Flächenlogik (gemeinsam für Konto, Registrierung und Quizdialog): Fähigkeitskarten standardmäßig transparent. Beim Anklicken wird die aktive Karte mit `--color-surface` hinterlegt, identisch zur geöffneten Beschreibung; lila Rahmen bleibt als Auswahlmarkierung. Die aktive Karte bleibt voll deckend, nur tatsächlich verbrauchte/deaktivierte Quizfähigkeiten nutzen weiterhin die zentrale deaktivierte Opazität. Nachprüfung: 48 Frontendtests, CSS-/Token-/BEM-Build und Browser bei 390 Pixeln erfolgreich; transparente Basis, gleiche helle aktive Fläche/Erklärung, Deckkraft 1 und kein Überlauf.

Die gemeinsame Erklärung unter der Fähigkeitenleiste ist eine kompakte helle Karte mit durchgehendem dünnem lila Rahmen. Kleine fette Überschrift in Hero-Lila: „[Name] · Deine Fähigkeit“, darunter unveränderte Beschreibung in normaler Textfarbe. Auswahlwechsel aktualisiert Überschrift und Text gemeinsam; erneutes Anklicken blendet die Karte aus. Zentraler Surface-/Hero-Token und vorhandene Größen verwendet. CSS-/Token-/BEM-Build, JS-Syntax und Browserprüfung bei 390 Pixeln (Wechsel, Schließen, Farben und kein Überlauf) erfolgreich. Nur lokal, keine Regeländerung.

Optische Nachbesserung: Die drei kompakten Fähigkeitsschaltflächen sind gleich hohe Karten mit leichtem lila Rahmen und sehr heller lila Fläche, abgeleitet aus den bestehenden Hero-Tokens. Ihre Namen verwenden `--color-text`. Aktive Beschreibung wird durch stärkeren lila Rahmen markiert. Das Schließen-X wird wie bei allen über `openDialog` geöffneten Standarddialogen zentral in `public/js/dialog.js` erzeugt; der Heldendialog verwendet denselben Wrapper, Button und dieselben Hover-/Fokusregeln. Keine eigene Textzeichen-Variante mehr. Browser bei 390 Pixeln: Kartenreihe etwa 79 Pixel hoch, kein Überlauf, Beschreibung funktioniert; Schließen-SVG identisch zum Footer-Standarddialog. 47 Frontendtests und CSS-/Token-/BEM-Build erfolgreich; nur lokal.

Konto und Registrierung verwenden den gemeinsamen kompakten Dialog `public/js/hero-preview.js`. Ein Klick auf eine Heldenkarte öffnet Bild, Name und bis zu drei persönlich freigeschaltete, weiterhin aktive und zugeordnete Fähigkeiten einschließlich erlernter globaler Definitionen. Noch gesperrte Fähigkeiten werden nicht dargestellt. Diese stehen nebeneinander als kleine Bild-/Namensschaltflächen. Ein Klick öffnet darunter genau eine gemeinsame kurze Beschreibung; erneutes Klicken klappt sie zu. Keine großen Fähigkeits-Akkordeons und keine Statuszusätze wie „Erlernt“ oder „Lernbar“. Der persönliche Lernstand bleibt serverseitig berücksichtigt, ohne diese Zusatztexte anzuzeigen. Nicht mehr zugeordnete oder deaktivierte Fähigkeiten bleiben entsprechend der bestehenden Nutzungsregeln außerhalb der Auswahl. Eine neue Grundfähigkeit- oder Sofortfreischaltung wird dadurch nicht eingeführt.

Heldenkarten in Konto und Registrierung zeigen nur Bild und Name; ausgewählter Held weiterhin durch lila Rahmen/Hintergrund und `aria-pressed` erkennbar. Keine sichtbaren Zusätze „Ausgewählt“, „Verfügbar“ oder „Freigeschaltet“. Der Vorstellungsdialog verwendet den zentralen `--color-hero-surface`. Admin-Karten bleiben unverändert. Nachprüfung: 47 Frontendtests, CSS-/Token-/BEM-Build, JS-Syntax erfolgreich. Browser bei 390 Pixeln: drei Fähigkeiten in einer 78 Pixel hohen Reihe, keine Statuszusätze, kein Überlauf; Beschreibung öffnet, wechselt und schließt, Auswahlbestätigung funktioniert. Keine Datenbankänderung, nur lokal.

Erst „Helden auswählen“ übernimmt den Helden: im Konto über den bisherigen geschützten Update-Endpunkt, bei der Registrierung nur als lokale Vorauswahl bis zum Absenden des Formulars. Abbrechen, Escape und Hintergrundklick speichern nichts. Bei Speicherfehler bleibt der Dialog offen und die bisherige Auswahl erhalten; während des Speicherns sind Schließen und Mehrfachabsenden gesperrt. Während des Ladens bleibt die Auswahlaktion gesperrt. Fehler erlauben Schließen und erneutes Öffnen; veraltete Ladeantworten überschreiben keinen neu geöffneten Dialog. Das separate Fähigkeiten-Akkordeon im Profil bleibt entfernt.

API: `GET hero-preview&heroKey=…` liefert ausschließlich öffentlich auswählbare freie aktive Helden ohne noch zu erlernende Fähigkeiten; auch ein vorhandenes Cookie gibt dort keine persönlichen Freischaltungen preis. `POST account-hero-preview` mit `heroKey` und gültiger Account-Sitzung/CSRF liefert ausschließlich persönlich freigeschaltete und aktuell verfügbare Fähigkeiten für einen auswählbaren Helden. Kein Nutzer-ID-Parameter und kein Profilwechsel durch den Abruf. Keine Schemaänderung oder Migration; vorhandene Fähigkeiten, Zuordnungen und Testschwellen bleiben erhalten.

Prüfung: 47 Frontendtests, 254 isolierte Integrationstests, PHP-/JS-Syntax und CSS-/Token-/BEM-Build erfolgreich. Browserprüfung: Öffnen und Abbrechen ohne Speicherrequest, genau ein Account-Update nach Bestätigung, aktualisierte Auswahl, Speicherfehler mit offener Vorschau und unverändertem Helden, Erlernt/Lernbar und Beschreibungen, schnelles Schließen/Wiederöffnen. Registrierung bei 390 Pixeln ohne Überlauf, Abbrechen erhält alten Helden, Bestätigung merkt neuen Helden vor. Ausschließlich simulierte Account-Schreibantworten, keine echten Nutzer geändert; Wegwerfdatenbank gelöscht. Noch nicht veröffentlicht.

| Thema | Version 1 |
|---|---|
| Start | Zugeordnete aktive Fähigkeiten mit 0 Runden sind sofort verfügbar; andere müssen erlernt werden. Ohne konfigurierte Startfähigkeit beginnt der Account ohne nutzbare Fähigkeit. |
| Persönlicher Erwerb | Standardmäßig drei erfolgreich gespeicherte Runden mit mindestens fünf tatsächlich beantworteten Fragen; falsche Antworten zählen als beantwortet, übersprungene nicht. |
| Heldenbindung | Heldengebundene Fähigkeiten werden pro Account und Held freigeschaltet. Der beim Start eingefrorene Held erhält den Fortschritt. |
| Globale Fähigkeiten | In der Entwicklung definierbar; einmal pro Account freischalten und mit jedem Helden verwenden. Geeignete Runden aller Helden zählen. Es gibt zunächst keine vorbelegte globale Fähigkeit. |
| Bereitstellung | Alle freigeschalteten Fähigkeiten des Helden stehen ab der nächsten Runde automatisch bereit, ohne Vorauswahl im Profil. |
| Einsatz | Jede freigeschaltete Fähigkeit einmal pro Runde, ab fünf Rundenfragen. Zwei Fähigkeiten erlauben zwei, drei erlauben drei Einsätze. Keine verbrauchbaren Vorräte. |
| Rundenarten | Kategorie- und Themenrunden; Heldenblick/Schutzschild auch in Übungsrunden ab fünf Fragen. Fragewechsel in Übungsrunden ausgeschlossen. |
| Profilbildwechsel | Erlernte Fähigkeiten und Lernfortschritt bleiben beim bisherigen Helden erhalten. Globale Freischaltungen gehen nicht verloren. |
| Historie | Vor Einführung abgeschlossene Runden erhalten keinen erfundenen Heldenbezug und zählen nicht rückwirkend. |
| Adminänderungen | Bereits erlernte Berechtigungen werden nicht entzogen. Deaktivierte oder nicht mehr zugeordnete Fähigkeiten sind nicht auswählbar. Gestartete Runden behalten ihre eingefrorenen Regeln. |

Es gibt normale heldengebundene Fähigkeiten und technisch vorbereitete globale Fähigkeiten. **Der Begriff Grundfähigkeit ist abgeschafft.** Jeder Held besitzt maximal drei verfügbare Fähigkeiten, einschließlich globaler Definitionen. Mehrere Helden dürfen denselben Effekt besitzen. Freischaltung erfolgt je Fähigkeit anhand ihrer Rundenanzahl. Andere Errungenschaften sind spätere Erweiterungen.

## Implementierte Effekte

| Fähigkeit / Effekt | Zeitpunkt | Wirkung | Punkte und Grenzen |
|---|---|---|---|
| **Heldenblick** (`eliminate`) | Nach dem ersten Fehlversuch, vor dem zweiten | Eine weitere garantiert falsche Antwort serverseitig auswählen und sperren; die erste falsche Antwort ist bereits gesperrt. | Richtiger zweiter Versuch weiterhin ein Punkt. Alle Schwierigkeitsgrade. |
| **Schutzschild** (`shield`) | Nach dem ersten Fehlversuch, vor dem zweiten | Für genau diese Frage den zweiten Versuch absichern. | Bei richtiger zweiter Antwort zwei statt eines Punktes; sonst null. Keine nachträgliche Änderung anderer Fragen. |
| **Neues Abenteuer** (`swap`) | Vor der ersten Antwort | Andere Frage derselben Kategorie, bevorzugt gleicher Schwierigkeit, aus dem beim Rundenstart passenden Bestand. Welt-/Tagkontext bleibt erhalten. | Keine bereits in der Runde enthaltene Frage. Bei fehlendem Ersatz deaktiviert, kein Verbrauch. Andere Schwierigkeit nur als Rückfall innerhalb derselben Kategorie; maximale Punkte werden daraus neu berechnet. Nicht in Übungsrunden. |
| **Scharfblick** (`focus`) | Vor der ersten Antwort | Zwei falsche Antworten entfernen. | Vier Antwortmöglichkeiten erforderlich; höchstens zwei Punkte, richtiger zweiter Versuch ein Punkt. Keine andere Hilfe an derselben Frage. |
| **Glücksanker** (`lucky`) | Nach dem ersten Fehlversuch | Bei erneut falscher Antwort einen Trostpunkt erhalten. | Richtige zweite Antwort weiterhin ein Punkt; Trostpunkt zählt nicht als richtige Antwort. Keine andere Hilfe an derselben Frage. |

Nur die endgültige Ersatzfrage wird gewertet; die unbeantwortete ausgetauschte Frage zählt weder als richtig noch falsch und nicht für Entdeckerfortschritt. Die Rundengröße bleibt gleich.

Unterstützte richtige Antworten zählen zum regulären Lern- und Souvenirfortschritt. Die unterstützte Frage wird historisch markiert. **Eine unterstützte Hero-Frage schaltet Astra nicht durch einen Erstversuch frei.** Eine andere, ohne Hilfe richtig gelöste Hero-Frage derselben Runde kann Astra weiterhin freischalten. Diese Unterscheidung gilt auch beim späteren Belohnungsabgleich.

## Vorbelegung für lokale Tests

Migration 022 ordnet den vorhandenen Helden einmalig eine Fähigkeit zu. Die Zuordnung ist danach vollständig im Admin änderbar und wird durch erneute Migration nicht zurückgesetzt. Kein Account erhält dadurch sofort eine persönliche Freischaltung.

| Fähigkeit | Helden |
|---|---|
| Heldenblick | Quiz-Hero, Anubia, Burgo, Dash, Kitsu, Milo, Nefara, Shinzo, Sternenfunke |
| Schutzschild | Akuma, Bobo, Cassius, Goldzahn, Krygon, Morbix, Professor Blitzbirne, Sir Emmental, Winterseherin |
| Neues Abenteuer | Amphos, Bronko, Cedric, Horus, Magmore, Nagero, Quizo, Sporix, Astra |

Dies ist eine funktionale Testbelegung, keine endgültige thematische Zuordnung. Später neu angelegte Profilbilder erhalten nicht ungefragt eine Fähigkeit; diese im Admin zuordnen.

## Darstellung für Nutzer

Lokal seit 31.10.2026: Die Überschrift des Lernerfolgs im Quiz-Ergebnis nennt ausdrücklich den Rundenhelden und die Anzahl: „Burgo hat eine neue Heldenfähigkeit erlernt“, „Burgo hat zwei neue Heldenfähigkeiten erlernt“ beziehungsweise drei. Der Controller übergibt den bei Rundenstart übernommenen Heldennamen als festen Wert an die Ergebnisansicht, bevor der Rundenzustand zurückgesetzt wird. Ein nachfolgender Profilwechsel ersetzt diesen Text nicht. Bei fehlendem Namen lautet der Fallback „Dein Held“. Bestehende Motive, Beschreibungen und Freischaltregeln unverändert. 57 Frontendtests, JS-Syntax und Browserprüfung für Einzahl/Mehrzahl/Fallback ohne horizontalen Überlauf erfolgreich. Keine Datenbankänderung, noch nicht veröffentlicht.

- Der Bereich „Heldenfähigkeiten“ ist auf Nutzerwunsch vorerst aus der Profilseite entfernt. Eine neue Darstellung wird später gestaltet; das Profil lädt dafür keine Fähigkeitsdaten mehr.
- Freischaltungen und Lernfortschritt bleiben erhalten. Die automatische Verfügbarkeit im Quiz und die Adminpflege bleiben unverändert.
- Im Quiz je Fähigkeit ein kleiner beschrifteter Button zwischen Schwierigkeit/Punkten und Antworten. Erklärung, fehlende Voraussetzung, Restlimit und eingesetzter Zustand sind sichtbar.
- Bei unklarem Netzwerkergebnis Antworten vorübergehend sperren und denselben Einsatz erneut prüfen. Der Nutzer kann dadurch keinen zweiten Einsatz verbrauchen oder mit einem unklaren Fragewechsel weiterspielen.
- Neue Freischaltungen erscheinen nach erfolgreich gespeichertem Abschluss im Ergebnis. Der Link zum vorerst entfernten Profilbereich entfällt.
- Einfache Symbole statt neuer Bilddateien. Die vorbereitete Bestandsdarstellung ist derzeit nicht in die Profilseite eingebunden.

## Adminpflege

Eigener Reiter **„Heldenfähigkeiten“**:

1. **Allgemeiner Katalog:** Vorhandene Fähigkeit auswählen; Name, Beschreibung, Aktivierung und erforderliche Rundenanzahl (0–100; 0 = Startfähigkeit) pflegen. Neue Definitionen und Effekte werden ausschließlich in der Entwicklung ergänzt. Jede gezählte Runde benötigt weiterhin mindestens fünf beantwortete Fragen.
2. **Zuordnung je Held:** Heldenkarten wie in der Profilbildauswahl mit Bild, Name und bisherigen Zuordnungen. Klick öffnet einen nativen Dialog mit Heldenbild, Name und bis zu drei Fähigkeits-Checkboxen. Im Dialog speichern oder abbrechen. Es gibt keine zusätzliche Grundfähigkeit-Auswahl. Häkchen bestimmen das erlernbare Repertoire, nicht eine bereits persönlich erworbene Berechtigung. Bei drei Zielen von jeweils einer Runde werden alle drei nach derselben geeigneten Runde erlernt und sind in der nächsten Runde je einmal nutzbar. Globale Definitionen zählen zur Obergrenze drei. Bei zukünftigen globalen Definitionen die Zuordnungen passend reduzieren; der Server begrenzt auch fehlerhafte Altbestände auf drei (globale Definitionen zuerst).

Effekt und Geltung einer bestehenden Fähigkeit bleiben fest. Für eine andere Wirkung oder den Wechsel von heldengebunden zu global ist eine neue, in der Entwicklung bereitgestellte Definition erforderlich. Namen/Texte und Rundenanzahl bleiben änderbar; bestehende Freischaltungen bleiben bestehen. Neue Schwellen beziehungsweise neu zugewiesene Fähigkeiten werden beim nächsten gespeicherten Rundenabschluss gegen den seit Einführung belegten Fortschritt geprüft, nicht sofort durch das Öffnen des Profils.

Entfernen einer Heldenzuordnung wird bestätigt und sperrt die weitere Auswahl, löscht jedoch keine bereits erlernte Berechtigung. Deaktivieren wirkt ebenfalls nur auf neue Auswahl/neue Runden. Entfernte/deaktivierte Helden bleiben über die bestehende Avatarverwaltung nicht auswählbar; deren Fähigkeiten werden keinem anderen Helden übertragen. Es gibt kein Löschen von Fähigkeitsdefinitionen in Version 1.

Schreibaktionen benötigen Adminanmeldung, CSRF und die aktuelle Bearbeitungsversion. Ungespeicherte Änderungen werden geschützt. Neue Spiellogik kann nicht durch freie Texte, Formeln oder SQL im Admin erzeugt werden.

## Datenbank und technische Umsetzung

Migration: `database/migrations/022_hero_abilities.sql`; Erstinstallations-Snapshot: `database/schema.sql`.

| Tabelle/Feld | Zweck |
|---|---|
| `quiz_abilities` | Katalog, stabiler Schlüssel, Effekt, Geltung, Rundenanzahl, Aktivierung und Revision |
| `quiz_hero_abilities` | Zuordnungen je Avatar-Schlüssel; das alte Feld `is_basic` bleibt ungenutzt erhalten |
| `quiz_user_abilities` | Persönliche dauerhafte Freischaltungen je Held beziehungsweise global mit leerem Helden-Schlüssel; auslösende Ergebnis-ID |
| `quiz_ability_equipment` | Ungenutzte Altstruktur; keine Auswahlfunktion oder API mehr |
| `quiz_round_abilities` | Temporärer eingefrorener Rundenstand, bei Bedarf Ersatzbestand und Liste idempotenter Aktionen, maximal eine je Fähigkeit |
| `quiz_hero_round_history` | Dauerhafter Heldenbezug, beantwortete Fragen und verwendete Fähigkeit/Aktion je abgeschlossenem Ergebnis; unabhängig vom späteren Löschen temporärer Runden |
| `quiz_question_results.assisted_ability` | Markiert eine durch Fähigkeit unterstützte Frage; alte Ergebnisse bleiben NULL |

Der Server sperrt zunächst den Account und dann die Runde, prüft Eigentümer, Freischaltung und zulässigen Fragezustand und schreibt Wirkung/Verbrauch atomar. Wiederholung derselben Aktionskennung liefert dasselbe Ergebnis; eine andere Kennung nach Verbrauch derselben Fähigkeit wird abgewiesen. Andere Fähigkeiten bleiben nutzbar, auch an derselben Frage. Beim Abschluss müssen Antworten zu den vor Einsatz gespeicherten Versuchen passen. Eine durch Heldenblick ausgeblendete Antwort darf nicht eingereicht werden. Punkte werden serverseitig neu berechnet.

Laufende Runden behalten Held, die beim Start verfügbaren Fähigkeiten, deren Revisionen und Effekte trotz Profil- oder Katalogänderungen. Bei Fragewechsel stammt der Ersatz aus dem eingefrorenen passenden Bestand. Dauerhafte Ergebnishistorie bewahrt den Einsatz auch nach der regulären Aufbewahrungsfrist temporärer Runden. Kontolöschung und lokaler Test-Reset entfernen Fähigkeiten und persönlichen Heldenfortschritt; Production-Reset bleibt gesperrt.

### Anwendung und Wiederherstellung

1. Vor Migration Datenbank, private Konfiguration und Uploads sichern; vorheriges Dateirelease behalten.
2. Vollständige Backendabhängigkeiten privat bereitstellen, dann `php database/migrate.php` vor der Codefreigabe ausführen. Lokal: `docker exec quiz-hero-hostinger php database/migrate.php`.
3. Keine Seeds ausführen und keine lokalen Testfreischaltungen nach Production importieren. Bestehende Fragen, Konten, Resultate und Souvenirs bleiben erhalten.
4. Zuweisungen und Freischaltungen mit geeigneten lokalen Testkonten prüfen. In Production keine künstlichen Erfolge an echten Accounts vergeben.

Lokales Vorabbackup: ignorierte `.private/before-abilities-20261023.sql`. Migrationen 022/023 sind nur lokal angewendet. Migration 023 ersetzt ausschließlich die unveränderte alte Standardbeschreibung von Schutzschild („ausrüsten“ durch „einsetzen“); eigene Texte, Namen, Testschwellen und Freischaltungen bleiben erhalten. Vorabbackup: `.private/before-ability-usage-20261023.sql`. Die vorhandenen JSON-Spalten speichern jetzt Listen von Fähigkeiten und Aktionen (Format 2). Alte eingefrorene Einzel-Fähigkeiten/Runden werden weiterhin gelesen und behalten ihr damaliges Limit; neue Regeln gelten für neu gestartete Runden. MySQL-DDL ist nicht vollständig transaktional rückrollbar; bei Abbruch Stand prüfen und vorwärts abschließen. Ein Dateirücksprung entfernt keine neuen Tabellen. Alte Software kennt den Schutzschild und die Markierung unterstützter Antworten nicht; sie kann nach neuen Fähigkeitseinsätzen Wertung beziehungsweise Astra-Abgleich falsch interpretieren. Deshalb bevorzugt vorwärts korrigieren. Ein konsistenter Backup-Restore setzt zwischenzeitlichen Fortschritt zurück und ist eine gesonderte Entscheidung, kein automatischer Rollback.

## Prüfstand

- 45 Frontend-Vertragstests einschließlich zeitlicher Einsatzregeln und Schutzschild-Punkten erfolgreich.
- 235 isolierte PHP-Integrationsprüfungen einschließlich vollständiger Migrationen, Schema-Snapshot und Wiederholung, drei Lernrunden, automatischer Verfügbarkeit, getrennten Einsatzlimits, Kombination aller drei Fähigkeiten an einer Frage, kompatiblen alten Runden, eingefrorenen Einsätzen, idempotenter Wiederholung, ungültiger Versuchsfolge, aller drei Effekte, Ersatzmangel, kurzen Runden, Astra-Ausschluss, dauerhafter Einsatzhistorie, globaler Freischaltung, Heldenwechsel, Admin-CSRF/Versionierung und Deaktivierung erfolgreich.
- CSS-Build mit Tokenprüfung, BEM-Prüfung, PHP-/JS-Syntax und lokaler Hostinger-Build erfolgreich. Browserprüfung mit flüchtigen API-Testantworten: Profilkarten, gesperrter Lernfortschritt, automatische Verfügbarkeit ohne Auswahl, Admintexte und Heldenzuordnung sowie alle drei Quiz-Effekte geprüft. Simulierter Verbindungsabbruch sperrt Antworten bis zum idempotenten Wiederholungsversuch. Neue Ansichten bei 390 Pixeln ohne horizontalen Überlauf; deaktivierte Aktionen mit zentraler Opazität 0.45. Keine echten Entwicklungsaccounts für Browserfixtures verändert und keine Productionänderung. Emulierte Ansichten ersetzen keine Prüfung auf physischen Geräten.

## Vorgemerkt: Fähigkeiten und Erweiterungen

### Vorschlagsrunde vom 31.10.2026: fünf zusätzliche Fähigkeiten

**Ursprüngliche Konzeptvorschläge:** Scharfblick und Glücksanker sind inzwischen lokal implementiert, siehe aktuelle Regeln oben. **Spurensuche, Dunkler Pakt und Revanche bleiben unverbindlich vorgemerkt und nicht implementiert.** Die ursprünglichen drei Effekte bleiben unverändert. Jeder Held bleibt bei maximal drei Fähigkeiten; ein größerer Katalog bedeutet mehr Auswahl für unterschiedliche Helden, nicht mehr Plätze je Held. Jede erlernte Fähigkeit weiterhin höchstens einmal pro Questrunde.

| Vorschlag | Kurze Erklärung für Spieler | Zeitpunkt und vorgeschlagene Grenzen | Thematisch passende Helden (Beispiele, keine Zuordnung) |
|---|---|---|---|
| **Scharfblick** (bisherige 50/50-Idee) | „Blende vor deiner Antwort zwei falsche Möglichkeiten aus.“ | Vor dem ersten Versuch; nur bei vier Antwortmöglichkeiten. Zwei verbleibende Antworten, normales Zwei-Versuche-Schema. Zur Begrenzung höchstens zwei Punkte für diese Frage. Anders als Heldenblick sofort einsetzbar, dafür begrenzter Punktegewinn. | Anubia, Horus, Kitsu |
| **Spurensuche** (bisheriger Spürsinn/Kompass) | „Entdecke die verborgene Kategorie dieser Frage.“ | Vor dem ersten Versuch; nur in gemischten Themenrunden, deren Fragekategorie sonst nicht sichtbar ist und nicht schon durch eine reine Kategorienauswahl feststeht. Zeigt den Kategorienamen, keinen erfundenen fachlichen Hinweis. Normale Punkte. In Kategorienrunden ausgeblendet. | Horus, Nagero, Professor Blitzbirne |
| **Dunkler Pakt** | „Riskiere deinen zweiten Versuch für zwei zusätzliche Punkte.“ | Vor dem ersten Versuch verbindlich aktivieren. Richtige erste Antwort: reguläre Erstversuchspunkte plus zwei; falsche Antwort: null Punkte, Frage beendet, kein zweiter Versuch. Kein Einsatz nach einer Antwort oder anderer Hilfe an dieser Frage. Zusätzliche Maximalpunkte müssen in Quiz und Ergebnis nachvollziehbar berücksichtigt werden. | Akuma, Morbix, Nefara |
| **Glücksanker** | „Sichere dir einen Trostpunkt, falls auch dein zweiter Versuch falsch ist.“ | Nach dem ersten Fehlversuch, vor dem zweiten. Richtige zweite Antwort: regulär ein Punkt. Falsche zweite Antwort: ein Trostpunkt, aber die Frage bleibt falsch und zählt nicht als richtige Antwort für Belohnungen oder Entdeckersouvenirs. Nicht mit Schutzschild kombinieren. | Amphos, Sir Emmental, Bobo |
| **Revanche** | „Versuche eine endgültig falsch beantwortete Frage am Rundenende noch einmal.“ | Erst verfügbar, sobald eine geeignete, zweimal falsch beantwortete Frage existiert; nicht für übersprungene oder bereits unterstützte Fragen. Eine solche Frage auswählen, am Rundenende genau eine weitere Antwortchance. Bei Erfolg ein Punkt, sonst null. Kein zusätzliches Ergebnis und keine doppelte Frage für Fortschritt. Benötigt eine eigene Wiederholungsphase; ursprüngliche Versuche und Revanche getrennt dokumentieren. | Cassius, Cedric, Bronko |

**Entscheidung:** Scharfblick und Glücksanker zuerst umgesetzt. Dunkler Pakt bleibt vorgemerkt. Spurensuche lohnt sich mit sichtbarer Nutzung gemischter Themenrunden. Revanche erfordert eine zusätzliche Wiederholungsphase samt Auswertung und Fortschrittsregeln. Die folgende Liste offener Entscheidungen gilt nur für die noch nicht implementierten Vorschläge.

Vor Implementierung festzulegen:

- Neue Effekte nicht auf derselben Frage stapeln; genaue Wechselwirkung mit Heldenblick, Schutzschild und Fragewechsel serverseitig definieren. Dies ist ein Vorschlag für die Erweiterung, keine nachträgliche Änderung der aktuellen Kombinationsregeln.
- Jeder Einsatz ist Hilfe und historisch zu markieren, auch Dunkler Pakt. Bedingungen „ohne Hilfe“ dürfen dadurch nicht versehentlich erfüllt werden. Trostpunkte sind niemals richtige Antworten. Bei Revanche vorher entscheiden, ob erfolgreiche Wiederholung zum Entdeckerfortschritt beiträgt; kein Erstversuchserfolg.
- Punkteboni, Höchstpunktzahl und Darstellung im Ergebnis gemeinsam definieren; bestehende Ergebnisse und gestartete Runden nicht umwerten.
- Freischaltschwellen, Motive und endgültige Zuordnung separat festlegen. Keine sofortigen persönlichen Freischaltungen durch bloßes Admin-Zuweisen. Admintexte und Motive bleiben pflegbar, neue Wirkungen weiterhin Entwicklungsarbeit.

| Idee | Wirkung / Motivation | Status und Voraussetzung |
|---|---|---|
| Wissensfunke | Fachlichen Hinweis zur Frage anzeigen | Bewusst zurückgestellt. Benötigt geprüfte Hinweisfelder je Frage; in dieser Phase weder Feld noch Effekt implementiert. |
| Spürsinn / Kompass | Kategorie/Tags einer Themenfrage anzeigen | Nur sinnvoll, wenn diese Information sonst verborgen ist. Noch keine Spiellogik. |
| Zeitblase | Countdown kurz anhalten | Setzt einen künftigen Zeitmodus voraus. |
| 50/50 | Zwei falsche Antworten entfernen | Als Scharfblick lokal implementiert; siehe aktuelle Regeln. |
| Zusätzliche Chance | Weiteren Versuch ermöglichen | Erheblicher Eingriff in die bestehenden zwei Versuche; nur Idee. |
| Neue Lernregeln | Fehler später korrigieren, Städte besuchen, besondere Hero-Leistung | Erst konkrete Schwellen, Hilfenausschlüsse und Heldenbezug definieren. Derzeit nur Rundenanzahl. |
| Fähigkeitenmotive | Low-Poly-Auge/Visier, Kompass, Kristall, Schild, Sanduhr | Noch keine neuen Bilddateien. Mediathekpflege und Bildzuordnung später gestalten. |
| Adminvorschau | Betroffene Accounts bei Regeländerungen vorab anzeigen | Noch nicht implementiert; derzeit Versionsprüfung und Bestätigung der Heldenzuordnung. |

Keine Währung, Käufe, tägliche Pflichtserie oder Zufallsvergabe. Wenige verständliche Hilfen bleiben die Leitidee.

### Admin-Oberfläche: Karten und Dialog

Nur lokale Darstellungsänderung, keine Migration. Auswahlfeld für vorhandene Fähigkeiten steht mit eigenem Abstand über dem Formular; Beschriftungen, Felder und Abschnitte haben klar getrennte Abstände. Die Helden-Auswahlliste und das dauerhaft sichtbare Zuordnungsformular entfallen zugunsten der Bildkarten. Der Dialog nutzt die vorhandene Dialog-/Fokuslogik, bestätigt das Verwerfen ungespeicherter Änderungen bei Abbrechen, Escape oder Hintergrundklick und bleibt bei Speicherfehlern mit den Eingaben offen. Während des Speicherns ist das Schließen gesperrt. Erfolgreiche Speicherung aktualisiert die Karte; Fokus kehrt zur Heldenkarte zurück.

Prüfung: 45 Frontendtests, CSS-/Token- und BEM-Prüfung sowie Build erfolgreich. Browserfixtures prüfen Bild/Name, richtigen Helden-Schreibpayload, aktualisierte Karten, Speichersperre, Fehler mit erhaltenen Eingaben, Verwerfen/Escape und schmale 390-Pixel-Ansicht ohne horizontalen Überlauf. Keine echten Zuordnungen oder Testschwellen geändert.

## Profilbereich vorerst entfernt

23.10.2026: Keine Einbindung des Fähigkeiten-Akkordeons in der Profilseite, kein dortiger Datenabruf und kein Ergebnislink auf das entfernte Ankerziel. Spiellogik, Freischaltungen und Adminzuordnung unverändert; keine Migration erforderlich. Die Beschreibung früherer Browserprüfungen dokumentiert den damaligen Stand, nicht einen aktuell sichtbaren Profilbereich.

## Entscheidungen und Pflege

### Adminstruktur: Helden zuerst (lokal, 31.10.2026)

Der Hauptreiter heißt „Helden“. Zuerst erscheinen die vorhandenen Heldenkarten mit Zuordnungsdialog; darunter ein eigener Abschnitt „Heldenfähigkeiten bearbeiten“ mit Auswahlfeld und unveränderten Eingaben für Name, Beschreibung, Motiv, Aktivierung und Freischaltschwelle. Oben führen „Helden und Zuordnung“ und „Fähigkeiten bearbeiten“ als kleine Sprunglinks zu den beiden Abschnitten. Die Links scrollen nur innerhalb derselben Ansicht; sie lösen keine Verwerfen-Abfrage aus und erhalten ungespeicherte Werte. Schutz beim tatsächlichen Ansichtswechsel bleibt bestehen. Der Mediathek-Untertab „Heldenfähigkeiten“ wird nicht umbenannt. Keine API-/Datenbankänderung.

Geprüft: 48 Frontendtests, JS-Syntax und CSS-/Token-/BEM-Build erfolgreich. Browser bei 320 Pixeln mit simulierten Adminantworten: Reitername, Reihenfolge, vorhandene Heldenkarte und weiterhin öffnender Zuordnungsdialog, Sprungziele sowie Sprung ohne Datenverlust/Verwerfen-Abfrage, kein horizontaler Überlauf. Keine echten Zuordnungen gespeichert; noch nicht veröffentlicht.

### Heldenfähigkeiten über den eigenen Helden öffnen (31.10.2026, lokal)

Die einzelnen Fähigkeits-Icons über den Antworten sind durch eine dezente rahmenlose Aktion mit 28-Pixel-Heldenbild ersetzt. Das beim Rundenstart verfügbare Heldenbild bleibt im Kategorie-Sepiafilter. Sichtbarer Text: „Hilfe · 1 Fähigkeit bereit“, korrekte Mehrzahl; im unklaren Netzwerkzustand „Einsatz prüfen“. Keine Hintergrundfläche, Hover unterstreicht nur „Hilfe“, Tastaturfokus bleibt erhalten. Der Einstieg wird ausschließlich bei aktuell einsetzbaren Fähigkeiten angezeigt. Wenn alle verbraucht sind, die Frage abgeschlossen ist oder eine Voraussetzung fehlt, verschwinden Einstieg und leerer Hinweis vollständig. Ein unbestätigter Einsatz bleibt zur erneuten Prüfung erreichbar; Fehlernachrichten bleiben erhalten. Browserprüfung dieser Zustände und 48 Frontendtests erfolgreich. Im Dialog steht der Heldenname oben als Überschrift und darunter die verfügbare Anzahl in Einzahl/Mehrzahl. Ohne verfügbare Fähigkeit erscheint gegebenenfalls „Gerade keine Fähigkeit einsetzbar“.

Historische Nachprüfung der inzwischen abgelösten Pillenvariante: Mobile 390 Pixel, Einstieg etwa 97 × 44 Pixel, standardmäßig exakter Kategorie-Sepiafilter, bei geöffnetem Dialog `filter: none`, richtiger Heldenname und korrekte Einzahl/Mehrzahl. CSS-/Token-/BEM-Build, JS-Syntax und 48 Frontendtests erfolgreich. Keine Änderung der Einsatzregeln, nur lokal.

Der gemeinsame Standarddialog zeigt nur aktuell einsetzbare Fähigkeiten und bereits in dieser Runde verbrauchte Fähigkeiten. Fehlende Voraussetzungen blenden Karten aus, etwa Heldenblick/Schutzschild vor einem Fehlversuch oder Neues Abenteuer nach einer Antwort beziehungsweise ohne Ersatzfrage. Verbrauchte Karten sind nativ deaktiviert und mit dem vorhandenen Kategorie-Sepiafilter ausgegraut. Sie bleiben im Dialog auch bei späteren Fragen als verbraucht erkennbar. Auswahl einer nutzbaren Karte zeigt die helle lila umrahmte Erklärung; erst „Jetzt einsetzen“ sendet den bisherigen geschützten Einsatz. Nach Erfolg schließt der Dialog, die Wirkung erscheint in der Frage. Keine Änderung von Erwerb, Limits oder Wertung.

Während einer laufenden Anfrage sind Aktionen und Schließen gesperrt. Bei unbestätigtem Netzwerkfehler bleibt der Dialog offen, Antworten bleiben gesperrt, und „Einsatz erneut prüfen“ wiederholt exakt dieselbe Aktionskennung. Andere noch nicht verbrauchte Fähigkeiten werden während dieser Klärung nicht angeboten. Fehler sind im Dialog beziehungsweise nach Schließen am Einstieg sichtbar; Erfolg erzeugt keinen zusätzlichen Fließtext. Abbrechen/Schließen vor Aktivierung verbraucht nichts. Gemeinsame Modal-Fokus- und Schließen-Logik aus `dialog.js`; Oberfläche in `public/js/quiz-abilities.js`.

Prüfung: 48 Frontendtests einschließlich Sichtbarkeitsregeln für Voraussetzungen, Verbrauch und Wiederholung; CSS-/Token-/BEM-Build und JS-Syntax erfolgreich. Browser mit isoliertem Controller und simulierten Antworten bei 390 Pixeln: Einstieg etwa 49 Pixel hoch ohne Überlauf, vor Antwort nur Neues Abenteuer, nach Fehlversuch Heldenblick/Schutzschild, native Speichersperre, ein Aufruf nach Aktivierung, erfolgreicher Shield-Einsatz schließt, verbrauchte Karte gesperrt mit exaktem Sepiafilter. Simulierter Netzwerkausfall hält Dialog und Antwortsperre, erneuter Aufruf mit identischer Aktionskennung schließt nach Erfolg und blendet die falsche Antwort aus. Keine echten Nutzer-/Rundendaten geändert. Nur lokal, keine Migration.

### Historisch: einzelne Fähigkeiten-Icons im Quiz (23.10.2026, inzwischen abgelöst)

Nachbesserung: Icons ohne lila Rahmen und Auswahl-Schatten; Tastaturfokus bleibt erhalten. Nach erfolgreichem Einsatz genügt das deaktivierte gefilterte Icon, der zusätzliche Erfolgstext entfällt. Lade-, Fehler- und Wiederholungsnachrichten bleiben bestehen. Die Erklärung verwendet dieselbe kleine fette lila Überschrift wie die Fähigkeitsbelohnung und oben rechts das vorhandene Quiz-Schließen-X mit rundem rotem Hover. Schließen-Link entfällt. CSS-/BEM-Build, 45 Frontendtests sowie Browserprüfung von Schließen, Überschrift, rahmenlosem Icon und Position erfolgreich; nur lokal.

Die großen Schaltflächen mit dauerhaft sichtbarer Beschreibung sind durch 56-Pixel-Bildschaltflächen ersetzt. Sichtbar sind aktuell nutzbare Fähigkeiten: Neues Abenteuer vor der ersten Antwort mit verfügbarer Ersatzfrage, Heldenblick und Schutzschild nach dem ersten Fehlversuch. In der aktuellen Frage erfolgreich eingesetzte Fähigkeiten bleiben als native deaktivierte Icons mit `--filter-sepia` (identisch zum Kategorie-Hover) sichtbar; bei der nächsten Frage verschwinden sie. Der Fragenwechsel durch Neues Abenteuer zählt zur selben Fragenposition. Fehlgeschlagene oder unbestätigte Einsätze werden nicht als verbraucht markiert. Die Regeln und die serverseitige Prüfung bleiben unverändert.

Hover zeigt Namen und Beschreibung als Tooltip. Klick, Antippen oder Tastatur öffnet eine kleine Erklärung über dem Antwortenbereich; erst „Einmal einsetzen“ aktiviert die Fähigkeit. Das funktioniert auf Touchgeräten ohne Hover und verhindert versehentlichen Verbrauch. Schließen und Escape klappen die Erklärung zu; jeweils nur eine ist offen. Icons haben zugängliche Namen und ein Symbol als Ersatz bei fehlendem/defektem Bild. Während der Anfrage sind Aktionen gesperrt. Bei ungewissem Netzwerkstatus bleibt das betroffene Icon zum erneuten Prüfen derselben Anfrage sichtbar; die Antwortsperre wird nicht umgangen.

Prüfung: 45 Frontendtests, JS-Syntax, CSS-Build, Token- und BEM-Prüfung erfolgreich. Browserfixture bei 390 Pixeln: vor erster Antwort genau ein Icon, nach Fehlversuch zwei; Leistenhöhe 56 Pixel, kein horizontaler Überlauf. Eingesetztes Icon bleibt gesperrt, löst keinen weiteren Klick aus und verwendet exakt den Kategorie-Filter; bei der nächsten Frage verborgen. Erklärung verbraucht keinen Einsatz, Aktivierung und erneute Prüfung senden die richtige Fähigkeit, Escape schließt, laufende Anfrage sperrt den Button. Keine Migration, keine Änderung produktiver Daten; noch nicht veröffentlicht.

### Fähigkeitsmotive (23.10.2026, lokal)

Ergebnisdarstellung: Die Bildgröße stammt direkt aus der gemeinsamen Souvenir-Regel (72 × 72 CSS-Pixel), ohne größere Fähigkeits-Sonderregel. Der Fähigkeitsname nutzt die kleine fette Souvenir-Überschrift, in Großbuchstaben und `--color-difficulty-hero`. Ergebnisflächen, Fähigkeitskarten und die kompakte Fähigkeitserklärung verwenden `--color-hero-surface`; keine neue Farbe. CSS-/Token-/BEM-Build und Browservergleich von Bildgröße, Schrift und Hero-Farben geprüft. Noch nicht veröffentlicht.

Heldenblick, Schutzschild und Neues Abenteuer besitzen eigene transparente Low-Poly-Medaillons. Neue Freischaltungen erscheinen im Ergebnis als einzelne Bildzeilen mit Namen und Beschreibung oberhalb von „Freunde herausfordern“. Ohne Motiv bleibt der Text sichtbar. Keine zusätzliche Profilsektion.

Im Fähigkeiten-Admin stehen Motivwahl aus der Mediathek, Vorschau und Drag-and-drop-Upload bereit. Ein Upload allein ändert die Fähigkeit noch nicht: erst „Fähigkeit speichern“ übernimmt die Auswahl mit Versionsprüfung. Der Mediathek-Reiter „Heldenfähigkeiten“ trennt diese Bilder von Frage-, Profil- und Souvenirbildern; neue Uploads landen unter `images/uploads/abilities/`. Verwendete Motive werden über die versionierte Fähigkeitenbearbeitung gewechselt. Alte Dateien bleiben für laufende Runden und gespeicherte Fähigkeitshistorien geschützt. Freischaltungen und Schwellen ändern sich durch einen Bildwechsel nicht.

Migration `024_ability_images.sql` ergänzt `quiz_abilities.image_url` (nullable VARCHAR(500)) und setzt die drei mitgelieferten Motive einmalig, ohne spätere Adminauswahl oder bewusst entfernte Motive bei erneutem Ausführen zu überschreiben. Lokal nach Datenbanksicherung `.private/before-ability-images-20261023.sql` mit `php database/migrate.php` angewendet. Bestehende Testschwellen und Heldenzuordnungen bleiben erhalten. Beim späteren Deployment Migration und alle drei Dateien unter `public/images/abilities/` gemeinsam ausliefern; Uploadverzeichnis wie bisher erhalten. Keine Seeds auf Bestandsdaten anwenden. Ein Code-Rücksprung kann die additive Spalte stehen lassen; eine Datenbankwiederherstellung würde nach dem Backup erfolgte Änderungen verlieren.

Bilddateien, Stilreferenz und vollständige Imagegen-Prompts: [Bilddokumentation](HELDENFAEHIGKEITEN-BILDER.md). Noch nicht auf Production veröffentlicht.

Prüfung: 45 Frontendtests und 247 isolierte Integrationstests einschließlich Medienklassifizierung, Upload/Austausch, Pfadvalidierung, Versionskonflikt, Bildschutz und Migrationserhalt erfolgreich; PHP-/JS-Syntax, CSS-Build, Token- und BEM-Prüfung erfolgreich. Browserprüfung mit simulierten Adminantworten: Bildvorschau und korrekter Speicherpayload, Ergebnis mit drei geladenen Motiven und ohne doppelte Hinweise, schmale Ansicht ohne horizontalen Überlauf. Keine echten Spielerfortschritte durch Browsertests verändert. Wegwerfdatenbank anschließend gelöscht.

Die frühere Vorauswahl und die Rolle Grundfähigkeit sind abgelöst.

| Datum | Entscheidung / Änderung |
|---|---|
| 23.10.2026 | Ursprünglich drei Gruppen geplant (inzwischen vereinfacht): Grundfähigkeit, erlernbar je Held, global. Erwerb erst im Spiel und Adminpflege gewünscht. |
| 23.10.2026 | Neue Regel: maximal drei Fähigkeiten je Held, jede einmal pro Runde ohne Vorauswahl. Grundfähigkeit entfällt. Mehrere Einsätze und Kombinationen werden serverseitig historisiert und validiert. |
| 23.10.2026 | Admin auf Bearbeitung vorhandener Definitionen begrenzt; Anlage auch im Backend gesperrt. Repertoire und Grundfähigkeit erklärt. Gespeicherte Testschwellen bleiben unverändert. |
| 23.10.2026 | Wissensfunke vertagt, Neues Abenteuer in erste Version aufgenommen. Heldenblick/Schutzschild/Fragewechsel, zunächst ein Platz und ein Einsatz umgesetzt, inzwischen durch Nutzung jeder erlernten Fähigkeit einmal je Runde ersetzt. |

Bei jeder Fähigkeit Effekt, Bindung, Freischaltregel, Limits, Wertung, Adminfelder, Migration, Prüfungen und tatsächliche Veröffentlichung aktuell halten. Abgelöste Vorschläge nicht als geltende Regeln stehen lassen.
