Nächstes Deployment:


------------------------------------------------



SEO:
- Interne Verlinkung im flietext
- Bilder in WebP + sinnvolle Groessen.
- Sitemap, auch für Bilder
- lighthouse testing
    - minify CSS/JS
    - webP verwenden

---------------------- Florenz ----------------------

Essen
- Bistecca alla Fiorentina
- Lampredotto
- Panzanella
- Crostini di Fegato
- Ribollita
- Schiacciata alla Fiorentina
- Pappardelle Cinghiale
- Crespelle alla Fiorentina
- Zuccotto

Themen:
- Piazza della Signoria

- Uffizien
- Galleria dell'Accademia
- Basilica di Santa Croce
- Palazzo Pitti
- Piazzale Michelangelo
- Basilica San Miniato al Monte
- Mercato Centrale: Markthalle Florenz
- kulinarisches Essen
- Piazza del Duomo


Frage-Ideen:
- Loggia dei Lanzi
- Via dei Calzaiuoli
- Basilika Santa Maria Novella
- Palazzo Medici Riccardi
- Piazza del Duomo
-----------------------------------------------------

Pen-Test durchführen


Ideen ChatGPT:
- end-zu-ent-Tests, Test
- Dramaturgie pro Frage: Kurzer “Intro‑Teaser” je Kategorie/Tag (1 Satz) und kleine  “Streak‑Hinweise” bei mehreren richtigen Antworten in Folge.
- Progress‑Gefuehl: Visueller Fortschrittsbalken + mini‑Milestones (“Frage 5/15 – Halbzeit!”) und sanfte Uebergaenge zwischen Fragen.
- Motivation: Badges/Meilensteine (z.B. “Fehlerfrei”, “Hero‑Master”, “Zweiter Versuch gerettet”).
- Persona‑Modus: “Speed‑Run”, “Entspannt”, “Nur Hero‑Fragen”, “Mit/ohne Zeitlimit”.
- Quiz‑Resume: Nach Abschluss eine kleine Zusammenfassung der staerksten und schwachen Themen (basierend auf Tags/Kategorien).
- Teilen/Export: Ergebnis als Karte/Screenshot (clientseitig) oder kurzer Text‑Share.
- Mini‑Storyline: Jede richtige Antwort schaltet ein “Kapitel” frei (z.B. kurze Fakten‑Karten).
- “Leben”‑System: 3 Herzen pro Run, Fehler kosten Herzen, schafft Spannung.
    - Power‑ups: 50/50, Frage ueberspringen, “Eine Antwort eliminieren”.
    - Hint‑System: Einmal pro Frage einen Tipp nutzen (kostet Punkte).
    - Unterschiedliche Helden/Bösewichte mit unterschielichen "Jokern"
- Themen‑Pfad: User waehlen einen Lernpfad (z.B. “Rom – Geschichte”), Fragen in dramaturgischer Reihenfolge.
- Statistik‑Profil: “Deine Top‑Themen”, “Schwaechste Themen”, Verlauf ueber Zeit.
- “Letzte Chance”‑Frage: Bonusfrage am Ende, wertet Gesamtergebnis auf.
- Optische Variation: Je Kategorie eigenes Farbschema/Background.

-Optional: Fortschrittsspeicherung: Score/Position per localStorage sichern, damit ein Reload nicht den Run zerstört (kann man mit einer kleinen Version-ID koppeln).

----------------------------------------
Ideen:

- Auswählbare Schwierigkeitslevel

Aktuelle news auf Startseite
- user kann news schließen --> soll gemerkt werden
- "Neue Fragen zu Rom" oder "Noch kein Account. Hier gets lang"

-----
Code-/Architektur-Schritte:


Admin-Audit-Log
Tabelle quiz_admin_log: Wer hat wann welche Frage geändert/gelöscht? Sehr nützlich, wenn später viel Content entsteht.

Soft Delete statt hart löschen
Fragen/Kategorien nicht löschen, sondern deleted_at setzen. Dann kannst du Fehler rückgängig machen.


Automatisierte Health-Checks nach Deploy
GitHub Action prüft nach STRATO-Deploy automatisch:
https://quiz-hero.de/, API, Admin-Login-Endpoint, Sitemap.

-----
Admin-Bereich: sehr hoher Nutzen:


Tag-Verwaltung im Admin
Tags aktuell eher Seed/JSON-lastig. Später: Tags anlegen, Icons wählen, aktivieren/deaktivieren.

Bulk-Editor
Mehrere Fragen markieren: Kategorie ändern, Tag hinzufügen, aktiv/deaktiv setzen.

