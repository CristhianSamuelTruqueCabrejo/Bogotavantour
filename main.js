/* ===== VANTOUR BOGOTÁ · main.js ===== */

(function () {
  'use strict';

  /* ---- LANGUAGE SYSTEM ---- */

  function detectBrowserLang() {
    // navigator.languages devuelve array ordenado por preferencia del usuario
    // ej: ['es-CO', 'es', 'en-US'] o ['en-US', 'en']
    const langs = navigator.languages || [navigator.language || 'en'];
    for (const l of langs) {
      if (l.toLowerCase().startsWith('es')) return 'es';
    }
    return 'en';
  }

  // Si el usuario cambió manualmente el idioma alguna vez, respetar esa elección.
  // Si no, detectar automáticamente por el navegador.
  const savedLang = localStorage.getItem('vt-lang');
  let lang = savedLang || detectBrowserLang();

  function applyLang() {
    document.querySelectorAll('[data-es]').forEach(el => {
      const txt = el.getAttribute('data-' + lang);
      if (!txt) return;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = txt;
      } else if (el.tagName === 'OPTION') {
        el.textContent = txt;
      } else {
        el.innerHTML = txt;
      }
    });
    // Muestra la bandera+código del idioma AL QUE se puede cambiar
    const btn = document.getElementById('langBtn');
    if (btn) btn.textContent = lang === 'es' ? '🇺🇸 EN' : '🇨🇴 ES';
    document.documentElement.lang = lang;
  }

  const langBtn = document.getElementById('langBtn');
  if (langBtn) {
    langBtn.addEventListener('click', () => {
      lang = lang === 'es' ? 'en' : 'es';
      // Guardar preferencia manual — tiene prioridad sobre detección automática
      localStorage.setItem('vt-lang', lang);
      applyLang();
    });
  }

  applyLang();

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
    applyLang(); // actualizar textos bilingüe dentro del modal
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
      const url = 'https://wa.me/573000000000?text=' + encodeURIComponent(pendingData.msgTexto);
      window.open(url, '_blank');
      closeChannelModal();
    });
  }

  if (btnEmail) {
    btnEmail.addEventListener('click', () => {
      if (!pendingData) return;
      const subject = lang === 'es'
        ? 'Solicitud de cotización · ' + pendingData.nombre
        : 'Quote request · ' + pendingData.nombre;
      const body = pendingData.msgTexto.replace(/\*/g, ''); // quitar formato WA
      const url = 'mailto:reservas@vantourbogota.com'
        + '?subject=' + encodeURIComponent(subject)
        + '&body='    + encodeURIComponent(body);
      window.location.href = url;
      closeChannelModal();
    });
  }

  /* ---- UTILIDADES ---- */
  function copyToClipboard(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    } else {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch(_) {}
      document.body.removeChild(ta);
    }
  }

  function showToast(msg) {
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = [
      'position:fixed','bottom:90px','left:50%','transform:translateX(-50%)',
      'background:#1F1F1F','border:0.5px solid rgba(200,169,110,0.35)',
      'color:#fff','padding:10px 20px','border-radius:8px',
      'font-size:0.85rem','z-index:3000','white-space:nowrap',
      'box-shadow:0 4px 16px rgba(0,0,0,0.4)','transition:opacity 0.3s'
    ].join(';');
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3500);
  }

  function buildWAMessage(nombre, contacto, servicio, ruta, fecha, personas, mensaje) {
    const svcMap = {
      aeropuerto: 'Traslado aeropuerto',
      ejecutivo:  'Transporte ejecutivo',
      tour:       'Tour turístico',
      grupo:      'Grupo grande (15+ personas)'
    };
    let msg = '¡Hola! Quiero solicitar una cotización.\n\n';
    msg += '👤 *Nombre:* ' + nombre + '\n';
    msg += '📞 *Contacto:* ' + contacto + '\n';
    msg += '🚐 *Servicio:* ' + (svcMap[servicio] || servicio) + '\n';
    if (ruta)     msg += '📍 *Ruta:* ' + ruta + '\n';
    if (fecha)    msg += '📅 *Fecha:* ' + formatFecha(fecha) + '\n';
    if (personas) msg += '👥 *Personas:* ' + personas + '\n';
    if (mensaje)  msg += '💬 *Mensaje:* ' + mensaje + '\n';
    msg += '\n_Enviado desde vantourbogota.com_';
    return msg;
  }

  function formatFecha(fechaISO) {
    if (!fechaISO) return '';
    const [y, m, d] = fechaISO.split('-');
    const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    return d + ' ' + (meses[parseInt(m, 10) - 1] || m) + ' ' + y;
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