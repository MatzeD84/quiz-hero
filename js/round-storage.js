const KEY = 'quiz-hero-round-v1';
const signature = question => JSON.stringify([question.id, question.question, question.answers, question.correct, question.difficulty, question.imageUrl]);
export function saveRound(state, storage) {
    try {
        storage ??= sessionStorage;
        storage.setItem(KEY, JSON.stringify({
            version: 1, savedAt: Date.now(), categoryId: state.activeCategoryId, tag: state.activeTag,
            sequence: state.currentSequence.map(question => ({ signature: signature(question), selected: question.selectedAnswers || [] })),
            index: state.currentIndex
        }));
        return true;
    } catch { return false; }
}
export function clearRound(storage) { try { (storage ?? sessionStorage).removeItem(KEY); } catch { /* Storage may be disabled. */ } }
export function readRound(state, storage) {
    try {
        storage ??= sessionStorage;
        const saved = JSON.parse(storage.getItem(KEY));
        if (!saved || saved.version !== 1 || !Number.isFinite(saved.savedAt) || saved.savedAt > Date.now() || Date.now() - saved.savedAt > 86400000 || !Array.isArray(saved.sequence) || !saved.sequence.length || !Number.isInteger(saved.index) || saved.index < 0 || saved.index >= saved.sequence.length) return null;
        const pool = saved.categoryId ? state.getCategory(saved.categoryId)?.questions : state.tagIndex.get(saved.tag)?.map(entry => entry.question);
        if (!pool || (saved.categoryId && state.getCategory(saved.categoryId).enabled === false)) return null;
        const used = new Set();
        const sequence = saved.sequence.map(item => {
            const question = pool.find(question => signature(question) === item.signature);
            if (!question || used.has(item.signature) || !Array.isArray(item.selected) || item.selected.length > 2 || new Set(item.selected).size !== item.selected.length || item.selected.some(index => !Number.isInteger(index) || index < 0 || index > 3) || (item.selected.length > 1 && item.selected[0] === question.correct)) throw new Error('Invalid round');
            used.add(item.signature);
            return { ...question, selectedAnswers: item.selected };
        });
        if (sequence.slice(saved.index + 1).some(question => question.selectedAnswers.length)) return null;
        return { ...saved, sequence };
    } catch { return null; }
}
