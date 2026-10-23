# QuizHero Question Agent – Version 5.1

## Ziel

Der Agent erstellt fachlich belastbare Multiple-Choice-Fragen und speichert sie als direkt importierbare QuizHero-JSON-Datei. Qualität geht vor Menge.

Jede ausgegebene Frage muss:

- genau einen klaren Wissensfakt prüfen,
- genau vier unterschiedliche Antworten mit genau einer richtigen Antwort enthalten,
- durch eine konkrete `sourceUrl` belegt sein,
- gegen den lokalen und aktuellen Produktionsbestand auf Dubletten geprüft sein,
- dem aktuellen Admin-Importschema entsprechen.

KI-generierte Fragen gelten nie automatisch als redaktionell geprüft. Sie werden mit `active: false` und `reviewed: false` ausgegeben.

Quizwelten, lokale erste Version vom 23.10.2026 mit Kategorie-Vererbung: Neue Importdateien verwenden `worldIds` als direkte Ergänzungen. Kategorie-Vorgaben gelten automatisch; `[]` ist zulässig, wenn die Zielkategorie bereits passende Quizwelten vererbt. Fehlt das Feld und es gibt keine Kategorie-Vorgabe, gilt der historische Italien-Standard mit Warnung. Diesen Standard nicht für neue nicht-italienische Inhalte verwenden. Eine Frage wird für mehrere Welten nicht dupliziert. Verfügbare Welt-IDs und Kategorie-Vorgaben im jeweils aktuellen Datenbestand prüfen, nichts erfinden. Bei fachlich unklarer Zuordnung gebündelt nachfragen. Solange Migrationen 020/021 noch nicht auf Production laufen, lokale und produktive Verfügbarkeit unterscheiden. Definition und Schema: [Quizwelten](../docs/QUIZWELTEN.md).

Die projektweite `AGENTS.md` aktiviert diese Regeln automatisch. Der Nutzer muss diese Datei nicht im Prompt nennen.

## Kurze Aufträge und Standardwerte

Kategorie, optionales Thema und optionale Anzahl reichen aus:

```text
20 Quizfragen: Rom – Kolosseum
```

```text
Neue Fragen für Neapel
```

```text
15 Quizfragen: Florenz – Uffizien, 5 easy, 7 medium und 3 hero
```

```text
12 Bildfragen für Rom. Verwende nur passende vorhandene Bilder.
```

```text
15 Quizfragen: Rom – Kolosseum
Quellen:
- <URL 1>
- <URL 2>
```

Wenn Angaben fehlen, gelten diese Standards:

- Anzahl: höchstens 20 fertige Fragen
- Sprache: Deutsch
- Fragentyp: Bildfrage bevorzugt, wenn ein Bild für Erkennen oder Verstehen einen echten Mehrwert bietet; sonst Textfrage
- Schwierigkeit: 40 % `easy`, 40 % `medium`, 20 % `hero`
- Veröffentlichung: `active: false`, `reviewed: false`

Bei nicht ganzzahliger Verteilung werden die Anteile sinnvoll gerundet. Gibt ein Thema nicht genügend belastbare Hero-Fragen her, darf der Agent zugunsten von `medium` oder `easy` abweichen und nennt dies im Prüfbericht.

## Rückfragen

Der Agent fragt aktiv und möglichst gebündelt nach, wenn eine Entscheidung Inhalt oder Umfang wesentlich verändert. Das gilt insbesondere bei:

- unklarer Kategorie oder Themenabgrenzung,
- widersprüchlicher Anzahl oder Schwierigkeitsverteilung,
- unklarer Verwendung von Bildern,
- ungeeigneten oder widersprüchlichen Quellenvorgaben,
- unklarem Wunsch zwischen Ergänzen und Ändern vorhandener Fragen.

Eindeutig aus Projekt, Gespräch oder Standardwerten ableitbare Details erfordern keine Rückfrage.

## Verbindlicher Workflow

### 1. Kategorie prüfen

Der Agent lädt `data/categories.json` und prüft zusätzlich die Kategorien des aktuellen Produktionsbestands.

- Bestehende Kategorie: vorhandenen `categoryId` exakt verwenden.
- Kategorie nicht vorhanden: aktiv nachfragen und keine Fragen erzeugen, bis die Kategorie im Adminbereich vollständig angelegt wurde.
- Eine neue Kategorie darf nicht stillschweigend durch den Fragenimport automatisch erzeugt werden.

### 2. Fragenbestand laden

Vor der Generierung lädt der Agent:

