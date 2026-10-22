# CSS-Design-System

`public/styles.css` ist generiert. Styles ausschliesslich unter `styles/` bearbeiten und anschliessend `node scripts/build-css.js` ausfuehren. `node scripts/watch-css.js` baut Aenderungen automatisch neu.

## Struktur

- `abstracts/tokens.css`: gemeinsame Skalen, Typografie, Geometrie und Bewegung ohne eigene Farbpalette.
- `themes/app-tokens.css`: einzige Farbpalette sowie farbabhaengige Rahmen und Schatten des aktuellen Designs. Jeder zentrale Token ist genau einmal definiert; keine gegenseitigen Ueberschreibungen.
- `themes/`: ausschliesslich zentrale Token-Definitionen; keine Layout- oder Komponentenregeln.
- `base/`: Reset, Typografie, Links und globale Barrierefreiheit (Fokus, reduzierte Bewegung).
- `layout/`: Container, Header, Footer und Accountnavigation.
- `components/`: wiederverwendbare UI-Bloecke wie Buttons, Formulare und Dialoge; `cards.css` haelt Kategorie-/Themenkarten einschliesslich Bild, Badge, Beschriftung und Zustaenden zusammen.
- `features/`: Quiz-, Account-, Admin- und SEO-spezifische BEM-Bloecke.
- `main.css`: verbindliche Importreihenfolge. Gemeinsame Tokens und App-Tokenwerte kommen zuerst, danach Basis, Layout, Komponenten und ihre Feature-Abhaengigkeiten. Keine nachgeschaltete zentrale Theme-Override-Datei.

Seit der lokalen Bereinigung vom 22.10.2026 sind `themes/app.css`, `base/responsive.css`, die getrennten Kartenfragmente `badge.css`/`card-content.css` und die ehemalige Shell-Sammeldatei aufgeloest. Responsive Regeln stehen bei dem Block, den sie anpassen. Account- und Loginflaechen liegen in ihren Featuremodulen; Quiz-Abbruchnavigation unter `features/quiz/navigation.css`. Die Produktionsdarstellung wurde als Vergleichsbasis verwendet; diese Strukturbereinigung ist mit Release cb23f51a0cc4-20261022131903 veroeffentlicht (aktiver Stand: /version.json). Pruefbericht: [CSS-Modularisierung](../docs/CSS-MODULARISIERUNG-2026-10-22.md).

Bei Aenderungen zuerst die verantwortliche Datei suchen. Basiszustand, Modifier, Interaktion und zugehoerige Media Queries dort pflegen. Gemeinsame Regeln duerfen mehrere BEM-Bloecke ausdruecklich zusammenfassen, etwa Karten oder Formulargrundlagen. Keine spaeten Reparaturregeln in einer Sammeldatei anhaengen. Die Importreihenfolge ist Teil der Kaskade und darf nicht ohne Darstellungsvergleich umsortiert werden.

## Custom Properties verwenden

Antwort-Hover im Quiz verwendet passende helle Flächen: `--color-difficulty-easy-surface`, `--color-difficulty-medium-surface` und die bestehende `--color-hero-surface`. Alle drei mischen die jeweilige Schwierigkeitsfarbe mit der normalen Oberfläche (9 Prozent Farbe). Der Hoverrahmen folgt derselben Schwierigkeitsrolle. Deaktivierte oder bereits richtig/falsch markierte Antworten sind ausgeschlossen; allgemeine Hoverflächen anderer Komponenten bleiben unverändert.

Feste Schwierigkeitsfarben: `--color-difficulty-easy` = dunkles Blau (Alias der Textfarbe), `--color-difficulty-medium` = Petrol (Alias der Akzentfarbe), `--color-difficulty-hero` = bestehendes Hero-Lila. Auf farbigen Schwierigkeitstags steht helle Schrift über `--color-on-difficulty`. Neue Schwierigkeitsanzeigen verwenden diese Rollen statt allgemeiner Farbrollen; allgemeine Tokens werden nicht umbenannt, weil sie auch andere Aufgaben erfüllen. Die Beschriftung „Einfache Frage“/„Schwere Frage“/„Hero-Frage“ ergänzt stets die Farbe.

