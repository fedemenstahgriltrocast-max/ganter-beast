// Generated file. Do not edit directly. Use `npm run build` to regenerate.
const DEFAULT_LOCALE = 'es-EC';
const DEFAULT_CURRENCY = 'USD';

function formatCurrency(value, { locale = DEFAULT_LOCALE, currency = DEFAULT_CURRENCY } = {}) {
  const amount = Number.parseFloat(value ?? 0);
  if (Number.isNaN(amount)) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(0);
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function roundCurrency(value, precision = 2) {
  const multiplier = 10 ** precision;
  return Math.round(Number.parseFloat(value) * multiplier + Number.EPSILON) / multiplier;
}

const currencyDefaults = Object.freeze({
  locale: DEFAULT_LOCALE,
  currency: DEFAULT_CURRENCY,
});


const translations = Object.freeze({
  en: {
    // Global navigation & layout
    skipToContent: 'Skip to content',
    brandName: 'Marxia',
    brandTagline: 'Coffee & Bites',
    brandTitle: 'Marxia Café y Bocaditos',
    brandSubtitle: 'Breakfasts, pastries & catering in Guayaquil',
    brandSubheading: 'Breakfast bites',
    navHome: 'Home',
    navHomeAria: 'Return to the home page',
    navOrder: 'Order',
    navGallery: 'Gallery',
    navContact: 'Contact',
    navConsent: 'Consent management',
    navTerms: 'Terms & Conditions',
    quickPreferences: 'Quick preferences',
    languageSelection: 'Language selection',
    languageToggleToEnglish: 'Switch to English',
    languageToggleToSpanish: 'Switch to Spanish',
    themeSelection: 'Theme selection',
    themeToggleDark: 'Dark',
    themeToggleLight: 'Light',
    themeToggleAriaDark: 'Switch to dark theme',
    themeToggleAriaLight: 'Switch to light theme',
    legalInfo: 'Legal information',
    landingFooterSecurity: 'Marxia Café y Bocaditos. Security reinforced with PCI DSS, NIST CSF, and CISA best practices.',

    // Landing & ordering
    heroEyebrow: 'Marxia Café y Bocaditos',
    heroTitle: 'Marxia Café y Bocaditos',
    heroSubtitle: 'Breakfasts, bites, and deliveries across North Guayaquil.',
    heroHeadline: 'Marxia Café y Bocaditos',
    heroSubheadline: 'Breakfasts, bites, and deliveries across North Guayaquil.',
    heroPromise: 'Fresh flavors every day.',
    headline: 'Marxia Café y Bocaditos',
    tagline: 'Breakfasts, pastries, and deliveries in North Guayaquil.',
    promise: 'Fresh flavors every day.',
    deliveryCoverage: 'We deliver in North Guayaquil: Saucés · Alborada · Guayacanes · Tarazana · Brisas del Río',
    galleryTitle: 'Our menu',
    gallerySubtitle: 'Choose what energizes your day.',
    galleryHint: 'Choose what energizes your day.',
    galleryImage1Alt: 'Freshly brewed espresso shot',
    galleryImage2Alt: 'Breakfast tray with coffee, tortilla, eggs, and sausage',
    galleryImage3Alt: 'Golden tortilla on a serving board',
    galleryImage4Alt: 'Fried eggs served with sausage',
    galleryImage5Alt: 'Bottled Pepsi chilled with ice',
    galleryImage6Alt: 'Seven Up bottle on crushed ice',
    orderNow: 'Order now',
    openCalculatorLabel: 'Open calculator',
    openCalculatorAria: 'Open order calculator in a new tab',
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
    ordersTax: 'VAT 15%',
    ordersDelivery: 'Delivery',
    ordersTotal: 'Total',
    orderItems: 'Selected items',
    orderSummaryEmpty: 'Your basket is empty. Add menu favorites to see them here.',
    deliveryTitle: 'Delivery time',
    deliveryEta: 'Estimated delivery: {time}',
    deliveryEtaPrompt: 'Select a delivery window to see your ETA.',
    clearOrder: 'Clear',
    checkout: 'Secure checkout',
    carouselPrev: 'Previous favorites',
    carouselNext: 'Next favorites',
    carouselPagination: 'Menu highlights',
    carouselSlideLabel: 'View slide {index}',
    addToOrder: 'Add to order',
    removeFromOrder: 'Remove from order',
    productActionsAria: 'Quantity controls',
    summaryIncrease: 'Add one {item}',
    summaryDecrease: 'Remove one {item}',
    inCart: 'In cart: {count}',
    contactDeliveryHeading: 'We deliver to:',
    contactDeliveryAreas: 'Saucés · Alborada · Guayacanes · Tarazana · Brisas del Río',
    contactWhatsAppLabel: 'WhatsApp:',
    footerConsentLink: 'Consent management',
    footerTermsLink: 'Terms & Conditions',
    footerLegalContact: 'Legal contact',
    footerCalculatorLink: 'Order calculator',
    rights: 'All rights reserved.',
    edgeSecurity: 'Edge protected via Cloudflare Zero Trust',

    // Consent center UI
    consentMetaTitle: 'Consent Management | Marxia Café y Bocaditos',
    consentMetaDescription: 'Overview of consent, cookies, and privacy choices for Marxia Café y Bocaditos.',
    consentHeading: 'Consent management',
    consentTagline: 'Transparency in how we collect, use, and protect your data.',
    consentOverviewTitle: 'Overview',
    consentOverviewBody:
      'Marxia Café y Bocaditos operates with privacy by design and default. We process personal information only with clear legal bases, record consent, and provide simple mechanisms so you can adjust your preferences at any time.',
    consentDataTitle: 'Data we collect',
    consentDataIntro: 'The information we may process is grouped as follows:',
    consentDataEssential:
      '<strong>Essential data:</strong> elements required to deliver the requested service, such as language selection, cart items, and delivery choices.',
    consentDataContact:
      '<strong>Contact data:</strong> name, email, or phone number when you choose to interact via forms or messaging channels.',
    consentDataMetrics:
      '<strong>Experience metrics:</strong> pseudonymised information about site usage to improve accessibility, performance, and security.',
    consentLegalTitle: 'Legal bases for processing',
    consentLegalIntro: 'We process your personal data under the following grounds:',
    consentLegalConsent:
      '<strong>Explicit consent:</strong> required for non-essential cookies, personalised marketing, and optional communications.',
    consentLegalContract:
      '<strong>Performance of a contract:</strong> when you request products or services and we need your details to fulfil delivery.',
    consentLegalInterest:
      '<strong>Legitimate interest:</strong> to prevent fraud, protect infrastructure, and improve accessibility while respecting your rights.',
    consentCookiesTitle: 'Cookie categories and similar technologies',
    consentCookiesCaption: 'Responsible use of cookies',
    consentCookiesColumnCategory: 'Category',
    consentCookiesColumnPurpose: 'Purpose',
    consentCookiesColumnDuration: 'Duration',
    consentCookiesColumnLegal: 'Legal basis',
    consentCookiesEssential: 'Essential',
    consentCookiesEssentialPurpose:
      'Keep sessions active, remember language or accessibility preferences, and secure payments.',
    consentCookiesEssentialDuration: 'Session or up to 12 months',
    consentCookiesEssentialLegal: 'Contract performance / Legitimate interest',
    consentCookiesAnalytics: 'Analytics',
    consentCookiesAnalyticsPurpose: 'Measure visits, detect errors, and optimise the experience.',
    consentCookiesAnalyticsDuration: '30 minutes to 24 months',
    consentCookiesAnalyticsLegal: 'Consent',
    consentCookiesMarketing: 'Marketing',
    consentCookiesMarketingPurpose: 'Send relevant promotions or opt-in reminders.',
    consentCookiesMarketingDuration: 'Until revoked',
    consentCookiesMarketingLegal: 'Consent',
    consentCookiesNote:
      'Analytics and marketing cookies are disabled by default. You can manage them from the consent preference centre at the bottom of the site.',
    consentCenterTitle: 'Dynamic preference centre',
    consentCenterIntro:
      'Control which optional categories you authorise in real time. Changes are saved instantly and applied across the site, honouring privacy by default.',
    consentAcceptAll: 'Allow all',
    consentRejectAll: 'Reject optional',
    consentStatusIdle: 'Adjust your preferences and save changes to personalise your experience.',
    consentStatusSaved: 'Preferences saved. You can adjust each category whenever you need.',
    consentTimestampLabel: 'Last updated:',
    consentEssentialCard: 'Essential',
    consentBadgeRequired: 'Required',
    consentEssentialCopy:
      'Ensure the platform runs securely: sessions, language, accessibility, and order maintenance.',
    consentEssentialAria: 'Essential cookies are always on',
    consentSwitchActive: 'Active',
    consentAnalyticsCard: 'Analytics',
    consentBadgeOptional: 'Optional',
    consentAnalyticsCopy:
      'Help us measure performance, detect issues, and improve the experience without identifying you directly.',
    consentAnalyticsAria: 'Toggle analytics cookies on or off',
    consentMarketingCard: 'Marketing',
    consentMarketingCopy:
      'Personalise communications and campaigns that might interest you based on your tastes and previous orders.',
    consentMarketingAria: 'Toggle marketing communications on or off',
    consentManageTitle: 'Manage your preferences',
    consentManageStepOne: 'Click the “Privacy preferences” button in the footer.',
    consentManageStepTwo: 'Select each category to review its description and activate or deactivate as needed.',
    consentManageStepThree:
      'Save your changes. Your settings will sync across devices where you use the same account.',
    consentManageNote: 'You can withdraw consent at any time without affecting processing carried out before the withdrawal.',
    consentRightsTitle: 'Your privacy rights',
    consentRightsIntro: 'Depending on your jurisdiction, you may exercise the following rights:',
    consentRightsAccess: 'Access, rectify, and update your personal information.',
    consentRightsDeletion: 'Delete or anonymise data when it is no longer needed.',
    consentRightsPortability: 'Request data portability in a structured format.',
    consentRightsObjection: 'Object to or restrict processing based on legitimate interests.',
    consentRightsComplaint: 'File complaints with the relevant supervisory authority.',
    consentRightsContact:
      'To exercise these rights, email us at <a href="mailto:privacidad@marxia.ec">privacidad@marxia.ec</a> or send us a WhatsApp message.',
    consentRetentionTitle: 'Data retention and security',
    consentRetentionBody:
      'We retain personal data only as long as necessary for the stated purposes or as required by law. We implement encryption, access controls, and continuous monitoring aligned with NIST CSF, CISA Cyber Essentials, and PCI DSS 4.0 to protect your information.',
    consentUpdatesTitle: 'Updates',
    consentUpdatesBody:
      'We review this consent policy periodically. Significant changes will be announced via on-site banners with a visible update date. Last updated: <time datetime="2024-06-01">June 1, 2024</time>.',
    consentFooterRights: 'Marxia Café y Bocaditos. All rights reserved.',
    consentFooterLinksPrefix: 'Also review our',
    consentFooterTerms: 'Terms & Conditions',
    consentFooterAnd: 'and the',
    consentFooterPreferences: 'preference settings',
    consentFooterSuffix: 'to manage cookies.',

    // Legal (terms)
    termsMetaTitle: 'Terms & Conditions | Marxia Café y Bocaditos',
    termsMetaDescription: 'Usage conditions, responsibilities, and service policies for Marxia Café y Bocaditos.',
    termsHeading: 'Terms & Conditions',
    termsTagline: 'Service agreement for using Marxia Café y Bocaditos digital channels.',
    termsScopeHeading: '1. Scope and acceptance',
    termsScopeBody:
      'These Terms and Conditions govern access to and use of the website, applications, and related channels of Marxia Café y Bocaditos. By accessing or placing an order you agree to this agreement, the Consent Policy, and any additional guidelines published on the platform.',
    termsServicesHeading: '2. Services offered',
    termsServicesBody:
      'We provide culinary experiences, reservations, and deliveries within designated areas of Guayaquil. Features and availability may vary based on seasons, capacity, or special events. Changes will be communicated through the site or official messaging channels.',
    termsOrdersHeading: '3. Orders, payments, and billing',
    termsOrdersConfirm:
      'Orders are confirmed only after receiving proof of payment or manual validation.',
    termsOrdersPayments:
      'We accept payment methods enabled in the checkout flow, including PCI DSS compatible cards and transfers.',
    termsOrdersInvoices:
      'We issue electronic invoices or receipts under Ecuadorian regulations when applicable.',
    termsOrdersPricing:
      'Prices include applicable taxes; any additional charges will be disclosed before confirming the order.',
    termsUserHeading: '4. User responsibilities',
    termsUserAccurateInfo: 'Provide truthful, complete information when registering or requesting deliveries.',
    termsUserSchedule: 'Respect delivery times and established cancellation policies.',
    termsUserConduct: 'Do not use the site for illicit, fraudulent, or security-compromising activities.',
    termsUserAllergens: 'Review allergen notices and nutrition facts before placing an order.',
    termsPrivacyHeading: '5. Privacy and consent',
    termsPrivacyBody:
      'Personal data processing follows our <a href="consent.html">Consent Management</a>. We apply technical and organisational controls aligned with NIST CSF, CISA Cyber Essentials, and PCI DSS to safeguard confidentiality, integrity, and availability.',
    termsIntellectualHeading: '6. Intellectual property',
    termsIntellectualBody:
      'All content, trademarks, logos, photographs, and designs are owned by Marxia Café y Bocaditos or its licensors. Reproducing, modifying, or distributing the material without prior written authorisation is prohibited.',
    termsLiabilityHeading: '7. Limitation of liability',
    termsLiabilityBody:
      'We make reasonable efforts to provide a secure and available service. However, we are not liable for indirect damages, interruptions, or losses caused by factors beyond our control, including third-party failures, power outages, or force majeure.',
    termsChangesHeading: '8. Modifications',
    termsChangesBody:
      'We may update these terms to reflect regulatory, product, or business changes. Updated versions take effect upon publication with the latest revision date. Continued use after changes signifies acceptance.',
    termsContactHeading: '9. Contact',
    termsContactBody:
      'For legal questions or inquiries about these terms, email <a href="mailto:legal@marxia.ec">legal@marxia.ec</a> or reach us via WhatsApp. You can also visit our Guayaquil location by appointment.',
    termsLawHeading: '10. Governing law and jurisdiction',
    termsLawBody:
      'This agreement is governed by the laws of the Republic of Ecuador. Disputes will be resolved before the competent courts of Guayaquil, without prejudice to alternative resolution mechanisms agreed by the parties.',
    termsUpdated: 'Last updated: <time datetime="2024-06-01">June 1, 2024</time>.',
    termsFooterRights: 'Marxia Café y Bocaditos. All rights reserved.',
    termsFooterLinksPrefix: 'Also review our',
    termsFooterConsent: 'Consent management',
    termsFooterAnd: 'and the security policies applied on the',
    termsFooterSite: 'main site',
    termsFooterSuffix: '.',

    // Drawer & FAB labels
    chatTitle: 'Live chat',
    chatWelcome: 'Hello 👋 How can we help you today?',
    chatLabel: 'Message',
    chatSend: 'Send',
    chatPlaceholder: 'Type your message…',
    chatClose: 'Close chat',
    payTitle: 'Checkout preview',
    payNow: 'Pay now',
    payCloseAction: 'Close',
    fabNavLabel: 'Quick actions navigation',
    fabLanguageLabel: 'Language options',
    fabThemeLabel: 'Theme options',
    fabChatLabel: 'Live chat',
    fabPayLabel: 'Payment summary',
  },
  es: {
    // Navegación y diseño global
    skipToContent: 'Saltar al contenido',
    brandName: 'Marxia',
    brandTagline: 'Café y Bocaditos',
    brandTitle: 'Marxia Café y Bocaditos',
    brandSubtitle: 'Desayunos, bocaditos y catering en Guayaquil',
    brandSubheading: 'Desayunos artesanales',
    navHome: 'Inicio',
    navHomeAria: 'Volver a la página principal',
    navOrder: 'Ordenar',
    navGallery: 'Galería',
    navContact: 'Contacto',
    navConsent: 'Gestión de consentimiento',
    navTerms: 'Términos y Condiciones',
    quickPreferences: 'Preferencias rápidas',
    languageSelection: 'Selección de idioma',
    languageToggleToEnglish: 'Cambiar a inglés',
    languageToggleToSpanish: 'Cambiar a español',
    themeSelection: 'Selección de tema',
    themeToggleDark: 'Oscuro',
    themeToggleLight: 'Claro',
    themeToggleAriaDark: 'Cambiar a tema oscuro',
    themeToggleAriaLight: 'Cambiar a tema claro',
    legalInfo: 'Información legal',
    landingFooterSecurity:
      'Marxia Café y Bocaditos. Seguridad reforzada con buenas prácticas PCI DSS, NIST CSF y CISA.',

    // Landing y pedidos
    heroEyebrow: 'Marxia Café y Bocaditos',
    heroTitle: 'Marxia Café y Bocaditos',
    heroSubtitle: 'Desayunos, bocaditos y entregas en el Norte de Guayaquil.',
    heroHeadline: 'Marxia Café y Bocaditos',
    heroSubheadline: 'Desayunos, bocaditos y entregas en el Norte de Guayaquil.',
    heroPromise: 'Sabores frescos todos los días.',
    headline: 'Marxia Café y Bocaditos',
    tagline: 'Desayunos, bocaditos y entregas en el Norte de Guayaquil.',
    promise: 'Sabores frescos todos los días.',
    deliveryCoverage:
      'Entregamos en el Norte de Guayaquil: Saucés · Alborada · Guayacanes · Tarazana · Brisas del Río',
    galleryTitle: 'Nuestro menú',
    gallerySubtitle: 'Elige lo que energiza tu día.',
    galleryHint: 'Elige lo que energiza tu día.',
    galleryImage1Alt: 'Shot de espresso recién preparado',
    galleryImage2Alt: 'Bandeja de desayuno con café, tortilla, huevos y salchicha',
    galleryImage3Alt: 'Tortilla dorada sobre tabla de madera',
    galleryImage4Alt: 'Huevos fritos servidos con salchicha',
    galleryImage5Alt: 'Botella de Pepsi fría con hielo',
    galleryImage6Alt: 'Botella de Seven Up sobre hielo',
    orderNow: 'Ordenar ahora',
    openCalculatorLabel: 'Abrir calculadora',
    openCalculatorAria: 'Abrir la calculadora de pedidos en una nueva pestaña',
    orderTitle: 'Nuestro menú',
    orderSubtitle: 'Toca para descubrir nuestros favoritos artesanales.',
    insightsTitle: 'Tablero de experiencia',
    insightsSubtitle: '',
    sentimentTitle: 'Sentimiento del consumidor final',
    sentimentUpdated: 'Actualizado cada 30 minutos',
    sentimentScore: 'Calificación promedio',
    sentimentReviews: '1.248 reseñas verificadas',
    visitorsTitle: 'Visitantes',
    visitorsMeta: 'Tráfico físico y digital',
    visitorsCaption: 'Hoy 320 · Este mes 8.450 · El año pasado 92.300',
    salesTitle: 'Ventas en línea',
    salesMeta: 'Oportunidad de crecimiento',
    salesCaption: 'Hoy $620 · Este mes $18.400 · El año pasado $212.000',
    ordersTitle: 'Detalles del pedido',
    ordersMeta: 'Pago seguro habilitado',
    ordersSubtotal: 'Subtotal',
    ordersTax: 'IVA 15%',
    ordersDelivery: 'Entrega',
    ordersTotal: 'Total',
    orderItems: 'Productos seleccionados',
    orderSummaryEmpty: 'Tu canasta está vacía. Agrega tus favoritos para verlos aquí.',
    deliveryTitle: 'Horario de entrega',
    deliveryEta: 'Entrega estimada: {time}',
    deliveryEtaPrompt: 'Selecciona una ventana de entrega para ver tu ETA.',
    clearOrder: 'Limpiar',
    checkout: 'Pago seguro',
    carouselPrev: 'Favoritos anteriores',
    carouselNext: 'Siguientes favoritos',
    carouselPagination: 'Destacados del menú',
    carouselSlideLabel: 'Ver diapositiva {index}',
    addToOrder: 'Agregar al pedido',
    removeFromOrder: 'Quitar del pedido',
    productActionsAria: 'Controles de cantidad',
    summaryIncrease: 'Agregar un {item}',
    summaryDecrease: 'Quitar un {item}',
    inCart: 'En la canasta: {count}',
    contactDeliveryHeading: 'Entregamos en:',
    contactDeliveryAreas: 'Saucés · Alborada · Guayacanes · Tarazana · Brisas del Río',
    contactWhatsAppLabel: 'WhatsApp:',
    footerConsentLink: 'Gestión de consentimiento',
    footerTermsLink: 'Términos y Condiciones',
    footerLegalContact: 'Contacto legal',
    footerCalculatorLink: 'Calculadora de pedidos',
    rights: 'Todos los derechos reservados.',
    edgeSecurity: 'Protegido en el borde con Cloudflare Zero Trust',

    // Centro de consentimiento
    consentMetaTitle: 'Gestión de consentimiento | Marxia Café y Bocaditos',
    consentMetaDescription:
      'Resumen de consentimiento, cookies y opciones de privacidad para Marxia Café y Bocaditos.',
    consentHeading: 'Gestión de consentimiento',
    consentTagline: 'Transparencia en cómo recopilamos, usamos y protegemos tus datos.',
    consentOverviewTitle: 'Resumen general',
    consentOverviewBody:
      'Marxia Café y Bocaditos opera con un enfoque de privacidad por diseño y por defecto. Procesamos la información personal únicamente con fundamentos legales claros, registramos el consentimiento y ofrecemos mecanismos sencillos para que puedas ajustar tus preferencias en cualquier momento.',
    consentDataTitle: 'Datos que recopilamos',
    consentDataIntro: 'La información que podemos procesar se clasifica de la siguiente manera:',
    consentDataEssential:
      '<strong>Datos esenciales:</strong> elementos necesarios para brindar el servicio solicitado, como idioma seleccionado, artículos en el carrito y opciones de entrega.',
    consentDataContact:
      '<strong>Datos de contacto:</strong> nombre, correo electrónico o teléfono cuando decides interactuar mediante formularios o canales de mensajería.',
    consentDataMetrics:
      '<strong>Métricas de experiencia:</strong> información pseudonimizada sobre el uso del sitio para mejorar accesibilidad, rendimiento y seguridad.',
    consentLegalTitle: 'Base legal para el procesamiento',
    consentLegalIntro: 'Procesamos tus datos personales bajo los siguientes fundamentos:',
    consentLegalConsent:
      '<strong>Consentimiento explícito:</strong> requerido para el uso de cookies no esenciales, marketing personalizado y comunicaciones opcionales.',
    consentLegalContract:
      '<strong>Ejecución de un contrato:</strong> cuando solicitas productos o servicios y necesitamos tus datos para completar la entrega.',
    consentLegalInterest:
      '<strong>Interés legítimo:</strong> para prevenir fraude, proteger la infraestructura y mejorar la accesibilidad del sitio, respetando siempre tus derechos.',
    consentCookiesTitle: 'Categorías de cookies y tecnologías similares',
    consentCookiesCaption: 'Uso responsable de cookies',
    consentCookiesColumnCategory: 'Categoría',
    consentCookiesColumnPurpose: 'Propósito',
    consentCookiesColumnDuration: 'Duración',
    consentCookiesColumnLegal: 'Base legal',
    consentCookiesEssential: 'Esenciales',
    consentCookiesEssentialPurpose:
      'Mantener el inicio de sesión, recordar el idioma o preferencias de accesibilidad y asegurar la integridad de pagos.',
    consentCookiesEssentialDuration: 'Sesión o hasta 12 meses',
    consentCookiesEssentialLegal: 'Ejecución de contrato / Interés legítimo',
    consentCookiesAnalytics: 'Analíticas',
    consentCookiesAnalyticsPurpose: 'Medir visitas, detectar errores y optimizar la experiencia.',
    consentCookiesAnalyticsDuration: '30 minutos a 24 meses',
    consentCookiesAnalyticsLegal: 'Consentimiento',
    consentCookiesMarketing: 'Marketing',
    consentCookiesMarketingPurpose: 'Enviar promociones relevantes o recordatorios opt-in.',
    consentCookiesMarketingDuration: 'Hasta revocación',
    consentCookiesMarketingLegal: 'Consentimiento',
    consentCookiesNote:
      'Las cookies analíticas y de marketing están desactivadas por defecto. Puedes gestionarlas desde el Centro de Preferencias de Consentimiento en la parte inferior del sitio.',
    consentCenterTitle: 'Centro de preferencias dinámico',
    consentCenterIntro:
      'Controla qué categorías opcionales autorizas en tiempo real. Los cambios se guardan al instante y aplican al resto del sitio, respetando el principio de privacidad por defecto.',
    consentAcceptAll: 'Permitir todo',
    consentRejectAll: 'Rechazar opcionales',
    consentStatusIdle: 'Ajusta tus preferencias y guarda los cambios para personalizar tu experiencia.',
    consentStatusSaved: 'Preferencias guardadas. Puedes ajustar cada categoría cuando lo necesites.',
    consentTimestampLabel: 'Última actualización:',
    consentEssentialCard: 'Esenciales',
    consentBadgeRequired: 'Necesario',
    consentEssentialCopy:
      'Garantizan que la plataforma funcione de forma segura: inicio de sesión, idioma, accesibilidad y mantenimiento de pedidos.',
    consentEssentialAria: 'Las cookies esenciales siempre están activas',
    consentSwitchActive: 'Activo',
    consentAnalyticsCard: 'Analíticas',
    consentBadgeOptional: 'Opcional',
    consentAnalyticsCopy:
      'Nos ayudan a medir el rendimiento, detectar incidencias y mejorar la experiencia sin identificarte directamente.',
    consentAnalyticsAria: 'Activar o desactivar cookies analíticas',
    consentMarketingCard: 'Marketing',
    consentMarketingCopy:
      'Personalizan comunicaciones y campañas que podrían interesarte según tus gustos y pedidos previos.',
    consentMarketingAria: 'Activar o desactivar comunicaciones de marketing',
    consentManageTitle: 'Gestiona tus preferencias',
    consentManageStepOne: 'Haz clic en el botón “Preferencias de privacidad” en el pie de página.',
    consentManageStepTwo: 'Selecciona cada categoría para ver su descripción y activar o desactivar según tus necesidades.',
    consentManageStepThree:
      'Guarda los cambios. Tus ajustes se sincronizarán en todos los dispositivos donde utilices la misma cuenta.',
    consentManageNote:
      'Siempre podrás retirar tu consentimiento sin afectar la legalidad del procesamiento previo a la revocación.',
    consentRightsTitle: 'Tus derechos de privacidad',
    consentRightsIntro: 'Dependiendo de tu jurisdicción, puedes ejercer los siguientes derechos:',
    consentRightsAccess: 'Acceso, rectificación y actualización de tu información personal.',
    consentRightsDeletion: 'Eliminación o anonimización de datos cuando ya no sean necesarios.',
    consentRightsPortability: 'Portabilidad de datos en un formato estructurado.',
    consentRightsObjection: 'Oposición o restricción al procesamiento basado en intereses legítimos.',
    consentRightsComplaint: 'Presentar quejas ante la autoridad de control competente.',
    consentRightsContact:
      'Para ejercer estos derechos, escríbenos a <a href="mailto:privacidad@marxia.ec">privacidad@marxia.ec</a> o envíanos un mensaje vía WhatsApp.',
    consentRetentionTitle: 'Conservación y seguridad de los datos',
    consentRetentionBody:
      'Conservamos los datos personales únicamente durante el tiempo necesario para cumplir con los fines descritos o según lo requiera la ley aplicable. Implementamos cifrado, controles de acceso y monitoreo continuo conforme a NIST CSF, CISA Cyber Essentials y PCI DSS 4.0 para proteger tu información.',
    consentUpdatesTitle: 'Actualizaciones',
    consentUpdatesBody:
      'Revisamos esta política de consentimiento de manera periódica. Notificaremos cambios sustanciales mediante banners en el sitio y una fecha de actualización visible. Última actualización: <time datetime="2024-06-01">1 de junio de 2024</time>.',
    consentFooterRights: 'Marxia Café y Bocaditos. Todos los derechos reservados.',
    consentFooterLinksPrefix: 'Consulta también nuestros',
    consentFooterTerms: 'Términos y Condiciones',
    consentFooterAnd: 'y la',
    consentFooterPreferences: 'configuración de preferencias',
    consentFooterSuffix: 'para administrar cookies.',

    // Términos legales
    termsMetaTitle: 'Términos y Condiciones | Marxia Café y Bocaditos',
    termsMetaDescription:
      'Condiciones de uso, responsabilidades y políticas de servicio de Marxia Café y Bocaditos.',
    termsHeading: 'Términos y Condiciones',
    termsTagline: 'Acuerdo de servicio para utilizar los canales digitales de Marxia Café y Bocaditos.',
    termsScopeHeading: '1. Alcance y aceptación',
    termsScopeBody:
      'Estos Términos y Condiciones regulan el acceso y uso del sitio web, aplicaciones y canales asociados de Marxia Café y Bocaditos. Al acceder o realizar un pedido aceptas cumplir este acuerdo, la Política de Consentimiento y cualquier lineamiento complementario publicado en la plataforma.',
    termsServicesHeading: '2. Servicios ofrecidos',
    termsServicesBody:
      'Ofrecemos experiencias gastronómicas, reservas y entregas a domicilio dentro de las zonas habilitadas de Guayaquil. Las características y disponibilidad pueden variar según temporadas, aforo y eventos especiales. Cualquier cambio será comunicado mediante el sitio o canales oficiales de mensajería.',
    termsOrdersHeading: '3. Pedidos, pagos y facturación',
    termsOrdersConfirm:
      'Los pedidos se considerarán confirmados únicamente tras recibir un comprobante de pago o validación manual.',
    termsOrdersPayments:
      'Aceptamos métodos de pago habilitados en el flujo de checkout, incluyendo tarjetas compatibles con PCI DSS y transferencias.',
    termsOrdersInvoices:
      'Emitimos facturas o comprobantes electrónicos bajo normativa ecuatoriana cuando corresponda.',
    termsOrdersPricing:
      'Los precios incluyen impuestos aplicables; cualquier cargo adicional se informará antes de confirmar la orden.',
    termsUserHeading: '4. Responsabilidades del usuario',
    termsUserAccurateInfo: 'Proporcionar información veraz y completa al registrarse o solicitar entregas.',
    termsUserSchedule: 'Respetar horarios de entrega y políticas de cancelación establecidas.',
    termsUserConduct: 'No utilizar el sitio para actividades ilícitas, fraudulentas o que comprometan la seguridad.',
    termsUserAllergens: 'Revisar las alertas de alérgenos y fichas nutricionales antes de realizar un pedido.',
    termsPrivacyHeading: '5. Privacidad y consentimiento',
    termsPrivacyBody:
      'El tratamiento de datos personales se rige por nuestra <a href="consent.html">Gestión de consentimiento</a>. Utilizamos controles técnicos y organizativos alineados con NIST CSF, CISA Cyber Essentials y PCI DSS para salvaguardar la confidencialidad, integridad y disponibilidad de tu información.',
    termsIntellectualHeading: '6. Propiedad intelectual',
    termsIntellectualBody:
      'Todos los contenidos, marcas, logotipos, fotografías y diseños son propiedad de Marxia Café y Bocaditos o de sus licenciantes. No se permite reproducir, modificar o distribuir el material sin autorización escrita previa.',
    termsLiabilityHeading: '7. Limitación de responsabilidad',
    termsLiabilityBody:
      'Hacemos esfuerzos razonables por garantizar un servicio seguro y disponible. Sin embargo, no asumimos responsabilidad por daños indirectos, interrupciones o pérdidas derivadas de causas fuera de nuestro control, incluyendo fallos de terceros, cortes eléctricos o eventos de fuerza mayor.',
    termsChangesHeading: '8. Modificaciones',
    termsChangesBody:
      'Podemos actualizar estos términos para reflejar cambios regulatorios, de producto o de negocio. Las versiones modificadas entrarán en vigencia al publicarse en esta página, indicando la fecha de última actualización. El uso continuado posterior a los cambios implica tu aceptación.',
    termsContactHeading: '9. Contacto',
    termsContactBody:
      'Si tienes consultas legales o sobre estos términos, escríbenos a <a href="mailto:legal@marxia.ec">legal@marxia.ec</a> o contáctanos mediante WhatsApp. También puedes visitar nuestra sede en Guayaquil previa cita.',
    termsLawHeading: '10. Ley aplicable y jurisdicción',
    termsLawBody:
      'Este acuerdo se rige por las leyes de la República del Ecuador. Cualquier controversia se resolverá ante los tribunales competentes de Guayaquil, sin perjuicio de mecanismos alternativos de resolución que las partes acuerden.',
    termsUpdated: 'Última actualización: <time datetime="2024-06-01">1 de junio de 2024</time>.',
    termsFooterRights: 'Marxia Café y Bocaditos. Todos los derechos reservados.',
    termsFooterLinksPrefix: 'Revisa también nuestra',
    termsFooterConsent: 'Gestión de consentimiento',
    termsFooterAnd: 'y las políticas de seguridad aplicadas en el',
    termsFooterSite: 'sitio principal',
    termsFooterSuffix: '.',

    // Etiquetas de cajones y FAB
    chatTitle: 'Chat en vivo',
    chatWelcome: 'Hola 👋 ¿En qué podemos ayudarte hoy?',
    chatLabel: 'Mensaje',
    chatSend: 'Enviar',
    chatPlaceholder: 'Escribe tu mensaje…',
    chatClose: 'Cerrar chat',
    payTitle: 'Resumen de pago',
    payNow: 'Pagar ahora',
    payCloseAction: 'Cerrar',
    fabNavLabel: 'Accesos rápidos',
    fabLanguageLabel: 'Opciones de idioma',
    fabThemeLabel: 'Opciones de tema',
    fabChatLabel: 'Chat en vivo',
    fabPayLabel: 'Resumen de pago',
  },
});

const SUPPORTED_LANGUAGES = Object.freeze(Object.keys(translations));
const DEFAULT_LANGUAGE = 'es';


const STORAGE_KEY = 'marxia-lang';

function normalizeLanguage(language) {
  if (!language) return DEFAULT_LANGUAGE;
  const normalized = language.toLowerCase();
  return SUPPORTED_LANGUAGES.includes(normalized) ? normalized : DEFAULT_LANGUAGE;
}

function createI18nManager({
  html = typeof document !== 'undefined' ? document.documentElement : undefined,
  storage = typeof window !== 'undefined' ? window.localStorage : undefined,
  initialLanguage,
} = {}) {
  let currentLanguage = normalizeLanguage(initialLanguage || html?.lang);
  const listeners = new Set();

  if (html) {
    html.lang = currentLanguage;
  }

  if (storage) {
    const stored = storage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.includes(stored)) {
      currentLanguage = stored;
      if (html) {
        html.lang = currentLanguage;
      }
    } else {
      storage.setItem(STORAGE_KEY, currentLanguage);
    }
  }

  const notify = () => {
    listeners.forEach((listener) => {
      try {
        listener(currentLanguage);
      } catch (error) {
        console.error('i18n listener error', error);
      }
    });
  };

  const getDictionary = (lang = currentLanguage) => translations[normalizeLanguage(lang)] ?? {};

  const format = (key, replacements = {}, lang = currentLanguage) => {
    const dictionary = getDictionary(lang);
    const template = dictionary[key];
    if (template === undefined) {
      return undefined;
    }
    return Object.entries(replacements).reduce(
      (acc, [token, value]) => acc.replace(new RegExp(`\\{${token}\\}`, 'g'), String(value)),
      template,
    );
  };

  const translate = (key, lang = currentLanguage) => getDictionary(lang)[key];

  const setLanguage = (lang) => {
    const nextLanguage = normalizeLanguage(lang);
    if (nextLanguage === currentLanguage) {
      return currentLanguage;
    }
    currentLanguage = nextLanguage;
    if (html) {
      html.lang = currentLanguage;
    }
    if (storage) {
      storage.setItem(STORAGE_KEY, currentLanguage);
    }
    notify();
    return currentLanguage;
  };

  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return {
    get language() {
      return currentLanguage;
    },
    setLanguage,
    translate,
    format,
    subscribe,
    getDictionary,
  };
}




