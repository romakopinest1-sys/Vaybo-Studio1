/* =========================================================
   Vaybo Studio — скрипт публічного сайту

   Розділи (шукайте за номером):
   1. Допоміжні функції      6. Анімації появи і лічильники
   2. Тема (світла/темна)    7. Роботи (завантажуються з Firebase)
   3. Курсор                 8. Форма заявки (зберігається в Firebase)
   4. Firebase               9. Облік візитів
   5. Навігація по сторінках

   Панелі додавання робіт тут НЕМАЄ — вона лише в admin.html.
   ========================================================= */
(function () {
    'use strict';

    /* ---------- 1. Допоміжні функції ---------- */
    function $(id) { return document.getElementById(id); }
    function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

    var root = document.documentElement;

    /* ---------- 2. Тема ---------- */
    root.setAttribute('data-theme', lsGet('veres-theme') || 'dark');

    var tBtn = $('theme-toggle');
    if (tBtn) {
        tBtn.onclick = function () {
            var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', next);
            lsSet('veres-theme', next);
        };
    }

    var mainEl = document.querySelector('main');
    if (mainEl) mainEl.classList.add('ready');

    /* ---------- 3. Курсор (крапка + кільце, колір береться з теми) ----------
       Кольори змінюються в style.css: --cd (крапка) і --cr (кільце). */
    if (window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        var cd = document.createElement('div'),
            cr = document.createElement('div');
        cd.className = 'cd';
        cr.className = 'cr';
        document.body.append(cd, cr);
        root.classList.add('hc');

        var mx = -100, my = -100, rx = -100, ry = -100, seen = false;

        document.addEventListener('mousemove', function (e) {
            mx = e.clientX;
            my = e.clientY;
            cd.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
            if (!seen) {
                seen = true;
                rx = mx;
                ry = my;
                cd.style.opacity = 1;
                cr.style.opacity = 1;
            }
        });

        document.addEventListener('mouseout', function (e) {
            if (!e.relatedTarget) {
                seen = false;
                cd.style.opacity = 0;
                cr.style.opacity = 0;
            }
        });

        document.addEventListener('mouseover', function (e) {
            var t = e.target.closest ? e.target.closest('a, button, summary, label, input, textarea, .chip') : null;
            cr.classList.toggle('big', !!t);
        });

        (function loop() {
            rx += (mx - rx) * 0.18;
            ry += (my - ry) * 0.18;
            cr.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
            requestAnimationFrame(loop);
        })();
    }

    /* ---------- 4. Firebase ---------- */
    var db = null;
    try {
        if (window.firebase && window.VAYBO_FIREBASE) {
            firebase.initializeApp(window.VAYBO_FIREBASE);
            db = firebase.firestore();
        }
    } catch (e) { db = null; }

    function stamp() { return firebase.firestore.FieldValue.serverTimestamp(); }

    /* ---------- 5. Навігація по сторінках ---------- */
    var pages = [].slice.call(document.querySelectorAll('.page')),
        links = [].slice.call(document.querySelectorAll('nav a')),
        nav = $('nav'),
        cur = $('cur'),
        first = true;

    var h1 = $('h1');
    if (h1 && h1.textContent) {
        h1.innerHTML = h1.textContent.split(' ').map(function (w, i) {
            return '<span class="w"><b style="--i:' + i + '">' + w + '</b></span>';
        }).join(' ');
    }

    function show(id) {
        pages.forEach(function (p) { p.classList.toggle('show', p.id === id); });
        links.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + id); });
        window.scrollTo(0, 0);
        if (nav) nav.classList.remove('open');
    }

    function route() {
        var id = (location.hash || '#home').slice(1);
        if (!$(id)) id = 'home';
        if (first) { first = false; show(id); return; }
        if (cur) { cur.classList.remove('go'); void cur.offsetWidth; cur.classList.add('go'); }
        setTimeout(function () { show(id); }, 430);
    }

    window.addEventListener('hashchange', route);
    route();

    var bgBtn = $('bg');
    if (bgBtn) bgBtn.onclick = function () { if (nav) nav.classList.toggle('open'); };

    // Кнопки «Замовити» на сторінці цін підставляють пакет у форму
    [].forEach.call(document.querySelectorAll('[data-pack]'), function (a) {
        a.addEventListener('click', function () {
            var m = $('m');
            if (m && !m.value.trim()) m.value = 'Хочу замовити пакет «' + a.getAttribute('data-pack') + '». ';
        });
    });

    /* ---------- 6. Анімації появи і лічильники ---------- */
    var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
            if (!e.isIntersecting) return;
            var el = e.target;
            io.unobserve(el);
            setTimeout(function () {
                el.classList.add('in');
                setTimeout(function () { el.classList.remove('rv', 'in'); }, 900);
            }, (el.dataset.d || 0) * 90);
        });
    }, { threshold: .12 });

    function watch(list) {
        [].forEach.call(list, function (el, i) {
            el.classList.add('rv');
            el.dataset.d = i % 4;
            io.observe(el);
        });
    }

    var io2 = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
            if (!e.isIntersecting) return;
            io2.unobserve(e.target);
            var el = e.target, n = +el.dataset.n, s = el.dataset.s || '', t0 = performance.now();
            (function f(t) {
                var p = Math.min((t - t0) / 1400, 1);
                el.textContent = Math.round(n * (1 - Math.pow(1 - p, 3))) + s;
                if (p < 1) requestAnimationFrame(f);
            })(t0);
        });
    }, { threshold: .5 });

    [].forEach.call(document.querySelectorAll('[data-n]'), function (b) { io2.observe(b); });

    var mt = $('mqt');
    if (mt) mt.innerHTML += mt.innerHTML;

    /* ---------- 7. Роботи ----------
       Дані лежать у Firebase (колекція "works"). Додає й видаляє їх
       лише власник через admin.html, а всі відвідувачі їх бачать. */
    var wg = $('wg'), hg = $('hg'), hw = $('hw'),
        works = [], loaded = false;

    var pal = [
        ["#cfe0f0", "#7fa6d1", "#274c77", "#f2a65a"],
        ["#d9e7da", "#8fb39a", "#2f5d50", "#f2c57a"],
        ["#efe0d0", "#d9a77a", "#7a4b33", "#f2a65a"],
        ["#dfe3ea", "#9aa8bd", "#3b4a63", "#f2a65a"],
        ["#d8ecee", "#7fbfc6", "#1f6470", "#f6c27a"],
        ["#e1dcef", "#a79bd1", "#47397a", "#f2a65a"],
        ["#ecdfc9", "#c2a15e", "#5a4420", "#f2a65a"],
        ["#d4e4f2", "#86abcf", "#1f3f66", "#f2b36b"]
    ];

    // Малюнок-заглушка, якщо в роботи немає фото
    function art(i) {
        var p = pal[i % pal.length], o = i * 7;
        return '<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g' + i + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + p[0] + '"/><stop offset="1" stop-color="#fff" stop-opacity=".6"/></linearGradient></defs><rect width="400" height="300" fill="url(#g' + i + ')"/><circle cx="' + (260 + o % 60) + '" cy="' + (80 + o % 30) + '" r="38" fill="' + p[3] + '"/><path d="M0 200 Q90 ' + (120 + o % 40) + ' 190 190 T400 ' + (160 + o % 30) + ' V300 H0Z" fill="' + p[1] + '"/><path d="M0 240 Q120 ' + (170 + o % 30) + ' 230 235 T400 215 V300 H0Z" fill="' + p[2] + '" opacity=".92"/><rect x="' + (40 + o % 30) + '" y="206" width="52" height="40" rx="4" fill="' + p[0] + '"/><path d="M' + (34 + o % 30) + ' 208 L' + (66 + o % 30) + ' 184 L' + (98 + o % 30) + ' 208Z" fill="' + p[3] + '"/></svg>';
    }

    function card(w, index) {
        var a = document.createElement('a');
        a.className = 'work';
        a.href = /^https?:\/\//i.test(w.u || '') ? w.u : '#';
        a.target = '_blank';
        a.rel = 'noopener';

        var ar = document.createElement('div');
        ar.className = 'art';
        if (w.img) {
            var img = document.createElement('img');
            img.src = w.img;
            img.alt = w.t;
            ar.append(img);
        } else {
            ar.innerHTML = art(index + 1);
        }

        var t = document.createElement('div');
        t.className = 't';
        var h = document.createElement('h3');
        h.textContent = w.t;
        var s = document.createElement('small');
        s.textContent = w.d;
        var g = document.createElement('span');
        g.className = 'go';
        g.textContent = 'Відкрити сайт ↗';
        t.append(h, document.createElement('br'), s, document.createElement('br'), g);
        a.append(ar, t);
        return a;
    }

    function draw() {
        if (wg) {
            wg.innerHTML = '';
            if (!works.length) {
                var em = document.createElement('div');
                em.className = 'empty';
                em.textContent = loaded
                    ? 'Портфоліо поповнюється — перші проєкти з’являться тут зовсім скоро.'
                    : 'Завантажуємо роботи…';
                wg.append(em);
            }
            works.forEach(function (w, i) { wg.append(card(w, i)); });
            watch(wg.children);
        }
        if (hg && hw) {
            hg.innerHTML = '';
            works.slice(0, 3).forEach(function (w, i) { hg.append(card(w, i)); });
            hw.hidden = !works.length;
            watch(hg.children);
        }
    }

    function loadWorks() {
        if (!db) { loaded = true; draw(); return; }
        db.collection('works').orderBy('created', 'desc').limit(60).get()
            .then(function (snap) {
                works = snap.docs.map(function (d) {
                    var x = d.data();
                    return { t: x.t || '', d: x.d || '', u: x.u || '', img: x.img || '' };
                });
            })
            .catch(function () {})
            .then(function () { loaded = true; draw(); });
    }

    draw();
    loadWorks();

    /* ---------- 8. Форма заявки ---------- */
    var sendBtn = $('send');
    if (sendBtn) {
        sendBtn.onclick = function () {
            var ok = $('ok'),
                name = $('n').value.trim().slice(0, 100),
                contact = $('e').value.trim().slice(0, 150),
                msg = $('m').value.trim().slice(0, 2000);

            function say(text) { ok.style.display = 'block'; ok.textContent = text; }

            if (!name || !contact) { say('Вкажіть ім’я та пошту або телефон.'); return; }
            if (!db) { say('Не вдалося надіслати. Напишіть нам на пошту romakopinest1@gmail.com'); return; }

            sendBtn.disabled = true;
            db.collection('requests').add({ name: name, contact: contact, msg: msg, created: stamp() })
                .then(function () {
                    say('Дякуємо, ' + name + '! Заявку отримано, ми скоро відповімо.');
                    $('n').value = '';
                    $('e').value = '';
                    $('m').value = '';
                })
                .catch(function () {
                    say('Не вдалося надіслати. Напишіть нам на пошту romakopinest1@gmail.com');
                })
                .then(function () { sendBtn.disabled = false; });
        };
    }

    /* ---------- 9. Облік візитів ----------
       Раз за сесію пишемо в колекцію "visits": IP, місто, браузер, сторінку
       і номер візиту цього відвідувача. Дивитись — у admin.html.
       Ваші власні візити (після входу в адмінку з цього браузера) не рахуються. */
    function getIp() {
        function ipify() {
            return fetch('https://api.ipify.org?format=json')
                .then(function (r) { return r.json(); })
                .then(function (j) { return { ip: j.ip || '' }; })
                .catch(function () { return {}; });
        }
        return fetch('https://ipapi.co/json/')
            .then(function (r) { if (!r.ok) throw 0; return r.json(); })
            .then(function (j) {
                if (!j.ip) throw 0;
                return { ip: j.ip, city: j.city || '', country: j.country_name || '' };
            })
            .catch(ipify);
    }

    function track() {
        if (!db || !window.fetch) return;
        try {
            if (lsGet('vaybo-owner') === '1') return;
            if (sessionStorage.getItem('vaybo-tracked')) return;
            sessionStorage.setItem('vaybo-tracked', '1');
        } catch (e) { return; }

        var vid = lsGet('vaybo-vid');
        if (!vid) {
            vid = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
            lsSet('vaybo-vid', vid);
        }
        var n = (parseInt(lsGet('vaybo-visits'), 10) || 0) + 1;
        lsSet('vaybo-visits', String(n));

        getIp().then(function (g) {
            return db.collection('visits').add({
                created: stamp(),
                ip: String(g.ip || '').slice(0, 64),
                city: String(g.city || '').slice(0, 80),
                country: String(g.country || '').slice(0, 80),
                page: (location.hash || '#home').slice(1, 41),
                ref: (document.referrer || '').slice(0, 200),
                ua: (navigator.userAgent || '').slice(0, 250),
                lang: (navigator.language || '').slice(0, 20),
                scr: screen.width + '×' + screen.height,
                vid: vid,
                n: n
            });
        }).catch(function () {});
    }

    track();
})();