ToDos:
- categories.json / data/questions-*.json --> sinnvolle Tags per ChatGPT ergänzen
- nach oben scrollen

- css: in mehreren css -files modulen aufteilen
- generierte files /page brauchen eigentlich nicht commited werden
- nur fragen mit  "verifiedFinal": true sollen angezeigt werden

Agent:
- "Richtige Antwort" --> Arry-Index soll random sein!

SEO:
- Interne Verlinkung im flietext
- Bilder in WebP + sinnvolle Groessen.
- Sitemap, auch für Bilder
- lighthouse testing
    - minify CSS/JS
    - webP verwenden

---------------------- Florenz ----------------------
Bildideen:
- David
- Palazzo Vecchio - Medici
- Basilika Santa Maria Novella
- Palazzo Pitti
- Die Geburt der Venus
- Basilika Santa Croce
- Niccolò Machiavelli
- Piazza del Duomo
- Perseus mit dem Haupt der Medusa
- Loggia dei Lanzi
- Bartolomeo Ammannat
- Uffizien
- Primavera von Botticelli
- Verkündigung von Leonardo da Vinci
- „Tondo Doni“ - Michelangelo
- „Madonna del Cardellino“ - Raphael
- „Bacchus“ - Caravaggio
- „Medusa“ - Caravaggio
- „Venus von Urbino“ - Titian
- „Flora“ - Titian
- Madonna mit dem Stieglitz - Raphael
- Die Anbetung der Könige - Leonardo da Vinci
- Girolamo Savonarola
- Herkules und Cacus von Baccio Bandinelli
- Galleria dell'Accademia
- „Prigioni“ oder „Gefangenen“ - Michelangelo
- Basilica di Santa Croce

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


florenz.json
- tags anpassen

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
- Vasari-Korridor (paar Fragen schon drin)
- Loggia dei Lanzi
- Via dei Calzaiuoli
- Basilika Santa Maria Novella
- Palazzo Medici Riccardi
- Piazza del Duomo
-----------------------------------------------------

Ideen ChatGPT:
- Kontextualisierung durch Mini-Stories
    Für hero-Fragen kurze Einbettung: „Im Jahr 64 n. Chr. brannte Rom nieder – welcher Kaiser…?“
- end-zu-ent-Tests, Test
- Datenbank: Aufwand, sinvoll?
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
- Easter Eggs: Seltene Spezialfragen mit extra Animation/Badge.
- Optische Variation: Je Kategorie eigenes Farbschema/Background.
- Feedback-Funktion für User pro Frage: "Fehler bei der Frage/Antwort" an Admin

-Optional: Fortschrittsspeicherung: Score/Position per localStorage sichern, damit ein Reload nicht den Run zerstört (kann man mit einer kleinen Version-ID koppeln).

----------------------------------------
Ideen:

-----
Code-/Architektur-Schritte:

Migration-System für Datenbankänderungen
Statt nur schema.sql: database/migrations/001_...sql, 002_...sql. Damit weißt du sauber, welche DB-Änderungen produktiv eingespielt wurden.

Admin-Audit-Log
Tabelle quiz_admin_log: Wer hat wann welche Frage geändert/gelöscht? Sehr nützlich, wenn später viel Content entsteht.

Soft Delete statt hart löschen
Fragen/Kategorien nicht löschen, sondern deleted_at setzen. Dann kannst du Fehler rückgängig machen.

API-Versionierung
Z. B. /api/index.php?action=public-data&v=1. Hilft, wenn Frontend und Backend später größer werden.

Automatisierte Health-Checks nach Deploy
GitHub Action prüft nach STRATO-Deploy automatisch:
https://quiz-hero.de/, API, Admin-Login-Endpoint, Sitemap.

-----
Admin-Bereich: sehr hoher Nutzen:

Fragen-Vorschau direkt im Admin
Beim Bearbeiten sieht der Admin rechts sofort, wie die Frage später im Quiz aussieht.

Bild-Auswahl aus vorhandenen Assets
Statt Bildpfad manuell eintippen: kleine Galerie aus images/, Suchfeld, Vorschau, „Bild übernehmen“.

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
Statt nur Profilbild-URL: kleine vorgefertigte Quiz-Hero-Avatare.

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
Feedback-Funktion pro Frage:

Sehr wichtig für Qualität.

Button nach Antwort:
„Fehler melden“

Optionen:
- antwort falsch
- Frage unklar
- Bild passt nicht
- Rechtschreibung
- Quelle fehlt
- Sonstiges

Admin sieht Feedback gesammelt:
- Frage
- Meldungstyp
- Kommentar
- Zeitpunkt
- User optional
- Status: offen/geprüft/erledigt

Das ist eine der besten Erweiterungen für Content-Qualität.