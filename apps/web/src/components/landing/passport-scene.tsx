'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@fondealo/ui';

type SceneState = 'loading' | 'ready' | 'fallback';

/**
 * The hero object (docs/brand/identity.md §9): the company passport as a lit
 * 3D body that separates into its layers (cover, identity, activity, financial
 * reputation), with its orbit, signals and the links that carry them to the
 * network. Colours come from the design tokens, so Night and Day both work.
 *
 * The pages are pictograms with no text and no figures, so the scene shows how
 * a passport is built without claiming anything about a company.
 *
 * Progressive by construction: the server renders the flat 3D badge as a
 * poster; three.js loads after first paint and only when WebGL works, the
 * device is not saving data and the stage is on screen. Reduced motion renders
 * one still, separated frame. Everything else gets a pause control.
 */
export function PassportScene({
  label,
  layerLabels,
  pauseLabel,
  playLabel,
  className,
}: {
  label: string;
  /** Identity, activity, financial reputation: shown beside the layers once they separate. */
  layerLabels: [string, string, string];
  pauseLabel: string;
  playLabel: string;
  className?: string;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const canvasHost = useRef<HTMLDivElement>(null);
  const tags = useRef<(HTMLSpanElement | null)[]>([]);
  const [state, setState] = useState<SceneState>('loading');
  const [reduced, setReduced] = useState(false);
  const [playing, setPlaying] = useState(true);
  const control = useRef<{ setPlaying: (on: boolean) => void } | null>(null);

  useEffect(() => {
    const host = canvasHost.current;
    const box = stage.current;
    if (!host || !box) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    setPlaying(!mq.matches);

    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    if (conn?.saveData || (memory !== undefined && memory <= 2)) {
      setState('fallback');
      return;
    }

    let disposed = false;
    let teardown: (() => void) | undefined;

    const boot = async () => {
      try {
        const [THREE, { RoomEnvironment }] = await Promise.all([
          import('three'),
          import('three/examples/jsm/environments/RoomEnvironment.js'),
        ]);
        if (disposed) return;

        const renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: 'low-power',
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        renderer.domElement.setAttribute('aria-hidden', 'true');
        renderer.domElement.className = 'h-full w-full';
        host.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
        const pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        scene.environmentIntensity = 0.4;

        // ---- colours: read from the active theme's tokens ----
        const css = getComputedStyle(document.documentElement);
        const raw = (name: string): [number, number, number] => {
          const [r = 0, g = 0, b = 0] = css.getPropertyValue(name).trim().split(/\s+/).map(Number);
          return [r, g, b];
        };
        const tone = (name: string) => {
          const [r, g, b] = raw(name);
          return new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);
        };
        const rgba = (name: string, a = 1) => {
          const [r, g, b] = raw(name);
          return `rgba(${r}, ${g}, ${b}, ${a})`;
        };

        const bodyMat = new THREE.MeshPhysicalMaterial({
          metalness: 0.2,
          roughness: 0.32,
          clearcoat: 1,
          clearcoatRoughness: 0.18,
        });
        const backMat = new THREE.MeshPhysicalMaterial({ metalness: 0.15, roughness: 0.5 });
        const pageMat = new THREE.MeshStandardMaterial({ metalness: 0.1, roughness: 0.55 });
        const barMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35 });
        const edgeMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.4 });
        const guideMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0 });
        const orbitMat = new THREE.MeshBasicMaterial();
        const orbitGlowMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.14 });
        const nodeMat = new THREE.MeshBasicMaterial();
        const nodeHaloMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.28 });
        const sealMat = new THREE.MeshBasicMaterial();
        const linkMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.22 });
        const beamMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.5 });
        const packetMat = new THREE.PointsMaterial({
          size: 0.13,
          sizeAttenuation: true,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        const signalMat = new THREE.MeshBasicMaterial();
        const bars: { geo: InstanceType<typeof THREE.BoxGeometry>; h: number }[] = [];

        // ---- pictogram pages, drawn on canvas from the tokens ----
        type Ctx = CanvasRenderingContext2D;
        const PW = 512;
        const PH = 728;
        // Not `roundRect`: older Safari and Firefox do not have it.
        const pill = (g: Ctx, x: number, y: number, w: number, h: number, r = h / 2) => {
          const k = Math.min(r, w / 2, h / 2);
          g.beginPath();
          g.moveTo(x + k, y);
          g.arcTo(x + w, y, x + w, y + h, k);
          g.arcTo(x + w, y + h, x, y + h, k);
          g.arcTo(x, y + h, x, y, k);
          g.arcTo(x, y, x + w, y, k);
          g.closePath();
        };
        const header = (g: Ctx) => {
          g.fillStyle = rgba('--orbit', 0.9);
          pill(g, 48, 48, 150, 14);
          g.fill();
          g.fillStyle = rgba('--orbit', 0.35);
          g.beginPath();
          g.arc(PW - 62, 55, 12, 0, Math.PI * 2);
          g.fill();
        };
        const lines = (g: Ctx, x: number, y: number, widths: number[], gap = 30, a = 0.45) => {
          widths.forEach((w, i) => {
            g.fillStyle = rgba(i === 0 ? '--brand-fill' : '--orbit', i === 0 ? 0.75 : a);
            pill(g, x, y + i * gap, w, 12);
            g.fill();
          });
        };
        const drawIdentity = (g: Ctx) => {
          g.clearRect(0, 0, PW, PH);
          header(g);
          g.fillStyle = rgba('--orbit', 0.12);
          g.strokeStyle = rgba('--orbit', 0.6);
          g.lineWidth = 3;
          pill(g, 48, 110, 176, 216, 20);
          g.fill();
          g.stroke();
          g.fillStyle = rgba('--orbit', 0.6);
          g.beginPath();
          g.arc(136, 188, 38, 0, Math.PI * 2);
          g.fill();
          g.beginPath();
          g.ellipse(136, 300, 62, 46, 0, Math.PI, 0);
          g.fill();
          lines(g, 256, 124, [190, 150, 200, 120, 170]);
          // Seal.
          g.strokeStyle = rgba('--brand-fill', 0.85);
          g.lineWidth = 5;
          g.setLineDash([10, 9]);
          g.beginPath();
          g.arc(384, 440, 58, 0, Math.PI * 2);
          g.stroke();
          g.setLineDash([]);
          g.lineWidth = 8;
          g.lineCap = 'round';
          g.lineJoin = 'round';
          g.beginPath();
          g.moveTo(360, 442);
          g.lineTo(378, 460);
          g.lineTo(410, 422);
          g.stroke();
          // Machine-readable strip.
          for (let row = 0; row < 2; row++) {
            for (let i = 0; i < 24; i++) {
              g.fillStyle = rgba('--orbit', (i * 7 + row * 3) % 5 === 0 ? 0.15 : 0.4);
              g.fillRect(48 + i * 17.5, 590 + row * 40, 9, 20);
            }
          }
        };
        const drawActivity = (g: Ctx) => {
          g.clearRect(0, 0, PW, PH);
          header(g);
          const base = 400;
          const heights = [60, 90, 78, 126, 150, 186, 232];
          heights.forEach((h, i) => {
            const grad = g.createLinearGradient(0, base - h, 0, base);
            grad.addColorStop(0, rgba('--brand-fill', 0.95));
            grad.addColorStop(1, rgba('--orbit', 0.7));
            g.fillStyle = grad;
            pill(g, 56 + i * 58, base - h, 36, h, 8);
            g.fill();
          });
          g.fillStyle = rgba('--orbit', 0.4);
          g.fillRect(48, base + 14, 416, 3);
          // A trend line whose points are signals.
          const pts: [number, number][] = [
            [64, 560],
            [150, 530],
            [236, 548],
            [322, 496],
            [408, 470],
          ];
          g.strokeStyle = rgba('--orbit', 0.8);
          g.lineWidth = 5;
          g.lineJoin = 'round';
          g.beginPath();
          pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
          g.stroke();
          pts.forEach(([x, y], i) => {
            g.fillStyle = rgba(i === pts.length - 1 ? '--brand-fill' : '--orbit', 1);
            g.beginPath();
            g.arc(x, y, i === pts.length - 1 ? 13 : 8, 0, Math.PI * 2);
            g.fill();
          });
          lines(g, 48, 622, [220, 150], 30, 0.35);
        };
        const drawFinance = (g: Ctx) => {
          g.clearRect(0, 0, PW, PH);
          header(g);
          const cx = 256;
          const cy = 250;
          g.lineWidth = 26;
          g.lineCap = 'round';
          g.strokeStyle = rgba('--orbit', 0.2);
          g.beginPath();
          g.arc(cx, cy, 104, 0, Math.PI * 2);
          g.stroke();
          const grad = g.createLinearGradient(cx - 104, cy, cx + 104, cy);
          grad.addColorStop(0, rgba('--orbit', 0.95));
          grad.addColorStop(1, rgba('--brand-fill', 1));
          g.strokeStyle = grad;
          g.beginPath();
          g.arc(cx, cy, 104, -Math.PI / 2, Math.PI * 1.15);
          g.stroke();
          g.fillStyle = rgba('--brand-fill', 0.9);
          g.beginPath();
          g.arc(cx, cy, 14, 0, Math.PI * 2);
          g.fill();
          // A payment record: filled dots are on time.
          for (let row = 0; row < 3; row++) {
            for (let i = 0; i < 8; i++) {
              const on = (i * 5 + row * 3) % 7 !== 0;
              g.beginPath();
              g.arc(72 + i * 52, 470 + row * 50, 14, 0, Math.PI * 2);
              if (on) {
                g.fillStyle = rgba('--brand-fill', 0.85);
                g.fill();
              } else {
                g.strokeStyle = rgba('--orbit', 0.55);
                g.lineWidth = 4;
                g.stroke();
              }
            }
          }
          lines(g, 48, 636, [200, 130], 30, 0.35);
        };
        const drawCover = (g: Ctx) => {
          g.clearRect(0, 0, PW, PH);
          // Guilloche-style rings and an inset border, embossed in a faint line.
          g.strokeStyle = rgba('--orbit', 0.16);
          g.lineWidth = 2;
          for (let r = 40; r < 460; r += 14) {
            g.beginPath();
            g.arc(PW / 2, PH * 0.42, r, 0, Math.PI * 2);
            g.stroke();
          }
          g.strokeStyle = rgba('--orbit', 0.4);
          g.lineWidth = 4;
          pill(g, 24, 24, PW - 48, PH - 48, 26);
          g.stroke();
        };

        const textures: {
          tex: InstanceType<typeof THREE.CanvasTexture>;
          draw: (g: Ctx) => void;
        }[] = [];
        const pageTexture = (draw: (g: Ctx) => void) => {
          const canvas = document.createElement('canvas');
          canvas.width = PW;
          canvas.height = PH;
          const tex = new THREE.CanvasTexture(canvas);
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = 4;
          textures.push({ tex, draw });
          return tex;
        };
        const repaintPages = () => {
          for (const { tex, draw } of textures) {
            const g = (tex.image as HTMLCanvasElement).getContext('2d');
            if (g) draw(g);
            tex.needsUpdate = true;
          }
        };

        const applyTheme = () => {
          const mark = tone('--mark-body');
          const mint = tone('--brand-fill');
          const orbit = tone('--orbit');
          bodyMat.color.copy(mark);
          backMat.color.copy(mark).multiplyScalar(0.42);
          pageMat.color.copy(mark).multiplyScalar(0.55);
          edgeMat.color.copy(orbit);
          guideMat.color.copy(orbit);
          orbitMat.color.copy(orbit);
          orbitGlowMat.color.copy(orbit);
          nodeMat.color.copy(mint);
          nodeHaloMat.color.copy(mint);
          sealMat.color.copy(orbit);
          linkMat.color.copy(orbit);
          beamMat.color.copy(mint);
          packetMat.color.copy(mint);
          for (const { geo, h } of bars) {
            const pos = geo.getAttribute('position');
            const colors = geo.getAttribute('color') as InstanceType<typeof THREE.BufferAttribute>;
            for (let i = 0; i < pos.count; i++) {
              const t = Math.min(1, Math.max(0, (pos.getY(i) + h / 2) / h));
              const c = orbit.clone().lerp(mint, t);
              colors.setXYZ(i, c.r, c.g, c.b);
            }
            colors.needsUpdate = true;
          }
          barMat.emissive.copy(mint).multiplyScalar(0.28);
          repaintPages();
        };

        // ---- the passport: five layers on one stacking axis ----
        const W = 2.2;
        const H = 3.0;
        const roundedRect = (w: number, h: number, r: number) => {
          const s = new THREE.Shape();
          const x = -w / 2;
          const y = -h / 2;
          s.moveTo(x + r, y);
          s.lineTo(x + w - r, y);
          s.quadraticCurveTo(x + w, y, x + w, y + r);
          s.lineTo(x + w, y + h - r);
          s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
          s.lineTo(x + r, y + h);
          s.quadraticCurveTo(x, y + h, x, y + h - r);
          s.lineTo(x, y + r);
          s.quadraticCurveTo(x, y, x + r, y);
          return s;
        };
        const slab = (w: number, h: number, depth: number, bevel: number) => {
          const geo = new THREE.ExtrudeGeometry(roundedRect(w, h, 0.2), {
            depth,
            bevelEnabled: true,
            bevelThickness: bevel,
            bevelSize: bevel,
            bevelSegments: 4,
            curveSegments: 18,
          });
          geo.translate(0, 0, -depth / 2);
          return geo;
        };

        const passport = new THREE.Group();
        const layers: InstanceType<typeof THREE.Group>[] = [];
        const edgeGeos: InstanceType<typeof THREE.EdgesGeometry>[] = [];

        const addLayer = (
          geo: InstanceType<typeof THREE.ExtrudeGeometry>,
          mat: InstanceType<typeof THREE.Material>,
          face: number,
          draw?: (g: Ctx) => void,
          inset = 0.3,
        ) => {
          const g = new THREE.Group();
          g.add(new THREE.Mesh(geo, mat));
          const edges = new THREE.EdgesGeometry(geo, 40);
          edgeGeos.push(edges);
          g.add(new THREE.LineSegments(edges, edgeMat));
          if (draw) {
            const plane = new THREE.Mesh(
              new THREE.PlaneGeometry(W - inset, H - inset),
              new THREE.MeshBasicMaterial({
                map: pageTexture(draw),
                transparent: true,
                depthWrite: false,
              }),
            );
            plane.position.z = face + 0.003;
            g.add(plane);
          }
          layers.push(g);
          passport.add(g);
          return g;
        };

        // 0 back cover, 1 financial reputation, 2 activity, 3 identity, 4 front cover.
        addLayer(slab(W, H, 0.1, 0.04), backMat, 0.09);
        const pageDepth = 0.04;
        const pageFace = pageDepth / 2 + 0.02;
        for (const draw of [drawFinance, drawActivity, drawIdentity]) {
          addLayer(slab(W - 0.1, H - 0.1, pageDepth, 0.02), pageMat, pageFace, draw, 0.4);
        }
        const coverFace = 0.08 + 0.06;
        const cover = addLayer(slab(W, H, 0.16, 0.06), bodyMat, coverFace, drawCover, 0.1);
        [0.55, 0.95, 1.42].forEach((h, i) => {
          const geo = new THREE.BoxGeometry(0.3, h, 0.12, 1, 6, 1);
          geo.setAttribute(
            'color',
            new THREE.BufferAttribute(new Float32Array(geo.getAttribute('position').count * 3), 3),
          );
          bars.push({ geo, h });
          const bar = new THREE.Mesh(geo, barMat);
          bar.position.set(-0.52 + i * 0.46, -0.95 + h / 2, coverFace + 0.07);
          cover.add(bar);
        });
        const seal = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.028, 12, 48), sealMat);
        seal.position.set(0.55, 1.0, coverFace + 0.03);
        const sealDot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), nodeMat);
        sealDot.position.set(0.55, 1.0, coverFace + 0.05);
        cover.add(seal, sealDot);

        // Guides along the stacking axis, visible once the layers separate.
        const corners: [number, number][] = [
          [-W / 2, -H / 2],
          [W / 2, -H / 2],
          [W / 2, H / 2],
          [-W / 2, H / 2],
        ];
        const guidePos = new Float32Array(corners.length * 6);
        const guideGeo = new THREE.BufferGeometry();
        guideGeo.setAttribute('position', new THREE.BufferAttribute(guidePos, 3));
        const guides = new THREE.LineSegments(guideGeo, guideMat);
        guides.frustumCulled = false;
        passport.add(guides);

        // ---- the orbit, with its travelling node ----
        const orbit = new THREE.Group();
        orbit.rotation.set(1.18, 0.12, -0.38);
        const ringGeo = new THREE.TorusGeometry(2.9, 0.03, 12, 220);
        const ringGlowGeo = new THREE.TorusGeometry(2.9, 0.09, 12, 220);
        const node = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 20), nodeMat);
        const halo = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 20), nodeHaloMat);
        orbit.add(new THREE.Mesh(ringGeo, orbitMat), new THREE.Mesh(ringGlowGeo, orbitGlowMat));
        node.add(halo);
        orbit.add(node);

        // ---- signals around the passport, and the links between them ----
        let seed = 7;
        const rand = () => {
          seed = (seed + 0x6d2b79f5) | 0;
          let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
          t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
          return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
        const COUNT = 46;
        const points: InstanceType<typeof THREE.Vector3>[] = [];
        const verified: boolean[] = [];
        for (let i = 0; i < COUNT; i++) {
          const u = rand() * 2 - 1;
          const a = rand() * Math.PI * 2;
          const radius = 3.5 + rand() * 1.5;
          const s = Math.sqrt(1 - u * u);
          points.push(
            new THREE.Vector3(Math.cos(a) * s * radius, u * radius * 0.7, Math.sin(a) * s * radius),
          );
          verified.push(rand() < 0.38);
        }
        const signals = new THREE.InstancedMesh(
          new THREE.SphereGeometry(1, 14, 14),
          signalMat,
          COUNT,
        );
        const m = new THREE.Matrix4();
        const dim = new THREE.Color();
        const lit = new THREE.Color();
        const paintSignals = () => {
          dim.copy(tone('--orbit')).multiplyScalar(0.42);
          lit.copy(tone('--brand-fill'));
          for (let i = 0; i < COUNT; i++) signals.setColorAt(i, verified[i] ? lit : dim);
          if (signals.instanceColor) signals.instanceColor.needsUpdate = true;
        };
        points.forEach((p, i) => {
          const sc = verified[i] ? 0.085 + rand() * 0.03 : 0.04 + rand() * 0.03;
          m.compose(p, new THREE.Quaternion(), new THREE.Vector3(sc, sc, sc));
          signals.setMatrixAt(i, m);
        });

        const linkPts: number[] = [];
        points.forEach((p, i) => {
          let degree = 0;
          for (let j = i + 1; j < COUNT && degree < 2; j++) {
            if (p.distanceTo(points[j]!) < 2.1) {
              linkPts.push(p.x, p.y, p.z, points[j]!.x, points[j]!.y, points[j]!.z);
              degree++;
            }
          }
        });
        const links = new THREE.LineSegments(new THREE.BufferGeometry(), linkMat);
        links.geometry.setAttribute('position', new THREE.Float32BufferAttribute(linkPts, 3));

        // Links from the pages to verified signals, in world space. A link
        // retracts while its signal is in front of the passport, so it never
        // draws across the cover.
        const beamTargets = points.filter((_, i) => verified[i]).slice(0, 9);
        const beamPos = new Float32Array(beamTargets.length * 6);
        const beamGeo = new THREE.BufferGeometry();
        beamGeo.setAttribute('position', new THREE.BufferAttribute(beamPos, 3));
        const beams = new THREE.LineSegments(beamGeo, beamMat);
        beams.frustumCulled = false;
        const packetPos = new Float32Array(beamTargets.length * 3);
        const packetGeo = new THREE.BufferGeometry();
        packetGeo.setAttribute('position', new THREE.BufferAttribute(packetPos, 3));
        const packets = new THREE.Points(packetGeo, packetMat);
        packets.frustumCulled = false;

        const shell = new THREE.Group();
        shell.add(signals, links);

        const world = new THREE.Group();
        world.add(passport, orbit, shell, beams, packets);
        scene.add(world);

        const key = new THREE.DirectionalLight(0xffffff, 1.1);
        key.position.set(3, 4, 6);
        const rim = new THREE.PointLight(0xffffff, 40, 20);
        rim.position.set(-5, 2, -3);
        const fill = new THREE.PointLight(0xffffff, 16, 20);
        fill.position.set(4, -3, 4);
        // Close to the cover so the light falls off across it: a gradient, not a flat fill.
        const sheen = new THREE.PointLight(0xffffff, 22, 9);
        sheen.position.set(-2.4, 2.6, 3.4);
        scene.add(key, rim, fill, sheen, new THREE.AmbientLight(0xffffff, 0.22));
        const retint = () => {
          rim.color.copy(tone('--brand-fill'));
          fill.color.copy(tone('--orbit'));
          sheen.color.copy(tone('--holo'));
          key.color.set(0xffffff).lerp(tone('--orbit'), 0.18);
        };
        applyTheme();
        paintSignals();
        retint();

        // ---- size, pointer, loop ----
        const FOV = Math.tan((30 * Math.PI) / 360);
        const resize = () => {
          const w = box.clientWidth;
          const h = box.clientHeight;
          if (!w || !h) return;
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          // Fit the shell vertically; widen the view on tall stages.
          const half = 3.0 / Math.min(1, camera.aspect * 1.05);
          camera.position.set(0, 0.2, half / FOV);
          camera.lookAt(0, 0, 0);
          camera.updateProjectionMatrix();
        };
        const ro = new ResizeObserver(() => {
          resize();
          draw(performance.now(), true);
        });
        ro.observe(box);

        const target = { x: 0, y: 0 };
        let hover = false;
        const onPointer = (e: PointerEvent) => {
          const r = box.getBoundingClientRect();
          target.x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
          target.y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
        };
        const onEnter = () => (hover = true);
        const onLeave = () => (hover = false);
        window.addEventListener('pointermove', onPointer, { passive: true });
        box.addEventListener('pointerenter', onEnter);
        box.addEventListener('pointerleave', onLeave);

        // The separation cycle: assembled, apart, assembled. Hovering holds it apart.
        const HOLD_CLOSED = 2.4;
        const HOLD_OPEN = 3.6;
        const MOVE = 1.6;
        const PERIOD = HOLD_CLOSED + HOLD_OPEN + 2 * MOVE;
        const ease = (x: number) => x * x * (3 - 2 * x);
        const cycle = (t: number) => {
          // Start a little before the first separation so it reads as an assembly.
          const p = (t + HOLD_CLOSED - 1.1) % PERIOD;
          if (p < HOLD_CLOSED) return 0;
          if (p < HOLD_CLOSED + MOVE) return ease((p - HOLD_CLOSED) / MOVE);
          if (p < HOLD_CLOSED + MOVE + HOLD_OPEN) return 1;
          return 1 - ease((p - HOLD_CLOSED - MOVE - HOLD_OPEN) / MOVE);
        };

        const GAP_CLOSED = 0.075;
        const GAP_OPEN = 1.12;
        const cur = { x: 0, y: 0 };
        let apart = mq.matches ? 1 : 0;
        const t0 = performance.now();
        const tmp = new THREE.Vector3();
        const anchor = new THREE.Vector3();
        const starts = [0, 0, 0].map(() => new THREE.Vector3());
        const draw = (now: number, still = false) => {
          const t = (now - t0) / 1000;
          if (!still) {
            cur.x += (target.x - cur.x) * 0.05;
            cur.y += (target.y - cur.y) * 0.05;
            apart += ((hover ? 1 : cycle(t)) - apart) * 0.12;
          }
          const e = apart;
          const gap = GAP_CLOSED + (GAP_OPEN - GAP_CLOSED) * e;
          // Back layers rise a little, so each page shows its top edge above the one in front.
          layers.forEach((l, i) => l.position.set(0, -(i - 2) * 0.17 * e, (i - 2) * gap));

          passport.rotation.y = -0.4 - 0.52 * e + cur.x * 0.3;
          passport.rotation.x = 0.1 + cur.y * 0.16;
          passport.position.y = Math.sin(t * 0.9) * 0.06 + 0.12 * e;
          edgeMat.opacity = 0.32 + 0.4 * e;
          guideMat.opacity = 0.4 * e;
          corners.forEach(([cx, cy], i) => {
            guidePos.set([cx, cy + 2 * 0.17 * e, -2 * gap, cx, cy - 2 * 0.17 * e, 2 * gap], i * 6);
          });
          guideGeo.attributes.position!.needsUpdate = true;

          orbit.rotation.y = 0.12 + cur.x * 0.1;
          shell.rotation.y = t * 0.06;
          shell.rotation.x = Math.sin(t * 0.21) * 0.06;
          const ang = t * 0.55;
          node.position.set(Math.cos(ang) * 2.9, Math.sin(ang) * 2.9, 0);

          world.updateMatrixWorld(true);
          // The three pages that send signals: financial reputation, activity, identity.
          [1, 2, 3].forEach((li, k) => layers[li]!.getWorldPosition(starts[k]!));
          beamTargets.forEach((p, i) => {
            const from = starts[i % 3]!;
            const to = tmp.copy(p).applyMatrix4(shell.matrixWorld);
            const reach = Math.min(1, Math.max(0, (1.1 - to.z) / 1.4));
            const f = ((t * 0.22 + i * 0.37) % 1) * reach;
            const dx = (to.x - from.x) * reach;
            const dy = (to.y - from.y) * reach;
            const dz = (to.z - from.z) * reach;
            beamPos.set([from.x, from.y, from.z, from.x + dx, from.y + dy, from.z + dz], i * 6);
            packetPos[i * 3] = from.x + (to.x - from.x) * f;
            packetPos[i * 3 + 1] = from.y + (to.y - from.y) * f;
            packetPos[i * 3 + 2] = from.z + (to.z - from.z) * f;
          });
          beamGeo.attributes.position!.needsUpdate = true;
          packetGeo.attributes.position!.needsUpdate = true;

          renderer.render(scene, camera);

          // Name each page once the layers have separated.
          const w = box.clientWidth;
          const h = box.clientHeight;
          // Labels are identity, activity, financial reputation: layers 3, 2, 1.
          [3, 2, 1].forEach((li, k) => {
            const el = tags.current[k];
            if (!el) return;
            anchor.set(0.35, H / 2, pageFace);
            layers[li]!.localToWorld(anchor);
            anchor.project(camera);
            const x = (anchor.x * 0.5 + 0.5) * w;
            const y = (-anchor.y * 0.5 + 0.5) * h;
            el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
            el.style.opacity = String(Math.max(0, (e - 0.55) / 0.45));
          });
        };

        let visible = true;
        let wantPlay = !mq.matches;
        const sync = () => {
          const run = visible && wantPlay && document.visibilityState === 'visible';
          renderer.setAnimationLoop(run ? (now) => draw(now) : null);
          if (!run) draw(performance.now(), true);
        };
        control.current = {
          setPlaying: (on) => {
            wantPlay = on;
            sync();
          },
        };
        const io = new IntersectionObserver(
          ([entry]) => {
            visible = entry?.isIntersecting ?? true;
            sync();
          },
          { threshold: 0.05 },
        );
        io.observe(box);
        const onVis = () => sync();
        document.addEventListener('visibilitychange', onVis);

        const themeObserver = new MutationObserver(() => {
          applyTheme();
          paintSignals();
          retint();
          draw(performance.now(), true);
        });
        themeObserver.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['data-theme'],
        });

        resize();
        sync();
        setState('ready');

        teardown = () => {
          renderer.setAnimationLoop(null);
          ro.disconnect();
          io.disconnect();
          themeObserver.disconnect();
          document.removeEventListener('visibilitychange', onVis);
          window.removeEventListener('pointermove', onPointer);
          box.removeEventListener('pointerenter', onEnter);
          box.removeEventListener('pointerleave', onLeave);
          scene.traverse((o) => {
            const mesh = o as InstanceType<typeof THREE.Mesh>;
            mesh.geometry?.dispose?.();
            const mat = mesh.material as InstanceType<typeof THREE.MeshBasicMaterial> | undefined;
            if (mat && !Array.isArray(mat) && mat.map) mat.dispose();
          });
          edgeGeos.forEach((g) => g.dispose());
          textures.forEach(({ tex }) => tex.dispose());
          [
            bodyMat,
            backMat,
            pageMat,
            barMat,
            edgeMat,
            guideMat,
            orbitMat,
            orbitGlowMat,
            nodeMat,
            nodeHaloMat,
            sealMat,
            linkMat,
            beamMat,
            packetMat,
            signalMat,
          ].forEach((mat) => mat.dispose());
          pmrem.dispose();
          renderer.dispose();
          renderer.forceContextLoss();
          renderer.domElement.remove();
          control.current = null;
        };
      } catch {
        if (!disposed) setState('fallback');
      }
    };

    // Let the first paint (and the headline) win; load the 3D scene after.
    // Safari has no requestIdleCallback.
    const hasIdle = 'requestIdleCallback' in window;
    const handle = hasIdle
      ? window.requestIdleCallback(() => void boot(), { timeout: 1200 })
      : window.setTimeout(boot, 250);

    return () => {
      disposed = true;
      if (hasIdle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
      teardown?.();
    };
  }, []);

  return (
    <div
      ref={stage}
      role="img"
      aria-label={label}
      data-scene={state}
      className={cn('relative aspect-[5/4] w-full select-none', className)}
    >
      <Image
        src="/brand/3d/badge.webp"
        alt=""
        width={512}
        height={512}
        priority
        unoptimized
        draggable={false}
        className={cn(
          'absolute left-1/2 top-1/2 w-[46%] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-700',
          state === 'ready' ? 'opacity-0' : 'opacity-100',
        )}
      />
      <div
        ref={canvasHost}
        className={cn(
          'scene-canvas absolute inset-0 transition-opacity duration-700',
          state === 'ready' ? 'opacity-100' : 'opacity-0',
        )}
      />
      {/* Names for the separated layers, as call-outs: a point on each page's top
          edge, a guide line, and a label on its own level so none overlap. The
          scene positions them every frame. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 max-sm:hidden">
        {layerLabels.map((text, i) => {
          const rise = [84, 56, 28][i]!;
          return (
            <span
              key={text}
              ref={(el) => {
                tags.current[i] = el;
              }}
              style={{ opacity: 0 }}
              className="absolute left-0 top-0 will-change-transform"
            >
              <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 rounded-full bg-brand-fill" />
              <span
                className="absolute left-0 w-px bg-line-strong"
                style={{ top: -rise, height: rise }}
              />
              <span
                className="absolute left-2 whitespace-nowrap text-[13px] font-medium text-ink"
                style={{ top: -rise, transform: 'translateY(-50%)' }}
              >
                {text}
              </span>
            </span>
          );
        })}
      </div>
      {state === 'ready' && !reduced ? (
        <button
          type="button"
          aria-pressed={!playing}
          onClick={() => {
            const next = !playing;
            setPlaying(next);
            control.current?.setPlaying(next);
          }}
          className="absolute bottom-1 right-1 inline-flex h-11 items-center rounded-lg px-3 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-200 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          {playing ? pauseLabel : playLabel}
        </button>
      ) : null}
    </div>
  );
}
