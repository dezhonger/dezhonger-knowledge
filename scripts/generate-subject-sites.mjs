import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { subjects } from './subject-data.mjs'
import { mathCurriculum } from './math-curriculum.mjs'
import { expandSubjects } from './subject-expansions.mjs'

expandSubjects(subjects)

const root = resolve(import.meta.dirname, '..')
const navSubjects = [['math','数学'],['algo','算法'],['english','英语'],['biology','生物'],['geography','地理'],['physics','物理'],['chemistry','化学'],['history','历史']]
const escapeHtml = (value = '') => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')
const nav = (slug) => navSubjects.map(([key,label])=>`<a${key===slug?' aria-current="page"':''} href="https://${key}.dezhonger.com">${label}</a>`).join('') + '<a href="https://guwen.dezhonger.com">古文</a><a href="https://knowledge.dezhonger.com/zh/">知识库</a>'
const pageHead = (title, description, styles) => `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${escapeHtml(description)}"><title>${escapeHtml(title)}</title>${styles.map(style=>`<link rel="stylesheet" href="${style}">`).join('')}</head>`
const header = (slug,name) => `<header class="site-header"><a class="site-name" href="/">${name}</a><nav aria-label="学科导航">${nav(slug)}</nav></header>`

function periodicTable() {
  return `<section class="periodic-section" aria-labelledby="periodic-title"><p class="kicker">INTERACTIVE REFERENCE</p><h2 id="periodic-title">元素周期表</h2><p>完整收录 118 个元素。点击查看原子序数、相对原子质量、电子排布、常见氧化态和类别。</p><div class="periodic-controls"><button class="element-filter active" data-element-filter="all">全部</button><button class="element-filter" data-element-filter="alkali">碱金属</button><button class="element-filter" data-element-filter="transition">过渡金属</button><button class="element-filter" data-element-filter="metalloid">类金属</button><button class="element-filter" data-element-filter="nonmetal">非金属</button><button class="element-filter" data-element-filter="halogen">卤素</button><button class="element-filter" data-element-filter="noble">稀有气体</button></div><div class="periodic-scroll"><div id="periodic-table" class="periodic-table" aria-label="元素周期表"></div></div><aside id="element-detail" class="element-detail" aria-live="polite"><div><span class="detail-number">1</span><strong class="detail-symbol">H</strong></div><div><h3>氢 · Hydrogen</h3><p>最轻的元素，也是宇宙中丰度最高的元素。</p></div><dl><div><dt>相对原子质量</dt><dd>1.008</dd></div><div><dt>电子排布</dt><dd>1s¹</dd></div><div><dt>常见氧化态</dt><dd>+1, −1</dd></div></dl></aside></section>`
}

function vocabularyLab() {
  const exams=[['cet4','四级'],['cet6','六级'],['ielts','雅思'],['toefl','托福'],['tem4','专四'],['tem8','专八']]
  return `<section class="vocab-lab" id="vocabulary"><div class="vocab-head"><div><p class="kicker">VOCABULARY REVIEW LAB</p><h2>单词复习</h2><p>选择考试词库，随机抽取不重复单词；中文释义、音标和词性直接展示，也可以隐藏答案进行自测。</p></div><span class="vocab-source">ECDICT · MIT License</span></div><div class="vocab-controls"><div class="exam-tabs" aria-label="考试词库">${exams.map(([key,label],index)=>`<button class="exam-tab${index===0?' active':''}" data-exam="${key}">${label}</button>`).join('')}</div><label class="count-field"><span>抽取数量（1–200）</span><input id="word-count" type="number" min="1" max="200" value="50"></label><button id="draw-words" class="draw-button">随机出词</button></div><div class="study-toolbar"><button id="toggle-meanings">隐藏释义</button><button id="review-only">只抽生词本</button><span id="study-progress">正在准备词库…</span></div><p id="vocab-status" class="disclaimer" aria-live="polite">正在加载词库…</p><div id="word-list" class="word-list"></div><p class="disclaimer">四级、六级、雅思和托福采用 ECDICT 的考试标签；专四、专八是依据许可词条、考试交集和语料频率整理的非官方复习池，不代表官方大纲。学习状态仅保存在当前浏览器。</p></section>`
}

