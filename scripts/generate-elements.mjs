import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const source = process.env.PERIODIC_TABLE_SOURCE || '/tmp/periodic-table.json'
const payload = JSON.parse(await readFile(source, 'utf8'))
const names = ['氢','氦','锂','铍','硼','碳','氮','氧','氟','氖','钠','镁','铝','硅','磷','硫','氯','氩','钾','钙','钪','钛','钒','铬','锰','铁','钴','镍','铜','锌','镓','锗','砷','硒','溴','氪','铷','锶','钇','锆','铌','钼','锝','钌','铑','钯','银','镉','铟','锡','锑','碲','碘','氙','铯','钡','镧','铈','镨','钕','钷','钐','铕','钆','铽','镝','钬','铒','铥','镱','镥','铪','钽','钨','铼','锇','铱','铂','金','汞','铊','铅','铋','钋','砹','氡','钫','镭','锕','钍','镤','铀','镎','钚','镅','锔','锫','锎','锿','镄','钔','锘','铹','𬬻','𬭊','𬭳','𬭛','𬭶','鿏','𫟼','𬬭','鿔','鿭','鈇','镆','鉝','鿬','鿫']
const positions = [
  [1,1],[1,18],[2,1],[2,2],[2,13],[2,14],[2,15],[2,16],[2,17],[2,18],
  [3,1],[3,2],[3,13],[3,14],[3,15],[3,16],[3,17],[3,18],
  [4,1],[4,2],[4,3],[4,4],[4,5],[4,6],[4,7],[4,8],[4,9],[4,10],[4,11],[4,12],[4,13],[4,14],[4,15],[4,16],[4,17],[4,18],
  [5,1],[5,2],[5,3],[5,4],[5,5],[5,6],[5,7],[5,8],[5,9],[5,10],[5,11],[5,12],[5,13],[5,14],[5,15],[5,16],[5,17],[5,18],
  [6,1],[6,2],[8,4],[8,5],[8,6],[8,7],[8,8],[8,9],[8,10],[8,11],[8,12],[8,13],[8,14],[8,15],[8,16],[8,17],[8,18],[6,4],[6,5],[6,6],[6,7],[6,8],[6,9],[6,10],[6,11],[6,12],[6,13],[6,14],[6,15],[6,16],[6,17],[6,18],
  [7,1],[7,2],[9,4],[9,5],[9,6],[9,7],[9,8],[9,9],[9,10],[9,11],[9,12],[9,13],[9,14],[9,15],[9,16],[9,17],[9,18],[7,4],[7,5],[7,6],[7,7],[7,8],[7,9],[7,10],[7,11],[7,12],[7,13],[7,14],[7,15],[7,16],[7,17],[7,18],
]
const categoryMap = {
  'Nonmetal': 'nonmetal', 'Noble gas': 'noble', 'Alkali metal': 'alkali',
  'Alkaline earth metal': 'alkaline', 'Metalloid': 'metalloid', 'Halogen': 'halogen',
  'Transition metal': 'transition', 'Post-transition metal': 'post-transition',
  'Lanthanide': 'lanthanide', 'Actinide': 'actinide',
}
const stateMap = { Gas: '气体', Liquid: '液体', Solid: '固体', Expected: '推测' }
const description = {
  nonmetal: '典型非金属元素，成键和反应性质与价电子结构密切相关。', noble: '稀有气体元素，价电子层相对稳定。',
  alkali: '碱金属元素，最外层通常只有一个电子，化学性质活泼。', alkaline: '碱土金属元素，常形成 +2 氧化态。',
  metalloid: '类金属元素，性质介于金属和非金属之间。', halogen: '卤素元素，常形成 −1 氧化态并具有较强反应性。',
  transition: '过渡金属元素，常具有多种氧化态并形成配合物。', 'post-transition': '后过渡金属，兼具金属特征与较丰富的成键方式。',
  lanthanide: '镧系元素，4f 电子逐步填充，性质彼此相近。', actinide: '锕系元素，多数具有放射性。',
}

const rows = payload.Table.Row.map((row, index) => {
  const cell = row.Cell
  const category = categoryMap[cell[15]] || 'post-transition'
  const [period, group] = positions[index]
  return {
    number: Number(cell[0]), symbol: cell[1], name: names[index], english: cell[2], mass: cell[3],
    electron: cell[5] || '—', oxidation: cell[10] || '—', state: stateMap[cell[11]] || cell[11] || '未知',
    category, period, group, description: description[category],
  }
})

const script = `(() => {
  const elements = ${JSON.stringify(rows)}
  const table = document.querySelector('#periodic-table')
  const detail = document.querySelector('#element-detail')
  if (!table || !detail) return
  const renderDetail = (element) => {
    detail.querySelector('.detail-number').textContent = element.number
    detail.querySelector('.detail-symbol').textContent = element.symbol
    detail.querySelector('h3').textContent = element.name + ' · ' + element.english
    detail.querySelector('p').textContent = element.description + ' 标准状态：' + element.state + '。'
    const values = detail.querySelectorAll('dd')
    values[0].textContent = element.mass
    values[1].textContent = element.electron
    values[2].textContent = element.oxidation
  }
  elements.forEach((element) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'element'
    button.dataset.category = element.category
    button.style.gridRow = element.period
    button.style.gridColumn = element.group
    button.innerHTML = '<small>' + element.number + '</small><strong>' + element.symbol + '</strong><span>' + element.name + '</span>'
    button.title = element.name + ' / ' + element.english
    button.addEventListener('click', () => {
      document.querySelectorAll('.element.selected').forEach((node) => node.classList.remove('selected'))
      button.classList.add('selected')
      renderDetail(element)
    })
    table.append(button)
  })
  document.querySelectorAll('[data-element-filter]').forEach((button) => button.addEventListener('click', () => {
    const category = button.dataset.elementFilter
    document.querySelectorAll('[data-element-filter]').forEach((node) => node.classList.toggle('active', node === button))
    document.querySelectorAll('.element').forEach((node) => node.classList.toggle('dimmed', category !== 'all' && node.dataset.category !== category))
  }))
  renderDetail(elements[0])
})()
`

await writeFile(resolve(root, 'sites/shared/elements.js'), script)
console.log(`Generated ${rows.length} elements from PubChem periodic table data`)
