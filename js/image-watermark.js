const DEFAULT_LABEL = 'KI generiert';

export function applyImageWatermark(container, options = {}) {
    if (!container) return;

    const { label = DEFAULT_LABEL } = options;

    container.dataset.imageWatermark = label;
}

export function clearImageWatermark(container) {
    if (!container) return;

    delete container.dataset.imageWatermark;
}
