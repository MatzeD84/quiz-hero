export const createAdminApi = ({ apiUrl, getCsrfToken, setCsrfToken, fetchFn = window.fetch.bind(window) }) => async (action, payload = null) => {
    const headers = { 'Accept': 'application/json' };
    if (payload) {
        headers['Content-Type'] = 'application/json';
    }
    const csrfToken = getCsrfToken();
    if (csrfToken && action !== 'admin-login') {
        headers['X-Quiz-Hero-CSRF'] = csrfToken;
    }
    const options = payload ? {
        method: 'POST',
        headers,
        credentials: 'same-origin',
        body: JSON.stringify(payload)
    } : { headers, credentials: 'same-origin', cache: 'no-store' };
    let response, text;
    try { response = await fetchFn(apiUrl(action), { ...options, signal: AbortSignal.timeout(20000) }); text = await response.text(); }
    catch { return { ok: false, error: 'Verbindung fehlgeschlagen. Deine Eingaben bleiben erhalten. Bitte erneut versuchen.' }; }
    let data;
    try {
        data = JSON.parse(text);
    } catch (error) {
        return { ok: false, error: `Serverantwort ungültig (HTTP ${response.status}). Eingaben bleiben erhalten.` };
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) return { ok: false, error: 'Ungültige Serverantwort. Eingaben bleiben erhalten.' };
    if (!response.ok) return { ok: false, error: data.error || `Anfrage fehlgeschlagen (HTTP ${response.status}).` };
    if (data.csrfToken) {
        setCsrfToken(data.csrfToken);
    }
    return data;
};