Qualitätsstatus pro Frage
Felder wie draft, review, published, needs_source, verified.

Quellenfeld pro Frage
source_url, source_title, verified_at. Gut für Qualität, SEO und Vertrauen.

KI-Assistent im Admin
Button: „3 falsche Antworten vorschlagen“, „Erklärung vereinfachen“, „SEO-Text für Kategorie generieren“. Immer mit manueller Freigabe.

-----


User-Account & Motivation

Persistenter Spieler-Account light
Erstmal ohne E-Mail: Name + Avatar + Token. Später optional E-Mail/Magic Link.

Fortschritt pro Kategorie
„Rom: 18/60 Fragen gemeistert“, „Beste Punktzahl“, „zuletzt gespielt“.

Badges/Achievements
Beispiele: „Antike-Experte“, „Rom-Kenner“, „10 richtige Antworten in Folge“, „Hero-Frage beim ersten Versuch“.

Profilseite
Öffentliche oder private Statistik: Punkte, Kategorien, Badges, letzte Quizrunden.

spätere Features:
    - quiz_user_settings - Für Einstellungen wie Sprache, Sound an/aus, Animationen reduziert, Newsletter nein/ja, Theme.

    - quiz_user_stats - Aggregierte Werte: total_runs, total_questions_answered, total_correct, best_streak, favorite_category_id, last_played_at.

    - quiz_user_category_stats - Statistik pro Kategorie: Kategorie, gespielte Fragen, richtige Antworten, beste Serie, letzter Versuch.

    - quiz_user_badges - Freigeschaltete Badges/Easter Eggs:
    Badge-Key, erhalten am, Quelle.

    - quiz_user_progress - Für Story/Kapitel/Milestones:
    progress_key, unlocked_at, value.



-----
Quiz-Ideen:

Quiz-Modi
- Klassisch: aktuelle Variante
- Zeitmodus: 10 Fragen gegen die Uhr
- Survival: Spiel endet beim zweiten Fehler
- Lernmodus: Antwort + Erklärung sofort
- Bildquiz: nur Bildfragen
- Hero-Modus: nur schwere Fragen

Duell-Modus light
Ein User erstellt Link: „Schlag meine 42 Punkte im Rom-Quiz“.

Erklärkarten nach jeder Runde
Am Ende: „Das hast du gelernt“ mit kurzen Fakten.

Frage des Tages
Startseite bekommt eine täglich wechselnde Frage. Gut für Engagement und SEO-Snippets.

-----
Website/UX:

Startseite stärker als App-Dashboard
Oben: „Weiterspielen“, „Tägliche Challenge“, „Beliebte Kategorien“, „Neue Fragen“.

Bessere Mobile-UX
Sticky Fortschritt/Punkte, größere Antwortflächen, reduzierte vertikale Sprünge.

Kategorie-Seiten schöner machen
Jede Kategorie bekommt ein echtes Intro: Bild, Schwierigkeit, Anzahl Fragen, Themen, Startbutton.

Nach Quiz-Ende bessere Aktionen„Nochmal spielen“
„Schwieriger machen“
„Ähnliche Kategorie“
„Teile dein Ergebnis“

Avatar-System
- Avatare freischalten

-----
SEO:
MyS
QL-SEO vollständig ausbauen
Hast du jetzt begonnen. Nächster Schritt: SEO-Export mit source, updated_at, questionCount, lastModified.

Landingpage pro Tag
Beispiele:/pages/tag-antike.html
/pages/tag-architektur.html
/pages/tag-essen.html

Fragen-Landingpages
Für starke Fragen eigene Seiten:
/fragen/wie-viele-eingaenge-hatte-das-kolosseum.html

Strukturierte Daten erweitern
- FAQPage
- BreadcrumbList
- Quiz/LearningResource als Schema.org-nahe Auszeichnung

Interne Verlinkung automatisieren
Kategorie Rom verlinkt zu Antike, Architektur, Florenz, Neapel usw.

Sitemap aufteilen
Später: sitemap-pages.xml, sitemap-questions.xml, sitemap-tags.xml.

-----
GEO / KI-Suchmaschinen:

Antwortblöcke mit Kurzantwort + Erklärung
Jede SEO-Frage sollte enthalten:
„Kurzantwort: …“
„Erklärung: …“
„Quelle/Einordnung: …“

Thematische Übersichtsseiten
„Römische Bauwerke im Überblick“, „Florenz Renaissance Quiz“, „Italienische Sehenswürdigkeiten Quiz“.

