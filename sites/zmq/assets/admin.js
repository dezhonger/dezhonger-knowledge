import { API_ROOT, UUID, APIError, request, errorMessage, el, formatDate, mediaURL, articleURL, renderBlocks, closeImageViewers, statusPanel } from './common.js?v=20261015blog2';

const $ = selector => document.querySelector(selector);
const state = { user: null, post: null, dirty: false, busy: false, upload: null, page: 1, total: 0, posts: [], listGeneration: 0, conflict: false };
let pageActive = true;
const blockLabels = { paragraph: '文字', heading: '标题', quote: '引用', list: '列表', image: '图片', video: '视频' };
const placeholders = { paragraph: '写下这一刻的故事……', heading: '一个小标题', quote: '一句值得记住的话……', list: '每行写一项，例如：\n带上小水壶\n出发去公园' };
const imageTypes = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const videoTypes = new Set(['video/mp4', 'video/webm']);
const MAX_BLOCKS = 199;
const byteLength = value => new TextEncoder().encode(value).length;

function message(text, type = 'error', action) {
  const box = $('#editor-message');
  box.className = `form-message ${type}`;
  box.replaceChildren(el('span', { text }));
  if (action) {
    const button = el('button', { type: 'button', class: 'text-button', text: action.text });
    button.addEventListener('click', action.run);
    box.append(button);
  }
  box.hidden = false;
}

function handleEditorError(error) {
  if (error?.status === 409 || error?.code === 'version_conflict') {
    state.conflict = true;
    message(errorMessage(error), 'error', {
      text: '重新加载文章',
      run: () => {
        if (state.post?.id && window.confirm('重新加载会放弃当前页面中未保存的修改。请先复制保留需要的文字，确认重新加载吗？')) openPost(state.post.id, true);
      },
    });
  } else if (error?.status === 401 || error?.code === 'authentication_required') {
    message(errorMessage(error), 'error', { text: '重新登录', run: showLogin });
  } else if (error?.code === 'password_change_required') {
    message(errorMessage(error));
    $('#editor-message').append(el('a', { href: 'https://dezhonger.com/change-password/', class: 'text-link', target: '_blank', rel: 'noopener', text: '前往主站修改密码 ↗' }));
  } else message(errorMessage(error));
}

function updateControls() {
  const locked = state.busy || Boolean(state.upload);
  for (const control of $('#editor').querySelectorAll('input,textarea,button')) control.disabled = locked;
  $('#cancel-upload').disabled = !state.upload;
  for (const control of [$('#new-post'), $('#empty-new-post'), $('#logout'), $('#status-filter')]) control.disabled = locked;
  for (const control of $('#admin-post-list').querySelectorAll('button')) control.disabled = locked;
  const totalPages = Math.max(1, Math.ceil(state.total / 12));
  for (const control of $('#admin-pagination').querySelectorAll('button')) {
    control.disabled = locked || (control.dataset.direction === 'previous' ? state.page <= 1 : state.page >= totalPages);
  }
  $('#editor').setAttribute('aria-busy', String(locked));
  if (!locked) {
    $('#save-draft').disabled = state.conflict;
    $('#publish-post').disabled = state.conflict;
    $('#unpublish-post').disabled = state.conflict;
    $('#add-image').disabled = state.conflict;
    $('#add-video').disabled = state.conflict;
    for (const block of $('#blocks').children) {
      const index = Number(block.dataset.index);
      block.querySelector('[data-direction="-1"]').disabled = index === 0;
      block.querySelector('[data-direction="1"]').disabled = index === state.post?.blocks.length - 1;
    }
  }
}

function markDirty() {
  if (!state.post) return;
  state.dirty = true;
  $('#save-state').textContent = state.conflict ? '存在版本冲突，请先保留修改' : '有修改，尚未保存';
  $('.save-indicator').dataset.dirty = 'true';
  if ($('#editor-message').classList.contains('success')) $('#editor-message').hidden = true;
}

function canLeave() {
  if (state.busy || state.upload) return false;
  return !state.dirty || window.confirm('这篇文章有尚未保存的修改。离开后将放弃这些修改，确定继续吗？');
}

