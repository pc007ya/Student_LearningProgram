/* 學習星球 · 自然科教學插圖庫
   window.SCI_ART.scenes[key]() -> SVG 字串（520x260），取代原本的表情符號場景。 */
(function () {
  var C = {
    ink: '#2b1f57', sub: '#7c74a8', pur: '#7c5cff', purL: '#ece7ff', mint: '#35c98a', pink: '#ff7ab8',
    cyan: '#22c8d8', red: '#ef4f6b', redD: '#c8283f', blue: '#3d7ff2', blueD: '#2450b8',
    steel: '#b6c0d4', steelD: '#7d8798', wood: '#d29a62', woodD: '#a76c3a',
    water: '#54c6ea', waterD: '#1f8ec2', ice: '#c9ecf9', glass: '#e4f3fc',
    leaf: '#54bd72', leafD: '#2f8f4e', soil: '#cba784', soilD: '#9c7448',
    sun: '#ffc93c', sunD: '#f5921d', paper: '#ffffff', grey: '#e9e6f5', dark: '#4a3d7a'
  };
  var FONT = "'Noto Sans TC', system-ui, sans-serif";

  var CSS = '<style>' +
    '@keyframes saFloat{0%,100%{translate:0 0}50%{translate:0 -7px}}' +
    '@keyframes saPulse{0%,100%{scale:1;opacity:1}50%{scale:1.08;opacity:.9}}' +
    '@keyframes saGlow{0%,100%{opacity:.25}50%{opacity:.7}}' +
    '@keyframes saBlink{0%,100%{opacity:1}50%{opacity:.2}}' +
    '@keyframes saPullL{0%{translate:0 0}100%{translate:-16px 0}}' +
    '@keyframes saPullR{0%{translate:0 0}100%{translate:16px 0}}' +
    '@keyframes saDrop{0%{translate:0 -6px;opacity:0}30%{opacity:1}100%{translate:0 14px;opacity:0}}' +
    '@keyframes saRise{0%{translate:0 8px;opacity:0}35%{opacity:.9}100%{translate:0 -18px;opacity:0}}' +
    '@keyframes saFlow{to{stroke-dashoffset:-40}}' +
    '@keyframes saSpin{0%,100%{rotate:-7deg}50%{rotate:7deg}}' +
    '.saFloat{animation:saFloat 2.4s ease-in-out infinite}' +
    '.saPulse{animation:saPulse 1.8s ease-in-out infinite;transform-box:fill-box;transform-origin:center}' +
    '.saGlow{animation:saGlow 1.9s ease-in-out infinite}' +
    '.saBlink{animation:saBlink 1.6s ease-in-out infinite}' +
    '.saPullL{animation:saPullL 1.6s ease-in-out infinite alternate}' +
    '.saPullR{animation:saPullR 1.6s ease-in-out infinite alternate}' +
    '.saDrop{animation:saDrop 2s ease-in infinite}' +
    '.saRise{animation:saRise 2.6s ease-out infinite}' +
    '.saFlow{stroke-dasharray:10 12;animation:saFlow 1.1s linear infinite}' +
    '.saSpin{animation:saSpin 2.6s ease-in-out infinite;transform-box:fill-box;transform-origin:center}' +
    '</style>';

  var DEFS = '<defs>' +
    '<linearGradient id="saRedG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7d92"/><stop offset="1" stop-color="' + C.redD + '"/></linearGradient>' +
    '<linearGradient id="saBlueG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#79a8ff"/><stop offset="1" stop-color="' + C.blueD + '"/></linearGradient>' +
    '<linearGradient id="saSteelG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef1f7"/><stop offset=".45" stop-color="' + C.steel + '"/><stop offset="1" stop-color="' + C.steelD + '"/></linearGradient>' +
    '<linearGradient id="saWaterG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fddf6"/><stop offset="1" stop-color="' + C.waterD + '"/></linearGradient>' +
    '<linearGradient id="saIceG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0fbff"/><stop offset="1" stop-color="#9fdcf2"/></linearGradient>' +
    '<linearGradient id="saSkyG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dff0ff"/><stop offset="1" stop-color="#f7fbff"/></linearGradient>' +
    '<linearGradient id="saLeafG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7fd899"/><stop offset="1" stop-color="' + C.leafD + '"/></linearGradient>' +
    '<linearGradient id="saSoilG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9b691"/><stop offset="1" stop-color="' + C.soilD + '"/></linearGradient>' +
    '<radialGradient id="saSunG"><stop offset="0" stop-color="#ffe28a"/><stop offset="1" stop-color="' + C.sunD + '"/></radialGradient>' +
    '<radialGradient id="saBulbG"><stop offset="0" stop-color="#fff6c9"/><stop offset="1" stop-color="#ffd24a"/></radialGradient>' +
    '<linearGradient id="saBeamG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".95"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/></linearGradient>' +
    '<marker id="saArrP" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="' + C.pur + '"/></marker>' +
    '<marker id="saArrM" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="' + C.mint + '"/></marker>' +
    '<marker id="saArrR" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="' + C.red + '"/></marker>' +
    '<marker id="saArrW" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="' + C.waterD + '"/></marker>' +
    '</defs>';

  var defsInjected = false;
  function ensureDefs() {
    if (defsInjected || typeof document === 'undefined' || !document.body) return;
    defsInjected = true;
    var host = document.createElement('div');
    host.setAttribute('data-sci-art-defs', '1');
    host.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    host.innerHTML = '<svg width="0" height="0" aria-hidden="true">' + CSS + DEFS + '</svg>';
    document.body.appendChild(host);
  }

  function svg(inner, opt) {
    opt = opt || {};
    ensureDefs();
    var bg = opt.bg === null ? '' : '<rect x="0" y="0" width="520" height="260" rx="22" fill="' + (opt.bg || '#f8f6ff') + '"/>';
    return '<svg viewBox="0 0 520 260" width="100%" style="display:block;max-width:520px" xmlns="http://www.w3.org/2000/svg">' +
      bg + inner + '</svg>';
  }

  function T(x, y, s, o) {
    o = o || {};
    return '<text x="' + x + '" y="' + y + '" text-anchor="' + (o.a || 'middle') + '" font-family="' + FONT +
      '" font-size="' + (o.s || 15) + '" font-weight="' + (o.w || 900) + '" fill="' + (o.c || C.ink) + '"' +
      (o.cls ? ' class="' + o.cls + '"' : '') + '>' + s + '</text>';
  }

  function pill(cx, y, text, o) {
    o = o || {};
    var w = o.w || (String(text).replace(/[\x00-\x7F]/g, '').length * 15 + String(text).replace(/[^\x00-\x7F]/g, '').length * 8 + 22);
    var h = o.h || 26;
    return '<g' + (o.cls ? ' class="' + o.cls + '"' : '') + '><rect x="' + (cx - w / 2) + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (h / 2) +
      '" fill="' + (o.bg || '#fff') + '" stroke="' + (o.bd || C.purL) + '" stroke-width="1.5"/>' +
      T(cx, y + h / 2 + 5, text, { s: o.s || 14, c: o.c || C.pur }) + '</g>';
  }

  function tick(x, y, ok) {
    return ok
      ? '<g><circle cx="' + x + '" cy="' + y + '" r="13" fill="' + C.mint + '"/><path d="M' + (x - 6) + ' ' + y + ' l4.5 5 l8 -9.5" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></g>'
      : '<g><circle cx="' + x + '" cy="' + y + '" r="13" fill="' + C.red + '"/><path d="M' + (x - 5) + ' ' + (y - 5) + ' l10 10 M' + (x + 5) + ' ' + (y - 5) + ' l-10 10" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/></g>';
  }

  /* ---------- 物件 ---------- */

  function magnet(x, y, o) {
    o = o || {};
    var w = o.w || 150, h = o.h || 52, r = 12, half = w / 2, flip = !!o.flip;
    var lg = flip ? 'url(#saBlueG)' : 'url(#saRedG)', rg = flip ? 'url(#saRedG)' : 'url(#saBlueG)';
    var lt = flip ? 'S' : 'N', rt = flip ? 'N' : 'S';
    var left = 'M' + r + ' 0 L' + half + ' 0 L' + half + ' ' + h + ' L' + r + ' ' + h + ' Q0 ' + h + ' 0 ' + (h - r) + ' L0 ' + r + ' Q0 0 ' + r + ' 0 Z';
    var right = 'M' + half + ' 0 L' + (w - r) + ' 0 Q' + w + ' 0 ' + w + ' ' + r + ' L' + w + ' ' + (h - r) + ' Q' + w + ' ' + h + ' ' + (w - r) + ' ' + h + ' L' + half + ' ' + h + ' Z';
    return '<g transform="translate(' + x + ',' + y + ')' + (o.rot ? ' rotate(' + o.rot + ',' + w / 2 + ',' + h / 2 + ')' : '') + '"' + (o.cls ? ' class="' + o.cls + '"' : '') + '>' +
      '<ellipse cx="' + w / 2 + '" cy="' + (h + 9) + '" rx="' + (w / 2 - 6) + '" ry="6" fill="' + C.ink + '" opacity=".08"/>' +
      '<path d="' + left + '" fill="' + lg + '"/><path d="' + right + '" fill="' + rg + '"/>' +
      '<rect x="6" y="6" width="' + (w - 12) + '" height="9" rx="4.5" fill="#fff" opacity=".28"/>' +
      T(half / 2, h / 2 + 9, lt, { s: 25, c: '#fff' }) + T(half + half / 2, h / 2 + 9, rt, { s: 25, c: '#fff' }) +
      '</g>';
  }

  function fieldArcs(cx, cy, o) {
    o = o || {};
    var s = o.s || 1, out = '';
    for (var i = 1; i <= 3; i++) {
      var sp = 60 * i * s, hh = 34 * i * s;
      out += '<path d="M' + (cx - sp) + ' ' + cy + ' Q' + cx + ' ' + (cy - hh) + ' ' + (cx + sp) + ' ' + cy + '" fill="none" stroke="' + C.pur + '" stroke-width="2" stroke-dasharray="6 7" opacity="' + (0.5 - i * 0.09) + '"/>';
      out += '<path d="M' + (cx - sp) + ' ' + cy + ' Q' + cx + ' ' + (cy + hh) + ' ' + (cx + sp) + ' ' + cy + '" fill="none" stroke="' + C.pur + '" stroke-width="2" stroke-dasharray="6 7" opacity="' + (0.5 - i * 0.09) + '"/>';
    }
    return '<g class="saGlow">' + out + '</g>';
  }

  function clip(x, y, o) {
    o = o || {};
    var s = o.s || 1;
    return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')' + (o.rot ? ' rotate(' + o.rot + ')' : '') + '"' + (o.cls ? ' class="' + o.cls + '"' : '') + '>' +
      '<rect x="-9" y="-17" width="18" height="34" rx="9" fill="none" stroke="' + C.steelD + '" stroke-width="3.4"/>' +
      '<rect x="-4.5" y="-10" width="9" height="24" rx="4.5" fill="none" stroke="' + C.steel + '" stroke-width="3.4"/>' +
      '</g>';
  }

  function nail(x, y, o) {
    o = o || {};
    var s = o.s || 1;
    return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')' + (o.rot ? ' rotate(' + o.rot + ')' : '') + '"' + (o.cls ? ' class="' + o.cls + '"' : '') + '>' +
      '<path d="M-4 -14 L4 -14 L2.5 20 L0 26 L-2.5 20 Z" fill="url(#saSteelG)"/>' +
      '<ellipse cx="0" cy="-15" rx="12" ry="5" fill="url(#saSteelG)"/>' +
      '<ellipse cx="-3" cy="-16" rx="4" ry="1.6" fill="#fff" opacity=".7"/></g>';
  }

  function woodBlock(x, y, o) {
    o = o || {};
    var s = o.s || 1;
    return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')"' + (o.cls ? ' class="' + o.cls + '"' : '') + '>' +
      '<path d="M-26 -8 L0 -20 L26 -8 L0 4 Z" fill="' + C.wood + '"/>' +
      '<path d="M-26 -8 L-26 16 L0 28 L0 4 Z" fill="' + C.woodD + '"/>' +
      '<path d="M26 -8 L26 16 L0 28 L0 4 Z" fill="#8d5a2e"/>' +
      '<path d="M-20 2 L-20 20 M-12 6 L-12 24" stroke="#7a4c25" stroke-width="1.6" opacity=".6"/></g>';
  }

  function paperSheet(x, y, o) {
    o = o || {};
    var s = o.s || 1;
    return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')' + (o.rot ? ' rotate(' + o.rot + ')' : '') + '"' + (o.cls ? ' class="' + o.cls + '"' : '') + '>' +
      '<path d="M-20 -26 H12 L20 -18 V26 H-20 Z" fill="#fff" stroke="#d9d4ec" stroke-width="2"/>' +
      '<path d="M12 -26 V-18 H20 Z" fill="#eeebf8"/>' +
      '<path d="M-12 -8 H12 M-12 0 H12 M-12 8 H4" stroke="#cfc9e6" stroke-width="2.4" stroke-linecap="round"/></g>';
  }

  function compass(x, y, o) {
    o = o || {};
    var r = o.r || 46;
    return '<g transform="translate(' + x + ',' + y + ')"' + (o.cls ? ' class="' + o.cls + '"' : '') + '>' +
      '<circle cx="0" cy="6" r="' + r + '" fill="' + C.ink + '" opacity=".08"/>' +
      '<circle cx="0" cy="0" r="' + r + '" fill="#fdfcff" stroke="' + C.steelD + '" stroke-width="5"/>' +
      '<circle cx="0" cy="0" r="' + (r - 11) + '" fill="none" stroke="' + C.purL + '" stroke-width="2"/>' +
      T(0, -r + 20, 'N', { s: 13, c: C.red }) + T(0, r - 10, 'S', { s: 13, c: C.sub }) +
      T(-r + 13, 5, 'W', { s: 13, c: C.sub, a: 'middle' }) + T(r - 13, 5, 'E', { s: 13, c: C.sub, a: 'middle' }) +
      '<g class="saSpin"><path d="M0 ' + (-r + 17) + ' L8 0 L-8 0 Z" fill="' + C.red + '"/><path d="M0 ' + (r - 17) + ' L8 0 L-8 0 Z" fill="' + C.steel + '"/></g>' +
      '<circle cx="0" cy="0" r="4.5" fill="' + C.ink + '"/></g>';
  }

  function sun(x, y, o) {
    o = o || {};
    var r = o.r || 26, out = '';
    for (var i = 0; i < 8; i++) {
      var a = i * Math.PI / 4;
      out += '<line x1="' + (Math.cos(a) * (r + 8)).toFixed(1) + '" y1="' + (Math.sin(a) * (r + 8)).toFixed(1) +
        '" x2="' + (Math.cos(a) * (r + 18)).toFixed(1) + '" y2="' + (Math.sin(a) * (r + 18)).toFixed(1) +
        '" stroke="' + C.sunD + '" stroke-width="4.5" stroke-linecap="round"/>';
    }
    return '<g transform="translate(' + x + ',' + y + ')" class="' + (o.cls || 'saPulse') + '">' + out +
      '<circle r="' + r + '" fill="url(#saSunG)"/></g>';
  }

  function iceCube(x, y, o) {
    o = o || {};
    var s = o.s || 1;
    return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')"' + (o.cls ? ' class="' + o.cls + '"' : '') + '>' +
      '<path d="M-28 -10 L0 -26 L28 -10 L0 6 Z" fill="#f2fcff"/>' +
      '<path d="M-28 -10 L-28 18 L0 34 L0 6 Z" fill="url(#saIceG)"/>' +
      '<path d="M28 -10 L28 18 L0 34 L0 6 Z" fill="#8fd4ec"/>' +
      '<path d="M-20 0 L-8 -6" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"/></g>';
  }

  function drop(x, y, o) {
    o = o || {};
    var s = o.s || 1;
    return '<path transform="translate(' + x + ',' + y + ') scale(' + s + ')" d="M0 -16 C9 -4 16 2 16 9 A16 16 0 0 1 -16 9 C-16 2 -9 -4 0 -16 Z" fill="' + (o.c || 'url(#saWaterG)') + '"' + (o.cls ? ' class="' + o.cls + '"' : '') + '/>';
  }

  function glassWater(x, y, o) {
    o = o || {};
    var s = o.s || 1, ice = o.ice;
    return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')"' + (o.cls ? ' class="' + o.cls + '"' : '') + '>' +
      '<path d="M-26 -34 L26 -34 L20 40 L-20 40 Z" fill="' + C.glass + '" opacity=".85"/>' +
      '<path d="M-22.5 -14 L22.5 -14 L20 40 L-20 40 Z" fill="url(#saWaterG)" opacity=".9"/>' +
      '<ellipse cx="0" cy="-14" rx="22.5" ry="5" fill="#a8e6f8"/>' +
      '<path d="M-26 -34 L26 -34 L20 40 L-20 40 Z" fill="none" stroke="#b9d9ea" stroke-width="3"/>' +
      (ice ? '<rect x="-14" y="-8" width="15" height="15" rx="3" fill="#f0fbff" opacity=".95" transform="rotate(-12,-6,0)"/><rect x="2" y="2" width="13" height="13" rx="3" fill="#f0fbff" opacity=".9" transform="rotate(14,8,8)"/>' : '') +
      '<path d="M-19 -26 L-15 34" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".65"/></g>';
  }

  function steam(x, y, o) {
    o = o || {};
    var s = o.s || 1, out = '';
    for (var i = 0; i < 3; i++) {
      out += '<path d="M' + (i * 16 - 16) + ' 0 c-7 -12 7 -18 0 -30 c-6 -10 4 -16 0 -24" fill="none" stroke="' + (o.c || '#8fd4ec') +
        '" stroke-width="4.5" stroke-linecap="round" opacity="' + (0.85 - i * 0.15) + '" class="saRise" style="animation-delay:' + (i * 0.5) + 's"/>';
    }
    return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')">' + out + '</g>';
  }

  function cloud(x, y, o) {
    o = o || {};
    var s = o.s || 1, dark = o.dark;
    return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')" class="' + (o.cls || 'saFloat') + '">' +
      '<g fill="' + (dark ? '#c9cfe4' : '#fff') + '"><circle cx="-26" cy="4" r="20"/><circle cx="0" cy="-10" r="26"/><circle cx="26" cy="2" r="19"/><rect x="-44" y="4" width="88" height="20" rx="10"/></g>' +
      '<ellipse cx="0" cy="22" rx="42" ry="7" fill="' + (dark ? '#aeb6d0' : '#e7eefc') + '"/></g>';
  }

  function bulb(x, y, o) {
    o = o || {};
    var s = o.s || 1, on = o.on !== false;
    var rays = '';
    if (on) for (var i = 0; i < 8; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 4;
      rays += '<line x1="' + (Math.cos(a) * 34).toFixed(1) + '" y1="' + (Math.sin(a) * 34 - 6).toFixed(1) + '" x2="' + (Math.cos(a) * 46).toFixed(1) + '" y2="' + (Math.sin(a) * 46 - 6).toFixed(1) + '" stroke="#ffd24a" stroke-width="4" stroke-linecap="round"/>';
    }
    return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')"' + (o.cls ? ' class="' + o.cls + '"' : '') + '>' +
      (on ? '<g class="saGlow">' + rays + '</g><circle cx="0" cy="-6" r="34" fill="#ffe9a8" opacity=".45" class="saGlow"/>' : '') +
      '<path d="M0 -34 a26 26 0 0 1 15 46 v8 h-30 v-8 a26 26 0 0 1 15 -46 Z" fill="' + (on ? 'url(#saBulbG)' : '#e6e3f2') + '" stroke="' + (on ? '#e9a91c' : '#c8c3dd') + '" stroke-width="2.5"/>' +
      '<path d="M-8 8 l4 -14 l4 8 l4 -8 l4 14" fill="none" stroke="' + (on ? '#d1731a' : '#a9a3c4') + '" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<rect x="-13" y="20" width="26" height="8" rx="3" fill="' + C.steel + '"/><rect x="-13" y="28" width="26" height="7" rx="3" fill="' + C.steelD + '"/>' +
      '<rect x="-7" y="35" width="14" height="6" rx="3" fill="' + C.steelD + '"/></g>';
  }

  function battery(x, y, o) {
    o = o || {};
    var s = o.s || 1;
    return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')"' + (o.cls ? ' class="' + o.cls + '"' : '') + '>' +
      '<rect x="-46" y="-22" width="92" height="44" rx="9" fill="#5b4bb8"/>' +
      '<rect x="-46" y="-22" width="92" height="14" rx="7" fill="#fff" opacity=".18"/>' +
      '<rect x="-46" y="-22" width="26" height="44" rx="9" fill="' + C.pink + '"/>' +
      '<rect x="46" y="-9" width="9" height="18" rx="4" fill="' + C.steelD + '"/>' +
      '<rect x="-55" y="-7" width="9" height="14" rx="4" fill="' + C.steel + '"/>' +
      T(-33, 8, '＋', { s: 20, c: '#fff' }) + T(24, 8, '－', { s: 20, c: '#fff' }) +
      T(0, 7, '1.5V', { s: 14, c: '#fff' }) + '</g>';
  }

  function wire(d, o) {
    o = o || {};
    return '<path d="' + d + '" fill="none" stroke="' + (o.c || '#e0663f') + '" stroke-width="' + (o.w || 7) + '" stroke-linecap="round" stroke-linejoin="round"/>' +
      (o.flow ? '<path d="' + d + '" fill="none" stroke="#ffd24a" stroke-width="4" stroke-linecap="round" class="saFlow"/>' : '');
  }

  function plant(x, y, o) {
    o = o || {};
    var s = o.s || 1, hl = o.hl || '';
    var on = function (k) { return hl === k ? ' class="saPulse"' : ''; };
    return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')">' +
      '<g' + on('root') + '><path d="M0 0 c-4 16 -18 20 -26 34 M0 0 c2 18 14 22 22 36 M0 0 c0 20 -4 28 -3 40" fill="none" stroke="#b9834e" stroke-width="5" stroke-linecap="round"/></g>' +
      '<g' + on('stem') + '><rect x="-5" y="-96" width="10" height="98" rx="5" fill="url(#saLeafG)"/></g>' +
      '<g' + on('leaf') + '><path d="M-4 -52 C-34 -60 -46 -46 -44 -30 C-24 -30 -8 -38 -4 -52 Z" fill="url(#saLeafG)"/>' +
      '<path d="M4 -70 C34 -78 48 -64 44 -48 C24 -48 8 -56 4 -70 Z" fill="' + C.leaf + '"/>' +
      '<path d="M-6 -50 C-20 -44 -32 -38 -40 -33 M6 -68 C20 -62 32 -56 40 -51" stroke="' + C.leafD + '" stroke-width="2" fill="none"/></g>' +
      '<g' + on('flower') + '><g transform="translate(0,-104)"><circle cx="0" cy="-14" r="11" fill="' + C.pink + '"/><circle cx="13" cy="-4" r="11" fill="#ff9ec9"/><circle cx="8" cy="12" r="11" fill="' + C.pink + '"/><circle cx="-8" cy="12" r="11" fill="#ff9ec9"/><circle cx="-13" cy="-4" r="11" fill="' + C.pink + '"/><circle cx="0" cy="0" r="9" fill="' + C.sun + '"/></g></g>' +
      '</g>';
  }

  function seed(x, y, o) {
    o = o || {};
    var s = o.s || 1;
    return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')"' + (o.cls ? ' class="' + o.cls + '"' : '') + '>' +
      '<ellipse cx="0" cy="0" rx="13" ry="17" fill="#c08b52"/><ellipse cx="-4" cy="-5" rx="4" ry="6" fill="#e0b184" opacity=".8"/></g>';
  }

  function sprout(x, y, o) {
    o = o || {};
    var s = o.s || 1;
    return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')"' + (o.cls ? ' class="' + o.cls + '"' : '') + '>' +
      '<path d="M0 0 v-30" stroke="' + C.leafD + '" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M0 -22 C-20 -30 -24 -44 -6 -42 C-2 -34 -1 -28 0 -22 Z" fill="url(#saLeafG)"/>' +
      '<path d="M0 -26 C20 -34 26 -48 8 -46 C3 -38 1 -32 0 -26 Z" fill="' + C.leaf + '"/></g>';
  }

  function soilBand(y, o) {
    o = o || {};
    var x = o.x === undefined ? 20 : o.x, w = o.w || 480, h = o.h || 54;
    return '<g><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="14" fill="url(#saSoilG)"/>' +
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="10" rx="5" fill="#8f6a41" opacity=".35"/>' +
      '<circle cx="' + (x + 40) + '" cy="' + (y + 30) + '" r="3.5" fill="#8f6a41" opacity=".5"/>' +
      '<circle cx="' + (x + w - 60) + '" cy="' + (y + 34) + '" r="4" fill="#8f6a41" opacity=".45"/>' +
      '<circle cx="' + (x + w / 2 + 30) + '" cy="' + (y + 22) + '" r="3" fill="#8f6a41" opacity=".4"/></g>';
  }

  function flashlight(x, y, o) {
    o = o || {};
    var s = o.s || 1, rot = o.rot || 0;
    return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ') rotate(' + rot + ')"' + (o.cls ? ' class="' + o.cls + '"' : '') + '>' +
      '<rect x="-46" y="-13" width="46" height="26" rx="7" fill="#5b4bb8"/>' +
      '<rect x="-46" y="-13" width="46" height="9" rx="4" fill="#fff" opacity=".2"/>' +
      '<path d="M0 -20 L14 -22 L14 22 L0 20 Z" fill="' + C.steelD + '"/>' +
      '<ellipse cx="14" cy="0" rx="5" ry="22" fill="#ffe9a8"/></g>';
  }

  function beam(x, y, len, spread, o) {
    o = o || {};
    return '<path d="M' + x + ' ' + y + ' L' + (x + len) + ' ' + (y - spread) + ' L' + (x + len) + ' ' + (y + spread) + ' Z" fill="url(#saBeamG)"' + (o.cls ? ' class="' + o.cls + '"' : '') + '/>';
  }

  function person(x, y, o) {
    o = o || {};
    var s = o.s || 1;
    return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')"' + (o.cls ? ' class="' + o.cls + '"' : '') + '>' +
      '<circle cx="0" cy="-54" r="13" fill="#f7c9a4"/>' +
      '<path d="M-13 -64 a13 13 0 0 1 26 0 z" fill="' + C.ink + '"/>' +
      '<rect x="-13" y="-38" width="26" height="30" rx="10" fill="' + C.pur + '"/>' +
      '<rect x="-11" y="-8" width="9" height="26" rx="4.5" fill="#4a3d7a"/><rect x="2" y="-8" width="9" height="26" rx="4.5" fill="#4a3d7a"/></g>';
  }

  function shadowShape(x, y, w, h, o) {
    o = o || {};
    return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + w + '" ry="' + h + '" fill="' + C.ink + '" opacity="' + (o.op || 0.5) + '"' + (o.cls ? ' class="' + o.cls + '"' : '') + '/>';
  }

  function moon(x, y, o) {
    o = o || {};
    var r = o.r || 24;
    return '<g transform="translate(' + x + ',' + y + ')"><circle r="' + r + '" fill="#e8ecff"/>' +
      '<circle cx="-7" cy="-6" r="5" fill="#d3d9f5"/><circle cx="8" cy="6" r="4" fill="#d3d9f5"/><circle cx="4" cy="-11" r="3" fill="#d3d9f5"/></g>';
  }

  function switchBox(x, y, o) {
    o = o || {};
    var s = o.s || 1, on = o.on;
    return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')">' +
      '<rect x="-30" y="-12" width="60" height="24" rx="8" fill="#efecfa" stroke="#cfc9e6" stroke-width="2"/>' +
      '<circle cx="-20" cy="0" r="5" fill="' + C.steelD + '"/><circle cx="20" cy="0" r="5" fill="' + C.steelD + '"/>' +
      '<line x1="-20" y1="0" x2="' + (on ? 20 : 14) + '" y2="' + (on ? 0 : -18) + '" stroke="' + (on ? C.mint : C.red) + '" stroke-width="6" stroke-linecap="round"/></g>';
  }

  function key(x, y, o) {
    o = o || {};
    var s = o.s || 1;
    return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ') rotate(' + (o.rot || 0) + ')"' + (o.cls ? ' class="' + o.cls + '"' : '') + '>' +
      '<circle cx="-16" cy="0" r="12" fill="none" stroke="#d8a63c" stroke-width="6"/>' +
      '<rect x="-4" y="-4" width="34" height="8" rx="3" fill="#e8b849"/>' +
      '<rect x="18" y="4" width="5" height="9" rx="2" fill="#e8b849"/><rect x="27" y="4" width="5" height="9" rx="2" fill="#e8b849"/></g>';
  }

  function ruler(x, y, o) {
    o = o || {};
    var s = o.s || 1, out = '';
    for (var i = 1; i < 8; i++) out += '<line x1="' + (-33 + i * 9) + '" y1="-9" x2="' + (-33 + i * 9) + '" y2="' + (i % 2 ? -1 : 3) + '" stroke="#8fa0c0" stroke-width="2"/>';
    return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ') rotate(' + (o.rot || 0) + ')"' + (o.cls ? ' class="' + o.cls + '"' : '') + '>' +
      '<rect x="-38" y="-11" width="76" height="22" rx="5" fill="#bfe5f5" stroke="#8fc9e0" stroke-width="2"/>' + out + '</g>';
  }

  function socket(x, y, o) {
    o = o || {};
    var s = o.s || 1;
    return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')">' +
      '<rect x="-38" y="-38" width="76" height="76" rx="14" fill="#fdfcff" stroke="#d9d4ec" stroke-width="3"/>' +
      '<rect x="-13" y="-16" width="9" height="26" rx="4" fill="' + C.ink + '"/><rect x="4" y="-16" width="9" height="26" rx="4" fill="' + C.ink + '"/>' +
      '<circle cx="0" cy="22" r="4" fill="#d9d4ec"/></g>';
  }

  function warning(x, y, o) {
    o = o || {};
    var s = o.s || 1;
    return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')" class="' + (o.cls || 'saPulse') + '">' +
      '<path d="M0 -34 L34 26 H-34 Z" fill="' + C.sun + '" stroke="' + C.sunD + '" stroke-width="4" stroke-linejoin="round"/>' +
      '<rect x="-4" y="-14" width="8" height="24" rx="4" fill="' + C.ink + '"/><circle cx="0" cy="17" r="4.5" fill="' + C.ink + '"/></g>';
  }

  function shirt(x, y, o) {
    o = o || {};
    var s = o.s || 1;
    return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')"' + (o.cls ? ' class="' + o.cls + '"' : '') + '>' +
      '<path d="M-30 -30 L-12 -38 C-6 -30 6 -30 12 -38 L30 -30 L38 -6 L26 -1 L26 40 H-26 V-1 L-38 -6 Z" fill="#8fd4ec" stroke="#5fb4d6" stroke-width="2.5"/>' +
      (o.wet ? '<path d="M-16 6 q8 10 0 20 M6 2 q8 12 0 22" stroke="#2196c9" stroke-width="3" fill="none" opacity=".6"/>' : '') + '</g>';
  }

  function label(x, y, text, o) {
    o = o || {};
    return T(x, y, text, { s: o.s || 14, c: o.c || C.sub, a: o.a || 'middle' });
  }

  function arrow(x1, y1, x2, y2, o) {
    o = o || {};
    var m = o.m || 'saArrP';
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + (o.c || C.pur) + '" stroke-width="' + (o.w || 4) +
      '" stroke-linecap="round" marker-end="url(#' + m + ')"' + (o.dash ? ' stroke-dasharray="8 8"' : '') + (o.cls ? ' class="' + o.cls + '"' : '') + '/>';
  }

  function curveArrow(d, o) {
    o = o || {};
    return '<path d="' + d + '" fill="none" stroke="' + (o.c || C.pur) + '" stroke-width="' + (o.w || 4) + '" stroke-linecap="round" marker-end="url(#' + (o.m || 'saArrP') + ')"' + (o.dash ? ' stroke-dasharray="8 8"' : '') + '/>';
  }

  function panel(x, y, w, h, o) {
    o = o || {};
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="16" fill="' + (o.bg || '#fff') + '" stroke="' + (o.bd || C.purL) + '" stroke-width="2"/>';
  }

  /* ---------- 場景 ---------- */
  var S = {};

  /* 植物的身體 */
  S.plant1 = function () {
    return svg(soilBand(196) + plant(150, 196, { s: 1.05 }) +
      arrow(300, 92, 205, 100, {}) + label(390, 96, '花：授粉結果實') +
      arrow(300, 130, 200, 150, {}) + label(390, 134, '葉：製造養分') +
      arrow(300, 168, 165, 170, {}) + label(390, 172, '莖：支撐與運送') +
      arrow(300, 214, 175, 224, {}) + label(390, 218, '根：吸水固定') +
      pill(96, 24, '一株植物＝一座小工廠', { s: 13 }));
  };
  S.plant2 = function () {
    return svg(soilBand(150, { h: 96 }) +
      sprout(150, 150, { s: 1.5 }) +
      '<g><path d="M150 150 c-10 26 -34 30 -46 58 M150 150 c8 30 34 34 44 60 M150 150 c0 32 -6 44 -4 62" fill="none" stroke="#b9834e" stroke-width="6" stroke-linecap="round"/></g>' +
      drop(96, 210, { s: 0.8, cls: 'saDrop' }) + drop(206, 214, { s: 0.8, cls: 'saDrop' }) + drop(150, 228, { s: 0.7, cls: 'saDrop' }) +
      curveArrow('M104 224 Q126 196 146 172', { m: 'saArrW', c: C.waterD }) +
      curveArrow('M200 228 Q176 200 156 176', { m: 'saArrW', c: C.waterD }) +
      panel(300, 76, 190, 108) + T(395, 108, '根的工作', { s: 17 }) +
      T(395, 136, '① 吸收水分養分', { s: 14, c: C.sub }) + T(395, 160, '② 固定植物', { s: 14, c: C.sub }) +
      pill(96, 24, '根像吸管', { s: 13 }));
  };
  S.plant3 = function () {
    var flow = '';
    for (var i = 0; i < 3; i++) flow += arrow(150, 200 - i * 44, 150, 172 - i * 44, { c: C.waterD, m: 'saArrW', w: 5 });
    return svg(soilBand(200) + plant(150, 200, { s: 1.05, hl: 'stem' }) + flow +
      panel(286, 60, 208, 140) + T(390, 90, '莖的剖面', { s: 16 }) +
      '<circle cx="390" cy="146" r="42" fill="#eaf9ee" stroke="' + C.leafD + '" stroke-width="3"/>' +
      '<circle cx="376" cy="132" r="7" fill="' + C.water + '"/><circle cx="404" cy="134" r="7" fill="' + C.water + '"/>' +
      '<circle cx="390" cy="160" r="7" fill="' + C.water + '"/><circle cx="368" cy="158" r="6" fill="#c9e8a6"/><circle cx="410" cy="156" r="6" fill="#c9e8a6"/>' +
      T(390, 210, '水管一路送到葉子', { s: 13, c: C.sub }) +
      pill(96, 24, '莖：運送＋支撐', { s: 13 }));
  };
  S.plant4 = function () {
    return svg(sun(452, 52, { r: 22 }) +
      soilBand(214) + plant(150, 214, { s: 1.0, hl: 'leaf' }) +
      beam(430, 66, -130, 34, { cls: 'saGlow' }) +
      arrow(316, 96, 232, 128, { c: C.sunD, m: 'saArrR' }) + label(372, 84, '陽光', { c: C.sunD }) +
      arrow(316, 150, 226, 158, { c: C.pur }) + label(372, 142, '空氣（二氧化碳）') +
      arrow(150, 214, 150, 178, { c: C.waterD, m: 'saArrW', w: 5 }) +
      panel(290, 176, 204, 62, { bg: '#eaf9ee', bd: C.leafD }) +
      T(392, 214, '＝ 養分（光合作用）', { s: 15, c: C.leafD }) +
      pill(100, 24, '葉子是廚房', { s: 13 }));
  };
  S.plant5 = function () {
    return svg(
      panel(24, 62, 146, 156) + '<g transform="translate(97,150)"><circle cx="0" cy="-14" r="15" fill="' + C.pink + '"/><circle cx="17" cy="-2" r="15" fill="#ff9ec9"/><circle cx="11" cy="17" r="15" fill="' + C.pink + '"/><circle cx="-11" cy="17" r="15" fill="#ff9ec9"/><circle cx="-17" cy="-2" r="15" fill="' + C.pink + '"/><circle r="12" fill="' + C.sun + '"/></g>' + T(97, 200, '花：授粉', { s: 14, c: C.sub }) +
      arrow(178, 140, 202, 140, {}) +
      panel(210, 62, 146, 156) + '<g transform="translate(283,146)"><circle r="38" fill="#ef5a5a"/><ellipse cx="-12" cy="-14" rx="10" ry="7" fill="#fff" opacity=".35"/><path d="M0 -38 q4 -14 16 -18 q-4 14 -16 18" fill="' + C.leafD + '"/><rect x="-3" y="-52" width="6" height="16" rx="3" fill="#8d5a2e"/></g>' + T(283, 200, '果實長大', { s: 14, c: C.sub }) +
      arrow(364, 140, 388, 140, {}) +
      panel(396, 62, 100, 156) + seed(446, 138, { s: 1.5 }) + seed(424, 168, { s: 1.0 }) + seed(468, 170, { s: 1.0 }) + T(446, 200, '種子', { s: 14, c: C.sub }) +
      pill(110, 30, '花 → 果實 → 種子', { s: 13 }));
  };
  S.plant6 = function () {
    return svg(
      '<circle cx="260" cy="140" r="92" fill="none" stroke="' + C.purL + '" stroke-width="16"/>' +
      curveArrow('M260 40 A100 100 0 0 1 356 132', { dash: false }) +
      curveArrow('M356 152 A100 100 0 0 1 260 244', {}) +
      curveArrow('M256 244 A100 100 0 0 1 164 148', {}) +
      curveArrow('M164 130 A100 100 0 0 1 254 40', {}) +
      seed(260, 44, { s: 1.2 }) + T(260, 22, '種子', { s: 14, c: C.sub }) +
      sprout(374, 152, { s: 1.1 }) + T(392, 176, '發芽', { s: 14, c: C.sub, a: 'start' }) +
      plant(260, 246, { s: 0.62 }) + T(260, 256, '', {}) +
      '<g transform="translate(126,142)"><circle cx="0" cy="-14" r="11" fill="' + C.pink + '"/><circle cx="12" cy="-4" r="11" fill="#ff9ec9"/><circle cx="8" cy="11" r="11" fill="' + C.pink + '"/><circle cx="-8" cy="11" r="11" fill="#ff9ec9"/><circle cx="-12" cy="-4" r="11" fill="' + C.pink + '"/><circle r="8" fill="' + C.sun + '"/></g>' +
      T(84, 176, '開花', { s: 14, c: C.sub }) +
      T(260, 146, '生命的循環', { s: 17, c: C.pur }));
  };

  /* 磁鐵與磁力 */
  S.magnet1 = function () {
    return svg(fieldArcs(200, 130, { s: 0.9 }) + magnet(126, 104, { w: 148 }) +
      clip(360, 118, { s: 1.2, cls: 'saPullL', rot: -12 }) + clip(404, 150, { s: 1.1, cls: 'saPullL', rot: 14 }) +
      curveArrow('M348 122 Q312 128 292 130', { c: C.pur }) +
      pill(112, 26, '看不見的磁力', { s: 13 }) +
      T(200, 210, '磁鐵可以隔空吸住鐵做的東西', { s: 15, c: C.sub }));
  };
  S.magnet2 = function () {
    return svg(magnet(186, 116, { w: 148, h: 46 }) +
      panel(20, 44, 150, 172, { bg: '#eefaf3', bd: C.mint }) + T(95, 72, '吸得住', { s: 16, c: C.leafD }) +
      nail(64, 132, { s: 1.05, rot: 24 }) + clip(126, 130, { s: 1.05, rot: -10 }) + tick(95, 190, true) +
      panel(350, 44, 150, 172, { bg: '#fff1f4', bd: C.red }) + T(425, 72, '吸不住', { s: 16, c: C.redD }) +
      woodBlock(396, 128, { s: 1.0 }) + paperSheet(456, 130, { s: 0.9, rot: 8 }) + tick(425, 190, false) +
      T(260, 200, '只吸鐵', { s: 14, c: C.sub }));
  };
  S.magnet3 = function () {
    return svg(magnet(186, 108, { w: 148, h: 52 }) +
      clip(140, 92, { s: 0.9, rot: -20 }) + clip(148, 142, { s: 0.9, rot: 16 }) + clip(124, 118, { s: 0.9, rot: 4 }) +
      clip(380, 92, { s: 0.9, rot: 20 }) + clip(372, 144, { s: 0.9, rot: -14 }) + clip(396, 118, { s: 0.9, rot: -2 }) +
      arrow(150, 52, 180, 96, { c: C.red, m: 'saArrR' }) + T(126, 42, 'N 極', { s: 15, c: C.redD }) +
      arrow(372, 52, 342, 96, { c: C.blue, m: 'saArrP' }) + T(396, 42, 'S 極', { s: 15, c: C.blueD }) +
      T(260, 212, '兩端磁力最強，中間最弱', { s: 15, c: C.sub }) +
      pill(400, 210, '中間吸不牢', { s: 12, w: 108 }));
  };
  S.magnet4 = function () {
    return svg(magnet(48, 106, { w: 132, h: 50, cls: 'saPullR' }) + magnet(340, 106, { w: 132, h: 50, cls: 'saPullL' }) +
      '<g class="saGlow">' +
      '<path d="M188 118 q22 -12 44 0" fill="none" stroke="' + C.pur + '" stroke-width="3" stroke-dasharray="6 6"/>' +
      '<path d="M188 144 q22 12 44 0" fill="none" stroke="' + C.pur + '" stroke-width="3" stroke-dasharray="6 6"/></g>' +
      arrow(196, 90, 236, 90, { c: C.mint, m: 'saArrM' }) + arrow(324, 90, 284, 90, { c: C.mint, m: 'saArrM' }) +
      pill(260, 178, '異極相吸', { s: 15, bg: '#eefaf3', bd: C.mint, c: C.leafD, w: 108 }) +
      T(260, 232, 'N 極碰 S 極 → 啪！吸在一起', { s: 15, c: C.sub }));
  };
  S.magnet5 = function () {
    return svg(magnet(34, 106, { w: 132, h: 50, cls: 'saPullL' }) + magnet(354, 106, { w: 132, h: 50, flip: true, cls: 'saPullR' }) +
      '<g class="saPulse"><path d="M260 100 l12 22 l24 -6 l-16 20 l18 16 l-26 -2 l-4 24 l-14 -20 l-22 10 l8 -24 l-22 -12 l24 -8 z" fill="' + C.sun + '" stroke="' + C.sunD + '" stroke-width="3"/></g>' +
      arrow(214 - 20, 84, 174 - 20, 84, { c: C.red, m: 'saArrR' }) + arrow(306 + 20, 84, 346 + 20, 84, { c: C.red, m: 'saArrR' }) +
      T(260, 138, '推開', { s: 14, c: C.redD }) +
      pill(260, 186, '同極相斥', { s: 15, bg: '#fff1f4', bd: C.red, c: C.redD, w: 108 }) +
      T(260, 236, 'N 極碰 N 極 → 互相推開', { s: 15, c: C.sub }));
  };
  S.magnet6 = function () {
    return svg(compass(140, 130, { r: 54, cls: 'saFloat' }) +
      panel(238, 54, 258, 152) +
      T(367, 84, '指北針裡就是小磁鐵', { s: 15 }) +
      magnet(302, 100, { w: 120, h: 30 }) +
      T(367, 162, '磁針受地球磁力', { s: 14, c: C.sub }) + T(367, 186, '一端永遠指向北方', { s: 14, c: C.sub }) +
      pill(120, 226, '同極相斥、異極相吸', { s: 13, w: 190 }) +
      pill(380, 226, '磁力能穿過紙和布', { s: 13, w: 170 }));
  };

  /* 千變萬化的水 */
  function particleBox(x, y, kind) {
    var out = panel(x, y, 132, 64, { bg: '#f2fbff', bd: '#bfe3f2' }), i, j;
    if (kind === 'solid') { for (i = 0; i < 4; i++) for (j = 0; j < 2; j++) out += '<circle cx="' + (x + 34 + i * 22) + '" cy="' + (y + 22 + j * 22) + '" r="7" fill="' + C.water + '"/>'; }
    else if (kind === 'liquid') { var pts = [[30, 20], [56, 30], [80, 18], [104, 32], [40, 46], [68, 48], [96, 46]]; for (i = 0; i < pts.length; i++) out += '<circle cx="' + (x + pts[i][0]) + '" cy="' + (y + pts[i][1]) + '" r="7" fill="' + C.water + '"/>'; }
    else { var p2 = [[26, 16], [62, 28], [98, 14], [42, 48], [86, 50], [110, 34]]; for (i = 0; i < p2.length; i++) out += '<circle cx="' + (x + p2[i][0]) + '" cy="' + (y + p2[i][1]) + '" r="6" fill="' + C.water + '" opacity=".65"/>'; }
    return out;
  }
  S.water1 = function () {
    return svg(
      iceCube(96, 88, { s: 0.95 }) + T(96, 148, '固態・冰', { s: 15 }) + particleBox(30, 164, 'solid') +
      glassWater(260, 96, { s: 0.78 }) + T(260, 148, '液態・水', { s: 15 }) + particleBox(194, 164, 'liquid') +
      steam(424, 128, { s: 0.9 }) + T(424, 148, '氣態・水蒸氣', { s: 15 }) + particleBox(358, 164, 'gas') +
      pill(96, 22, '水的三種樣子', { s: 13 }));
  };
  S.water2 = function () {
    return svg(sun(440, 62, { r: 24 }) +
      iceCube(120, 104, { s: 1.05 }) + T(120, 176, '冰（固態）', { s: 15, c: C.sub }) +
      arrow(196, 120, 268, 120, { c: C.sunD, m: 'saArrR', w: 5 }) + label(232, 104, '加熱', { c: C.sunD }) +
      drop(330, 126, { s: 1.3 }) + drop(370, 148, { s: 0.8, cls: 'saDrop' }) +
      '<path d="M296 172 q40 -14 84 0 q-4 12 -42 12 q-38 0 -42 -12" fill="url(#saWaterG)" opacity=".85"/>' +
      T(340, 202, '水（液態）', { s: 15, c: C.sub }) +
      pill(120, 26, '融化：固態 → 液態', { s: 13, w: 176 }));
  };
  S.water3 = function () {
    return svg(sun(452, 54, { r: 22 }) +
      '<line x1="30" y1="78" x2="330" y2="78" stroke="' + C.steelD + '" stroke-width="3"/>' +
      shirt(120, 122, { s: 1.0, wet: true }) + T(120, 194, '濕衣服', { s: 14, c: C.sub }) +
      steam(200, 116, { s: 0.8 }) + steam(250, 128, { s: 0.7 }) +
      arrow(196, 152, 196, 106, { c: C.waterD, m: 'saArrW' }) +
      panel(300, 118, 196, 96, { bg: '#f2fbff', bd: '#bfe3f2' }) +
      T(398, 150, '水蒸氣飛到空氣中', { s: 15, c: C.waterD }) + T(398, 180, '衣服就乾了', { s: 15, c: C.sub }) +
      pill(120, 26, '蒸發：液態 → 氣態', { s: 13, w: 176 }));
  };
  S.water4 = function () {
    return svg(glassWater(180, 116, { s: 1.0, ice: true }) +
      '<g>' + drop(216, 116, { s: 0.5, c: '#7fd0ea' }) + drop(222, 148, { s: 0.42, c: '#7fd0ea' }) + drop(140, 132, { s: 0.45, c: '#7fd0ea' }) + drop(146, 162, { s: 0.38, c: '#7fd0ea' }) + '</g>' +
      drop(206, 190, { s: 0.5, cls: 'saDrop', c: '#7fd0ea' }) +
      steam(310, 150, { s: 0.75, c: '#a9dcef' }) +
      curveArrow('M330 132 Q290 112 246 118', { m: 'saArrW', c: C.waterD }) +
      T(360, 108, '空氣中的水蒸氣', { s: 14, c: C.sub, a: 'start' }) +
      panel(300, 168, 196, 62, { bg: '#f2fbff', bd: '#bfe3f2' }) + T(398, 206, '遇冷 → 凝結成水珠', { s: 15, c: C.waterD }) +
      pill(126, 26, '凝結：氣態 → 液態', { s: 13, w: 176 }));
  };
  S.water5 = function () {
    return svg(
      '<path d="M60 108 h120 v58 a10 10 0 0 1 -10 10 h-100 a10 10 0 0 1 -10 -10 z" fill="' + C.glass + '" stroke="#b9d9ea" stroke-width="3"/>' +
      '<rect x="66" y="128" width="108" height="42" rx="6" fill="url(#saWaterG)" opacity=".9"/>' +
      T(120, 200, '水（液態）', { s: 14, c: C.sub }) +
      arrow(200, 140, 272, 140, { c: C.blue, m: 'saArrP', w: 5 }) +
      '<g class="saPulse" transform="translate(236,108)"><path d="M0 -16 V16 M-14 -8 L14 8 M-14 8 L14 -8" stroke="' + C.blue + '" stroke-width="4" stroke-linecap="round"/></g>' +
      T(236, 176, '放進冷凍庫', { s: 13, c: C.blueD }) +
      '<path d="M300 104 h130 v62 a10 10 0 0 1 -10 10 h-110 a10 10 0 0 1 -10 -10 z" fill="' + C.glass + '" stroke="#b9d9ea" stroke-width="3"/>' +
      '<rect x="308" y="118" width="52" height="50" rx="6" fill="url(#saIceG)" stroke="#8fd4ec" stroke-width="2"/>' +
      '<rect x="368" y="118" width="52" height="50" rx="6" fill="url(#saIceG)" stroke="#8fd4ec" stroke-width="2"/>' +
      T(364, 200, '冰（固態）', { s: 14, c: C.sub }) +
      pill(122, 26, '結冰：液態 → 固態', { s: 13, w: 176 }));
  };
  S.water6 = function () {
    return svg('<rect x="0" y="0" width="520" height="260" rx="22" fill="url(#saSkyG)"/>' +
      sun(58, 52, { r: 22 }) + cloud(300, 66, { s: 1.0 }) +
      '<path d="M0 200 q60 -30 130 -22 q70 8 120 -18 q60 -32 130 -10 q80 14 140 -6 v116 H0 z" fill="#8fd4ec" opacity=".55"/>' +
      '<path d="M20 232 q80 -18 160 -6 q90 14 160 -8 q90 -24 180 -2 v44 H20 z" fill="url(#saWaterG)"/>' +
      steam(150, 208, { s: 0.85 }) + steam(196, 216, { s: 0.7 }) +
      curveArrow('M176 190 Q206 120 262 96', { m: 'saArrW', c: C.waterD }) + T(150, 130, '蒸發', { s: 14, c: C.waterD }) +
      drop(276, 128, { s: 0.5, cls: 'saDrop' }) + drop(310, 132, { s: 0.45, cls: 'saDrop' }) + drop(342, 126, { s: 0.5, cls: 'saDrop' }) +
      T(408, 118, '凝結成雲', { s: 14, c: C.dark, a: 'start' }) +
      curveArrow('M366 104 Q422 140 402 196', { m: 'saArrW', c: C.waterD }) + T(452, 176, '下雨', { s: 14, c: C.waterD }) +
      pill(96, 26, '水的循環', { s: 13 }));
  };

  /* 光與影 */
  S.light1 = function () {
    return svg(
      panel(20, 52, 150, 168, { bg: '#fffaea', bd: C.sun }) + sun(95, 122, { r: 26 }) + T(95, 186, '太陽', { s: 15 }) + tick(95, 208, true) +
      panel(184, 52, 150, 168, { bg: '#fffaea', bd: C.sun }) + bulb(259, 122, { s: 0.9, cls: 'saGlow' }) + T(259, 186, '電燈', { s: 15 }) + tick(259, 208, true) +
      panel(348, 52, 150, 168, { bg: '#f2f4ff', bd: '#cfd6f5' }) + moon(423, 118, { r: 26 }) + T(423, 186, '月亮', { s: 15 }) + tick(423, 208, false) +
      pill(120, 26, '自己會發光才是光源', { s: 13, w: 190 }) +
      T(423, 240, '月亮只是反射太陽的光', { s: 12, c: C.sub }));
  };
  S.light2 = function () {
    return svg(flashlight(96, 130, { s: 1.0 }) +
      beam(112, 130, 210, 26, { cls: 'saGlow' }) +
      arrow(120, 130, 300, 130, { c: C.sunD, m: 'saArrR', w: 5 }) +
      '<rect x="330" y="40" width="34" height="180" rx="8" fill="#cfc9e6"/>' +
      '<rect x="330" y="40" width="34" height="10" rx="5" fill="#b7afdb"/>' +
      T(347, 250, '牆', { s: 14, c: C.sub }) +
      '<rect x="386" y="96" width="106" height="86" rx="14" fill="#e6e3f2"/>' + T(439, 146, '照不到', { s: 15, c: C.dark }) +
      T(200, 104, '光走直線', { s: 15, c: C.sunD }) +
      pill(110, 30, '光不會轉彎', { s: 13 }));
  };
  S.light3 = function () {
    return svg('<rect x="20" y="196" width="480" height="44" rx="12" fill="#efecfa"/>' +
      flashlight(86, 122, { s: 0.95 }) + beam(102, 122, 130, 34, { cls: 'saGlow' }) +
      '<rect x="238" y="76" width="56" height="120" rx="10" fill="' + C.pur + '"/>' +
      '<rect x="238" y="76" width="56" height="16" rx="8" fill="#9d86ff"/>' + T(266, 66, '不透明物體', { s: 13, c: C.sub }) +
      '<path d="M294 196 L440 196 L440 236 L294 196 Z" fill="' + C.ink + '" opacity=".45"/>' +
      T(392, 226, '影子', { s: 15, c: '#fff' }) +
      arrow(150, 92, 232, 108, { c: C.sunD, m: 'saArrR' }) +
      pill(112, 28, '擋住光 → 有影子', { s: 13, w: 160 }));
  };
  S.light4 = function () {
    return svg(
      panel(20, 44, 232, 190) + T(136, 72, '光源靠近', { s: 15, c: C.pur }) +
      flashlight(64, 128, { s: 0.7 }) + beam(76, 128, 62, 30, { cls: 'saGlow' }) +
      '<rect x="140" y="96" width="26" height="72" rx="6" fill="' + C.pur + '"/>' +
      '<rect x="30" y="168" width="212" height="30" rx="10" fill="#efecfa"/>' +
      '<path d="M166 178 L242 168 L242 196 L166 196 Z" fill="' + C.ink + '" opacity=".45"/>' +
      T(212, 216, '影子大', { s: 15, c: C.redD }) +
      panel(268, 44, 232, 190) + T(384, 72, '光源遠離', { s: 15, c: C.pur }) +
      flashlight(300, 128, { s: 0.7 }) + beam(312, 128, 74, 22, { cls: 'saGlow' }) +
      '<rect x="416" y="104" width="24" height="64" rx="6" fill="' + C.pur + '"/>' +
      '<rect x="278" y="168" width="212" height="30" rx="10" fill="#efecfa"/>' +
      '<path d="M440 180 L478 174 L478 196 L440 196 Z" fill="' + C.ink + '" opacity=".45"/>' +
      T(460, 216, '影子小', { s: 15, c: C.leafD }));
  };
  S.light5 = function () {
    return svg('<rect x="20" y="198" width="480" height="42" rx="12" fill="#efecfa"/>' +
      sun(250, 48, { r: 20 }) + T(250, 22, '中午', { s: 14, c: C.sunD }) +
      person(160, 198, { s: 1.0 }) + '<path d="M172 198 L214 198 L214 214 L172 210 Z" fill="' + C.ink + '" opacity=".45"/>' +
      T(200, 232, '影子短', { s: 14, c: C.dark }) +
      sun(452, 108, { r: 18 }) + T(452, 78, '傍晚', { s: 14, c: C.sunD }) +
      person(390, 198, { s: 1.0 }) + '<path d="M378 198 L280 198 L286 218 L378 210 Z" fill="' + C.ink + '" opacity=".38"/>' +
      T(316, 234, '影子長長的', { s: 14, c: C.dark }) +
      '<line x1="250" y1="70" x2="250" y2="180" stroke="' + C.sunD + '" stroke-width="2" stroke-dasharray="6 7"/>' +
      pill(96, 26, '太陽高 → 影子短', { s: 13, w: 160 }));
  };
  S.light6 = function () {
    return svg('<rect x="20" y="192" width="480" height="46" rx="12" fill="#efecfa"/>' +
      sun(86, 100, { r: 24 }) + T(86, 152, '① 光源', { s: 14, c: C.sunD }) +
      arrow(126, 116, 216, 140, { c: C.sunD, m: 'saArrR', w: 5 }) + T(176, 106, '② 走直線', { s: 14, c: C.sunD }) +
      '<rect x="228" y="104" width="50" height="88" rx="10" fill="' + C.pur + '"/>' + T(253, 92, '③ 擋住', { s: 14, c: C.pur }) +
      '<path d="M278 192 L438 192 L438 232 L278 192 Z" fill="' + C.ink + '" opacity=".45"/>' + T(388, 222, '④ 影子', { s: 15, c: '#fff' }) +
      pill(430, 118, '光源越近影子越大', { s: 12, w: 156 }));
  };

  /* 電路與能源 */
  function circuitBase(o) {
    o = o || {};
    var flow = !!o.flow, broken = !!o.broken, sw = o.sw;
    var out = '';
    out += wire('M120 168 H392 V148', { flow: flow });
    if (broken) {
      out += wire('M408 148 H462 V56 H286', { flow: false });
      out += wire('M234 56 H120 V150', { flow: false });
      out += '<g class="saPulse"><line x1="272" y1="42" x2="248" y2="70" stroke="' + C.red + '" stroke-width="4"/><line x1="248" y1="42" x2="272" y2="70" stroke="' + C.red + '" stroke-width="4"/></g>';
      out += T(260, 30, '斷掉了', { s: 14, c: C.redD });
    } else if (sw !== undefined) {
      out += wire('M408 148 H462 V56 H300', { flow: flow });
      out += wire('M220 56 H120 V150', { flow: flow });
      out += switchBox(260, 56, { s: 1.1, on: sw });
      out += T(260, 26, sw ? '開關關上（通路）' : '開關打開（斷路）', { s: 13, c: sw ? C.leafD : C.redD });
    } else {
      out += wire('M408 148 H462 V56 H120 V150', { flow: flow });
    }
    out += battery(120, 168, { s: 0.86 });
    out += bulb(400, 108, { s: 0.9, on: !!o.lit, cls: o.lit ? 'saGlow' : '' });
    return out;
  }
  S.circuit1 = function () {
    return svg(circuitBase({ flow: true, lit: true }) +
      T(120, 216, '電池', { s: 14, c: C.sub }) + T(392, 186, '燈泡亮了！', { s: 15, c: C.leafD }) +
      T(258, 200, '電流繞一圈回到電池', { s: 14, c: C.sub }) +
      pill(96, 232, '通路', { s: 14, bg: '#eefaf3', bd: C.mint, c: C.leafD, w: 84 }));
  };
  S.circuit2 = function () {
    return svg(circuitBase({ broken: true, lit: false }) +
      T(120, 216, '電池', { s: 14, c: C.sub }) + T(392, 186, '燈泡不亮', { s: 15, c: C.redD }) +
      T(258, 202, '電流過不去', { s: 14, c: C.sub }) +
      pill(96, 232, '斷路', { s: 14, bg: '#fff1f4', bd: C.red, c: C.redD, w: 84 }));
  };
  S.circuit3 = function () {
    return svg(battery(250, 120, { s: 1.5 }) +
      arrow(160, 60, 208, 96, { c: C.pink, m: 'saArrR' }) + T(132, 50, '正極 ＋', { s: 15, c: C.pink }) +
      arrow(354, 60, 306, 96, { c: C.pur, m: 'saArrP' }) + T(392, 50, '負極 －', { s: 15, c: C.pur }) +
      T(250, 208, '方向接對，電流才會流動', { s: 15, c: C.sub }) +
      '<g class="saFlow"><path d="M120 172 H380" stroke="#ffd24a" stroke-width="5" fill="none" stroke-linecap="round"/></g>' +
      arrow(120, 172, 118, 172, { c: C.sunD, m: 'saArrR', w: 0.1 }));
  };
  S.circuit4 = function () {
    return svg(
      panel(20, 40, 232, 196, { bg: '#eefaf3', bd: C.mint }) + T(136, 68, '導體', { s: 16, c: C.leafD }) +
      key(96, 118, { s: 1.1 }) + nail(180, 116, { s: 0.95, rot: 90 }) +
      T(136, 168, '鐵、銅等金屬', { s: 14, c: C.sub }) + bulb(136, 202, { s: 0.42, on: true }) + tick(216, 60, true) +
      panel(268, 40, 232, 196, { bg: '#fff1f4', bd: C.red }) + T(384, 68, '絕緣體', { s: 16, c: C.redD }) +
      ruler(344, 118, { s: 1.0, rot: -8 }) + woodBlock(452, 112, { s: 0.8 }) +
      T(384, 168, '塑膠、木頭、橡皮', { s: 14, c: C.sub }) + bulb(384, 202, { s: 0.42, on: false }) + tick(464, 60, false));
  };
  S.circuit5 = function () {
    return svg(circuitBase({ flow: true, lit: true, sw: true }) +
      T(120, 216, '電池', { s: 14, c: C.sub }) +
      pill(140, 232, '關上 → 燈亮', { s: 13, bg: '#eefaf3', bd: C.mint, c: C.leafD, w: 150 }) +
      pill(360, 232, '打開 → 燈熄', { s: 13, bg: '#fff1f4', bd: C.red, c: C.redD, w: 150 }) +
      switchBox(430, 208, { s: 0.7, on: false }));
  };
  S.circuit6 = function () {
    return svg(socket(126, 118, { s: 1.1 }) +
      drop(196, 92, { s: 0.7, cls: 'saDrop' }) + drop(176, 150, { s: 0.6, cls: 'saDrop' }) +
      tick(190, 118, false) +
      warning(300, 116, { s: 0.9 }) +
      panel(356, 62, 144, 116, { bg: '#fffaea', bd: C.sun }) +
      T(428, 96, '濕手不碰', { s: 15 }) + T(428, 122, '不插東西', { s: 15 }) + T(428, 152, '水會導電！', { s: 14, c: C.redD }) +
      T(126, 196, '插座很危險', { s: 14, c: C.sub }) +
      pill(260, 226, '通路亮、斷路熄・安全第一', { s: 13, w: 250 }));
  };

  /* ---------- 小圖示（單元卡、翻牌卡、題目附圖） ---------- */
  function fit(inner, sc) {
    return '<g transform="translate(36,36) scale(' + (sc || 1) + ')">' + inner + '</g>';
  }
  function icoSvg(inner, px) {
    ensureDefs();
    var s = px ? ' width="' + px + '" height="' + px + '"' : ' width="100%" height="100%"';
    return '<svg viewBox="0 0 72 72"' + s + ' style="display:block;overflow:visible" xmlns="http://www.w3.org/2000/svg">' + inner + '</svg>';
  }

  var leafIcon = '<path d="M-4 22 C-30 8 -28 -22 4 -26 C14 4 6 18 -4 22 Z" fill="url(#saLeafG)"/><path d="M-2 20 C0 4 2 -10 4 -24" stroke="' + C.leafD + '" stroke-width="2.6" fill="none"/><path d="M-4 22 C-12 24 -18 26 -22 28" stroke="' + C.leafD + '" stroke-width="3" fill="none" stroke-linecap="round"/>';
  var flowerIcon = '<circle cx="0" cy="-19" r="13" fill="' + C.pink + '"/><circle cx="18" cy="-6" r="13" fill="#ff9ec9"/><circle cx="11" cy="15" r="13" fill="' + C.pink + '"/><circle cx="-11" cy="15" r="13" fill="#ff9ec9"/><circle cx="-18" cy="-6" r="13" fill="' + C.pink + '"/><circle r="10" fill="' + C.sun + '"/>';
  var fruitIcon = '<circle cy="4" r="24" fill="#ef5a5a"/><ellipse cx="-8" cy="-6" rx="7" ry="5" fill="#fff" opacity=".35"/><rect x="-2.5" y="-30" width="5" height="14" rx="2.5" fill="#8d5a2e"/><path d="M2 -24 q6 -12 18 -14 q-4 13 -18 14" fill="' + C.leafD + '"/>';
  var rootIcon = '<path d="M0 -22 c-4 18 -14 24 -20 34 M0 -22 c4 20 14 24 20 34 M0 -22 c0 22 -2 30 -1 36" fill="none" stroke="#b9834e" stroke-width="6" stroke-linecap="round"/><rect x="-6" y="-32" width="12" height="14" rx="5" fill="url(#saLeafG)"/>';
  var waveIcon = '<path d="M-28 6 q10 -12 20 0 q10 12 20 0 q10 -12 16 -4" fill="none" stroke="' + C.waterD + '" stroke-width="6" stroke-linecap="round"/><path d="M-28 20 q10 -12 20 0 q10 12 20 0 q10 -12 16 -4" fill="none" stroke="' + C.water + '" stroke-width="6" stroke-linecap="round"/>';
  var snowIcon = '<g stroke="' + C.blue + '" stroke-width="5" stroke-linecap="round"><path d="M0 -24 V24 M-21 -12 L21 12 M-21 12 L21 -12"/></g><g stroke="' + C.blue + '" stroke-width="4" stroke-linecap="round"><path d="M0 -16 l-7 -7 M0 -16 l7 -7 M0 16 l-7 7 M0 16 l7 7"/></g>';
  var shadowIcon = '<rect x="-26" y="12" width="52" height="12" rx="6" fill="#efecfa"/><rect x="-16" y="-24" width="18" height="38" rx="5" fill="' + C.pur + '"/><path d="M2 14 L28 10 L28 24 L2 24 Z" fill="' + C.ink + '" opacity=".45"/>';
  var arrowIcon = '<path d="M-22 0 H14" stroke="' + C.pur + '" stroke-width="7" stroke-linecap="round"/><path d="M8 -14 L26 0 L8 14 Z" fill="' + C.pur + '"/>';
  var upIcon = '<g transform="rotate(-90)">' + arrowIcon + '</g>';
  var plusIcon = '<circle r="24" fill="#ffeaf3"/><path d="M-12 0 H12 M0 -12 V12" stroke="' + C.pink + '" stroke-width="7" stroke-linecap="round"/>';
  var minusIcon = '<circle r="24" fill="#f1edff"/><path d="M-12 0 H12" stroke="' + C.pur + '" stroke-width="7" stroke-linecap="round"/>';
  var spoonIcon = '<g transform="rotate(-25)"><ellipse cx="0" cy="-14" rx="11" ry="15" fill="url(#saSteelG)"/><rect x="-3.5" y="-2" width="7" height="30" rx="3.5" fill="url(#saSteelG)"/></g>';
  var scissorIcon = '<g><path d="M-10 20 L8 -18" stroke="url(#saSteelG)" stroke-width="7" stroke-linecap="round"/><path d="M10 20 L-8 -18" stroke="' + C.steel + '" stroke-width="7" stroke-linecap="round"/><circle cx="-12" cy="24" r="7" fill="none" stroke="' + C.pur + '" stroke-width="4"/><circle cx="12" cy="24" r="7" fill="none" stroke="' + C.pur + '" stroke-width="4"/></g>';
  var eraserIcon = '<g transform="rotate(-12)"><rect x="-24" y="-14" width="48" height="28" rx="6" fill="#ffd9e4"/><rect x="-24" y="-14" width="20" height="28" rx="6" fill="#fff3f7"/><rect x="-24" y="-14" width="48" height="28" rx="6" fill="none" stroke="#e9a9bf" stroke-width="2.5"/></g>';
  var beadIcon = '<circle r="22" fill="#dff0fb" stroke="#a9d3ea" stroke-width="3"/><ellipse cx="-7" cy="-8" rx="7" ry="5" fill="#fff" opacity=".9"/>';
  var fireflyIcon = '<circle cy="4" r="16" fill="#fff6c9" opacity=".55" class="saGlow"/><ellipse cx="0" cy="6" rx="8" ry="11" fill="#5b4bb8"/><circle cx="0" cy="14" r="6" fill="' + C.sun + '"/><path d="M-6 -2 q-16 -12 -20 2 q12 6 20 0 M6 -2 q16 -12 20 2 q-12 6 -20 0" fill="#e8eeff" opacity=".85"/>';
  var candleIcon = '<rect x="-11" y="-4" width="22" height="30" rx="5" fill="#ffeaf3"/><rect x="-11" y="-4" width="8" height="30" rx="4" fill="#fff"/><path d="M0 -30 c9 10 7 22 0 22 c-7 0 -9 -12 0 -22 Z" fill="' + C.sun + '" class="saGlow"/>';
  var mirrorIcon = '<rect x="-18" y="-26" width="36" height="52" rx="14" fill="#dff0fb" stroke="' + C.steelD + '" stroke-width="4"/><path d="M-8 16 L8 -14" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".9"/>';
  var wiltIcon = '<path d="M0 26 V-10 c0 -12 10 -16 16 -10" fill="none" stroke="#a58a5c" stroke-width="6" stroke-linecap="round"/><path d="M14 -20 C30 -12 26 6 12 2 C10 -8 12 -16 14 -20 Z" fill="#c9b06a"/><path d="M-2 4 C-18 12 -22 -4 -8 -8 C-6 0 -4 2 -2 4 Z" fill="#bda86a"/>';
  var stalkIcon = '<rect x="-5" y="-26" width="10" height="52" rx="5" fill="url(#saLeafG)"/><path d="M-4 -6 C-20 -14 -22 -26 -8 -24 C-6 -16 -5 -10 -4 -6 Z" fill="' + C.leaf + '"/><path d="M4 -16 C20 -24 24 -36 10 -34 C7 -26 5 -20 4 -16 Z" fill="' + C.leaf + '"/>';
  var coilIcon = '<path d="M-26 10 c0 -18 12 -18 12 0 c0 18 12 18 12 0 c0 -18 12 -18 12 0" fill="none" stroke="#e0663f" stroke-width="6" stroke-linecap="round"/>';
  var rainIcon = '<g transform="translate(0,-10)">' + cloud(0, 0, { s: 0.62, dark: true }) + '</g>' + drop(-14, 20, { s: 0.55, cls: 'saDrop' }) + drop(2, 24, { s: 0.5, cls: 'saDrop' }) + drop(17, 19, { s: 0.55, cls: 'saDrop' });
  var cardsIcon = '<g transform="rotate(-12)"><rect x="-22" y="-26" width="34" height="48" rx="7" fill="#fff" stroke="' + C.pur + '" stroke-width="3"/></g><g transform="rotate(10) translate(6,2)"><rect x="-14" y="-26" width="34" height="48" rx="7" fill="#f3f0ff" stroke="' + C.pur + '" stroke-width="3"/><circle cx="3" cy="-2" r="9" fill="' + C.pink + '"/></g>';
  var potIcon = '<path d="M-18 4 H18 L13 26 H-13 Z" fill="' + C.wood + '"/><rect x="-21" y="-2" width="42" height="9" rx="4" fill="' + C.woodD + '"/>' + '<g transform="translate(0,-2)">' + stalkIcon + '</g>';

  var earthIcon = '<circle r="24" fill="#4aa8e0"/><path d="M-22 -6 q8 -8 16 -2 q8 6 14 -2 q4 -6 8 -2" fill="none" stroke="#3f9c5c" stroke-width="7" stroke-linecap="round"/><path d="M-16 12 q10 -6 18 0 q8 5 14 -2" fill="none" stroke="#3f9c5c" stroke-width="6" stroke-linecap="round"/><circle r="24" fill="none" stroke="#2f86bd" stroke-width="3"/>';
  var dayIcon = '<circle r="24" fill="#fff3cf"/><circle r="24" fill="none" stroke="' + C.sun + '" stroke-width="3"/><g transform="translate(0,2) scale(.62)">' + sun(0, 0, { r: 17, cls: 'saPulse' }) + '</g>';
  var nightIcon = '<circle r="24" fill="#3b3570"/><g transform="translate(4,2) scale(.72)">' + moon(0, 0, { r: 15 }) + '</g><circle cx="-13" cy="-11" r="2.6" fill="#fff" class="saGlow"/><circle cx="-7" cy="6" r="2" fill="#fff" class="saGlow"/><circle cx="-15" cy="4" r="1.6" fill="#fff"/>';
  var rabbitIcon = '<ellipse cx="-6" cy="-16" rx="5" ry="14" fill="#f4f0fb" stroke="#d9d4ec" stroke-width="2"/><ellipse cx="7" cy="-15" rx="5" ry="13" fill="#f4f0fb" stroke="#d9d4ec" stroke-width="2"/><circle cx="0" cy="6" r="16" fill="#fbf8ff" stroke="#d9d4ec" stroke-width="2"/><circle cx="-6" cy="3" r="2.4" fill="' + C.ink + '"/><circle cx="6" cy="3" r="2.4" fill="' + C.ink + '"/><path d="M0 9 l-4 3 h8 z" fill="' + C.pink + '"/>';
  var dogIcon = '<path d="M-18 -12 q-6 -14 4 -12 l6 4 z" fill="#c98b52"/><path d="M18 -12 q6 -14 -4 -12 l-6 4 z" fill="#c98b52"/><circle cx="0" cy="2" r="17" fill="#e0a86a"/><circle cx="-6" cy="-2" r="2.6" fill="' + C.ink + '"/><circle cx="6" cy="-2" r="2.6" fill="' + C.ink + '"/><ellipse cx="0" cy="9" rx="7" ry="5" fill="#fdf3e6"/><ellipse cx="0" cy="7" rx="3.4" ry="2.6" fill="' + C.ink + '"/>';
  var fishIcon = '<path d="M-22 0 l-10 -9 v18 z" fill="#f5a04a"/><ellipse cx="2" cy="0" rx="22" ry="14" fill="#ffb765"/><path d="M0 -14 q6 -10 10 -2" fill="#f5a04a"/><circle cx="12" cy="-3" r="2.8" fill="' + C.ink + '"/><path d="M-6 0 q6 -6 12 0 q-6 6 -12 0" fill="#f5a04a" opacity=".5"/>';
  var birdIcon = '<ellipse cx="-2" cy="4" rx="17" ry="13" fill="#7cc2ea"/><circle cx="12" cy="-8" r="9" fill="#9ad2f2"/><path d="M20 -8 l9 3 l-9 3 z" fill="' + C.sun + '"/><circle cx="14" cy="-10" r="2.2" fill="' + C.ink + '"/><path d="M-6 2 q10 -8 16 4 q-10 6 -16 -4" fill="#5aa8d8"/><path d="M-18 8 l-10 8 l8 -1 z" fill="#5aa8d8"/>';
  var eagleIcon = '<ellipse cx="-2" cy="4" rx="17" ry="13" fill="#8d6a4f"/><circle cx="12" cy="-9" r="9" fill="#e6ddd0"/><path d="M20 -9 q8 1 6 6 q-4 -2 -6 -1 z" fill="' + C.sunD + '"/><circle cx="13" cy="-11" r="2.2" fill="' + C.ink + '"/><path d="M-24 -6 q12 -10 22 6 q-14 8 -22 -6" fill="#6f5137"/><path d="M-6 16 l3 8 M4 16 l3 8" stroke="' + C.sunD + '" stroke-width="3" stroke-linecap="round"/>';
  var butterflyIcon = '<ellipse cx="-11" cy="-8" rx="11" ry="13" fill="' + C.pur + '" transform="rotate(-18,-11,-8)"/><ellipse cx="11" cy="-8" rx="11" ry="13" fill="#9d86ff" transform="rotate(18,11,-8)"/><ellipse cx="-9" cy="10" rx="9" ry="10" fill="#c0aeff"/><ellipse cx="9" cy="10" rx="9" ry="10" fill="#b09bff"/><rect x="-2" y="-14" width="4" height="30" rx="2" fill="' + C.ink + '"/><path d="M-2 -14 q-6 -8 -10 -10 M2 -14 q6 -8 10 -10" stroke="' + C.ink + '" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
  var caterpillarIcon = '<circle cx="-16" cy="6" r="9" fill="#8fd47a"/><circle cx="-2" cy="2" r="10" fill="#7cc966"/><circle cx="13" cy="-2" r="11" fill="#6dbe58"/><circle cx="17" cy="-6" r="2.4" fill="' + C.ink + '"/><path d="M14 -13 q2 -8 8 -10 M20 -12 q4 -7 10 -7" stroke="#4f9c3f" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
  var frogIcon = '<ellipse cx="0" cy="6" rx="20" ry="15" fill="#6dbe58"/><circle cx="-11" cy="-9" r="8" fill="#7cc966"/><circle cx="11" cy="-9" r="8" fill="#7cc966"/><circle cx="-11" cy="-9" r="3.4" fill="' + C.ink + '"/><circle cx="11" cy="-9" r="3.4" fill="' + C.ink + '"/><path d="M-9 10 q9 7 18 0" stroke="#3f8c34" stroke-width="3" fill="none" stroke-linecap="round"/>';
  var snakeIcon = '<path d="M-22 16 q10 -10 0 -16 q-10 -8 4 -14 q12 -6 20 2" fill="none" stroke="#8fc95f" stroke-width="9" stroke-linecap="round"/><circle cx="16" cy="-12" r="7" fill="#7cb84c"/><circle cx="19" cy="-14" r="2" fill="' + C.ink + '"/><path d="M22 -10 l8 3" stroke="' + C.red + '" stroke-width="2.4" stroke-linecap="round"/>';
  var grassIcon = '<path d="M0 22 q-4 -18 -14 -26 M0 22 q0 -20 2 -30 M0 22 q6 -16 16 -24" fill="none" stroke="#5cb352" stroke-width="6" stroke-linecap="round"/><ellipse cx="0" cy="24" rx="20" ry="5" fill="#c8a077" opacity=".5"/>';
  var mindmapIcon = '<circle cx="0" cy="-2" r="11" fill="' + C.pur + '"/><circle cx="-22" cy="16" r="8" fill="#9ad2f2"/><circle cx="22" cy="16" r="8" fill="' + C.pink + '"/><circle cx="0" cy="-24" r="7" fill="' + C.mint + '"/><path d="M-6 6 L-18 11 M6 6 L18 11 M0 -13 V-17" stroke="' + C.pur + '" stroke-width="3" stroke-linecap="round"/>';

  var dissolveIcon = '<path d="M-19 -20 H19 L15 22 H-15 Z" fill="' + C.glass + '" stroke="#b9d9ea" stroke-width="3"/><path d="M-16.5 -8 H16.5 L15 22 H-15 Z" fill="url(#saWaterG)" opacity=".85"/><ellipse cx="0" cy="-8" rx="16.5" ry="4" fill="#a8e6f8"/><rect x="-9" y="-2" width="10" height="10" rx="2" fill="#fff" opacity=".95" transform="rotate(-12,-4,3)"/><circle cx="6" cy="8" r="2.6" fill="#fff" opacity=".9"/><circle cx="-2" cy="14" r="2" fill="#fff" opacity=".8"/><circle cx="9" cy="16" r="1.6" fill="#fff" opacity=".7"/>';
  var windIcon = '<path d="M-24 -8 h26 a7 7 0 1 0 -6 -12" fill="none" stroke="#7cc2ea" stroke-width="5.5" stroke-linecap="round"/><path d="M-20 4 h30 a7 7 0 1 1 -6 12" fill="none" stroke="#9ad2f2" stroke-width="5.5" stroke-linecap="round"/><path d="M-16 16 h18" fill="none" stroke="#bfe3f2" stroke-width="5" stroke-linecap="round"/>';
  var starsIcon = '<circle r="24" fill="#3b3570"/><path d="M-4 -14 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 z" fill="#ffe28a"/><circle cx="11" cy="-8" r="2.6" fill="#fff"/><circle cx="6" cy="10" r="2.2" fill="#fff" class="saGlow"/><circle cx="-12" cy="9" r="1.8" fill="#fff"/><circle cx="14" cy="6" r="1.5" fill="#fff"/>';
  var forceIcon = '<circle cx="-9" cy="6" r="13" fill="' + C.pink + '"/><ellipse cx="-9" cy="22" rx="13" ry="4" fill="' + C.ink + '" opacity=".12"/><path d="M6 -2 H24" stroke="' + C.pur + '" stroke-width="6" stroke-linecap="round"/><path d="M19 -11 L30 -2 L19 7 Z" fill="' + C.pur + '"/>';
  var thermoIcon = '<rect x="-6" y="-24" width="12" height="34" rx="6" fill="#fff" stroke="' + C.steelD + '" stroke-width="2.5"/><circle cx="0" cy="14" r="10" fill="' + C.red + '"/><rect x="-2.5" y="-8" width="5" height="24" rx="2.5" fill="' + C.red + '"/><path d="M9 -16 h6 M9 -8 h6 M9 0 h6" stroke="' + C.steelD + '" stroke-width="2.4" stroke-linecap="round"/>';
  var leverIcon = '<path d="M-24 10 L24 -6" stroke="' + C.wood + '" stroke-width="7" stroke-linecap="round"/><path d="M0 4 L-9 22 H9 Z" fill="' + C.steelD + '"/><circle cx="-22" cy="4" r="8" fill="' + C.pur + '"/><rect x="16" y="-16" width="14" height="9" rx="3" fill="' + C.mint + '"/>';
  var mountainIcon = '<path d="M-26 18 L-8 -12 L4 6 L12 -6 L26 18 Z" fill="#8d9db5"/><path d="M-8 -12 L-2 -2 H-14 Z" fill="#fff"/><path d="M-26 18 q12 6 26 0 q12 -6 26 0 v6 H-26 z" fill="#6dbe58"/>';
  var weatherIcon = '<g transform="translate(9,-8) scale(.7)">' + sun(0, 0, { r: 15, cls: 'saPulse' }) + '</g><g transform="translate(-5,6) scale(.62)">' + cloud(0, 0, { s: 1 }) + '</g>' + drop(-12, 20, { s: 0.4, cls: 'saDrop' }) + drop(4, 22, { s: 0.36, cls: 'saDrop' });
  var rustIcon = '<g transform="rotate(-20)"><path d="M-4 -16 H4 L2.5 18 L0 24 L-2.5 18 Z" fill="url(#saSteelG)"/><ellipse cx="0" cy="-17" rx="13" ry="5" fill="url(#saSteelG)"/></g><circle cx="6" cy="2" r="5" fill="#c96b2a" opacity=".85"/><circle cx="-4" cy="12" r="4" fill="#a75a22" opacity=".8"/><circle cx="10" cy="-10" r="3.4" fill="#c96b2a" opacity=".75"/>';
  var ecoIcon = '<rect x="-3" y="2" width="6" height="20" rx="3" fill="#a5764a"/><circle cx="0" cy="-8" r="16" fill="' + C.leaf + '"/><circle cx="-10" cy="0" r="10" fill="' + C.leafD + '"/><circle cx="11" cy="-1" r="9" fill="#7fd899"/><ellipse cx="0" cy="23" rx="22" ry="5" fill="#c8a077" opacity=".55"/><circle cx="16" cy="16" r="5" fill="' + C.pink + '"/>';
  var ICONS = {
    '🧲': [magnet(-74, -26, { w: 148, h: 52 }), 0.44],
    '📎': [clip(0, 0, { s: 1 }), 1.5],
    '🔩': [nail(0, -4, { s: 1 }), 1.4],
    '🥄': [spoonIcon, 1.15],
    '✂️': [scissorIcon, 1.1],
    '🧽': [eraserIcon, 1.1],
    '📄': [paperSheet(0, 0, { s: 1 }), 1.1],
    '🪵': [woodBlock(0, -2, { s: 1 }), 1.05],
    '📏': [ruler(0, 0, { s: 1 }), 0.85],
    '🔮': [beadIcon, 1.1],
    '☁️': [cloud(0, 0, { s: 0.55 }), 1],
    '☀️': [sun(0, 0, { r: 17 }), 1],
    '🌞': [sun(0, 0, { r: 17 }), 1],
    '💡': [bulb(0, 4, { s: 0.72, on: true }), 1],
    '⚫': [bulb(0, 4, { s: 0.72, on: false }), 1],
    '✨': [fireflyIcon, 1.1],
    '🕯️': [candleIcon, 1],
    '🌙': [moon(0, 0, { r: 19 }), 1],
    '🪞': [mirrorIcon, 1],
    '💧': [drop(0, -2, { s: 1.5 }), 1],
    '💦': [drop(-9, -4, { s: 1 }) + drop(11, 6, { s: 0.75 }), 1],
    '🧊': [iceCube(0, -4, { s: 0.9 }), 1],
    '💨': [steam(0, 22, { s: 0.85 }), 1],
    '❄️': [snowIcon, 0.95],
    '🌱': [sprout(0, 20, { s: 1.15 }), 1],
    '🌿': [leafIcon, 1.1],
    '🍃': [leafIcon, 1.1],
    '🌸': [flowerIcon, 0.95],
    '🍎': [fruitIcon, 1],
    '🥕': [rootIcon, 1],
    '🌰': [seed(0, 0, { s: 1.5 }), 1],
    '🪴': [potIcon, 1],
    '🥀': [wiltIcon, 1.05],
    '🔋': [battery(0, 0, { s: 0.55 }), 1],
    '🔌': [socket(0, 0, { s: 0.72 }), 1],
    '⚠️': [warning(0, 2, { s: 0.72 }), 1],
    '⬛': [shadowIcon, 1.05],
    '🔦': [flashlight(6, 0, { s: 0.78 }), 1],
    '🧭': [compass(0, 0, { r: 27 }), 1],
    '➡️': [arrowIcon, 1],
    '⬆️': [upIcon, 1],
    '➕': [plusIcon, 1],
    '➖': [minusIcon, 1],
    '❌': [tick(0, 0, false), 1.5],
    '✅': [tick(0, 0, true), 1.5],
    '👕': [shirt(0, 0, { s: 0.72 }), 1],
    '🥤': [glassWater(0, 0, { s: 0.6, ice: true }), 1],
    '🌊': [waveIcon, 1.05],
    '🌧️': [rainIcon, 1],
    '🎋': [stalkIcon, 1],
    '🎚️': [switchBox(0, 0, { s: 1 }), 1],
    '🔑': [key(4, 0, { s: 1.2 }), 1],
    '🧍': [person(0, 28, { s: 0.62 }), 1],
    '➰': [coilIcon, 1],
    '🃏': [cardsIcon, 1],
    '🔬': [beadIcon, 1],
    'earth': [earthIcon, 1],
    'day': [dayIcon, 1],
    'night': [nightIcon, 1],
    'rabbit': [rabbitIcon, 1],
    'dog': [dogIcon, 1],
    'fish': [fishIcon, 1],
    'bird': [birdIcon, 1],
    'eagle': [eagleIcon, 1],
    'butterfly': [butterflyIcon, 1],
    'caterpillar': [caterpillarIcon, 1],
    'frog': [frogIcon, 1],
    'snake': [snakeIcon, 1],
    'grass': [grassIcon, 1],
    'mindmap': [mindmapIcon, 1],
    'dissolve': [dissolveIcon, 1],
    'wind': [windIcon, 1],
    'stars': [starsIcon, 1],
    'force': [forceIcon, 1],
    'thermo': [thermoIcon, 1],
    'lever': [leverIcon, 1],
    'mountain': [mountainIcon, 1],
    'weather': [weatherIcon, 1],
    'rust': [rustIcon, 1],
    'eco': [ecoIcon, 1]
  };

  var ICON_NAMES = {
    '🧲': '磁鐵', '📎': '迴紋針', '🔩': '鐵釘', '🥄': '鐵湯匙', '✂️': '鐵剪刀', '🧽': '橡皮擦', '📄': '紙張',
    '🪵': '木塊', '📏': '塑膠尺', '🔮': '玻璃珠', '☁️': '棉花', '☀️': '太陽', '🌞': '正午太陽', '💡': '亮的燈泡',
    '⚫': '不亮的燈泡', '✨': '螢火蟲', '🕯️': '燭火', '🌙': '月亮', '🪞': '鏡子', '💧': '水', '💦': '水珠',
    '🧊': '冰', '💨': '水蒸氣', '❄️': '遇冷', '🌱': '發芽', '🌿': '植物', '🍃': '葉', '🌸': '花', '🍎': '果實',
    '🥕': '根', '🌰': '種子', '🪴': '盆栽', '🥀': '枯萎', '🔋': '電池', '🔌': '插座', '⚠️': '注意安全',
    '⬛': '影子', '🔦': '手電筒', '🧭': '指北針', '➡️': '接著', '⬆️': '向上', '➕': '正極', '➖': '負極',
    '❌': '不可以', '✅': '正確', '🚫': '不通', '👕': '濕衣服', '🥤': '水杯', '🌊': '水面', '🌧️': '下雨',
    '🎋': '莖', '🎚️': '開關', '🔑': '鑰匙', '🧍': '人', '➰': '電線', '🃏': '記憶翻牌', '🔬': '自然',
    'earth': '地球', 'day': '白天', 'night': '黑夜', 'rabbit': '兔子', 'dog': '狗', 'fish': '魚', 'bird': '鳥',
    'eagle': '老鷹', 'butterfly': '蝴蝶', 'caterpillar': '毛蟲', 'frog': '青蛙', 'snake': '蛇', 'grass': '草',
    'mindmap': '心智圖', 'dissolve': '溶解', 'wind': '風', 'stars': '星空', 'force': '力', 'thermo': '溫度計',
    'lever': '槓桿', 'mountain': '地表', 'weather': '天氣', 'rust': '生鏽', 'eco': '生態'
  };

  function iconSvg(emojiKey, px) {
    var e = ICONS[emojiKey];
    if (!e) return '';
    return icoSvg(fit(e[0], e[1]), px);
  }

  function iconGroup(key, x, y, k) {
    var e = ICONS[key];
    if (!e) return '';
    return '<g transform="translate(' + x + ',' + y + ') scale(' + (e[1] * (k || 1)).toFixed(3) + ')">' + e[0] + '</g>';
  }

  function wrapLabel(text, per) {
    var out = [], line = '';
    for (var i = 0; i < text.length; i++) {
      line += text[i];
      if (line.length >= per) { out.push(line); line = ''; }
    }
    if (line) out.push(line);
    return out.slice(0, 2);
  }

  function labelBlock(x, y, text, o) {
    o = o || {};
    var lines = wrapLabel(String(text), o.per || 7), out = '';
    for (var i = 0; i < lines.length; i++) out += T(x, y + i * (o.lh || 17), lines[i], { s: o.s || 14, c: o.c || C.ink });
    return out;
  }

  function renderSpec(spec) {
    if (!spec) return '';
    ensureDefs();
    var inner = '';
    if (spec.k === 'flow' || spec.k === 'row') {
      var its = spec.items || [], n = its.length;
      var span = 460 / n, x0 = 30 + span / 2;
      for (var i = 0; i < n; i++) {
        var cx = x0 + i * span;
        inner += iconGroup(its[i].icon, cx, 108, Math.min(1.5, 1.7 - n * 0.08));
        inner += labelBlock(cx, 176, its[i].label, { s: 15, per: 6 });
        if (its[i].en) inner += T(cx, 214, its[i].en, { s: 11, c: C.sub });
        if (spec.k === 'flow' && i < n - 1) inner += arrow(cx + span / 2 - 22, 106, cx + span / 2 + 22, 106, { c: C.pur, w: 5 });
      }
      if (spec.cap) inner += pill(260, 20, spec.cap, { s: 13, w: Math.min(420, spec.cap.length * 15 + 26) });
    } else if (spec.k === 'cmp') {
      var sides = [spec.left, spec.right];
      for (var sI = 0; sI < 2; sI++) {
        var sd = sides[sI], px = sI === 0 ? 22 : 268, pw = 230;
        var mark = sd.ok === true ? 1 : sd.ok === false ? -1 : 0;
        var bg = mark === 1 ? '#eefaf3' : mark === -1 ? '#fff1f4' : '#f5f2ff';
        var bd = mark === 1 ? C.mint : mark === -1 ? C.red : '#b9a8ff';
        var fg = mark === 1 ? C.leafD : mark === -1 ? C.redD : C.pur;
        inner += panel(px, 48, pw, 190, { bg: bg, bd: bd });
        inner += T(px + pw / 2 - (mark ? 16 : 0), 78, sd.title, { s: 17, c: fg });
        if (mark) inner += tick(px + pw - 34, 72, mark === 1);
        var items = sd.items || [], m = items.length, sp = (pw - 30) / m;
        for (var j = 0; j < m; j++) {
          var ix = px + 15 + sp / 2 + j * sp;
          inner += iconGroup(items[j].icon, ix, 136, m > 2 ? 0.82 : 1.0);
          inner += labelBlock(ix, 192, items[j].label, { s: 13, per: 5, lh: 15, c: C.sub });
        }
      }
      if (spec.cap) inner += pill(260, 12, spec.cap, { s: 13, w: Math.min(420, spec.cap.length * 15 + 26) });
    } else if (spec.k === 'focus') {
      inner += iconGroup(spec.icon, 116, 132, spec.scale || 2.1);
      if (spec.label) inner += T(116, 226, spec.label, { s: 15, c: C.sub });
      inner += panel(238, 44, 258, 176);
      inner += T(367, 80, spec.title || '', { s: 18 });
      var lines = spec.lines || [];
      for (var q = 0; q < lines.length; q++) {
        inner += '<circle cx="264" cy="' + (112 + q * 38) + '" r="5" fill="' + C.pur + '"/>';
        inner += T(280, 117 + q * 38, lines[q], { s: 14, c: C.sub, a: 'start' });
      }
    }
    return svg(inner, { bg: spec.bg });
  }

  window.SCI_ART = {
    scenes: S,
    render: function (k) { return S[k] ? S[k]() : ''; },
    keys: Object.keys(S),
    icons: ICONS,
    icon: iconSvg,
    renderSpec: renderSpec,
    names: ICON_NAMES,
    name: function (k) { return ICON_NAMES[k] || ""; },
    hasIcon: function (k) { return !!ICONS[k]; }
  };
})();
