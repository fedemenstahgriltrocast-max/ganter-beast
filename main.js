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
  const toggles = Array.from(document.querySelectorAll('[data-action="theme"], [data-action="language"]'));
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
  const productCards = Array.from(document.querySelectorAll('.product-card'));
  const accordionTrigger = document.querySelector('.accordion__trigger');
  const accordionContent = document.querySelector('.accordion__content');
  const carousel = document.querySelector('[data-carousel]');
  const carouselTrack = carousel ? carousel.querySelector('.product-carousel__track') : null;
  const carouselViewport = carousel ? carousel.querySelector('.product-carousel__viewport') : null;
  const carouselPrev = carousel ? carousel.querySelector('.carousel__control--prev') : null;
  const carouselNext = carousel ? carousel.querySelector('.carousel__control--next') : null;

  const TAX_RATE = 0.12;
  const DELIVERY_FEE = 3;
  let currentLanguage = 'en';
  let maxSlideIndex = 0;
  let currentSlideIndex = 0;
  const cart = new Map();

  const translations = {
    en: {
      headline: 'Marxia Café y Bocaditos',
      tagline: 'Breakfasts, pastries, and delivery throughout Guayaquil.',
      promise: 'Fresh flavors, curated menus, secure checkout.',
      orderNow: 'Order now',
      orderTitle: 'Our seasonal best sellers',
      orderSubtitle: 'Tap on your favorites to build the perfect breakfast spread.',
      insightsTitle: 'Experience dashboard',
      insightsSubtitle: 'Monitor sentiment, visitors, and online sales in real time.',
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
      orderSummaryEmpty: 'Your basket is empty. Add seasonal favorites to see them here.',
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
      paySecurity: 'Secure payments protected with PCI DSS compliant encryption.',
      payNow: 'Pay now',
    },
    es: {
      headline: 'Marxia Café y Bocaditos',
      tagline: 'Desayunos, bocaditos y envíos en todo Guayaquil.',
      promise: 'Sabores frescos, menús curados y pago seguro.',
      orderNow: 'Ordenar ahora',
      orderTitle: 'Nuestros favoritos de temporada',
      orderSubtitle: 'Selecciona tus preferidos para armar el desayuno ideal.',
      insightsTitle: 'Panel de experiencia',
      insightsSubtitle: 'Monitoriza el sentimiento, visitantes y ventas online en tiempo real.',
      sentimentTitle: 'Sentimiento del consumidor final',
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
      orderSummaryEmpty: 'Tu pedido está vacío. Agrega favoritos de temporada para verlos aquí.',
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
      paySecurity: 'Pagos protegidos con cifrado compatible PCI DSS.',
      payNow: 'Pagar ahora',
    },
  };

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
    toggles
      .filter((toggle) => toggle.dataset.action === 'theme')
      .forEach((toggle) => {
        const isActive = toggle.dataset.theme === nextTheme;
        toggle.setAttribute('aria-pressed', String(isActive));
      });
  };

  const applyLanguage = (lang) => {
    const nextLang = lang === 'es' ? 'es' : 'en';
    html.lang = nextLang;
    localStorage.setItem('marxia-lang', nextLang);
    currentLanguage = nextLang;
    toggles
      .filter((toggle) => toggle.dataset.action === 'language')
      .forEach((toggle) => {
        const isActive = toggle.dataset.lang === nextLang;
        toggle.setAttribute('aria-pressed', String(isActive));
      });

    const dict = translations[nextLang];
    document.querySelectorAll('[data-i18n]').forEach((node) => {
      const key = node.getAttribute('data-i18n');
      if (!key) return;
      const translation = dict[key];
      if (!translation) return;

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
        node.childNodes[0].textContent = `${translation} `;
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

    updateProductPrices();
    updateCartDisplay();
  };

  const restorePreferences = () => {
    const savedTheme = localStorage.getItem('marxia-theme');
    const savedLang = localStorage.getItem('marxia-lang');
    if (savedTheme) {
      applyTheme(savedTheme);
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

  const openDrawer = (drawer) => {
    if (!drawer) return;
    drawer.setAttribute('aria-hidden', 'false');
    const closeButton = drawer.querySelector('[data-close-drawer]');
    if (closeButton) {
      closeButton.focus();
    }
  };

  const closeDrawer = (drawer) => {
    if (!drawer) return;
    drawer.setAttribute('aria-hidden', 'true');
  };

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.dataset.action === 'theme' && target.dataset.theme) {
      applyTheme(target.dataset.theme);
    }

    if (target.dataset.action === 'language' && target.dataset.lang) {
      applyLanguage(target.dataset.lang);
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
      toggleMenu(document.querySelector('#fabLanguageMenu'), fabLanguage);
    } else if (target === fabTheme) {
      toggleMenu(document.querySelector('#fabThemeMenu'), fabTheme);
    } else if (target === fabChat) {
      const drawer = document.querySelector('#chatDrawer');
      const isOpen = drawer?.getAttribute('aria-hidden') === 'false';
      if (isOpen) {
        closeDrawer(drawer);
      } else {
        openDrawer(drawer);
      }
      fabChat.setAttribute('aria-pressed', String(!isOpen));
    } else if (target === fabPay) {
      const drawer = document.querySelector('#payDrawer');
      const isOpen = drawer?.getAttribute('aria-hidden') === 'false';
      if (isOpen) {
        closeDrawer(drawer);
      } else {
        openDrawer(drawer);
      }
      fabPay.setAttribute('aria-pressed', String(!isOpen));
    } else if (!target.closest('.fab-menu') && !target.closest('.fab')) {
      closeMenus();
    }
    if (target.closest('.fab-menu') && target.dataset.action) {
      closeMenus();
    }
  });

  drawers.forEach((drawer) => {
    drawer.addEventListener('click', (event) => {
      if (event.target === drawer) {
        closeDrawer(drawer);
        fabChat?.setAttribute('aria-pressed', 'false');
        fabPay?.setAttribute('aria-pressed', 'false');
      }
    });
  });

  if (accordionTrigger && accordionContent) {
    const expanded = accordionTrigger.getAttribute('aria-expanded') === 'true';
    accordionContent.hidden = !expanded;
    accordionTrigger.addEventListener('click', () => {
      const isExpanded = accordionTrigger.getAttribute('aria-expanded') === 'true';
      const nextExpanded = !isExpanded;
      accordionTrigger.setAttribute('aria-expanded', String(nextExpanded));
      accordionContent.hidden = !nextExpanded;
      if (nextExpanded) {
        currentSlideIndex = 0;
        updateCarousel();
      }
    });
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

  window.addEventListener('resize', updateCarousel);

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
  updateCarousel();
  setCopyright();
})();
