# QuizHero Image Agent – Notizen (FINAL PRO, robust)

## Ziel
Erzeuge konsistente **2:1 Bannerbilder** im **QuizHero Low-Poly Stil**.

Fix immer:
- ✅ 2:1 Querformat
- ✅ keine Menschen / Tiere
- ✅ kein Text / Logo / Wasserzeichen / Schilder
- ✅ nicht fotorealistisch
- ✅ keine Mikrodetails / keine Texturen (besonders bei strong)

WICHTIG: Modus-Regeln sind **hart** (kein „Verschönern“ durch mehr Details).

---

## 1) Modi (soft / medium / strong)

### soft (konservativ)
- sehr nah am Original
- moderat polygonal
- keine extra starke Polygonisierung
- Himmel/Wasser/Vegetation klar feine low-poly

### medium (Standard)
- nah am Original
- deutlich polygonal über das ganze Bild
- Himmel/Wasser/Vegetation klar low-poly
- keine Mikrodetails

### strong (Hero-Style)
- maximal polygonal / stark facettiert überall
- **detailarm**, keine Texturen, keine Mikrostrukturen
- Komposition darf optimiert werden für 2:1 Key Visual
- Farben sanft/warm, clean

---

## 2) Text → Bild
Format:
`Bild: <Motiv> – modus: medium (GENERATE)`

Optional:
- `… – 3 varianten`
- `… – tageszeit: abend`
- `… – wetter: nebel`
- `… – stimmung: warm`

Beispiel:
`Bild: Rom Forum Romanum – modus: medium – tageszeit: sonnenuntergang (GENERATE)`

---

## 3) Bild-Upload → Stiltransfer
Upload + Text (Standard: medium):
`<Motiv> – modus: medium`

Optional mit Änderungen:
`<Motiv> – zuschnitt: nicht abgeschnitten zeigen – komposition: mehr himmel`

Beispiel:
Upload + `Amalfi Küste – modus: medium – fokus: pflanzen/himmel/wasser stärker`

---

## 4) 2 Bilder Upload (Motiv + Style-Referenz)
- Bild A = Motiv
- Bild B = Style-Referenz

Text:
`Bild A = Motiv, Bild B = Style-Referenz → modus: medium, 2:1`

---

## 5) Kategorie/Tags Shortcut (LOCKED STRONG + Auto-Generate)
Wenn du so startest:

`Bild Kategorie: <Thema>`

Dann gilt:
- 🔒 immer strong (soft/medium verboten)
- detailarm, stark facettiert, warm/sanft
- kreative Kombination ikonischer Motive erlaubt
- Agent generiert automatisch ein Bild (außer „nur Prompt“)

Beispiele:
- `Bild Kategorie: Rom abend Sehenswürdigkeiten`
- `Bild Kategorie: Amalfi Küste sonnenuntergang`
- `Bild Kategorie: Goslar winter schnee`

---

## 6) Spezialregel Upload-Fotos (Qualitätshebel)
Bei Fotos muss besonders polygonal sein:
- Vegetation: keine Blatt-/Blüten-Details
- Himmel: voll facettiert, viele Polygone, keine Gradients
- Wasser: polygonal, keine realistische Spiegelung

Keyword:
`– fokus: pflanzen/himmel/wasser stärker`

---

## 7) Varianten (v1/v2/v3)
- v1 = Standard
- v2 = andere Perspektive (oft besser für Banner)
- v3 = anderer Look/Licht oder stärker polygonal

Beispiel:
`Bild: Rom – modus: medium – 3 varianten`

---

## 8) Parameter-Hilfe
Einfach:
`Parameter`

→ Agent gibt komplette Parameterliste + 2–3 Beispiele aus.

---

## 9) Vergleich / Musterbild (Style-Match)
Wenn Ergebnis stilistisch nicht passt:

Du schreibst:
- `Vergleich` oder `Bild Vorlage` oder `Bild Muster`

…und lädst dann das Musterbild hoch.

Dann passiert:
- Motiv/Komposition bleibt wie zuletzt generiert
- Stilangleichung an Musterbild:
  - Farbstil
  - Polygon-Dichte
  - Detailgrad

Optional:
- `Vergleich – nur Farben übernehmen`
- `Vergleich – nur Polygon-Dichte übernehmen`
- `Vergleich – nur Detailgrad übernehmen`
- `Vergleich – mehr wie Muster`

---

## 10) Profi-Workflow
1) `Bild: <Motiv> – 3 varianten` (ohne GENERATE)
2) beste auswählen
3) `GENERATE v2`
4) wenn Stil nicht passt → `Vergleich` + Musterbild
