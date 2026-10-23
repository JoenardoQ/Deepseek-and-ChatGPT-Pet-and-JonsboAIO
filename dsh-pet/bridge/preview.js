const $ = (id) => document.getElementById(id);
let roles = {};
const labels = {
  streaming: '正在投屏',
  'waiting-device': '等待 USB 屏幕',
  busy: '官方程序占用',
  'permission-required': '需要接管权限',
  'missing-sdk': '缺少官方 SDK',
  'multiple-devices': '检测到多个屏幕',
  inactive: '未投屏',
  disabled: '未投屏',
  'waiting-screen': '其他程序正在投屏',
  error: '连接异常',
  'requesting-permission': '等待 Windows 权限确认',
  connecting: '正在连接',
  disconnecting: '正在断开',
};
let state,
  selectedKey,
  busy = false;
let scenes = Object.fromEntries([...$('duet').options].map((o) => [o.value, o.textContent]));
const target = (pet) => ({
  source: pet.source,
  ...(pet.instanceId === undefined ? {} : { instanceId: pet.instanceId }),
});
const selected = () => state?.pets.find((p) => p.key === selectedKey);

async function post(route, body) {
  const response = await fetch(route, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Pet-Client': '1' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(6000),
  });
  const value = await response.json();
  if (!response.ok) throw Error(value.error || '操作失败，请重试');
  return value;
}