Farben immer zentral als semantische Rollen definieren, beispielsweise `--color-text`, `--color-surface`, `--color-border` oder `--color-answer-correct-bg`. Einmalige Transparenzen koennen direkt in der Komponente mit `color-mix()` aus diesen Rollen entstehen. Keine eigenen Alpha- oder Prozentwert-Tokenfamilien anlegen. Komponenten sollen ihre Rolle ausdruecken und keine eigene Palette aufbauen.

Wiederverwendete Abstaende, Gaps, Schriftwerte, Radien, Border-Breiten, Schatten und Bewegungswerte verwenden ebenfalls Tokens. Vor einer neuen Definition nach einem passenden vorhandenen Token suchen. BEM-Block, Elemente und Modifier bleiben zusammen in der passenden Komponentendatei.

```css
.example {
    color: var(--color-text);
    background: var(--color-surface);
    padding: var(--space-16);
    gap: var(--space-8);
    border: var(--border-width-thin) var(--border-style) var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-card);
    transition: var(--transition-interactive);
}
```

Die Skalen werden bewusst klein gehalten:

- Schrift: 12, 14, 16, 18, 20, 24, 32, 48 und 64 Pixel als rem-Tokens, zum Beispiel `--text-16`. Hoechstens zehn Schriftgroessen. Responsive Headlines duerfen zwischen diesen Grenzen mit clamp() skalieren.
- Abstaende: 2, 4, 8, 12, 16, 20, 24, 32, 48 und 64 Pixel als rem-Tokens, zum Beispiel `--space-16`. Der Name bezeichnet die Pixelgroesse bei 16 Pixel Basisschrift, keinen abstrakten Skalenindex.
- Ecken: `--radius-sm` (6px), `--radius-md` (12px), `--radius-lg` (20px), dazu Pill und Kreis.

Aehnliche Werte werden auf diese Skalen vereinheitlicht. Seltene optische Korrekturen und spezielle Geometrie duerfen direkt in der Komponente stehen. Nicht fuer jeden einmaligen Wert eine Variable erzeugen. Schriftfamilien verwenden `--font-body`, `--font-heading` und `--font-code`.

Primitive Werte wie `0`, `auto`, `none`, `100%`, `transparent` und `currentColor` sowie einmalige Layoutgeometrie duerfen direkt stehen. Native Media-Query-Bedingungen verwenden weiterhin konkrete Breakpoints: CSS Custom Properties funktionieren dort nicht. Tokens fuer diese Bedingungen waeren irrefuehrend.

## Pruefung

```powershell
node scripts/check-css-tokens.js
node scripts/build-css.js
node scripts/check-bem.js
node --test tests/contracts.test.mjs
```

Der CSS-Build fuehrt die Token-Pruefung automatisch aus. Sie erkennt verstreute Farbwerte, zu grosse Token-Skalen, feste Schriftgroessen, Schriftfamilien, Bewegungszeiten, gemeinsame Border-Breiten und Schatten sowie nicht definierte Variablen und zyklische Referenzen. Die Pruefung ersetzt nicht die inhaltliche Entscheidung, welche Rolle ein neuer Token besitzt.

Die Pruefung lehnt zudem normale CSS-Deklarationen in Token-Dateien und neue Theme-Sammeldateien ab. Neue Gestaltung gehoert in die verantwortlichen Module, neue zentrale Designwerte in die beiden Token-Dateien.

Doppelte zentrale Token-Definitionen werden abgelehnt. `--color-*`-Rollen gehoeren ausschliesslich in `themes/app-tokens.css`, damit keine versteckten Palette-Ueberschreibungen entstehen.

Das uebernommene Design ist der Standard auf `master`. Dokumentation: [Design](../docs/DESIGN.md). Production wird weiterhin ausschliesslich vom Branch `hostinger` veroeffentlicht.

## Deaktivierte Buttons

Deaktivierte Aktionen bleiben sichtbar und verwenden zentral `--opacity-disabled: 0.45` sowie `cursor: not-allowed`. Keine eigenen Opazitaetswerte pro Komponente verwenden. Hovereffekte duerfen keinen aktiven Zustand suggerieren. Native Buttons mit `disabled` deaktivieren; bei `aria-disabled="true"` muss die Anwendung die Aktion zusaetzlich unterbinden. Bei fehlender Browser-Unterstuetzung eine sichtbare Begruendung und eine nutzbare Alternative anbieten. Richtige und falsche Quizantworten bleiben nach dem Sperren deckend, damit die Ergebnisfarben lesbar bleiben.
