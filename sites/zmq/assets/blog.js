import { API_ROOT, UUID, request, errorMessage, el, formatDate, safeCoverURL, articleURL, renderBlocks, loadingPanel, statusPanel } from './common.js?v=20261015blog2';

const pageType = document.body.dataset.page;
let articleGeneration = 0;
let articleActive = true;

function postCard(post) {
  const link = el('a', { class: 'card-link', href: articleURL(post.id) });
  const visual = el('div', { class: 'card-visual', 'aria-hidden': 'true' });
  const placeholder = el('div', { class: `card-placeholder${post.protected ? ' locked' : ''}` }, [
    el('span', { class: 'placeholder-mark', text: post.protected ? '⌑' : '✿' }),
    el('span', { class: 'placeholder-text', text: post.protected ? 'A PRIVATE LITTLE STORY' : 'A LITTLE STORY TO REMEMBER' }),
  ]);
  visual.append(placeholder);
  const cover = post.protected ? null : safeCoverURL(post.cover_url);
  if (cover) {
    const image = el('img', { src: cover, alt: '', loading: 'lazy', decoding: 'async' });
    placeholder.hidden = true;
    image.addEventListener('error', () => { image.remove(); placeholder.hidden = false; }, { once: true });
    visual.append(image);
  }
  const meta = el('div', { class: 'card-meta' }, [el('time', { text: formatDate(post.published_at), ...(post.published_at ? { datetime: post.published_at } : {}) })]);
  if (post.protected) meta.append(el('span', { class: 'badge', text: '密码保护' }));
  link.append(visual, meta, el('h3', { text: post.title || '无标题文章' }));
  if (!post.protected && post.excerpt) link.append(el('p', { class: 'card-excerpt', text: post.excerpt }));
  link.append(el('div', { class: 'card-read-more' }, [el('span', { text: post.protected ? '输入密码阅读' : '读这个故事' }), el('span', { text: '↗', 'aria-hidden': 'true' })]));
  return el('article', { class: 'post-card' }, [link]);
}

async function loadPosts() {
  const grid = document.querySelector('#posts-grid');
  const status = document.querySelector('#posts-status');
  const pagination = document.querySelector('#pagination');
  const count = document.querySelector('#post-count');
  const currentPage = pageType === 'home' ? 1 : Math.max(1, Math.min(1_000_000, Number.parseInt(new URLSearchParams(location.search).get('page') || '1', 10) || 1));
  const limit = pageType === 'home' ? 3 : 12;
  grid.replaceChildren();
  if (pagination) pagination.hidden = true;
  loadingPanel(status, '正在翻开故事本……');
  try {
    const data = await request(`${API_ROOT}/posts?page=${currentPage}&limit=${limit}`);
    if (!Array.isArray(data.posts)) throw new Error('Invalid posts');
    const posts = data.posts.filter(post => UUID.test(post?.id || ''));
    if (count) count.textContent = `共 ${Math.max(0, Number(data.total) || 0)} 篇故事`;
    if (!posts.length) {
      if (currentPage > 1) {
        statusPanel(status, '这一页还没有故事', '回到第一页，看看最近更新的文章。');
        status.append(el('a', { class: 'button secondary small', href: '/articles/', text: '回到第一页' }));
      } else {
        statusPanel(status, '故事，正要开始。', '这里会收藏依娜与恰恰的文字、照片和视频。第一篇小故事，等着被写下。');
        status.append(el('a', { class: 'button secondary small', href: '/admin/', text: '写下第一个故事 ↗' }));
      }
      return;
    }
    status.hidden = true;
    grid.replaceChildren(...posts.map(postCard));
    if (pagination) {
      const totalPages = Math.max(1, Math.ceil((Number(data.total) || 0) / limit));
      if (totalPages > 1) {
        const prev = currentPage > 1 ? el('a', { href: `/articles/?page=${currentPage - 1}`, text: '← 上一页' }) : el('span', { text: '已是第一页' });
        const next = currentPage < totalPages ? el('a', { href: `/articles/?page=${currentPage + 1}`, text: '下一页 →' }) : el('span', { text: '已是最后一页' });
        pagination.replaceChildren(prev, el('span', { text: `${currentPage} / ${totalPages}` }), next);
        pagination.hidden = false;
      }
    }
  } catch (error) {
    statusPanel(status, '故事本暂时没有打开', errorMessage(error), { action: loadPosts, actionText: '再试一次' });
  }
}

