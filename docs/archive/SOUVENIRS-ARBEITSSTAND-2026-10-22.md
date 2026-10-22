# Historisches Arbeitsprotokoll Souvenirs

Archiviert am 22.10.2026. Diese unveränderte Arbeitsfassung enthält überholte Regeln und widersprüchliche Zwischenstände. Sie ist keine aktuelle Spezifikation. Gültiger Stand: [Souvenir.md](../../Souvenir.md). Alte relative Links sind gegebenenfalls vom Projektstamm aus aufzulösen.

---

# Souvenirs, Meilensteine und Belohnungen

## Aktuelle Bedingungen auf einen Blick

Prüfung der Entdecker-Regel Version 2: 174 isolierte Integrationstests und 32 Frontendtests erfolgreich. Abgedeckt sind falsche Antworten ohne Fortschritt, richtige Antworten im ersten und zweiten Versuch, Überspringen, Wiederholungen, spätere Korrektur einer zuvor falschen Frage, Kategorienzuordnung und einmalige Vergabe. PHP-/JS-Syntax erfolgreich; echte Accountdaten wurden nicht zurückgesetzt.

**Entdecker-Regel Version 2, 22.10.2026 (lokal):** Fortschritt und neue Vergaben zählen ausschliesslich unterschiedliche Fragen mit serverseitigem Ergebnis `first_try` oder `second_try`. Eine zuvor falsche Frage kann durch späteres richtiges Lösen einmalig zum Fortschritt beitragen. Bestehende Einzelantworten werden bei jedem Abruf nach der neuen Regel ausgewertet; offene Fortschritte können dadurch sinken. Bereits vergebene Stücke werden nicht entzogen und behalten ihre Definition. Keine Datenbankmigration oder Löschung vorhandener Daten. Reisestempel und Astra-Regel bleiben unverändert. Frühere Texte zur Zählung falscher Antworten beschreiben Version 1 und gelten nicht mehr.

**Reisepass, aktualisiert am 22.10.2026:** Die komplette Souvenir-Sektion einschließlich der bisherigen Drei-Stücke-Vorschau entfällt im Reisepass. Die Sammlung wird ausschließlich auf `souvenirs.html` angezeigt und bleibt über das Kontomenü erreichbar. Frühere Beschreibungen der Reisepass-Vorschau sind damit überholt. Vergaben und Ergebnishinweise bleiben unverändert.

**Ergänzung vom 22.10.2026:** Noch nicht abgeschlossene Entdecker-Souvenirs haben zusätzlich einen leicht grauen Kartenhintergrund. Der vorhandene Sepia-Bildfilter bleibt erhalten; abgeschlossene Stücke behalten den normalen Hintergrund und ihr farbiges Motiv. Nur die Fortschrittskarten sind betroffen.

**Darstellung, aktualisiert am 22.10.2026:** Die Souvenir-Seite beginnt direkt mit „Deine Souvenirs“; zusätzlicher Einleitungstext und Gesamtzähler darüber entfallen. Je Kategorie steht der Reisestempel links und die zugehörige Reisemarke rechts. Nicht begonnene Marken bleiben weiterhin verborgen; der Platz bleibt frei. Auf schmalen Ansichten folgen die Karten untereinander, Stempel vor Marke. Begonnene Marken verwenden exakt `--filter-sepia`, denselben Effekt wie Kategorie-Bilder und Logo beim Hover (Sepia, kein Graustufenfilter). Erst erhaltene Marken erscheinen ungefiltert. Diese Darstellung ersetzt die nachfolgenden älteren Beschreibungen „grau“. Die Reisepass-Vorschau bleibt unverändert.

**Stand: 22. Oktober 2026 – lokal umgesetzt, noch nicht auf Production veröffentlicht.** Diese Übersicht beschreibt die aktuell implementierten Regeln. Bei jeder Änderung an Vergabe, Zielwerten, Verfügbarkeit oder Darstellung wird sie im selben Arbeitsschritt aktualisiert und mit dem tatsächlichen Veröffentlichungsstand abgeglichen.

| Stück / Belohnung | Wann erhält man es? | Wann sieht der Nutzer es? |
|---|---|---|
| **Reisestempel** | Erste beendete Kategorie- oder kategorienbezogene Übungsrunde mit mindestens einer tatsächlich beantworteten Frage. Eine richtige Antwort ist nicht erforderlich; ausschließlich übersprungene Fragen genügen nicht. Derzeit für Rom, Neapel und Florenz definiert. | Erst nach Vergabe in der Sammlung, direkt farbig. Keine Vorschau auf noch nicht erhaltene Reisestempel. |
| **Entdecker-Souvenir / Reisemarke** | Kategorienbesuch wie beim Reisestempel plus genügend **unterschiedliche richtig beantwortete Fragen (erster oder zweiter Versuch)** dieser Kategorie: **Rom 20, Neapel 5, Florenz 20**. Falsche Antworten zählen, übersprungene nicht; Wiederholungen derselben Frage erhöhen den Zähler nicht. Antworten aus Themenrunden können zum Fragenfortschritt beitragen, ersetzen aber den Kategorienbesuch nicht. | Bereits ab der ersten richtig gelösten Frage als begonnenes Souvenir mit Sepia-Motiv, aktuellem Zähler und Fortschrittsbalken. Nach Erfüllung und Vergabe farbig mit vollem Balken. Noch nicht begonnene Entdecker-Souvenirs bleiben verborgen; keine eigene Sektion „Deine nächsten Ziele“. |
| **Freigeschaltetes Profilbild (derzeit Astra)** | Mindestens eine **Hero-Frage im ersten Versuch richtig beantworten** und die Runde abschließen und erfolgreich speichern. Kategorie-, Themen- und Übungsrunden zählen. Zweiter Versuch, falsche oder übersprungene Antwort genügen nicht. Die aktive Belohnungsregel muss dem Profilbild zugeordnet sein. | Vor Freischaltung verborgen. Danach in der Profilbildauswahl im Konto; beim Abschluss erscheint „Neue Heldenbelohnung“ / „Neues Profilbild freigeschaltet“. Das aktuelle Profilbild wird nicht automatisch ersetzt. |
| **Frei verfügbares Profilbild** | Keine Leistung oder Freischaltung erforderlich; im Admin als frei und aktiv eingestellt. | Sofort in Registrierung und Profilbildauswahl im Konto. Dies ist keine verdiente Belohnung. |

Die persönlichen Vergaben gelten für angemeldete Accounts und werden serverseitig dauerhaft und einmalig gespeichert. Neue Souvenirvergaben erfordern eine aktive Definition und aktive Kategorie. Nachweisbarer Altfortschritt kann beim Abgleich ergänzt werden; fehlende historische Einzelantworten werden nicht geschätzt. Für Profilbild-Belohnungen zählen gespeicherter Hero-Schwierigkeitsgrad und bestätigtes Erstversuch-Ergebnis.

Deaktivierte Profilbilder verschwinden aus der Auswahl; ihre Freischaltung bleibt erhalten. Gelöschte Profilbilder verlieren auch ihre Freischaltungen. Betroffene aktuelle Profilbildwahlen fallen jeweils auf den Standardhelden zurück. Bei Reaktivierung wird eine frühere Auswahl nicht automatisch wiederhergestellt. Die Adminoption „Später festlegen“ vergibt noch keine Belohnung automatisch.

Im Reisepass bleibt die Vorschau auf die drei neuesten **erhaltenen** Souvenirs beschränkt und ist ohne erhaltene Stücke verborgen. Begonnene Entdecker-Souvenirs stehen ausschließlich auf der Souvenir-Seite.

Diese Datei ist die zentrale, fortlaufend gepflegte Arbeitsübersicht für das Feature. Sie sammelt besprochene Ideen, Regeln, offene Entscheidungen und den tatsächlichen Umsetzungsstand. Die persönliche Sammlung [hinweise.md](hinweise.md) bleibt unverändert.

## Status und Pflege

**Version 1 ist lokal implementiert, noch nicht auf Production veröffentlicht.** Rom erhält den Reisestempel nach der ersten beendeten Kategorie-/Übungsrunde mit mindestens einer tatsächlichen Antwort und das Entdecker-Souvenir nach 20 unterschiedlichen richtig beantworteten Rom-Fragen plus Kategorienbesuch. Falsche und übersprungene Antworten zählen nicht. Die übrigen Ideen bleiben Vorschläge, sofern sie unten nicht ausdrücklich als umgesetzt markiert sind.

Die lokale Datenbank ist auf Migration `018_avatar_lifecycle.sql` (einschließlich 014 bis 017). Production wurde nicht verändert. Vor einem späteren Deployment müssen diese additiven Migrationen dort nach Sicherung ausdrücklich angewendet werden; ein normaler Push führt sie nicht automatisch aus.

Statuswerte: **Vorhanden**, **Vorschlag**, **Beschlossen**, **In Umsetzung**, **Lokal umgesetzt**, **Veröffentlicht**, **Zurückgestellt**. Eine besprochene Idee gilt nicht automatisch als beschlossen.

Bei Änderungen diese Datei aktualisieren: Regel und Status, lokale Prüfung, gegebenenfalls Migration und tatsächlicher Production-Release. Veränderte Freischaltbedingungen mit einer neuen Regelversion dokumentieren. Die allgemeine [Feature-Übersicht](FEATURES.md) verweist hierher; technische Grundlagen stehen in [docs/QUIZ-REISEPASS.md](docs/QUIZ-REISEPASS.md).

