/* ===== VANTOUR BOGOTÁ · main.js ===== */

(function () {
  'use strict';

  /* ---- LANGUAGE ----
     Cada idioma tiene su propia URL (/ = ES, /en/ = EN) con el texto ya en el HTML.
     La detección automática solo actúa en la primera visita a la raíz. */
  const track = (name, params) => { if (window.vtTrack) window.vtTrack(name, params); };
  const lang = document.documentElement.lang === 'en' ? 'en' : 'es';
  const isBot = /bot|crawl|spider|slurp|lighthouse|headless/i.test(navigator.userAgent) || navigator.webdriver;

  function detectBrowserLang() {
    const langs = navigator.languages || [navigator.language || 'en'];
    for (const l of langs) {
      if (l.toLowerCase().startsWith('es')) return 'es';
    }
    return 'en';
  }

  function getSavedLang() {
    try { return localStorage.getItem('vt-lang'); } catch (_) { return null; }
  }

  function saveLang(l) {
    try { localStorage.setItem('vt-lang', l); } catch (_) {}
  }

  // La elección manual (botón de idioma) tiene prioridad sobre la detección del navegador
  const langBtn = document.getElementById('langBtn') || document.querySelector('.lang-toggle');
  if (langBtn) {
    langBtn.addEventListener('click', () => saveLang(langBtn.dataset.lang));
  }

  const saved = getSavedLang();
  if (!isBot) {
    const wanted = saved || detectBrowserLang();
    const path = location.pathname.replace(/index\.html$/, '');
    if (wanted === 'en' && lang === 'es' && path === '/') {
      location.replace('/en/' + location.search + location.hash);
    }
  }

  /* ---- NAV SCROLL ---- */
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }, { passive: true });

  /* ---- MOBILE MENU ---- */
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---- ACTIVE NAV LINK ON SCROLL ---- */
  const sections = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navAnchors.forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(s => observer.observe(s));

  /* ---- SCROLL REVEAL ---- */
  const revealEls = document.querySelectorAll(
    '.service-card, .fleet-card, .dest-card, .review-card, .stat'
  );

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reduceMotion) revealEls.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(18px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    revealObserver.observe(el);
  });

  /* ---- CONTACT FORM ---- */
  const form = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');
  const formError = document.getElementById('formError');

  // No permitir fechas pasadas
  if (form && form.fecha) {
    const t = new Date();
    form.fecha.min = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
  }

  // Las tarjetas de servicio y destino llevan al formulario con los datos ya elegidos
  document.querySelectorAll('[data-service], [data-route]').forEach(el => {
    el.addEventListener('click', () => {
      if (!form) return;
      if (el.dataset.service) form.servicio.value = el.dataset.service;
      if (el.dataset.route) {
        form.servicio.value = 'tour';
        form.ruta.value = 'Bogotá → ' + el.dataset.route;
      }
    });
  });

  // Los enlaces del blog llegan con ?servicio=tour&ruta=Villa de Leyva para prellenar el formulario
  if (form) {
    const qs = new URLSearchParams(location.search);
    const svc = qs.get('servicio');
    const rt = qs.get('ruta');
    if (svc && Array.from(form.servicio.options).some(o => o.value === svc)) form.servicio.value = svc;
    if (rt) form.ruta.value = (svc === 'aeropuerto' ? '' : 'Bogotá → ') + rt.slice(0, 80);
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Capturar TODOS los valores antes de cualquier reset
      const nombre   = form.nombre.value.trim();
      const contacto = form.contacto_val.value.trim();
      const servicio = form.servicio.value;
      const ruta     = form.ruta.value.trim();
      const fecha    = form.fecha.value;
      const personas = form.personas.value;
      const mensaje  = form.mensaje.value.trim();

      const missing = [['nombre', nombre], ['contacto_val', contacto], ['servicio', servicio]]
        .filter(f => !f[1]).map(f => form[f[0]]);
      form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
      if (formError) formError.hidden = missing.length === 0;
      if (missing.length) {
        missing.forEach(el => el.setAttribute('aria-invalid', 'true'));
        missing[0].focus();
        shakeForm();
        return;
      }

      // Construir el mensaje completo con todos los datos
      const msgTexto = buildWAMessage(nombre, contacto, servicio, ruta, fecha, personas, mensaje);

      // Guardar en variable global para que los botones del modal la usen
      pendingData = { nombre, contacto, servicio, ruta, fecha, personas, mensaje, msgTexto };

      track('generate_lead', { service: servicio, people: personas || '' });

      // Resetear formulario y mostrar modal de selección de canal
      form.reset();
      if (success) {
        success.classList.add('visible');
        setTimeout(() => success.classList.remove('visible'), 4000);
      }
      openChannelModal();
    });
  }

  /* ---- DATOS PENDIENTES (compartido entre form y modal) ---- */
  let pendingData = null;

  /* ---- MODAL DE CANAL ---- */
  const overlay   = document.getElementById('channelOverlay');
  const btnClose  = document.getElementById('channelClose');
  const btnWA     = document.getElementById('chWhatsApp');
  const btnEmail  = document.getElementById('chEmail');

  let lastFocus = null;

  function openChannelModal() {
    if (!overlay) return;
    lastFocus = document.activeElement;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (btnWA) btnWA.focus();
  }

  function closeChannelModal() {
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    pendingData = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  if (btnClose)  btnClose.addEventListener('click', closeChannelModal);
  if (overlay)   overlay.addEventListener('click', e => { if (e.target === overlay) closeChannelModal(); });
  document.addEventListener('keydown', e => {
    if (!overlay || !overlay.classList.contains('open')) return;
    if (e.key === 'Escape') { closeChannelModal(); return; }
    if (e.key !== 'Tab') return;
    // Mantener el foco dentro del modal
    const f = overlay.querySelectorAll('button');
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  if (btnWA) {
    btnWA.addEventListener('click', () => {
      if (!pendingData) return;
      track('whatsapp_click', { location: 'form_modal' });
      const url = 'https://wa.me/573153934336?text=' + encodeURIComponent(pendingData.msgTexto);
      window.open(url, '_blank');
      closeChannelModal();
    });
  }

  if (btnEmail) {
    btnEmail.addEventListener('click', () => {
      if (!pendingData) return;
      const subject = TXT.subject + pendingData.nombre;
      const body = pendingData.msgTexto.replace(/\*/g, ''); // quitar formato WA
      track('email_click', { location: 'form_modal' });
      const url = 'mailto:vantourbogota@gmail.com'
        + '?subject=' + encodeURIComponent(subject)
        + '&body='    + encodeURIComponent(body);
      window.location.href = url;
      closeChannelModal();
    });
  }

  /* ---- UTILIDADES ---- */
  const TXT = {
    es: {
      svc: { aeropuerto: 'Traslado aeropuerto', ejecutivo: 'Transporte ejecutivo', tour: 'Tour turístico', grupo: 'Grupo grande (15+ personas)' },
      hi: '¡Hola! Quiero solicitar una cotización.', name: 'Nombre', contact: 'Contacto', service: 'Servicio',
      route: 'Ruta', date: 'Fecha', people: 'Personas', msg: 'Mensaje', sent: 'Enviado desde vantourbogota.com',
      subject: 'Solicitud de cotización · ',
      months: ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
    },
    en: {
      svc: { aeropuerto: 'Airport transfer', ejecutivo: 'Executive transport', tour: 'Tourist tour', grupo: 'Large group (15+ people)' },
      hi: 'Hello! I would like to request a quote.', name: 'Name', contact: 'Contact', service: 'Service',
      route: 'Route', date: 'Date', people: 'People', msg: 'Message', sent: 'Sent from vantourbogota.com',
      subject: 'Quote request · ',
      months: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    }
  }[lang];

  function buildWAMessage(nombre, contacto, servicio, ruta, fecha, personas, mensaje) {
    let msg = TXT.hi + '\n\n';
    msg += '👤 *' + TXT.name + ':* ' + nombre + '\n';
    msg += '📞 *' + TXT.contact + ':* ' + contacto + '\n';
    msg += '🚐 *' + TXT.service + ':* ' + (TXT.svc[servicio] || servicio) + '\n';
    if (ruta)     msg += '📍 *' + TXT.route + ':* ' + ruta + '\n';
    if (fecha)    msg += '📅 *' + TXT.date + ':* ' + formatFecha(fecha) + '\n';
    if (personas) msg += '👥 *' + TXT.people + ':* ' + personas + '\n';
    if (mensaje)  msg += '💬 *' + TXT.msg + ':* ' + mensaje + '\n';
    msg += '\n_' + TXT.sent + '_';
    return msg;
  }

  function formatFecha(fechaISO) {
    if (!fechaISO) return '';
    const [y, m, d] = fechaISO.split('-');
    return d + ' ' + (TXT.months[parseInt(m, 10) - 1] || m) + ' ' + y;
  }

  function shakeForm() {
    if (!form) return;
    form.style.animation = 'none';
    form.offsetHeight;
    form.style.animation = 'shake 0.35s ease';
    setTimeout(() => { form.style.animation = ''; }, 400);
  }

  /* ---- INJECT SHAKE KEYFRAME ---- */
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake {
      0%,100%{transform:translateX(0)}
      20%{transform:translateX(-6px)}
      40%{transform:translateX(6px)}
      60%{transform:translateX(-4px)}
      80%{transform:translateX(4px)}
    }
  `;
  document.head.appendChild(style);

})();