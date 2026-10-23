import { Projection } from './projection.mjs';
import { sourceKey } from './sources.mjs';
import { BUILD_VERSION, PROTOCOL_VERSION, BRIDGE_REVISION } from './version.mjs';
import { randomUUID } from 'node:crypto';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync, writeFileSync, readFileSync, renameSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Duets } from './duets.mjs';
import { Appearance, BACKGROUNDS } from './appearance.mjs';
import { Sources, Controls } from './state.mjs';
import { HostLeases } from './plugin-lifetime.mjs';
import { root, port, dataDir, config, pythonCommand, nodeCommand, dshHome, electronPath } from './runtime.mjs';

export function createBridge({ launch = true } = {}) {
  const roles = Object.fromEntries(
    readdirSync(path.join(root, 'assets/pets'))
      .filter((id) => existsSync(path.join(root, 'assets/pets', id, 'pet.json')))
      .map((id) => [id, JSON.parse(readFileSync(path.join(root, 'assets/pets', id, 'pet.json'), 'utf8')).label]),
  );
  const sources = new Sources();
  const projection = new Projection(sources);
  let lastGeneration = -1,
    lastStreamId;
  const hosts = new HostLeases();
  let lifecycleClosing = false,
    dshSeen = false,
    shuttingDown = false;
  let worker,
    standalone,
    workerPending = '',
    lastFrame,
    lastWorkerEnabled,
    lastWorkerUpdate = 0;
  let output = { worker: 'stopped', usb: 'not-started' };
  const controls = new Controls();
  let control = controls.snapshot();
  const cfg = config();
  const appearance = new Appearance(path.join(dataDir, 'appearance.json'));
  const duetFile = path.join(dataDir, 'duet.json');
  let duetMode = 'auto';
  try {
    duetMode = JSON.parse(readFileSync(duetFile, 'utf8')).mode;
  } catch {}
  const duets = new Duets({
    mode: duetMode,
    persist(mode) {
      mkdirSync(dataDir, { recursive: true });
      writeFileSync(duetFile + '.tmp', JSON.stringify({ mode }));
      renameSync(duetFile + '.tmp', duetFile);
    },
  });
  const screenEnabled = { dsh: true };
  const excludedSources = () => [
    ...(currentControl().screen ? [] : ['chatgpt']),
    ...(screenEnabled.dsh ? [] : ['dsh']),
  ];
  if (cfg.usb === false) output.usb = 'disabled';
  function currentControl() {
    control = controls.snapshot();
    if (screenEnabled.chatgpt !== undefined) control.screen = screenEnabled.chatgpt;
    return control;
  }
  function snapshot() {
    const f = sources.current();
    currentControl();
    return {
      service: 'dsh-pet-jonsbo',
      roles,
      scenes: duets.catalog.map(({ id, label }) => ({ id, label })),
      appearance: appearance.snapshot(),
      backgrounds: BACKGROUNDS,
      shuttingDown: shuttingDown || lifecycleClosing,
      version: PROTOCOL_VERSION,
      build: BUILD_VERSION,
      bridgeRevision: BRIDGE_REVISION,
      pid: process.pid,
      visible: control.visible || [...sources.instances().values()].some((p) => p.desktop),
      control: currentControl(),
      source: f?.source,
      screenSource: projection.selected(excludedSources())?.source,
      screenInstance: projection.selected(excludedSources())?.key,
      selectedInstance: sources.selected()?.key,
      screenOptions: { rotation: cfg.rotation ?? 90, enabled: cfg.usb !== false },
      generation: projection.generation,
      pets: [...sources.instances().values()].map(({ png, ...p }) => ({
        ...p,
        frameAt: sources.frames.get(p.key)?.at,
        screen: !projection.excluded(excludedSources()).includes(p.key),
      })),
      animation: f?.animation,
      frameAt: f?.at,
      output,
      activeSources: [...new Set([...sources.frames.values()].map((f) => f.source))],
      selectedSource: sources.selected()?.source,
      connectedSources: [...sources.connected().keys()],
      characters: Object.fromEntries([...sources.connected()].map(([key, frame]) => [key, frame.character])),
      duet: duets.snapshot(sources, currentControl()),
      connections: control.connections,
      screens: { chatgpt: control.screen, dsh: screenEnabled.dsh },
      standalone: standalone?.pid || null,
    };
  }
  function startWorker() {
    if (worker || !launch || cfg.usb === false) return;
    mkdirSync(dataDir, { recursive: true });
    const executable = process.env.PET_USB_WORKER || path.join(root, 'desktop/bin/dsh-pet-usb.exe');
    const packaged = !process.env.PET_PYTHON && existsSync(executable);
    worker = spawn(
      packaged ? executable : pythonCommand(),
      [
        ...(packaged ? [] : ['-u', path.join(root, 'desktop/frame_worker.py')]),
        '--config',
        path.join(dataDir, 'config.json'),
      ],
      { cwd: root, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] },
    );
    lastFrame = undefined;
    lastWorkerEnabled = undefined;
    lastWorkerUpdate = 0;
    output = { worker: 'starting', usb: 'not-started' };
    worker.stdout.on('data', (b) => {
      workerPending += b;
      let i;
      while ((i = workerPending.indexOf('\n')) >= 0) {
        const line = workerPending.slice(0, i);
        workerPending = workerPending.slice(i + 1);
        try {
          const update = JSON.parse(line);
          if (update.generation !== undefined && update.generation !== projection.generation) continue;
          output = { ...output, ...update };
        } catch {}
      }
      if (workerPending.length > 65536) workerPending = '';
    });
    worker.stderr.on('data', (b) => {
      output = { ...output, error: String(b).slice(-1500) };
    });
    worker.stdin.on('error', () => {});
    worker.on('error', (e) => {
      output = { worker: 'error', usb: 'unavailable', error: e.message };
    });
    worker.on('exit', (code) => {
      worker = undefined;
      output = { ...output, worker: 'stopped', exitCode: code };
    });
  }
  function startPet() {
    if (standalone || !launch) return;
    // Upstream standalone downloads Electron when it is absent on a new machine.
    mkdirSync(path.join(dshHome, 'dsh-pet'), { recursive: true });
    const file = path.join(dshHome, 'dsh-pet/main-config.jsonc');
    if (!existsSync(file))
      writeFileSync(
        file,
        JSON.stringify(
          {
            pets: [
              {
                id: 'main',
                name: 'ChatGPT 娘',
                size: 380,
                display: 'desktop',
                balanceEnabled: true,
                whisperEnabled: true,
                workStatusEnabled: true,
                fixedEnabled: false,
                position: { corner: 'bottom-right', marginX: 24, marginY: 36 },
              },
            ],
            notificationsEnabled: false,
          },
          null,
          2,
        ),
      );
    const charactersFile = path.join(dshHome, 'dsh-pet/characters.json');
    if (!existsSync(charactersFile)) writeFileSync(charactersFile, JSON.stringify({ main: 'chatgpt' }));
    standalone = spawn(nodeCommand(), [path.join(root, 'lib/standalone.js'), '--port', String(port + 1)], {
      cwd: root,
      windowsHide: true,
      env: {
        ...process.env,
        DSH_HOME: dshHome,
        DSH_PET_ELECTRON_PATH: process.env.DSH_PET_ELECTRON_PATH || electronPath,
        PET_DATA_DIR: dataDir,
        PET_PORT: String(port),
        DSH_PET_JONSBO_SOURCE: 'chatgpt',
        ELECTRON_RUN_AS_NODE: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const child = standalone;
    child.stdout.on('data', (b) => process.stderr.write(b));
    child.stderr.on('data', (b) => process.stderr.write(b));
    child.on('error', (e) => {
      output = { ...output, desktopError: e.message };
    });
    child.on('exit', (code) => {
      if (standalone === child) standalone = undefined;
      if (control.visible) output = { ...output, desktopError: 'Desktop host exited: ' + code };
    });
  }
  async function stopPet() {
    const child = standalone;
    if (!child) return;
    // Terminate only the child owned by this bridge; upstream helper monitors its parent PID.
    child.kill();
    await new Promise((resolve) => {
      if (child.exitCode !== null) return resolve();
      const timer = setTimeout(resolve, 3000);
      child.once('exit', () => {
        clearTimeout(timer);
        resolve();
      });
    });
    if (standalone === child) standalone = undefined;
  }
  const timer = setInterval(
    () => {
      const excluded = excludedSources();
      const selected = projection.selected(excluded);
      const f = sources.frames.get(selected?.key);
      const enabled = cfg.usb !== false && !!selected;
      const streamId = selected?.key ?? null;
      // Presence keeps the last frame on screen across helper restarts; explicit disconnect releases USB.
      if (
        worker?.stdin.writable &&
        !worker.stdin.writableNeedDrain &&
        (f !== lastFrame ||
          enabled !== lastWorkerEnabled ||
          lastGeneration !== projection.generation ||
          lastStreamId !== streamId ||
          Date.now() - lastWorkerUpdate >= 1000)
      ) {
        worker.stdin.write(
          JSON.stringify({
            enabled,
            streamId,
            generation: projection.generation,
            rotation: cfg.rotation ?? 90,
            ...(enabled && f ? { png: f.png } : {}),
          }) + '\n',
        );
        lastGeneration = projection.generation;
        lastStreamId = streamId;
        lastFrame = f;
        lastWorkerEnabled = enabled;
        lastWorkerUpdate = Date.now();
      }
    },
    1000 / Math.max(1, Math.min(30, Number(cfg.fps) || 24)),
  ).unref();
  const server = http.createServer(async (req, res) => {
    const send = (code, v) => {
      res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(v));
    };
    if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.headers.host || ''))
      return send(403, { error: 'Local Host required' });
    const assetUrl = new URL(req.url, 'http://127.0.0.1');
    const background = BACKGROUNDS.find(
      (b) => b.id !== 'none' && assetUrl.pathname === '/backgrounds/' + b.id + '.png',
    );
    if (req.method === 'GET' && background) {
      const file = path.join(root, 'assets/screen-backgrounds', background.id + '.png');
      if (!existsSync(file)) return send(404, { error: 'Background not installed' });
      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      });
      return res.end(readFileSync(file));
    }
    if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`)
      return send(403, { error: 'Cross-origin denied' });
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      if (req.method === 'GET' && url.pathname === '/state') return send(200, snapshot());
      if (req.method === 'GET' && url.pathname === '/control') return send(200, currentControl());
      if (req.method === 'GET' && url.pathname === '/frame.png') {
        sources.current();
        const requestedSource = url.searchParams.get('source');
        if (requestedSource) projection.preview(requestedSource);
        const f = requestedSource ? sources.frames.get(sources.resolve(requestedSource)?.key) : sources.current();
        if (!f) return send(404, { error: 'No live frame' });
        res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' });
        return res.end(Buffer.from(f.png, 'base64'));
      }
      if (req.method === 'GET' && ['/preview.css', '/preview.js'].includes(url.pathname)) {
        res.writeHead(200, {
          'Content-Type': url.pathname.endsWith('.css') ? 'text/css' : 'text/javascript',
          'Cache-Control': 'no-store',
        });
        return res.end(readFileSync(path.join(root, 'bridge', url.pathname.slice(1))));
      }
      if (req.method === 'GET' && url.pathname === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
        return res.end(readFileSync(path.join(root, 'bridge/preview.html')));
      }
      if (req.method !== 'POST') return send(404, { error: 'Not found' });
      if (req.headers['x-pet-client'] !== '1') return send(403, { error: 'Client header required' });
      if (url.pathname === '/device/takeover') {
        mkdirSync(dataDir, { recursive: true });
        writeFileSync(
          path.join(dataDir, 'config.json'),
          JSON.stringify(
            {
              ...config(),
              autoTakeover: true,
              forceTakeover: true,
              restoreOnExit: true,
              takeoverRequest: randomUUID(),
            },
            null,
            2,
          ),
        );
        return send(200, {
          ok: true,
          message: '正在接管。若官方程序以管理员运行，Windows 会请求一次权限；允许后自动重试连接，取消后不会反复弹窗。',
        });
      }
      if (url.pathname === '/shutdown') {
        shuttingDown = true;
        controls.sessions.clear();
        currentControl();
        send(200, { stopping: true });
        void stopPet().finally(() => server.close());
        return;
      }
      let raw = '';
      const limit = url.pathname === '/frame' ? 2000000 : 8192;
      for await (const chunk of req) {
        raw += chunk;
        if (raw.length > limit) return send(413, { error: 'Body too large' });
      }
      const value = JSON.parse(raw);
      if (url.pathname === '/host') {
        if (
          !value ||
          typeof value.id !== 'string' ||
          !/^[a-zA-Z0-9-]{1,80}$/.test(value.id) ||
          (value.release !== undefined && typeof value.release !== 'boolean')
        )
          throw new Error('Invalid host lease');
        const enabled = hosts.update(value.id, value.release === true);
        if (value.release || !enabled) controls.release(value.id);
        else controls.heartbeat(value.id);
        return send(200, { enabled });
      }
      if (url.pathname === '/device/source') {
        if (
          !value ||
          !['dsh', 'chatgpt'].includes(value.source) ||
          Object.keys(value).some((k) => !['source', 'instanceId'].includes(k))
        )
          throw Error('Invalid screen source');
        sources.current();
        const key = sourceKey(value.source, value.instanceId);
        if (!sources.select(key)) return send(409, { error: '所选桌宠当前未在线' });
        projection.set(sources.preferred, true);
        if (value.instanceId === undefined) screenEnabled[value.source] = true;
        lastFrame = undefined;
        return send(200, snapshot());
      }
      if (url.pathname === '/device/connection') {
        if (
          !value ||
          !['chatgpt', 'dsh'].includes(value.source) ||
          typeof value.enabled !== 'boolean' ||
          Object.keys(value).some((key) => !['source', 'instanceId', 'enabled'].includes(key))
        )
          throw new Error('Expected source and enabled');
        const key = sourceKey(value.source, value.instanceId);
        if (value.instanceId !== undefined) {
          if (!sources.resolve(key)) return send(409, { error: '所选桌宠已离线' });
          projection.set(key, value.enabled);
          if (value.enabled) sources.select(key);
        } else {
          screenEnabled[value.source] = value.enabled;
          for (const pet of sources.instances().values())
            if (pet.source === value.source) projection.enabled.delete(pet.key);
          projection.generation++;
        }
        output = { ...output, usb: value.enabled ? 'connecting' : 'disconnecting', error: null };
        if (value.enabled) {
          if (cfg.usb === false) {
            cfg.usb = true;
            mkdirSync(dataDir, { recursive: true });
            writeFileSync(path.join(dataDir, 'config.json'), JSON.stringify({ ...config(), usb: true }, null, 2));
          }
          lastFrame = undefined;
          if (!worker) startWorker();
        }
        return send(200, snapshot());
      }
      if (url.pathname === '/device/options') {
        if (!value || Object.keys(value).some((k) => k !== 'rotation') || ![0, 90, 180, 270].includes(value.rotation))
          throw Error('Invalid screen rotation');
        mkdirSync(dataDir, { recursive: true });
        writeFileSync(
          path.join(dataDir, 'config.json'),
          JSON.stringify({ ...config(), rotation: value.rotation }, null, 2),
        );
        cfg.rotation = value.rotation;
        projection.generation++;
        return send(200, snapshot());
      }
      if (url.pathname === '/appearance') {
        appearance.set(value);
        return send(200, snapshot());
      }
      if (url.pathname === '/duet') {
        if (!value || Object.keys(value).some((k) => k !== 'mode')) throw Error('Expected duet mode');
        duets.set(value.mode);
        return send(200, snapshot());
      }
      if (url.pathname === '/pet/close') {
        if (!value || Object.keys(value).length) throw Error('Invalid close request');
        controls.sessions.clear();
        controls.revision++;
        currentControl();
        sources.removeSource('chatgpt');
        await stopPet();
        return send(200, snapshot());
      }
      if (url.pathname === '/presence') {
        if (
          !value ||
          !['dsh', 'chatgpt'].includes(value.source) ||
          !Object.hasOwn(roles, value.character) ||
          (value.ready !== undefined && typeof value.ready !== 'boolean') ||
          (value.name !== undefined && (typeof value.name !== 'string' || value.name.length > 80)) ||
          typeof value.desktop !== 'boolean' ||
          typeof value.instanceId !== 'string' ||
          value.instanceId.length > 120 ||
          typeof value.build !== 'string' ||
          value.build.length > 40 ||
          (value.error !== null && typeof value.error !== 'string') ||
          (value.error?.length || 0) > 300 ||
          Object.keys(value).some(
            (k) => !['source', 'character', 'desktop', 'instanceId', 'build', 'error', 'name', 'ready'].includes(k),
          )
        )
          throw Error('Invalid pet presence');
        sources.touch(value.source, value);
        if (value.source === 'dsh') dshSeen = true;
        const key = sourceKey(value.source, value.instanceId);
        return send(200, {
          ...snapshot(),
          capture: projection.capture(key, excludedSources(), cfg.usb !== false),
          instanceKey: key,
        });
      }
      if (url.pathname === '/frame') {
        if (
          typeof value.png !== 'string' ||
          !value.png.startsWith('iVBORw0KGgo') ||
          typeof value.animation !== 'string' ||
          value.animation.length > 150
        )
          throw new Error('Invalid frame');
        if (value.source === 'chatgpt' && !control.visible) return send(200, { ok: true, ignored: true });
        sourceKey(value.source, value.instanceId);
        sources.put(value.source, {
          instanceId: value.instanceId,
          png: value.png,
          animation: value.animation,
          character: Object.hasOwn(roles, value.character) ? value.character : null,
        });
        if (value.source === 'dsh') dshSeen = true;
        if (!worker && output.worker === 'stopped' && output.exitCode === undefined) startWorker();
        return send(200, { ok: true, duet: duets.snapshot(sources, currentControl()) });
      }
      if (url.pathname === '/event') {
        const before = currentControl();
        controls.apply(value);
        currentControl();
        if (!control.visible) {
          sources.removeSource('chatgpt');
          await stopPet();
        } else {
          if (!before.visible) startPet();
          if (output.worker === 'stopped' || output.worker === 'error') {
            output = { worker: 'stopped', usb: cfg.usb === false ? 'disabled' : 'not-started' };
            startWorker();
          }
        }
        return send(200, snapshot());
      }
      send(404, { error: 'Not found' });
    } catch (e) {
      send(400, { error: e.message });
    }
  });
  const lifetimeTimer = setInterval(async () => {
    if (lifecycleClosing) return;
    const active = hosts.active();
    sources.current(); // Drop expired DSH frames before checking its lifetime.
    const dshActive = sources.connected().has('dsh');
    if (hosts.hadHost && !active) controls.clearSessions();
    currentControl();
    if (!control.visible && standalone) {
      lifecycleClosing = true;
      sources.removeSource('chatgpt');
      await stopPet();
      lifecycleClosing = false;
    }
    if ((hosts.hadHost || dshSeen) && !active && !control.visible && !dshActive && server.listening) {
      lifecycleClosing = true;
      server.close();
    }
  }, 1000).unref();
  server.on('close', () => {
    clearInterval(lifetimeTimer);
    clearInterval(timer);
    worker?.stdin.end();
    void stopPet();
  });
  return server;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = createBridge();
  server.on('error', (e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
  server.listen(port, '127.0.0.1');
  for (const s of ['SIGINT', 'SIGTERM']) process.on(s, () => server.close());
}