| Bereich | Aktueller Stand | Nächster Schritt |
|---|---|---|
| Reisepass und persönliche Rundenzahlen | Vorhanden | Für die Sammlung nutzen |
| Dauerhafte Einzelantworten und Fragenversionen | Kategoriezuordnung lokal ergänzt | Migration 014 vor Production anwenden |
| Übungsrunden für offene Fehler | Vorhanden | Regeln für Lernbelohnungen festlegen |
| Souvenirdefinitionen und persönliche Vergaben | Lokal umgesetzt | Zwei versionierte Rom-Definitionen, Vergabe in derselben Transaktion wie das Ergebnis |
| Reisestempel und Sammelmotive | Lokal umgesetzt | Zwei generierte Low-Poly-Entwürfe im Projekt; Design gemeinsam prüfen |
| Sammlung im Reisepass und Ergebnishinweis | Lokal umgesetzt | Mobile/Desktop und verzögertes Speichern geprüft |
| Freischaltbare Profilbilder | Astra lokal umgesetzt: eine Hero-Frage im ersten Versuch richtig | Admin kann frei/Belohnung, Aktivierung und vorhandene Testregel pflegen; weitere Regeln bleiben offen |
| Heldenfähigkeiten / Joker | Neue Idee des Nutzers | Kleine Auswahl, Freischaltung und faire Nutzungsregeln festlegen |
| Adminverwaltung der Definitionen | Lokal umgesetzt | Name, Kategorie, feste Regel, Zielwert, Beschreibung, Motiv/Mediathek/Upload, Status und neue Versionen |
| Nutzerfortschritt für Tests zurücksetzen | Lokal umgesetzt | Nur localhost/127.0.0.1, ausdrückliches Serverflag und Accounts mit `@example.test`; Production gesperrt |

## Begriffe: Was passiert wann?

Die Begriffe beschreiben zusammen einen Ablauf. Sie sind keine fünf voneinander unabhängigen Belohnungssysteme.

**Beispiel:** Ein Nutzer beantwortet die zwanzigste unterschiedliche Rom-Frage. Damit erreicht er einen **Meilenstein**. Der Server bestätigt die **Freischaltung**. Als **Belohnung** erhält er ein Rom-**Souvenir**. Ein **Reisestempel** ist eine kleinere, ortsbezogene Form einer solchen Auszeichnung.

| Begriff | Bedeutung | Wann entsteht er? | Beispiel | Sichtbarkeit |
|---|---|---|---|---|
| Meilenstein | Erreichte, überprüfbare Bedingung | Sobald die festgelegte Regel durch gespeicherte Ergebnisse erfüllt ist | 20 unterschiedliche Rom-Fragen beantwortet | Ziel und Fortschritt vorab, Erfüllung danach |
| Reisestempel | Kompakte Erinnerung an einen ersten Besuch | Vorschlag: erste Kategorie- oder Übungsrunde der Kategorie beendet, mindestens eine Frage tatsächlich beantwortet | Erster Besuch in Rom | Kleines Siegel in Quizreise-Karte und Sammlung |
| Souvenir | Persönliches Sammelstück, meist mit Ortsbezug | Vorschlag: Reisestempel vorhanden und kategoriespezifisches Entdeckerziel erreicht | Römische Reisemarke | Motivkarte in der Sammlung mit Detailansicht |
| Belohnung | Oberbegriff für das erhaltene Erinnerungsstück oder eine nutzbare Auswahl | Wenn eine dafür vorgesehene Bedingung erfüllt ist | Souvenir, besonderer Avatar oder später ein Rahmen | Sammlung und gegebenenfalls Profilverwaltung |
| Freischaltung | Technischer und sichtbarer Übergang von gesperrt zu verfügbar | Erst nach erfolgreicher serverseitiger Speicherung und Prüfung | Ein besonderes Userbild wird auswählbar | Ergebnishinweis und dauerhaft verfügbarer Zustand |

Die Zahl 20 dient hier nur als Beispiel. Endgültige Ziele werden je Kategorie festgelegt.

## Leitidee und Umfang

- Der Reisepass zeigt die Reisen, Souvenirs geben ihnen Persönlichkeit und geteilte Erfolge können andere zum Mitspielen einladen.
- Ortsbezogene Motive passen zum vorhandenen Illustrationsstil. Keine Flut beliebiger Medaillen für Klicks oder triviale Aktionen.
- Zunächst zwei Auszeichnungen pro ausgewählter Kategorie: erster Reisestempel und besonderes Entdecker-Souvenir.
- Der Einstieg belohnt Neugier und Beschäftigung mit den Fragen. Eine perfekte Runde ist keine Voraussetzung für das wichtigste Stadt-Souvenir.
- Unterschiedliche Spielgewohnheiten berücksichtigen. Wenige klare Ziele statt eines überladenen Dashboards.
- Keine tägliche Pflichtserie, Zufallsbelohnungen oder zusätzliche Punktewährung zum Start. Diese Ideen wurden ausdrücklich nicht als empfohlener Einstieg vorgeschlagen.
- Motive einmal erstellen und als gemeinsame Assets ausliefern. Keine KI-Anfragen während des Spielens, keine separat abgerechnete KI-API.

## Kandidaten und vorgeschlagene Freischaltbedingungen

| Kandidat | Typ / Belohnung | Vorgeschlagene Bedingung | Status / offene Entscheidung |
|---|---|---|---|
| Erster Besuch | Reisestempel je Kategorie | Erste Kategorie- oder Übungsrunde der Kategorie beendet und mindestens eine Frage beantwortet | Für Rom lokal umgesetzt |
| Entdecker | Besonderes Souvenir je Kategorie | Kategorienbesuch und festgelegte Anzahl unterschiedlicher Fragen dieser Kategorie beantwortet | Für Rom lokal umgesetzt: 20 Fragen |
| Reise durch Italien | Kategorienübergreifendes Sammelmotiv | Erste Besuche in mehreren unterschiedlichen Kategorien | Spätere Idee; Anzahl und Motiv offen |
| Drangeblieben | Lernbelohnung | Mehrere unterschiedliche zuvor falsch beantwortete Fragen später lösen | Spätere Idee; Anzahl, Versuche und Zeitbezug offen |
| Besonderer Hero-Moment | Anspruchsvollere Auszeichnung | Festgelegte Anzahl unterschiedlicher Hero-Fragen lösen | Spätere Idee; nicht nur eine einzelne Hero-Frage als Standardbelohnung |
| Fehlerfreie Runde | Optionale besondere Auszeichnung | Denkbar: Runde ohne Fehler; Mindestgröße und Bedeutung des zweiten Versuchs müssen festgelegt werden | Spätere Idee aus der Ideensammlung, nicht für Version 1 vorgesehen |
| Freischaltbares Userbild | Nutzbarer neuer Avatar | Testregel Astra: eine Hero-Frage im ersten Versuch richtig, beendete Runde | Lokal umgesetzt; weitere Bedingungen bleiben Ideen |
| Besonderer Avatar-Rahmen | Kosmetische Profilbelohnung | Denkbar: ausgewählter größerer Meilenstein | Frühere Idee; zusätzliche Darstellung und Umfang offen |
| Lieblingssouvenir | Persönliche Profilauswahl | Ein bereits erhaltenes Souvenir als Favorit auswählen | Spätere Idee; benötigt keinen zusätzlichen Leistungsnachweis |
| Heldenblick | Dauerhaft freigeschaltete Fähigkeit | Denkbar: größerer Meilenstein; einmal pro Runde eine falsche Antwort bei einer schweren Frage ausblenden | Nutzeridee; Name, Freischaltung und Nutzungslimit noch offen |
| Neues Abenteuer | Dauerhaft freigeschaltete Fähigkeit | Denkbar: größerer Meilenstein; einmal pro Runde eine noch unbeantwortete Frage tauschen | Nutzeridee; Ersatzfrage und Auswirkungen auf die Wertung klären |

Weitere frühe Stichworte aus `hinweise.md`: „Hero-Master“ und „Zweiter Versuch gerettet“. Diese sind Ideen für spätere Diskussionen, keine ausformulierten oder beschlossenen Regeln. Zweite richtige Versuche sollen grundsätzlich berücksichtigt werden; eine ausdrücklich auf den ersten Versuch bezogene Auszeichnung muss das klar benennen.

## Spielregeln für den vorgeschlagenen Einstieg

### Was zählt als Entdeckung?

- Eine tatsächlich beantwortete Frage zählt unabhängig davon, ob die Antwort richtig war.
- `first_try`, `second_try` und `incorrect` können zählen; `skipped` zählt nicht.
- Gezählt werden unterschiedliche Fragen-IDs pro Nutzer und damaliger Kategorie, nicht Fragenversionen oder Gesamtantwortzahlen.
- Wiederholte Runden mit denselben fünf Fragen bringen keine fünf neuen Entdeckungen.
- Textkorrektur oder Bildaustausch erzeugen keine neue Entdeckung und nehmen keine bisherige weg.
- Fortschritt entsteht nur aus erfolgreich gespeicherten, beendeten Runden. Abgebrochene Runden zählen zunächst nicht.
- Übungsrunden können beitragen. Themenrunden können zum Entdeckerfortschritt der jeweiligen Fragenkategorie beitragen, sobald diese Zuordnung zuverlässig eingefroren wird.
- Der erste Reisestempel setzt im aktuellen Vorschlag eine Runde dieser Kategorie voraus. Eine Themenrunde alleine erteilt ihn noch nicht.
- Eine Runde kann Stempel und Entdecker-Souvenir gleichzeitig freischalten.

**Weiter zu besprechen:** fachlich vollständig neu erstellte Fragen unter alter ID, Kategorieverschiebungen und Testinhalte. Neue Frage unter neuer ID und redaktionelle Korrektur müssen nachvollziehbar unterschieden werden.

### Schwellen und Erreichbarkeit

| Kategoriegröße | Unverbindlicher Zielwert |
|---|---|
| Klein | 5 unterschiedliche Fragen |
| Mittel | 10 unterschiedliche Fragen |
| Groß | 20 unterschiedliche Fragen |

Die Klassen haben noch keine festen Grenzen. Ziele erst anhand des aktuellen Produktionsbestands setzen; lokale JSON-Dateien sind nur eine Orientierung. Kein Ziel darf mehr unterschiedliche Fragen verlangen, als sinnvoll erreichbar sind. Testkategorien erhalten keine Souvenirs; Kategorien werden bewusst für das Feature freigegeben.

Feste Ziele je Kategorie statt automatisch mitwachsender Prozentgrenzen. Neue Fragen erhöhen ein bestehendes Ziel nicht automatisch. Bereits verdiente Souvenirs bleiben bei Katalogänderungen erhalten. Wird ein offenes Ziel durch Archivierung oder Löschung unerreichbar, soll die Verwaltung darauf hinweisen und eine bewusste Anpassung ermöglichen.

Ein früher Vorschlag kombinierte die Fragenanzahl mit „mehrere Themen entdeckt“. Für den einfacheren Einstieg wurde anschließend die Anzahl unterschiedlicher Fragen bevorzugt. Die Themenkombination bleibt als spätere Option vorgemerkt.