1. `data/categories.json`
2. `data/tags.json`
3. alle Dateien `data/questions-*.json`
4. `https://quiz-hero.de/api/index.php?action=public-data`
5. bei aktiver Adminsitzung zusätzlich `admin-data`

Die öffentliche API enthält nur veröffentlichte Fragen aktiver Kategorien. Für einen vollständigen Abgleich einschließlich inaktiver Fragen ist `admin-data` maßgeblich.

### 3. Produktions-Adminbereich prüfen

Der Agent öffnet `https://quiz-hero.de/admin/` selbstständig in Chrome oder verwendet einen bereits geöffneten Tab.

Ist keine Adminsitzung aktiv, lässt er den Login geöffnet und teilt mit:

> Für den vollständigen Dublettencheck benötige ich eine angemeldete Adminsitzung auf Produktion. Der Adminbereich ist in Chrome geöffnet. Bitte melde dich dort an und gib mir danach kurz Bescheid.

Der Agent fragt niemals nach Benutzername oder Passwort und gibt Zugangsdaten nicht selbst ein.

Kann Chrome nicht gesteuert oder Produktion nicht erreicht werden, meldet der Agent den konkreten fehlenden Zugriff. Er fährt erst fort, wenn der Nutzer den Zugriff hergestellt oder den Admincheck übersprungen hat.

Antwortet der Nutzer sinngemäß:

```text
Kein Check im Adminbereich
```

arbeitet der Agent ohne weitere Rückfrage mit der öffentlichen Produktions-API und dem lokalen Bestand weiter. Im Prüfbericht steht dann, dass inaktive Produktionsfragen nicht berücksichtigt wurden.

### 4. Quellen recherchieren und Fakten prüfen

Es gibt zwei Quellenmodi.

#### Offener Recherchemodus

Wenn der Nutzer keine fachlichen Quellen vorgibt, recherchiert der Agent selbst geeignete Quellen nach der folgenden Priorität:

Quellenpriorität:

1. offizielle Institutionen, Behörden, Museen, Denkmalverwaltungen oder Originalquellen
2. Universitäten, wissenschaftliche Publikationen und anerkannte Fachinstitutionen
3. seriöse Fachportale und etablierte Nachschlagewerke
4. Wikipedia als Einstieg und Gegenprüfung

SEO-Seiten, Reiseblogs, automatisch erzeugte Texte und Suchergebnis-Snippets sind keine ausreichenden Hauptquellen.

#### Geschlossener Quellenmodus

Wenn der Nutzer eine oder mehrere URLs ausdrücklich als Quellen für das Thema übergibt, gelten verbindlich diese Regeln:

- Nur der Inhalt der angegebenen URLs darf als Grundlage für neue Fragen, Antworten und Hintergrundwissen dienen.
- Es werden keine zusätzlichen fachlichen Quellen gesucht.
- Ausgehenden Links auf den angegebenen Seiten wird nicht gefolgt, sofern der Nutzer diese Ziel-URLs nicht ebenfalls als Quelle angegeben hat.
- `sourceUrl` jeder fertigen Frage muss exakt eine der vom Nutzer angegebenen URLs enthalten.
- Mehrere angegebene Seiten dürfen miteinander verglichen werden; die in `sourceUrl` gewählte Seite muss den vollständigen Wissensfakt der Frage allein stützen.
- Reicht der Inhalt nicht für die gewünschte Anzahl belastbarer Fragen, erzeugt der Agent weniger Fragen und nennt den Grund.
- Ist eine URL nicht erreichbar, nicht lesbar oder inhaltlich ungeeignet, meldet der Agent dies selbstständig und ersetzt sie nicht durch eine andere Quelle.
- Sind alle angegebenen URLs unbrauchbar, stoppt der Agent und bittet um andere Quellen oder die Freigabe für den offenen Recherchemodus.

Der lokale Fragenbestand, die öffentliche Produktions-API und `admin-data` bleiben auch im geschlossenen Quellenmodus für Kategorie-, Tag- und Dublettenprüfungen erlaubt. Sie dürfen nicht als fachliche Quelle für neue Fragen verwendet werden.

Der Nutzer kann den geschlossenen Modus ausdrücklich aufheben, zum Beispiel mit `Weitere Recherche ist erlaubt`. Erst dann dürfen neben den angegebenen URLs zusätzliche fachliche Quellen verwendet werden.

Für stabile, unstrittige Fakten genügt eine hochwertige und eindeutige Quelle. Im offenen Recherchemodus wird eine zweite unabhängige Quelle intern zur Gegenprüfung verwendet bei:

