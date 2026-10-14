/* ===== VANTOUR BOGOTÁ · main.js ===== */

(function () {
  'use strict';

  /* ---- LANGUAGE ----
     Cada idioma tiene su propia URL (/ = ES, /en/ = EN) con el texto ya en el HTML.
     La detección automática solo actúa en la primera visita a la raíz. */
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
      navToggle.setAttribute('aria-expanded', open);
    });
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => navLinks.classList.remove('open'));
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
          a.style.color = a.getAttribute('href') === '#' + id
            ? 'rgba(255,255,255,0.95)'
            : 'rgba(255,255,255,0.65)';
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

  revealEls.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(18px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    revealObserver.observe(el);
  });

  /* ---- CONTACT FORM ---- */
  const form = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');

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

      if (!nombre || !contacto || !servicio) {
        shakeForm();
        return;
      }

      // Construir el mensaje completo con todos los datos
      const msgTexto = buildWAMessage(nombre, contacto, servicio, ruta, fecha, personas, mensaje);

      // Guardar en variable global para que los botones del modal la usen
      pendingData = { nombre, contacto, servicio, ruta, fecha, personas, mensaje, msgTexto };

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

  function openChannelModal() {
    if (!overlay) return;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeChannelModal() {
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    pendingData = null;
  }

  if (btnClose)  btnClose.addEventListener('click', closeChannelModal);
  if (overlay)   overlay.addEventListener('click', e => { if (e.target === overlay) closeChannelModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeChannelModal(); });

  if (btnWA) {
    btnWA.addEventListener('click', () => {
      if (!pendingData) return;
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

  /* ---- SMOOTH DEST CARDS ---- */
  document.querySelectorAll('.dest-card').forEach(card => {
    card.addEventListener('click', () => {
      document.getElementById('contacto').scrollIntoView({ behavior: 'smooth' });
    });
  });

})();