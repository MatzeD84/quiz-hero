// Render locally with the app's own assets and design tokens. No account data or network service.
export async function renderResultCard(result) {
    const theme = getComputedStyle(document.documentElement);
    const token = name => theme.getPropertyValue(name).trim();
    const body = token('--font-body');
    const heading = token('--font-heading');
    const logo = new Image();
    logo.src = new URL('../images/website/avatar/logo.png', import.meta.url).href;
    await Promise.all([logo.decode(), document.fonts.load(`600 32px ${body}`), document.fonts.load(`400 64px ${heading}`)]);
    let categoryImage = null;
    if (result.image) {
        try {
            const imageUrl = new URL(result.image, document.baseURI);
            if (imageUrl.origin === location.origin) {
                const image = new Image();
                image.src = imageUrl.href;
                await image.decode();
                categoryImage = image;
            }
        } catch { /* A missing category image must not prevent sharing the result. */ }
    }
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    const box = (x, y, w, h, radius, color) => {
        ctx.fillStyle = token(color);
        ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fill();
    };
    const text = (value, x, y, size, color = '--color-text', family = body, weight = 600, maxWidth = 912) => {
        ctx.fillStyle = token(color); ctx.font = weight + ' ' + size + 'px ' + family;
        ctx.fillText(value, x, y, maxWidth);
    };
    box(0, 0, 1080, 1350, 0, '--color-page');
    box(32, 32, 1016, 1286, 32, '--color-surface');
    ctx.drawImage(logo, 76, 64, 80, 80);
    text('QUIZ-HERO', 174, 120, 38, '--color-text', heading, 400);
    text('MEIN QUIZ-MOMENT', 76, 210, 26, '--color-link');
    const label = result.label || 'Wissen macht Freude';
    let labelSize = 72;
    do { ctx.font = '400 ' + labelSize + 'px ' + heading; if (ctx.measureText(label).width <= 912) break; labelSize--; } while (labelSize > 24);
    text(label, 76, 300, labelSize, '--color-text', heading, 400);

    // Crop artwork proportionally to the landscape window; never stretch the source.
    box(76, 350, 928, 430, 24, '--color-highlight');
    const artwork = categoryImage || logo;
    ctx.save();
    ctx.beginPath(); ctx.roundRect(76, 350, 928, 430, 24); ctx.clip();
    const scale = categoryImage
        ? Math.max(928 / artwork.naturalWidth, 430 / artwork.naturalHeight)
        : Math.min(800 / artwork.naturalWidth, 390 / artwork.naturalHeight);
    const w = artwork.naturalWidth * scale, h = artwork.naturalHeight * scale;
    ctx.drawImage(artwork, 540 - w / 2, 565 - h / 2, w, h);
    ctx.restore();

    ctx.textAlign = 'center';
    text(result.score + ' / ' + result.maxScore, 540, 965, 148, '--color-link', heading, 400);
    text('PUNKTE', 540, 1016, 28, '--color-link');
    box(156, 1050, 768, 14, 7, '--color-surface-muted');
    const ratio = result.maxScore ? result.score / result.maxScore : 0;
    if (ratio > 0) box(156, 1050, Math.max(14, 768 * ratio), 14, 7, '--color-progress');
    text(result.solved + ' von ' + result.total + ' Fragen richtig', 540, 1121, 34, '--color-text-muted', body, 400);
    box(32, 1180, 1016, 138, 32, '--color-text');
    text('Wie viele Punkte holst du?', 540, 1239, 36, '--color-on-primary');
    text('quiz-hero.de', 540, 1285, 30, '--color-highlight', body, 400);
    return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG export failed')), 'image/png'));
}
