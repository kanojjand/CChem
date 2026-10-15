/*
 * CC Hexa logo.
 * Resting state: a benzene-ring hexagon with an aromatic circle inside.
 * From time to time the ring splits into the two letters of the CC Lab mark,
 * the circle collapses into the CC Lab star, and then everything folds back.
 *
 * Every shape is a polygon with the same vertex count in both states, so the
 * morph is a plain per-vertex interpolation with no path-morphing library.
 *
 * Usage:
 *   const logo = CCHexaLogo.mount(element, { interval: 45000 });
 *   logo.toggle(); logo.play(); logo.flash(); logo.destroy();
 */
(function (global) {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var VIEWBOX = '380 322 840 900';

  // Hexagon ring, drawn with the same roof slope and stroke weight as the CC Lab letters.
  var CX = 799, TOP = 346, BOTTOM = 1196;
  var HALF_W = 360;   // outer half-width
  var SLOPE = 0.83;   // roof slope of the CC Lab letters (about 40 degrees)
  var WEIGHT = 105;   // stroke weight of the letters
  var CY = (TOP + BOTTOM) / 2;

  var dv = WEIGHT * Math.sqrt(1 + SLOPE * SLOPE); // vertical offset of the inner roof
  var a = HALF_W - WEIGHT;                         // inner half-width
  var oSideTop = TOP + SLOPE * HALF_W;
  var oSideBot = BOTTOM - SLOPE * HALF_W;
  var iTop = TOP + dv;
  var iBot = BOTTOM - dv;
  var iSideTop = iTop + SLOPE * a;
  var iSideBot = iBot - SLOPE * a;

  // The ring is a "C" whose right-hand gap has zero height, so it shares its
  // vertex order with the big C of the CC Lab mark.
  var RING = [
    [CX, TOP], [CX + HALF_W, oSideTop], [CX + HALF_W, CY], [CX + a, CY],
    [CX + a, iSideTop], [CX, iTop], [CX - a, iSideTop], [CX - a, iSideBot],
    [CX, iBot], [CX + a, iSideBot], [CX + a, CY], [CX + HALF_W, CY],
    [CX + HALF_W, oSideBot], [CX, BOTTOM], [CX - HALF_W, oSideBot], [CX - HALF_W, oSideTop]
  ];

  // Big C of the CC Lab mark, traced from the original artwork.
  var BIG_C = [
    [972, 348], [1194, 540], [1194, 679], [1090, 679],
    [1090, 586], [970, 482], [698, 699], [698, 859],
    [937, 1061], [1090, 939], [1090, 854], [1194, 854],
    [1194, 988], [935, 1196], [590, 903], [590, 655]
  ];

  // Small C starts hidden inside the left half of the ring and peels off from it.
  var SPLIT = 39;
  var SMALL_IN_RING = [
    [CX - SPLIT, TOP + SLOPE * SPLIT], [CX, TOP], [CX, iTop], [CX - SPLIT, iTop + SLOPE * SPLIT],
    [CX - a, iSideTop], [CX - a, iSideBot], [CX - SPLIT, iBot - SLOPE * SPLIT], [CX, iBot],
    [CX, BOTTOM], [CX - SPLIT, BOTTOM - SLOPE * SPLIT], [CX - HALF_W, oSideBot], [CX - HALF_W, oSideTop]
  ];
  var SMALL_C = [
    [631, 346], [767, 462], [689, 528], [630, 481],
    [508, 582], [509, 964], [623, 1062], [675, 1023],
    [749, 1085], [621, 1196], [404, 1009], [404, 536]
  ];

  var STAR_AT = [943, 777];
  var STAR_PATH = 'M0 -125 L27 -27 L125 0 L27 27 L0 125 L-27 27 L-125 0 L-27 -27 Z';
  var CIRCLE_R = 150, CIRCLE_W = 46;

  var MORPH_MS = 950, HOLD_MS = 1700, FLASH_MS = 1100;

  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function ease(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function mix(p, q, t) { return p + (q - p) * t; }

  function pathAt(from, to, t) {
    var d = '';
    for (var i = 0; i < from.length; i++) {
      d += (i ? 'L' : 'M') + mix(from[i][0], to[i][0], t).toFixed(1) + ' ' + mix(from[i][1], to[i][1], t).toFixed(1);
    }
    return d + 'Z';
  }

  function el(name, attrs) {
    var node = document.createElementNS(SVG_NS, name);
    for (var k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  function prefersReducedMotion() {
    return !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function mount(container, options) {
    var opts = options || {};
    var interval = opts.interval == null ? 45000 : opts.interval;
    var label = opts.label || 'CC Hexa';

    var svg = el('svg', { viewBox: VIEWBOX, role: 'img', 'aria-label': label, fill: 'currentColor' });
    svg.style.display = 'block';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.overflow = 'visible';
    var small = el('path', {});
    var big = el('path', {});
    var circle = el('circle', { fill: 'none', stroke: 'currentColor' });
    var star = el('path', { d: STAR_PATH });
    svg.appendChild(small);
    svg.appendChild(big);
    svg.appendChild(circle);
    svg.appendChild(star);
    container.appendChild(svg);

    var state = 0;      // 0 = CC Hexa, 1 = CC Lab
    var raf = 0, timer = 0, busy = false, destroyed = false;

    // p: 0 = ring, 1 = CC Lab mark. flash: 0..1 star pulse inside the ring.
    function render(p, flash) {
      var t = ease(clamp01(p));
      big.setAttribute('d', pathAt(RING, BIG_C, t));
      small.setAttribute('d', pathAt(SMALL_IN_RING, SMALL_C, t));

      var c = 1 - ease(clamp01(p / 0.55));
      var f = flash || 0;
      var pulse = Math.sin(Math.PI * f);
      circle.setAttribute('cx', CX);
      circle.setAttribute('cy', CY);
      circle.setAttribute('r', (CIRCLE_R * c * (1 - 0.35 * pulse)).toFixed(1));
      circle.setAttribute('stroke-width', (CIRCLE_W * c * (1 - 0.6 * pulse)).toFixed(1));
      circle.style.opacity = c < 0.02 ? 0 : 1;

      var s = ease(clamp01((p - 0.4) / 0.6));
      var sx = mix(CX, STAR_AT[0], s), sy = mix(CY, STAR_AT[1], s);
      var scale = Math.max(s, 0.75 * pulse);
      var angle = (1 - s) * -90 + f * 90;
      star.setAttribute('transform', 'translate(' + sx.toFixed(1) + ' ' + sy.toFixed(1) + ') rotate(' + angle.toFixed(1) + ') scale(' + scale.toFixed(3) + ')');
      star.style.opacity = scale < 0.01 ? 0 : 1;
    }

    function animate(duration, step, done) {
      cancelAnimationFrame(raf);
      if (prefersReducedMotion() || duration <= 0) { step(1); if (done) done(); return; }
      var start = 0;
      function frame(now) {
        if (destroyed) return;
        if (!start) start = now;
        var k = clamp01((now - start) / duration);
        step(k);
        if (k < 1) raf = requestAnimationFrame(frame); else if (done) done();
      }
      raf = requestAnimationFrame(frame);
    }

    function morphTo(target, done) {
      var from = state;
      animate(MORPH_MS, function (k) { render(mix(from, target, k), 0); }, function () {
        state = target;
        if (done) done();
      });
    }

    // One full cycle: ring -> CC Lab -> hold -> ring.
    function play() {
      if (busy) return;
      busy = true;
      morphTo(1, function () {
        timer = setTimeout(function () {
          morphTo(0, function () { busy = false; });
        }, prefersReducedMotion() ? 2500 : HOLD_MS);
      });
    }

    // Star pulse inside the ring, used for "new discovery" moments.
    function flash() {
      if (busy || state !== 0 || prefersReducedMotion()) return;
      busy = true;
      animate(FLASH_MS, function (k) { render(0, k); }, function () { render(0, 0); busy = false; });
    }

    function toggle() {
      if (busy) return;
      busy = true;
      morphTo(state ? 0 : 1, function () { busy = false; });
    }

    var loop = 0;
    function startLoop(ms) {
      clearInterval(loop);
      interval = ms;
      if (ms > 0 && !prefersReducedMotion()) loop = setInterval(play, ms);
    }

    function destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      clearInterval(loop);
      svg.remove();
    }

    render(0, 0);
    startLoop(interval);
    return { play: play, toggle: toggle, flash: flash, setInterval: startLoop, destroy: destroy };
  }

  global.CCHexaLogo = {
    mount: mount,
    shapes: { RING: RING, BIG_C: BIG_C, SMALL_IN_RING: SMALL_IN_RING, SMALL_C: SMALL_C, STAR_PATH: STAR_PATH, STAR_AT: STAR_AT, CENTER: [CX, CY], CIRCLE_R: CIRCLE_R, CIRCLE_W: CIRCLE_W, VIEWBOX: VIEWBOX }
  };
})(window);