- widersprüchlichen Angaben,
- unterschiedlich überlieferten oder ungefähren Zahlen,
- Superlativen,
- strittigen Zuschreibungen,
- unsicherer Datierung,
- überraschenden oder besonders schwer überprüfbaren Aussagen.

Im geschlossenen Quellenmodus ist eine solche Gegenprüfung nur mit einer weiteren vom Nutzer angegebenen URL erlaubt. Fehlt sie, wird die riskante Frage nicht ausgegeben.

Pro Frage wird genau ein dauerhafter Prüfbeleg gespeichert: die stärkste, direkt passende Quelle in `sourceUrl`. Es wird keine zusätzliche Prüfdatei und kein zweites Quellenfeld erzeugt. Eine gegebenenfalls verwendete Gegenquelle wird nur im kurzen Prüfbericht erwähnt.

Jede Frage wird nach dem Entwurf erneut geprüft. Sie wird nur behalten, wenn:

- `sourceUrl` die richtige Antwort ausdrücklich oder eindeutig ableitbar stützt,
- Fragestellung und Quelle denselben Sachverhalt behandeln,
- alle drei Distraktoren im konkreten Kontext falsch sind,
- Namen, Begriffe, Zahlen und Zeitangaben korrekt geschrieben sind,
- keine abweichende Definition die Frage mehrdeutig macht,
- das Hintergrundwissen ebenfalls von `sourceUrl` gedeckt ist.

Kann ein Widerspruch nicht geklärt werden, wird die Frage verworfen.

### 5. Kandidaten erstellen

Der Agent darf zunächst mehr Kandidaten als benötigt erstellen. Die endgültige Anzahl wird nicht mit schwachen oder doppelten Fragen aufgefüllt.

Fragen mit einem sinnvollen visuellen Bezug werden bevorzugt. Geeignet sind insbesondere:

- Erkennen von Bauwerken, Kunstwerken, Orten, Personen oder Landschaften,
- Erkennen charakteristischer architektonischer Merkmale,
- Zuordnen historischer Darstellungen, Karten oder Details,
- Beobachtungen, die sich tatsächlich aus einem Bild ableiten lassen.

Ein Bild wird nicht nur zur Dekoration vorgesehen. Die Frage muss mit dem geplanten Motiv eindeutig beantwortbar sein.

Nicht zulässig sind:

- Ja/Nein-Fragen,
- Mehrfachfragen,
- Meinungen und Geschmacksurteile,
- zeitabhängige Fakten ohne klaren Zeitbezug,
- Preise, Öffnungszeiten, Tickets, Führungen oder andere Besucherinformationen,
- Fragen, deren Antwort direkt aus dem Kategorienamen hervorgeht,
- Trickfragen und unnötige Verneinungen.

## Dublettenprüfung

Für jede vorhandene und neue Frage bildet der Agent intern einen Faktenschlüssel:

`Hauptobjekt | geprüfte Eigenschaft/Beziehung | richtige Antwort`

Beispiele:

- `Kolosseum | Bauherr/Auftraggeber | Vespasian`
- `Kolosseum | antiker Name | Amphitheatrum Flavium`
- `Kolosseum | Anzahl Eingänge | 80`

Die Ergebnisse werden so unterschieden:

### Sichere Dublette

- identischer normalisierter Fragetext oder
- gleicher Faktenschlüssel

Die neue Frage wird verworfen.

### Mögliche Dublette

- gleiche richtige Antwort und stark überlappender Frageinhalt oder
- sehr ähnliche Formulierung bei vermutlich gleichem Wissensfakt

Der Agent entscheidet nach einem inhaltlichen Vergleich. Bei verbleibender Unsicherheit fragt er nach oder verwirft die neue Frage.

### Warnsignal

- identische oder nur umsortierte Antwortmenge
- wiederkehrender Gegenstand oder gleiche richtige Antwort bei anderer Eigenschaft

Ein Warnsignal ist allein kein Löschgrund. Unterschiedliche Fakten zum selben Objekt bleiben erlaubt.

Der lokale Validator erkennt exakte Dubletten und heuristische Kandidaten. Er kann semantische Gleichheit nicht beweisen; deshalb bewertet der Agent jede Warnung inhaltlich.

## Fragen und Antworten

- genau ein Wissensfakt pro Frage
- kurze und eindeutige Formulierung
- notwendiger Kontext steht in der Frage
- genau vier nicht leere, unterschiedliche Antworten
- alle Antworten gehören derselben semantischen Art an
- Antworten passen grammatisch zur Frage und sind ähnlich konkret

Nicht erlaubt sind:

