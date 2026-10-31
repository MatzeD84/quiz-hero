# Heldenfähigkeiten

Stand: 31.10.2026 · veröffentlicht. Die erste Version ist abgeschlossen; die unten genannten Erweiterungen sind Ideen.

## So funktioniert es

Jeder Held kann bis zu drei Fähigkeiten haben. Alle verfügbaren Fähigkeiten lassen sich jeweils einmal pro Questrunde einsetzen. Eine Vorauswahl einzelner Fähigkeiten ist nicht nötig. Die Hilfen sollen kleine taktische Entscheidungen ermöglichen und verständlich bleiben.

**0 abgeschlossene Runden bedeutet Startfähigkeit:** Der Held kann sie sofort verwenden. Bei einer höheren Zahl muss der jeweilige Account sie mit diesem Helden erlernen. Dafür zählen abgeschlossene Runden mit mindestens fünf tatsächlich beantworteten Fragen; richtige und falsche Antworten zählen, übersprungene nicht. Maßgeblich ist der Held beim Rundenstart. Neu erlernte Fähigkeiten stehen ab der nächsten Runde bereit.

Beim Heldenwechsel bleibt das Erlernte erhalten. Ein anderer Held muss seine Fähigkeiten selbst erlernen, auch wenn beide dieselbe Fähigkeit besitzen. Die Freischaltschwelle wird je Fähigkeit festgelegt und gilt für alle zugeordneten Helden.

## Die fünf Fähigkeiten

| Fähigkeit | Wann und was sie bewirkt |
|---|---|
| **Heldenblick** | Nach dem ersten Fehlversuch eine weitere falsche Antwort ausblenden. Eine richtige zweite Antwort bringt weiterhin einen Punkt. |
| **Neues Abenteuer** | Vor der ersten Antwort eine Frage durch eine andere derselben Kategorie ersetzen, möglichst gleich schwer. Ohne passende Ersatzfrage wird kein Einsatz verbraucht. In Übungsrunden nicht verfügbar. |
| **Schutzschild** | Nach dem ersten Fehlversuch aktivieren: Eine richtige zweite Antwort bringt zwei statt eines Punktes. |
| **Scharfblick** | Vor der ersten Antwort zwei falsche Möglichkeiten ausblenden. Für diese Frage sind danach höchstens zwei Punkte möglich; im zweiten Versuch ein Punkt. |
| **Glücksanker** | Nach dem ersten Fehlversuch aktivieren: Ist auch die zweite Antwort falsch, gibt es einen Trostpunkt. Die Frage bleibt falsch und zählt nicht als richtige Antwort für Belohnungen. |

Scharfblick und Glücksanker lassen sich auf derselben Frage nicht mit einer weiteren Fähigkeit kombinieren. Jeder Fähigkeitseinsatz gilt bei Belohnungsbedingungen als Hilfe für diese Frage. Richtig gelöste Fragen mit Hilfe zählen weiterhin für Entdecker-Souvenirs.

## Was Spieler sehen

In Registrierung und Konto zeigt die Heldenvorstellung ausschließlich Startfähigkeiten und bereits persönlich erlernte Fähigkeiten. Noch gesperrte Fähigkeiten bleiben verborgen. Ohne verfügbare Fähigkeit erklärt ein kurzer Hinweis, dass Fähigkeiten im Spiel freigeschaltet werden.

Im Quiz erscheint eine dezente **Hilfe**-Aktion mit Heldenbild und Anzahl, sobald eine Fähigkeit tatsächlich einsetzbar ist. Im Dialog wählt man eine Fähigkeit, liest ihre Erklärung und bestätigt **Jetzt einsetzen**. Verbrauchte Fähigkeiten werden ausgegraut. Ist nichts einsetzbar, verschwindet die Hilfe-Aktion. Der Rundenabschluss benennt ausdrücklich den Helden, der etwas gelernt hat, etwa „Burgo hat zwei neue Heldenfähigkeiten erlernt“.

## Im Admin pflegen

- Unter **Helden** eine Heldenkarte öffnen: Name, Verfügbarkeit, Aktivierung und maximal drei Fähigkeiten gemeinsam über **Held speichern** pflegen.
- Unter **Fähigkeiten bearbeiten** Namen, Erklärung, Bild, Aktivierung und Freischaltschwelle von 0 bis 100 Runden ändern. Neue Spielwirkungen müssen entwickelt werden; sie entstehen nicht durch einen neuen Text.
- Motive unter **Mediathek → Heldenfähigkeiten** verwalten und im Fähigkeitseditor zuordnen.

Deaktivieren oder Entfernen einer Zuordnung sperrt die Nutzung in neuen Runden, löscht aber keine persönlich erlernte Fähigkeit. Bereits gestartete Runden behalten ihre Regeln. Wird eine Startfähigkeit später an eine höhere Schwelle gebunden, entfällt der unmittelbare Zugang; echte persönliche Freischaltungen bleiben erhalten.

Bei Veröffentlichung eingestellt: Heldenblick 0, Neues Abenteuer 1, Schutzschild 1, Scharfblick 3 und Glücksanker 3 Runden. Diese Werte sind im Admin veränderbar.

## Vorgemerkt, noch nicht umgesetzt

| Idee | Gedanke und offene Grenze |
|---|---|
| **Dunkler Pakt** | Zweiten Versuch aufgeben und bei richtiger erster Antwort zwei Zusatzpunkte erhalten. Punktewertung und Kombinationen vorher festlegen. |
| **Spurensuche** | Die verborgene Kategorie einer gemischten Themenfrage aufdecken. Nur sinnvoll, wenn sie sonst unbekannt ist. |
| **Revanche** | Eine endgültig falsch beantwortete Frage am Rundenende noch einmal für einen Punkt versuchen. Wiederholungsphase und Fortschrittszählung müssen geklärt werden. |
| **Wissensfunke** | Fachlichen Hinweis geben. Zurückgestellt, bis redaktionell geprüfte Hinweise je Frage vorhanden sind. |
| **Zeitblase / zusätzliche Chance** | Erst mit einem Zeitmodus beziehungsweise einer bewussten Erweiterung des Zwei-Versuche-Prinzips prüfen. |
| **Weitere Lernziele / globale Fähigkeiten** | Später etwa besondere Leistungen statt nur Rundenzahlen; globale Fähigkeiten könnten allen Helden offenstehen. Aktuell sind die Fähigkeiten heldengebunden. |

Keine Käufe, neue Währung, tägliche Pflichtserie oder zufällige Vergabe vorgesehen.

Weiterlesen: [Heldenbelohnungen](HELDENBELOHNUNGEN.md), [Souvenirs](Souvenir.md). Technische Unterlagen: [Rollout und Wiederherstellung](HELDEN-ROLLOUT-2026-10-31.md), [archivierte Umsetzung](archive/2026-10-31/Heldenfähigkeit.md).
