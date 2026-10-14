/* ===== VANTOUR BOGOTÁ · analytics.js =====
   GA4 + Meta Pixel. Mientras los IDs sigan siendo placeholders no se carga
   ningún script externo ni se envía nada. */
(function () {
  'use strict';

  // TODO: reemplazar por el ID real de Google Analytics 4 (formato G-XXXXXXXXXX)
  var GA4_ID = 'TODO_GA4_ID';
  // TODO: reemplazar por el ID real del Meta Pixel (solo números)
  var PIXEL_ID = 'TODO_META_PIXEL_ID';

  var gaOn = /^G-[A-Z0-9]+$/.test(GA4_ID);
  var pxOn = /^\d+$/.test(PIXEL_ID);

  /* ---- Google Analytics 4 ---- */
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  if (gaOn) {
    var g = document.createElement('script');
    g.async = true;
    g.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
    document.head.appendChild(g);
    window.gtag('js', new Date());
    window.gtag('config', GA4_ID);
  }

  /* ---- Meta Pixel ---- */
  if (pxOn) {
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('init', PIXEL_ID);
    window.fbq('track', 'PageView');
  }

  /* ---- Eventos de conversión ----
     whatsapp_click · email_click · generate_lead (envío del formulario)
     Pixel: Contact (WhatsApp / correo) y Lead (formulario). */
  var PIXEL_MAP = { whatsapp_click: 'Contact', email_click: 'Contact', generate_lead: 'Lead' };

  window.vtTrack = function (name, params) {
    params = params || {};
    params.language = document.documentElement.lang;
    if (gaOn) window.gtag('event', name, params);
    if (pxOn && PIXEL_MAP[name]) window.fbq('track', PIXEL_MAP[name], { content_name: params.location || name });
  };

  // Clics en enlaces de WhatsApp y correo (nav, contacto, footer, botón flotante)
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    var where = a.dataset.track || (a.closest('footer') ? 'footer' : a.closest('#contacto') ? 'contact' : 'page');
    if (href.indexOf('https://wa.me/') === 0) window.vtTrack('whatsapp_click', { location: where });
    else if (href.indexOf('mailto:') === 0) window.vtTrack('email_click', { location: where });
  });
})();