function createCartStore({ taxRate = 0, deliveryFee = 0 } = {}) {
  const items = new Map();

  const getItem = (id) => items.get(id);

  const list = ({ includeZero = false } = {}) =>
    Array.from(items.entries())
      .map(([id, entry]) => ({ id, ...entry }))
      .filter((entry) => includeZero || entry.quantity > 0);

  const totals = () => {
    const snapshot = list();
    const subtotal = snapshot.reduce((sum, { price, quantity }) => sum + price * quantity, 0);
    const tax = subtotal * taxRate;
    const delivery = snapshot.length > 0 ? deliveryFee : 0;
    const total = subtotal + tax + delivery;
    return {
      subtotal: roundCurrency(subtotal),
      tax: roundCurrency(tax),
      delivery: roundCurrency(delivery),
      total: roundCurrency(total),
    };
  };

  const register = (id, data) => {
    if (!id) return;
    const nextEntry = {
      price: Number.parseFloat(data?.price ?? 0),
      quantity: Number.parseInt(data?.quantity ?? 0, 10) || 0,
      labels: data?.labels ?? {},
      card: data?.card,
    };
    items.set(id, nextEntry);
  };

  const modify = (id, delta) => {
    const entry = getItem(id);
    if (!entry) {
      return 0;
    }
    const nextQuantity = Math.max(0, Number.parseInt(entry.quantity ?? 0, 10) + delta);
    entry.quantity = nextQuantity;
    items.set(id, entry);
    return nextQuantity;
  };

  const clear = () => {
    items.forEach((entry, id) => {
      entry.quantity = 0;
      items.set(id, entry);
    });
  };

  return {
    register,
    modify,
    clear,
    getItem,
    get: getItem,
    has: (id) => items.has(id),
    list,
    totals,
    size: () => items.size,
  };
}


