import { createSaveButtonState } from './save-button-state.js?v=dev';

export function createFormGuard(forms, status, onDiscard = () => {}) {
    const snapshots = new Map();
    const fields = form => Array.from(form.elements).filter(field => !['submit','button','reset','fieldset'].includes(field.type) && field.dataset?.saveIgnore !== 'true');
    const serialize = form => JSON.stringify(fields(form).map(field =>
        [field.name || field.id, field.value, field.checked, field.files?.length || 0]));
    const dirty = form => snapshots.has(form) && snapshots.get(form) !== serialize(form);
    const saveStates = [];
    const updateButtons = () => saveStates.forEach(state => state.update());
    const refresh = () => {
        const changed = forms.some(dirty);
        status.textContent = changed ? 'Ungespeicherte Änderungen' : '';
        updateButtons();
        return changed;
    };
    forms.forEach(form => {
        snapshots.set(form, serialize(form));
        saveStates.push(createSaveButtonState(form,{isChanged:()=>dirty(form)}));
        form.addEventListener('input', refresh);
        form.addEventListener('change', refresh);
    });
    window.addEventListener('beforeunload', event => {
        if (refresh()) { event.preventDefault(); event.returnValue = ''; }
    });
    return {
        refresh,
        updateButtons,
        clean(form) { snapshots.set(form, serialize(form)); refresh(); },
        confirm() {
            if (!refresh()) return true;
            if (!window.confirm('Ungespeicherte Änderungen verwerfen?')) return false;
            for (const form of forms) {
                const values = JSON.parse(snapshots.get(form));
                fields(form).forEach((field, index) => {
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