### Zufällige Fragen bleiben erhalten

Die normale zufällige Fragenauswahl wird durch das Souvenirfeature nicht verändert. Die letzten fehlenden Fragen können deshalb mehrere Runden benötigen. Niedrige Einstiegsschwellen verringern Frust. Eine gezielte Runde „Neue Fragen entdecken“ ist eine spätere, separat zu besprechende Erweiterung.

## Motive und Gestaltungsideen

| Kategorie | Reisestempel | Besonderes Souvenir / Motividee |
|---|---|---|
| Rom | Stilisiertes Stadtsiegel | Römische Reisemarke oder anderes illustriertes Stadt-Souvenir |
| Florenz | Renaissance-Stempel | Kleines Skizzenbuch |
| Neapel | Vesuv-Stempel | Illustrierte Postkarte |
| Amalfiküste | Küstenstempel | Farbige Keramikkachel |
| Siena | Stadtstempel | Individuelles Erinnerungsstück mit Stadtbezug, Motiv noch offen |

Die Motive sind unverbindlich. Reisestempel eignen sich für kompakte Stadtkarten, Souvenirkarten für die eigentliche Sammlung. Avatar-Rahmen wären eine zusätzliche spätere Form. Keine fertig beschlossenen Motive oder bereits verfügbaren Assets voraussetzen.

## Darstellung für den Nutzer

### Nach dem Quiz

Ein kompakter Hinweis unter dem Ergebnis, erst nach bestätigtem Speichern. Kein automatisches Pflichtmodal und keine Unterbrechung während der Fragen. Eine dezente Animation ist möglich; reduzierte Bewegung berücksichtigen.

Beispiele:

> **Dein erster Stempel aus Rom!**
>
> Ein neues Erinnerungsstück wartet in deinem Reisepass.
>
> Souvenir ansehen

> **Ein Stück Florenz gehört jetzt zu deiner Sammlung.**
>
> Dein neues Souvenir wartet im Reisepass.

Bei mehreren gleichzeitigen Freischaltungen eine kompakte gemeinsame Darstellung statt mehrerer Pflichtdialoge. Bei Speicherfehlern keinen Freischalterfolg vortäuschen; erneutes Speichern darf nichts doppelt vergeben.

### Sammlung im Reisepass

Vorgeschlagene Reihenfolge:

1. Begrüßung und Gesamtzahlen
2. Dein nächstes Abenteuer
3. Erfolgsquoten
4. Deine Quizreisen
5. **Deine Souvenirs**
6. Diese Fragen übe ich noch

Ein kleiner Stempel in der vorhandenen Quizreise-Karte kennzeichnet den ersten Besuch. Die Sammlung darunter zeigt größere Motive.

| Zustand | Darstellung |
|---|---|
| Erhalten | Farbiges Motiv, Name und Freischaltdatum |
| In Reichweite | Zurückhaltende Vorschau und konkretes nächstes Ziel |
| Noch nicht begonnen | Kompakte Einladung zur ersten Runde |

Zunächst erhaltene Souvenirs und ein bis zwei nächste Ziele zeigen, keine große Wand gesperrter Karten. Später „Alle Souvenirs ansehen“ anbieten. Mobile ausreichend Platz für Motive und kurze Texte lassen.

Beispiel:

> **Dein Skizzenbuch aus Florenz**
>
> 14 von 20 unterschiedlichen Fragen entdeckt. Noch 6 bis zu deinem Souvenir.
>
> Florenz spielen

Ein Detaildialog zeigt großes Motiv, kurze Geschichte, erfüllte Bedingung, Datum und Link zur noch spielbaren Kategorie. Archivierte Ziele behalten ihre erhaltenen Motive, bieten aber keinen ungültigen Spielbutton.

### Neue Idee: Userbilder als Belohnung

Ein besonderes Profilbild könnte nach einem Meilenstein dauerhaft zur vorhandenen Avatarauswahl hinzukommen. Denkbar sind ortsbezogene Figuren oder eine besondere Variante eines bekannten Helden.

- Die vorhandene Basisauswahl bleibt verfügbar.
- Das neue Bild wird auswählbar, ersetzt aber nicht automatisch den aktuellen Avatar.
- Im Ergebnis erscheint ein Hinweis wie „Neues Heldenbild freigeschaltet“ mit Link zur Profilauswahl.
- Die Profilauswahl unterscheidet verfügbare und gegebenenfalls noch gesperrte Motive; gesperrte Motive erhalten eine verständliche Bedingung.
- Das Backend muss bei jeder Avataränderung die Berechtigung prüfen. Ein manipulierter Request darf kein gesperrtes Bild auswählen.
- Persönliche Berechtigung speichern, Bilddatei gemeinsam für alle Nutzer ausliefern; keine Bildkopie pro Account.
- Motiv, konkrete Bedingung, Kombination mit Souvenirs und spätere Regeländerungen gemeinsam festlegen. Noch keine Umsetzung beschlossen.

Ein verdienter Avatar könnte als weitere Belohnung derselben Freischaltung vergeben werden. Dafür muss kein getrenntes Meilensteinsystem entstehen. Ob jeder Entdecker einen Avatar erhält oder nur wenige besondere Ziele, bleibt offen.

### Gäste und Teilen

Die dauerhafte Sammlung gehört zum Account und ist zunächst privat. Für Gäste wäre nach dem Ergebnis ein dezenter Hinweis auf die speicherbare Sammlung denkbar. Keine rückwirkende Übernahme anonymer Leistungen versprechen, solange dafür kein eigener geprüfter Ablauf existiert.

Später könnte ein erhaltenes Souvenir optional auf der bestehenden Teilen-Karte erscheinen oder als eigenes Motiv geteilt werden. Die bisherige Bildfreigabe ohne automatisch angehängten Werbetext bleibt davon unabhängig. Öffentliche Profile oder automatische Veröffentlichungen sind nicht vorgesehen.

## Neue Idee: Heldenfähigkeiten als besondere Belohnung

**Nutzeridee:** Wenige besondere Joker können als Heldenfähigkeiten verdient werden und dauerhaft zum eigenen Helden gehören. Damit erhalten Belohnungen neben Sammelmotiven einen direkten Bezug zum Helden-Quiz. Die Fähigkeit bleibt nach der Freischaltung verfügbar; wie oft sie eingesetzt werden darf, ist eine getrennte Regel.

**Einschätzung:** Thematisch sehr passend. Eine kleine, verständliche Auswahl kann den eigenen Helden persönlicher machen und schwierige Momente abfedern. Zum Einstieg höchstens zwei Fähigkeiten ausarbeiten, keine große Talentstruktur und keine Pflicht zur Nutzung. Empfehlung: dauerhafte Berechtigung mit einem klaren Limit pro Runde statt unbegrenzter Einsätze oder täglichem Nutzungsdruck. Diese Empfehlung ist noch nicht beschlossen.

| Fähigkeit / Arbeitstitel | Wirkung | Vorgeschlagene Begrenzung | Noch zu entscheiden |
|---|---|---|---|
| Heldenblick | Eine garantiert falsche Antwort ausblenden | Einmal pro Runde, vor dem ersten Antwortversuch, zunächst bei Schwer (`medium`) | Gilt sie auch bei Hero? Werden normale Punkte vergeben oder unterstützte Antworten anders ausgewertet? |
| Neues Abenteuer | Eine Frage gegen eine neue zufällige Frage tauschen | Einmal pro Runde, vor einer Antwort oder aufgedeckten Lösung | Gleiche Schwierigkeit, Ersatzfragenverfügbarkeit, Übungsrunden und Statistikregeln |

### Faire und verständliche Spielregeln

- Freigeschaltet bedeutet nicht unbegrenzt einsetzbar. Im Profil/Reisepass zeigen, welche Fähigkeit dauerhaft vorhanden ist; im Quiz zusätzlich verbleibende Einsätze anzeigen.
- Keine Fähigkeit automatisch verwenden. Der Nutzer entscheidet bewusst; Wirkung und Verbrauch vorher knapp erklären.
- Erneutes Laden, mehrere Tabs oder wiederholte Requests dürfen verbrauchte Einsätze nicht zurückgeben oder doppelt ausführen.
- Beim Antwort-Ausblenden nur eine noch verfügbare falsche Antwort entfernen. Die richtige Antwort nicht an den Browser verraten. Nach einem falschen Versuch wäre die Hilfe stärker; deshalb zunächst Einsatz vor dem ersten Versuch empfehlen.
- Beim Tauschen Auswahlart und Rundengröße erhalten, möglichst gleiche Schwierigkeit verwenden und eine neue zufällige Frage aus der zulässigen Auswahl ziehen. Keine gezielte Frageauswahl durch den Nutzer. Bereits in der Runde enthaltene oder herausgetauschte Fragen nicht erneut ziehen.
- Ist keine passende Ersatzfrage verfügbar, Fähigkeit deaktivieren und begründen; keinen Einsatz verbrauchen.
- Eine ausgetauschte, unbeantwortete Frage zählt nicht als Entdeckung, Fehler oder gelöste Frage. Nur die tatsächlich gespielte Ersatzfrage fließt regulär ein. Den Tausch separat festhalten; bisherige abgeschlossene Ergebnisse nicht verändern.
- Übungsrunden benötigen eine eigene Entscheidung: Tausch gegebenenfalls nur gegen eine andere aktuelle offene Fehlerfrage derselben Kategorie. Kein stiller Wechsel in eine normale Runde.
- Unterstützte Antworten und verwendete Fähigkeiten dauerhaft kennzeichnen. Vor Umsetzung entscheiden, ob sie reguläre Punkte und Erfolgsquoten erhalten und welche anspruchsvollen Auszeichnungen sie erfüllen dürfen.
- Fehlerfreie-/Hero-Leistungsziele dürfen nicht versehentlich ihre Bedeutung verlieren. Regeln müssen ausdrücklich sagen, ob Hilfen zulässig sind. Entdeckerziele können weiterhin tatsächlich beantwortete Fragen zählen.
- Gäste erhalten keine dauerhaften Freischaltungen. Ein Einsatz ist nur mit gültiger Accountberechtigung möglich, sofern kein separater Gastmodus dafür beschlossen wird.
- Profilbildwechsel oder kosmetischer Heldenwechsel darf eine accountbezogene Fähigkeit nicht versehentlich entfernen. Ob „eigener Held“ nur Gestaltung oder später ein echtes Heldenmodell bedeutet, bleibt offen.