function autoHeight(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = `${Math.max(textarea.scrollHeight, textarea.dataset.minimum === 'heading' ? 53 : 76)}px`;
}

function setProtectionUI() {
  const protectedPost = Boolean(state.post?.protected);
  $('#password-keep-label').textContent = protectedPost ? '保留当前密码（无需重新输入）' : '公开阅读，无需密码';
  $('#password-set-label').textContent = protectedPost ? '更换访问密码' : '设置访问密码';
  $('#remove-password-label').hidden = !protectedPost;
  $('#protection-status').textContent = protectedPost ? '这篇文章已设置密码。访客解锁后才能阅读正文和查看媒体。' : '默认公开，访客无需密码即可阅读。';
  $('input[name="protection"][value="keep"]').checked = true;
  $('#article-password').value = '';
  $('#article-password-field').hidden = true;
}

function renderEditor() {
  const post = state.post;
  $('#editor-empty').hidden = Boolean(post);
  $('#editor').hidden = !post;
  $('#editor-message').hidden = true;
  if (!post) {
    $('#blocks').replaceChildren();
    $('#post-title').value = '';
    $('#article-password').value = '';
    return;
  }
  $('#post-title').value = post.title || '';
  $('#editor-status-badge').textContent = post.status === 'published' ? '已发布' : (post.id ? '草稿' : '新草稿');
  $('#editor-status-badge').className = `badge${post.status === 'published' ? ' published' : ''}`;
  $('#save-draft').textContent = post.status === 'published' ? '保存修改' : '保存草稿';
  $('#publish-post').hidden = post.status === 'published';
  $('#unpublish-post').hidden = post.status !== 'published';
  $('#delete-post').hidden = !post.id;
  $('#view-published').hidden = post.status !== 'published';
  if (post.id) $('#view-published').href = articleURL(post.id);
  $('#save-state').textContent = state.dirty ? '有修改，尚未保存' : (post.id ? '所有修改已保存' : '尚未保存');
  $('.save-indicator').dataset.dirty = String(state.dirty);
  $('#post-updated').textContent = post.updated_at ? `最近保存于 ${formatDate(post.updated_at, true)}` : '草稿不会出现在公开文章列表中。';
  setProtectionUI();
  renderEditorBlocks();
  updateControls();
}

function renderEditorBlocks(focusIndex = -1) {
  const container = $('#blocks');
  container.replaceChildren();
  for (const [index, block] of state.post.blocks.entries()) {
    const section = el('section', { class: 'editor-block', 'data-type': block.type, 'data-index': index, 'aria-label': `第 ${index + 1} 块：${blockLabels[block.type]}` });
    const up = el('button', { type: 'button', text: '↑', 'data-direction': '-1', 'aria-label': `向上移动第 ${index + 1} 块`, disabled: index === 0 });
    const down = el('button', { type: 'button', text: '↓', 'data-direction': '1', 'aria-label': `向下移动第 ${index + 1} 块`, disabled: index === state.post.blocks.length - 1 });
    const remove = el('button', { type: 'button', text: '删除', 'aria-label': `删除第 ${index + 1} 块${blockLabels[block.type]}` });
    up.addEventListener('click', () => moveBlock(index, -1));
    down.addEventListener('click', () => moveBlock(index, 1));
    remove.addEventListener('click', () => { state.post.blocks.splice(index, 1); markDirty(); renderEditorBlocks(Math.min(index, state.post.blocks.length - 1)); });
    section.append(el('div', { class: 'block-topline' }, [el('span', { class: 'block-type', text: `${String(index + 1).padStart(2, '0')} · ${blockLabels[block.type]}` }), el('div', { class: 'block-controls' }, [up, down, remove])]));
    if (['image', 'video'].includes(block.type)) {
      const src = mediaURL(block.media_id);
      if (src) {
        const media = block.type === 'image'
          ? el('img', { class: 'block-media', src, alt: block.caption || '文章图片', loading: 'lazy' })
          : el('video', { class: 'block-media', src, controls: true, playsinline: true, preload: 'metadata', 'aria-label': block.caption || '文章视频' });
        media.addEventListener('error', () => {
          media.hidden = true;
          section.insertBefore(el('p', { class: 'media-unavailable', text: '媒体暂时无法加载。请检查登录状态，或重新上传。' }), media);
        }, { once: true });
        section.append(media);
      }
      const captionID = `caption-${index}`;
      const caption = el('input', { id: captionID, class: 'caption-input', type: 'text', maxlength: '1000', value: block.caption || '', placeholder: '添加一句图片或视频说明（可选）' });
      caption.addEventListener('input', () => { block.caption = caption.value; markDirty(); });
      section.append(el('label', { class: 'caption-label', for: captionID, text: '说明文字（可选）' }), caption);
    } else {
      const textarea = el('textarea', { value: block.text || '', rows: block.type === 'heading' ? 1 : 2, maxlength: '200000', placeholder: placeholders[block.type], 'data-minimum': block.type, 'aria-label': `第 ${index + 1} 块${blockLabels[block.type]}内容` });
      textarea.addEventListener('input', () => { block.text = textarea.value; autoHeight(textarea); markDirty(); });
      section.append(textarea);
    }
    container.append(section);
  }
  requestAnimationFrame(() => {
    for (const textarea of container.querySelectorAll('textarea')) autoHeight(textarea);
    if (focusIndex >= 0) container.children[focusIndex]?.querySelector('textarea,input')?.focus();
  });
  updateControls();
}

