/* =====================================================================
   Noble Billing — Hero 3D "revenue network"
   A drifting field of connected nodes. The scroll choreography can fly
   the camera through it (setDepth). Degrades to CSS gradient if WebGL /
   Three.js is unavailable or the user prefers reduced motion.
   ===================================================================== */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canvas = document.getElementById("heroCanvas");

  // Public API (safe no-ops until initialised)
  window.NobleHero = { setDepth: function () {}, setParallax: function () {}, ok: false };

  if (!canvas || reduce || typeof THREE === "undefined") return;

  var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  if (!gl) return;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(60, 1, 0.1, 400);
  var baseZ = 62;
  camera.position.set(0, 0, baseZ);

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

  var group = new THREE.Group();
  scene.add(group);

  /* ---- Node cloud ---- */
  var COUNT = 130;
  var nodes = [];
  var positions = new Float32Array(COUNT * 3);
  var colors = new Float32Array(COUNT * 3);
  var cA = new THREE.Color(0x2fae76); // emerald
  var cB = new THREE.Color(0xdff7ea); // pale mint
  var cC = new THREE.Color(0xe6d3a3); // faint gold

  for (var i = 0; i < COUNT; i++) {
    // clustered ellipsoid cloud
    var r = 18 + Math.pow(Math.random(), 0.7) * 30;
    var theta = Math.random() * Math.PI * 2;
    var phi = Math.acos(2 * Math.random() - 1);
    var x = r * Math.sin(phi) * Math.cos(theta) * 1.35;
    var y = r * Math.sin(phi) * Math.sin(theta) * 0.85;
    var z = r * Math.cos(phi) * 0.9;
    positions[i * 3] = x; positions[i * 3 + 1] = y; positions[i * 3 + 2] = z;
    nodes.push(new THREE.Vector3(x, y, z));

    var pick = Math.random();
    var col = pick > 0.9 ? cC : (pick > 0.5 ? cA : cB);
    colors[i * 3] = col.r; colors[i * 3 + 1] = col.g; colors[i * 3 + 2] = col.b;
  }

  var pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  pGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  // soft round sprite
  var sprite = (function () {
    var c = document.createElement("canvas"); c.width = c.height = 64;
    var g = c.getContext("2d");
    var grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(0.35, "rgba(255,255,255,0.7)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();

  var pMat = new THREE.PointsMaterial({
    size: 1.7, map: sprite, vertexColors: true, transparent: true,
    opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true
  });
  group.add(new THREE.Points(pGeo, pMat));

  /* ---- Connecting lines (precomputed near-neighbours) ---- */
  var segPos = [];
  var maxDist = 15, maxSeg = 240, seg = 0;
  for (var a = 0; a < COUNT && seg < maxSeg; a++) {
    for (var b = a + 1; b < COUNT && seg < maxSeg; b++) {
      if (nodes[a].distanceTo(nodes[b]) < maxDist) {
        segPos.push(nodes[a].x, nodes[a].y, nodes[a].z, nodes[b].x, nodes[b].y, nodes[b].z);
        seg++;
      }
    }
  }
  var lGeo = new THREE.BufferGeometry();
  lGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(segPos), 3));
  var lMat = new THREE.LineBasicMaterial({ color: 0x2fae76, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending });
  group.add(new THREE.LineSegments(lGeo, lMat));

  /* ---- State ---- */
  var depth = 0;          // 0..1 fly-through progress
  var targetPx = 0, targetPy = 0, px = 0, py = 0;

  window.NobleHero.ok = true;
  window.NobleHero.setDepth = function (p) { depth = Math.max(0, Math.min(1, p)); };
  window.NobleHero.setParallax = function (nx, ny) { targetPx = nx; targetPy = ny; };

  window.addEventListener("pointermove", function (e) {
    targetPx = (e.clientX / window.innerWidth - 0.5) * 2;
    targetPy = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  function resize() {
    var w = canvas.clientWidth || window.innerWidth;
    var h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  var t = 0, running = true;
  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);
    t += 0.0016;
    group.rotation.y = t;
    group.rotation.x = Math.sin(t * 0.6) * 0.12;

    px += (targetPx - px) * 0.04;
    py += (targetPy - py) * 0.04;

    // fly through the network as depth -> 1
    camera.position.z = baseZ - depth * 52;
    camera.position.x = px * 6;
    camera.position.y = -py * 5;
    camera.lookAt(0, 0, 0);

    // fade the lines as we plunge in
    lMat.opacity = 0.16 * (1 - depth * 0.7);
    pMat.opacity = 0.95 * (1 - depth * 0.25);

    renderer.render(scene, camera);
  }
  frame();

  // pause when tab hidden (perf)
  document.addEventListener("visibilitychange", function () {
    running = !document.hidden;
    if (running) frame();
  });
})();