function render(s) {
  state = s;
  roles = s.roles || roles;
  if (!s.pets.some((p) => p.key === selectedKey)) selectedKey = s.selectedInstance || s.pets[0]?.key;
  const pet = selected();
  const enabled = !!pet?.screen && s.screenOptions.enabled;
  const actual = enabled && s.screenInstance === selectedKey;
  const streaming =
    actual && s.output.usb === 'streaming' && s.output.streamId === selectedKey && s.output.generation === s.generation;
  $('build').textContent = 'v' + s.build + ' · r' + s.bridgeRevision;
  // Preserve focused cards while heartbeats update their status.
  for (const button of [...$('sources').children])
    if (!s.pets.some((p) => p.key === button.dataset.key)) button.remove();
  for (const item of s.pets) {
    let button = [...$('sources').children].find((b) => b.dataset.key === item.key);
    if (!button) {
      button = document.createElement('button');
      button.className = 'source';
      button.dataset.key = item.key;
      button.dataset.source = item.source;
      button.append(document.createElement('strong'), document.createElement('span'), document.createElement('span'));
      button.onclick = () =>
        act(async () => {
          const result = await post('/device/source', target(item));
          selectedKey = item.key;
          render(result);
        });
      $('sources').append(button);
    }
    button.disabled = busy;
    button.setAttribute('aria-pressed', String(item.key === selectedKey));
    button.children[0].textContent = item.name || roles[item.character] || '桌宠';
    button.children[1].textContent =
      (item.source === 'dsh' ? 'DSH' : 'ChatGPT / Codex') + ' · ' + (item.instanceId || '默认实例');
    button.children[2].textContent = !item.screen
      ? '投屏已断开'
      : item.key === s.screenInstance
        ? '已选投屏来源'
        : '在线 · 等待切换';
  }
  $('selection').textContent = pet
    ? (roles[pet.character] || '桌宠') + '已选中。预览可在断开投屏后继续查看。'
    : '在对应宿主中开启桌宠，此处会自动发现每个实例。';
  $('connect').textContent = !enabled ? '连接屏幕' : !actual ? '切换到这只' : streaming ? '重新连接' : '重试连接';
  $('connect').disabled = busy || !pet;
  $('disconnect').hidden = !enabled;
  $('disconnect').disabled = busy || !enabled;
  $('takeover').hidden = !actual || !['busy', 'permission-required'].includes(s.output.usb);
  $('takeover').disabled = busy;
  $('badge').textContent = !enabled
    ? '未投屏'
    : !actual
      ? '其他桌宠投屏中'
      : (s.output.usb === 'streaming' && !streaming ? '正在切换画面' : labels[s.output.usb]) || '正在准备';
  $('badge').classList.toggle('good', streaming);
  $('connection').textContent = !enabled
    ? '连接后会显示完整画面，包括台词和插图。'
    : !actual
      ? '点击切换，将当前选中的桌宠送到屏幕。'
      : streaming
        ? '乔思伯正在接收所选桌宠画面。'
        : s.output.error || labels[s.output.usb] || '正在准备输出…';
  if (!$('backgrounds').children.length)
    for (const bg of s.backgrounds) {
      const button = document.createElement('button');
      button.dataset.background = bg.id;
      if (bg.id !== 'none') {
        const img = document.createElement('img');
        img.src = '/backgrounds/' + bg.id + '.png';
        img.alt = '';
        button.append(img);
      }
      button.append(document.createTextNode(bg.label));
      button.onclick = () => act(() => post('/appearance', { background: bg.id }));
      $('backgrounds').append(button);
    }
  for (const button of $('backgrounds').children) {
    button.disabled = busy;
    button.setAttribute('aria-pressed', String(button.dataset.background === s.appearance.background));
  }
  $('background-status').textContent = '背景与旋转自动保存；左侧预览保持正向，旋转只应用于实屏。';
  if (document.activeElement !== $('rotation')) $('rotation').value = String(s.screenOptions.rotation);
  $('rotation').disabled = busy;
  if (s.scenes && JSON.stringify(s.scenes) !== $('duet').dataset.catalog) {
    $('duet').dataset.catalog = JSON.stringify(s.scenes);
    $('duet').replaceChildren(
      ...[{ id: 'auto', label: '自动轮换' }, { id: 'off', label: '关闭互动' }, ...s.scenes].map(
        (s) => new Option(s.label, s.id),
      ),
    );
    scenes = Object.fromEntries(s.scenes.map((s) => [s.id, s.label]));
  }
  if (document.activeElement !== $('duet')) $('duet').value = s.duet.mode;
  $('duet').disabled = busy;
  $('duet-status').textContent = s.duet.active
    ? '正在一起' + scenes[s.duet.action] + '。'
    : s.duet.mode === 'off'
      ? '互动已关闭，双方各自陪伴。'
      : s.duet.reason;
  $('participants').textContent = ['dsh', 'chatgpt']
    .map(
      (k) =>
        (k === 'dsh' ? 'DSH' : 'GPT') +
        '：' +
        (s.duet.participants[k]
          ? roles[s.duet.participants[k].character] + ' · ' + s.duet.participants[k].key
          : '未连接'),
    )
    .join(' / ');
  $('status').textContent = JSON.stringify(s, null, 2);
  $('copy-diagnostics').disabled = busy;
  const live = !!pet?.frameAt;
  $('frame').hidden = !live;
  $('empty').hidden = live;
  if (!live) $('empty').textContent = pet ? '正在请求这只桌宠的预览画面…' : '请先在宿主中开启桌宠。';
}
async function refresh() {
  try {
    const response = await fetch('/state', { signal: AbortSignal.timeout(4000) });
    if (!response.ok) throw Error('offline');
    render(await response.json());
  } catch {
    $('badge').textContent = '服务未连接';
    $('connection').textContent = '请在宿主中重新启用桌宠，页面会自动重连。';
    document.querySelectorAll('button,select').forEach((b) => (b.disabled = true));
  }
}
async function act(task) {
  if (busy) return;
  busy = true;
  if (state) render(state);
  try {
    await task();
    $('result').textContent = '设置已更新。';
  } catch (error) {
    $('result').textContent = error.message;
  } finally {
    busy = false;
    await refresh();
  }
}
$('connect').onclick = () => act(() => post('/device/connection', { ...target(selected()), enabled: true }));
$('disconnect').onclick = () => act(() => post('/device/connection', { ...target(selected()), enabled: false }));
$('takeover').onclick = () =>
  act(async () => {
    await post('/device/takeover', {});
    await post('/device/connection', { ...target(selected()), enabled: true });
  });
$('duet').onchange = () => {
  const mode = $('duet').value;
  return act(() => post('/duet', { mode }));
};
$('rotation').onchange = () => {
  const rotation = Number($('rotation').value);
  return act(() => post('/device/options', { rotation }));
};
$('copy-diagnostics').onclick = () =>
  act(async () => {
    await navigator.clipboard.writeText($('status').textContent);
  });
(async function preview() {
  if (!document.hidden && selectedKey) {
    const key = selectedKey;
    try {
      const response = await fetch('/frame.png?source=' + encodeURIComponent(key), {
        signal: AbortSignal.timeout(3000),
      });
      if (response.ok) {
        const url = URL.createObjectURL(await response.blob());
        const previous = $('frame').src;
        if (selectedKey === key) $('frame').src = url;
        else URL.revokeObjectURL(url);
        if (previous.startsWith('blob:')) URL.revokeObjectURL(previous);
      }
    } catch {
      /* Presence and the state poll report recovery. */
    }
  }
  setTimeout(preview, 125);
})();
(async function poll() {
  await refresh();
  setTimeout(poll, 1000);
})();
