(() => {
  const input=document.querySelector('#math-search'),links=[...document.querySelectorAll('.topic-link')],counter=document.querySelector('#math-visible'),empty=document.querySelector('#math-empty')
  const normalize=value=>value.trim().toLocaleLowerCase('zh-CN')
  function refresh(){const query=normalize(input?.value||'');let count=0;links.forEach(link=>{const show=!query||normalize(link.dataset.search||link.textContent).includes(query);link.hidden=!show;if(show)count+=1});document.querySelectorAll('.math-chapter').forEach(ch=>ch.hidden=!ch.querySelector('.topic-link:not([hidden])'));document.querySelectorAll('.math-section').forEach(section=>section.hidden=!section.querySelector('.math-chapter:not([hidden])'));counter.textContent=String(count);empty.hidden=count>0}
  input?.addEventListener('input',refresh);refresh()
})()
