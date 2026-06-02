import { nextTick, onMounted, onUnmounted, type Ref } from 'vue';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

interface Options {
  /** Selector for initial focus target inside container. Defaults to first focusable. */
  initialFocus?: string;
}

/**
 * Trap Tab / Shift+Tab within `container` while it's mounted, and restore
 * focus to wherever it came from on unmount. Auto-focuses the first
 * focusable element (or `options.initialFocus`) on mount.
 */
export function useFocusTrap(container: Ref<HTMLElement | null>, options: Options = {}) {
  let previousFocus: HTMLElement | null = null;

  const getFocusables = () => {
    const el = container.value;
    if (!el) return [] as HTMLElement[];
    return Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      .filter((node) => node.offsetParent !== null);
  };

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;
    const focusables = getFocusables();
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (event.shiftKey && (active === first || !container.value?.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || !container.value?.contains(active))) {
      event.preventDefault();
      first.focus();
    }
  };

  onMounted(async () => {
    previousFocus = document.activeElement as HTMLElement | null;
    await nextTick();
    const el = container.value;
    if (el) {
      const target = options.initialFocus
        ? el.querySelector<HTMLElement>(options.initialFocus)
        : getFocusables()[0];
      target?.focus();
    }
    document.addEventListener('keydown', onKeydown);
  });

  onUnmounted(() => {
    document.removeEventListener('keydown', onKeydown);
    previousFocus?.focus?.();
  });
}
