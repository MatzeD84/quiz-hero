export function renderQuestionWorldChoices(list, worlds, directIds, inheritedIds, categoryTitle) {
    list.replaceChildren(...worlds.map(world => {
        const label = document.createElement('label');
        const input = document.createElement('input');
        const direct = document.createElement('input');
        const inherited = inheritedIds.includes(world.id);
        direct.type = 'hidden'; direct.name = 'directWorldIds';
        direct.value = directIds.includes(world.id) ? world.id : '';
        input.type = 'checkbox'; input.name = 'worldIds'; input.value = world.id;
        input.checked = inherited || directIds.includes(world.id);
        input.disabled = inherited;
        input.addEventListener('change', () => { direct.value = input.checked ? world.id : ''; });
        label.append(input, document.createTextNode(`${world.title}${world.enabled ? '' : ' (inaktiv)'}${inherited ? ` (über Kategorie ${categoryTitle})` : ''}`), direct);
        return label;
    }));
}

export function selectedDirectQuestionWorlds(list) {
    return Array.from(list.querySelectorAll('input[type="hidden"]'), input => input.value).filter(Boolean);
}
