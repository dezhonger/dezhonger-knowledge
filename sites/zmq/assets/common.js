export const API_ROOT = '/api/blog';
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'text') node.textContent = String(value);
    else if (key === 'class') node.className = value;
    else if (key === 'value') node.value = value;
    else if (key === 'hidden') node.hidden = value;
    else node.setAttribute(key, value === true ? '' : String(value));
  }
  for (const child of children) {
    if (child !== null && child !== undefined) node.append(child);
  }
  return node;
}

export class APIError extends Error {
  constructor(status, code) {
    super(code || `HTTP ${status}`);
    this.status = status;
    this.code = code;
  }
}

export async function request(path, { method = 'GET', body, signal } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  try {
    const response = await fetch(path, {
      method,
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { Accept: 'application/json', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: controller.signal,
    });
    if (response.status === 204) return null;
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new APIError(response.status, payload?.code);
    if (!payload || typeof payload !== 'object') throw new APIError(502, 'invalid_response');
    return payload;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}

export function errorMessage(error) {
  const messages = {
    authentication_required: '登录状态已过期，请重新登录。未保存的内容仍保留在当前页面。',
    unauthorized: '请先登录，再继续操作。',
    admin_required: '当前账号没有写作权限，请使用管理员账号登录。',
    forbidden: '当前账号没有执行此操作的权限。',
    password_change_required: '账号需要先修改密码，请前往主站完成修改后重新登录。',
    invalid_credentials: '用户名或密码不正确，请重新输入。',
    invalid_password: '文章密码不正确，请重新输入。',
    password_required: '请先输入这篇文章的访问密码。',
    version_conflict: '这篇文章已在其他页面更新。请先复制保留当前修改，再重新加载文章，避免覆盖新内容。',
    invalid_request: '内容不符合要求。请检查标题、正文、密码或上传文件后重试。',
    invalid_post: '文章内容不符合要求。请检查标题、正文长度和内容块数量；发布文章需要有标题及至少一块有效正文。',
    invalid_media: '媒体文件无效，或不属于这篇文章，请重新上传。',
    unsupported_media: '不支持这种文件格式。图片请选择 JPG、PNG、GIF、WebP；视频请选择 MP4 或 WebM。',
    invalid_upload: '文件上传未完成或内容无效，请重新选择文件后上传。',
    post_changed: '上传过程中文章状态发生了变化，请重新加载文章后再试。',
    version_required: '缺少文章版本信息，请先复制保留修改，再重新加载文章后保存。',
    article_access_required: '文章的访问权限已过期，请刷新页面后重新输入密码。',
    not_found: '这篇文章不存在，或已经下线。',
    post_not_found: '这篇文章不存在，或已经下线。',
    media_not_found: '这份图片或视频已不可用。',
    rate_limited: '操作太频繁，请稍等片刻再试。',
    file_too_large: '文件超过大小限制，请选择更小的文件。',
    unsupported_media_type: '不支持这种文件格式，请按页面提示选择图片或视频。',
    invalid_response: '服务暂时无法返回内容，请稍后重试。',
  };
  if (messages[error?.code]) return messages[error.code];
  if (error?.name === 'AbortError' || error?.name === 'TimeoutError') return '请求超时，请检查网络后重试。';
  if (error?.status === 401) return '需要登录或重新输入文章密码后，才能继续。';
  if (error?.status === 403) return '没有访问权限，请检查登录状态。';
  if (error?.status === 404) return '这篇文章不存在，或已经下线。';
  if (error?.status === 409) return messages.version_conflict;
  if (error?.status === 413) return messages.file_too_large;
  if (error?.status === 429) return messages.rate_limited;
  if (error?.status >= 500) return '服务暂时不可用，请稍后重试。';
  return '暂时无法连接服务，请检查网络后重试。';
}

export function formatDate(value, withTime = false) {
  if (!value) return '日期待定';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '日期待定';
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
}

export function mediaURL(id) {
  return UUID.test(id || '') ? `${API_ROOT}/media/${id}` : null;
}

export function safeCoverURL(value) {
  if (typeof value !== 'string') return null;
  return /^\/api\/blog\/media\/[0-9a-f-]{36}$/i.test(value) && UUID.test(value.split('/').pop()) ? value : null;
}

export function articleURL(id) {
  return `/article/?id=${encodeURIComponent(id)}`;
}

function openImageViewer(src, caption) {
  const close = el('button', { class: 'button small secondary', type: 'button', text: '关闭图片 ×' });
  const image = el('img', { src, alt: caption || '放大的文章图片' });
  const dialog = el('dialog', { class: 'image-viewer', 'aria-label': caption || '查看文章图片' }, [
    el('div', { class: 'image-viewer-toolbar' }, [el('span', { text: '把这一刻，看得更清楚。' }), close]),
    image,
    ...(caption ? [el('p', { text: caption })] : []),
  ]);
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => dialog.remove(), { once: true });
  image.addEventListener('error', () => {
    image.hidden = true;
    dialog.append(el('p', { class: 'media-unavailable', text: '图片暂时无法加载，请关闭后刷新页面重试。' }));
  }, { once: true });
  document.body.append(dialog);
  dialog.showModal();
}

export function closeImageViewers() {
  for (const dialog of document.querySelectorAll('.image-viewer')) {
    dialog.close();
    dialog.remove();
  }
}

window.addEventListener('pagehide', closeImageViewers);

export function renderBlocks(container, blocks) {
  container.replaceChildren();
  for (const block of Array.isArray(blocks) ? blocks : []) {
    if (!block || typeof block !== 'object') continue;
    const text = typeof block.text === 'string' ? block.text : '';
    if (['paragraph', 'heading', 'quote'].includes(block.type)) {
      if (text.trim()) container.append(el({ paragraph: 'p', heading: 'h2', quote: 'blockquote' }[block.type], { text }));
    } else if (block.type === 'list') {
      const items = text.split('\n').filter(item => item.trim());
      if (items.length) container.append(el('ul', {}, items.map(item => el('li', { text: item }))));
    } else if (block.type === 'image' || block.type === 'video') {
      const src = mediaURL(block.media_id);
      if (!src) continue;
      const caption = typeof block.caption === 'string' ? block.caption : '';
      const media = block.type === 'image'
        ? el('img', { src, alt: caption || '文章图片', loading: 'lazy', decoding: 'async' })
        : el('video', { src, controls: true, playsinline: true, preload: 'metadata', 'aria-label': caption || '文章视频' });
      let visual = media;
      if (block.type === 'image') {
        visual = el('button', { class: 'image-zoom', type: 'button', 'aria-label': caption ? `放大查看：${caption}` : '放大查看文章图片' }, [media]);
        visual.addEventListener('click', () => openImageViewer(src, caption));
      }
      const figure = el('figure', {}, [visual]);
      if (caption) figure.append(el('figcaption', { text: caption }));
      media.addEventListener('error', () => {
        visual.hidden = true;
        figure.prepend(el('p', { class: 'media-unavailable', text: '内容暂时无法加载。如访问权限已过期，请刷新页面重新解锁。' }));
      }, { once: true });
      container.append(figure);
    }
  }
}

export function loadingPanel(container, text) {
  container.hidden = false;
  container.replaceChildren(el('span', { class: 'spinner', 'aria-hidden': 'true' }), el('p', { text }));
}

export function statusPanel(container, title, detail, { action, actionText, symbol = '✿' } = {}) {
  container.hidden = false;
  container.replaceChildren(el('span', { class: 'status-symbol', text: symbol, 'aria-hidden': 'true' }), el('h2', { text: title }), el('p', { text: detail }));
  if (action && actionText) {
    const button = el('button', { class: 'button secondary small', type: 'button', text: actionText });
    button.addEventListener('click', action);
    container.append(button);
  }
}