### Technische Konsequenzen

Dies ist mehr als eine kosmetische Belohnung: Der eingefrorene Rundenstand und die serverseitige Wertung müssen einen autorisierten Tausch beziehungsweise Hilfseinsatz unterstützen. Keine bloße Manipulation der Frage im Frontend.

Dauerhafte Freischaltung und Einsätze getrennt speichern. Das genaue Schema bleibt offen: mögliche accountbezogene Berechtigungen sowie Rundenaktionen mit Fähigkeit, betroffener Frage, Zeitpunkt und gegebenenfalls Ersatzfrage. Eindeutige Aktionskennungen und Transaktionen sichern wiederholte Anfragen ab. Historische Antwortdetails müssen die Unterstützung nachvollziehbar machen; keine nachträgliche Ableitung aus dem heutigen Fähigkeitsbestand.

Das Backend prüft freigeschaltete Fähigkeit, Nutzer der Runde, verbleibendes Limit und zulässigen Fragezustand. Erst eine erfolgreiche Aktion verbraucht den Einsatz. Für Antwort-Ausblendung nur den erlaubten auszublendenden Index liefern; für Tausch nur die neue reguläre öffentliche Frage, ohne Lösung. Bei paralleler Antwort und Tausch muss eine Rundensperre widersprüchliche Zustände verhindern.

Neue Effekttypen benötigen Code und Tests. Der Admin soll später innerhalb dieser geprüften Typen Freischaltbedingungen und zugelassene Parameter pflegen können, aber keine beliebige neue Spiellogik konfigurieren. Heldenfähigkeiten separat priorisieren; sie sind noch nicht als Bestandteil des ersten Rom-Durchstichs beschlossen.

## Technische Grundlage und noch fehlende Daten

Vorhanden: `quiz_results`, `quiz_question_results`, `quiz_question_versions`, serverseitig eingefrorene Runden und deren `is_practice`-Kennzeichnung. Die Auswertung kennt erste/zweite richtige Versuche, falsche und übersprungene Fragen.

**Lücke:** Die damalige Kategorie wird noch nicht dauerhaft pro einzelner Frage festgehalten. Gerade bei kategorienübergreifenden Themenrunden reicht die Auswahl des Gesamtergebnisses nicht aus. Vorgeschlagene Ergänzung: Kategorie beim Rundenstart pro Frage einfrieren und bei Abschluss im dauerhaften Antwortverlauf speichern. Spätere Verschiebungen im Katalog dürfen historische Entdeckungen nicht umdeuten.

Bestehende Daten nur anrechnen, soweit sie die jeweilige Bedingung belegen. Alte Rundensummen belegen nicht automatisch unterschiedliche Fragen oder tatsächliche Antworten. Bei Kategorienrunden kann die gespeicherte Auswahl helfen; alte Themenrunden nicht nachträglich anhand des heutigen Katalogs als sicher zuordnen. Vor einer Übernahme Datenqualität und belegbare Teilmengen prüfen.

## Vorgeschlagenes Datenmodell

Das ursprünglich vorgeschlagene Modell ist mit Migration 014 lokal umgesetzt. Die konkreten Felder und Grenzen stehen unter „Implementierte Version 1“. Weitere Belohnungsarten benötigen gegebenenfalls zusätzliche Berechtigungen, sie sind noch nicht implementiert.

### Definitionen: `quiz_souvenir_definitions`

| Inhalt | Zweck |
|---|---|
| ID und stabiler Souvenir-Schlüssel | Eindeutige Definition und logisches Sammelstück |
| Regelversion | Änderungen nachvollziehbar halten |
| Kategoriebezug | Ortsbezogene Ziele; für übergreifende Regeln optional |
| Name und Beschreibung | Verständliche Nutzertexte |
| Motivpfad | Gemeinsames Asset |
| Regeltyp und Parameter/Zielwert | Beispielsweise erster Besuch oder unterschiedliche Fragen |
| Aktivierungsstatus | Bewusst freigeben oder für neue Vergaben pausieren |

Ursprünglich war eine versionierte Definition im Repository angedacht. Im aktuellen Vorschlag werden Datenbankdefinitionen bevorzugt, weil Kategorien bereits im Admin gepflegt werden und Ziele später ohne Deployment verwaltbar sein sollen. Regeltypen bleiben fest im Backend implementiert; keine frei ausführbaren Formeln. Historische Regelversionen nicht nachträglich überschreiben.

### Vergaben: `quiz_user_souvenirs`

| Inhalt | Zweck |
|---|---|
| Nutzer-ID | Private Zuordnung |
| Stabiler Souvenir-Schlüssel | Einmalige Vergabe je Nutzer und Sammelstück |
| Verwendete Definitions-ID / Regelversion | Tatsächlich erfüllte Bedingung belegen |
| Freischaltzeitpunkt | Datum der Vergabe |
| Auslösendes Rundenergebnis | Vergabe nachvollziehen; bei späterer Ergebnislöschung nullable erhalten |

Ein eindeutiger Schlüssel auf Nutzer und Souvenir verhindert Mehrfachvergaben, auch über Regelversionen hinweg. Bestehende Auszeichnungen nicht beim Ändern einer Definition neu interpretieren. Kategorien und Motive müssen trotz Umbenennung/Archivierung nachvollziehbar bleiben; Löschen von Definitionen mit Vergaben verhindern oder bewusst archivieren.

**Avatar-Erweiterung:** Die erste lokale Profilbild-Belohnung nutzt seit Migration 016 eine eigene dauerhafte Berechtigung in `quiz_user_avatar_unlocks`. Sie wird durch einen serverseitig belegten ersten Hero-Treffer vergeben. Allgemeine Mehrfachbelohnungen für beliebige Meilensteine bleiben eine spätere Ausbaustufe.

Fortschritt zunächst aus den vorhandenen Einzelantworten mit passenden Indizes berechnen. Keine zusätzliche Statistik-/Fortschrittstabelle, solange Messungen keinen Bedarf zeigen. Vergaben benötigen wenige Zeilen pro Nutzer und Kategorie; Bilddateien werden gemeinsam gespeichert. Keine pauschale Speicherzusage ohne spätere Messung.

## Serverseitiger Vergabeablauf

1. Session und Antworten der gestarteten Runde prüfen.
2. Rundenergebnis und Einzelantworten speichern.
3. Relevante Meilensteinregeln auswerten.
4. Neue Vergaben in derselben Datenbanktransaktion speichern.
5. Freigeschaltete Souvenirs beziehungsweise Belohnungen mit der Speicherantwort zurückgeben.

Runde und Belohnung müssen zusammen erfolgreich sein. Benutzer-ID und Statistikwerte aus dem Browser sind keine vertrauenswürdige Vergabegrundlage. Wiederholtes Speichern derselben Runde erzeugt keine Duplikate. Bei verlorener erster Antwort sollte ein erneuter Versuch dieselben zum Ergebnis gehörenden Freischaltungen liefern können.

Accountbezogene Leseabfragen nur für den angemeldeten Nutzer. Kontolöschung muss persönliche Vergaben und gegebenenfalls Avatarberechtigungen entfernen, auch bei der vorhandenen logischen Kontolöschung. Keine unbeabsichtigte Löschung von Souvenirs beim Aufräumen temporärer Runden. Neue Assetversionen dürfen historische Motive nicht unbemerkt austauschen.

## Admin und Betrieb

**Nutzeranforderung:** Die Pflege im Admin muss vor der Implementierung des gesamten Features mitgeplant werden. Neue Meilensteine und Belohnungen sollen innerhalb vorgegebener Möglichkeiten ohne Codeänderung angelegt und bearbeitet werden können. Keine erst nachträglich passende Verwaltung auf ein starres Modell aufsetzen.

### Geplanter Verwaltungsbereich

Ein eigener Bereich, beispielsweise „Meilensteine & Belohnungen“, mit Liste, Suche/Filter, Bearbeitungsansicht und Vorschau. Ein gemeinsamer Meilenstein kann eine oder mehrere Belohnungen freischalten, beispielsweise Rom-Souvenir plus besonderes Userbild. Diese Zuordnung bei der Finalisierung des Datenmodells berücksichtigen; die zwei zunächst vorgeschlagenen Souvenirtabellen reichen für alle zusätzlichen Belohnungsarten eventuell nicht allein aus.

| Adminaktion | Geplanter Rahmen |
|---|---|
| Meilenstein anlegen | Aus fest programmierten Regeltypen wählen, Kategorie/Geltungsbereich und zulässige Zielwerte festlegen |
| Belohnung anlegen | Unterstützten Typ wählen: Reisestempel, Sammelmotiv, Avatar oder später geprüfte Heldenfähigkeit |
| Verknüpfen | Eine oder mehrere Belohnungen einem Meilenstein zuordnen; stabile Schlüssel intern erzeugen |
| Texte bearbeiten | Name, Beschreibung, Bedingung und Freischalthinweis pflegen |
| Bild auswählen/hochladen | Vorhandene Mediathek und Uploadprüfung nutzen; Vorschau und Bildbeschreibung vorsehen |
| Bild austauschen | Bewusst festlegen, ob Austausch auch bereits erhaltene Belohnungen optisch aktualisiert oder eine neue Motivversion erzeugt; Reichweite vorab anzeigen |
| Regeln ändern | Neue Regelversion als Entwurf erstellen; frühere Vergaben und deren erfüllte Bedingungen erhalten |
| Freigeben/pausieren | Entwurf, aktiv und archiviert unterscheiden. Pausieren verhindert neue Vergaben, entzieht aber keine erhaltenen Belohnungen |
| Prüfen | Ungültige/unerreichbare Ziele, Testkategorien, fehlende Motive und widersprüchliche Parameter anzeigen |
| Auswirkungen ansehen | Zugeordnete Belohnungen und betroffene Vergaben verständlich darstellen; keine automatische rückwirkende Neuvergabe ohne bewussten Ablauf |

