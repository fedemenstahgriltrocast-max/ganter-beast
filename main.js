(function () {
  const html = document.documentElement;
  const copyright = document.querySelector('#copyrightYear');
  const orderSection = document.querySelector('.order');
  const orderButton = document.querySelector('#orderButton');
  const chipButtons = Array.from(document.querySelectorAll('.chip'));
  const fabLanguage = document.querySelector('#fabLanguage');
  const fabTheme = document.querySelector('#fabTheme');
  const fabChat = document.querySelector('#fabChat');
  const fabPay = document.querySelector('#fabPay');
  const fabMenus = Array.from(document.querySelectorAll('.fab-menu'));
  const drawers = Array.from(document.querySelectorAll('.drawer'));
  const languageToggle = document.querySelector('#languageToggle');
  const themeToggle = document.querySelector('#themeToggle');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const carousel = document.querySelector('[data-carousel]');
  const carouselTrack = document.querySelector('.product-carousel__track');
  const carouselViewport = document.querySelector('.product-carousel__viewport');
  const carouselPrev = document.querySelector('.carousel__control--prev');
  const carouselNext = document.querySelector('.carousel__control--next');
  const accordionTrigger = document.querySelector('.accordion__trigger');
  const accordionContent = document.querySelector('.accordion__content');
  const productCards = Array.from(document.querySelectorAll('.product-card'));
  const summaryList = document.querySelector('[data-summary-items]');
  const summaryEmpty = document.querySelector('#orderSummaryEmpty');
  const summaryTotals = {
    subtotal: document.querySelector('[data-summary="subtotal"]'),
    tax: document.querySelector('[data-summary="tax"]'),
    delivery: document.querySelector('[data-summary="delivery"]'),
    total: document.querySelector('[data-summary="total"]'),
  };
  const paymentList = document.querySelector('[data-payment-items]');
  const paymentEmpty = document.querySelector('[data-payment-empty]');
  const paymentTotal = document.querySelector('[data-payment-total]');
  const smallScreenQuery = window.matchMedia('(max-width: 767px)');
  const largeScreenQuery = window.matchMedia('(min-width: 900px)');
  const draggableDrawerIds = new Set(['chatDrawer', 'payDrawer']);
  const fabButtons = [fabLanguage, fabTheme, fabChat, fabPay].filter(Boolean);
  const fabLabelTimers = new WeakMap();
  const drawerPositions = new Map();
  const TAX_RATE = 0.12;
  const DELIVERY_FEE = 1.5;
  const cart = new Map();
  let currentSlideIndex = 0;
  let maxSlideIndex = 0;
  let currentLanguage = html.lang === 'es' ? 'es' : 'en';
  const translations = {
    en: {
      headline: 'Marxia Café y Bocaditos',
      tagline: 'Breakfasts, pastries, and delivery throughout Guayaquil.',
      promise: 'Fresh flavors every morning.',
      orderNow: 'Order now',
      orderTitle: 'Our menu',
      orderSubtitle: 'Tap to explore our handcrafted favorites.',
      insightsTitle: 'Experience dashboard',
      insightsSubtitle: '',
      sentimentTitle: 'End consumer sentiment',
      sentimentUpdated: 'Updated every 30 minutes',
      sentimentScore: 'Average rating',
      sentimentReviews: '1,248 verified reviews',
      visitorsTitle: 'Visitors',
      visitorsMeta: 'Foot & site traffic',
      visitorsCaption: 'Today 320 · This month 8,450 · Last year 92,300',
      salesTitle: 'Online sales',
      salesMeta: 'Room to grow',
      salesCaption: 'Today $620 · This month $18,400 · Last year $212,000',
      ordersTitle: 'Order details',
      ordersMeta: 'Secure checkout enabled',
      ordersSubtotal: 'Subtotal',
      ordersTax: 'VAT 12%',
      ordersDelivery: 'Delivery',
      ordersTotal: 'Total',
      orderItems: 'Selected items',
      orderSummaryEmpty: 'Your basket is empty. Add menu favorites to see them here.',
      deliveryTitle: 'Delivery time',
      checkout: 'Secure checkout',
      carouselPrev: 'Previous favorites',
      carouselNext: 'Next favorites',
      addToOrder: '+ Add',
      removeFromOrder: '- Remove',
      inCart: 'In cart: {count}',
      contactTitle: 'We deliver to',
      contactAreas: 'Saucés · Alborada · Guayacanes · Tarazana · Brisas del Río',
      contactWhatsApp: 'WhatsApp',
      rights: 'All rights reserved.',
      chatTitle: 'Live chat',
      chatWelcome: 'Hola 👋 How can we help you today?',
      chatLabel: 'Message',
      chatSend: 'Send',
      chatPlaceholder: 'Type your message…',
      payTitle: 'Checkout preview',
      payNow: 'Pay now',
      fabLanguageLabel: 'Language options',
      fabThemeLabel: 'Theme options',
      fabChatLabel: 'Live chat',
      fabPayLabel: 'Payment summary',
      operationsTitle: 'Operational readiness checklist',
      operationsSubtitle: 'Confirm the essentials beyond cybersecurity before launch.',
      operationsMenu: 'Standardize menu documentation, allergen labeling, and daily prep guides.',
      operationsSuppliers: 'Align supplier contracts, delivery windows, and verified backup vendors.',
      operationsService: 'Train staff on service scripts, accessibility etiquette, and escalation paths.',
      operationsMarketing: 'Schedule neighborhood marketing, loyalty pushes, and community partnerships.',
    },
    es: {
      headline: 'Marxia Café y Bocaditos',
      tagline: 'Desayunos, bocaditos y envíos en el Norte de Guayaquil.',
      promise: 'Sabores frescos cada mañana.',
      orderNow: 'Ordenar ahora',
      orderTitle: 'Nuestro menú',
      orderSubtitle: 'Explora nuestros favoritos artesanales.',
      insightsTitle: 'Panel de experiencia',
      insightsSubtitle: '',
      sentimentTitle: 'Comparte tu Experiencia',
      sentimentUpdated: 'Actualizado cada 30 minutos',
      sentimentScore: 'Calificación promedio',
      sentimentReviews: '1.248 reseñas verificadas',
      visitorsTitle: 'Visitantes',
      visitorsMeta: 'Tráfico físico y digital',
      visitorsCaption: 'Hoy 320 · Este mes 8.450 · Último año 92.300',
      salesTitle: 'Ventas en línea',
      salesMeta: 'Espacio para crecer',
      salesCaption: 'Hoy $620 · Este mes $18.400 · Último año $212.000',
      ordersTitle: 'Detalles del pedido',
      ordersMeta: 'Checkout seguro activado',
      ordersSubtotal: 'Subtotal',
      ordersTax: 'IVA 12%',
      ordersDelivery: 'Envío',
      ordersTotal: 'Total',
      orderItems: 'Artículos seleccionados',
      orderSummaryEmpty: 'Tu pedido está vacío. Agrega favoritos del menú para verlos aquí.',
      deliveryTitle: 'Tiempo de entrega',
      checkout: 'Checkout seguro',
      carouselPrev: 'Favoritos anteriores',
      carouselNext: 'Más favoritos',
      addToOrder: '+ Agregar',
      removeFromOrder: '- Quitar',
      inCart: 'En carrito: {count}',
      contactTitle: 'Entregamos en',
      contactAreas: 'Saucés · Alborada · Guayacanes · Tarazana · Brisas del Río',
      contactWhatsApp: 'WhatsApp',
      rights: 'Todos los derechos reservados.',
      chatTitle: 'Chat en vivo',
      chatWelcome: 'Hola 👋 ¿Cómo podemos ayudarte hoy?',
      chatLabel: 'Mensaje',
      chatSend: 'Enviar',
      chatPlaceholder: 'Escribe tu mensaje…',
      payTitle: 'Resumen de pago',
      payNow: 'Pagar ahora',
      fabLanguageLabel: 'Opciones de idioma',
      fabThemeLabel: 'Opciones de tema',
      fabChatLabel: 'Chat en vivo',
      fabPayLabel: 'Resumen de pago',
      operationsTitle: 'Lista de verificación operativa',
      operationsSubtitle: 'Confirma lo esencial más allá de la ciberseguridad antes del lanzamiento.',
      operationsMenu: 'Estandariza la documentación del menú, el etiquetado de alérgenos y las guías de preparación diaria.',
      operationsSuppliers: 'Alinea contratos con proveedores, ventanas de entrega y proveedores de respaldo verificados.',
      operationsService: 'Capacita al equipo en guiones de servicio, etiqueta de accesibilidad y rutas de escalamiento.',
      operationsMarketing: 'Programa marketing barrial, campañas de fidelización y alianzas comunitarias.',
    },
  };

  const isSmallScreen = () => smallScreenQuery.matches;
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const getLocale = () => (currentLanguage === 'es' ? 'es-EC' : 'en-US');

  const formatCurrency = (value) => {
    const formatter = new Intl.NumberFormat(getLocale(), {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    });
    return formatter.format(Math.max(0, Number.isFinite(value) ? value : 0));
  };

  const getTranslation = (key) => {
    const active = translations[currentLanguage] || translations.en;
    return active[key] ?? translations.en[key] ?? '';
  };

  const updateFabLabels = () => {
    fabButtons.forEach((button) => {
      if (!(button instanceof HTMLElement)) {
        return;
      }
      const key = button.getAttribute('data-fab-label');
      if (!key) {
        return;
      }
      const label = getTranslation(key);
      if (!label) {
        return;
      }
      button.dataset.label = label;
      button.setAttribute('aria-label', label);
    });
  };

  const showFabLabel = (button, duration = 1500) => {
    if (!(button instanceof HTMLElement)) {
      return;
    }
    button.classList.add('fab--show-label');
    const existingTimer = fabLabelTimers.get(button);
    if (existingTimer) {
      window.clearTimeout(existingTimer);
    }
    const timeout = window.setTimeout(() => {
      button.classList.remove('fab--show-label');
      fabLabelTimers.delete(button);
    }, duration);
    fabLabelTimers.set(button, timeout);
  };

  const updateProductPrices = () => {
    productCards.forEach((card) => {
      const priceNode = card.querySelector('.product-card__price');
      const price = Number.parseFloat(card.dataset.price || '0');
      if (!priceNode || Number.isNaN(price)) {
        return;
      }
      priceNode.textContent = formatCurrency(price);
    });
  };

  const updateQuantityLabel = (card, quantity) => {
    const quantityNode = card.querySelector('.product-card__quantity');
    if (!quantityNode) {
      return;
    }
    quantityNode.setAttribute('data-i18n-count', String(quantity));
    const template = getTranslation('inCart') || 'In cart: {count}';
    quantityNode.textContent = template.replace('{count}', quantity);
  };

  const updateCartDisplay = () => {
    const items = Array.from(cart.entries())
      .map(([name, data]) => ({ name, ...data }))
      .filter((item) => item.quantity > 0);

    const hasItems = items.length > 0;
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * TAX_RATE;
    const delivery = hasItems ? DELIVERY_FEE : 0;
    const total = subtotal + tax + delivery;

    if (summaryList) {
      summaryList.innerHTML = '';
      items.forEach((item) => {
        const li = document.createElement('li');
        const label = document.createElement('span');
        label.textContent = `${item.quantity}× ${item.name}`;
        const price = document.createElement('span');
        price.textContent = formatCurrency(item.price * item.quantity);
        li.append(label, price);
        summaryList.append(li);
      });
      summaryList.toggleAttribute('hidden', !hasItems);
    }

    if (summaryEmpty) {
      summaryEmpty.toggleAttribute('hidden', hasItems);
    }

    if (paymentList) {
      paymentList.innerHTML = '';
      items.forEach((item) => {
        const li = document.createElement('li');
        const label = document.createElement('span');
        label.textContent = `${item.quantity}× ${item.name}`;
        const price = document.createElement('span');
        price.textContent = formatCurrency(item.price * item.quantity);
        li.append(label, price);
        paymentList.append(li);
      });
      paymentList.toggleAttribute('hidden', !hasItems);
    }

    if (paymentEmpty) {
      paymentEmpty.toggleAttribute('hidden', hasItems);
    }

    if (summaryTotals.subtotal) {
      summaryTotals.subtotal.textContent = formatCurrency(subtotal);
    }
    if (summaryTotals.tax) {
      summaryTotals.tax.textContent = formatCurrency(tax);
    }
    if (summaryTotals.delivery) {
      summaryTotals.delivery.textContent = formatCurrency(delivery);
    }
    if (summaryTotals.total) {
      summaryTotals.total.textContent = formatCurrency(total);
    }
    if (paymentTotal) {
      paymentTotal.textContent = formatCurrency(total);
    }

    productCards.forEach((card) => {
      const name = card.dataset.name;
      const entry = name ? cart.get(name) : undefined;
      const quantity = entry ? entry.quantity : 0;
      updateQuantityLabel(card, quantity);
      const removeButton = card.querySelector('[data-cart="remove"]');
      if (removeButton) {
        removeButton.toggleAttribute('disabled', quantity === 0);
      }
    });
  };

  const modifyCart = (name, delta) => {
    const entry = cart.get(name);
    if (!entry) {
      return;
    }
    entry.quantity = Math.max(0, entry.quantity + delta);
    cart.set(name, entry);
    updateCartDisplay();
  };

  const initializeCart = () => {
    productCards.forEach((card) => {
      const name = card.dataset.name;
      const price = Number.parseFloat(card.dataset.price || '0');
      if (!name || Number.isNaN(price)) {
        return;
      }
      if (!cart.has(name)) {
        cart.set(name, { price, quantity: 0, card });
      }

      const addButton = card.querySelector('[data-cart="add"]');
      const removeButton = card.querySelector('[data-cart="remove"]');

      if (addButton) {
        addButton.addEventListener('click', () => modifyCart(name, 1));
      }

      if (removeButton) {
        removeButton.addEventListener('click', () => modifyCart(name, -1));
        removeButton.setAttribute('disabled', 'true');
      }

      updateQuantityLabel(card, 0);
    });

    updateProductPrices();
    updateCartDisplay();
  };

  const updateCarousel = () => {
    if (!carousel || !carouselTrack || !carouselViewport || productCards.length === 0) {
      return;
    }
    const styles = window.getComputedStyle(carouselTrack);
    const gapValue = parseFloat(styles.columnGap || styles.gap || '0');
    const cardWidth = productCards[0].getBoundingClientRect().width;
    const viewportWidth = carouselViewport.getBoundingClientRect().width;
    const totalSlideWidth = cardWidth + gapValue;
    if (!Number.isFinite(totalSlideWidth) || totalSlideWidth <= 0) {
      return;
    }
    const visibleSlides = Math.max(1, Math.floor((viewportWidth + gapValue) / totalSlideWidth));
    maxSlideIndex = Math.max(0, productCards.length - visibleSlides);
    currentSlideIndex = Math.min(currentSlideIndex, maxSlideIndex);
    const offset = currentSlideIndex * totalSlideWidth;
    carouselTrack.style.transform = `translateX(-${offset}px)`;
    if (carouselPrev) {
      carouselPrev.toggleAttribute('disabled', currentSlideIndex === 0);
    }
    if (carouselNext) {
      carouselNext.toggleAttribute('disabled', currentSlideIndex >= maxSlideIndex);
    }
  };
  const setCopyright = () => {
    if (copyright) {
      copyright.textContent = String(new Date().getFullYear());
    }
  };

  const applyTheme = (theme) => {
    const nextTheme = theme === 'dark' ? 'dark' : 'light';
    html.dataset.theme = nextTheme;
    localStorage.setItem('marxia-theme', nextTheme);
    if (themeToggle) {
      const isDark = nextTheme === 'dark';
      themeToggle.textContent = isDark ? 'Light' : 'Dark';
      themeToggle.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
      themeToggle.setAttribute('aria-pressed', String(isDark));
    }
  };

  const applyLanguage = (lang) => {
    const nextLang = lang === 'es' ? 'es' : 'en';
    currentLanguage = nextLang;
    html.lang = nextLang;
    localStorage.setItem('marxia-lang', nextLang);
    if (languageToggle) {
      const isSpanish = nextLang === 'es';
      languageToggle.textContent = isSpanish ? 'EN' : 'ES';
      languageToggle.setAttribute(
        'aria-label',
        isSpanish ? 'Idioma: Español (cambiar a inglés)' : 'Language: English (switch to Spanish)'
      );
      languageToggle.setAttribute('aria-pressed', String(isSpanish));
    }

    const dict = translations[nextLang];
    document.querySelectorAll('[data-i18n]').forEach((node) => {
      const key = node.getAttribute('data-i18n');
      if (!key) return;
      const translation = dict[key];
      if (translation === undefined) return;

      const attrTarget = node.getAttribute('data-i18n-attr');
      if (attrTarget) {
        node.setAttribute(attrTarget, translation);
      }

      if (node.dataset.i18nSkipText === 'true') {
        return;
      }

      if (node.hasAttribute('data-i18n-count')) {
        const count = Number(node.getAttribute('data-i18n-count') || '0');
        node.textContent = translation.replace('{count}', count);
        return;
      }

      if (node.querySelector('a') && key === 'contactWhatsApp') {
        const prefixNode = node.childNodes[0];
        if (prefixNode) {
          const prefixText = translation ? `${translation} ` : '';
          prefixNode.textContent = prefixText;
        }
      } else {
        node.textContent = translation;
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
      const key = node.getAttribute('data-i18n-placeholder');
      if (key && dict[key]) {
        node.setAttribute('placeholder', dict[key]);
      }
    });

    updateFabLabels();
    updateProductPrices();
    updateCartDisplay();
  };

  const restorePreferences = () => {
    const savedTheme = localStorage.getItem('marxia-theme');
    const savedLang = localStorage.getItem('marxia-lang');
    if (savedTheme) {
      applyTheme(savedTheme);
    } else if (prefersDark) {
      applyTheme('dark');
    } else {
      applyTheme('light');
    }
    if (savedLang) {
      applyLanguage(savedLang);
    } else {
      applyLanguage('en');
    }
  };

  const closeMenus = (exception) => {
    fabMenus.forEach((menu) => {
      if (menu !== exception) {
        menu.dataset.open = 'false';
        const controller = document.querySelector(`[aria-controls="${menu.id}"]`);
        if (controller) {
          controller.setAttribute('aria-expanded', 'false');
        }
      }
    });
  };

  const toggleMenu = (menu, controller) => {
    if (!menu || !controller) return;
    const open = menu.dataset.open === 'true';
    closeMenus(open ? null : menu);
    menu.dataset.open = String(!open);
    controller.setAttribute('aria-expanded', String(!open));
  };

  const moveDrawerTo = (drawer, position) => {
    if (!drawer || !largeScreenQuery.matches) {
      return;
    }
    const content = drawer.querySelector('.drawer__content');
    if (!(content instanceof HTMLElement)) {
      return;
    }
    const rect = content.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const margin = 16;
    const maxLeft = window.innerWidth - width - margin;
    const maxTop = window.innerHeight - height - margin;
    const left = clamp(position.left, margin, Math.max(margin, maxLeft));
    const top = clamp(position.top, margin, Math.max(margin, maxTop));
    content.style.left = `${left}px`;
    content.style.top = `${top}px`;
    content.style.right = 'auto';
    content.style.bottom = 'auto';
    content.style.transform = 'none';
    content.classList.add('drawer__content--floating');
    drawerPositions.set(drawer.id, { top, left });
  };

  const ensureFloatingPosition = (drawer) => {
    if (!drawer || !largeScreenQuery.matches || drawer.getAttribute('aria-hidden') === 'true') {
      return;
    }
    const content = drawer.querySelector('.drawer__content');
    if (!(content instanceof HTMLElement)) {
      return;
    }
    content.classList.add('drawer__content--floating');
    requestAnimationFrame(() => {
      const rect = content.getBoundingClientRect();
      const stored = drawerPositions.get(drawer.id);
      const defaultTop = Math.max(16, (window.innerHeight - rect.height) / 2);
      const defaultLeft = Math.max(16, (window.innerWidth - rect.width) / 2);
      moveDrawerTo(drawer, {
        top: stored?.top ?? defaultTop,
        left: stored?.left ?? defaultLeft,
      });
    });
  };

  const resetDrawerPosition = (drawer) => {
    const content = drawer?.querySelector('.drawer__content');
    if (!(content instanceof HTMLElement)) {
      return;
    }
    content.classList.remove('drawer__content--floating');
    content.style.left = '';
    content.style.top = '';
    content.style.right = '';
    content.style.bottom = '';
    content.style.transform = '';
    delete content.dataset.dragging;
  };

  const applyDrawerLayout = () => {
    if (!largeScreenQuery.matches) {
      drawers.forEach((drawer) => resetDrawerPosition(drawer));
      drawerPositions.clear();
      return;
    }
    drawers.forEach((drawer) => {
      if (draggableDrawerIds.has(drawer.id) && drawer.getAttribute('aria-hidden') === 'false') {
        ensureFloatingPosition(drawer);
      }
    });
  };

  const setupDraggableDrawer = (drawer) => {
    if (!draggableDrawerIds.has(drawer.id)) {
      return;
    }
    const content = drawer.querySelector('.drawer__content');
    const handle = drawer.querySelector('.drawer__header');
    if (!(content instanceof HTMLElement) || !(handle instanceof HTMLElement)) {
      return;
    }
    let activePointerId = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    const stopDragging = (event) => {
      if (activePointerId === null || (event && event.pointerId !== activePointerId)) {
        return;
      }
      try {
        if (event && typeof handle.releasePointerCapture === 'function') {
          handle.releasePointerCapture(activePointerId);
        }
      } catch (error) {
        // Ignore release errors when pointer capture is already cleared.
      }
      activePointerId = null;
      dragOffsetX = 0;
      dragOffsetY = 0;
      delete content.dataset.dragging;
    };

    handle.addEventListener('pointerdown', (event) => {
      if (!largeScreenQuery.matches || drawer.getAttribute('aria-hidden') === 'true') {
        return;
      }
      if (typeof event.button === 'number' && event.button !== 0) {
        return;
      }
      activePointerId = event.pointerId;
      if (typeof handle.setPointerCapture === 'function') {
        handle.setPointerCapture(activePointerId);
      }
      const rect = content.getBoundingClientRect();
      dragOffsetX = event.clientX - rect.left;
      dragOffsetY = event.clientY - rect.top;
      content.dataset.dragging = 'true';
      event.preventDefault();
    });

    handle.addEventListener('pointermove', (event) => {
      if (!largeScreenQuery.matches || activePointerId === null || event.pointerId !== activePointerId) {
        return;
      }
      moveDrawerTo(drawer, {
        left: event.clientX - dragOffsetX,
        top: event.clientY - dragOffsetY,
      });
    });

    handle.addEventListener('pointerup', (event) => {
      if (event.pointerId !== activePointerId) {
        return;
      }
      stopDragging(event);
    });

    handle.addEventListener('pointercancel', (event) => {
      if (event.pointerId !== activePointerId) {
        return;
      }
      stopDragging(event);
    });
  };

  const openDrawer = (drawer) => {
    if (!drawer) return;
    drawer.setAttribute('aria-hidden', 'false');
    if (largeScreenQuery.matches && draggableDrawerIds.has(drawer.id)) {
      ensureFloatingPosition(drawer);
    }
    const closeButton = drawer.querySelector('[data-close-drawer]');
    if (closeButton) {
      closeButton.focus();
    }
  };

  const closeDrawer = (drawer) => {
    if (!drawer) return;
    drawer.setAttribute('aria-hidden', 'true');
  };

  const toggleFabDrawer = (fab, drawerId) => {
    if (!(fab instanceof HTMLElement)) {
      return;
    }
    const drawer = document.querySelector(`#${drawerId}`);
    if (!(drawer instanceof HTMLElement)) {
      return;
    }
    const isOpen = drawer.getAttribute('aria-hidden') === 'false';

    const toggle = () => {
      if (isOpen) {
        closeDrawer(drawer);
      } else {
        openDrawer(drawer);
      }
      fab.setAttribute('aria-pressed', String(!isOpen));
    };

    if (isSmallScreen() && !isOpen) {
      showFabLabel(fab);
      window.setTimeout(toggle, 220);
    } else {
      toggle();
      if (isSmallScreen()) {
        showFabLabel(fab);
      }
    }
  };

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target === themeToggle) {
      const nextTheme = html.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
    }

    if (target === languageToggle) {
      const nextLang = html.lang === 'es' ? 'en' : 'es';
      applyLanguage(nextLang);
    }

    if (target.matches('[data-close-drawer]')) {
      const drawer = target.closest('.drawer');
      closeDrawer(drawer);
      if (drawer?.id === 'chatDrawer') {
        fabChat?.setAttribute('aria-pressed', 'false');
      }
      if (drawer?.id === 'payDrawer') {
        fabPay?.setAttribute('aria-pressed', 'false');
      }
    }

    if (target === fabLanguage) {
      if (isSmallScreen()) {
        showFabLabel(fabLanguage);
      }
      toggleMenu(document.querySelector('#fabLanguageMenu'), fabLanguage);
    } else if (target === fabTheme) {
      if (isSmallScreen()) {
        showFabLabel(fabTheme);
      }
      toggleMenu(document.querySelector('#fabThemeMenu'), fabTheme);
    } else if (target === fabChat) {
      toggleFabDrawer(fabChat, 'chatDrawer');
    } else if (target === fabPay) {
      toggleFabDrawer(fabPay, 'payDrawer');
    } else if (!target.closest('.fab-menu') && !target.closest('.fab')) {
      closeMenus();
    }
    if (target.closest('.fab-menu') && target.dataset.action) {
      closeMenus();
    }
  });

  drawers.forEach((drawer) => {
    setupDraggableDrawer(drawer);
    drawer.addEventListener('click', (event) => {
      if (event.target === drawer) {
        closeDrawer(drawer);
        fabChat?.setAttribute('aria-pressed', 'false');
        fabPay?.setAttribute('aria-pressed', 'false');
      }
    });
  });

  if (typeof largeScreenQuery.addEventListener === 'function') {
    largeScreenQuery.addEventListener('change', applyDrawerLayout);
  } else if (typeof largeScreenQuery.addListener === 'function') {
    largeScreenQuery.addListener(applyDrawerLayout);
  }

  if (accordionTrigger && accordionContent) {
    const expanded = accordionTrigger.getAttribute('aria-expanded') === 'true';
    accordionContent.hidden = !expanded;
    const refreshCarouselLayout = () => {
      window.requestAnimationFrame(() => {
        updateCarousel();
      });
    };

    accordionTrigger.addEventListener('click', () => {
      const isExpanded = accordionTrigger.getAttribute('aria-expanded') === 'true';
      const nextExpanded = !isExpanded;
      accordionTrigger.setAttribute('aria-expanded', String(nextExpanded));
      accordionContent.hidden = !nextExpanded;
      if (nextExpanded) {
        currentSlideIndex = 0;
        refreshCarouselLayout();
      }
    });

    if (!accordionContent.hidden) {
      refreshCarouselLayout();
    }
  }

  if (carouselPrev) {
    carouselPrev.addEventListener('click', () => {
      if (currentSlideIndex > 0) {
        currentSlideIndex -= 1;
        updateCarousel();
      }
    });
  }

  if (carouselNext) {
    carouselNext.addEventListener('click', () => {
      if (currentSlideIndex < maxSlideIndex) {
        currentSlideIndex += 1;
        updateCarousel();
      }
    });
  }

  window.addEventListener('resize', () => {
    updateCarousel();
    if (largeScreenQuery.matches) {
      drawers.forEach((drawer) => {
        if (!draggableDrawerIds.has(drawer.id) || drawer.getAttribute('aria-hidden') === 'true') {
          return;
        }
        const stored = drawerPositions.get(drawer.id);
        if (stored) {
          moveDrawerTo(drawer, stored);
        } else {
          ensureFloatingPosition(drawer);
        }
      });
    }
  });

  chipButtons.forEach((chip) => {
    chip.addEventListener('click', () => {
      chipButtons.forEach((btn) => btn.setAttribute('aria-pressed', String(btn === chip)));
    });
  });

  if (orderButton && orderSection) {
    orderButton.addEventListener('click', () => {
      orderSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  initializeCart();
  restorePreferences();
  applyDrawerLayout();
  updateCarousel();
  setCopyright();
})();
