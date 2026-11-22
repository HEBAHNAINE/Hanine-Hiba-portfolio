import * as THREE from "./vendor/three.module.js";

const startPipelineScene = () => {
  const section = document.querySelector(".section-pipeline");
  const stage = document.getElementById("pipeline-stage");
  const mount = document.getElementById("pipeline-canvas");
  const steps = Array.from(document.querySelectorAll(".pipeline-step"));
  if (!section || !stage || !mount || steps.length < 2) return;

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduceMotion = motionQuery.matches;

  let litIndex = -2;
  const setLitStep = (index) => {
    if (index === litIndex) return;
    litIndex = index;
    steps.forEach((step, stepIndex) => step.classList.toggle("is-lit", stepIndex === index));
  };

  const setAllLit = () => {
    litIndex = -1;
    steps.forEach((step) => step.classList.add("is-lit"));
  };

  const probe = document.createElement("canvas");
  const webgl = probe.getContext("webgl2") || probe.getContext("webgl");
  if (!webgl) {
    section.classList.add("pipeline-no-webgl");
    return;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
  } catch {
    section.classList.add("pipeline-no-webgl");
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  mount.appendChild(renderer.domElement);
  section.classList.add("pipeline-webgl-ready");

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -100, 100);
  camera.position.z = 10;

  const palette = [
    new THREE.Color(0x70263d),
    new THREE.Color(0xd9a5a9),
    new THREE.Color(0xb87965),
    new THREE.Color(0xe9d8d0),
    new THREE.Color(0x70263d),
  ];

  const render = () => renderer.render(scene, camera);

  const anchors = steps.map(() => new THREE.Vector2());
  const segmentLengths = [];
  let totalLength = 1;
  let spreadScale = 13;

  const linePositions = new Float32Array(steps.length * 3);
  const lineColors = new Float32Array(steps.length * 3);
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
  lineGeometry.setAttribute("color", new THREE.BufferAttribute(lineColors, 3));

  const line = new THREE.Line(
    lineGeometry,
    new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
  );
  const glowLine = new THREE.Line(
    lineGeometry,
    new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
  );
  line.frustumCulled = false;
  glowLine.frustumCulled = false;
  scene.add(glowLine);
  scene.add(line);

  const makeParticleTexture = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext("2d");
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.32, "rgba(255,255,255,0.85)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  };

  const particleCount = 78;
  const particlePositions = new Float32Array(particleCount * 3);
  const particleColors = new Float32Array(particleCount * 3);
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
  particleGeometry.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));

  const particleMaterial = new THREE.PointsMaterial({
    size: 11,
    map: makeParticleTexture(),
    vertexColors: true,
    transparent: true,
    opacity: 0,
    alphaTest: 0.02,
    depthWrite: false,
    sizeAttenuation: false,
  });
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  particles.frustumCulled = false;
  scene.add(particles);

  const particleStates = Array.from({ length: particleCount }, (_, index) => ({
    progress: (index / particleCount + Math.random() * 0.015) % 1,
    speed: 0.045 + Math.random() * 0.025,
    spread: (Math.random() - 0.5) * 2,
    phase: Math.random() * Math.PI * 2,
  }));

  const point = new THREE.Vector2();
  const normal = new THREE.Vector2();
  const color = new THREE.Color();

  const pointAt = (progress) => {
    const wrapped = ((progress % 1) + 1) % 1;
    const distance = wrapped * totalLength;
    let index = 0;
    while (index < segmentLengths.length - 1 && distance > segmentLengths[index]) index += 1;
    const startDistance = index === 0 ? 0 : segmentLengths[index - 1];
    const segmentLength = Math.max(1, segmentLengths[index] - startDistance);
    const local = (distance - startDistance) / segmentLength;
    const from = anchors[index];
    const to = anchors[index + 1];
    point.lerpVectors(from, to, local);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.hypot(dx, dy) || 1;
    normal.set(-dy / length, dx / length);
    return point;
  };

  const colorAt = (progress) => {
    const wrapped = ((progress % 1) + 1) % 1;
    const scaled = wrapped * (palette.length - 1);
    const index = Math.min(palette.length - 2, Math.floor(scaled));
    color.lerpColors(palette[index], palette[index + 1], scaled - index);
    return color;
  };

  const updateParticles = (delta, elapsed) => {
    particleGeometry.setDrawRange(0, particleCount);
    particleStates.forEach((state, index) => {
      state.progress = (state.progress + delta * state.speed) % 1;
      const position = pointAt(state.progress);
      const tone = colorAt(state.progress);
      const wobble = Math.sin(elapsed * 0.9 + state.phase) * 2.4;
      const spread = state.spread * spreadScale + wobble;
      particlePositions[index * 3] = position.x + normal.x * spread;
      particlePositions[index * 3 + 1] = position.y + normal.y * spread;
      particlePositions[index * 3 + 2] = 0;
      particleColors[index * 3] = tone.r;
      particleColors[index * 3 + 1] = tone.g;
      particleColors[index * 3 + 2] = tone.b;
    });
    particleGeometry.attributes.position.needsUpdate = true;
    particleGeometry.attributes.color.needsUpdate = true;
  };

  const measure = () => {
    const width = Math.max(1, stage.clientWidth);
    const height = Math.max(1, stage.clientHeight);
    const rect = stage.getBoundingClientRect();
    spreadScale = width < 700 ? 8 : 13;

    renderer.setSize(width, height, false);
    camera.left = -width / 2;
    camera.right = width / 2;
    camera.top = height / 2;
    camera.bottom = -height / 2;
    camera.updateProjectionMatrix();

    steps.forEach((step, index) => {
      const stepRect = step.getBoundingClientRect();
      const x = stepRect.left + stepRect.width / 2 - rect.left - rect.width / 2;
      const y = rect.top + rect.height / 2 - (stepRect.top + stepRect.height / 2);
      anchors[index].set(x, y);
    });

    segmentLengths.length = 0;
    totalLength = 0;
    for (let index = 0; index < steps.length - 1; index += 1) {
      totalLength += anchors[index].distanceTo(anchors[index + 1]);
      segmentLengths.push(totalLength);
    }
    totalLength = Math.max(1, totalLength);

    palette.forEach((tone, index) => {
      linePositions[index * 3] = anchors[index].x;
      linePositions[index * 3 + 1] = anchors[index].y;
      linePositions[index * 3 + 2] = 0;
      lineColors[index * 3] = tone.r;
      lineColors[index * 3 + 1] = tone.g;
      lineColors[index * 3 + 2] = tone.b;
    });
    lineGeometry.attributes.position.needsUpdate = true;
    lineGeometry.attributes.color.needsUpdate = true;
    render();
  };

  const updateScene = (delta, elapsed) => {
    const intro = Math.min(1, Math.max(0, elapsed) / 1.1);
    updateParticles(delta, elapsed);
    line.material.opacity = (0.34 + Math.sin(elapsed * 0.8) * 0.05) * intro;
    glowLine.material.opacity = 0.12 * intro;
    particleMaterial.opacity = 0.88 * intro;
    setLitStep(Math.floor(((elapsed / 5.5) % 1) * steps.length));
  };

  const renderStatic = () => {
    updateParticles(0, 1.2);
    line.material.opacity = 0.34;
    glowLine.material.opacity = 0.12;
    particleMaterial.opacity = 0.88;
    setAllLit();
    render();
  };

  const clock = new THREE.Clock();
  let frame = 0;
  let visible = true;
  let elapsed = 0;

  const animate = () => {
    frame = requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.05);
    elapsed += delta;
    updateScene(delta, elapsed);
    render();
  };

  const shouldAnimate = () => !reduceMotion && visible && !document.hidden;

  const start = () => {
    if (!shouldAnimate()) {
      renderStatic();
      return;
    }
    if (!frame) {
      clock.getDelta();
      frame = requestAnimationFrame(animate);
    }
  };

  const stop = () => {
    if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };

  measure();
  renderStatic();

  renderer.domElement.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    stop();
    section.classList.remove("pipeline-webgl-ready");
    section.classList.add("pipeline-no-webgl");
  });

  if ("ResizeObserver" in window) {
    new ResizeObserver(() => {
      measure();
      if (reduceMotion) renderStatic();
    }).observe(stage);
  } else {
    window.addEventListener("resize", measure, { passive: true });
  }

  document.fonts?.ready.then(() => {
    measure();
    if (reduceMotion) renderStatic();
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        if (visible) start();
        else stop();
      },
      { threshold: 0.08 }
    ).observe(section);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  motionQuery.addEventListener?.("change", (event) => {
    reduceMotion = event.matches;
    if (reduceMotion) {
      stop();
      renderStatic();
    } else {
      start();
    }
  });

  start();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startPipelineScene, { once: true });
} else {
  startPipelineScene();
}