function genericTopic(slug, subject, group, module, concept, indexes) {
  const detail = typeof concept === 'string' ? {
    title: concept,
    explanation: `${concept}是“${module.title}”中的核心知识。${module.summary}`,
    method: `先识别问题对象、条件和目标，再把“${concept}”与本章其他概念建立联系。${module.example}`,
    example: module.example,
    pitfall: `只记住“${concept}”的名称而不检查对象、条件、范围和证据，会导致机械套用。`,
  } : concept
  const id=`${group.id}-${String(indexes.module+1).padStart(2,'0')}-${String(indexes.concept+1).padStart(2,'0')}`
  const topicTheme = slug === 'english' ? '../english.css' : '../themes.css'
  return { id, detail, html:`${pageHead(`${detail.title}｜${subject.name}`,detail.explanation,['../learning-base.css',topicTheme])}<body data-subject="${slug}">${header(slug,subject.name)}<main class="math-topic-page"><a class="back-link" href="../index.html#${group.id}">← 返回${group.label}</a><p class="kicker">${escapeHtml(group.label)} / ${escapeHtml(module.title)}</p><h1>${escapeHtml(detail.title)}</h1><p class="topic-meta">${escapeHtml(subject.name)} · ${escapeHtml(module.title)}</p><section class="topic-section"><h2>概念解释</h2><p>${escapeHtml(detail.explanation)}</p></section><section class="topic-section"><h2>核心方法与条件</h2><p>${escapeHtml(detail.method)}</p></section><section class="topic-section formula"><h2>例题或真实案例</h2><p>${escapeHtml(detail.example)}</p></section><section class="topic-section warning"><h2>常见易错点</h2><p>${escapeHtml(detail.pitfall)}</p></section><section class="topic-section"><h2>自检</h2><p>请尝试不用原文解释“${escapeHtml(detail.title)}”，再设计一个属于“${escapeHtml(module.title)}”的实例，并说明适用条件和判断依据。</p></section></main><footer>${subject.name} · 完整知识树与独立知识页</footer></body></html>` }
}

