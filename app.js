/* Catalogue SACRI v7. Données de démonstration. Aucune donnée n'est envoyée : devis préparés sur l'appareil. */
(function () {
  'use strict';
  var A = window.ARTICLES || [], M = window.MACHINES || [], TYPES = window.TYPES || [];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var ico = function (n, c) { return '<svg' + (c ? ' class="' + c + '"' : '') + ' aria-hidden="true"><use href="#i-' + n + '"/></svg>'; };
  var norm = function (t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’'`]/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim(); };
  var uniq = function (a) { return a.filter(function (v, i, s) { return s.indexOf(v) === i; }); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  var DISPO = { stock: ['En stock', 'ok', 1], faible: ['Stock faible', 'low', 2], commande: ['Sur commande', 'cmd', 3], service: ['Prestation atelier', 'svc', 4], etude: ['Sur étude', 'svc', 5] };
  var TYPE_ICO = { 'Chaîne': 'saw', 'Guide-chaîne': 'saw', 'Pignon': 'gear', 'Filtre': 'filter', 'Bougie': 'spark', 'Lanceur': 'wrench', 'Outil de coupe': 'blade', 'Lame': 'blade', 'Huile et graisse': 'oil', 'Affûtage': 'wrench', 'Protection': 'shield', 'Accessoire': 'drop' };
  var byId = {}, bySlug = {}, byCode = {};
  A.forEach(function (x) { byId[x.id] = x; });
  M.forEach(function (m) { bySlug[m.slug] = m; byCode[m.code] = m; });
  var FAMS = uniq(A.map(function (x) { return x.fam; }));
  var SOCS = uniq(A.map(function (x) { return x.soc; }));
  var MCODES = M.map(function (m) { return m.code; });
  var famIco = {}; A.forEach(function (x) { famIco[x.fam] = x.ico; });
  var parts = function (code) { return A.filter(function (x) { return x.type !== 'Machine' && x.machines.indexOf(code) > -1; }); };
  var dispoLbl = function (d) { var v = DISPO[d] || DISPO.commande; return '<span class="dispo ' + v[1] + '">' + v[0] + '</span>'; };
  var mlink = function (code) { var m = byCode[code]; return m ? '<a class="chip" href="#/machine/' + m.slug + '">' + esc(m.nom) + '</a>' : '<span class="chip">' + esc(code) + '</span>'; };

  /* ---------- Recherche tolérante aux fautes ---------- */
  var STOP = ['pour', 'de', 'des', 'du', 'la', 'le', 'les', 'un', 'une', 'et', 'a', 'au', 'aux', 'en', 'avec', 'sur', 'ma', 'mon', 'mes', 'je', 'cherche', 'besoin', 'piece', 'pieces', 'ref', 'reference', 'd', 'l', 'stihl', 'compatible', 'cm'];
  var SYN = { karcher: 'nettoyeur', pulverisateur: 'atomiseur', scie: 'tronconneuse', gazon: 'tondeuse', herbe: 'debroussailleuse', chainsaw: 'tronconneuse',
    barre: 'guide', durite: 'flexible', tuyau: 'flexible', essence: 'carburant', demarreur: 'lanceur', corde: 'cordon', ficelle: 'cordon', melange: 'temps',
    caoutchouc: 'hevea', moteur2t: 'temps', debroussailleur: 'debroussailleuse', tronco: 'tronconneuse', epi: 'epi', casque: 'casque', bidon: 'huile', lubrifiant: 'huile' };
  function toks(t) {
    var w = norm(t).split(' ').filter(Boolean), out = [];
    for (var i = 0; i < w.length; i++) {
      if (/^[a-z]{1,3}$/.test(w[i]) && w[i + 1] && /^\d{2,4}$/.test(w[i + 1])) { out.push(w[i] + w[i + 1]); i++; continue; }
      out.push(w[i]);
    }
    return out;
  }
  function sing(w) { return w.length > 3 ? w.replace(/(s|x)$/, '') : w; }
  A.forEach(function (x) {
    var idx = [];
    var add = function (t, wt) { toks(t).forEach(function (k, i, arr) { idx.push([sing(k), wt]); if (arr[i + 1] && /\d/.test(k + arr[i + 1])) idx.push([k + arr[i + 1], wt]); }); };
    add(x.nom, 3); add(x.machines.join(' , '), 3); add(x.type, 2); add(x.tags, 1.6); add(x.fam, 1); add(x.soc, 1); add(x.desc, 0.6);
    var n = +x.id.slice(3); idx.push(['sc' + n, 5], ['sc' + x.id.slice(3), 5], [x.id.slice(3), 4]);
    var seen = {}; x._ix = idx.filter(function (p) { var k = p[0] + '|' + p[1]; if (seen[k]) return false; seen[k] = 1; return true; });
    x._n = norm(x.nom);
  });
  var VOCAB = uniq([].concat.apply([], A.map(function (x) { return x._ix.filter(function (p) { return p[1] >= 1 && !/^\d+$/.test(p[0]); }).map(function (p) { return p[0]; }); })));
  function dist(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    var d = [], i, j;
    for (i = 0; i <= a.length; i++) { d[i] = [i]; }
    for (j = 0; j <= b.length; j++) d[0][j] = j;
    for (i = 1; i <= a.length; i++) {
      var rowMin = 99;
      for (j = 1; j <= b.length; j++) {
        var c = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        rowMin = Math.min(rowMin, d[i][j]);
      }
      if (rowMin > max) return max + 1;
    }
    return d[a.length][b.length];
  }
  var tol = function (n) { return n <= 3 ? 0 : n <= 5 ? 1 : 2; };
  function tokMatch(q, t) {
    if (q === t) return 1;
    var num = /^\d+$/.test(q);
    if (t.indexOf(q) === 0 && (q.length >= 2 || num)) return num ? (q.length >= 2 ? 0.8 : 0) : 0.85;
    if (num || /^\d+$/.test(t)) return 0;
    var k = tol(q.length); if (!k) return 0;
    var d = dist(q, t, k); if (d <= k) return 0.75 - 0.1 * d;
    if (t.length > q.length && q.length >= 4) { d = dist(q, t.slice(0, q.length), 1); if (d <= 1) return 0.55; }
    return 0;
  }
  function parseQ(q) {
    var raw = norm(q), lenCm = null;
    var m = raw.match(/(\d{2,3})\s*cm\b/); if (m) lenCm = +m[1];
    var ref = String(q).match(/\bsc\s*-?\s*0*(\d{1,4})\b/i);
    var t = toks(q).map(sing).filter(function (w) { return STOP.indexOf(w) < 0; });
    if (lenCm) t = t.filter(function (w) { return w !== String(lenCm); });
    return { t: t, cm: lenCm, ref: ref ? +ref[1] : null };
  }
  function scoreArt(x, P, loose) {
    if (P.ref != null) return +x.id.slice(3) === P.ref ? 1000 : 0;
    var s = 0, miss = 0;
    P.t.forEach(function (w) {
      var alts = [w]; if (SYN[w] && SYN[w] !== w) alts.push(SYN[w]);
      var best = 0;
      x._ix.forEach(function (p) { alts.forEach(function (a, ai) { var v = tokMatch(a, p[0]) * p[1] * (ai ? 0.8 : 1); if (v > best) best = v; }); });
      if (!best) miss++; s += best;
    });
    if (miss && (!loose || miss > P.t.length / 2)) return 0;
    if (P.cm) { if (x.cm) { var d = Math.abs(P.cm - x.cm); s += d === 0 ? 8 : d <= 5 ? 5 : -6; } else s -= 3; }
    if (P.t.length && x._n.indexOf(SYN[P.t[0]] || P.t[0]) === 0) s += 2;
    if (x.type === 'Machine' && P.t.length > 1) s -= 1;
    return s > 0 ? s : (P.t.length ? 0 : 1);
  }
  function search(q, list) {
    list = list || A;
    var P = parseQ(q);
    if (!P.t.length && P.ref == null && !P.cm) return { r: list.slice(), loose: false };
    var r = list.map(function (x) { return [scoreArt(x, P), x]; }).filter(function (p) { return p[0] > 0; }), loose = false;
    if (!r.length && P.t.length > 1) { loose = true; r = list.map(function (x) { return [scoreArt(x, P, true), x]; }).filter(function (p) { return p[0] > 0; }); }
    r.sort(function (a, b) { return b[0] - a[0]; });
    return { r: r.map(function (p) { return p[1]; }), loose: loose, s: r };
  }
  function didYouMean(q) {
    var P = parseQ(q), changed = false;
    var fixed = P.t.map(function (w) {
      if (/\d/.test(w) || VOCAB.indexOf(w) > -1 || VOCAB.some(function (v) { return v.indexOf(w) === 0; })) return w;
      var best = null, bd = 4; VOCAB.forEach(function (v) { var d = dist(w, v, 3); if (d < bd) { bd = d; best = v; } });
      if (best) { changed = true; return best; } return w;
    });
    return changed ? fixed.join(' ') : null;
  }
  function machMatch(q) {
    var c = norm(q).replace(/\s+/g, '');
    if (c.length < 2) return [];
    return M.filter(function (m) {
      var k = norm(m.code).replace(/\s+/g, ''), n = norm(m.nom + ' ' + m.type);
      return k.indexOf(c) === 0 || c.indexOf(k) > -1 || n.split(' ').some(function (w) { return tokMatch(norm(q).split(' ')[0], w) > 0.5; });
    }).slice(0, 4);
  }

  /* ---------- État : devis, consultés, comparateur ---------- */
  var cart = store.get('sacri-devis-v6', null);
  if (!cart) { var old = store.get('sacri-demande', {}); cart = {}; Object.keys(old).forEach(function (k) { if (byId[k]) cart[k] = old[k]; }); }
  Object.keys(cart).forEach(function (k) { if (!byId[k] || !(cart[k] > 0)) delete cart[k]; });
  var seenList = store.get('sacri-vus', []).filter(function (id) { return byId[id]; });
  var cmpSel = store.get('sacri-comparer', []).filter(function (s) { return bySlug[s]; });
  function saveCart() { store.set('sacri-devis-v6', cart); cartCount(); }
  function cartCount() {
    var n = 0; for (var k in cart) n += cart[k];
    $$('.cart-n').forEach(function (b) { b.textContent = n; b.classList.toggle('on', n > 0); });
    return n;
  }
  function setQty(id, q) {
    q = Math.max(0, Math.min(999, Math.round(+q || 0)));
    if (q) cart[id] = q; else delete cart[id];
    saveCart(); refreshQty(id);
  }
  function addOne(id, n) { var was = cart[id] || 0; setQty(id, was + (n || 1)); if (!was) toast('Ajouté au devis : ' + byId[id].nom); }
  function qtyCtl(id, big) {
    var q = cart[id] || 0;
    if (!q) return '<button type="button" class="add' + (big ? ' big' : '') + '" data-add="' + id + '">' + ico('plus') + '<span>Ajouter au devis</span></button>';
    return '<div class="qty' + (big ? ' big' : '') + '" data-qid="' + id + '"><button type="button" data-q="-1" data-id="' + id + '" aria-label="Retirer une unité">' + ico('minus') + '</button>' +
      '<input type="number" inputmode="numeric" min="0" max="999" value="' + q + '" data-qin="' + id + '" aria-label="Quantité pour ' + esc(byId[id].nom) + '">' +
      '<button type="button" data-q="1" data-id="' + id + '" aria-label="Ajouter une unité">' + ico('plus') + '</button></div>';
  }
  function refreshQty(id) {
    $$('[data-slot="' + id + '"]').forEach(function (el) {
      var q = cart[id] || 0, inp = el.querySelector('[data-qin]');
      if (q && inp) { if (+inp.value !== q) inp.value = q; return; }
      el.innerHTML = qtyCtl(id, el.hasAttribute('data-big'));
    });
    if (route.name === 'devis') renderDevis(true);
  }
  function remember(id) { seenList = [id].concat(seenList.filter(function (x) { return x !== id; })).slice(0, 10); store.set('sacri-vus', seenList); }
  function toast(t) { var el = $('#toast'); el.innerHTML = ico('check') + '<span>' + esc(t) + '</span>'; el.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(function () { el.hidden = true; }, 2600); }
  function copy(t, msg) {
    var ok = function () { toast(msg || 'Copié'); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(ok, function () { fallback(); }); else fallback();
    function fallback() { var ta = document.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); ok(); } catch (e) {} document.body.removeChild(ta); }
  }

  /* ---------- Composants ---------- */
  function pic(x, cls) {
    return x.img ? '<img class="fit-' + (x.fit || 'contain') + '" src="' + x.img + '" alt="' + esc(x.nom) + '" loading="lazy" decoding="async">' :
      '<div class="ph' + (cls ? ' ' + cls : '') + '">' + ico(x.ico) + '</div>';
  }
  function card(x) {
    var mm = x.machines.map(function (c) { return byCode[c] ? byCode[c].code : c; });
    return '<article class="card' + (x.fit === 'cover' ? ' cov' : '') + '">' +
      '<a class="pic" href="#/article/' + x.id + '" aria-label="' + esc(x.nom) + '">' + pic(x) + '</a>' +
      '<div class="body"><div class="meta"><span class="soc">' + esc(x.soc) + '</span>' + dispoLbl(x.dispo) + '</div>' +
      '<h3><a href="#/article/' + x.id + '">' + esc(x.nom) + '</a></h3><p class="ref">Réf. ' + x.id + '</p>' +
      (mm.length ? '<p class="mach">' + ico('check') + '<span>' + esc(mm.slice(0, 3).join(', ') + (mm.length > 3 ? ' +' + (mm.length - 3) : '')) + '</span></p>' : '<p class="mach muted"><span>' + esc(x.type === x.fam ? x.fam : x.type) + '</span></p>') +
      '<div class="slot" data-slot="' + x.id + '">' + qtyCtl(x.id) + '</div></div></article>';
  }
  function row(x) {
    return '<div class="lrow"><a class="lpic" href="#/article/' + x.id + '">' + pic(x, 'sm') + '</a>' +
      '<div class="ltxt"><a href="#/article/' + x.id + '"><b>' + esc(x.nom) + '</b></a><small>Réf. ' + x.id + ' · ' + esc(x.soc) + '</small>' + dispoLbl(x.dispo) + '</div>' +
      '<div class="slot" data-slot="' + x.id + '">' + qtyCtl(x.id) + '</div></div>';
  }
  function mini(x) { return '<a class="mini-c" href="#/article/' + x.id + '">' + pic(x, 'sm') + '<b>' + esc(x.nom) + '</b><small>Réf. ' + x.id + '</small></a>'; }
  function seenBlock(excl) {
    var l = seenList.filter(function (id) { return id !== excl; }).slice(0, 8).map(function (id) { return byId[id]; });
    if (!l.length) return '';
    return '<section class="blk"><div class="bh"><h2>Derniers articles consultés</h2><button type="button" class="lnk" data-clear-seen>Effacer</button></div><div class="hrow">' + l.map(mini).join('') + '</div></section>';
  }
  function crumbs(list) { return '<nav class="crumbs" aria-label="Fil d’Ariane">' + list.map(function (c, i) { return i < list.length - 1 ? '<a href="' + c[1] + '">' + esc(c[0]) + '</a>' + ico('chev') : '<span>' + esc(c[0]) + '</span>'; }).join('') + '</nav>'; }
  function machCard(m, withCmp) {
    var n = parts(m.code).length, on = cmpSel.indexOf(m.slug) > -1;
    return '<div class="mcard"><a href="#/machine/' + m.slug + '" class="mc-link"><span class="mpic">' + (m.img ? '<img src="' + m.img + '" alt="" loading="lazy">' : ico('saw')) + '</span>' +
      '<span class="mtx"><b>' + esc(m.nom) + '</b><small>' + esc(m.type) + '</small><em>' + n + ' pièce' + (n > 1 ? 's' : '') + ' compatible' + (n > 1 ? 's' : '') + '</em></span></a>' +
      (withCmp ? '<label class="cmp-ck"><input type="checkbox" data-cmp="' + m.slug + '"' + (on ? ' checked' : '') + '>Comparer</label>' : '') + '</div>';
  }

  /* ---------- Routeur ---------- */
  var app = $('#app'), route = {};
  function parseHash() {
    var h = location.hash.replace(/^#\/?/, ''), qs = '', i = h.indexOf('?');
    if (i > -1) { qs = h.slice(i + 1); h = h.slice(0, i); }
    var p = {}; qs.split('&').forEach(function (kv) { if (!kv) return; var a = kv.split('='); p[decodeURIComponent(a[0])] = decodeURIComponent((a[1] || '').replace(/\+/g, ' ')); });
    var seg = h.split('/').filter(Boolean).map(decodeURIComponent);
    return { seg: seg, p: p, name: seg[0] || 'home' };
  }
  function qsOf(o) { var a = []; Object.keys(o).forEach(function (k) { if (o[k] !== '' && o[k] != null && !(Array.isArray(o[k]) && !o[k].length)) a.push(encodeURIComponent(k) + '=' + encodeURIComponent(Array.isArray(o[k]) ? o[k].join(',') : o[k]).replace(/%20/g, '+').replace(/%2C/g, ',')); }); return a.length ? '?' + a.join('&') : ''; }
  function go(h, replace) { if (replace) { history.replaceState(null, '', h); render(); } else location.hash = h; }
  function render() {
    var prev = route; route = parseHash(); close3d();
    $$('[data-nav]').forEach(function (a) { var n = a.getAttribute('data-nav'); a.classList.toggle('on', n === route.name || (n === 'machines' && route.name === 'machine') || (n === 'catalogue' && route.name === 'article')); });
    closeSugg();
    var keepScroll = prev.name === 'catalogue' && route.name === 'catalogue';
    var r = route.name;
    if (r === 'catalogue') renderCatalogue(keepScroll);
    else if (r === 'article') renderArticle(route.seg[1]);
    else if (r === 'machines') renderMachines();
    else if (r === 'machine') { if (route.seg[2] === 'eclate') renderEclate(route.seg[1]); else renderMachine(route.seg[1]); }
    else if (r === 'comparer') renderCompare();
    else if (r === 'devis') renderDevis();
    else renderHome();
    if (r !== 'catalogue') { var qi = $('#q'); if (qi && document.activeElement !== qi) { qi.value = ''; $('#qclear').hidden = true; } }
    if (!keepScroll && !(r === 'machine' && route.seg[2] === 'eclate' && prev.name === 'machine' && prev.seg[2] === 'eclate')) window.scrollTo(0, 0);
    document.title = (route.title ? route.title + ' · ' : '') + 'Catalogue SACRI';
    document.body.classList.toggle('r-home', r === 'home');
  }

  /* ---------- Accueil ---------- */
  var FAM_IMG = { 'Forestier et agricole': 'agri', 'Espaces verts': 'ev', 'Lavage et nettoyage': 'lavage', 'Lubrifiants': 'lub', 'Flexibles et raccords': 'flex',
    'Transmission et roulements': 'trans', 'Pneumatique et hydraulique': 'pneu', 'Sécurité et EPI': 'epi', 'Levage': 'levage', 'Outillage': 'outillage',
    'Outils de coupe': 'coupe', 'Construction métallique': 'metal' };
  var TOP = ['Chaîne de tronçonneuse, guide 63 cm', 'Bougie d’allumage pour moteur 2 temps', 'Filtre à air de tronçonneuse', 'Huile 2 temps pour mélange', 'Fil nylon de coupe 2,4 mm', 'Huile de chaîne de tronçonneuse'];
  var MARQ = ['STIHL', 'Beta', 'Flexibles', '77 Lubricants', 'Hitachi', 'Briggs and Stratton', 'Lemaitre', 'EPI', 'Parker', 'Castelgarden', 'Ergos', 'NTN SNR', 'Optibelt', 'JSP', 'Sauer Danfoss', 'FAIP', 'Hi-Force'];
  function renderHome() {
    route.title = '';
    var fams = FAMS.map(function (f) { var n = A.filter(function (x) { return x.fam === f; }).length; return '<a class="ftile" href="#/catalogue' + qsOf({ fam: f }) + '"><span class="ft-img"><img src="img/fam-' + (FAM_IMG[f] || 'agri') + '.jpg" alt="" loading="lazy" decoding="async"></span><span class="ft-t"><b>' + esc(f) + '</b><small>' + n + ' article' + (n > 1 ? 's' : '') + '</small></span></a>'; }).join('');
    var top = TOP.map(byName).filter(Boolean);
    app.innerHTML =
      '<section class="hero2"><img class="h2-img" src="img/hero-ms.jpg" alt="Tronçonneuse STIHL posée sur un tronc" fetchpriority="high"><div class="h2-shade"></div><div class="wrap h2-in">' +
      '<p class="eyebrow">Groupe SACRI, Abidjan · Représentant exclusif STIHL en Côte d’Ivoire</p>' +
      '<h1>La bonne pièce, <em>trouvée en quelques secondes.</em></h1>' +
      '<p class="lead">Par référence, par machine ou en décrivant votre besoin. Ajoutez les pièces à votre liste, envoyez la demande de devis en un geste.</p>' +
      '<form class="search big" id="hero-search" role="search" autocomplete="off"><svg class="ic" aria-hidden="true"><use href="#i-search"/></svg>' +
      '<input id="hq" type="search" placeholder="Ex. chaîne MS 661, huile 2 temps, SC-0032" aria-label="Rechercher une pièce" enterkeyhint="search"><button type="submit">Rechercher</button><div class="sugg" id="hsugg" role="listbox" hidden></div></form>' +
      '<div class="examples"><span>Essayez :</span>' + ['chaîne MS 661', 'huile 2 temps', 'filtre FS 400', 'tronsoneuse', 'SC-0032'].map(function (e) { return '<a class="ex" href="#/catalogue' + qsOf({ q: e }) + '">' + esc(e) + '</a>'; }).join('') + '</div>' +
      '</div></section>' +
      '<section class="reas" aria-label="Nos engagements"><div class="wrap reas-in">' +
      [['shield', 'Pièces d’origine', 'Représentant exclusif STIHL'], ['wrench', 'Atelier et SAV', 'Techniciens qualifiés'], ['clock', 'Depuis 1985', 'À Abidjan'], ['check', 'Certifiée ISO 9001', 'Société SACRI']]
        .map(function (r) { return '<div class="r">' + ico(r[0]) + '<span><b>' + r[1] + '</b><small>' + r[2] + '</small></span></div>'; }).join('') + '</div></section>' +
      '<div class="wrap">' +
      '<section class="blk"><div class="bh"><h2>Familles de produits</h2><a class="lnk" href="#/catalogue">Tout le catalogue</a></div><div class="ftiles">' + fams + '</div></section>' +
      '<section class="blk"><div class="bh"><h2>Les plus demandées</h2><a class="lnk" href="#/catalogue">Voir tout</a></div><div class="grid top6">' + top.map(card).join('') + '</div></section>' +
      '<section class="blk"><div class="bh"><h2>Trouvez par machine</h2><a class="lnk" href="#/machines">Toutes les machines</a></div>' +
      '<label class="msel"><span>Ma machine</span><select id="home-mach"><option value="">Choisir une machine STIHL</option>' + M.map(function (m) { return '<option value="' + m.slug + '">' + esc(m.nom) + ' · ' + esc(m.type) + '</option>'; }).join('') + '</select></label>' +
      '<div class="mgrid">' + M.slice(0, 5).map(function (m) { return machCard(m); }).join('') + '</div></section>' +
      '<section class="blk tools"><a class="tool" href="#/machine/ms661">' + ico('box') + '<span><b>Voir en 3D</b><small>La MS 661 et ses pièces d’usure</small></span>' + ico('chev', 'go') + '</a>' +
      '<a class="tool" href="#/machine/ms661/eclate">' + ico('explode') + '<span><b>Vue éclatée</b><small>Touchez une pièce de la tronçonneuse</small></span>' + ico('chev', 'go') + '</a>' +
      '<a class="tool" href="#/comparer">' + ico('cols') + '<span><b>Comparer</b><small>2 ou 3 machines côte à côte</small></span>' + ico('chev', 'go') + '</a>' +
      '<a class="tool" href="#/devis">' + ico('file') + '<span><b>Mon devis</b><small>WhatsApp, e-mail ou PDF</small></span>' + ico('chev', 'go') + '</a></section>' +
      seenBlock() +
      '<section class="blk brands"><div class="bh"><h2>Les marques distribuées</h2></div><ul class="logos">' + MARQ.map(function (n, i) { return '<li><img src="img/marques/m' + (i < 10 ? '0' : '') + i + '.png" alt="' + esc(n) + '" loading="lazy"></li>'; }).join('') + '</ul></section>' +
      '<section class="blk groupe"><div class="bh"><h2>Cinq sociétés, une seule recherche</h2></div><div class="socs">' +
      [['tree', 'SACRI', 'Matériel forestier, agricole et industriel. Représentant exclusif STIHL.'], ['gear', 'Trans-Roulements', 'Transmission, roulements et flexibles.'], ['gauge', 'PST-CI', 'Pneumatique et hydraulique : fourniture, réparation, SAV.'], ['blade', 'SAFIR', 'Scies à ruban, outils de coupe et affûtage pour le bois.'], ['beam', 'DEFI', 'Construction métallique, tuyauterie et chaudronnerie.']]
        .map(function (s) { return '<a class="s" href="#/catalogue' + qsOf({ soc: s[1] }) + '">' + ico(s[0]) + '<b>' + s[1] + '</b><span>' + s[2] + '</span></a>'; }).join('') + '</div></section></div>';
    $('#home-mach').addEventListener('change', function () { if (this.value) go('#/machine/' + this.value); });
    attachSugg($('#hq'), $('#hsugg'), $('#hero-search'));
  }

  /* ---------- Catalogue ---------- */
  var PAGE = 24, shown = PAGE;
  function readF() {
    var p = route.p;
    return { q: p.q || '', fam: p.fam || '', mach: p.mach || '', soc: p.soc ? p.soc.split(',').filter(function (s) { return SOCS.indexOf(s) > -1; }) : [],
      dispo: p.dispo ? p.dispo.split(',').filter(function (s) { return DISPO[s]; }) : [], tri: p.tri || 'pert' };
  }
  function setF(f, replace) { go('#/catalogue' + qsOf({ q: f.q, fam: f.fam, mach: f.mach, soc: f.soc, dispo: f.dispo, tri: f.tri === 'pert' ? '' : f.tri }), replace); }
  function applyF(f, skip) {
    var base = A.filter(function (x) {
      return (skip === 'fam' || !f.fam || x.fam === f.fam) && (skip === 'mach' || !f.mach || x.machines.indexOf(f.mach) > -1) &&
        (skip === 'soc' || !f.soc.length || f.soc.indexOf(x.soc) > -1) && (skip === 'dispo' || !f.dispo.length || f.dispo.indexOf(x.dispo) > -1);
    });
    var s = search(f.q, base), r = s.r;
    if (f.tri === 'az') r = r.slice().sort(function (a, b) { return a.nom.localeCompare(b.nom, 'fr'); });
    else if (f.tri === 'dispo') r = r.slice().sort(function (a, b) { return DISPO[a.dispo][2] - DISPO[b.dispo][2]; });
    else if (f.tri === 'ref') r = r.slice().sort(function (a, b) { return a.id < b.id ? -1 : 1; });
    else if (!f.q) r = r.filter(function (x) { return x.img; }).concat(r.filter(function (x) { return !x.img; }));
    return { r: r, loose: s.loose };
  }
  function facetCount(f, key, val) {
    var g = JSON.parse(JSON.stringify(f));
    if (key === 'soc' || key === 'dispo') g[key] = [val]; else g[key] = val;
    return applyF(g, null).r.length;
  }
  function renderCatalogue(keep) {
    var f = readF(), res = applyF(f), r = res.r;
    route.title = f.q ? 'Recherche « ' + f.q + ' »' : (f.fam || 'Catalogue');
    var qi = $('#q'); if (qi && document.activeElement !== qi) { qi.value = f.q; $('#qclear').hidden = !f.q; }
    if (!keep) shown = PAGE;
    var chips = [];
    if (f.q) chips.push(['q', '', 'Recherche : « ' + f.q + ' »']);
    if (f.fam) chips.push(['fam', '', f.fam]);
    if (f.mach) chips.push(['mach', '', 'Machine ' + f.mach]);
    f.soc.forEach(function (s) { chips.push(['soc', s, s]); });
    f.dispo.forEach(function (s) { chips.push(['dispo', s, DISPO[s][0]]); });
    var nAct = chips.filter(function (c) { return c[0] !== 'q'; }).length;
    var dym = !r.length && f.q ? didYouMean(f.q) : null;
    var side = '<div class="side-h"><b>' + ico('filter') + 'Filtres</b><button type="button" class="lnk" data-reset>Tout effacer</button></div>' +
      '<div class="fgroup"><label class="flbl" for="f-mach">Machine</label><select id="f-mach"><option value="">Toutes les machines</option>' + MCODES.map(function (c) { return '<option value="' + esc(c) + '"' + (f.mach === c ? ' selected' : '') + '>' + esc(byCode[c].nom) + ' (' + facetCount(f, 'mach', c) + ')</option>'; }).join('') + '</select></div>' +
      '<div class="fgroup"><label class="flbl" for="f-fam">Famille</label><select id="f-fam"><option value="">Toutes les familles</option>' + FAMS.map(function (c) { return '<option' + (f.fam === c ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select></div>' +
      '<div class="fgroup"><span class="flbl">Société du groupe</span><div class="checks">' + SOCS.map(function (s) { return '<label class="ck"><input type="checkbox" data-f="soc" value="' + esc(s) + '"' + (f.soc.indexOf(s) > -1 ? ' checked' : '') + '><span>' + esc(s) + '</span><em>' + facetCount(Object.assign({}, f, { soc: [] }), 'soc', s) + '</em></label>'; }).join('') + '</div></div>' +
      '<div class="fgroup"><span class="flbl">Disponibilité</span><div class="checks">' + Object.keys(DISPO).filter(function (k) { return A.some(function (x) { return x.dispo === k; }); }).map(function (s) { return '<label class="ck"><input type="checkbox" data-f="dispo" value="' + s + '"' + (f.dispo.indexOf(s) > -1 ? ' checked' : '') + '><span>' + DISPO[s][0] + '</span><em>' + facetCount(Object.assign({}, f, { dispo: [] }), 'dispo', s) + '</em></label>'; }).join('') + '</div></div>' +
      '<button type="button" class="btn side-close" data-side-close>Voir les ' + r.length + ' résultat' + (r.length > 1 ? 's' : '') + '</button>';
    var famRow = '<div class="famrow" role="list"><a role="listitem" class="fchip' + (!f.fam ? ' on' : '') + '" href="#/catalogue' + qsOf({ q: f.q, mach: f.mach, soc: f.soc, dispo: f.dispo }) + '">Toutes</a>' + FAMS.map(function (c) { return '<a role="listitem" class="fchip' + (f.fam === c ? ' on' : '') + '" href="#/catalogue' + qsOf({ q: f.q, fam: c, mach: f.mach, soc: f.soc, dispo: f.dispo }) + '">' + ico(famIco[c]) + esc(c) + '</a>'; }).join('') + '</div>';
    var wasOpen = $('#side') && $('#side').classList.contains('open');
    app.innerHTML = '<div class="wrap page">' + crumbs([['Accueil', '#/'], ['Catalogue', '#/catalogue']].concat(f.fam ? [[f.fam, '']] : [])) +
      '<div class="cat-h"><h1>' + esc(f.q ? 'Résultats pour « ' + f.q + ' »' : (f.fam || 'Toutes les pièces')) + '</h1><p class="count" id="count">' + r.length + ' résultat' + (r.length > 1 ? 's' : '') + (res.loose ? ', avec une partie des mots seulement' : '') + '</p></div>' +
      famRow +
      '<div class="cat"><aside class="side' + (wasOpen ? ' open' : '') + '" id="side" aria-label="Filtres">' + side + '</aside><div class="side-bg" data-side-close></div>' +
      '<div class="results"><div class="rtools"><button type="button" class="btn-ln filt-btn" data-side-open>' + ico('filter') + 'Filtres' + (nAct ? ' <b class="nb">' + nAct + '</b>' : '') + '</button>' +
      '<label class="sortl"><span>Trier</span><select id="sort"><option value="pert">Pertinence</option><option value="az"' + (f.tri === 'az' ? ' selected' : '') + '>Nom, de A à Z</option><option value="ref"' + (f.tri === 'ref' ? ' selected' : '') + '>Référence</option><option value="dispo"' + (f.tri === 'dispo' ? ' selected' : '') + '>Disponibles d’abord</option></select></label></div>' +
      (chips.length ? '<div class="active">' + chips.map(function (c) { return '<button type="button" class="tagf" data-k="' + c[0] + '" data-v="' + esc(c[1]) + '" aria-label="Retirer ' + esc(c[2]) + '">' + esc(c[2]) + ico('x') + '</button>'; }).join('') + (chips.length > 1 ? '<button type="button" class="lnk" data-reset>Tout effacer</button>' : '') + '</div>' : '') +
      (r.length ? '<div class="grid">' + r.slice(0, shown).map(card).join('') + '</div>' + (r.length > shown ? '<div class="more-w"><button type="button" class="btn-ln" data-more>Afficher plus (' + (r.length - shown) + ' restants)</button></div>' : '') :
        '<div class="empty"><b>Aucun article ne correspond.</b>' + (dym ? '<p>Vouliez-vous dire <a href="#/catalogue' + qsOf({ q: dym }) + '">« ' + esc(dym) + ' »</a> ?</p>' : '') + '<p>Essayez un autre mot, retirez un filtre, ou demandez à un conseiller SACRI en ajoutant votre besoin dans <a href="#/devis">votre devis</a>.</p></div>') +
      '</div></div>' + seenBlock() + '</div>';
    var fx = function () { return readF(); };
    $('#f-mach').addEventListener('change', function () { var g = fx(); g.mach = this.value; setF(g); });
    $('#f-fam').addEventListener('change', function () { var g = fx(); g.fam = this.value; setF(g); });
    $$('#side input[type=checkbox]').forEach(function (c) { c.addEventListener('change', function () { var g = fx(), k = c.getAttribute('data-f'); g[k] = $$('#side input[data-f="' + k + '"]:checked').map(function (i) { return i.value; }); setF(g); }); });
    $('#sort').addEventListener('change', function () { var g = fx(); g.tri = this.value; setF(g, true); });
  }

  /* ---------- Fiche article ---------- */
  function renderArticle(id) {
    var x = byId[String(id || '').toUpperCase()];
    if (!x) { app.innerHTML = '<div class="wrap page"><div class="empty"><b>Article introuvable.</b><p>La référence « ' + esc(id) + ' » n’existe pas dans cet échantillon. <a href="#/catalogue">Retour au catalogue</a></p></div></div>'; return; }
    remember(x.id); route.title = x.nom;
    var m = x.type === 'Machine' ? byCode[x.machines[0]] : null;
    var credit = x.lic ? 'Photo : <a href="' + x.lic.u + '" target="_blank" rel="noopener">' + esc(x.lic.a) + '</a>, ' + esc(x.lic.l) + ', Wikimedia Commons' : (x.src ? 'Photo : ' + esc(x.src) : 'Photo à fournir par SACRI');
    var specs = x.specs.concat([['Référence', x.id], ['Famille', x.fam], ['Société', x.soc], ['Prix', 'Sur devis']]);
    var rel = (x.rel || []).map(function (r) { return byId[r]; }).filter(Boolean);
    var docs = (x.docs || []).map(function (d) { return '<a class="doc" href="' + d[1] + '" target="_blank" rel="noopener">' + ico('link') + '<span>' + esc(d[0]) + '</span></a>'; }).join('');
    app.innerHTML = '<div class="wrap page art">' + crumbs([['Accueil', '#/'], ['Catalogue', '#/catalogue'], [x.fam, '#/catalogue' + qsOf({ fam: x.fam })], [x.nom, '']]) +
      '<div class="a-grid"><div class="a-pic"><div class="a-img">' + pic(x, 'big') + '</div><p class="credit">' + credit + '</p></div>' +
      '<div class="a-info"><p class="soc">' + esc(x.soc) + ' · ' + esc(x.type === x.fam ? x.fam : x.type) + '</p><h1>' + esc(x.nom) + '</h1>' +
      '<p class="a-ref">Réf. <b>' + x.id + '</b><button type="button" class="lnk sm" data-copylink>' + ico('link') + 'Copier le lien</button></p>' +
      '<p class="a-desc">' + esc(x.desc) + '</p>' +
      '<div class="a-stock"><h2 class="h3">Disponibilité dans le groupe</h2><ul>' + x.stock.map(function (s) { return '<li><span>' + esc(s[0]) + '</span>' + dispoLbl(s[1]) + '</li>'; }).join('') + '</ul></div>' +
      '<div class="a-buy"><div class="slot" data-slot="' + x.id + '" data-big>' + qtyCtl(x.id, true) + '</div>' +
      '<a class="btn btn-wa" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent('Bonjour SACRI, je souhaite un devis pour : ' + x.nom + ' (réf. ' + x.id + ').\n' + location.href.split('#')[0] + '#/article/' + x.id) + '">' + ico('chat') + 'Demander sur WhatsApp</a></div>' +
      '<p class="muted sm">Prix sur devis. Un conseiller SACRI confirme la compatibilité avant toute commande.</p>' +
      (m ? '<div class="a-mach"><a class="btn" href="#/machine/' + m.slug + '">' + ico('list') + 'Voir les ' + parts(m.code).length + ' pièces compatibles</a>' + (m.eclate ? '<a class="btn-ln" href="#/machine/' + m.slug + '/eclate">' + ico('explode') + 'Vue éclatée</a>' : '') + (m.d3 ? '<a class="btn-ln" href="#/machine/' + m.slug + '?vue=3d">' + ico('box') + 'Voir en 3D</a>' : '') + '</div>' : '') +
      '</div></div>' +
      '<div class="a-cols"><section class="blk"><h2>Caractéristiques techniques</h2><table class="specs"><tbody>' + specs.map(function (s) { return '<tr><th scope="row">' + esc(s[0]) + '</th><td>' + esc(s[1]) + '</td></tr>'; }).join('') + '</tbody></table>' +
      (m ? '<p class="muted sm">Caractéristiques relevées sur la fiche STIHL du modèle.</p>' : '') + '</section>' +
      '<div><section class="blk"><h2>' + (m ? 'Machine' : 'Machines compatibles') + '</h2>' + (x.machines.length ? '<div class="chips">' + x.machines.map(mlink).join('') + '</div>' : '<p class="muted">Pièce universelle ou sur mesure : précisez votre équipement dans la demande de devis.</p>') + '</section>' +
      '<section class="blk"><h2>Documents</h2><div class="docs"><button type="button" class="doc" data-fiche-pdf="' + x.id + '">' + ico('down') + '<span>Fiche article (PDF)</span></button>' + docs + '</div></section></div></div>' +
      (rel.length ? '<section class="blk"><h2>Souvent demandés avec</h2><div class="grid">' + rel.map(card).join('') + '</div></section>' : '') +
      seenBlock(x.id) + '</div>';
  }

  /* ---------- Machines ---------- */
  function cmpBar() {
    var n = cmpSel.length;
    return '<div class="cmpbar' + (n ? ' on' : '') + '" id="cmpbar"><span>' + (n ? n + ' machine' + (n > 1 ? 's' : '') + ' sélectionnée' + (n > 1 ? 's' : '') : 'Cochez 2 ou 3 machines à comparer') + '</span>' +
      (n ? '<button type="button" class="lnk" data-cmp-clear>Vider</button>' : '') + '<a class="btn' + (n < 2 ? ' dis' : '') + '" href="#/comparer' + qsOf({ m: cmpSel }) + '"' + (n < 2 ? ' aria-disabled="true" tabindex="-1"' : '') + '>' + ico('cols') + 'Comparer</a></div>';
  }
  function renderMachines() {
    route.title = 'Machines';
    app.innerHTML = '<div class="wrap page">' + crumbs([['Accueil', '#/'], ['Machines', '']]) +
      '<div class="cat-h"><h1>Trouvez les pièces de votre machine</h1><p class="count">' + M.length + ' machines STIHL. Choisissez la vôtre pour voir toutes ses pièces et consommables, rangés par type.</p></div>' +
      '<div class="mgrid all">' + M.map(function (m) { return machCard(m, true); }).join('') + '</div>' + cmpBar() + '</div>';
  }
  var USURE = ['Chaîne', 'Guide-chaîne', 'Bougie', 'Filtre', 'Pignon', 'Lanceur', 'Outil de coupe', 'Lame'];
  function renderMachine(slug) {
    var m = bySlug[slug];
    if (!m) { app.innerHTML = '<div class="wrap page"><div class="empty"><b>Machine introuvable.</b><p><a href="#/machines">Voir les machines</a></p></div></div>'; return; }
    route.title = m.nom;
    var ps = parts(m.code), groups = TYPES.map(function (t) { return [t, ps.filter(function (x) { return x.type === t; })]; }).filter(function (g) { return g[1].length; });
    var other = ps.filter(function (x) { return TYPES.indexOf(x.type) < 0; }); if (other.length) groups.push(['Autres', other]);
    var mart = byId[m.id], gal = (m.gal && m.gal.length ? m.gal : (m.img ? [m.img] : []));
    var usure = []; USURE.forEach(function (t) { var y = ps.filter(function (x) { return x.type === t; })[0]; if (y && usure.length < 4) usure.push(y); });
    var rel = (mart.rel || []).map(function (r) { return byId[r]; }).filter(function (y) { return y && usure.indexOf(y) < 0; }).slice(0, 4);
    var specs = [['Type', m.type], ['Énergie', m.energie]].concat(m.specs).concat([['Usage', m.usage], ['Référence', m.id], ['Prix', 'Sur devis']]);
    app.innerHTML = '<div class="wrap page">' + crumbs([['Accueil', '#/'], ['Machines', '#/machines'], [m.nom, '']]) +
      '<div class="m-head2"><div class="gal">' +
      '<div class="gal-main" id="gal-main">' + (gal[0] ? '<img src="' + gal[0] + '" alt="' + esc(m.nom) + '">' : '') +
      (m.d3 ? '<button type="button" class="b3d" data-3d>' + ico('box') + 'Voir en 3D</button>' : '') + '</div>' +
      (gal.length > 1 ? '<div class="gal-th" role="list">' + gal.map(function (g, i) { return '<button type="button" role="listitem" class="' + (i ? '' : 'on') + '" data-gal="' + g + '" aria-label="Vue ' + (i + 1) + ' sur ' + gal.length + '"><img src="' + g + '" alt="" loading="lazy"></button>'; }).join('') +
      (m.d3 ? '<button type="button" class="th3d" data-3d aria-label="Voir en 3D">' + ico('box') + '<span>3D</span></button>' : '') + '</div>' : '') +
      (gal.length > 1 ? '<p class="credit">Photos : STIHL (fiche produit) et sacri-ci.com.</p>' : '') + '</div>' +
      '<div class="m-txt"><p class="soc">' + esc(m.type) + '</p><h1>' + esc(m.nom) + '</h1><p class="a-desc">' + esc(m.usage) + '</p>' +
      '<p class="price">Prix sur devis · ' + dispoLbl(mart.dispo) + '</p>' +
      '<div class="slot inl" data-slot="' + mart.id + '" data-big>' + qtyCtl(mart.id, true) + '</div>' +
      '<div class="m-act">' + (m.d3 ? '<button type="button" class="btn-ln" data-3d>' + ico('box') + 'Voir en 3D</button>' : '') +
      (m.eclate ? '<a class="btn-ln" href="#/machine/' + m.slug + '/eclate">' + ico('explode') + 'Vue éclatée</a>' : '') +
      '<a class="btn-ln" href="#/comparer' + qsOf({ m: [m.slug].concat(M.filter(function (o) { return o.type === m.type && o.slug !== m.slug; }).slice(0, 1).map(function (o) { return o.slug; })) }) + '">' + ico('cols') + 'Comparer</a>' +
      '<a class="btn-ln" href="#/article/' + m.id + '">' + ico('file') + 'Fiche et PDF</a></div>' +
      '<table class="specs m-specs"><caption>Caractéristiques</caption><tbody>' + specs.map(function (s) { return '<tr><th scope="row">' + esc(s[0]) + '</th><td>' + esc(s[1]) + '</td></tr>'; }).join('') + '</tbody></table>' +
      (m.docs.length ? '<p class="muted sm">Relevées sur la fiche STIHL du modèle : ' + m.docs.map(function (d) { return '<a href="' + d[1] + '" target="_blank" rel="noopener">' + esc(d[0]) + '</a>'; }).join(', ') + '.</p>' : '') +
      '</div></div>' +
      (usure.length ? '<section class="blk usure"><div class="bh"><h2>' + ico('wrench') + 'Pièces d’usure à prévoir</h2><span class="muted sm">À garder en stock pour ne pas arrêter le chantier</span></div><div class="grid u4">' + usure.map(card).join('') + '</div></section>' : '') +
      (rel.length ? '<section class="blk"><div class="bh"><h2>Souvent commandé ensemble</h2></div><div class="grid u4">' + rel.map(card).join('') + '</div></section>' : '') +
      '<label class="msel"><span>Changer de machine</span><select id="mach-sw">' + M.map(function (o) { return '<option value="' + o.slug + '"' + (o.slug === m.slug ? ' selected' : '') + '>' + esc(o.nom) + '</option>'; }).join('') + '</select></label>' +
      '<section class="blk"><div class="bh"><h2>' + ps.length + ' pièces et consommables compatibles</h2><a class="lnk" href="#/catalogue' + qsOf({ mach: m.code }) + '">Filtrer dans le catalogue</a></div>' +
      '<div class="tjump">' + groups.map(function (g) { return '<a href="#/machine/' + m.slug + '" data-jump="t-' + norm(g[0]).replace(/ /g, '-') + '">' + ico(TYPE_ICO[g[0]] || 'box') + esc(g[0]) + '<small>' + g[1].length + '</small></a>'; }).join('') + '</div>' +
      groups.map(function (g) { return '<div class="tgroup" id="t-' + norm(g[0]).replace(/ /g, '-') + '"><h3>' + ico(TYPE_ICO[g[0]] || 'box') + esc(g[0]) + '</h3><div class="lgrid">' + g[1].map(row).join('') + '</div></div>'; }).join('') +
      (ps.length ? '' : '<p class="muted">Aucune pièce de cet échantillon n’est encore rattachée à cette machine. Demandez-la dans votre devis.</p>') + '</section></div>';
    $('#mach-sw').addEventListener('change', function () { go('#/machine/' + this.value); });
    if (route.p.vue === '3d' && m.d3) open3d(m);
  }
  /* ---------- Vue 3D intégrée (model-viewer chargé à la demande) ---------- */
  var mvLoaded = false;
  function open3d(m) {
    if (!m.d3) return;
    if (!mvLoaded) { var sc = document.createElement('script'); sc.type = 'module'; sc.src = 'https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js'; document.head.appendChild(sc); mvLoaded = true; }
    var d = document.createElement('div'); d.className = 'm3d'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', 'Vue 3D, ' + m.nom);
    d.innerHTML = '<div class="m3d-box"><div class="m3d-h"><div><p class="eyebrow">Vue 3D</p><b>' + esc(m.type) + '</b></div><button type="button" class="m3d-x" data-3d-close aria-label="Fermer la vue 3D">' + ico('x') + '</button></div>' +
      '<model-viewer src="' + m.d3.glb + '" ios-src="' + m.d3.usdz + '" alt="' + esc(m.type) + ' en 3D" camera-controls touch-action="pan-y" interaction-prompt="none" environment-image="neutral" exposure="1.05" shadow-intensity="1" camera-orbit="300deg 66deg auto" ar ar-modes="webxr scene-viewer quick-look" ar-placement="floor" loading="eager"></model-viewer>' +
      '<div class="m3d-f"><span>Glissez pour tourner, pincez pour zoomer. Sur téléphone : posez-la chez vous en réalité augmentée.</span>' +
      '<div class="m3d-act"><a class="btn-ln" href="#/machine/' + m.slug + '/eclate" data-3d-close>' + ico('explode') + 'Pièces d’usure (vue éclatée)</a><button type="button" class="btn" data-add="' + m.id + '">' + ico('plus') + 'Ajouter au devis</button></div>' +
      '<p class="credit">' + esc(m.d3.credit) + ' <a href="' + m.d3.url + '" target="_blank" rel="noopener">Source</a>. Modèle illustratif, non contractuel.</p></div></div>';
    document.body.appendChild(d); document.body.classList.add('lock');
    var x = d.querySelector('.m3d-x'); if (x) x.focus();
  }
  function close3d() { var d = $('.m3d'); if (d) d.remove(); document.body.classList.remove('lock'); }

  /* ---------- Vue éclatée (tronçonneuse, dessin sans marque) ---------- */
  var byName = function (n) { return A.filter(function (x) { return x.nom === n; })[0]; };
  var EC = [
    { k: 'filtre', lab: 'Filtre à air', ids: ['Filtre à air de tronçonneuse'], hx: 488, hy: 78, lx: 520, ly: 84, ta: 'start' },
    { k: 'bougie', lab: 'Bougie', ids: ['Bougie d’allumage pour moteur 2 temps'], hx: 206, hy: 104, lx: 174, ly: 110, ta: 'end' },
    { k: 'lanceur', lab: 'Cordon de lanceur', ids: ['Cordon de lanceur'], hx: 420, hy: 478, lx: 420, ly: 536, ta: 'middle' },
    { k: 'crepine', lab: 'Crépine de carburant', ids: ['Crépine de carburant'], hx: 206, hy: 470, lx: 206, ly: 528, ta: 'middle' },
    { k: 'pignon', lab: 'Pignon de chaîne', ids: ['Pignon de chaîne à bague'], hx: 585, hy: 196, lx: 617, ly: 202, ta: 'start' },
    { k: 'guide', lab: 'Guide-chaîne', ids: ['Guide-chaîne 63 cm', 'Guide-chaîne 50 cm'], hx: 858, hy: 246, lx: 826, ly: 252, ta: 'end' },
    { k: 'chaine', lab: 'Chaîne', ids: ['Chaîne de tronçonneuse, guide 63 cm', 'Chaîne de tronçonneuse, guide 50 cm'], hx: 858, hy: 492, lx: 826, ly: 498, ta: 'end' },
    { k: 'huile', lab: 'Huile de chaîne', ids: ['Huile de chaîne de tronçonneuse'], hx: 570, hy: 470, lx: 600, ly: 476, ta: 'start' }
  ];
  function gear(cx, cy, ro, ri, n) {
    var p = [], i, a;
    for (i = 0; i < n * 2; i++) { a = Math.PI * i / n; var r = i % 2 ? ri : ro; p.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1)); }
    return p.join(' ');
  }
  function eclateSVG() {
    var S = 'stroke="#4A4744" stroke-width="2.5" stroke-linejoin="round"', L = 'class="lead" stroke="#B5B0AA" stroke-width="2" stroke-dasharray="6 6" fill="none"';
    var part = function (k, inner, hit) { return '<g class="part" data-k="' + k + '" tabindex="-1">' + (hit ? '<rect class="hit" ' + hit + ' fill="transparent"/>' : '') + inner + '</g>'; };
    var pleats = ''; for (var i = 342; i < 434; i += 9) pleats += '<path d="M' + i + ',108V130" stroke="#8E8A85" stroke-width="1.5"/>';
    var mesh = ''; for (var j = 448; j < 480; j += 7) mesh += '<path d="M260,' + j + 'H284" stroke="#8E8A85" stroke-width="1.2"/>';
    var fins = ''; for (var f = 238; f < 300; f += 9) fins += '<path d="M410,' + f + 'H498" stroke="#B5B0AA" stroke-width="2"/>';
    var svg = '<svg viewBox="0 0 900 556" class="ecl" role="img" aria-label="Vue éclatée d’une tronçonneuse thermique : touchez une pièce">' +
      '<rect x="0" y="0" width="900" height="556" fill="#fff"/>' +
      // repères d'éclatement
      '<path ' + L + ' d="M385,134V206"/><path ' + L + ' d="M262,152V212"/><path ' + L + ' d="M330,346L350,456"/><path ' + L + ' d="M272,384V438"/>' +
      '<path ' + L + ' d="M542,305H555"/><path ' + L + ' d="M585,218V274"/><path ' + L + ' d="M615,305H628"/><path ' + L + ' d="M755,330V386"/><path ' + L + ' d="M488,384V430"/>' +
      // corps (non cliquable)
      '<g class="base">' +
      '<path d="M250,246H152Q110,246 110,288V332Q110,374 152,374H250V342H162Q144,342 144,324V296Q144,278 162,278H250Z" fill="#E6E3DF" ' + S + '/>' +
      '<rect x="240" y="214" width="282" height="170" rx="24" fill="#F5F4F2" ' + S + '/>' + fins +
      '<circle cx="330" cy="300" r="46" fill="#fff" ' + S + '/><circle cx="330" cy="300" r="30" fill="none" stroke="#B5B0AA" stroke-width="2"/><circle cx="330" cy="300" r="9" fill="#E6E3DF" ' + S + '/>' +
      '<rect x="500" y="258" width="44" height="94" rx="12" fill="#E6E3DF" ' + S + '/>' +
      '<circle cx="272" cy="372" r="11" fill="#fff" ' + S + '/><circle cx="488" cy="372" r="11" fill="#fff" ' + S + '/>' +
      '<path d="M292,214V190Q292,166 316,166H476Q500,166 506,188L524,256" fill="none" stroke="#3A3836" stroke-width="13" stroke-linecap="round"/>' +
      '<path d="M524,212L552,168" fill="none" stroke="#3A3836" stroke-width="9" stroke-linecap="round"/>' +
      '</g>' +
      part('filtre', '<rect x="318" y="58" width="134" height="36" rx="11" fill="#E6E3DF" ' + S + '/><rect x="334" y="104" width="102" height="30" rx="6" fill="#fff" ' + S + '/>' + pleats, 'x="300" y="44" width="170" height="100"') +
      part('bougie', '<rect x="257" y="76" width="10" height="12" rx="2" fill="#8E8A85"/><rect x="253" y="86" width="18" height="32" rx="5" fill="#fff" ' + S + '/><rect x="249" y="116" width="26" height="14" rx="2" fill="#E6E3DF" ' + S + '/><rect x="255" y="130" width="14" height="20" fill="#B5B0AA" ' + S + '/>', 'x="236" y="66" width="52" height="92"') +
      part('lanceur', '<path d="M330,346L350,456" stroke="#3A3836" stroke-width="3"/><rect x="316" y="456" width="70" height="22" rx="11" fill="#3A3836"/>', 'x="300" y="420" width="104" height="70"') +
      part('crepine', '<rect x="258" y="438" width="28" height="46" rx="9" fill="#fff" ' + S + '/>' + mesh + '<rect x="266" y="430" width="12" height="10" fill="#B5B0AA"/>', 'x="240" y="420" width="64" height="80"') +
      part('pignon', '<polygon points="' + gear(585, 305, 30, 22, 8) + '" fill="#E6E3DF" ' + S + '/><circle cx="585" cy="305" r="12" fill="#fff" ' + S + '/>', 'x="548" y="266" width="76" height="78"') +
      part('guide', '<rect x="630" y="282" width="252" height="46" rx="23" fill="#F5F4F2" ' + S + '/><rect x="642" y="294" width="228" height="22" rx="11" fill="none" stroke="#B5B0AA" stroke-width="2"/><circle cx="858" cy="305" r="7" fill="#fff" ' + S + '/><rect x="650" y="300" width="28" height="10" rx="5" fill="#fff" ' + S + '/>', 'x="620" y="270" width="272" height="70"') +
      part('chaine', '<rect x="620" y="388" width="272" height="66" rx="33" fill="none" stroke="#3A3836" stroke-width="8" stroke-dasharray="10 5"/><rect x="630" y="398" width="252" height="46" rx="23" fill="none" stroke="#B5B0AA" stroke-width="1.5"/>', 'x="610" y="378" width="292" height="88"') +
      part('huile', '<path d="M488,432C488,432 470,454 470,466A18,18 0 0 0 506,466C506,454 488,432 488,432Z" fill="#FDF0E8" ' + S + '/>', 'x="460" y="424" width="56" height="66"') +
      EC.map(function (p, i) { return '<g class="hs" data-k="' + p.k + '" role="button" tabindex="0" aria-label="' + (i + 1) + ', ' + esc(p.lab) + '"><circle cx="' + p.hx + '" cy="' + p.hy + '" r="22"/><text x="' + p.hx + '" y="' + (p.hy + 7) + '" text-anchor="middle">' + (i + 1) + '</text>' +
        '<text class="lab" x="' + p.lx + '" y="' + p.ly + '" text-anchor="' + p.ta + '">' + esc(p.lab) + '</text></g>'; }).join('') +
      '</svg>';
    return svg;
  }
  function renderEclate(slug) {
    var m = bySlug[slug];
    if (!m || !m.eclate) { var e = M.filter(function (o) { return o.eclate; })[0]; app.innerHTML = '<div class="wrap page"><div class="empty"><b>Vue éclatée disponible pour la ' + esc(e.nom) + ' seulement dans cette démonstration.</b><p><a href="#/machine/' + e.slug + '/eclate">Ouvrir la vue éclatée</a></p></div></div>'; return; }
    route.title = 'Vue éclatée ' + m.nom;
    var sel = route.p.p && EC.some(function (p) { return p.k === route.p.p; }) ? route.p.p : '';
    app.innerHTML = '<div class="wrap page">' + crumbs([['Accueil', '#/'], ['Machines', '#/machines'], [m.nom, '#/machine/' + m.slug], ['Vue éclatée', '']]) +
      '<div class="cat-h"><h1>Vue éclatée : ' + esc(m.nom) + '</h1><p class="count">Touchez une pièce du dessin ou de la liste pour trouver la référence et l’ajouter au devis.' + (m.d3 ? ' <a class="lnk" href="#/machine/' + m.slug + '?vue=3d">' + ico('box') + 'Voir aussi en 3D</a>' : '') + '</p></div>' +
      '<div class="ecl-grid"><div class="ecl-wrap">' + eclateSVG() + '<p class="muted sm">Dessin simplifié, non contractuel, pour repérer les pièces d’usure courantes.</p></div>' +
      '<div class="ecl-side"><div class="ecl-panel" id="ecl-panel" aria-live="polite"></div>' +
      '<ol class="ecl-list">' + EC.map(function (p, i) { return '<li><button type="button" data-ek="' + p.k + '"><span class="n">' + (i + 1) + '</span>' + esc(p.lab) + ico('chev') + '</button></li>'; }).join('') + '</ol></div></div></div>';
    selectPart(sel, false);
  }
  function selectPart(k, scroll) {
    $$('.ecl .part, .ecl .hs').forEach(function (g) { g.classList.toggle('on', g.getAttribute('data-k') === k); });
    $$('.ecl-list button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-ek') === k); });
    var p = EC.filter(function (e) { return e.k === k; })[0], panel = $('#ecl-panel');
    if (!panel) return;
    if (!p) { panel.innerHTML = '<div class="ecl-empty">' + ico('explode') + '<b>Choisissez une pièce</b><span>Numéros 1 à 8 sur le dessin.</span></div>'; return; }
    var items = p.ids.map(byName).filter(Boolean);
    panel.innerHTML = '<p class="eyebrow">Pièce ' + (EC.indexOf(p) + 1) + '</p><h2>' + esc(p.lab) + '</h2>' + (items.length > 1 ? '<p class="muted sm">Selon la longueur de guide montée :</p>' : '') +
      items.map(row).join('') + '<a class="btn-ln full" href="#/article/' + items[0].id + '">' + ico('file') + 'Voir la fiche complète</a>';
    var h = '#/machine/ms661/eclate' + qsOf({ p: k }); if (location.hash !== h) history.replaceState(null, '', h);
    if (scroll && window.matchMedia('(max-width: 900px)').matches) panel.scrollIntoView({ block: 'nearest' });
  }

  /* ---------- Comparateur ---------- */
  function renderCompare() {
    route.title = 'Comparer des machines';
    var sel = (route.p.m || '').split(',').filter(function (s) { return bySlug[s]; }).slice(0, 3);
    if (!route.p.m && cmpSel.length) sel = cmpSel.slice(0, 3);
    if (!sel.length) sel = ['fs400', 'fs250'];
    var ms = sel.map(function (s) { return bySlug[s]; });
    var labels = uniq([].concat.apply([], ms.map(function (m) { return m.specs.map(function (s) { return s[0]; }); })));
    var val = function (m, l) { var s = m.specs.filter(function (x) { return x[0] === l; })[0]; return s ? s[1] : ''; };
    var rows = [['Type', function (m) { return esc(m.type); }], ['Énergie', function (m) { return esc(m.energie); }], ['Usage', function (m) { return esc(m.usage); }]]
      .concat(labels.map(function (l) { return [l, function (m) { var v = val(m, l); return v ? esc(v) : '<span class="muted">Non communiqué</span>'; }]; }))
      .concat([['Pièces compatibles', function (m) { var n = parts(m.code).length; return '<a href="#/machine/' + m.slug + '">' + n + ' pièce' + (n > 1 ? 's' : '') + '</a>'; }],
        ['Documents', function (m) { return m.docs.length ? m.docs.map(function (d) { return '<a href="' + d[1] + '" target="_blank" rel="noopener">' + esc(d[0]) + '</a>'; }).join('<br>') : '<span class="muted">Sur demande</span>'; }],
        ['Disponibilité', function (m) { return dispoLbl(byId[m.id].dispo); }], ['Prix', function () { return 'Sur devis'; }]]);
    var diffOnly = route.p.diff === '1';
    var isDiff = function (r) { var v = ms.map(function (m) { return r[1](m); }); return v.some(function (x) { return x !== v[0]; }); };
    var slots = [0, 1, 2].map(function (i) {
      return '<label class="cslot"><span>Machine ' + (i + 1) + '</span><select data-slot-i="' + i + '"><option value="">' + (i < 2 ? 'Choisir' : 'Aucune (facultatif)') + '</option>' + M.map(function (o) { return '<option value="' + o.slug + '"' + (sel[i] === o.slug ? ' selected' : '') + '>' + esc(o.nom) + '</option>'; }).join('') + '</select></label>';
    }).join('');
    app.innerHTML = '<div class="wrap page">' + crumbs([['Accueil', '#/'], ['Machines', '#/machines'], ['Comparer', '']]) +
      '<div class="cat-h"><h1>Comparer des machines</h1><p class="count">Choisissez 2 ou 3 machines. Caractéristiques relevées sur les fiches STIHL.</p></div>' +
      '<div class="cslots">' + slots + '</div>' +
      '<label class="ck diff"><input type="checkbox" id="diff"' + (diffOnly ? ' checked' : '') + '><span>Afficher seulement les différences</span></label>' +
      (ms.length > 2 ? '<p class="c-hint">Faites glisser le tableau vers la gauche pour voir la machine 3.</p>' : '') + '<div class="ctable-w"><table class="ctable n' + ms.length + '"><thead><tr><th scope="col"><span class="sr">Caractéristique</span></th>' + ms.map(function (m) {
        return '<th scope="col"><a href="#/machine/' + m.slug + '" class="cth">' + (m.img ? '<img src="' + m.img + '" alt="">' : '') + '<b>' + esc(m.nom) + '</b></a><div class="slot" data-slot="' + m.id + '">' + qtyCtl(m.id) + '</div></th>';
      }).join('') + '</tr></thead><tbody>' + rows.filter(function (r) { return !diffOnly || isDiff(r); }).map(function (r) { return '<tr' + (ms.length > 1 && isDiff(r) ? ' class="df"' : '') + '><th scope="row">' + esc(r[0]) + '</th>' + ms.map(function (m) { return '<td>' + r[1](m) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' +
      (ms.length < 2 ? '<p class="muted">Ajoutez une deuxième machine pour comparer.</p>' : '') + '</div>';
    cmpSel = sel.slice(); store.set('sacri-comparer', cmpSel);
    var upd = function () { var s = $$('[data-slot-i]').map(function (x) { return x.value; }).filter(Boolean); s = uniq(s); go('#/comparer' + qsOf({ m: s, diff: $('#diff').checked ? '1' : '' }), true); };
    $$('[data-slot-i]').forEach(function (x) { x.addEventListener('change', upd); });
    $('#diff').addEventListener('change', upd);
  }

  /* ---------- Liste de devis ---------- */
  var contact = store.get('sacri-contact', { nom: '', soc: '', tel: '', msg: '' });
  function devisLines() { return Object.keys(cart).map(function (id) { return [byId[id], cart[id]]; }); }
  function devisText() {
    var l = devisLines();
    var t = 'Bonjour SACRI,\nJe souhaite un devis pour :\n' + l.map(function (p) { return '- ' + p[1] + ' x ' + p[0].nom + ' (réf. ' + p[0].id + ', ' + p[0].soc + ')'; }).join('\n');
    var c = [contact.nom, contact.soc, contact.tel].filter(Boolean);
    if (contact.msg) t += '\n\nPrécisions : ' + contact.msg;
    if (c.length) t += '\n\n' + c.join(', ');
    return t + '\nMerci de me recontacter.';
  }
  function renderDevis(soft) {
    route.title = 'Mon devis';
    var l = devisLines(), n = cartCount();
    if (soft && $('#dv-list')) {
      var rows = $$('#dv-list .dv-row [data-slot]');
      if (rows.length !== l.length || rows.some(function (r, i) { return r.getAttribute('data-slot') !== l[i][0].id; }))
        $('#dv-list').innerHTML = l.length ? l.map(devisRow).join('') : '<div class="empty"><b>Votre liste est vide.</b><p>Ajoutez des pièces depuis <a href="#/catalogue">le catalogue</a>, <a href="#/machines">votre machine</a> ou <a href="#/machine/ms661/eclate">la vue éclatée</a>.</p></div>';
      $('#dv-n').textContent = n + ' article' + (n > 1 ? 's' : '') + ', ' + l.length + ' référence' + (l.length > 1 ? 's' : '');
      $('#dv-msg').textContent = devisText(); $('#dv-act').classList.toggle('dis', !l.length); syncLinks(); return;
    }
    app.innerHTML = '<div class="wrap page">' + crumbs([['Accueil', '#/'], ['Mon devis', '']]) +
      '<div class="cat-h"><h1>Ma liste de devis</h1><p class="count" id="dv-n">' + n + ' article' + (n > 1 ? 's' : '') + ', ' + l.length + ' référence' + (l.length > 1 ? 's' : '') + '</p></div>' +
      '<div class="dv-grid"><div><div id="dv-list" class="dv-list">' + (l.length ? l.map(devisRow).join('') : '<div class="empty"><b>Votre liste est vide.</b><p>Ajoutez des pièces depuis <a href="#/catalogue">le catalogue</a>, <a href="#/machines">votre machine</a> ou <a href="#/machine/ms661/eclate">la vue éclatée</a>.</p></div>') + '</div>' +
      '<button type="button" class="lnk" data-clear-cart>Vider la liste</button></div>' +
      '<aside class="dv-side"><h2 class="h3">Vos coordonnées <small>(facultatif)</small></h2>' +
      '<label class="fld"><span>Nom</span><input id="c-nom" autocomplete="name" value="' + esc(contact.nom) + '"></label>' +
      '<label class="fld"><span>Société</span><input id="c-soc" autocomplete="organization" value="' + esc(contact.soc) + '"></label>' +
      '<label class="fld"><span>Téléphone</span><input id="c-tel" type="tel" inputmode="tel" autocomplete="tel" value="' + esc(contact.tel) + '"></label>' +
      '<label class="fld"><span>Précisions (machine, délai, lieu de livraison)</span><textarea id="c-msg" rows="3">' + esc(contact.msg) + '</textarea></label>' +
      '<details class="prev"><summary>Aperçu du message</summary><pre id="dv-msg">' + esc(devisText()) + '</pre></details>' +
      '<div class="dv-act' + (l.length ? '' : ' dis') + '" id="dv-act"><a class="btn btn-wa" id="dv-wa" target="_blank" rel="noopener">' + ico('chat') + 'Envoyer par WhatsApp</a>' +
      '<a class="btn" id="dv-mail">' + ico('mail') + 'Envoyer par e-mail</a>' +
      '<button type="button" class="btn-ln" data-devis-pdf>' + ico('down') + 'Télécharger en PDF</button>' +
      '<button type="button" class="btn-ln" data-copy-devis>' + ico('file') + 'Copier le message</button></div>' +
      '<p class="muted sm">Rien n’est envoyé depuis cette page : WhatsApp ou votre messagerie s’ouvre avec le message prérempli, vous choisissez de l’envoyer. Prix sur devis.</p></aside></div></div>';
    ['nom', 'soc', 'tel', 'msg'].forEach(function (k) { $('#c-' + k).addEventListener('input', function () { contact[k] = this.value; store.set('sacri-contact', contact); $('#dv-msg').textContent = devisText(); syncLinks(); }); });
    syncLinks();
  }
  function syncLinks() {
    var t = devisText(), wa = $('#dv-wa'), ml = $('#dv-mail'); if (!wa) return;
    wa.href = 'https://wa.me/?text=' + encodeURIComponent(t);
    ml.href = 'mailto:commercial@sacri-ci.com?subject=' + encodeURIComponent('Demande de devis' + (contact.soc ? ' : ' + contact.soc : '')) + '&body=' + encodeURIComponent(t);
  }
  function devisRow(p) {
    var x = p[0];
    return '<div class="dv-row"><a class="lpic" href="#/article/' + x.id + '">' + pic(x, 'sm') + '</a><div class="ltxt"><a href="#/article/' + x.id + '"><b>' + esc(x.nom) + '</b></a><small>Réf. ' + x.id + ' · ' + esc(x.soc) + '</small>' + dispoLbl(x.dispo) + '</div>' +
      '<div class="slot" data-slot="' + x.id + '" data-big>' + qtyCtl(x.id, true) + '</div><button type="button" class="rm" data-rm="' + x.id + '" aria-label="Retirer ' + esc(x.nom) + '">' + ico('x') + '</button></div>';
  }

  /* ---------- PDF (devis et fiche article) ---------- */
  function loadPdf(cb) {
    if (window.jspdf) return cb(window.jspdf.jsPDF);
    var s = document.createElement('script'); s.src = 'vendor/jspdf.umd.min.js?v=251'; s.onload = function () { cb(window.jspdf.jsPDF); };
    s.onerror = function () { toast('Le PDF n’a pas pu être préparé. Réessayez.'); }; document.head.appendChild(s);
  }
  function dataUrl(src, cb) {
    if (!src) return cb(null);
    var img = new Image(); img.onload = function () { try { var c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0); cb(c.toDataURL('image/jpeg', 0.9), img.naturalWidth / img.naturalHeight); } catch (e) { cb(null); } };
    img.onerror = function () { cb(null); }; img.src = src;
  }
  var pdfTxt = function (t) { return String(t).replace(/[’]/g, "'").replace(/[«»]/g, '"').replace(/·/g, '-'); };
  function pdfHead(doc, title, logo) {
    if (logo) doc.addImage(logo, 'JPEG', 15, 12, 30, 15);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(17); doc.setTextColor(29, 28, 27); doc.text(pdfTxt(title), 195, 20, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(120, 116, 112);
    doc.text(pdfTxt('Groupe SACRI, Bd de Marseille, Abidjan · commercial@sacri-ci.com'), 195, 26, { align: 'right' });
    doc.setDrawColor(233, 91, 15); doc.setLineWidth(0.8); doc.line(15, 32, 195, 32);
  }
  function pdfFoot(doc) {
    var n = doc.getNumberOfPages();
    for (var i = 1; i <= n; i++) { doc.setPage(i); doc.setFontSize(8); doc.setTextColor(140, 136, 132); doc.text(pdfTxt('Données de démonstration. Prix sur devis. Document préparé depuis le catalogue en ligne, page ' + i + ' sur ' + n + '.'), 105, 288, { align: 'center' }); }
  }
  function devisPdf() {
    var l = devisLines(); if (!l.length) return toast('Ajoutez au moins un article.');
    loadPdf(function (J) { dataUrl('logo-pdf.jpg', function (logo) {
      var doc = new J({ unit: 'mm', format: 'a4' }), d = new Date(), ds = ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
      pdfHead(doc, 'Demande de devis', logo);
      doc.setFontSize(10); doc.setTextColor(29, 28, 27); var y = 42;
      doc.text('Date : ' + ds, 15, y); y += 6;
      [['Nom', contact.nom], ['Société', contact.soc], ['Téléphone', contact.tel]].forEach(function (c) { if (c[1]) { doc.text(pdfTxt(c[0] + ' : ' + c[1]), 15, y); y += 6; } });
      if (contact.msg) { var ml = doc.splitTextToSize(pdfTxt('Précisions : ' + contact.msg), 180); doc.text(ml, 15, y); y += ml.length * 5 + 2; }
      y += 4; doc.setFillColor(245, 244, 242); doc.rect(15, y, 180, 9, 'F'); doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5);
      doc.text('Réf.', 18, y + 6); doc.text('Désignation', 42, y + 6); doc.text('Société', 132, y + 6); doc.text('Qté', 192, y + 6, { align: 'right' });
      doc.setFont('helvetica', 'normal'); y += 9;
      l.forEach(function (p) {
        var nm = doc.splitTextToSize(pdfTxt(p[0].nom + (p[0].machines.length ? ' (pour ' + p[0].machines.join(', ') + ')' : '')), 86), h = Math.max(8, nm.length * 4.6 + 3.5);
        if (y + h > 275) { doc.addPage(); y = 20; }
        doc.text(p[0].id, 18, y + 5.5); doc.text(nm, 42, y + 5.5); doc.text(pdfTxt(p[0].soc), 132, y + 5.5); doc.text(String(p[1]), 192, y + 5.5, { align: 'right' });
        y += h; doc.setDrawColor(230, 227, 223); doc.setLineWidth(0.2); doc.line(15, y, 195, y);
      });
      y += 8; if (y > 265) { doc.addPage(); y = 20; }
      doc.setFontSize(9); doc.setTextColor(90, 86, 82);
      doc.text(doc.splitTextToSize(pdfTxt('Total : ' + l.reduce(function (s, p) { return s + p[1]; }, 0) + ' article(s), ' + l.length + ' référence(s). Les prix et délais vous seront communiqués par un conseiller SACRI, qui confirme aussi la compatibilité des pièces.'), 180), 15, y);
      pdfFoot(doc); doc.save('demande-devis-sacri-' + d.toISOString().slice(0, 10) + '.pdf'); toast('PDF téléchargé');
    }); });
  }
  function fichePdf(id) {
    var x = byId[id];
    loadPdf(function (J) { dataUrl('logo-pdf.jpg', function (logo) { dataUrl(x.img, function (ph, ratio) {
      var doc = new J({ unit: 'mm', format: 'a4' });
      pdfHead(doc, 'Fiche article', logo);
      var y = 44;
      if (ph) { var w = 70, h = w / (ratio || 1); if (h > 70) { h = 70; w = h * ratio; } doc.addImage(ph, 'JPEG', 15 + (70 - w) / 2, y, w, h); }
      var tx = ph ? 95 : 15, tw = ph ? 100 : 180;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(120, 116, 112); doc.text(pdfTxt(x.soc + ' - ' + x.fam), tx, y + 4);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(29, 28, 27); var nm = doc.splitTextToSize(pdfTxt(x.nom), tw); doc.text(nm, tx, y + 12);
      var yy = y + 12 + nm.length * 6.5; doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.text('Réf. ' + x.id, tx, yy); yy += 8;
      var ds = doc.splitTextToSize(pdfTxt(x.desc), tw); doc.text(ds, tx, yy); yy += ds.length * 5;
      y = Math.max(y + 78, yy + 8);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.text('Caractéristiques techniques', 15, y); y += 4; doc.setFontSize(10);
      x.specs.concat([['Machines compatibles', x.machines.join(', ') || 'Universel ou sur mesure'], ['Disponibilité', x.stock.map(function (s) { return s[0] + ' : ' + DISPO[s[1]][0]; }).join(' ; ')], ['Prix', 'Sur devis']]).forEach(function (s) {
        var v = doc.splitTextToSize(pdfTxt(s[1]), 120), h = Math.max(8, v.length * 4.8 + 3.5);
        doc.setFont('helvetica', 'normal'); doc.setTextColor(120, 116, 112); doc.text(pdfTxt(s[0]), 15, y + 5.5); doc.setTextColor(29, 28, 27); doc.text(v, 72, y + 5.5);
        y += h; doc.setDrawColor(230, 227, 223); doc.setLineWidth(0.2); doc.line(15, y, 195, y);
      });
      if (x.docs && x.docs.length) { y += 8; doc.setFont('helvetica', 'bold'); doc.text('Documents du fabricant', 15, y); doc.setFont('helvetica', 'normal'); doc.setFontSize(9); x.docs.forEach(function (d) { y += 6; doc.setTextColor(201, 74, 8); doc.textWithLink(pdfTxt(d[0]), 15, y, { url: d[1] }); }); }
      y += 10; doc.setFontSize(9); doc.setTextColor(120, 116, 112); doc.text(pdfTxt('Lien de la fiche : ' + location.href.split('#')[0] + '#/article/' + x.id), 15, y);
      pdfFoot(doc); doc.save('fiche-' + x.id.toLowerCase() + '.pdf'); toast('Fiche PDF téléchargée');
    }); }); });
  }

  /* ---------- Suggestions de recherche ---------- */
  var openSugg = null;
  function closeSugg() { if (openSugg) { openSugg.box.hidden = true; openSugg.inp.setAttribute('aria-expanded', 'false'); openSugg = null; } }
  function attachSugg(inp, box, form, live) {
    var idx = -1;
    function build() {
      var q = inp.value.trim(); idx = -1;
      if (q.length < 2) { box.hidden = true; inp.setAttribute('aria-expanded', 'false'); return; }
      var s = search(q), arts = s.r.filter(function (x) { return x.type !== 'Machine'; }).slice(0, 6), ms = machMatch(q);
      var fams = FAMS.filter(function (f) { return norm(f).split(' ').some(function (w) { return w.indexOf(norm(q)) === 0; }); }).slice(0, 2);
      var dym = !s.r.length ? didYouMean(q) : null, h = '';
      if (ms.length) h += '<p class="sg-h">Machines</p>' + ms.map(function (m) { return '<a class="sg" role="option" href="#/machine/' + m.slug + '">' + (m.img ? '<img src="' + m.img + '" alt="">' : ico('saw')) + '<span><b>' + esc(m.nom) + '</b><small>' + parts(m.code).length + ' pièces compatibles</small></span></a>'; }).join('');
      if (arts.length) h += '<p class="sg-h">Articles</p>' + arts.map(function (x) { return '<a class="sg" role="option" href="#/article/' + x.id + '">' + (x.img ? '<img src="' + x.img + '" alt="">' : '<span class="sgi">' + ico(x.ico) + '</span>') + '<span><b>' + esc(x.nom) + '</b><small>Réf. ' + x.id + ' · ' + esc(x.soc) + '</small></span></a>'; }).join('');
      if (fams.length) h += '<p class="sg-h">Familles</p>' + fams.map(function (f) { return '<a class="sg" role="option" href="#/catalogue' + qsOf({ fam: f }) + '"><span class="sgi">' + ico(famIco[f]) + '</span><span><b>' + esc(f) + '</b></span></a>'; }).join('');
      if (dym) h += '<a class="sg" role="option" href="#/catalogue' + qsOf({ q: dym }) + '"><span class="sgi">' + ico('search') + '</span><span>Vouliez-vous dire <b>« ' + esc(dym) + ' »</b> ?</span></a>';
      h += '<a class="sg all" role="option" href="#/catalogue' + qsOf({ q: q }) + '"><span class="sgi">' + ico('search') + '</span><span>' + (s.r.length ? 'Voir les ' + s.r.length + ' résultats pour « ' + esc(q) + ' »' : 'Aucun article pour « ' + esc(q) + ' »') + '</span></a>';
      box.innerHTML = h; box.hidden = false; inp.setAttribute('aria-expanded', 'true'); openSugg = { box: box, inp: inp };
    }
    inp.addEventListener('input', function () {
      var cl = form.querySelector('.qclear'); if (cl) cl.hidden = !inp.value;
      build();
      if (live && route.name === 'catalogue') { var f = readF(); f.q = inp.value.trim(); clearTimeout(inp._t); inp._t = setTimeout(function () { setF(f, true); }, 160); }
    });
    inp.addEventListener('focus', function () { if (inp.value.trim().length >= 2) build(); });
    inp.addEventListener('keydown', function (e) {
      var items = $$('.sg', box); if (box.hidden || !items.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); idx = (idx + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; items.forEach(function (a, i) { a.classList.toggle('kb', i === idx); }); }
      else if (e.key === 'Enter' && idx > -1) { e.preventDefault(); go(items[idx].getAttribute('href')); inp.blur(); }
      else if (e.key === 'Escape') closeSugg();
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); var q = inp.value.trim(); closeSugg(); inp.blur(); var f = route.name === 'catalogue' ? readF() : { q: '', fam: '', mach: '', soc: [], dispo: [], tri: 'pert' }; f.q = q; setF(f); });
    box.addEventListener('click', function () { closeSugg(); inp.blur(); });
  }
  attachSugg($('#q'), $('#sugg'), $('#hsearch'), true);
  $('#qclear').addEventListener('click', function () { var i = $('#q'); i.value = ''; this.hidden = true; closeSugg(); if (route.name === 'catalogue') { var f = readF(); f.q = ''; setF(f, true); } i.focus(); });
  document.addEventListener('click', function (e) { if (openSugg && !e.target.closest('.hsearch, .search')) closeSugg(); });

  /* ---------- Délégation des clics ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target, b;
    if ((b = t.closest('[data-3d-close]'))) { close3d(); if (b.tagName !== 'A') return; }
    if (t.classList && t.classList.contains('m3d')) { close3d(); return; }
    if ((b = t.closest('[data-3d]'))) { var mm = bySlug[route.seg[1]]; if (mm) open3d(mm); return; }
    if ((b = t.closest('[data-gal]'))) { var gm = $('#gal-main img'); if (gm) gm.src = b.getAttribute('data-gal'); $$('[data-gal]').forEach(function (g) { g.classList.toggle('on', g === b); }); return; }
    if ((b = t.closest('[data-add]'))) { addOne(b.getAttribute('data-add')); return; }
    if ((b = t.closest('[data-q]'))) { var id = b.getAttribute('data-id'); setQty(id, (cart[id] || 0) + +b.getAttribute('data-q')); return; }
    if ((b = t.closest('[data-rm]'))) { setQty(b.getAttribute('data-rm'), 0); toast('Article retiré'); return; }
    if ((b = t.closest('[data-more]'))) { shown += PAGE; renderCatalogue(true); return; }
    if ((b = t.closest('[data-reset]'))) { setF({ q: '', fam: '', mach: '', soc: [], dispo: [], tri: readF().tri }); return; }
    if ((b = t.closest('.tagf'))) { var f = readF(), k = b.getAttribute('data-k'), v = b.getAttribute('data-v'); if (k === 'soc' || k === 'dispo') f[k] = f[k].filter(function (s) { return s !== v; }); else f[k] = ''; setF(f); return; }
    if ((b = t.closest('[data-side-open]'))) { $('#side').classList.add('open'); document.body.classList.add('lock'); return; }
    if ((b = t.closest('[data-side-close]'))) { $('#side').classList.remove('open'); document.body.classList.remove('lock'); return; }
    if ((b = t.closest('[data-clear-seen]'))) { seenList = []; store.set('sacri-vus', []); render(); return; }
    if ((b = t.closest('[data-clear-cart]'))) { if (!Object.keys(cart).length) return; cart = {}; saveCart(); renderDevis(); toast('Liste vidée'); return; }
    if ((b = t.closest('[data-copylink]'))) { copy(location.href, 'Lien de la fiche copié'); return; }
    if ((b = t.closest('[data-copy-devis]'))) { copy(devisText(), 'Message copié'); return; }
    if ((b = t.closest('[data-devis-pdf]'))) { devisPdf(); return; }
    if ((b = t.closest('[data-fiche-pdf]'))) { fichePdf(b.getAttribute('data-fiche-pdf')); return; }
    if ((b = t.closest('#dv-act.dis a, #dv-act.dis button'))) { e.preventDefault(); toast('Ajoutez au moins un article.'); return; }
    if ((b = t.closest('[data-cmp-clear]'))) { cmpSel = []; store.set('sacri-comparer', []); renderMachines(); return; }
    if ((b = t.closest('.cmpbar .btn.dis'))) { e.preventDefault(); toast('Choisissez au moins 2 machines.'); return; }
    if ((b = t.closest('[data-jump]'))) { e.preventDefault(); var g = document.getElementById(b.getAttribute('data-jump')); if (g) g.scrollIntoView({ block: 'start' }); return; }
    if ((b = t.closest('.ecl .part, .ecl .hs, [data-ek]'))) { selectPart(b.getAttribute('data-k') || b.getAttribute('data-ek'), true); return; }
  });
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.closest && e.target.closest('.ecl .hs')) { e.preventDefault(); selectPart(e.target.closest('.hs').getAttribute('data-k'), true); }
    if (e.key === 'Escape' && $('.m3d')) close3d();
    if (e.key === 'Escape' && $('#side.open')) { $('#side').classList.remove('open'); document.body.classList.remove('lock'); }
  });
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.matches('[data-qin]')) setQty(t.getAttribute('data-qin'), t.value);
    if (t.matches('[data-cmp]')) {
      var s = t.getAttribute('data-cmp');
      if (t.checked) { if (cmpSel.length >= 3) { t.checked = false; toast('3 machines au maximum'); return; } cmpSel.push(s); } else cmpSel = cmpSel.filter(function (x) { return x !== s; });
      store.set('sacri-comparer', cmpSel); var bar = $('#cmpbar'); if (bar) bar.outerHTML = cmpBar();
    }
  });

  var nA = $('#n-art'); if (nA) nA.textContent = A.length;
  window.addEventListener('hashchange', render);
  window.addEventListener('storage', function (e) { if (e.key === 'sacri-devis-v6') { cart = store.get('sacri-devis-v6', {}); cartCount(); } });
  cartCount(); render();
})();