function moveBlock(index, direction) {
  const next = index + direction;
  if (next < 0 || next >= state.post.blocks.length) return;
  [state.post.blocks[index], state.post.blocks[next]] = [state.post.blocks[next], state.post.blocks[index]];
  markDirty();
  renderEditorBlocks(next);
}

function createPost() {
  if (!canLeave()) return;
  state.post = { id: null, title: '', blocks: [{ type: 'paragraph', text: '' }], status: 'draft', protected: false };
  state.dirty = false;
  state.conflict = false;
  renderEditor();
  renderPostList();
  $('#post-title').focus();
}

async function openPost(id, force = false) {
  if (!force && !canLeave()) return;
  if (state.busy || state.upload) return;
  state.busy = true;
  updateControls();
  $('#admin-list-status').textContent = '正在打开文章……';
  try {
    const data = await request(`${API_ROOT}/admin/posts/${id}`);
    if (!pageActive) return;
    if (!data.post || !Array.isArray(data.post.blocks)) throw new APIError(502, 'invalid_response');
    state.post = structuredClone(data.post);
    state.dirty = false;
    state.conflict = false;
    renderEditor();
    renderPostList();
    if (window.matchMedia('(max-width: 760px)').matches) $('#editor').scrollIntoView({ block: 'start', behavior: 'smooth' });
  } catch (error) {
    if (state.post) handleEditorError(error);
    else {
      $('#editor-empty').hidden = false;
      $('#editor-empty').replaceChildren(el('h2', { text: '文章暂时没有打开' }), el('p', { text: errorMessage(error) }));
      const retry = el('button', { class: 'button secondary', type: 'button', text: '再试一次' });
      retry.addEventListener('click', () => openPost(id));
      $('#editor-empty').append(retry);
    }
  } finally {
    state.busy = false;
    $('#admin-list-status').textContent = `共 ${state.total} 篇文章`;
    updateControls();
  }
}

function renderPostList() {
  const list = $('#admin-post-list');
  list.replaceChildren();
  for (const post of state.posts) {
    const button = el('button', { type: 'button', class: 'post-list-button', ...(state.post?.id === post.id ? { 'aria-current': 'true' } : {}) }, [el('strong', { text: post.title || '未命名文章' }), el('small', {}, [el('span', { class: `badge${post.status === 'published' ? ' published' : ''}`, text: post.status === 'published' ? '已发布' : '草稿' }), el('span', { text: formatDate(post.updated_at) }), ...(post.protected ? [el('span', { text: '密码', 'aria-label': '密码保护' })] : [])])]);
    button.addEventListener('click', () => openPost(post.id));
    list.append(el('li', {}, [button]));
  }
  updateControls();
}