async function renderGeneric(slug, subject) {
  const directory=resolve(root,'sites',slug); const topicsDir=resolve(directory,'topics'); await mkdir(topicsDir,{recursive:true})
  let topicTotal=0
  const groups=[]
  for(const group of subject.groups){
    let groupTopics=0
    const modules=[]
    for(const [moduleIndex,module] of group.modules.entries()){
      const details=[]
      for(const [conceptIndex,concept] of module.concepts.entries()){
        const page=genericTopic(slug,subject,group,module,concept,{module:moduleIndex,concept:conceptIndex})
        await writeFile(resolve(topicsDir,`${page.id}.html`),`${page.html}\n`)
        groupTopics+=1;topicTotal+=1
        details.push(`<details class="concept-detail"><summary>${escapeHtml(page.detail.title)}</summary><div class="concept-copy"><p>${escapeHtml(page.detail.explanation)}</p><p><a href="topics/${page.id}.html">阅读概念解释、方法、案例、易错点与自检 →</a></p></div></details>`)
      }
      const searchConcepts=module.concepts.map(concept=>typeof concept==='string'?concept:`${concept.title} ${concept.explanation}`).join(' ')
      modules.push(`<article class="learning-module" data-search="${escapeHtml(`${module.title} ${module.summary} ${searchConcepts}`)}"><div class="module-index">MODULE ${String(moduleIndex+1).padStart(2,'0')}</div><h3>${escapeHtml(module.title)}</h3><p class="module-summary">${escapeHtml(module.summary)}</p><div class="concept-list">${details.join('')}</div><div class="method"><strong>方法与边界：</strong>${escapeHtml(module.example)}</div></article>`)
    }
    groups.push(`<section class="subject-group learning-section" id="${group.id}" data-group="${group.id}"><div class="group-head"><div><p class="kicker">${group.id}</p><h2>${group.label}</h2><p>${group.description}</p></div><span>${group.modules.length} 章 · ${groupTopics} 个知识点</span></div><div class="module-grid">${modules.join('')}</div></section>`)
  }
  const filters=subject.groups.map(group=>`<button class="filter-button" data-filter="${group.id}">${group.label}</button>`).join('')
  const allModules=subject.groups.flatMap(group=>group.modules).length
  const special=subject.special==='periodic-table'?periodicTable():slug==='english'?vocabularyLab():''
  const introAside=slug==='english'?'<aside class="notebook"><strong>Build a review habit.</strong><p>随机抽词、自测释义、标记生词。刷新页面后进度仍会保留在浏览器中。</p></aside>':`<label class="search-box"><span>搜索章节和知识点</span><input id="subject-search" type="search" placeholder="输入关键词" autocomplete="off"></label>`
  const html=`${pageHead(`${subject.name}知识体系`,subject.intro,['learning-base.css',slug==='english'?'english.css':'themes.css'])}<body data-subject="${slug}">${header(slug,subject.name)}<main class="site-main${slug==='english'?' english-main':''}"><section class="hero"><div><p class="eyebrow">${subject.eyebrow}</p><h1>${subject.name}知识体系</h1><p class="lead">${subject.intro}</p></div>${introAside}</section><div class="stats"><div class="stat"><strong id="visible-count">${allModules}</strong><span>章内容</span></div><div class="stat"><strong>${topicTotal}</strong><span>个独立知识点</span></div><div class="stat"><strong>${subject.groups.length}</strong><span>条学习路径</span></div></div>${slug==='english'?'<label class="search-box"><span>搜索下方英语课程知识</span><input id="subject-search" type="search" placeholder="语法、阅读、写作…"></label>':''}<div class="filter-bar"><button class="filter-button active" data-filter="all">全部</button>${filters}</div>${special}<div id="subject-content">${groups.join('')}</div><p id="empty-state" class="empty-state" hidden>没有匹配内容，请尝试更短的关键词。</p></main><footer>${subject.name} · 课程知识、方法与复习工具</footer><script src="learning.js"></script>${subject.special==='periodic-table'?'<script src="elements.js"></script>':''}${slug==='english'?'<script src="vocabulary.js"></script>':''}</body></html>`
  await writeFile(resolve(directory,'index.html'),`${html}\n`)
  await copyFile(resolve(root,'sites/shared/learning-base.css'),resolve(directory,'learning-base.css'))
  await copyFile(resolve(root,`sites/shared/${slug==='english'?'english.css':'themes.css'}`),resolve(directory,slug==='english'?'english.css':'themes.css'))
  await copyFile(resolve(root,'sites/shared/learning.js'),resolve(directory,'learning.js'))
  if(subject.special==='periodic-table') await copyFile(resolve(root,'sites/shared/elements.js'),resolve(directory,'elements.js'))
  if(slug==='english') await copyFile(resolve(root,'sites/shared/vocabulary.js'),resolve(directory,'vocabulary.js'))
  if(slug==='english') await copyFile(resolve(root,'LICENSES/ECDICT-MIT.txt'),resolve(directory,'ECDICT-LICENSE.txt'))
}