Kein Regelcode, freie SQL-Abfragen oder ausführbare Formeln im Admin. Weitere Instanzen eines bekannten Regel-/Belohnungstyps sind administrativ pflegbar; eine wirklich neue Wirkung wie ein zusätzlicher Jokertyp erfordert Implementierung und Tests. Regeln zum Beibehalten verdienter Auszeichnungen gelten auch bei administrativer Archivierung. Verwendete Definitionen nicht stillschweigend physisch löschen.

### Testfunktion: Nutzerfortschritt zurücksetzen

**Nutzerwunsch:** In der Spielerübersicht soll eine Aktion am einzelnen Account den Zustand wie unmittelbar nach einer Registrierung wiederherstellen können. Hauptzweck ist das wiederholbare Testen; nicht als gewöhnliche Produktionsfunktion gedacht. Der begrenzte lokale Reset ist inzwischen umgesetzt und mit wegwerfbaren Accounts geprüft. Keine produktiven Nutzer wurden zurückgesetzt. Die folgende Abgrenzung dokumentiert Ziel und Erweiterungsmöglichkeiten; die tatsächlich implementierten Grenzen stehen unter „Implementierte Version 1“.

Empfohlene Bedeutung von „zurücksetzen“: Spiel- und Belohnungsfortschritt löschen, den Account selbst erhalten. Die Aktion heißt beispielsweise „Testfortschritt zurücksetzen“. Ein Klick öffnet eine konkrete Bestätigung mit Nutzer und Umfang; kein sofortiges, versehentliches Löschen durch einen einzelnen Klick. Alle Nutzer dürfen gelistet sein, die Aktion muss aber zusätzlich für den jeweiligen Account und die Umgebung zulässig sein.

| Datenbereich | Vorgeschlagene Resetwirkung |
|---|---|
| Runden, Einzelantworten, Erfolgsquoten, Reisepasszahlen | Persönliche Daten entfernen, daraus abgeleitete Werte auf leeren Zustand bringen |
| Offene Übungsfragen / Entdeckerfortschritt | Durch Entfernen der persönlichen Antwortbasis wieder leer |
| Persönliche Souvenirs, Stempel und Belohnungsberechtigungen | Entfernen, damit Freischaltungen erneut getestet werden können |
| Laufende Runden und Fähigkeitsaktionen | Entfernen beziehungsweise ungültig machen; alte Tabs dürfen keinen Fortschritt wiederherstellen |
| Freigeschalteter Avatar / Lieblingssouvenir | Gesperrte Auswahl durch zulässigen Standardavatar ersetzen; persönliche Belohnungsauswahl leeren |
| Benutzername, E-Mail, Passwort | Erhalten; keine neue Registrierung nötig |
| E-Mail-Bestätigung, Avatar-Basisauswahl und sonstige Profileinstellungen | Genaue Rücksetzgrenze noch festlegen; Empfehlung: Bestätigung erhalten, nur fortschrittsabhängige Auswahl zurücksetzen |
| Fragenkatalog, Kategorien, Medien und globale Definitionen | Nicht ändern |
| Gemeinsame unveränderliche Fragenversionen | Nicht pauschal löschen; werden möglicherweise von anderen Accounts verwendet |

Die Empfehlung ist also kein wortwörtlicher vollständiger Registrierungsreset, sondern ein leerer Spielstand bei weiter nutzbarem Testaccount. Diese Abgrenzung vor Umsetzung gemeinsam bestätigen.

Technische Anforderungen: Adminsession, CSRF und zusätzliche serverseitige Freigabe für Testbetrieb; standardmäßig in Production deaktiviert. Ein aktivierbarer Testmodus sollte vorzugsweise zusätzlich ausdrücklich markierte Testaccounts begrenzen. Keine Freischaltung allein durch ein sichtbares Frontend-Flag. Falls später Tests auf Production nötig sind, Scope und bewusste Aktivierung separat entscheiden.

Reset in einer Transaktion durchführen, parallel laufende Ergebnis-/Fähigkeitsaktionen absichern und vorhandene Sitzungen widerrufen oder über eine Resetgeneration ungültig machen. Auch verzögerte Requests dürfen keine vor dem Reset gestartete Runde erneut speichern. Die normalen regelmäßigen Backfills dürfen gelöschten Fortschritt nicht aus zurückgebliebenen persönlichen Daten erneut vergeben. Nutzerzuordnung und abhängige Tabellen vollständig prüfen; keine Daten anderer Nutzer löschen.

Eine knappe Adminprotokollierung von Zeitpunkt, ausführendem Admin, Zielaccount und Resetart vorsehen, ohne Passwörter, Tokens oder komplette gelöschte Antwortdaten zu protokollieren. Anschließend die Spieleransicht neu laden und Erfolg beziehungsweise Fehler klar anzeigen. Es handelt sich um eine destruktive Testaktion, nicht um den bestehenden Logout oder die Kontolöschung.

Vor dem ersten Production-Einsatz: Datenbank sichern, Migration explizit anwenden, belegbare Altfortschritte prüfen und den Umgang mit nachgetragenen Vergaben festlegen. Alte Leistungen nicht mit erfundenem Freischaltdatum versehen; tatsächlichen Leistungszeitpunkt und spätere Vergabe bei Bedarf unterscheiden. Code-Rollback ist kein Datenbank-Restore.

## Empfohlene Reihenfolge

| Schritt | Inhalt | Status |
|---|---|---|
| 1 | Regeln, Schwellen, erste Motive für Rom und Rahmen der Adminpflege gemeinsam festlegen | Lokal umgesetzt; Designreview offen |
| 2 | Historische Kategoriezuordnung, Definitionen, Vergaben und Tests | Lokal umgesetzt |
| 3 | Vollständiger Rom-Durchstich mit Reisestempel, Entdecker-Souvenir, Ergebnishinweis und Sammlung | Lokal umgesetzt |
| 4 | Bestehende Accounts anhand belegbarer Ergebnisse berücksichtigen | Lokal umgesetzt; Production erst nach Freigabe/Migration |
| 5 | Weitere Kategorien und die bereits mitgeplante Verwaltung ergänzen; sicheren Test-Reset für wiederholbare Prüfungen berücksichtigen | Verwaltung und lokaler Reset umgesetzt; weitere Kategorien offen |
| 6 | Userbilder, Heldenfähigkeiten, Lernbelohnungen oder übergreifende Ziele einzeln auswählen | Offen |

Der erste Durchstich soll fachlich und technisch vollständig sein. Die spätere Erweiterung um Städte und Motive verwendet dieselbe Grundlage.

## Prüfungen vor Abschluss der Implementierung

- Erste Vergabe, exakter Schwellenwert, mehrere Vergaben in einer Runde.
- Wiederholte Fragen, unterschiedliche Fragenversionen, falsche Antworten und Überspringen.
- Kategorie-, Themen- und Übungsrunden sowie Kategorieverschiebungen.
- Doppelte und parallele Speicheranfragen, verlorene Antwort und Wiederholungsversuch.
- Keine Vergabe bei abgebrochener Runde oder fehlgeschlagenem Speichern.
- Leere und ältere Accounts, belegbarer Altfortschritt und fehlende Detaildaten.
- Archivierte Kategorien, entfernte Fragen, neue Fragen und unerreichbare Ziele.
- Nutzertrennung, manipulierte Requests und Kontolöschung.
- Desktop/Mobile, Tastatur, reduzierte Bewegung, fehlende Bilder und Ladefehler.
- Bei Avatarbelohnungen: Berechtigungsprüfung beim Auswählen, kein automatischer Profilbildwechsel.
- Bei Fähigkeiten: Freischaltung und Rundenlimit, parallele Einsätze, Antwort/Tausch-Konflikte, fehlende Ersatzfrage, Wertung und Wiederholungsversuche prüfen.
- Adminpflege: Entwurf/Freigabe/Archivierung, Regelversionen, Medienaustausch und bereits vergebene Belohnungen prüfen.
- Test-Reset: vollständiger persönlicher Leerstand, Nutzertrennung, Bestätigung, Production-Sperre und keine Wiederherstellung durch alte Tabs oder nachträgliche Vergabe prüfen.

Diese Liste umfasst auch zukünftige Erweiterungen. Für Version 1 sind 119 Integrationstests und 28 Vertragstests erfolgreich; Avatar- und Fähigkeitsprüfungen bleiben geplant. Zusätzlich CSS-/BEM-Prüfung, JS-/PHP-Syntax, Produktionsbuild und die unten beschriebenen Browserprüfungen.

## Entscheidungsübersicht

1. Für den ersten lokalen Durchstich zwei ortsbezogene Auszeichnungen in Rom umgesetzt.
2. Rom-Ziel zunächst 20 unterschiedliche Fragen; weitere Kategorien und Produktionsbestand vor Freigabe prüfen.
3. „Beantwortet statt richtig gelöst“ umgesetzt. Damalige Kategorie eingefroren; eine vollständig neue Frage braucht eine neue ID.
4. Zwei generierte Motive und Darstellung stehen zur manuellen Begutachtung bereit.
5. Userbilder folgen erst nach gesonderter Priorisierung.
6. Konservativer Altfortschritt umgesetzt, Datum als heutige Ergänzung gekennzeichnet.
7. Grundverwaltung umgesetzt; weitere Regeln separat priorisieren.
8. Heldenfähigkeiten: höchstens wenige Wirkungen, konkrete Freischaltziele, Rundennutzung und Einfluss auf Punkte/Leistungsziele festlegen.
9. Adminpflege vorab konzipieren: unterstützte Typen, Mehrfachbelohnungen, Versionierung und Reichweite von Motivänderungen bestimmen.
10. Lokaler Reset mit Bestätigung, Sitzungswiderruf, `@example.test`-Begrenzung und harter Production-Sperre umgesetzt. Andere Einsatzorte erfordern eine neue Entscheidung.

## Fortschritts- und Entscheidungsprotokoll

