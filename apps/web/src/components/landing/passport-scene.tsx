'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@fondealo/ui';

type SceneState = 'loading' | 'ready' | 'fallback';

/**
 * The hero object (docs/brand/identity.md §9): the company passport as a lit
 * 3D body, with its orbit, verified signals and the links that carry them to
 * the network. Colours come from the design tokens, so Night and Day both work.
 *
 * Progressive by construction: the server renders the flat 3D badge as a
 * poster; three.js loads after first paint and only when WebGL works, the
 * device is not saving data and the stage is on screen. Reduced motion renders
 * one still frame. Everything else gets a pause control.
 */
export function PassportScene({
  label,
  sampleLabel,
  pauseLabel,
  playLabel,
  className,
}: {
  label: string;
  sampleLabel: string;
  pauseLabel: string;
  playLabel: string;
  className?: string;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const canvasHost = useRef<HTMLDivElement>(null);
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
        const channels = (name: string) =>
          css
            .getPropertyValue(name)
            .trim()
            .split(/\s+/)
            .map((n) => Number(n) / 255);
        const tone = (name: string) => {
          const [r = 0, g = 0, b = 0] = channels(name);
          return new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace);
        };

        const bodyMat = new THREE.MeshPhysicalMaterial({
          metalness: 0.2,
          roughness: 0.32,
          clearcoat: 1,
          clearcoatRoughness: 0.18,
        });
        const backMat = new THREE.MeshPhysicalMaterial({ metalness: 0.15, roughness: 0.5 });
        const barMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35 });
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

        const applyTheme = () => {
          const mark = tone('--mark-body');
          const mint = tone('--brand-fill');
          const orbit = tone('--orbit');
          bodyMat.color.copy(mark);
          backMat.color.copy(mark).multiplyScalar(0.42);
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
        };

        // ---- the passport ----
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
        const slab = (w: number, h: number, depth: number) => {
          const geo = new THREE.ExtrudeGeometry(roundedRect(w, h, 0.22), {
            depth,
            bevelEnabled: true,
            bevelThickness: 0.06,
            bevelSize: 0.06,
            bevelSegments: 5,
            curveSegments: 20,
          });
          geo.translate(0, 0, -depth / 2);
          return geo;
        };

        const passport = new THREE.Group();
        const back = new THREE.Mesh(slab(2.4, 3.2, 0.2), backMat);
        back.position.set(-0.2, 0.12, -0.2);
        back.rotation.z = 0.06;
        const front = new THREE.Mesh(slab(2.4, 3.2, 0.2), bodyMat);
        front.position.set(0.08, -0.04, 0.02);
        passport.add(back, front);

        const faceZ = 0.02 + 0.1 + 0.06;
        [0.55, 0.95, 1.42].forEach((h, i) => {
          const geo = new THREE.BoxGeometry(0.3, h, 0.12, 1, 6, 1);
          geo.setAttribute(
            'color',
            new THREE.BufferAttribute(new Float32Array(geo.getAttribute('position').count * 3), 3),
          );
          bars.push({ geo, h });
          const bar = new THREE.Mesh(geo, barMat);
          bar.position.set(-0.52 + i * 0.46, -1.0 + h / 2 + 0.1, faceZ + 0.06);
          passport.add(bar);
        });
        const seal = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.028, 12, 48), sealMat);
        seal.position.set(0.58, 1.0, faceZ + 0.02);
        const sealDot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), nodeMat);
        sealDot.position.set(0.58, 1.0, faceZ + 0.04);
        passport.add(seal, sealDot);
        passport.rotation.set(0.08, -0.42, 0);

        // ---- the orbit, with its travelling node ----
        const orbit = new THREE.Group();
        orbit.rotation.set(1.18, 0.12, -0.38);
        const ringGeo = new THREE.TorusGeometry(2.72, 0.03, 12, 220);
        const ringGlowGeo = new THREE.TorusGeometry(2.72, 0.09, 12, 220);
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
          const radius = 3.3 + rand() * 1.5;
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

        // Links from the passport to verified signals. A link retracts while its
        // signal is in front of the passport, so it never draws across the cover.
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
        shell.add(signals, links, beams, packets);

        const world = new THREE.Group();
        world.add(passport, orbit, shell);
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
          const half = 2.85 / Math.min(1, camera.aspect * 1.05);
          camera.position.set(0, 0.2, half / FOV);
          camera.lookAt(0, 0, 0);
          camera.updateProjectionMatrix();
        };
        const ro = new ResizeObserver(() => {
          resize();
          draw(performance.now());
        });
        ro.observe(box);

        const target = { x: 0, y: 0 };
        const onPointer = (e: PointerEvent) => {
          const r = box.getBoundingClientRect();
          target.x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
          target.y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
        };
        window.addEventListener('pointermove', onPointer, { passive: true });

        const cur = { x: 0, y: 0 };
        const tmp = new THREE.Vector3();
        const draw = (now: number, still = false) => {
          const t = now / 1000;
          if (!still) {
            cur.x += (target.x - cur.x) * 0.05;
            cur.y += (target.y - cur.y) * 0.05;
          }
          passport.rotation.y = -0.42 + cur.x * 0.38;
          passport.rotation.x = 0.08 + cur.y * 0.18;
          passport.position.y = Math.sin(t * 0.9) * 0.07;
          orbit.rotation.y = 0.12 + cur.x * 0.1;
          shell.rotation.y = t * 0.06;
          shell.rotation.x = Math.sin(t * 0.21) * 0.06;
          const ang = t * 0.55;
          node.position.set(Math.cos(ang) * 2.72, Math.sin(ang) * 2.72, 0);
          shell.updateMatrixWorld(true);
          beamTargets.forEach((p, i) => {
            const front = tmp.copy(p).applyMatrix4(shell.matrixWorld).z;
            const reach = Math.min(1, Math.max(0, (1.1 - front) / 1.4));
            const f = ((t * 0.22 + i * 0.37) % 1) * reach;
            beamPos[i * 6 + 3] = p.x * reach;
            beamPos[i * 6 + 4] = p.y * reach;
            beamPos[i * 6 + 5] = p.z * reach;
            packetPos[i * 3] = p.x * f;
            packetPos[i * 3 + 1] = p.y * f;
            packetPos[i * 3 + 2] = p.z * f;
          });
          beamGeo.attributes.position!.needsUpdate = true;
          packetGeo.attributes.position!.needsUpdate = true;
          renderer.render(scene, camera);
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
          scene.traverse((o) => {
            const mesh = o as InstanceType<typeof THREE.Mesh>;
            mesh.geometry?.dispose?.();
          });
          [
            bodyMat,
            backMat,
            barMat,
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
      <span className="absolute left-1 top-1 rounded-md border border-line-strong px-2 py-0.5 text-[13px] font-medium text-ink-muted">
        {sampleLabel}
      </span>
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