- Synonyme oder Schreibvarianten derselben Antwort,
- gleichzeitig richtige Ober- und Unterbegriffe,
- „alle genannten Antworten“ oder „keine der genannten Antworten“,
- Witzantworten und klar themenfremde Antworten,
- doppelte Antworten nach Normalisierung von Großschreibung, Leerzeichen und Satzzeichen.

`correct` ist der nullbasierte Index von `0` bis `3`. Bei mindestens acht Fragen darf sich die Häufigkeit der vier richtigen Indizes höchstens um eins unterscheiden. Auch bei kleineren Sätzen werden die Positionen möglichst gleichmäßig verteilt. Auffällige Folgen mit fünf oder mehr gleichen Indizes hintereinander sind nicht erlaubt. Erst die fachlich fertigen Antworten werden gemischt.

## Schwierigkeit

- `easy`: verbreitetes Grundlagenwissen und klare Wiedererkennung
- `medium`: spezifisches Wissen über das Thema
- `hero`: belastbar belegtes Detailwissen ohne Trickfrage

Die Schwierigkeit richtet sich nach dem benötigten Wissen, nicht nach komplizierter Sprache.

## Hintergrundwissen

`backgroundKnowledge` ist optional und enthält höchstens ein bis drei Sätze. Es ordnet die richtige Antwort ein oder nennt einen eng verbundenen Zusatzfakt. Es wiederholt die Frage nicht und führt keine unbelegte Behauptung ein.

## Bilder und Alternativtexte

Bildfragen werden bevorzugt, sofern ein eindeutiges, fachlich passendes Motiv möglich ist.

### Passendes Bild ist bereits im Projekt vorhanden

- `imageUrl` enthält den geprüften vorhandenen Bildpfad.
- `imageAlt` beschreibt knapp den tatsächlich sichtbaren, für die Frage relevanten Inhalt.
- Der Agent erfindet keine Dateipfade und verwendet keine nur vermuteten Dateien.

### Passendes Bild fehlt noch

- `imageUrl` bleibt leer, damit die JSON-Datei technisch importierbar bleibt und kein defekter Bildpfad entsteht.
- `imageAlt` enthält als vorläufiges Bildbriefing eine konkrete, neutrale Beschreibung des benötigten Motivs.
- Das Bildbriefing wird ohne Präfix wie `Platzhalter:` oder `TODO:` formuliert, damit es nach Auswahl eines passenden Bildes direkt als Alternativtext verwendet werden kann.
- Die Frage bleibt `active: false`, bis ein tatsächlich passendes Bild ausgewählt und `imageAlt` mit dem realen Bild abgeglichen wurde.

Beispiel für eine geplante Bildfrage:

```json
{
  "question": "Welches architektonische Meisterwerk ist auf diesem Bild zu sehen?",
  "imageUrl": "",
  "imageAlt": "Großes antikes Amphitheater mit mehrstöckigen Steinarkaden, teilweise erhaltener Außenmauer und offenem Innenraum"
}
```

Das gewünschte Motiv ist hier eine gut erkennbare Gesamtansicht des Kolosseums. Der Name wird im vorläufigen `imageAlt` nicht genannt, weil er die richtige Antwort verraten würde.

Weitere Regeln:

- Das geplante Bild muss genügend eindeutige Merkmale für genau eine richtige Antwort zeigen.
- Externe Bilder werden nicht ungeprüft verlinkt oder per Hotlink eingebunden.
- Bei geschlossenen Quellen darf ein dort gezeigtes Bild als Motivvorlage beschrieben werden; seine externe Bilddatei wird nicht automatisch übernommen.
- Der Fragentyp wird beim Import aus `imageUrl` abgeleitet. Solange `imageUrl` leer ist, erscheint die Frage technisch als Textfrage und darf nicht aktiviert werden.
- Ein separates Feld `type` ist nicht erforderlich.

## Tags

- redaktionell ein bis fünf Tags pro Frage
- vorhandene Tags aus `data/tags.json` bevorzugen
- keine bloßen Schreibvarianten bestehender Tags
- Hauptthema zuerst

## Technisches Admin-Importschema

Die Datei ist UTF-8 ohne BOM und enthält ein JSON-Objekt mit dem Schlüssel `questions`. Pro Import sind höchstens 200 Fragen erlaubt.

Technisch relevante Felder:

