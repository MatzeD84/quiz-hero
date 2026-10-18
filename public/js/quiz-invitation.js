// Invitations identify a selection and round length, never accounts, answers or a fixed question set.
export function createQuizInvitation({ categoryId = '', tagId = '', total, label = '' }, origin = 'https://quiz-hero.de') {
    if (!Number.isInteger(total) || total < 1 || total > 10000 || (!categoryId && !tagId)) return null;
    const url = new URL('/', origin);
    url.searchParams.set(categoryId ? 'category' : 'tag', categoryId || tagId);
    url.searchParams.set('invite', '1');
    url.searchParams.set('count', String(total));
    const selection = String(label).replace(/\s+/g, ' ').trim().slice(0, 100);
    return {
        url: url.href,
        title: 'Spiel mit bei Quiz-Hero!',
        text: `Du wurdest herausgefordert. ${total} ${total === 1 ? 'Frage' : 'Fragen'}${selection ? ` zum Quiz „${selection}“` : ' bei Quiz-Hero'}. Bist du bereit?`,
        label: selection, count: total
    };
}

export function readQuizInvitation(params) {
    const rawCount = params.get('count');
    if (params.get('invite') !== '1' || !/^[1-9]\d{0,4}$/.test(rawCount || '')) return null;
    return createQuizInvitation({ categoryId: params.get('category'), tagId: params.get('tag'), total: Number(rawCount) });
}

export async function shareQuizInvitation(invitation, browser = globalThis.navigator) {
    if (!invitation || typeof browser?.share !== 'function') return 'unavailable';
    const { title, text, url } = invitation;
    try {
        if (typeof browser.canShare === 'function' && !browser.canShare({ title, text, url })) return 'unavailable';
        await browser.share({ title, text, url });
        return 'opened';
    } catch (error) { return error?.name === 'AbortError' ? 'cancelled' : 'failed'; }
}
