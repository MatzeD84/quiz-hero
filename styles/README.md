# CSS-Design-System

`public/styles.css` ist generiert. Styles ausschliesslich unter `styles/` bearbeiten und anschliessend `node scripts/build-css.js` ausfuehren. `node scripts/watch-css.js` baut Aenderungen automatisch neu.

## Struktur

- `abstracts/tokens.css`: gemeinsame Designwerte und semantische Rollen.
- `themes/app-tokens.css`: Palette und Token-Ueberschreibungen des aktuellen Designs.
- `themes/app.css`: App-Layout und Komponentenregeln mit diesen Tokens.
- `base/`: Reset, Typografie, Links und responsive Querschnittsregeln.
- `layout/`: Container, Header, Footer und Accountnavigation.
- `components/`: wiederverwendbare UI-Bloecke wie Buttons, Formulare und Dialoge.
- `features/`: Quiz-, Account-, Admin- und SEO-spezifische BEM-Bloecke.
- `main.css`: verbindliche Importreihenfolge; Theme-Tokens und Theme-Regeln stehen zuletzt.

## Custom Properties verwenden

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

Das uebernommene Design ist der Standard auf `master`. Dokumentation: [Design](../docs/DESIGN.md). Production wird weiterhin ausschliesslich vom Branch `hostinger` veroeffentlicht.

## Deaktivierte Buttons

Deaktivierte Aktionen bleiben sichtbar und verwenden zentral `--opacity-disabled: 0.45` sowie `cursor: not-allowed`. Keine eigenen Opazitaetswerte pro Komponente verwenden. Hovereffekte duerfen keinen aktiven Zustand suggerieren. Native Buttons mit `disabled` deaktivieren; bei `aria-disabled="true"` muss die Anwendung die Aktion zusaetzlich unterbinden. Bei fehlender Browser-Unterstuetzung eine sichtbare Begruendung und eine nutzbare Alternative anbieten. Richtige und falsche Quizantworten bleiben nach dem Sperren deckend, damit die Ergebnisfarben lesbar bleiben.
