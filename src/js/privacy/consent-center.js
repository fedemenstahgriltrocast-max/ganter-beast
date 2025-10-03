import { createConsentManager } from './consent-manager.js';

const toBoolean = (value) => value === true || value === 'true' || value === 1 || value === '1';

const getChannelName = (toggle) => {
  if (!toggle) {
    return null;
  }
  if (toggle.dataset && toggle.dataset.consentToggle) {
    return toggle.dataset.consentToggle;
  }
  if (typeof toggle.getAttribute === 'function') {
    return toggle.getAttribute('data-consent-toggle');
  }
  return null;
};

const setAriaState = (toggle, checked) => {
  const shouldUseInstanceCheck = typeof HTMLElement !== 'undefined';
  if (shouldUseInstanceCheck && toggle instanceof HTMLElement) {
    toggle.setAttribute('aria-checked', String(Boolean(checked)));
    return;
  }
  if (typeof toggle?.setAttribute === 'function') {
    toggle.setAttribute('aria-checked', String(Boolean(checked)));
  }
};

const formatTimestamp = (isoString) => {
  if (!isoString) {
    return '';
  }
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return isoString;
  }
  return new Intl.DateTimeFormat('es-EC', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export function initializeConsentCenter({
  root = typeof document !== 'undefined' ? document : undefined,
  managerFactory = createConsentManager,
  managerOptions = {},
} = {}) {
  if (!root) {
    return null;
  }
  const container = root.querySelector('[data-consent-center]');
  if (!container) {
    return null;
  }

  const manager = managerFactory(managerOptions);
  const toggles = Array.from(container.querySelectorAll('[data-consent-toggle]'));
  const acceptAllButton = container.querySelector('[data-consent-accept]');
  const rejectAllButton = container.querySelector('[data-consent-reject]');
  const statusElement = root.querySelector('[data-consent-status]');
  const timestampElement = root.querySelector('[data-consent-timestamp]');

  const syncToggleState = (toggle, state) => {
    const channel = getChannelName(toggle);
    if (!channel) {
      return;
    }
    const nextValue = Boolean(state[channel]);
    toggle.checked = nextValue;
    setAriaState(toggle, nextValue);
    if (typeof toggle.closest === 'function') {
      const card = toggle.closest('[data-consent-card]');
      if (card) {
        card.classList.toggle('consent-card--active', nextValue);
      }
    }
  };

  const updateMeta = (state) => {
    if (statusElement) {
      statusElement.textContent = state.updatedAt
        ? 'Preferencias guardadas. Puedes ajustar cada categoría cuando lo necesites.'
        : 'Aún no has guardado tus preferencias. Ajusta las categorías y guarda los cambios.';
    }
    if (timestampElement) {
      if (state.updatedAt) {
        const formatted = formatTimestamp(state.updatedAt);
        timestampElement.textContent = formatted;
        if ('dateTime' in timestampElement) {
          timestampElement.dateTime = state.updatedAt;
        }
        if (typeof timestampElement.removeAttribute === 'function') {
          timestampElement.removeAttribute('hidden');
        }
      } else {
        timestampElement.textContent = '';
        if (typeof timestampElement.setAttribute === 'function') {
          timestampElement.setAttribute('hidden', '');
        }
      }
    }
  };

  const state = manager.state;
  toggles.forEach((toggle) => syncToggleState(toggle, state));
  updateMeta(state);

  toggles.forEach((toggle) => {
    const channel = getChannelName(toggle);
    if (!channel) {
      return;
    }
    toggle.addEventListener('change', () => {
      const next = toBoolean(toggle.checked);
      manager.setPreference(channel, next);
    });
  });

  if (acceptAllButton) {
    acceptAllButton.addEventListener('click', (event) => {
      event.preventDefault?.();
      manager.acceptAll();
    });
  }

  if (rejectAllButton) {
    rejectAllButton.addEventListener('click', (event) => {
      event.preventDefault?.();
      manager.rejectAll();
    });
  }

  const unsubscribe = manager.subscribe((nextState) => {
    toggles.forEach((toggle) => syncToggleState(toggle, nextState));
    updateMeta(nextState);
  });

  return {
    manager,
    destroy: () => {
      unsubscribe?.();
    },
  };
}