| Datum | Eintrag | Stand |
|---|---|---|
| 20.10.2026 | Besprochene Ideen aus Chat und Abschnitt 5 von `hinweise.md` zusammengeführt; zentrale Datei angelegt | Dokumentation vorhanden |
| 20.10.2026 | Freischaltbare Userbilder als mögliche Belohnung ergänzt | Idee, noch nicht beschlossen oder implementiert |
| 20.10.2026 | Dauerhafte Heldenfähigkeiten mit Antwort-Ausblendung und Fragentausch aufgenommen; Nutzungslimits und Wertung als offene Regeln ergänzt | Nutzeridee und Empfehlungen, noch nicht umgesetzt |
| 20.10.2026 | Adminpflege als vorab zu planende Anforderung konkretisiert, einschließlich Medien und mehrerer Belohnungsarten | Anforderung dokumentiert, noch nicht umgesetzt |
| 20.10.2026 | Reset des persönlichen Spielstands für Testzwecke mit Datenumfang und vorgeschlagenen Schutzgrenzen aufgenommen | Anforderung dokumentiert; genaue Grenzen offen, kein Reset ausgeführt |
| 20.10.2026 | Version 1 für Rom umgesetzt: Stempel, 20-Fragen-Souvenir, Sammlung, Detaildialog und Ergebnisfreischaltung | Lokal umgesetzt, noch nicht veröffentlicht |
| 20.10.2026 | Migration 014, konservativer Altfortschrittsabgleich, Adminversionierung und lokal begrenzter Test-Reset | Lokal umgesetzt und mit isolierten Testdaten geprüft; keine produktiven Resets |

Bei fertigen Teilschritten hier Datum, Umfang, relevante Migration/Prüfungen und gegebenenfalls Production-Commit ergänzen.

## Testerweiterung Neapel und Florenz (20.10.2026, nur lokal)

| Kategorie | Reisestempel | Reisemarke | Lokaler Fragenbestand bei Einrichtung |
|---|---|---|---|
| Neapel | Erste beendete Kategorienrunde mit tatsächlicher Antwort | 5 unterschiedliche beantwortete Fragen plus Kategorienbesuch | 8 aktive Fragen |
| Florenz | Erste beendete Kategorienrunde mit tatsächlicher Antwort | 20 unterschiedliche beantwortete Fragen plus Kategorienbesuch | 126 aktive Fragen |

Falsche Antworten zählen als Entdeckung, übersprungene nicht. Die Schwelle für Neapel bleibt bewusst erreichbar. Bereits belegter Fortschritt kann die Stücke beim nächsten Reisepassbesuch freischalten; der Testaccount wurde nicht zurückgesetzt. Anpassungen sind im Admin-Tab Souvenirs möglich. Die bestehende Begrenzung auf zwei offene Ziele im Reisepass bleibt erhalten; nicht alle Städte werden gleichzeitig als Zielkarte angezeigt.

Migration `015_souvenirs_neapel_florenz.sql` ergänzt vier aktive Definitionen in `quiz_souvenir_definitions`, ohne Tabellenstruktur, Ergebnisse oder vorhandene Vergaben zu ändern. Der Schema-Snapshot enthält dieselben Definitionen. INSERT IGNORE macht die Seeds wiederholbar und erhält vorhandene Revisionen. Vor lokalem Anwenden wurden Definitionen, Vergaben und Migrationsstand in `.private/before-souvenirs-cities-20261020.json` gesichert. Für Production sind weiterhin Backup sowie Migrationen 014 und 015 vor Aktivierung erforderlich. Rücksprung: neue aktive Definitionen archivieren, vorhandene Vergaben und referenzierte Motive erhalten; Migrationseinträge nicht isoliert entfernen. Keine Veröffentlichung in diesem Schritt.

Vier transparente PNG-Motive wurden mit dem eingebauten Imagegen-Werkzeug erzeugt, visuell geprüft und unter `public/images/souvenirs/` gespeichert. Keine separat abgerechnete API genutzt. Prompts:

- `neapel-stamp-v1.png`

> Create one premium collectible circular deep teal travel seal for a Mediterranean learning quiz. Subject: Naples, Castel dell Ovo on the blue bay with Mount Vesuvius behind. Polished geometric low-poly illustration with crisp triangular facets, warm ochre gold and petrol turquoise palette, charming detailed architectural centerpiece legible at 100px. Single centered complete round object, square canvas, generous transparent padding. No letters, numbers, words, watermark, mockup or background outside the object. Genuinely transparent background.

- `neapel-token-v1.png`

> Create one premium collectible precious golden bronze medallion with laurel and teal enamel accents for a Mediterranean learning quiz. Subject: Naples, Castel dell Ovo on the blue bay with Mount Vesuvius behind. Polished geometric low-poly illustration with crisp triangular facets, warm ochre gold and petrol turquoise palette, charming detailed architectural centerpiece legible at 100px. Single centered complete round object, square canvas, generous transparent padding. No letters, numbers, words, watermark, mockup or background outside the object. Genuinely transparent background.

- `florenz-stamp-v1.png`

> Create one premium collectible circular deep teal travel seal for a Mediterranean learning quiz. Subject: Florence cathedral, distinctive large terracotta dome and marble facade. Polished geometric low-poly illustration with crisp triangular facets, warm ochre gold and petrol turquoise palette, charming detailed architectural centerpiece legible at 100px. Single centered complete round object, square canvas, generous transparent padding. No letters, numbers, words, watermark, mockup or background outside the object. Genuinely transparent background.

- `florenz-token-v1.png`

> Create one premium collectible precious golden bronze medallion with laurel and teal enamel accents for a Mediterranean learning quiz. Subject: Florence cathedral, distinctive large terracotta dome and marble facade. Polished geometric low-poly illustration with crisp triangular facets, warm ochre gold and petrol turquoise palette, charming detailed architectural centerpiece legible at 100px. Single centered complete round object, square canvas, generous transparent padding. No letters, numbers, words, watermark, mockup or background outside the object. Genuinely transparent background.

## Profilbild-Belohnung Astra (20.10.2026, lokal umgesetzt)

### Verbindliche Testregel und Bedienung

| Belohnung | Bedingung | Vergabe und Auswahl |
|---|---|---|
| Heldenbild Astra | Mindestens eine Frage mit eingefrorenem Schwierigkeitsgrad `hero` und serverseitigem Ergebnis `first_try` | Einmalig nach erfolgreichem Speichern der beendeten Runde; Kategorien-, Themen- und Übungsrunden zählen. Danach frei im Konto auswählbar. |

Falsche Antworten, übersprungene Fragen, ein richtiger zweiter Versuch und normale/schwere Fragen schalten Astra nicht frei. Die Regel wird nicht aus mitgesendeten Punkten oder einem behaupteten Schwierigkeitsgrad abgeleitet. Vorherige belegte Einzelantworten mit Hero/first_try werden beim expliziten Souvenir-Abgleich nachgetragen; alte Gesamtsummen allein reichen nicht. Die Belohnung muss deshalb bei Accounts mit passender History nicht erst neu erspielt werden.

Nach Abschluss erscheint das Heldenbild vor „Freunde herausfordern“ mit „Profilbild auswählen“. `account.html#avatar` öffnet nach Sessionprüfung direkt die Bildauswahl. Seit der Lifecycle-Erweiterung bleibt Astra bis zum Erhalt verborgen; die Registrierung bietet nur aktive freie Bilder. Freigeschaltet wird die Auswahl, nicht das aktuelle Profilbild ersetzt. Nach Auswahl und „Bild speichern“ wird Astra zum eigenen Profilbild. Die Souvenir-Seite zeigt aktive freie Bilder und erhaltene aktive Belohnungsbilder in einem eigenen Bereich; ihre Souvenirfilter gelten weiterhin für Reisestempel und Reisemarken.

### Datenbank, Berechtigung und Wiederherstellung

- Additive Migration `database/migrations/016_avatar_rewards.sql`, ebenfalls im Schema-Snapshot enthalten: neue Tabelle `quiz_user_avatar_unlocks` mit `user_id`, `avatar_key`, `rule_key`, `awarded_at`, nullable `source_result_id` und `is_backfill`. Eindeutiger Primärschlüssel Nutzer/Avatar verhindert doppelte Freischaltungen.
- Nutzer-Fremdschlüssel löscht Freischaltungen beim physischen Kontolöschen. Der logische Löschablauf entfernt sie ausdrücklich. Ergebnislöschung setzt nur den Ergebnisbezug auf NULL; die Belohnung und Herkunftskennzeichnung bleiben erhalten.
- Vergabe erfolgt in derselben Transaktion wie das Ergebnis und unter derselben Nutzerzeilensperre. Retry liefert dieselbe Freischaltung für das auslösende Ergebnis, spätere Runden zeigen sie nicht erneut als neu. Der Account-Update sperrt dieselbe Nutzerzeile und prüft die Berechtigung erneut serverseitig. Registrierungs- und manipulierte Auswahlversuche können keine Freischaltung umgehen.
- `account-me` liefert `unlockedAvatarKeys` und `availableAvatars`; `save-result` und `account-journey` liefern `avatarRewards`. `account-journey` liefert zusätzlich die auswählbaren Profilbilder für die Sammlung. Die öffentliche Avatar-Liste enthält nur aktive freie Profile; angemeldete Nutzer erhalten ihre aktiven freigeschalteten Belohnungen über private Antworten. Clientdaten sind keine Berechtigungsquelle. Die Bilddatei selbst ist kein geschütztes Geheimnis; geschützt sind Auswahl und persönliche Berechtigungen.
- Test-Reset entfernt Freischaltungen und belegende Ergebnisse. Ein gerade ausgewählter Belohnungsavatar fällt auf `hero` zurück, Sitzungen werden widerrufen. Der erneute Abgleich stellt zurückgesetzte Belohnungen ohne History nicht wieder her. Die bestehenden Localhost-/Testmail-Sperren für diesen Adminvorgang bleiben erhalten.
- Vor lokalem Anwenden wurden betroffene Bestands-/Kontodaten privat unter `.private/before-avatar-rewards-20261020.json` gesichert. Vor Production: vollständiges Datenbankbackup, dann Migrationen 014–016 vor Aktivierung des neuen Codes. Bestehende Daten bleiben unverändert; es wird keine Freischaltung allein durch die Migration vergeben. Ein Code-Rücksprung darf die zusätzliche Tabelle und vergebenen Rechte erhalten; ein alter Katalog ohne Astra zeigt gegebenenfalls den Basishelden. Keine destruktive Rückmigration bei bestehenden Freischaltungen. Ein vollständiger Backup-Restore kann Fortschritt seit der Sicherung verlieren.

### Pflege und Grenzen dieser Version