Quellen und Aktualität sichtbar machen
„Zuletzt geprüft am …“ erhöht Vertrauen.

Saubere HTML-Struktur
H1/H2/H3 logisch, Frage als H3, Antwort direkt darunter.

llms.txt später prüfen
Eine Datei für KI-Crawler mit wichtigen Seiten und Projektbeschreibung könnte sinnvoll werden.

-----
PWA / Service Worker:

App installierbar machen: „Quiz-Hero zum Homescreen hinzufügen“.

Offline-Fallback: Startseite, letzte geladene Kategorien, Logo, CSS/JS offline verfügbar.

Cache-Strategie
- App-Shell: index.html, CSS, JS, Fonts mit Cache-Version.
- Bilder: Cache-first, aber begrenzt.
- API: network-first, Fallback auf JSON/letzte Daten.

Wichtig: Service Worker sauber mit dem bestehenden Asset-Versioning koppeln, sonst entstehen Cache-Probleme.

-----
Bilder in WebP:

Aktuell sind viele PNG/JPG-Bilder vorhanden. WebP würde Ladezeit und Lighthouse verbessern.

Gute Strategie:
- Originale behalten.
- WebP-Versionen generieren.
- Im HTML/JS bevorzugt WebP laden, fallback auf PNG/JPG.

Für Quizbilder besonders sinnvoll, weil viele große Bilder ausgeliefert werden.

Später optional: AVIF für moderne Browser.

Admin-Idee: Bild-Galerie zeigt Dateigröße und ob WebP vorhanden ist.

-----

Lighthouse Testing:
- ...

-----
Sinnvolle Tests:

PHP:
- API gibt gültiges JSON aus.
- Admin ohne Login bekommt 401.
- Admin mit falschem CSRF bekommt 403.
- seo-export ohne Token bekommt 403.
- seo-export mit Token liefert Kategorien.

JavaScript:
- Validatoren für Kategorien/Fragen.
- QuizState: Punkte, Streaks, Auswahl, Shuffle, Ergebnisse.
- UserService: Nicht-JSON/HTTP-Fehler werden korrekt behandelt.

E2E:
- Startseite lädt.
- Kategorie auswählen.
- Quiz spielen.
- User einloggen.
- Ergebnis speichern.
- Admin Login + Frage speichern.