function articleHeader(post, unlocked = false) {
  const meta = el('div', { class: 'article-meta' }, [el('span', { text: '依娜与恰恰' }), el('span', { text: '·', 'aria-hidden': 'true' }), el('time', { text: formatDate(post.published_at), ...(post.published_at ? { datetime: post.published_at } : {}) })]);
  if (post.protected) meta.append(el('span', { class: 'badge', text: unlocked ? '已解锁' : '密码保护' }));
  return el('header', { class: 'article-header' }, [el('p', { class: 'eyebrow', text: 'A LITTLE STORY' }), el('h1', { text: post.title || '无标题文章' }), meta]);
}

function lockedArticle(post, article) {
  const input = el('input', { id: 'unlock-password', type: 'password', autocomplete: 'current-password', required: true, 'aria-describedby': 'unlock-error' });
  const message = el('p', { id: 'unlock-error', class: 'form-message error', role: 'alert', hidden: true });
  const submit = el('button', { type: 'submit', class: 'button primary', text: '打开这个故事 →' });
  const form = el('form', { class: 'unlock-form' }, [el('label', { for: 'unlock-password', text: '文章访问密码' }), input, message, submit]);
  const card = el('section', { class: 'lock-card', 'aria-labelledby': 'locked-title' }, [el('span', { class: 'lock-icon', text: '⌑', 'aria-hidden': 'true' }), el('h2', { id: 'locked-title', text: '留给懂得的人。' }), el('p', { text: '这个故事设置了访问密码，输入密码后就可以阅读。' }), form]);
  article.replaceChildren(articleHeader(post), card);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const password = input.value;
    if (!password || new TextEncoder().encode(password).length > 72) {
      message.textContent = '请输入 1–72 字节的文章密码。';
      message.hidden = false;
      input.focus();
      return;
    }
    submit.disabled = true;
    submit.textContent = '正在打开……';
    message.hidden = true;
    try {
      await request(`${API_ROOT}/posts/${post.id}/unlock`, { method: 'POST', body: { password } });
      input.value = '';
      await loadArticle();
    } catch (error) {
      message.textContent = errorMessage(error);
      message.hidden = false;
      input.value = '';
      input.focus();
    } finally {
      submit.disabled = false;
      submit.textContent = '打开这个故事 →';
    }
  });
}

async function loadArticle() {
  if (!articleActive) return;
  const generation = ++articleGeneration;
  const article = document.querySelector('#article');
  const status = document.querySelector('#article-status');
  const id = new URLSearchParams(location.search).get('id');
  article.hidden = true;
  article.replaceChildren();
  if (!UUID.test(id || '')) {
    statusPanel(status, '没有找到这个故事', '文章链接不完整，可以回到文章列表重新打开。');
    return;
  }
  loadingPanel(status, '正在打开故事……');
  try {
    const data = await request(`${API_ROOT}/posts/${id}`);
    if (!articleActive || generation !== articleGeneration) return;
    const post = data.post;
    if (!post || !UUID.test(post.id || '')) throw new Error('Invalid post');
    document.title = `${post.title || '阅读故事'} · 依娜与恰恰`;
    if (data.locked === true) lockedArticle(post, article);
    else {
      const body = el('div', { class: 'article-body' });
      renderBlocks(body, post.blocks);
      article.append(articleHeader(post, true), body, el('div', { class: 'article-end', text: '✿', 'aria-hidden': 'true' }), el('div', { class: 'article-return' }, [el('a', { class: 'text-link', href: '/articles/', text: '还有更多小故事 →' })]));
    }
    status.hidden = true;
    article.hidden = false;
  } catch (error) {
    if (!articleActive || generation !== articleGeneration) return;
    statusPanel(status, error?.status === 404 ? '这个故事暂时不在这里' : '故事暂时没有打开', errorMessage(error), { ...(error?.status === 404 ? {} : { action: loadArticle, actionText: '再试一次' }) });
  }
}

if (pageType === 'article') {
  loadArticle();
  window.addEventListener('pagehide', () => {
    articleActive = false;
    articleGeneration += 1;
    document.querySelector('#article').replaceChildren();
    document.querySelector('#article').hidden = true;
    document.title = '阅读故事 · 依娜与恰恰';
  });
  window.addEventListener('pageshow', event => { articleActive = true; if (event.persisted) loadArticle(); });
} else loadPosts();
