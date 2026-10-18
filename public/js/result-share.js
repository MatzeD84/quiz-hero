import { openDialog, closeDialog } from './dialog.js?v=dev';
import { renderResultCard } from './result-card.js?v=dev';

export function createResultShare({ score, maxScore, total, solved = 0, label = '', image = '' }) {
    if (![score, maxScore, total, solved].every(Number.isInteger) || score < 0 || maxScore < score || total < 1 || solved < 0 || solved > total) {
        throw new Error('Ungültiges Quiz-Ergebnis.');
    }
    const safeImage = typeof image === 'string' && /^(?:\/?images\/)[^?#]*$/i.test(image) && !image.includes('..') ? image : '';
    return { ...(safeImage ? { image: safeImage } : {}), score, maxScore, total, solved, label: String(label).replace(/\s+/g, ' ').trim().slice(0, 100) };
}

export function supportsResultShare(file, browser = globalThis.navigator) {
    try { return typeof browser?.share === 'function' && typeof browser.canShare === 'function' && browser.canShare({ files: [file] }); }
    catch { return false; }
}

export async function shareResult(file, browser = globalThis.navigator) {
    if (!supportsResultShare(file, browser)) return 'unavailable';
    try {
        await browser.share({ files: [file], title: 'Mein Quiz-Hero-Ergebnis' });
        return 'opened';
    } catch (error) { return error?.name === 'AbortError' ? 'cancelled' : 'failed'; }
}

export function bindResultShare(root, result, browser = globalThis.navigator) {
    const section = root.querySelector('[data-result-share]');
    if (!section) return () => {};
    const payload = createResultShare(result);
    const selection = root.querySelector('[data-result-selection]');
    if (selection && payload.label) {
        selection.hidden = false;
        selection.querySelector('[data-result-selection-label]').textContent = payload.label;
        const image = root.querySelector('[data-result-selection-image]');
        if (payload.image) {
            image.addEventListener('error', () => { image.hidden = true; }, { once: true });
            image.src = payload.image;
            image.hidden = false;
        }
    }
    const preview = section.querySelector('[data-share-preview]');
    const primary = section.querySelector('[data-share-native]');
    const primaryLabel = primary.querySelector('[data-share-label]');
    const download = section.querySelector('[data-share-download]');
    const status = section.querySelector('[data-share-status]');
    const dialog = section.closest('dialog');
    const shareDialog = section.querySelector('[data-share-dialog]');
    const opener = section.querySelector('[data-share-open]');
    let disposed = false, url, file, busy = false;
    const dispose = () => {
        disposed = true;
        closeDialog(shareDialog);
        if (url) URL.revokeObjectURL(url);
        dialog?.removeEventListener('close', dispose);
    };
    dialog?.addEventListener('close', dispose, { once: true });
    const generate = async () => {
        primary.disabled = true; download.hidden = true;
        primaryLabel.textContent = 'Bild wird erstellt …'; status.textContent = '';
        try {
            const blob = await renderResultCard(payload);
            if (disposed) return;
            file = new File([blob], 'mein-quiz-hero-ergebnis.png', { type: 'image/png' });
            url = URL.createObjectURL(blob);
            preview.src = url;
            preview.alt = `${payload.label || 'Quiz-Hero'}: ${payload.score} von ${payload.maxScore} Punkten, ${payload.solved} von ${payload.total} Fragen richtig.`;
            preview.hidden = false;
            download.href = url; download.download = file.name;
            const native = supportsResultShare(file, browser);
            primary.disabled = !native;
            if (!native) status.textContent = 'Dein Browser bietet das direkte Teilen von Bildern nicht an. Du kannst dein Bild herunterladen und in deiner Lieblings-App teilen.';
            primaryLabel.textContent = 'Bild teilen';
            download.hidden = false;
        } catch {
            if (disposed) return;
            primary.hidden = false; primaryLabel.textContent = 'Erneut versuchen';
            status.textContent = 'Deine Bildkarte konnte nicht erstellt werden. Bitte versuche es noch einmal.';
        } finally { if (!disposed) primary.disabled = Boolean(file) && !supportsResultShare(file, browser); }
    };
    primary.addEventListener('click', async () => {
        if (busy || disposed) return;
        if (!file) { void generate(); return; }
        busy = true; primary.disabled = true; status.textContent = '';
        try {
            const outcome = await shareResult(file, browser);
            if (disposed) return;
            if (outcome === 'opened') status.textContent = 'An dein Teilen-Menü übergeben.';
            if (outcome === 'failed' || outcome === 'unavailable') status.textContent = 'Teilen ist gerade nicht verfügbar. Lade dein Bild herunter und teile es anschließend.';
        } finally { busy = false; if (!disposed) primary.disabled = false; }
    });
    opener.addEventListener('click', () => {
        if (disposed) return;
        openDialog(shareDialog);
        if (!file && !busy) {
            busy = true;
            void generate().finally(() => { busy = false; });
        }
    });
    section.querySelector('[data-share-close]').addEventListener('click', () => closeDialog(shareDialog));
    return dispose;
}