SEO:
- pages/*.html enthalten Canonical, H1, FAQPage JSON-LD.
- sitemap.xml enthält alle Landingpages.

----- 
Mini-Stories / Kontextualisierung:

Das ist inhaltlich stark. Statt nackter Fragen:
„Im Jahr 64 n. Chr. brannte Rom nieder. Viele Gerüchte rankten sich um die Rolle des Kaisers. Welcher Kaiser regierte damals?“
Datenmodell-Idee:
- intro_teaser
- question
- answers_json
- background_knowledge

-----
UX:
- Teaser klein oberhalb der Frage.
- Frage bleibt klar darunter.
- Bei Hero-Fragen etwas dramatischer, aber nicht zu lang.

-----
Dramaturgie pro Kategorie/Tag:

Vor dem Start:
„Du reist durch das antike Rom: Bauwerke, Kaiser, Mythen und Macht.“
Für Tags:
- Antike: „Von Kaisern, Tempeln und steinernen Spuren.“
- Essen: „Kleine Spezialitätenreise durch Geschmack und Geschichte.“
- Architektur: „Fassaden, Formen und Bauwerke mit Geschichten.“
Das gibt dem Quiz mehr Atmosphäre und hilft auch SEO/GEO.

-----
Streak-Hinweise:

Bei mehreren richtigen Antworten:
- 2er-Streak: „Du kommst in Fahrt.“
- 3er-Streak: „Starke Serie.“
- 5er-Streak: „Quiz-Hero-Modus aktiviert.“
- Hero-Frage richtig beim ersten Versuch: Spezialeffekt/Badge.

Technisch:
- streak im QuizState
- Feedback abhängig von Streak und Schwierigkeit
- kleine Animation neben Score

-----
Progress-Gefühl:

Sehr sinnvoll. Aktuell sieht man Frage x/y, aber ein Balken wirkt stärker.

Features:
- Fortschrittsbalken
- Mini-Milestones bei 25/50/75/100 %
- kleine Zwischenmeldung:„Erster Abschnitt geschafft“
- „Halbzeit“
- „Finale Frage“

Das macht Runs runder und erhöht Completion Rate.

-----
Sanfter Übergang zwischen Fragen:

- Antwort wird bestätigt.
- Erklärung erscheint.
- Button „Weiter“.
- Beim Weiterklicken: kurzer Fade/Slide.
- Keine wilden Animationen, eher ruhig und hochwertig.

Das fühlt sich direkt moderner an.

-----
Teilen / Export:

Nach Ergebnis:
- Text-Share: „Ich habe 42/50 Punkte im Rom-Quiz auf Quiz-Hero erreicht.“
- Web Share API auf Mobile.
- Fallback: Text kopieren.
- Später Screenshot-Karte clientseitig:
    - Logo
    - Kategorie
    - Punkte
    - Badge
    - URL
- Das wäre sehr gut für organische Verbreitung.

-----
Mini-Storyline / Kapitel:

Pro Kategorie eine kleine Reise:
- Rom:
    - Arena & Macht
    - Forum & Politik
    - Brunnen & Barock
    - Alltag & Essen
- Jede richtige Antwort füllt ein Kapitel.
- Am Ende:
    - „Du hast 3 von 4 Kapiteln freigeschaltet.“

Das macht aus einem Quiz eine kleine Lernreise.

-----
Themen-Pfad:

Statt nur Kategorien:
- „Antike entdecken“
- „Italienische Städte“
- „Architektur-Reise“
- „Essen & Alltag“

Ein Pfad kombiniert Fragen aus mehreren Kategorien und Tags. Sehr gut für Wiederkehrer und SEO.

-----
Leben-System

- 3 Herzen pro Run:
- falsche Antwort verliert Herz
- zweiter Versuch optional ohne Herzverlust oder mit halbem Malus
- bei 0 Herzen: Run beendet oder „Rettungsfrage“

Das eignet sich besonders für Survival-Modus. Für Standardmodus optional.

-----
Fakten-Karten:
Nach richtiger Antwort oder am Ende:
„- Wusstest du schon?“
- kurzer Fakt
- Bild
- Quelle/Einordnung

Sehr gut für Lernen, GEO und längere Verweildauer.

-----
Statistik-Profil:

Profilseite:
- Top-Themen
- letzte Runs
- beste Kategorie
- Streak-Rekord
- Hero-Fragen korrekt
- „Du bist besonders stark in: Architektur“
- „Übe nochmal: Renaissance“

Das macht User-Accounts sinnvoller.

-----
Easter Eggs:

Seltene Spezialfragen:
- 1-3 % Chance
- extra Badge
- besondere Animation
- Bonuspunkt oder Sammlerobjekt
- z. B. „Geheime Rom-Frage“

Wichtig: nicht zu verspielt, eher als kleine Überraschung.

-----
Chance-Frage / Bonusfrage:

Am Ende:
- Wenn Score knapp ist: „Bonusfrage: +3 Punkte möglich“
- Oder bei perfektem Lauf: „Hero-Bonusfrage freigeschaltet“
- Erhöht Spannung und Abschlussgefühl.

-----
Ideen-Ausarbetung

Ich würde diese drei Ideen verbinden: **Dein Reisepass zeigt, was du entdeckt hast. Souvenirs machen Fortschritt sichtbar. Geteilte Reisen laden andere zum Mitspielen ein.** So entsteht ein zusammenhängendes Erlebnis.

### 3. Die Heldenseite als persönlicher Reisepass

Die aktuelle Profilseite bietet vor allem Kontoeinstellungen. Der Reisepass würde sie zum persönlichen Ausgangspunkt machen.

**So könnte sie aufgebaut sein:**

| Bereich | Inhalt |
|---|---|
| Dein nächstes Abenteuer | Eine passende Empfehlung: letzte Stadt weiterspielen oder eine neue entdecken |
| Deine Städte | Karten für Rom, Florenz usw. mit nachvollziehbarem Fortschritt |
| Letzte Reisen | Gespielte Runden mit Datum, Ergebnis und Wiederholen-Aktion |
| Deine Sammlung | Erhaltene Souvenirs und erreichbare nächste Ziele |
| Einstellungen | Name, Avatar und Zugangsdaten als zurückhaltender Nebenbereich |

Eine Stadtkarte könnte beispielsweise zeigen:

> **Rom**  
> 18 unterschiedliche Fragen beim ersten Versuch gelöst  
> 3 Themen entdeckt · zuletzt gestern gespielt  
> **Rom weiter entdecken**

Dabei würde ich **„gespielt“, „richtig beantwortet“ und „gemeistert“ unterscheiden**. Ein einzelner Glückstreffer sollte noch nicht als dauerhaft gelernt gelten.

Für den Anfang reichen zwei klare Werte:

- **Entdeckt:** unterschiedliche Fragen, die du abgeschlossen hast.
- **Sicher beantwortet:** unterschiedliche Fragen, die beim ersten Versuch richtig waren.

„Dauerhaft gemeistert“ könnten wir später ergänzen, wenn erfolgreiche Wiederholungen an verschiedenen Tagen erfasst werden.

**Wichtig bei neuen Fragen:** Der Fortschritt darf sich nicht wie ein Rückschritt anfühlen. Statt „Dein Rom-Fortschritt ist von 80 auf 60 Prozent gefallen“ lieber:

> Du hast bereits 40 Fragen entdeckt. In Rom warten 12 neue auf dich.

#### Technische Umsetzung

Den **Ergebnisverlauf können wir weitgehend mit vorhandenen Daten** bauen. Gespeicherte Runden enthalten bereits Kategorie, Punkte, Maximalpunkte, gelöste Fragen und Zeitpunkt. Dazu käme ein geschützter API-Endpunkt wie:

`account-journey`

Dieser liefert ausschließlich Daten des angemeldeten Benutzers. Seine Benutzer-ID wird aus der Sitzung bestimmt, nicht aus einem frei übergebenen Parameter.

Für dauerhaften Fortschritt pro Frage brauchen wir zusätzliche Daten. Die bisherigen Ergebnis-Summen reichen dafür nicht.

Ich würde eine Tabelle für abgeschlossene Antworten ergänzen, beispielsweise:

```text
quiz_result_answers
- result_id
- question_id
- question_revision
- attempt_count
- correct_on_first_attempt
- solved
- skipped
```

Die Auswertung entsteht **serverseitig beim Speichern einer Runde**. Der Server kennt bereits den eingefrorenen Fragenstand und prüft die Antworten. Damit muss der Browser keine vertrauenswürdigen Statistikwerte liefern.

Ein eindeutiger Schlüssel auf `result_id + question_id` verhindert doppelte Einträge bei erneutem Absenden.

Daraus lassen sich zunächst die Statistiken berechnen. Eine zusätzliche Statistik-Tabelle würde ich erst anlegen, wenn die Abfragen tatsächlich zu langsam werden.

**Grenzen und Sonderfälle:**

- Alte Ergebnisse bleiben im Verlauf sichtbar. Fehlende Antwortdetails werden nicht nachträglich erfunden.
- Wesentlich überarbeitete Fragen brauchen eine fachliche Revision, damit früherer Fortschritt richtig eingeordnet wird.
- Kleine Rechtschreibkorrekturen sollten keine Lernerfolge zurücksetzen.
- Gelöschte Fragen dürfen historische Ergebnisse nicht kaputtmachen.
- Der Reisepass ist standardmäßig privat.

**Meine Empfehlung:** Zuerst den Verlauf und schöne Stadtkarten bauen. Danach die genauere Fortschrittsmessung ergänzen.

### 5. Souvenirs: eine Sammlung mit Persönlichkeit

Hier sehe ich viel Potenzial, gerade weil Quiz-Hero einen eigenen Bildstil besitzt.

Ich würde keine Flut aus generischen Medaillen wie „100 Klicks geschafft“ anbieten. **Ein Souvenir sollte zu einer Stadt passen und eine kleine Geschichte erzählen.**

Unverbindliche Motive:

- **Rom:** eine kleine Reisemarke oder ein stilisiertes Stadt-Souvenir.
- **Florenz:** ein Skizzenbuch mit Renaissance-Anmutung.
- **Neapel:** eine illustrierte Postkarte.
- **Amalfiküste:** eine Keramikkachel.

Die genaue Motivwahl könnten wir später passend zum vorhandenen Stil entwickeln.

**Drei Möglichkeiten der Darstellung:**

| Variante | Wirkung | Meine Einschätzung |
|---|---|---|
| Reisestempel | Kompakt, gut in Stadtkarten integrierbar | Idealer Einstieg |
| Souvenirkarte | Größeres Motiv mit kurzer Beschreibung | Besonders schön für eine Sammlung |
| Avatar-Rahmen | Als persönliche Auszeichnung nutzbar | Gute spätere Ergänzung |

Zum Start würde ich **pro Stadt einen Stempel und eine besondere Souvenirkarte** vorsehen. Mehr braucht es zunächst nicht.

#### Wie verdient man sie?

Die Ziele sollten transparent und mit unterschiedlichen Spielgewohnheiten erreichbar sein.

Beispielsweise:

- **Erster Besuch:** erste abgeschlossene Runde in einer Stadt.
- **Entdecker-Souvenir:** eine festgelegte Anzahl unterschiedlicher Fragen gespielt und mehrere Themen entdeckt.

Die konkreten Schwellen müssen wir am tatsächlichen Fragenbestand ausrichten. Eine kleine Kategorie darf nicht dieselben Anforderungen erhalten wie Rom mit deutlich mehr Fragen.

Ich würde **keine perfekte Runde verlangen**, um das wichtigste Stadt-Souvenir zu erhalten. Das würde schwächere Spieler unnötig ausschließen. Eine besondere Auszeichnung für fehlerfreie Runden kann später zusätzlich kommen.

Beim Freischalten reicht ein kurzer, schöner Moment:

> **Ein Stück Florenz gehört jetzt zu deiner Sammlung.**  
> Dein neues Souvenir wartet im Reisepass.

Keine große Unterbrechung mitten im Quiz. Die Auszeichnung erscheint im Ergebnis und lässt sich dort näher ansehen.

#### Technische Umsetzung

Die Definitionen können zunächst als versionierte Konfiguration im Repository liegen:

```text
souvenir_id
category_id
title
description
asset
rule_type
rule_version
thresholds
```

Die vergebenen Auszeichnungen gehören dagegen in die Datenbank:

```text
quiz_user_souvenirs
- user_id
- souvenir_id
- awarded_at
- rule_version
- source_result_id
```

Ein eindeutiger Schlüssel auf `user_id + souvenir_id` verhindert doppelte Vergaben.

Die Prüfung läuft nach einer erfolgreich gespeicherten Runde auf dem Server. Das Ergebnis kann direkt enthalten, welche Souvenirs neu hinzugekommen sind.

**Für eine faire Sammlung würde ich festlegen:**

- Bereits erhaltene Souvenirs bleiben bestehen, wenn später neue Fragen hinzukommen.
- Eine Wiederholung derselben fünf Fragen zählt nicht als fünf neue Entdeckungen.
- Auszeichnungen werden bei einem erneuten Speicherversuch nicht nochmals vergeben.
- Nach Einführung können wir bestehende Ergebnisse berücksichtigen, soweit deren Daten die jeweilige Bedingung zuverlässig belegen.
- Neue Souvenirs lassen sich hinzufügen, ohne alte Regeln unbemerkt zu verändern.

#### Ergänzung: Reisepass-Meilensteine und Souvenirs als gemeinsames Feature

**Meilenstein und Souvenir gehören zusammen:** Der Meilenstein ist die erreichte Bedingung, das Souvenir die persönliche Belohnung dafür. Dafür brauchen wir keine zwei getrennten Systeme.

**Vorschlag für den Einstieg: zwei Souvenirs pro Kategorie.**

| Souvenir | Bedingung | Darstellung |
|---|---|---|
| Erster Besuch | Erste Runde der Kategorie beendet | Kleiner Reisestempel |
| Entdecker | Eine festgelegte Anzahl unterschiedlicher Fragen tatsächlich beantwortet | Besondere Souvenirkarte im Stil der Kategorie |

Die Fragenanzahl wird am jeweiligen Bestand ausgerichtet. Wiederholungen derselben Frage erhöhen den Entdecker-Fortschritt nicht; übersprungene Fragen zählen nicht als tatsächlich beantwortet. Das wichtigste Souvenir verlangt kein perfektes Ergebnis: Auch wer Fehler macht und dazulernt, soll seine Sammlung aufbauen können.

Die Motive bleiben ortsbezogen und persönlich: beispielsweise eine Reisemarke für Rom, ein Skizzenbuch für Florenz und eine Keramikkachel für die Amalfiküste. Allgemeine Auszeichnungen wie „Erste Hero-Frage gelöst“ werden zunächst zurückgestellt.

**Darstellung im Reisepass:** Unter „Deine Quiz-Reisen“ könnte eine kompakte Sammlung „Deine Souvenirs“ erscheinen. Erhaltene Motive werden farbig dargestellt; bei noch offenen Souvenirs sieht man das nächste konkrete Ziel, zum Beispiel:

> **Dein Rom-Souvenir**  
> Noch 4 unterschiedliche Fragen entdecken.

Beim Freischalten erscheint im Ergebnismodul ein kleiner Hinweis:

> **Ein Stück Rom gehört jetzt zu deiner Sammlung.**

Kein zusätzliches Pflichtfenster und keine Unterbrechung mitten im Quiz.

**Technische Grundlage:** Die vorhandenen Rundenergebnisse belegen den ersten Besuch. Die inzwischen ergänzten einzelnen Frageergebnisse ermöglichen das Zählen unterschiedlicher tatsächlich beantworteter Fragen. Alte Ergebnisse ohne Einzelantworten können hierfür nicht nachträglich als Entdecker-Fortschritt angenommen werden.

Die oben skizzierte Tabelle `quiz_user_souvenirs` hält erhaltene Souvenirs mit Nutzer, Vergabezeitpunkt, Regelversion und auslösendem Ergebnis fest. Die Vergabe erfolgt serverseitig und nur einmal. Erhaltene Souvenirs bleiben bestehen, wenn später neue Fragen hinzukommen. Regeldefinitionen werden versioniert; neue Regeln verändern bereits verdiente Auszeichnungen nicht stillschweigend.

**Empfohlener Einstieg:** Ortsbezogene Reisestempel und Souvenirkarten umsetzen, bevor weitere allgemeine Auszeichnungen hinzukommen. So erhält der Reisepass mehr Persönlichkeit, ohne mit zusätzlichen Belohnungssystemen überladen zu werden.

### 6. Teilen, Herausforderungen und Freunde

Hier würde ich drei Ausbaustufen unterscheiden. So können wir früh etwas Schönes veröffentlichen, ohne sofort ein vollständiges soziales Netzwerk bauen zu müssen.

#### Stufe A: Ergebnis über WhatsApp oder Social Media teilen

Nach der Runde erscheint **„Ergebnis teilen“**.

Der Inhalt könnte so aussehen:

> Rom erkundet: 38 von 50 Punkten.  
> Wie gut kennst du die Ewige Stadt?  
> Spiel mit auf Quiz-Hero.

Dazu eine visuelle Karte mit:

- Stadtbild oder Illustration,
- Ergebnis,
- Quiz-Hero-Logo,
- optional einem erhaltenen Souvenir,
- einem Link.

**Technisch würde ich zwei Wege anbieten:**

1. Die native Teilen-Funktion des Geräts, wenn der Browser sie unterstützt.
2. Als zuverlässige Alternative „Link kopieren“ und „Bild herunterladen“.

Welche Apps im Teilen-Menü erscheinen und ob Bilddateien direkt übergeben werden können, hängt vom Gerät und Browser ab. Für WhatsApp ist ein zusätzlicher Link zum Teilen von Text und URL denkbar. Für bildorientierte Plattformen bleibt die herunterladbare Karte eine gute Alternative.

Die Bildkarte können wir mit HTML-Canvas erzeugen. Dafür verwenden wir eigene, lokal verfügbare Bilder und Fonts. **Ein externer Bilddienst oder eine kostenpflichtige API ist dafür nicht nötig.**

Der Anzeigename sollte freiwillig sein; E-Mail-Adresse und Kontodaten gehören nie auf die Karte.

Ein einfacher Start wäre ein Link zur jeweiligen Kategorie. Dann ist das Teilen öffentlich möglich, ohne persönliche Ergebnisse auf dem Server öffentlich zugänglich zu machen.

#### Stufe B: „Spiel genau meine Runde“

Das ist die spannendere Erweiterung:

> **Ich habe 38 Punkte geschafft. Schlägst du mich in genau diesen fünf Fragen?**

Der Link öffnet eine kleine Herausforderungsseite. Dort stehen Kategorie, Umfang und das zu schlagende Ergebnis. Danach beginnt die Runde.

Entscheidend ist, was „dieselbe Runde“ bedeutet:

- dieselben Fragen und Schwierigkeiten,
- dieselbe fachliche Version,
- dieselben Regeln und dieselbe Maximalpunktzahl,
- möglichst dieselbe Reihenfolge.

Die Antwortoptionen können unterschiedlich angeordnet sein, solange die Zuordnung korrekt bleibt.

**Technisch brauchen wir dafür einen eigenen Challenge-Datensatz.** Die normalen Runden werden derzeit nicht unbegrenzt aufbewahrt; eine geteilte Herausforderung sollte deshalb nicht nur auf deren flüchtige ID verweisen.

Beispiel:

```text
quiz_challenges
- id
- public_token
- creator_user_id
- source_result_id
- question_snapshot
- rules_version
- expires_at
- revoked_at
```

Der öffentliche Link enthält einen langen, zufälligen Token. Er veröffentlicht weder eine interne Benutzer-ID noch Sitzungsdaten.

Die Herausforderung sollte sich bewusst erstellen, befristen und zurückziehen lassen. Wenn eine enthaltene Frage fachlich gesperrt wird, müssen wir entscheiden, ob die Herausforderung ebenfalls pausiert wird.

**Eine ehrliche Grenze:** Unsere Lösungen sind im Lernmodus öffentlich verfügbar. Herausforderungen sind deshalb ein freundlicher Vergleich, kein betrugssicherer Wettbewerb. Dafür passt die Funktion sehr gut; eine globale „beste Spieler“-Rangliste wäre damit weniger glaubwürdig.

Gäste könnten eine Herausforderung sofort spielen. Wer das Ergebnis dauerhaft speichern oder eine private Gegeneinladung schicken möchte, legt anschließend einen Account an.

#### Stufe C: Freunde innerhalb von Quiz-Hero einladen

Das würde ich zunächst als **kleinen privaten Freundeskreis** bauen.

Im Profil gäbe es:

- „Freunde“,
- „Einladungen“,
- „Offene Herausforderungen“.

Nach einer Runde:

> **Freund herausfordern**  
> Wähle jemanden aus deinem Freundeskreis.

Die andere Person sieht bei ihrem nächsten Besuch eine Einladung:

> Matze fordert dich zu fünf Fragen über Rom heraus.

Erst nach dem eigenen Abschluss werden die Ergebnisse nebeneinander dargestellt. Vorher keine Antworten oder detaillierten Lösungsinformationen zeigen.

**So würde ich Freunde hinzufügen lassen:**

- über einen persönlichen Einladungslink,
- alternativ über einen eindeutigen, freiwillig gewählten Spielernamen,
- immer mit Annahme durch die andere Person.

Eine Suche nach E-Mail-Adressen würde ich nicht öffentlich anbieten. So verraten wir nicht, wer ein Konto besitzt. Auch ein Adressbuch-Upload ist für dieses Projekt unnötig.

Technisch kämen Beziehungen und Einladungen hinzu:

```text
quiz_friendships
- requester_id
- recipient_id
- status
- created_at
- accepted_at
```

Dazu Challenge-Einladungen mit Empfänger und Status. Der Server prüft bei jeder Aktion, ob der angemeldete Benutzer sie ausführen darf.

Von Anfang an gehören dazu:

- Einladungen ablehnen und Freunde entfernen,
- Personen blockieren,
- begrenzte Anzahl offener Anfragen,
- Schutz gegen wiederholte Belästigung,
- eindeutige Regeln für gelöschte Accounts.

**Ich würde zunächst auf Chat, Kommentare und automatische Einladungs-Mails verzichten.** Eine interne Benachrichtigung reicht für den ersten Freundeskreis. E-Mail-Hinweise können später freiwillig hinzukommen.

### Meine empfohlene Reihenfolge

| Schritt | Ergebnis | Aufwand |
|---|---|---|
| 1 | Reisepass mit vorhandenen Ergebnissen und Stadtkarten | Mittel |
| 2 | Ergebnis teilen: Text, Link und Bildkarte | Klein bis mittel |
| 3 | Dauerhafter Fragenfortschritt und erste Stadt-Souvenirs | Mittel bis größer |
| 4 | Herausforderung mit identischem Fragenset | Größer |
| 5 | Private Freundeskreise und interne Einladungen | Größer, auch im laufenden Betrieb |

**Mein Favorit für den ersten sichtbaren Ausbau:** Reisepass plus Teilen-Karte. Das schafft sofort mehr Persönlichkeit und einen nachvollziehbaren Account-Nutzen. Anschließend bekommen die Stadtkarten echte Fortschrittswerte und Souvenirs.

Vor Änderungen am Datenmodell würde ich wieder eine getrennte Stage-Umgebung herstellen. Diese Ausarbeitung bleibt hier im Chat; `hinweise.md` bleibt unverändert.


## Quizwelten: Ideen für später (23.10.2026)

Vorgemerkt, noch nicht umgesetzt:

- **Visuelle Einstiege in Quizwelten:** Karten mit Bild und kurzer Beschreibung, etwa Italien, Kunst oder Weltgeschichte. Die öffentliche Filterung bleibt vorerst ausgeblendet; Gestaltung und Navigation werden separat ausgearbeitet.
- **Weltenübergreifende Meilensteine:** Belohnungen für Entdeckungen in mehreren Quizwelten. Fragen behalten ihre stabile ID und dürfen durch Mehrfachzuordnungen nicht mehrfach zum Fragenfortschritt zählen. Schwellen und Regeln legen wir vor der Umsetzung fest.