async function renderMath() {
  const slug='math',directory=resolve(root,'sites/math'),topicsDir=resolve(directory,'topics');await mkdir(topicsDir,{recursive:true})
  let chapterTotal=0,topicTotal=0;const sections=[],toc=[];const flat=[]
  for(const [sectionIndex,section] of mathCurriculum.entries()){
    const sectionId=`section-${String(sectionIndex+1).padStart(2,'0')}`;toc.push(`<a href="#${sectionId}">${section.label}</a>`);const chapters=[]
    for(const [chapterIndex,chapter] of section.chapters.entries()){
      chapterTotal+=1;const links=[]
      for(const [topicIndex,topic] of chapter.topics.entries()){
        topicTotal+=1;const id=`m${String(sectionIndex+1).padStart(2,'0')}-${String(chapterIndex+1).padStart(2,'0')}-${String(topicIndex+1).padStart(2,'0')}`;flat.push({id,topic,section,chapter})
        links.push(`<a class="topic-link" data-search="${escapeHtml(`${topic.title} ${topic.explanation} ${topic.rule} ${topic.formula}`)}" href="topics/${id}.html"><b>${String(topicIndex+1).padStart(2,'0')}</b><span>${escapeHtml(topic.title)}</span></a>`)
      }
      chapters.push(`<article class="math-chapter"><h3>${escapeHtml(chapter.title)}</h3><p class="chapter-summary">${escapeHtml(chapter.summary)}</p><div class="topic-index">${links.join('')}</div></article>`)
    }
    sections.push(`<section class="math-section" id="${sectionId}" data-stage="${section.stage}"><div class="math-section-head"><h2>${section.label}</h2><span>${section.chapters.length} 章 · ${section.chapters.reduce((n,c)=>n+c.topics.length,0)} 个知识点</span></div>${chapters.join('')}</section>`)
  }
  for(const [index,item] of flat.entries()){
    const previous=flat[index-1],next=flat[index+1]
    const sectionsHtml=[['概念解释',item.topic.explanation,''],['核心规律与条件',item.topic.rule,''],['公式与符号',item.topic.formula||'本知识点以概念关系和推理为主，没有需要孤立背诵的单一公式。','formula'],['例题或应用',item.topic.example,''],['常见易错点',item.topic.pitfall,'warning'],['自检问题',`请尝试解释“${item.topic.title}”解决什么问题、成立需要哪些条件，并仿照例子完成一个同类问题。`,'']]
    const body=sectionsHtml.map(([title,copy,type])=>`<section class="topic-section ${type}"><h2>${title}</h2><p>${escapeHtml(copy)}</p></section>`).join('')
    const html=`${pageHead(`${item.topic.title}｜数学`,item.topic.explanation,['../learning-base.css','../math.css'])}<body data-subject="math">${header('math','数学')}<main class="math-topic-page"><a class="back-link" href="../index.html">← 返回数学知识树</a><p class="kicker">${escapeHtml(item.section.label)} / ${escapeHtml(item.chapter.title)}</p><h1>${escapeHtml(item.topic.title)}</h1><p class="topic-meta">${escapeHtml(item.chapter.summary)}</p>${body}<nav class="topic-nav">${previous?`<a href="${previous.id}.html">← ${escapeHtml(previous.topic.title)}</a>`:'<span></span>'}${next?`<a href="${next.id}.html">${escapeHtml(next.topic.title)} →</a>`:''}</nav></main><footer>数学 · 概念、条件、公式、例题与易错点</footer></body></html>`
    await writeFile(resolve(topicsDir,`${item.id}.html`),`${html}\n`)
  }
  const html=`${pageHead('数学知识体系','覆盖初中、高中及拓展数学的完整知识树，每个知识点有独立详细页面。',['learning-base.css','math.css'])}<body data-subject="math">${header('math','数学')}<div class="math-layout"><aside class="math-toc"><strong>MATHEMATICS INDEX</strong>${toc.join('')}</aside><main class="math-main"><section class="hero"><div><p class="eyebrow">MATHEMATICS / STRUCTURE & PROOF</p><h1>数学知识体系</h1><p class="lead">覆盖初中、高中课程主线，并包含极坐标、参数方程、微积分和线性代数拓展。每个知识点均有概念、条件、公式、例题和易错点。</p></div><label class="search-box"><span>搜索 227 个知识点</span><input id="math-search" type="search" placeholder="例如：极坐标、韦达定理"></label></section><div class="stats"><div class="stat"><strong>${mathCurriculum.length}</strong><span>条学习路径</span></div><div class="stat"><strong>${chapterTotal}</strong><span>个章节</span></div><div class="stat"><strong id="math-visible">${topicTotal}</strong><span>个知识点</span></div></div><div id="math-content">${sections.join('')}</div><p id="math-empty" class="empty-state" hidden>没有匹配的知识点。</p></main></div><footer>数学 · 完整课程知识树与拓展专题</footer><script src="math.js"></script></body></html>`
  await writeFile(resolve(directory,'index.html'),`${html}\n`)
  await copyFile(resolve(root,'sites/shared/learning-base.css'),resolve(directory,'learning-base.css'))
  await copyFile(resolve(root,'sites/shared/math.css'),resolve(directory,'math.css'))
  await copyFile(resolve(root,'sites/shared/math.js'),resolve(directory,'math.js'))
}

await renderMath()
for(const [slug,subject] of Object.entries(subjects)) if(slug!=='math') await renderGeneric(slug,subject)
console.log(`Generated mathematics and ${Object.keys(subjects).length-1} subject sites`)
