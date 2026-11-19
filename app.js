/* Catalogue SACRI. Aucune donnée n'est envoyée : les demandes sont préparées sur l'appareil. */
(function () {
  var A = window.ARTICLES || [];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var norm = function (t) { return (t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, ' '); };
  var ico = function (n, c) { return '<svg' + (c ? ' class="' + c + '"' : '') + '><use href="#i-' + n + '"/></svg>'; };
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var SYN = { karcher: 'nettoyeur', pulverisateur: 'atomiseur', scie: 'tronconneuse', gazon: 'tondeuse', herbe: 'debroussailleuse',
    chainsaw: 'tronconneuse', barre: 'guide', durite: 'flexible', tuyau: 'flexible', roulements: 'roulement', courroies: 'courroie',
    chaussures: 'chaussure', huiles: 'huile', graissage: 'graisse', caoutchouc: 'hevea', compresseurs: 'compresseur', verins: 'verin', lames: 'lame', cuves: 'cuve' };
  var STOP = ['pour', 'de', 'des', 'du', 'la', 'le', 'les', 'un', 'une', 'et', 'a', 'au', 'aux', 'en', 'cm', 'avec', 'sur', 'ma', 'mon', 'je', 'cherche', 'besoin', 'piece', 'pieces', 'ref'];
  var DISPO = { stock: ['En stock', 'ok', 1], faible: ['Stock faible', 'low', 2], commande: ['Sur commande', 'cmd', 3], service: ['Prestation atelier', 'svc', 4], etude: ['Sur étude', 'svc', 5] };
  var byId = {}; A.forEach(function (x) {
    byId[x.id] = x;
    x._h = norm([x.id, x.nom, x.desc, x.fam, x.soc, x.machines.join(' '), x.tags].join(' '));
    x._m = norm(x.machines.join(' ')).replace(/\s+/g, '');
  });
  var uniq = function (arr) { return arr.filter(function (v, i, s) { return s.indexOf(v) === i; }); };
  var FAMS = uniq(A.map(function (x) { return x.fam; }));
  var SOCS = uniq(A.map(function (x) { return x.soc; }));
  var MACH = uniq([].concat.apply([], A.map(function (x) { return x.machines; }))).sort();
  var famIco = {}; A.forEach(function (x) { famIco[x.fam] = x.ico; });

  var state = { q: '', fam: '', mach: '', soc: [], dispo: [], sort: 'pert', n: 12 };
  var cart = {};
  try { cart = JSON.parse(localStorage.getItem('sacri-demande') || '{}'); } catch (e) { cart = {}; }

  function score(x, q) {
    if (!q) return 1;
    var nq = norm(q), s = 0, compact = nq.replace(/\s+/g, '');
    var refq = nq.match(/sc[\s-]*0*(\d{1,4})/);
    if (refq) return +x.id.slice(3) === +refq[1] ? 1000 : 0;
    if (x._m && compact.length > 2 && x._m.indexOf(compact) > -1) s += 60;
    var num = nq.match(/(\d{2,3})\s*cm/);
    var words = nq.split(/[^a-z0-9]+/).filter(function (w) { return w && STOP.indexOf(w) < 0; });
    var hit = 0;
    words.forEach(function (w) {
      var ws = [w, SYN[w] || w, w.replace(/s$/, '')];
      if (ws.some(function (v) { return v.length > 1 && x._h.indexOf(v) > -1; })) { hit++; s += norm(x.nom).indexOf(ws[1]) > -1 || norm(x.nom).indexOf(ws[2]) > -1 ? 14 : 6; }
    });
    if (words.length && !hit && s < 60) return 0;
    if (words.length > 1) s += 10 * hit / words.length;
    if (num) { if (x.cm) { var d = Math.abs(+num[1] - x.cm); s += d === 0 ? 45 : (d <= 5 ? 30 : -20); } else s -= 12; }
    if (words.length && norm(x.nom).indexOf(SYN[words[0]] || words[0]) === 0) s += 20;
    return s;
  }

  function filtered() {
    var r = A.filter(function (x) {
      return (!state.fam || x.fam === state.fam) && (!state.mach || x.machines.indexOf(state.mach) > -1) &&
        (!state.soc.length || state.soc.indexOf(x.soc) > -1) && (!state.dispo.length || state.dispo.indexOf(x.dispo) > -1);
    }).map(function (x) { return [score(x, state.q), x]; }).filter(function (p) { return p[0] > 0; });
    if (state.sort === 'az') r.sort(function (a, b) { return a[1].nom.localeCompare(b[1].nom, 'fr'); });
    else if (state.sort === 'dispo') r.sort(function (a, b) { return DISPO[a[1].dispo][2] - DISPO[b[1].dispo][2]; });
    else if (state.q) r.sort(function (a, b) { return b[0] - a[0]; });
    if (r.length && r[0][0] >= 1000) r = r.filter(function (p) { return p[0] >= 1000; });
    return r.map(function (p) { return p[1]; });
  }

  function pic(x, cls) {
    return x.img ? '<img src="' + x.img + '" alt="' + esc(x.nom) + '" loading="lazy">' :
      '<div class="ph' + (cls ? ' ' + cls : '') + '">' + ico(x.ico) + '<span>Photo à venir</span></div>';
  }
  function card(x, i) {
    var d = DISPO[x.dispo];
    return '<article class="card" data-id="' + x.id + '" tabindex="0" style="animation-delay:' + Math.min(i, 11) * 30 + 'ms">' +
      '<div class="pic">' + pic(x) + '<span class="badge">' + ico(x.ico) + '<span>' + esc(x.fam) + '</span></span></div>' +
      '<div class="body"><div class="meta"><span class="soc">' + esc(x.soc) + '</span><span class="dispo ' + d[1] + '">' + d[0] + '</span></div>' +
      '<h3>' + esc(x.nom) + '</h3><p class="ref">Réf. ' + x.id + '</p>' +
      (x.machines.length ? '<p class="mach">' + ico('check') + '<span>' + esc(x.machines.slice(0, 3).join(', ')) + (x.machines.length > 3 ? '…' : '') + '</span></p>' : '') +
      '<button type="button" class="add' + (cart[x.id] ? ' in' : '') + '" data-add="' + x.id + '">' + ico(cart[x.id] ? 'check' : 'plus') + (cart[x.id] ? 'Dans ma demande' : 'Ajouter à ma demande') + '</button>' +
      '</div></article>';
  }

  function render() {
    var r = filtered();
    $('#count').textContent = r.length + (r.length > 1 ? ' articles' : ' article');
    $('#rtitle').textContent = state.fam || (state.q ? 'Résultats pour « ' + state.q + ' »' : 'Toutes les pièces');
    var shown = r.slice(0, state.n), more = $('#more');
    more.hidden = r.length <= state.n;
    more.textContent = 'Afficher plus (' + (r.length - shown.length) + ' restants)';
    $('#grid').innerHTML = r.length ? shown.map(card).join('') :
      '<div class="empty"><b>Aucun article ne correspond.</b><span>Essayez un autre mot, retirez un filtre, ou envoyez une photo : un conseiller SACRI identifie la pièce.</span></div>';
    var act = [];
    if (state.q) act.push(['q', '', '« ' + state.q + ' »']);
    if (state.fam) act.push(['fam', '', state.fam]);
    if (state.mach) act.push(['mach', '', 'Machine ' + state.mach]);
    state.soc.forEach(function (s) { act.push(['soc', s, s]); });
    state.dispo.forEach(function (s) { act.push(['dispo', s, DISPO[s][0]]); });
    $('#active').innerHTML = act.map(function (a) { return '<button type="button" class="tagf" data-k="' + a[0] + '" data-v="' + esc(a[1]) + '">' + esc(a[2]) + ico('x') + '</button>'; }).join('') +
      (act.length > 1 ? '<button type="button" class="lnk" data-k="all">Tout effacer</button>' : '');
    $$('.fam').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-f') === state.fam); });
    $('#f-mach').value = state.mach;
    $$('#f-soc input').forEach(function (c) { c.checked = state.soc.indexOf(c.value) > -1; });
    $$('#f-dispo input').forEach(function (c) { c.checked = state.dispo.indexOf(c.value) > -1; });
  }
  function go() { state.n = 12; render(); }

  /* Familles avec icônes */
  $('#fams').innerHTML = '<button type="button" class="fam" data-f="">' + ico('list') + 'Tout<small>' + A.length + '</small></button>' +
    FAMS.map(function (f) { return '<button type="button" class="fam" data-f="' + esc(f) + '">' + ico(famIco[f]) + esc(f) + '<small>' + A.filter(function (x) { return x.fam === f; }).length + '</small></button>'; }).join('');
  $('#fams').addEventListener('click', function (e) { var b = e.target.closest('.fam'); if (!b) return; state.fam = b.getAttribute('data-f'); go(); $('#catalogue').scrollIntoView({ behavior: 'smooth' }); });

  /* Filtres */
  $('#f-mach').innerHTML = '<option value="">Toutes les machines</option>' + MACH.map(function (m) { return '<option>' + esc(m) + '</option>'; }).join('');
  $('#f-mach').addEventListener('change', function () { state.mach = this.value; go(); });
  function checks(id, key, vals, label) {
    $(id).innerHTML = vals.map(function (v) {
      var n = A.filter(function (x) { return x[key] === v; }).length;
      return '<label class="ck"><input type="checkbox" value="' + esc(v) + '">' + esc(label ? label(v) : v) + '<em>' + n + '</em></label>';
    }).join('');
    $(id).addEventListener('change', function () { state[key] = $$('input:checked', $(id)).map(function (c) { return c.value; }); go(); });
  }
  checks('#f-soc', 'soc', SOCS);
  checks('#f-dispo', 'dispo', Object.keys(DISPO).filter(function (k) { return A.some(function (x) { return x.dispo === k; }); }), function (k) { return DISPO[k][0]; });
  function resetAll() { state.q = ''; $('#q').value = ''; state.fam = ''; state.mach = ''; state.soc = []; state.dispo = []; go(); }
  $('#reset').addEventListener('click', resetAll);
  $('#active').addEventListener('click', function (e) {
    if (e.target.closest('[data-k="all"]')) return resetAll();
    var b = e.target.closest('.tagf'); if (!b) return; var k = b.getAttribute('data-k'), v = b.getAttribute('data-v');
    if (k === 'soc' || k === 'dispo') state[k] = state[k].filter(function (s) { return s !== v; }); else state[k] = '';
    if (k === 'q') $('#q').value = '';
    go();
  });
  $('#sort').addEventListener('change', function () { state.sort = this.value; go(); });
  $('#side-open').addEventListener('click', function () { $('#side').classList.add('open'); });
  $('#side-close').addEventListener('click', function () { $('#side').classList.remove('open'); });

  /* Recherche */
  var inp = $('#q');
  inp.addEventListener('input', function () { state.q = inp.value.trim(); go(); });
  $('#more').addEventListener('click', function () { state.n += 12; render(); });
  $('#search').addEventListener('submit', function (e) { e.preventDefault(); state.q = inp.value.trim(); go(); $('#catalogue').scrollIntoView({ behavior: 'smooth' }); });
  $$('.ex').forEach(function (b) { b.addEventListener('click', function () { inp.value = b.textContent.trim(); state.q = inp.value; go(); $('#catalogue').scrollIntoView({ behavior: 'smooth' }); }); });

  /* Demande de devis */
  function save() { try { localStorage.setItem('sacri-demande', JSON.stringify(cart)); } catch (e) {} }
  function toast(t) { var el = $('#toast'); el.innerHTML = ico('check') + esc(t); el.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(function () { el.hidden = true; }, 2200); }
  function count() { var n = 0; for (var k in cart) n += cart[k]; $('#cart-n').textContent = n; return n; }
  function add(id) {
    cart[id] = (cart[id] || 0) + (cart[id] ? 0 : 1); save(); count();
    $('#cart-open').classList.remove('bump'); void $('#cart-open').offsetWidth; $('#cart-open').classList.add('bump');
    toast('Ajouté à votre demande de devis'); render(); if (!$('#fiche').hidden) open(id);
  }
  function message() {
    var l = Object.keys(cart).map(function (id) { return '- ' + cart[id] + ' x ' + byId[id].nom + ' (réf. ' + id + ')'; });
    return 'Bonjour SACRI,\nJe souhaite un devis pour :\n' + l.join('\n') + '\nMerci de me recontacter.';
  }
  function drawCart() {
    var ids = Object.keys(cart);
    $('#cart-list').innerHTML = ids.length ? ids.map(function (id) {
      var x = byId[id];
      return '<div class="ci">' + (x.img ? '<img src="' + x.img + '" alt="">' : '<span class="mini">' + ico(x.ico) + '</span>') +
        '<div><b>' + esc(x.nom) + '</b><small>Réf. ' + id + ', ' + esc(x.soc) + '</small></div>' +
        '<div class="qty"><button type="button" data-q="-1" data-id="' + id + '" aria-label="Moins">-</button><span>' + cart[id] + '</span><button type="button" data-q="1" data-id="' + id + '" aria-label="Plus">+</button></div></div>';
    }).join('') : '<p class="dempty">Votre demande est vide.<br>Ajoutez des pièces depuis le catalogue.</p>';
    $('#cart-foot').innerHTML = ids.length ? '<div class="msg" id="c-msg">' + esc(message()) + '</div>' +
      '<button type="button" class="btn btn-wa" id="c-wa">' + ico('chat') + 'Envoyer la demande sur WhatsApp</button>' +
      '<p class="mref">Sur cette page, rien n\'est envoyé : le message est préparé pour être copié.</p>' : '';
  }
  $('#cart-open').addEventListener('click', function () { drawCart(); $('#cart').hidden = false; document.body.classList.add('lock'); });
  $('#cart').addEventListener('click', function (e) {
    if (e.target.closest('[data-cclose]')) { $('#cart').hidden = true; document.body.classList.remove('lock'); return; }
    var q = e.target.closest('[data-q]');
    if (q) { var id = q.getAttribute('data-id'); cart[id] += +q.getAttribute('data-q'); if (cart[id] < 1) delete cart[id]; save(); count(); drawCart(); render(); return; }
    if (e.target.closest('#c-wa')) {
      var t = message();
      if (navigator.clipboard) navigator.clipboard.writeText(t).catch(function () {});
      toast('Message prêt et copié');
    }
  });

  /* Fiche produit */
  var modal = $('#fiche');
  function open(id) {
    var x = byId[id]; if (!x) return; var d = DISPO[x.dispo];
    $('#m-pic').innerHTML = pic(x, 'big');
    $('#m-credit').innerHTML = x.lic ? 'Photo : <a href="' + x.lic.u + '" target="_blank" rel="noopener">' + esc(x.lic.a) + '</a>, ' + esc(x.lic.l) + ', Wikimedia Commons' : (x.src ? 'Photo : ' + x.src : '');
    $('#m-soc').textContent = 'Vendu par ' + x.soc;
    $('#m-nom').textContent = x.nom;
    $('#m-ref').textContent = 'Réf. ' + x.id;
    $('#m-desc').textContent = x.desc;
    var sp = [['Famille', x.fam], ['Société', x.soc], ['Disponibilité', '<span class="dispo ' + d[1] + '">' + d[0] + '</span>'], ['Prix', 'Sur devis']];
    if (x.machines.length) sp.splice(2, 0, ['Compatible avec', esc(x.machines.join(', '))]);
    if (x.cm) sp.splice(2, 0, ['Longueur', x.cm + ' cm']);
    $('#m-specs').innerHTML = sp.map(function (s) { return '<li><span>' + s[0] + '</span><b>' + (s[0] === 'Disponibilité' || s[0] === 'Compatible avec' ? s[1] : esc(s[1])) + '</b></li>'; }).join('');
    $('#m-add').innerHTML = ico(cart[id] ? 'check' : 'plus') + '<span>' + (cart[id] ? 'Dans ma demande' : 'Ajouter à ma demande') + '</span>';
    $('#m-add').setAttribute('data-id', id); $('#m-wa').setAttribute('data-id', id);
    $('#m-sent').hidden = true;
    var rel = (x.rel || []).map(function (r) { return byId[r]; }).filter(Boolean);
    $('#m-rel').innerHTML = rel.length ? '<h4>' + (x.machines.length ? 'Pièces et accessoires associés' : 'Dans la même famille') + '</h4><div class="row">' +
      rel.map(function (y) { return '<button type="button" class="rc" data-open="' + y.id + '">' + pic(y) + '<b>' + esc(y.nom) + '</b><span class="dispo ' + DISPO[y.dispo][1] + '">' + DISPO[y.dispo][0] + '</span></button>'; }).join('') + '</div>' : '';
    if (modal.hidden) { modal.hidden = false; document.body.classList.add('lock'); }
    $('.box', modal).scrollTop = 0;
  }
  function close() { modal.hidden = true; document.body.classList.remove('lock'); }
  $('#grid').addEventListener('click', function (e) {
    var a = e.target.closest('[data-add]'); if (a) { e.stopPropagation(); add(a.getAttribute('data-add')); return; }
    var c = e.target.closest('.card'); if (c) open(c.getAttribute('data-id'));
  });
  $('#grid').addEventListener('keydown', function (e) { if (e.key === 'Enter') { var c = e.target.closest('.card'); if (c) open(c.getAttribute('data-id')); } });
  modal.addEventListener('click', function (e) {
    if (e.target.closest('[data-close]')) return close();
    var o = e.target.closest('[data-open]'); if (o) open(o.getAttribute('data-open'));
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { close(); $('#cart').hidden = true; document.body.classList.remove('lock'); } });
  $('#m-add').addEventListener('click', function () { add(this.getAttribute('data-id')); });
  $('#m-wa').addEventListener('click', function () {
    var x = byId[this.getAttribute('data-id')];
    var t = 'Bonjour SACRI, je souhaite un devis pour : ' + x.nom + ' (réf. ' + x.id + ').';
    $('#m-sent').innerHTML = '<b>Message prêt :</b> « ' + esc(t) + ' »<br><span class="mref">Sur cette page, rien n\'est envoyé.</span>';
    $('#m-sent').hidden = false;
  });

  /* Identifier par photo (simulation) */
  var file = $('#photo'), zone = $('#drop');
  ['dragenter', 'dragover'].forEach(function (ev) { zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.remove('over'); }); });
  zone.addEventListener('drop', function (e) { var f = e.dataTransfer.files[0]; if (f) read(f); });
  function read(f) { var r = new FileReader(); r.onload = function () { simulate(r.result); }; r.readAsDataURL(f); }
  file.addEventListener('change', function () { if (file.files && file.files[0]) read(file.files[0]); });
  function simulate(src) {
    $('#drop-in').hidden = true;
    $('#id-prev').hidden = false;
    $('#id-prev').innerHTML = '<img src="' + src + '" alt="Votre photo"><span class="chg">Changer de photo</span>';
    $('#id-res').innerHTML = '<div class="scan"><i></i>Analyse de la photo en cours…</div>';
    setTimeout(function () {
      var main = byId['SC-0001'];
      var parts = A.filter(function (x) { return x.id !== main.id && x.machines.indexOf('MS 661') > -1; }).slice(0, 4);
      $('#id-res').innerHTML = '<div class="found"><span class="lab">' + ico('check') + 'Machine reconnue (exemple)</span>' +
        '<button type="button" class="hit prop" data-open="' + main.id + '"><img src="' + main.img + '" alt=""><span><b>' + esc(main.nom) + '</b><small>Réf. ' + main.id + ', ' + esc(main.soc) + '</small>' +
        '<span class="conf">Correspondance <i style="--w:92%"></i> 92 %</span></span></button>' +
        '<h4>Pièces compatibles</h4>' +
        parts.map(function (x) {
          return '<button type="button" class="prop" data-open="' + x.id + '">' + (x.img ? '<img src="' + x.img + '" alt="">' : '<span class="mini">' + ico(x.ico) + '</span>') +
            '<span><b>' + esc(x.nom) + '</b><small class="dispo ' + DISPO[x.dispo][1] + '">' + DISPO[x.dispo][0] + '</small></span></button>';
        }).join('') +
        '<p class="mref">Prix sur devis. Un conseiller SACRI confirme la pièce avant toute commande.</p>' +
        '<div class="f-act"><button type="button" class="btn" id="id-add">' + ico('plus') + 'Ajouter ces pièces</button>' +
        '<button type="button" class="btn btn-wa" id="id-wa">' + ico('chat') + 'Demander sur WhatsApp</button></div></div>';
      $('#id-add').addEventListener('click', function () { parts.forEach(function (x) { if (!cart[x.id]) cart[x.id] = 1; }); save(); count(); render(); toast(parts.length + ' pièces ajoutées à votre demande'); });
      $('#id-wa').addEventListener('click', function () { parts.forEach(function (x) { if (!cart[x.id]) cart[x.id] = 1; }); save(); count(); render(); drawCart(); $('#cart').hidden = false; document.body.classList.add('lock'); });
    }, 1300);
  }
  $('#essai-photo').addEventListener('click', function () { simulate(byId['SC-0001'].img); });
  $('#id-res').addEventListener('click', function (e) { var b = e.target.closest('[data-open]'); if (b) open(b.getAttribute('data-open')); });

  count(); render();
})();
