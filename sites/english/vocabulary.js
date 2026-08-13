(() => {
  const list = document.querySelector('#word-list')
  if (!list) return
  const tabs = [...document.querySelectorAll('[data-exam]')]
  const count = document.querySelector('#word-count')
  const draw = document.querySelector('#draw-words')
  const reveal = document.querySelector('#toggle-meanings')
  const reviewOnly = document.querySelector('#review-only')
  const progress = document.querySelector('#study-progress')
  const status = document.querySelector('#vocab-status')
  let activeExam = 'cet4'
  let concealed = false
  let data
  let current = []
  const reviewKey = 'dezhonger-english-review-v1'
  const knownKey = 'dezhonger-english-known-v1'
  const getSet = (key) => new Set(JSON.parse(localStorage.getItem(key) || '[]'))
  const saveSet = (key, set) => localStorage.setItem(key, JSON.stringify([...set]))
  const escape = (value) => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')
  const shuffle = (items) => { const copy=[...items]; for(let i=copy.length-1;i>0;i-=1){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]]} return copy }

  function render() {
    const review = getSet(reviewKey), known = getSet(knownKey)
    list.innerHTML = current.map((entry,index) => {
      const [word,phonetic,pos,translation,tags]=entry
      return `<article class="word-card" data-word="${escape(word)}"><div class="word-number">${String(index+1).padStart(2,'0')}</div><div><div class="word-title"><h3>${escape(word)}</h3><span class="phonetic">/${escape(phonetic)}/</span><span class="pos">${escape(pos)}</span></div><p class="word-translation${concealed?' concealed':''}">${escape(translation)}</p><div class="word-tags">${tags.map(tag=>`<span>${escape(tag)}</span>`).join('')}</div><div class="word-actions"><button data-action="speak" aria-label="朗读 ${escape(word)}">朗读</button><button data-action="known"${known.has(word)?' class="active"':''}>认识</button><button data-action="review"${review.has(word)?' class="active"':''}>稍后复习</button></div></div></article>`
    }).join('')
    progress.textContent=`本组 ${current.length} 个 · 生词本 ${review.size} 个 · 已认识 ${known.size} 个`
  }
  async function load() {
    if (data) return data
    status.textContent='正在加载词库…'
    const response=await fetch('vocabulary.json')
    if(!response.ok) throw new Error(`HTTP ${response.status}`)
    data=await response.json(); status.textContent='词库已就绪'; return data
  }
  async function drawWords(reviewMode=false) {
    try {
      await load()
      const amount=Math.max(1,Math.min(200,Number.parseInt(count.value,10)||50)); count.value=String(amount)
      let indexes=data.lists[activeExam]||[]
      if(reviewMode){const saved=getSet(reviewKey);indexes=indexes.filter(i=>saved.has(data.words[i][0]))}
      current=shuffle(indexes).slice(0,amount).map(i=>data.words[i])
      concealed=false; reveal.textContent='隐藏释义'; render()
      status.textContent=reviewMode?`从生词本抽取 ${current.length} 个`:`${activeExam.toUpperCase()} 随机抽取 ${current.length} 个`
    } catch(error) { status.textContent=`词库加载失败：${error.message}` }
  }
  tabs.forEach(tab=>tab.addEventListener('click',()=>{activeExam=tab.dataset.exam;tabs.forEach(x=>x.classList.toggle('active',x===tab));drawWords()}))
  draw.addEventListener('click',()=>drawWords())
  reviewOnly.addEventListener('click',()=>drawWords(true))
  reveal.addEventListener('click',()=>{concealed=!concealed;reveal.textContent=concealed?'显示释义':'隐藏释义';render()})
  list.addEventListener('click',(event)=>{
    const button=event.target.closest('button'); const card=event.target.closest('.word-card'); if(!button||!card)return
    const word=card.dataset.word; const action=button.dataset.action
    if(action==='speak'&&'speechSynthesis'in window){speechSynthesis.cancel();speechSynthesis.speak(new SpeechSynthesisUtterance(word));return}
    const key=action==='known'?knownKey:reviewKey; const set=getSet(key);set.has(word)?set.delete(word):set.add(word);saveSet(key,set);render()
  })
  drawWords()
})()
