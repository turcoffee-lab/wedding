/* Длинный кадр. Скрипты сайта. */
document.documentElement.classList.add('js');

/* ===== НАСТРОЙКИ ФОРМЫ ===== */
var FORM_ENDPOINT = '';              // 'send.php' на хостинге с PHP. Пусто = откроется почтовая программа
var FORM_EMAIL = 'info@your-domain.ru'; // ЗАМЕНИТЬ: реальная почта
var WEB3FORMS_KEY = '';              // только если используете Web3Forms (FORM_ENDPOINT = 'https://api.web3forms.com/submit')

(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ===== Время суток: часы в шапке и цвет под шапкой ===== */
  var barEl = $('#bar'), clock = $('#clock');
  var bands = $$('[data-time]');
  var anchors = []; // {y: середина блока на странице, t: минуты}

  function toMin(s) { var p = s.split(':'); return (+p[0]) * 60 + (+p[1]); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function measure() {
    var top = window.scrollY;
    anchors = bands.map(function (b) {
      var r = b.getBoundingClientRect();
      return { el: b, y: r.top + top + r.height / 2, top: r.top + top, bottom: r.bottom + top, t: toMin(b.getAttribute('data-time')) };
    });
  }

  function update() {
    if (!anchors.length) return;
    var y = window.scrollY + window.innerHeight * 0.5;
    var t;
    if (y <= anchors[0].y) { t = anchors[0].t; }
    else if (y >= anchors[anchors.length - 1].y) { t = anchors[anchors.length - 1].t; }
    else {
      for (var i = 0; i < anchors.length - 1; i++) {
        var a = anchors[i], b = anchors[i + 1];
        if (y >= a.y && y <= b.y) { t = a.t + (b.t - a.t) * (y - a.y) / (b.y - a.y); break; }
      }
    }
    t = Math.round(t) % 1440;
    clock.textContent = pad(Math.floor(t / 60)) + ':' + pad(t % 60);

    /* Какой блок сейчас под шапкой: от него зависят цвет шапки и её фон */
    var yb = window.scrollY + 32, cur = anchors[0].el;
    for (var j = 0; j < anchors.length; j++) { if (anchors[j].top <= yb) cur = anchors[j].el; }
    var tone = cur.getAttribute('data-tone') || 'light';
    if (barEl.getAttribute('data-tone') !== tone) barEl.setAttribute('data-tone', tone);
    var bg = getComputedStyle(cur).getPropertyValue('--bg').trim();
    if (bg) document.documentElement.style.setProperty('--cur-bg', bg);
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; update(); });
  }
  measure(); update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { measure(); update(); });
  window.addEventListener('load', function () { measure(); update(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); update(); });

  /* ===== Видео ===== */
  var modal = $('#modal'), frame = $('#frame'), closeBtn = $('.modal__close');
  var lastFocus = null;

  function videoSrc(v) {
    v = (v || '').trim();
    if (/^https?:\/\//i.test(v)) return { type: 'iframe', src: v };
    if (/\.(mp4|webm)$/i.test(v)) return { type: 'video', src: v };
    if (/^\d+$/.test(v)) return { type: 'iframe', src: 'https://player.vimeo.com/video/' + v + '?autoplay=1' };
    return { type: 'iframe', src: 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(v) + '?autoplay=1&rel=0' };
  }

  function openVideo(v, opener) {
    var s = videoSrc(v);
    lastFocus = opener || document.activeElement;
    frame.innerHTML = '';
    var el;
    if (s.type === 'video') {
      el = document.createElement('video');
      el.controls = true; el.autoplay = true; el.setAttribute('playsinline', '');
      el.src = s.src;
    } else {
      el = document.createElement('iframe');
      el.src = s.src;
      el.title = 'Свадебный фильм';
      el.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
      el.allowFullscreen = true;
    }
    frame.appendChild(el);
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function closeVideo() {
    if (modal.hidden) return;
    modal.hidden = true;
    frame.innerHTML = '';
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  $$('[data-video]').forEach(function (b) {
    b.addEventListener('click', function () { openVideo(b.getAttribute('data-video'), b); });
  });
  closeBtn.addEventListener('click', closeVideo);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeVideo(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeVideo();
  });

  /* ===== Форма ===== */
  var form = $('#form'), statusEl = $('#status');

  function say(text, bad) {
    statusEl.textContent = text;
    statusEl.classList.toggle('is-err', !!bad);
  }

  function validContact(v) {
    v = v.trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return true;
    if (/^@[A-Za-z0-9_]{5,32}$/.test(v)) return true;
    var d = v.replace(/\D/g, '');
    return /^[+\d\s()\-.]+$/.test(v) && d.length >= 6 && d.length <= 15;
  }

  function mark(name, bad) {
    var f = form.elements[name];
    if (f && f.closest) f.closest('.field').classList.toggle('is-bad', !!bad);
  }

  form.addEventListener('input', function (e) {
    if (e.target.closest && e.target.closest('.field')) e.target.closest('.field').classList.remove('is-bad');
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var data = {
      name: form.elements.name.value.trim(),
      contact: form.elements.contact.value.trim(),
      type: 'Свадьба',
      date: form.elements.date.value,
      message: form.elements.message.value.trim()
    };

    mark('name', false); mark('contact', false);
    if (!data.name) { mark('name', true); say('Укажите имя.', true); form.elements.name.focus(); return; }
    if (!validContact(data.contact)) { mark('contact', true); say('Укажите телефон, email или Telegram вида @name.', true); form.elements.contact.focus(); return; }
    if (!form.elements.consent.checked) { say('Подтвердите согласие на обработку персональных данных.', true); form.elements.consent.focus(); return; }

    /* Ловушка для роботов: ничего не отправляем */
    if (form.elements.website.value) { say('Спасибо! Мы свяжемся с вами в ближайшее время.'); form.reset(); return; }

    /* Дата передаётся внутри сообщения, чтобы работало и с send.php, и с Web3Forms */
    var msg = (data.date ? 'Дата свадьбы: ' + data.date + '\n' : '') + data.message;

    if (!FORM_ENDPOINT) {
      say('Открываем почтовую программу…');
      var body = 'Имя: ' + data.name + '\nКонтакт: ' + data.contact + '\n' + msg;
      window.location.href = 'mailto:' + FORM_EMAIL + '?subject=' + encodeURIComponent('Заявка: свадебная съёмка') + '&body=' + encodeURIComponent(body);
      return;
    }

    var payload = { name: data.name, contact: data.contact, type: data.type, message: msg };
    if (WEB3FORMS_KEY) payload.access_key = WEB3FORMS_KEY;

    var btn = $('button[type="submit"]', form);
    btn.disabled = true;
    say('Отправляем…');

    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, 12000);
    var fail = 'Не удалось отправить. Позвоните или напишите нам: ' + FORM_EMAIL;

    fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl.signal
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (r.ok && j.ok !== false && j.success !== false) {
          say('Спасибо! Мы свяжемся с вами в ближайшее время.');
          form.reset();
        } else if (r.status === 422 || r.status === 429) {
          say(j.error || j.message || fail, true);
        } else {
          say(fail, true);
        }
      });
    }).catch(function () {
      say(fail, true);
    }).then(function () {
      clearTimeout(timer);
      btn.disabled = false;
    });
  });
})();
