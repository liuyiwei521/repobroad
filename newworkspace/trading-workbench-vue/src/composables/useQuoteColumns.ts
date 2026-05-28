import { computed, reactive } from 'vue';

const COLUMN_DEFAULTS = [240, 64, 96, 100, 130, 160, 88, 92];
const COLUMN_MINS = [120, 48, 64, 72, 80, 90, 64, 72];

// Module-level singleton so every quote table (header / summary / rows across
// all direction sections) stays column-aligned and shares one drag state.
const widths = reactive([...COLUMN_DEFAULTS]);

const columnTemplate = computed(() =>
  widths
    .map((width, index) => (index === 0 ? `minmax(${width}px, 1.2fr)` : `${width}px`))
    .join(' ')
);

const startResize = (index: number, event: PointerEvent) => {
  event.preventDefault();
  event.stopPropagation();
  const startX = event.clientX;
  const startWidth = widths[index];
  const minWidth = COLUMN_MINS[index];

  const onMove = (move: PointerEvent) => {
    widths[index] = Math.max(minWidth, startWidth + (move.clientX - startX));
  };
  const onUp = () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
};

export const useQuoteColumns = () => ({ columnTemplate, startResize });
