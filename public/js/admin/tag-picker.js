export function createTagPicker(root, getTags) {
    const value = root.querySelector('input[type="hidden"]');
    const entry = root.querySelector('[role="combobox"]');
    const chips = root.querySelector('.tag-picker__chips');
    const list = root.querySelector('[role="listbox"]');
    const status = root.querySelector('[role="status"]');
    let matches = [];
    let active = -1;
    const key = text => text.trim().toLocaleLowerCase('de');
    const selected = () => value.value.split(',').map(tag => tag.trim()).filter(Boolean);
    const available = () => [...new Map(getTags().filter(Boolean).map(tag => [key(tag), tag.trim()])).values()];
    const close = () => {
        list.hidden = true;
        entry.setAttribute('aria-expanded', 'false');
        entry.removeAttribute('aria-activedescendant');
        active = -1;
    };
    const sync = tags => {
        value.value = tags.join(', ');
        value.dispatchEvent(new Event('input', { bubbles: true }));
        render();
    };
    const add = text => {
        const tags = selected();
        for (const part of text.split(',')) {
            const tag = part.trim();
            if (!tag || tags.some(item => key(item) === key(tag))) continue;
            tags.push(available().find(item => key(item) === key(tag)) || tag);
        }
        entry.value = '';
        sync(tags);
        close();
    };
    function render() {
        chips.replaceChildren();
        for (const tag of selected()) {
            const chip = document.createElement('span');
            chip.className = 'tag-picker__chip';
            const text = document.createElement('span');
            text.textContent = tag;
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.setAttribute('form', '');
            remove.setAttribute('aria-label', `Tag ${tag} entfernen`);
            remove.textContent = '×';
            remove.addEventListener('click', () => {
                sync(selected().filter(item => key(item) !== key(tag)));
                status.textContent = `${tag} entfernt.`;
                entry.focus();
            });
            chip.append(text, remove);
            chips.append(chip);
        }
        close();
    }
    const suggest = () => {
        close();
        list.replaceChildren();
        const query = key(entry.value);
        matches = query.length < 2 ? [] : available().filter(tag => key(tag).includes(query)
            && !selected().some(item => key(item) === key(tag))).sort((a, b) => a.localeCompare(b, 'de')).slice(0, 8);
        for (const [index, tag] of matches.entries()) {
            const option = document.createElement('button');
            option.type = 'button';
            option.setAttribute('form', '');
            option.id = `${list.id}-${index}`;
            option.setAttribute('role', 'option');
            option.setAttribute('aria-selected', 'false');
            option.tabIndex = -1;
            option.textContent = tag;
            option.addEventListener('pointerdown', event => event.preventDefault());
            option.addEventListener('click', () => { add(tag); entry.focus(); });
            list.append(option);
        }
        list.hidden = !matches.length;
        entry.setAttribute('aria-expanded', String(Boolean(matches.length)));
        status.textContent = matches.length ? `${matches.length} Vorschläge verfügbar.` : '';
    };
    entry.addEventListener('input', () => {
        if (entry.value.includes(',')) add(entry.value);
        else suggest();
    });
    entry.addEventListener('focus', suggest);
    entry.addEventListener('blur', () => { if (entry.value.trim()) add(entry.value); close(); });
    entry.addEventListener('keydown', event => {
        if (['ArrowDown', 'ArrowUp'].includes(event.key) && matches.length && !list.hidden) {
            event.preventDefault();
            active = (active + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length;
            [...list.children].forEach((option, index) => option.setAttribute('aria-selected', String(index === active)));
            entry.setAttribute('aria-activedescendant', list.children[active].id);
        } else if (event.key === 'Enter') {
            event.preventDefault();
            if (active >= 0 && !list.hidden) add(matches[active]);
            else if (entry.value.trim()) add(entry.value);
        } else if (event.key === 'Escape') {
            event.preventDefault();
            close();
        }
    });
    return { render, reset() { entry.value = ''; render(); } };
}
