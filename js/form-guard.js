export function createFormGuard(forms, status, onDiscard = () => {}) {
    const snapshots = new Map();
    const serialize = form => JSON.stringify(Array.from(form.elements, field =>
        [field.name || field.id, field.value, field.checked, field.files?.length || 0]));
    const dirty = form => snapshots.has(form) && snapshots.get(form) !== serialize(form);
    const refresh = () => {
        const changed = forms.some(dirty);
        status.textContent = changed ? 'Ungespeicherte Änderungen' : '';
        return changed;
    };
    forms.forEach(form => {
        snapshots.set(form, serialize(form));
        form.addEventListener('input', refresh);
        form.addEventListener('change', refresh);
    });
    window.addEventListener('beforeunload', event => {
        if (refresh()) { event.preventDefault(); event.returnValue = ''; }
    });
    return {
        refresh,
        clean(form) { snapshots.set(form, serialize(form)); refresh(); },
        confirm() {
            if (!refresh()) return true;
            if (!window.confirm('Ungespeicherte Änderungen verwerfen?')) return false;
            for (const form of forms) {
                const values = JSON.parse(snapshots.get(form));
                Array.from(form.elements).forEach((field, index) => {
                    if (field.type === 'file') field.value = '';
                    else if (values[index][1] !== null) field.value = values[index][1];
                    if (typeof values[index][2] === 'boolean') field.checked = values[index][2];
                });
                snapshots.set(form, serialize(form));
            }
            refresh();
            onDiscard();
            return true;
        }
    };
}
