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
      deliveryTitle: 'Delivery time',
      checkout: 'Secure checkout',
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
      deliveryTitle: 'Tiempo de entrega',
      checkout: 'Checkout seguro',
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
      if (!translation) return;

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

  restorePreferences();
  setCopyright();
})();