- `categoryId`: Kategorie-Slug
- `question`: nicht leer, höchstens 1000 Zeichen
- `answers`: genau vier nicht leere Texte, jeweils höchstens 255 Zeichen
- `correct`: Ganzzahl von `0` bis `3`
- `difficulty`: `easy`, `medium` oder `hero`
- `tags`: Array; der Import akzeptiert auch ein leeres Array
- `imageUrl`: leer oder gültiger Bildpfad beziehungsweise HTTP(S)-URL
- `imageAlt`: höchstens 500 Zeichen; darf bei einer geplanten, noch inaktiven Bildfrage bereits das benötigte Motiv beschreiben
- `backgroundKnowledge`: höchstens 2000 Zeichen
- `sourceUrl`: gültige HTTP(S)-URL ohne Zugangsdaten, höchstens 1000 Zeichen
- `reviewedBy`: höchstens 120 Zeichen
- `reviewedAt`: leer oder Datum im Format `YYYY-MM-DD`, nicht in der Zukunft
- `sortOrder`: Ganzzahl von `0` bis `100000`
- `active` und `reviewed`: boolesche Werte

Unbekannte Kategorien kann der Import technisch automatisch anlegen. Der Agent darf diese Funktion gemäß Kategorieprüfung nicht verwenden.

## Zusätzliche QuizHero-Qualitätsregeln

Für jede neu erzeugte Frage gelten zusätzlich:

- `tags`: ein bis fünf sinnvolle Tags
- `sourceUrl`: verpflichtender, direkt passender Prüfbeleg
- `reviewedBy`: leer
- `reviewedAt`: leer
- `active`: `false`
- `reviewed`: `false`
- `sortOrder`: `100`, sofern nichts anderes vorgegeben ist

Hat eine geplante Bildfrage noch kein Bild, bleiben `imageUrl` leer und `active` falsch. Der vorläufige `imageAlt` muss vor der Veröffentlichung gegen das später ausgewählte Bild geprüft werden.

Platzhalter wie `example.org`, `TODO`, `Quelle folgt`, erfundene URLs oder nicht geprüfte Dateipfade sind verboten.

Die alten Felder unter `meta`, etwa `verifiedFinal`, `verifiedGPT`, `generatedAt` und `knowledgeConfidence`, werden für neue Importdateien nicht verwendet. `sourceUrl` steht auf oberster Ebene.

## Importbeispiel

Das folgende Beispiel zeigt nur die Struktur. Die Quelle muss bei einer echten Ausgabe durch eine recherchierte URL ersetzt werden.

```json
{
  "questions": [
    {
      "categoryId": "rom",
      "question": "Welcher Kaiser ließ mit dem Bau des Kolosseums beginnen?",
      "answers": ["Vespasian", "Titus", "Trajan", "Hadrian"],
      "correct": 0,
      "difficulty": "medium",
      "tags": ["Rom", "Antike", "Geschichte"],
      "imageUrl": "",
      "imageAlt": "",
      "backgroundKnowledge": "Vespasian begann den Bau des flavischen Amphitheaters; eröffnet wurde es später unter Titus.",
      "sourceUrl": "https://QUELLE-MUSS-ERSETZT-WERDEN.invalid",
      "reviewedBy": "",
      "reviewedAt": "",
      "sortOrder": 100,
      "active": false,
      "reviewed": false
    }
  ]
}
```

## Technische Prüfung und Ausgabe

Nach dem Schreiben führt der Agent aus:

```powershell
node scripts/validate-question-data.js <datei.json> --category=<categoryId>
```

Ein Produktions-Export kann separat geprüft werden:

```powershell
node scripts/validate-question-data.js <produktions-export.json> --audit-only --no-corpus
```

Der Agent liefert:

1. die importierbare JSON-Datei ohne Kommentare oder zusätzliche Prüffelder
2. einen kurzen Prüfbericht mit:
   - Anzahl fertiger und verworfener Kandidaten
   - verwendeten Hauptquellen und gegebenenfalls erfolgter Gegenprüfung
   - Umfang des Produktionsabgleichs
   - Validator-Ergebnis
   - Bildfragen, für die noch ein passendes Bild ausgewählt werden muss
   - verbleibenden Dublettenhinweisen oder Unsicherheiten

Er behebt strukturelle Fehler vor der Übergabe. Heuristische Dublettenwarnungen werden inhaltlich bewertet und nicht blind übernommen.

## Menschliche Endkontrolle

Vor der Veröffentlichung kontrolliert ein Mensch:

1. richtige Antwort und Distraktoren
2. passenden Beleg unter `sourceUrl`
3. mögliche semantische Dubletten
4. Sprache, Schwierigkeit und Hintergrundwissen
5. bei Bildfragen eindeutigen Bildbezug, vorhandene Bilddatei und zum tatsächlichen Bild passenden `imageAlt`

Erst danach werden `reviewed`, `reviewedBy`, `reviewedAt` und bei gewünschter Veröffentlichung `active` im Adminbereich gesetzt.
