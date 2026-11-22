import * as THREE from "./vendor/three.module.js";

const startScene = () => {
  const hero = document.querySelector(".hero");
  const mount = document.getElementById("data-scene");
  if (!hero || !mount) return;

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduceMotion = motionQuery.matches;

  const supportCanvas = document.createElement("canvas");
  const webgl = supportCanvas.getContext("webgl2") || supportCanvas.getContext("webgl");
  if (!webgl) {
    hero.classList.add("no-webgl");
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
    hero.classList.add("no-webgl");
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xf8f1ec, 12, 22);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 11);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xe9d8d0, 2.4));

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.1);
  keyLight.position.set(-4, 6, 8);
  scene.add(keyLight);

  const emeraldLight = new THREE.PointLight(0xd9a5a9, 1.7, 18);
  emeraldLight.position.set(3, -2, 5);
  scene.add(emeraldLight);

  const forestLight = new THREE.PointLight(0x70263d, 1.1, 18);
  forestLight.position.set(-4, 2, 4);
  scene.add(forestLight);

  const root = new THREE.Group();
  scene.add(root);

  const database = new THREE.Group();
  root.add(database);

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xe9d8d0,
    transparent: true,
    opacity: 0.42,
    transmission: 0.35,
    roughness: 0.16,
    metalness: 0.18,
    clearcoat: 0.8,
    clearcoatRoughness: 0.18,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const metalMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x70263d,
    transparent: true,
    opacity: 0.76,
    roughness: 0.2,
    metalness: 0.55,
    clearcoat: 0.8,
    emissive: 0x2b0d17,
    emissiveIntensity: 0.16,
    side: THREE.DoubleSide,
  });

  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xb87965,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
  });

  const turquoiseRingMaterial = new THREE.MeshBasicMaterial({
    color: 0xd9a5a9,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(1.24, 1.24, 2.9, 56, 1, true),
    glassMaterial
  );
  database.add(body);

  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(0.86, 0.86, 2.55, 48, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xd9a5a9,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  database.add(core);

  [1.48, -1.48].forEach((y) => {
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(1.25, 1.25, 0.12, 56),
      metalMaterial
    );
    cap.position.y = y;
    database.add(cap);
  });

  [-0.95, -0.25, 0.45, 1.05].forEach((y, index) => {
    const layer = new THREE.Mesh(
      new THREE.TorusGeometry(1.25, 0.035, 10, 64),
      index % 2 === 0 ? ringMaterial : turquoiseRingMaterial
    );
    layer.rotation.x = Math.PI / 2;
    layer.position.y = y;
    database.add(layer);
  });

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(1.25, 0.055, 12, 64),
    ringMaterial
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 1.55;
  database.add(rim);

  const ribMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.35,
    roughness: 0.2,
    metalness: 0.1,
  });

  for (let index = 0; index < 14; index += 1) {
    const angle = (index / 14) * Math.PI * 2;
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.025, 2.65, 0.02), ribMaterial);
    rib.position.set(Math.cos(angle) * 1.27, 0, Math.sin(angle) * 1.27);
    rib.rotation.y = -angle;
    database.add(rib);
  }

  const rings = [];
  [
    { radius: 2.1, tube: 0.018, tilt: 0.18, material: ringMaterial },
    { radius: 2.65, tube: 0.014, tilt: -0.28, material: turquoiseRingMaterial },
    { radius: 3.15, tube: 0.012, tilt: 0.42, material: ringMaterial },
  ].forEach((config, index) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(config.radius, config.tube, 8, 90),
      config.material
    );
    ring.rotation.x = Math.PI / 2 + config.tilt;
    ring.rotation.z = index * 0.6;
    ring.userData.speed = index % 2 === 0 ? 0.12 : -0.09;
    root.add(ring);
    rings.push(ring);
  });

  const roundedRect = (context, x, y, width, height, radius) => {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + radius);
    context.lineTo(x + width, y + height - radius);
    context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    context.lineTo(x + radius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.closePath();
  };

  const makePanelTexture = (kind, title) => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 360;
    const context = canvas.getContext("2d");

    const backing = context.createLinearGradient(0, 0, 640, 360);
    backing.addColorStop(0, "rgba(255,250,248,0.94)");
    backing.addColorStop(1, "rgba(233,216,208,0.82)");
    roundedRect(context, 12, 12, 616, 336, 28);
    context.fillStyle = backing;
    context.fill();
    context.strokeStyle = "rgba(112,38,61,0.24)";
    context.lineWidth = 3;
    context.stroke();

    context.fillStyle = "#70263D";
    context.font = "700 26px Manrope, Arial, sans-serif";
    context.fillText(title, 42, 62);

    context.strokeStyle = "rgba(112,38,61,0.10)";
    context.lineWidth = 2;
    for (let y = 110; y <= 290; y += 45) {
      context.beginPath();
      context.moveTo(42, y);
      context.lineTo(598, y);
      context.stroke();
    }

    if (kind === "line") {
      const values = [252, 232, 244, 196, 208, 148, 164, 112, 138, 86];
      const points = values.map((value, index) => ({
        x: 48 + index * 60,
        y: value,
      }));
      const stroke = context.createLinearGradient(48, 0, 600, 0);
      stroke.addColorStop(0, "#70263D");
      stroke.addColorStop(1, "#D9A5A9");
      context.beginPath();
      points.forEach((point, index) => {
        if (index === 0) context.moveTo(point.x, point.y);
        else context.lineTo(point.x, point.y);
      });
      context.strokeStyle = stroke;
      context.lineWidth = 8;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.stroke();
      points.forEach((point) => {
        context.beginPath();
        context.arc(point.x, point.y, 7, 0, Math.PI * 2);
        context.fillStyle = "#FFFFFF";
        context.fill();
        context.strokeStyle = "#B87965";
        context.lineWidth = 4;
        context.stroke();
      });
    }

    if (kind === "bars") {
      const values = [0.42, 0.68, 0.5, 0.86, 0.62, 0.94, 0.74];
      values.forEach((value, index) => {
        const height = value * 180;
        const x = 58 + index * 76;
        const gradient = context.createLinearGradient(0, 300 - height, 0, 300);
        gradient.addColorStop(0, "#D9A5A9");
        gradient.addColorStop(1, "#70263D");
        roundedRect(context, x, 300 - height, 42, height, 10);
        context.fillStyle = gradient;
        context.fill();
      });
    }

    if (kind === "network") {
      const nodes = [
        [78, 250],
        [188, 132],
        [318, 218],
        [444, 112],
        [552, 238],
      ];
      context.strokeStyle = "rgba(112,38,61,0.45)";
      context.lineWidth = 4;
      [[0, 1], [1, 2], [2, 3], [3, 4], [1, 3]].forEach(([from, to]) => {
        context.beginPath();
        context.moveTo(nodes[from][0], nodes[from][1]);
        context.lineTo(nodes[to][0], nodes[to][1]);
        context.stroke();
      });
      nodes.forEach(([x, y], index) => {
        context.beginPath();
        context.arc(x, y, index === 3 ? 18 : 13, 0, Math.PI * 2);
        context.fillStyle = index % 2 === 0 ? "#B87965" : "#D9A5A9";
        context.fill();
        context.strokeStyle = "#FFFFFF";
        context.lineWidth = 5;
        context.stroke();
      });
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  };

  const panelConfigs = [
    { kind: "line", title: "DATA PIPELINE", position: [-3.1, 1.35, 1.35], rotation: -0.18 },
    { kind: "bars", title: "ANALYTICS", position: [3.15, 0.15, 0.7], rotation: 0.2 },
    { kind: "network", title: "GRAPH MODEL", position: [-2.55, -1.7, 2.1], rotation: -0.1 },
  ];

  const panels = panelConfigs.map((config, index) => {
    const material = new THREE.MeshBasicMaterial({
      map: makePanelTexture(config.kind, config.title),
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(2.35, 1.32), material);
    panel.position.set(...config.position);
    panel.rotation.y = config.rotation;
    panel.userData = {
      basePosition: panel.position.clone(),
      baseRotation: config.rotation,
      baseOpacity: 0.96,
      phase: index * 2.1,
      speed: 0.65 + index * 0.12,
    };
    root.add(panel);
    return panel;
  });

  const sphereMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.82,
    transmission: 0.3,
    roughness: 0.12,
    metalness: 0.08,
    clearcoat: 0.9,
  });

  const spheres = [
    [-2.1, 2.05, 1.5],
    [2.2, 1.95, 2.2],
    [3.4, -1.55, 1.1],
    [-3.5, -0.35, 0.6],
    [1.4, -2.2, 2.6],
  ].map((position, index) => {
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 18), sphereMaterial);
    sphere.position.set(...position);
    sphere.userData = {
      basePosition: sphere.position.clone(),
      phase: index * 1.4,
    };
    root.add(sphere);
    return sphere;
  });

  const cubeMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.46,
    transmission: 0.35,
    roughness: 0.1,
    metalness: 0.08,
    clearcoat: 0.8,
    side: THREE.DoubleSide,
  });

  const cubeEdgeMaterial = new THREE.LineBasicMaterial({
    color: 0x70263d,
    transparent: true,
    opacity: 0.45,
  });

  const cubes = [
    [-3.2, 0.45, 2.4],
    [2.55, -2.05, 2.6],
    [0.4, 2.4, 0.4],
  ].map((position, index) => {
    const geometry = new THREE.BoxGeometry(0.38, 0.38, 0.38);
    const cube = new THREE.Group();
    cube.add(new THREE.Mesh(geometry, cubeMaterial));
    cube.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry), cubeEdgeMaterial));
    cube.position.set(...position);
    cube.rotation.set(0.4, 0.5, 0.2);
    cube.userData = {
      basePosition: cube.position.clone(),
      phase: index * 2.3,
    };
    root.add(cube);
    return cube;
  });

  const connectionMaterial = () =>
    new THREE.LineBasicMaterial({
      color: 0xb87965,
      transparent: true,
      opacity: 0,
    });

  const connections = [
    { from: panels[0], to: database },
    { from: panels[1], to: database },
    { from: panels[2], to: database },
    { from: spheres[0], to: panels[0] },
    { from: spheres[2], to: panels[1] },
  ].map(({ from, to }, index) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
    const line = new THREE.Line(geometry, connectionMaterial());
    line.userData = { from, to, baseOpacity: index < 3 ? 0.36 : 0.24 };
    root.add(line);
    return line;
  });

  const particleCount = 110;
  const particlePositions = new Float32Array(particleCount * 3);
  for (let index = 0; index < particleCount; index += 1) {
    particlePositions[index * 3] = (Math.random() - 0.5) * 9;
    particlePositions[index * 3 + 1] = (Math.random() - 0.5) * 6.5;
    particlePositions[index * 3 + 2] = (Math.random() - 0.5) * 5;
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
  const particleMaterial = new THREE.PointsMaterial({
    color: 0xb87965,
    size: 0.045,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  root.add(particles);

  const cameraTarget = { x: 0, y: 0 };
  const cameraCurrent = { x: 0, y: 0 };
  let elapsed = 0;
  let frame = 0;
  let visible = true;

  const setAppear = (value) => {
    const eased = 1 - Math.pow(1 - Math.min(1, Math.max(0, value)), 3);
    panels.forEach((panel) => {
      panel.material.opacity = panel.userData.baseOpacity * eased;
    });
    connections.forEach((line) => {
      line.material.opacity = line.userData.baseOpacity * eased;
    });
    particleMaterial.opacity = 0.52 * eased;
    const scale = (window.innerWidth < 700 ? 0.86 : 1) * (0.94 + eased * 0.06);
    root.scale.setScalar(scale);
  };

  const updateConnections = () => {
    connections.forEach((line) => {
      const positions = line.geometry.attributes.position;
      positions.setXYZ(0, line.userData.from.position.x, line.userData.from.position.y, line.userData.from.position.z);
      positions.setXYZ(1, line.userData.to.position.x, line.userData.to.position.y, line.userData.to.position.z);
      positions.needsUpdate = true;
    });
  };

  const clock = new THREE.Clock();

  const render = () => renderer.render(scene, camera);

  const animate = () => {
    frame = requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.05);
    elapsed += delta;

    cameraCurrent.x += (cameraTarget.x - cameraCurrent.x) * 0.055;
    cameraCurrent.y += (cameraTarget.y - cameraCurrent.y) * 0.055;
    camera.position.x = cameraCurrent.x * 0.38;
    camera.position.y = -cameraCurrent.y * 0.28;
    camera.lookAt(0, 0, 0);
    root.rotation.y = cameraCurrent.x * 0.1;
    root.rotation.x = -cameraCurrent.y * 0.07;

    database.rotation.y += delta * 0.34;
    rings.forEach((ring) => {
      ring.rotation.z += delta * ring.userData.speed;
    });

    panels.forEach((panel) => {
      const { basePosition, baseRotation, phase, speed } = panel.userData;
      panel.position.y = basePosition.y + Math.sin(elapsed * speed + phase) * 0.13;
      panel.rotation.y = baseRotation + Math.sin(elapsed * 0.4 + phase) * 0.045;
      panel.rotation.z = Math.sin(elapsed * 0.5 + phase) * 0.018;
    });

    spheres.forEach((sphere) => {
      const { basePosition, phase } = sphere.userData;
      sphere.position.y = basePosition.y + Math.sin(elapsed * 0.8 + phase) * 0.18;
      sphere.position.x = basePosition.x + Math.cos(elapsed * 0.55 + phase) * 0.08;
    });

    cubes.forEach((cube) => {
      const { basePosition, phase } = cube.userData;
      cube.position.y = basePosition.y + Math.sin(elapsed * 0.7 + phase) * 0.16;
      cube.rotation.y += delta * 0.18;
      cube.rotation.x += delta * 0.09;
    });

    particles.rotation.y += delta * 0.035;
    particles.rotation.x = Math.sin(elapsed * 0.12) * 0.06;
    updateConnections();
    setAppear(elapsed / 1.4);
    render();
  };

  const shouldAnimate = () => !reduceMotion && visible && !document.hidden;

  const start = () => {
    if (!shouldAnimate()) {
      setAppear(1);
      updateConnections();
      render();
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

  const resize = () => {
    const width = Math.max(1, mount.clientWidth);
    const height = Math.max(1, mount.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.z = width < 700 ? 13 : 11;
    camera.updateProjectionMatrix();
    setAppear(reduceMotion ? 1 : elapsed / 1.4);
    render();
  };

  resize();
  updateConnections();
  render();
  hero.classList.add("webgl-ready");
  start();

  renderer.domElement.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    stop();
    hero.classList.remove("webgl-ready");
    hero.classList.add("no-webgl");
  });

  hero.addEventListener("pointermove", (event) => {
    if (reduceMotion) return;
    const rect = hero.getBoundingClientRect();
    cameraTarget.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    cameraTarget.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  });

  hero.addEventListener("pointerleave", () => {
    cameraTarget.x = 0;
    cameraTarget.y = 0;
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  if ("ResizeObserver" in window) {
    new ResizeObserver(resize).observe(mount);
  } else {
    window.addEventListener("resize", resize, { passive: true });
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        if (visible) start();
        else stop();
      },
      { threshold: 0.05 }
    ).observe(hero);
  }

  motionQuery.addEventListener?.("change", (event) => {
    reduceMotion = event.matches;
    if (reduceMotion) {
      stop();
      cameraTarget.x = 0;
      cameraTarget.y = 0;
      cameraCurrent.x = 0;
      cameraCurrent.y = 0;
      camera.position.x = 0;
      camera.position.y = 0;
      camera.lookAt(0, 0, 0);
      root.rotation.set(0, 0, 0);
      setAppear(1);
      updateConnections();
      render();
    } else {
      start();
    }
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startScene, { once: true });
} else {
  startScene();
}