async function loadPostList(page = state.page) {
  page = Math.max(1, page);
  const generation = ++state.listGeneration;
  state.page = page;
  $('#admin-list-status').textContent = '正在加载文章……';
  $('#admin-pagination').hidden = true;
  const status = $('#status-filter').value;
  try {
    const data = await request(`${API_ROOT}/admin/posts?page=${page}&limit=12${status ? `&status=${status}` : ''}`);
    if (!pageActive || generation !== state.listGeneration) return;
    if (!Array.isArray(data.posts)) throw new APIError(502, 'invalid_response');
    state.posts = data.posts.filter(post => UUID.test(post?.id || ''));
    state.total = Number(data.total) || 0;
    $('#admin-list-status').textContent = state.total ? `共 ${state.total} 篇文章` : (status ? '暂无这个状态的文章。' : '还没有文章，写下第一篇吧。');
    renderPostList();
    const totalPages = Math.max(1, Math.ceil(state.total / 12));
    if (totalPages > 1 || page > 1) {
      const prev = el('button', { type: 'button', text: '← 上一页', 'data-direction': 'previous', disabled: page <= 1 });
      const next = el('button', { type: 'button', text: '下一页 →', 'data-direction': 'next', disabled: page >= totalPages });
      prev.addEventListener('click', () => loadPostList(page - 1));
      next.addEventListener('click', () => loadPostList(page + 1));
      $('#admin-pagination').replaceChildren(prev, el('span', { text: `${page} / ${totalPages}` }), next);
      $('#admin-pagination').hidden = false;
    }
    updateControls();
  } catch (error) {
    if (!pageActive || generation !== state.listGeneration) return;
    state.posts = [];
    $('#admin-post-list').replaceChildren();
    $('#admin-list-status').replaceChildren(el('span', { text: errorMessage(error) }));
    const retry = el('button', { type: 'button', class: 'text-button', text: '重试' });
    retry.addEventListener('click', () => loadPostList(page));
    $('#admin-list-status').append(retry);
    if (state.post && (error.status === 401 || error.code === 'password_change_required')) handleEditorError(error);
    else if (error.status === 401) showLogin();
  }
}

function validBlocks() {
  return state.post.blocks.flatMap(block => {
    if (['paragraph', 'heading', 'quote', 'list'].includes(block.type)) {
      return block.text?.trim() ? [{ type: block.type, text: block.text }] : [];
    }
    if (['image', 'video'].includes(block.type) && UUID.test(block.media_id || '')) {
      return [{ type: block.type, media_id: block.media_id, ...(block.caption?.trim() ? { caption: block.caption } : {}) }];
    }
    return [];
  });
}

function passwordMutation() {
  const mode = $('input[name="protection"]:checked').value;
  if (mode === 'remove') return { password: '' };
  if (mode !== 'set') return {};
  const password = $('#article-password').value;
  if (byteLength(password) < 1 || byteLength(password) > 72) {
    message('文章密码需要为 1–72 字节，请调整后再保存。');
    $('#article-password').focus();
    return null;
  }
  return { password };
}