(function () {
  const sanitizeBase = (value) => {
    if (typeof value !== 'string') {
      return '';
    }
    const trimmed = value.trim();
    return trimmed.replace(/\/+$/, '');
  };

  const resolveWorkerBase = (element) => {
    const candidates = [];
    if (element) {
      candidates.push(element.getAttribute('data-worker-base'));
      candidates.push(element.getAttribute('data-calculator-base'));
    }
    if (document.body) {
      candidates.push(document.body.getAttribute('data-calculator-base'));
      candidates.push(document.body.getAttribute('data-worker-base'));
    }
    candidates.push(document.documentElement.getAttribute('data-calculator-base'));
    candidates.push(document.documentElement.getAttribute('data-worker-base'));

    for (const candidate of candidates) {
      const sanitized = sanitizeBase(candidate);
      if (sanitized) {
        return sanitized;
      }
    }
    return '';
  };

  const openInNewTab = (url) => {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.style.position = 'absolute';
    anchor.style.opacity = '0';
    anchor.style.pointerEvents = 'none';
    anchor.style.width = '1px';
    anchor.style.height = '1px';
    document.body.appendChild(anchor);
    anchor.click();
    window.requestAnimationFrame(() => {
      anchor.remove();
    });
  };

  const initializeCalculatorButton = () => {
    const calculatorButton = document.querySelector('#openCalc');
    if (!(calculatorButton instanceof HTMLButtonElement)) {
      return;
    }

    const workerBase = resolveWorkerBase(calculatorButton);
    const targetUrl = workerBase ? `${workerBase}/calc` : '';

    if (!targetUrl) {
      calculatorButton.setAttribute('disabled', 'true');
      calculatorButton.setAttribute('aria-disabled', 'true');
      return;
    }

    calculatorButton.addEventListener('click', () => {
      openInNewTab(targetUrl);
    });
  };

  if (typeof document !== 'undefined') {
    initializeCalculatorButton();
  }
})();


if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  initializeApp({ window, document });
}


