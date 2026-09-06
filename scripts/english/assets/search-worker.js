import { fetchDocuments, prepareDocuments, searchDocuments, resultPage } from './search.js'
let index
async function getIndex() {
  if (!index) index = fetchDocuments().then(prepareDocuments).catch(error => { index = null; throw error })
  return index
}
self.addEventListener('message', async ({ data }) => {
  try {
    const prepared = await getIndex()
    self.postMessage({ request: data.request, ...resultPage(searchDocuments(prepared, data.q, data.type), data.page) })
  } catch {
    self.postMessage({ request: data.request, error: '搜索内容暂时加载失败，请重试。' })
  }
})