async function savePost(status = state.post?.status, forUpload = false) {
  if (!state.post || state.busy || state.upload || state.conflict) return false;
  const post = state.post;
  if (!post.title.trim()) {
    if (forUpload) {
      post.title = '未命名文章';
      $('#post-title').value = post.title;
    } else {
      message('先给这篇故事起一个标题吧。');
      $('#post-title').focus();
      return false;
    }
  }
  const blocks = validBlocks();
  if (status === 'published' && !blocks.length) {
    message('正文还是空的，先添加一些文字、图片或视频再发布吧。');
    $('#blocks').querySelector('textarea')?.focus();
    return false;
  }
  const password = forUpload ? {} : passwordMutation();
  if (password === null) return false;
  const hasPendingPassword = forUpload && $('input[name="protection"]:checked').value !== 'keep';
  const body = { title: post.title.trim(), blocks, status, ...password, ...(post.id ? { version: post.version } : {}) };
  state.busy = true;
  $('#save-state').textContent = '正在保存……';
  $('#editor-message').hidden = true;
  updateControls();
  try {
    const data = await request(`${API_ROOT}/admin/posts${post.id ? `/${post.id}` : ''}`, { method: post.id ? 'PUT' : 'POST', body });
    if (!pageActive) return false;
    if (!data.post || !UUID.test(data.post.id || '') || !Number.isInteger(data.post.version)) throw new APIError(502, 'invalid_response');
    const pendingBlocks = post.blocks;
    state.post = structuredClone(data.post);
    state.dirty = false;
    state.conflict = false;
    if (forUpload) {
      state.post.blocks = pendingBlocks;
      state.dirty = hasPendingPassword;
      $('#delete-post').hidden = false;
      $('#editor-status-badge').textContent = '草稿';
      $('#post-updated').textContent = `最近保存于 ${formatDate(data.post.updated_at, true)}`;
      $('#save-state').textContent = '草稿已保存，准备上传';
    } else {
      renderEditor();
      message(status === 'published' ? (post.status === 'published' ? '文章修改已保存。' : '文章发布成功，可以去读这个新故事了。') : '草稿已保存，只在写作后台可见。', 'success');
    }
    await loadPostList();
    return true;
  } catch (error) {
    $('#save-state').textContent = '保存未完成，请重试';
    handleEditorError(error);
    return false;
  } finally {
    state.busy = false;
    updateControls();
  }
}

function uploadFile(file, postID) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    state.upload = xhr;
    xhr.open('POST', `${API_ROOT}/admin/posts/${postID}/media`);
    xhr.responseType = 'json';
    xhr.withCredentials = true;
    xhr.timeout = 900_000;
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.upload.addEventListener('progress', event => {
      if (event.lengthComputable) {
        const percent = Math.min(100, Math.round(event.loaded / event.total * 100));
        $('#upload-progress').value = percent;
        $('#upload-label').textContent = percent === 100 ? '上传完成，正在处理文件……' : `正在上传 ${file.name} · ${percent}%`;
      } else $('#upload-progress').removeAttribute('value');
    });
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300 && UUID.test(xhr.response?.media?.id || '')) resolve(xhr.response.media);
      else reject(new APIError(xhr.status, xhr.response?.code));
    });
    xhr.addEventListener('error', () => reject(new Error('network')));
    xhr.addEventListener('timeout', () => reject(new DOMException('Timeout', 'TimeoutError')));
    xhr.addEventListener('abort', () => reject(new DOMException('Cancelled', 'AbortError')));
    const form = new FormData();
    form.append('file', file);
    xhr.send(form);
    updateControls();
  });
}

async function insertMedia(file, type) {
  if (!file || !state.post || state.busy || state.upload || state.conflict) return;
  if (state.post.blocks.length >= MAX_BLOCKS) {
    message(`一篇文章最多添加 ${MAX_BLOCKS} 个内容块，请先删去不需要的块。`);
    return;
  }
  const accepted = type === 'image' ? imageTypes : videoTypes;
  const limit = (type === 'image' ? 20 : 200) * 1024 * 1024;
  if (!accepted.has(file.type)) {
    message(type === 'image' ? '请选择 JPG、PNG、GIF 或 WebP 图片。' : '请选择 MP4 或 WebM 视频。');
    return;
  }
  if (!file.size || file.size > limit) {
    message(`文件${file.size ? '太大' : '为空'}，${type === 'image' ? '图片' : '视频'}大小需要在 0–${type === 'image' ? '20' : '200'} MB 之间。`);
    return;
  }
  if (!state.post.id && !await savePost('draft', true)) return;
  $('#upload-panel').hidden = false;
  $('#upload-label').textContent = `正在上传 ${file.name}……`;
  $('#upload-progress').value = 0;
  $('#editor-message').hidden = true;
  try {
    const media = await uploadFile(file, state.post.id);
    if (!pageActive || !state.post) return;
    state.post.blocks.push({ type, media_id: media.id, caption: '' });
    markDirty();
    renderEditorBlocks(state.post.blocks.length - 1);
    message(`${type === 'image' ? '图片' : '视频'}已插入正文。请点击“${state.post.status === 'published' ? '保存修改' : '保存草稿'}”或发布，保存这次编辑。`, 'success');
  } catch (error) {
    if (error?.name === 'AbortError') message('上传已取消，可以重新选择文件。', '');
    else handleEditorError(error);
  } finally {
    state.upload = null;
    $('#upload-panel').hidden = true;
    updateControls();
  }
}

