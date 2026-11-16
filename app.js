/* Catalogue intelligent SACRI — démonstration. Aucune donnée n'est envoyée. */
(function () {
  var A = window.ARTICLES || [];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var norm = function (t) { return (t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, ' '); };
  var SYN = {
    'karcher': 'nettoyeur', 'pulverisateur': 'atomiseur', 'tondeuse': 'tondeuse', 'scie': 'tronconneuse',
    'gazon': 'tondeuse', 'herbe': 'debroussailleuse', 'chainsaw': 'tronconneuse', 'barre': 'guide',
    'durite': 'flexible', 'tuyau': 'flexible', 'roulements': 'roulement', 'courroies': 'courroie', 'gants': 'gants',
    'chaussures': 'chaussure', 'huiles': 'huile', 'graissage': 'graisse', 'hevea': 'hevea', 'caoutchouc': 'hevea',
    'compresseurs': 'compresseur', 'verins': 'verin', 'lames': 'lame', 'bucheron': 'bucheron', 'cuves': 'cuve'
  };
  var STOP = ['pour', 'de', 'des', 'du', 'la', 'le', 'les', 'un', 'une', 'et', 'a', 'au', 'aux', 'en', 'cm', 'avec', 'sur', 'ma', 'mon', 'je', 'cherche', 'besoin', 'piece', 'pieces', 'demo', 'ref'];
  A.forEach(function (x) {
    x.machines = x.machines || [];
    x._h = norm([x.ref, x.nom, x.desc, x.fam, x.soc, x.machines.join(' '), x.tags].join(' '));
    x._m = norm(x.machines.join(' ')).replace(/\s+/g, '');
  });

  var state = { q: '', soc: 'Toutes', fam: 'Toutes', n: 12 };
  var DISPO = { stock: ['En stock', 'ok'], faible: ['Stock faible', 'low'], commande: ['Sur commande', 'cmd'], service: ['Prestation atelier', 'svc'], etude: ['Sur étude', 'svc'] };
  var ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.7 6.3a4 4 0 0 0-5.2 5.2L3.6 17.4a1.4 1.4 0 0 0 2 2l5.9-5.9a4 4 0 0 0 5.2-5.2l-2.4 2.4-2.1-.5-.5-2.1z"/></svg>';

  function score(x, q) {
    if (!q) return 1;
    var nq = norm(q), s = 0;
    var compact = nq.replace(/\s+/g, '');
    var refq = nq.match(/demo[\s-]*0*(\d{1,4})/);
    if (refq) return +x.ref.slice(5) === +refq[1] ? 1000 : 0;
    if (norm(x.ref) === nq.trim() || norm(x.ref).replace(/-/g, '') === compact.replace(/-/g, '')) return 1000;
    if (x._m && compact.length > 2 && x._m.indexOf(compact) > -1) s += 60;
    var num = nq.match(/(\d{2,3})\s*cm/);
    var words = nq.split(/[^a-z0-9]+/).filter(function (w) { return w && STOP.indexOf(w) < 0; });
    var hit = 0;
    words.forEach(function (w) {
      var ws = [w, SYN[w] || w, w.replace(/s$/, '')];
      var ok = ws.some(function (v) { return v.length > 1 && x._h.indexOf(v) > -1; });
      if (ok) { hit++; s += norm(x.nom).indexOf(ws[1]) > -1 || norm(x.nom).indexOf(ws[2]) > -1 ? 14 : 6; }
    });
    if (words.length && !hit && s < 60) return 0;
    if (words.length > 1) s += 10 * hit / words.length;
    if (num) {
      if (x.cm) { var dif = Math.abs(+num[1] - x.cm); s += dif === 0 ? 45 : (dif <= 5 ? 30 : -20); }
      else s -= 12;
    }
    if (words.length && norm(x.nom).indexOf(SYN[words[0]] || words[0]) === 0) s += 20;
    return s;
  }

  function filtered() {
    var r = A.filter(function (x) {
      return (state.soc === 'Toutes' || x.soc === state.soc) && (state.fam === 'Toutes' || x.fam === state.fam);
    }).map(function (x) { return [score(x, state.q), x]; }).filter(function (p) { return p[0] > 0; });
    if (state.q) r.sort(function (a, b) { return b[0] - a[0]; });
    if (r.length && r[0][0] >= 1000) r = r.filter(function (p) { return p[0] >= 1000; });
    return r.map(function (p) { return p[1]; });
  }

  function card(x) {
    var d = DISPO[x.dispo] || DISPO.stock;
    var img = x.img ? '<img src="' + x.img + '" alt="">' : '<div class="ph">' + ICON + '<span>Photo à fournir</span></div>';
    return '<article class="card" data-ref="' + x.ref + '" tabindex="0">' +
      '<div class="pic">' + img + '</div>' +
      '<div class="body"><div class="meta"><span class="soc">' + x.soc + '</span><span class="dispo ' + d[1] + '">' + d[0] + '</span></div>' +
      '<h3>' + x.nom + '</h3><p class="ref">Réf. démo ' + x.ref + '</p>' +
      (x.machines.length ? '<p class="mach">Compatible : ' + x.machines.join(', ') + '</p>' : '') +
      '</div></article>';
  }

  function render() {
    var r = filtered();
    $('#count').textContent = r.length + (r.length > 1 ? ' articles' : ' article');
    var more = $('#more'), shown = r.slice(0, state.n);
    more.hidden = r.length <= state.n;
    more.textContent = 'Afficher plus (' + (r.length - shown.length) + ' restants)';
    $('#grid').innerHTML = r.length ? shown.map(card).join('') :
      '<div class="empty"><b>Aucun article ne correspond.</b><span>Essayez un autre mot, ou demandez directement un devis : un conseiller SACRI identifie la pièce.</span></div>';
  }

  function chips(id, key, values) {
    var el = $(id);
    el.innerHTML = ['Toutes'].concat(values).map(function (v) {
      return '<button type="button" class="chip' + (v === state[key] ? ' on' : '') + '" data-v="' + v + '">' + v + '</button>';
    }).join('');
    el.addEventListener('click', function (e) {
      var b = e.target.closest('.chip'); if (!b) return;
      state[key] = b.getAttribute('data-v');
      $$('.chip', el).forEach(function (c) { c.classList.toggle('on', c === b); });
      state.n = 12; render();
    });
  }
  var uniq = function (k) { return A.map(function (x) { return x[k]; }).filter(function (v, i, s) { return s.indexOf(v) === i; }); };
  chips('#f-soc', 'soc', uniq('soc'));
  chips('#f-fam', 'fam', uniq('fam'));

  var inp = $('#q');
  inp.addEventListener('input', function () { state.q = inp.value; state.n = 12; render(); });
  $('#more').addEventListener('click', function () { state.n += 12; render(); });
  $('#search').addEventListener('submit', function (e) { e.preventDefault(); state.q = inp.value; render(); $('#catalogue').scrollIntoView({ behavior: 'smooth' }); });
  $$('.ex').forEach(function (b) {
    b.addEventListener('click', function () { inp.value = b.textContent.replace(/[«»]/g, '').trim(); state.q = inp.value; render(); $('#catalogue').scrollIntoView({ behavior: 'smooth' }); });
  });

  /* Fiche article */
  var modal = $('#fiche');
  function open(ref) {
    var x = A.filter(function (y) { return y.ref === ref; })[0]; if (!x) return;
    var d = DISPO[x.dispo] || DISPO.stock;
    $('#m-pic').innerHTML = x.img ? '<img src="' + x.img + '" alt="">' : '<div class="ph big">' + ICON + '<span>Photo à fournir par SACRI</span></div>';
    $('#m-soc').textContent = 'Vendu par ' + x.soc;
    $('#m-nom').textContent = x.nom;
    $('#m-ref').textContent = 'Réf. démo ' + x.ref + ' · ' + x.fam;
    $('#m-desc').textContent = x.desc;
    $('#m-mach').innerHTML = x.machines.length ? '<b>Machines compatibles</b> ' + x.machines.join(', ') : '';
    $('#m-dispo').className = 'dispo ' + d[1]; $('#m-dispo').textContent = d[0] + ' (indicatif, démonstration)';
    $('#m-wa').setAttribute('data-nom', x.nom); $('#m-wa').setAttribute('data-ref', x.ref);
    $('#m-sent').hidden = true;
    modal.hidden = false; document.body.classList.add('lock');
  }
  function close() { modal.hidden = true; document.body.classList.remove('lock'); }
  $('#grid').addEventListener('click', function (e) { var c = e.target.closest('.card'); if (c) open(c.getAttribute('data-ref')); });
  $('#grid').addEventListener('keydown', function (e) { if (e.key === 'Enter') { var c = e.target.closest('.card'); if (c) open(c.getAttribute('data-ref')); } });
  $$('[data-close]').forEach(function (b) { b.addEventListener('click', close); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  $('#m-wa').addEventListener('click', function () {
    var t = 'Bonjour SACRI, je souhaite un devis pour : ' + this.getAttribute('data-nom') + ' (' + this.getAttribute('data-ref') + ').';
    $('#m-msg').textContent = '« ' + t + ' »';
    $('#m-sent').hidden = false;
  });

  /* Identifier une pièce par photo — simulation */
  var file = $('#photo'), zone = $('#drop');
  function simulate(src) {
    $('#id-prev').innerHTML = '<img src="' + src + '" alt="Photo déposée">';
    $('#id-res').innerHTML = '<div class="scan"><i></i>Analyse simulée de la photo…</div>';
    zone.classList.add('has');
    setTimeout(function () {
      var picks = ['DEMO-0015', 'DEMO-0018', 'DEMO-0020'].map(function (r) { return A.filter(function (x) { return x.ref === r; })[0]; });
      $('#id-res').innerHTML = '<p class="sim-tag">Résultat simulé · démonstration</p><h4>Pièces proposées</h4>' +
        picks.map(function (x, i) {
          return '<button type="button" class="prop" data-ref="' + x.ref + '"><span class="pc">' + [86, 61, 34][i] + ' %</span><span><b>' + x.nom + '</b><small>' + x.soc + ' · Réf. démo ' + x.ref + '</small></span></button>';
        }).join('') + '<p class="hint">Dans la version réelle, un conseiller confirme la pièce avant tout devis.</p>';
    }, 1400);
  }
  file.addEventListener('change', function () {
    var f = file.files && file.files[0]; if (!f) return;
    var r = new FileReader(); r.onload = function () { simulate(r.result); }; r.readAsDataURL(f);
  });
  $('#demo-photo').addEventListener('click', function () { simulate('https://sacri-ci.com/assets/images/produits/agricole-et-forestier/tronconneuse-ms661-c-m-63cm-r-es-36rm-stihl.jpg'); });
  $('#id-res').addEventListener('click', function (e) { var b = e.target.closest('.prop'); if (b) open(b.getAttribute('data-ref')); });

  render();
})();