Seit der lokalen Migration 017 stehen Motive, Namen und Regeln im Datenbank-Katalog `quiz_avatars` (`avatar_key: astra`, `unlock_rule: hero_first_try`). `data/avatars.json` bleibt die historische Ausgangsliste; Änderungen dort sind keine laufende Adminpflege mehr. Der Mediathek-Tab „Profilbilder“ erlaubt Namen, Motivwechsel und seit Migration 018 freie Profile oder Belohnungen, Aktivieren/Deaktivieren und Löschen. Belohnungen können die vorhandene Hero-Testregel oder „Freischaltung später festlegen“ verwenden; letzteres vergibt noch nichts automatisch. Schlüssel bleiben unverändert. Neue frei definierbare Regeltypen oder manuelle Einzelvergabe sind nicht enthalten. Die vorhandene Souvenir-Verwaltung pflegt weiterhin Reisestempel und Entdecker-Souvenirs; eine Verbindung mehrerer Belohnungen mit einem beliebigen Meilenstein bleibt vorgemerkt. Technische Details einschließlich Standardheld-Fallback und Löschverhalten: [Mediathek](docs/MEDIA.md).

### Motiv und Prüfungen

Neues transparentes, quadratisches Low-Poly-Motiv `public/images/website/avatar/astra-v1.png`, nach dem bestehenden Quiz-Hero-Porträt gestaltet und visuell geprüft. Erzeugt mit dem eingebauten Imagegen-Werkzeug, kein separat abgerechneter API-/Key-Fallback. Referenz: vorhandenes `quizo.png`, nur Stil und Komposition, keine Ersetzung des Originals.

Verwendeter Prompt:

> Create a NEW collectible hero profile avatar named Astra for Quiz-Hero. The supplied image is a STYLE AND COMPOSITION REFERENCE ONLY, not an edit target. Match its friendly chibi head-and-shoulders portrait, large expressive eyes, crisp low-poly triangular facets, clean transparent cutout, centered square composition and compact bust silhouette. New distinct character: confident smiling young adult cosmic explorer hero, short swept silver-white hair with a few deep violet facets, violet eye mask, deep purple and petrol costume, small golden four-point star emblem on chest, short gold-lined violet cape. Warm friendly face, no weapons. Premium unlockable character, readable at 80 pixels. No letters, words, numbers, watermark, scenery, border, circular badge or backdrop. Single complete bust with generous transparent padding; real alpha transparency.

140 isolierte Integrationsprüfungen und 31 Frontend-Vertragstests erfolgreich. Geprüft sind unter anderem falsche/zweite/übersprungene Antworten, gefälschte Schwierigkeit, eingefrorene Hero-Schwierigkeit, einmalige Vergabe, Retry, Account-Trennung, erlaubte und gesperrte Auswahl, Registrierung, dauerhafte Freischaltung trotz Ergebnislöschung, Nachtragen, lokaler Reset und Kontolöschung. PHP-/JS-Syntax, CSS-/BEM-Prüfung und lokaler Deployment-Build erfolgreich. Browserprüfung des gesperrten Motivs im Konto bei 390 und 1440 Pixeln: Bild geladen, Erklärung vorhanden, keine seitliche Überbreite; Ergebnishinweis mit Auswahl-Link vor der Teilen-Aktion. Keine Testfreischaltung oder Rücksetzung am echten lokalen Testaccount vorgenommen. Keine Veröffentlichung auf Production.

## Implementierte Version 1: verbindlicher technischer Stand

Diese Beschreibung konkretisiert die obigen Planungsabschnitte. Noch als offen bezeichnete Erweiterungen sind nicht automatisch umgesetzt.

Sichtbarkeitsanpassung: Solange noch kein Souvenir oder Reisestempel erhalten wurde, bleibt die gesamte Souvenir-Sektion im Reisepass ausgeblendet, einschließlich Einleitung und offener Ziele. Ab dem ersten erhaltenen Stück erscheinen Sammlung und nächste Ziele. Vergabe, Fortschrittsberechnung und Ergebnishinweis bleiben davon unabhängig.

Detaildialoge einmaliger Besuchserfolge (`first_visit`, beispielsweise „Rom besucht“) zeigen keinen Link „Kategorie spielen“. Spielverweise bei offenen Fortschrittszielen bleiben bestehen.

Prüfung der Städteerweiterung: 125 Integrationsprüfungen erfolgreich, darunter Migration/Snapshot/Wiederholung, Schwellen 5 und 20, Reisestempel vor Erreichen der Entdeckerschwelle sowie doppelte Vergabe und getrennte Kategorien trotz gleicher Frage-IDs. Die isolierte Audit-Datenbank wurde anschließend entfernt. Alle vier neuen PNG-Dateien sind lokal per HTTP 200 erreichbar; Motive wurden visuell geprüft. Kein Reset des echten Testaccounts, kein Production-Deployment.

### Freischaltung und Altfortschritt

- Regel `first_visit`: mindestens ein Ergebnis einer Kategorien- oder Übungsrunde mit `solved > 0` oder mindestens einem Einzelantwortergebnis außer `skipped`. Dadurch können auch nachweisbare ältere erfolgreiche Kategorienrunden zählen.
- Regel `discover`: gleicher Kategorienbesuch und `COUNT(DISTINCT question_id)` der tatsächlichen Antworten unter `category_id_at_play`. Fehlversuche zählen ausdrücklich mit. Neue Fragenversionen zählen nicht zusätzlich.
- Themenfragen zählen für Entdeckungen anhand ihrer beim Start eingefrorenen Kategorie. Sie erzeugen alleine keinen Kategorienbesuch.
- Neue Vergaben nur für aktive Definitionen und aktivierte Kategorien. Verdiente Stücke bleiben nach Archivierung erhalten; unspielbare Ziele bekommen keinen Startlink.
- Nachtragen geschieht über den expliziten geschützten POST `account-souvenir-sync` beim Reisepassbesuch. `account-journey` bleibt lesend. Wiederholungen vergeben nichts doppelt. Der Hinweis „Aus bisherigen Reisen ergänzt am“ beschreibt das heutige Vergabedatum, nicht ein erfundenes historisches Ereignis.
- Der Abschluss einer Runde liefert seine neu vergebenen Stücke in `save-result`. Ein identischer Speicherretry liefert dieselben Stücke, ohne erneut zu vergeben. Nutzerzeilen- und Rundensperren koordinieren Abschluss, Abgleich und Reset.

### Migration 014 und Datenhaltung

`database/migrations/014_souvenirs.sql` sowie der aktualisierte Schema-Snapshot ergänzen:

| Änderung | Umsetzung und bestehende Daten |
|---|---|
| `quiz_question_results.category_id_at_play` und Index | Neue Fragen werden aus dem eingefrorenen Serverstand zugeordnet. Alte Details erhalten nur die bekannte Kategorie ihres Kategorienrundenergebnisses; alte Themenzuordnungen bleiben NULL. |
| `quiz_souvenir_definitions` | Stabiler Schlüssel, Revision, Kategorie, Titel, Beschreibung, Motiv, Regel, Ziel und Status. Zwei aktive Rom-Definitionen werden einmalig angelegt. |
| `quiz_user_souvenirs` | Eindeutiges Paar Nutzer/Souvenir; Definitionsbezug, Vergabezeit, optional auslösendes Ergebnis und dauerhaftes `is_backfill`-Merkmal. |

Alte Ergebnisse bleiben bestehen. Der lokale Datenbankstand wurde vorher unter `.private/before-souvenirs-20261020.sql` gesichert; diese Datei ist vom Repository ausgeschlossen. Eine während der lokalen Entwicklung ergänzte Kennzeichnung nachgetragener Vergaben wurde lokal mit der finalen Entwurfsversion abgeglichen. Neuinstallationen und Production verwenden die finale Migration 014 vollständig.

Gemeinsame Fragenversionen werden beim Test-Reset nicht gelöscht. Physisches Kontolöschen entfernt Vergaben per Fremdschlüssel; der bestehende logische Kontolöschablauf entfernt sie ausdrücklich. Ergebnislöschung entzieht keine bereits verdiente Belohnung; der Ergebnisbezug darf NULL werden, die Herkunftskennzeichnung bleibt erhalten.

### Adminpflege

Lokale Bestandserweiterung: Der Admin-Tab zeigt alle angelegten Souvenirs als Motivkacheln mit Namen, Kategorie, Regel/Zielwert und Status. Angezeigt wird jeweils die neueste Revision pro stabilem Souvenir-Schlüssel, einschließlich Entwürfen und archivierten Definitionen; die Übersicht ist kein Revisionsarchiv. Suche nach Name/Kategorie sowie Kategorie- und Statusfilter grenzen den Bestand ein. Der Zähler zeigt Treffer/Gesamtzahl, leere Treffer erhalten einen Hinweis. Ein Klick öffnet das vorhandene Bearbeitungsformular unter dem Bestand; die gewählte Kachel ist markiert. „Neu anlegen“ öffnet ein leeres Formular. Nach erfolgreichem Speichern wird der Bestand neu geladen. Bestehende Versions- und Freischaltungsregeln bleiben erhalten; ein neuer Entwurf kann weiterhin neben einer älteren aktiven Revision bestehen.

Prüfung: Browser bei 390 und 1440 Pixeln, sechs vorhandene Motive, Suche Florenz (zwei Treffer), Kategorie Neapel (zwei Treffer), leerer Statusfilter, Auswahl/Bearbeitungswerte und Abbruch bei ungespeicherten Änderungen. Kein horizontales Überlaufen. Alle 28 Vertragstests sowie JS-Syntax, CSS-Build und BEM-Prüfung erfolgreich. Keine Datenbankänderung und keine zusätzliche Testdefinition im lokalen Bestand angelegt. Noch nicht veröffentlicht.

Unter **Souvenirs** im lokalen Admin stehen zwei fest programmierte Regel-/Belohnungstypen zur Wahl: Reisestempel und Entdecker-Souvenir. Neue Definitionen können auch für weitere Kategorien erstellt werden. Kategorie und Regeltyp sind nach dem Anlegen stabil; bei anderer Bedeutung wird eine neue Belohnung angelegt.