async function deletePost() {
  if (!state.post?.id || state.busy || state.upload) return;
  if (!window.confirm('确定删除这篇文章吗？删除后将从文章列表下线。')) return;
  state.busy = true;
  updateControls();
  try {
    await request(`${API_ROOT}/admin/posts/${state.post.id}`, { method: 'DELETE' });
    state.post = null;
    state.dirty = false;
    state.conflict = false;
    closeImageViewers();
    renderEditor();
    await loadPostList(1);
  } catch (error) { handleEditorError(error); }
  finally { state.busy = false; updateControls(); }
}

function showLogin() {
  closeImageViewers();
  if ($('#preview-dialog').open) $('#preview-dialog').close();
  $('#auth-loading').hidden = true;
  $('#access-view').hidden = true;
  $('#workspace').hidden = true;
  $('#login-view').hidden = false;
  $('#login-error').hidden = true;
  $('#login-password').value = '';
  if (state.user?.username) $('#username').value = state.user.username;
  $('#username').focus();
}

async function acceptUser(user) {
  if (!pageActive) return;
  if (state.user?.id && state.user.id !== user.id) {
    state.listGeneration += 1;
    state.post = null;
    state.posts = [];
    state.dirty = false;
    state.conflict = false;
    renderEditor();
  }
  state.user = user;
  $('#auth-loading').hidden = true;
  $('#login-view').hidden = true;
  $('#account-name').textContent = user.username || '已登录';
  $('#account-name').hidden = false;
  $('#logout').hidden = false;
  if (user.must_change_password) {
    $('#workspace').hidden = true;
    statusPanel($('#access-view'), '先为账号换一个密码', '请先到主站修改初始密码，再回到这里重新登录。');
    $('#access-view').append(el('a', { class: 'button primary', href: 'https://dezhonger.com/change-password/', target: '_blank', rel: 'noopener', text: '前往主站修改密码 ↗' }));
  } else if (user.role !== 'admin') {
    $('#workspace').hidden = true;
    statusPanel($('#access-view'), '这里是故事的写作间', '当前账号没有写作权限。请退出后使用管理员账号登录。');
  } else {
    $('#access-view').hidden = true;
    $('#workspace').hidden = false;
    await loadPostList();
    requestAnimationFrame(() => { for (const textarea of $('#blocks').querySelectorAll('textarea')) autoHeight(textarea); });
  }
}

async function restoreSession() {
  try {
    const data = await request('/api/auth/me');
    if (!data.user) throw new APIError(502, 'invalid_response');
    await acceptUser(data.user);
  } catch (error) {
    $('#auth-loading').hidden = true;
    if (error.status === 401) showLogin();
    else {
      statusPanel($('#access-view'), '写作手记暂时没有打开', errorMessage(error), { action: restoreSession, actionText: '再试一次' });
    }
  }
}

$('#login-form').addEventListener('submit', async event => {
  event.preventDefault();
  const submit = $('#login-submit');
  submit.disabled = true;
  submit.textContent = '正在登录……';
  $('#login-error').hidden = true;
  try {
    const data = await request('/api/auth/login', { method: 'POST', body: { username: $('#username').value.trim(), password: $('#login-password').value } });
    $('#login-password').value = '';
    if (!data.user) throw new APIError(502, 'invalid_response');
    await acceptUser(data.user);
  } catch (error) {
    $('#login-error').textContent = errorMessage(error);
    $('#login-error').hidden = false;
    $('#login-password').value = '';
    $('#login-password').focus();
  } finally {
    submit.disabled = false;
    submit.textContent = '登录写作手记 →';
  }
});

