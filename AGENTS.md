# QuizHero-Projektanweisungen

## Quizfragen erstellen

Wenn der Nutzer neue Quizfragen, einen Fragensatz oder eine importierbare Fragen-JSON anfordert:

1. Lies automatisch `chatGPTAgents/chatGPT_agent_quizhero_question_rules.md` und befolge die dort beschriebene Recherche-, Qualitäts-, Dubletten- und Importlogik. Der Nutzer muss diese Datei im Prompt nicht nennen.
2. Prüfe den Auftrag vor der Recherche auf fachlich relevante Unklarheiten, insbesondere unklare Kategorie, Themenabgrenzung, gewünschte Fragenart, Quellenvorgaben oder widersprüchliche Anforderungen. Frage aktiv und möglichst gebündelt nach, bevor davon abhängige Fragen erstellt werden. Eindeutig ableitbare Details und Standardwerte erfordern keine Rückfrage.
   Enthält der Auftrag keine fachlichen Quellen-URLs, arbeite automatisch im offenen Recherchemodus und recherchiere selbst geeignete Quellen nach den Qualitätsregeln der Agentendokumentation. Dafür ist keine zusätzliche Freigabe nötig.
   Übergibt der Nutzer eine oder mehrere URLs ausdrücklich als Quellen für das Thema, aktiviere den geschlossenen Quellenmodus: Erzeuge Fragen ausschließlich aus den Inhalten dieser URLs, recherchiere keine zusätzlichen fachlichen Quellen und folge keinen dort verlinkten weiterführenden Seiten. Lokale und produktive QuizHero-Daten dürfen weiterhin ausschließlich für Kategorie-, Tag- und Dublettenprüfungen verwendet werden.
3. Prüfe vor der Generierung den lokalen Fragenbestand und den aktuellen Produktionsbestand read-only. Nutze mindestens `https://quiz-hero.de/api/index.php?action=public-data`.
4. Prüfe selbstständig, ob der Produktions-Adminbereich erreichbar und bereits angemeldet ist. Wenn kein authentifizierter Zugriff besteht, öffne `https://quiz-hero.de/admin/` in Chrome und teile dem Nutzer mit, dass er sich dort anmelden und anschließend kurz Bescheid geben soll. Frage nicht nach Benutzername oder Passwort und gib Zugangsdaten niemals selbst ein. Wenn Chrome nicht steuerbar oder Produktion nicht erreichbar ist, melde diesen fehlenden Zugriff ebenfalls selbstständig. Fahre mit der Fragenerstellung erst fort, nachdem der Nutzer den Zugang hergestellt oder den Admincheck ausdrücklich übersprungen hat.
5. Wenn der Nutzer sinngemäß `Kein Check im Adminbereich` antwortet, überspringe den authentifizierten Admincheck. Arbeite dann mit der öffentlichen Produktions-API und dem lokalen Bestand weiter und nenne im Prüfbericht, dass inaktive Produktionsfragen nicht geprüft werden konnten.
6. Wenn keine Anzahl genannt ist, erstelle höchstens 20 fachlich belastbare Fragen. Gib weniger aus, wenn sich nicht genügend eindeutig belegte, nicht doppelte Fakten finden lassen.
7. Speichere das Ergebnis als importierbare JSON-Datei nach dem aktuellen Adminschema. Verwende einen verständlichen Dateinamen unter `imports/`, zum Beispiel `questions-rom-kolosseum.json`.
8. Führe `node scripts/validate-question-data.js <datei> --category=<categoryId>` aus und behebe strukturelle Fehler. Bewerte mögliche semantische Dubletten inhaltlich.
9. Importiere oder veröffentliche nichts. Ändere keine vorhandenen Fragen, sofern der Nutzer dies nicht ausdrücklich verlangt.
10. Berichte knapp über Anzahl, Quellenprüfung, verworfene Kandidaten, Validator-Ergebnis, Umfang des Produktionsabgleichs und verbleibende Unsicherheiten.

Kurze Aufträge wie `20 Quizfragen: Rom – Kolosseum` oder `Neue Fragen für Neapel` reichen aus.

Für einen geschlossenen Quellensatz reicht beispielsweise: `15 Quizfragen: Rom – Kolosseum. Quellen: <URL1> <URL2>`.

Die Antwort `Kein Check im Adminbereich` ist eine gültige Entscheidung und darf nicht erneut hinterfragt werden.