Jede Speicherung erzeugt eine neue Revision. Ein Entwurf ersetzt die bisher aktive Revision nicht. Aktivieren/Archivieren beendet die bisher aktive Revision. Bereits erhaltene Stücke behalten die ihnen zugeordnete Definition, ihren damaligen Titel und ihr Motiv. Der Admintext weist darauf hin; ein Motivwechsel ist kein stiller Massenaustausch bestehender Sammlungen. Die Mediathek schützt referenzierte Definitionmotive vor dem Löschen. Uploads verwenden die vorhandene Uploadprüfung und das bekannte Drag-and-Drop-Kästchen.

Aktivierung prüft Kategorie, vorhandene lokale Bilddatei und Erreichbarkeit anhand aktiver Fragen. Bereits aktive Ziele können durch spätere Katalogänderungen unerreichbar werden; die Verwaltungsansicht zeigt Fragezahl und Warnung beim betroffenen Eintrag. Keine automatische Regeländerung. Optimistische Versionsprüfung verhindert veraltetes Überschreiben. Noch nicht vorhanden: freie Regeltypen, Mehrfachbelohnungen je Meilenstein, freie Avatar-Belohnungspflege im Admin und Fähigkeitsberechtigungen. Die feste Avatar-Testregel Astra ist separat lokal implementiert.

### Lokaler Test-Reset

Docker aktiviert `QUIZ_HERO_ENABLE_TEST_RESET=true`. Der Server verlangt zusätzlich einen konfigurierten `SITE_URL`-Host `localhost` oder `127.0.0.1` und eine Zieladresse mit `@example.test`. Selbst ein versehentlich aktiviertes Flag auf `https://quiz-hero.de` erlaubt keinen Reset.

In **Spieler** erscheint dann „Testfortschritt zurücksetzen“. Die Bestätigung verlangt `RESET Benutzername`. Gelöscht werden persönliche Runden, Details, Rundenergebnisse, Souvenirvergaben und Avatar-Freischaltungen; Sitzungen werden widerrufen. Ein ausgewählter Belohnungsavatar wird auf den Basishelden zurückgesetzt. Zugangsdaten, E-Mail-Bestätigung und ausgewählte Basisavatare bleiben erhalten. Alte Tabs können gelöschte Runden nicht erneut speichern. Der Adminvorgang wird knapp im Serverlog protokolliert.

### Separate Sammlung (lokal, 20.10.2026)

`souvenirs.html` zeigt die vollständige Sammlung, sortiert nach Vergabezeit absteigend, sowie alle offenen erreichbaren Ziele unter eigener Zwischenüberschrift. Kategorie- und Artfilter wirken auf beide Bereiche. Ein Zähler nennt erhaltene Stücke und offene Ziele der Auswahl. Leere Sammlungen und leere Filterergebnisse erhalten passende Texte. Die vorhandenen Detaildialoge, Fortschrittsbalken und Spielverweise werden wiederverwendet.

Im Reisepass bleiben höchstens die drei zuletzt erhaltenen Stücke plus „Alle Souvenirs ansehen“; offene Ziele werden dort nicht mehr gezeigt. Ohne erhaltene Stücke bleibt die gesamte Vorschau ausgeblendet. Menüeintrag „Souvenirs“ mit eigenem Icon nur für angemeldete Nutzer. Der Ergebnislink führt direkt zur Sammlung. Alte Links mit `reisepass.html#souvenirs` landen weiterhin an der Vorschau.

Beide Seiten verwenden `passport-page.js` für denselben abgesicherten Ablauf: Session validieren, geschützten Souvenir-Abgleich ausführen, gespeicherte Reisedaten laden und erst danach darstellen. Die neue Seite ist mit `data-souvenir-collection` gekennzeichnet, bekommt passende Lade-/Fehlertexte und bleibt für Suchmaschinen ausgeschlossen. Gespeicherte Accountdaten allein schalten keine private Sammlung frei. Kein neues Datenbankfeld, keine Migration und keine Änderung der Vergaberegeln. Der Deployment-Build nimmt die neue HTML-Datei auf. Noch nicht veröffentlicht.

Prüfung: 30 Vertragstests, JS-Syntax, CSS-Build/BEM und lokaler Deployment-Build erfolgreich. Browser-DOM-Prüfung bei 390 und 1440 Pixeln ohne horizontales Überlaufen: Gäste sehen nur die Anmeldung, lokaler angemeldeter Account sieht Sammlung und drei Menüziele; Filter Neapel liefert die beiden passenden Einträge. Zusätzliche Vorschau mit fünf erhaltenen und fünf offenen Stücken prüft die Begrenzung auf drei neueste Stücke ohne Ziele im Reisepass sowie alle zehn Karten auf der Sammlungsseite. Keine Testvergaben in der Datenbank erzeugt. Die Bildschirmaufnahme über das Browserwerkzeug konnte nicht abgeschlossen werden; keine abschließende Screenshot-Prüfung.

### Ergebnisliste (lokale Anpassung)

Reisemarken zeigen im Reisepass direkt unter ihrem Namen den Fortschritt: offene Ziele mit bisher entdeckter Anzahl, erhaltene Marken mit erreichtem Zielwert, beispielsweise „20 von 20 Fragen entdeckt“, und vollständig gefülltem Balken. Der abgeschlossene Wert beschreibt die zum Erhalt nötige Schwelle, nicht darüber hinaus beantwortete Fragen. Einmalige Reisestempel erhalten keinen Balken. Lokale Seitenadresse und Links sind auf `reisepass.html` umgestellt; `passport.html` bleibt per HTTP-301-Weiterleitung kompatibel. Keine Änderung an Vergabe oder Datenbank.

Nach bestätigtem Speichern stehen neue Erinnerungsstücke vor „Freunde herausfordern“: eine Liste mit eigenem Motiv, Typ und Namen je Stück sowie einem gemeinsamen Link in den Reisepass. Ohne neue Vergabe bleibt der Bereich ausgeblendet; erneutes Rendern ersetzt die Liste. Prüfung: 28 Vertragstests, JS-Syntax, CSS-Build und BEM erfolgreich. Keine Veröffentlichung.

### Oberfläche und Tests

Die Sammlung liegt unter „Deine Quiz-Reisen“ und vor „Diese Fragen übe ich noch“. Erhaltene Stücke und bis zu zwei offene Ziele verwenden kompakte Karten, ein einfacher Fortschrittsbalken zeigt das Entdeckerziel. Die Quizreise-Karte kennzeichnet den vorhandenen Reisestempel. Motivdetails öffnen im gemeinsamen Dialog mit Schließen-Icon. Ein kleiner Ergebnishinweis erscheint erst nach bestätigtem Speichern und führt zur Sammlung.

Die komplette Integration prüft unter anderem Schwellen, Wiederholungen, falsche und übersprungene Antworten, Themenrunden, Kategorieverschiebung während einer Runde, Altfortschritt, Nutzertrennung, Speicherretry, Entwürfe, unveränderte Altvergaben, Archivierung, Admin-CSRF, Zielvalidierung, Reset und Kontolöschung. Die Prüfungen laufen ausschließlich in einer wegwerfbaren `quiz_hero_audit_*`-Datenbank. Browserprüfungen ergänzen Sammlung/Detaildialog bei 390 und 1440 Pixeln, Adminfelder sowie den erst nach erfolgreichem Speichern sichtbaren Ergebnishinweis. Kein produktiver Fragenbestand wurde verändert.

### Motive und Generierung

Beide Entwürfe wurden mit dem eingebauten Imagegen-Werkzeug erzeugt; kein API-Key- oder separat abgerechneter API-Fallback. Die transparenten PNG-Dateien liegen dauerhaft im Projekt:

- `public/images/souvenirs/rom-stamp-v1.png`: petrolfarbenes rundes Rom-Siegel.
- `public/images/souvenirs/rom-token-v1.png`: goldenes Entdecker-Medaillon mit Lorbeer.

Verwendete Prompts:

> Create one premium illustrated collectible travel stamp for a Rome learning quiz webapp, square canvas transparent background. A compact circular teal/petrol seal framing a warm golden Colosseum, subtle geometric faceted low-poly planes, turquoise sky inside the seal, small olive leaf accents. Strong legible silhouette at 80px, clean polished flat illustration with softly textured triangular facets matching Mediterranean low-poly travel art. Warm ochre gold and deep petrol, restrained details, generous transparent padding. NO letters, NO numbers, NO words, NO watermark. Single round stamp centered, no mockup or shadows outside object.

> One premium illustrated Roman travel token collectible, square transparent canvas. Center a thick golden bronze coin-like travel medallion with a beautifully sculpted low-poly Colosseum relief and a small laurel wreath framing its bottom half. Warm sunlit ochre facets, petrol and turquoise enamel accents, charming Mediterranean geometric low-poly travel illustration, clean sharp polygon planes and subtle paper texture. It must feel more precious and detailed than a simple travel stamp yet not photorealistic, readable at 160 pixels. Front-facing very slight three-quarter thickness, centered complete object with generous transparent padding. No letters or text, no numbers, no ribbon text, no watermark, no background scenery, no mockup.


## Sammlung: begonnene Entdecker-Souvenirs (22.10.2026, lokal)

Die Souvenir-Seite zeigt erhaltene Stücke und bereits begonnene Entdecker-Souvenirs gemeinsam. Nur Entdecker-Ziele mit mehr als null unterschiedlichen beantworteten Fragen erscheinen mit ihrem Fortschritt und Balken. Ihre Motive bleiben vollständig grau bis zur Vergabe; die Karten nutzen den normalen Hintergrund. Keine separate Sektion nächster Ziele und keine unbegonnenen Ziele. Die Reisepass-Vorschau bleibt auf erhaltene Stücke beschränkt. Vergaberegeln unverändert: Entdeckt zählt unterschiedliche beantwortete Fragen, unabhängig von der Richtigkeit. Keine Datenbankmigration, noch nicht veröffentlicht.


### Profilbilder ausschließlich im Konto (22.10.2026, lokal)

Der Bereich „Deine Heldenbilder“ entfällt auf der Souvenir-Seite. Freie und freigeschaltete Profilbilder werden weiterhin im Konto ausgewählt; Vergabe und Ergebnishinweise bleiben unverändert. Frühere Abschnitte zur Heldenbilder-Sammlung beschreiben den historischen Stand. Noch nicht veröffentlicht.