$('#logout').addEventListener('click', async () => {
  if (!canLeave()) return;
  $('#logout').disabled = true;
  try {
    await request('/api/auth/logout', { method: 'POST' });
    state.listGeneration += 1;
    state.user = null;
    state.post = null;
    state.posts = [];
    state.dirty = false;
    state.conflict = false;
    closeImageViewers();
    $('#blocks').replaceChildren();
    $('#preview-body').replaceChildren();
    $('#preview-title').textContent = '';
    $('#post-title').value = '';
    $('#article-password').value = '';
    $('#admin-post-list').replaceChildren();
    $('#account-name').textContent = '';
    $('#account-name').hidden = true;
    $('#logout').hidden = true;
    renderEditor();
    showLogin();
  } catch (error) {
    if (state.post) handleEditorError(error);
    else statusPanel($('#access-view'), '退出未完成', errorMessage(error));
  } finally { $('#logout').disabled = false; }
});

$('#new-post').addEventListener('click', createPost);
$('#empty-new-post').addEventListener('click', createPost);
$('#status-filter').addEventListener('change', () => loadPostList(1));
$('#post-title').addEventListener('input', event => { if (state.post) { state.post.title = event.target.value; markDirty(); } });
for (const button of document.querySelectorAll('[data-add]')) button.addEventListener('click', () => {
  if (!state.post || state.busy || state.upload) return;
  if (state.post.blocks.length >= MAX_BLOCKS) {
    message(`一篇文章最多添加 ${MAX_BLOCKS} 个内容块，请先删去不需要的块。`);
    return;
  }
  state.post.blocks.push({ type: button.dataset.add, text: '' });
  markDirty();
  renderEditorBlocks(state.post.blocks.length - 1);
});
$('#save-draft').addEventListener('click', () => savePost(state.post.status));
$('#publish-post').addEventListener('click', () => savePost('published'));
$('#unpublish-post').addEventListener('click', () => { if (window.confirm('撤回后，访客将无法再阅读这篇文章。确定撤回为草稿吗？')) savePost('draft'); });
$('#delete-post').addEventListener('click', deletePost);
for (const input of document.querySelectorAll('input[name="protection"]')) input.addEventListener('change', () => {
  const setting = $('input[name="protection"]:checked').value;
  $('#article-password-field').hidden = setting !== 'set';
  if (setting === 'set') $('#article-password').focus();
  else $('#article-password').value = '';
  markDirty();
});
$('#article-password').addEventListener('input', markDirty);
for (const type of ['image', 'video']) {
  $(`#add-${type}`).addEventListener('click', () => $(`#${type}-file`).click());
  $(`#${type}-file`).addEventListener('change', event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    insertMedia(file, type);
  });
}
$('#cancel-upload').addEventListener('click', () => state.upload?.abort());
$('#preview-post').addEventListener('click', () => {
  if (!state.post) return;
  $('#preview-title').textContent = state.post.title.trim() || '未命名的故事';
  renderBlocks($('#preview-body'), validBlocks());
  $('#preview-dialog').showModal();
});
$('#close-preview').addEventListener('click', () => $('#preview-dialog').close());
$('#preview-dialog').addEventListener('close', () => {
  closeImageViewers();
  for (const video of $('#preview-body').querySelectorAll('video')) video.pause();
  $('#preview-body').replaceChildren();
  $('#preview-title').textContent = '';
});
window.addEventListener('beforeunload', event => {
  if (state.dirty || state.busy || state.upload) { event.preventDefault(); event.returnValue = ''; }
});
window.addEventListener('resize', () => { for (const textarea of $('#blocks').querySelectorAll('textarea')) autoHeight(textarea); });
window.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's' && !$('#workspace').hidden && state.post) {
    event.preventDefault();
    savePost(state.post.status);
  }
});
window.addEventListener('pagehide', () => {
  pageActive = false;
  state.listGeneration += 1;
  state.upload?.abort();
  state.post = null;
  state.posts = [];
  state.dirty = false;
  $('#blocks').replaceChildren();
  $('#admin-post-list').replaceChildren();
  $('#preview-body').replaceChildren();
  $('#preview-title').textContent = '';
  $('#post-title').value = '';
  $('#article-password').value = '';
  $('#login-password').value = '';
});
window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
restoreSession();
