import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

// Manual asset-generation utility. The checked-in Natural Earth land data is
// public domain; it is never used as a historical polity boundary.
const root = resolve(import.meta.dirname, '../..')
const input = resolve(root, 'docs/design/assets/ne_110m_land.geojson')
const output = resolve(root, 'sites/history/assets/world-land.svg')
const data = JSON.parse(await readFile(input, 'utf8'))
const rivers = JSON.parse(await readFile(resolve(root, 'docs/design/assets/ne_110m_rivers_lake_centerlines.geojson'), 'utf8'))
const lakes = JSON.parse(await readFile(resolve(root, 'docs/design/assets/ne_110m_lakes.geojson'), 'utf8'))
if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) throw new Error('Natural Earth FeatureCollection required')
if (rivers.type !== 'FeatureCollection' || lakes.type !== 'FeatureCollection') throw new Error('Natural Earth physical layers required')

const width = 1200, height = 600
const xy = ([longitude, latitude]) => `${((longitude + 180) / 360 * width).toFixed(1)},${((90 - latitude) / 180 * height).toFixed(1)}`
const ringPath = ring => `M${ring.map(xy).join('L')}Z`
const shapes = []
for (const feature of data.features) {
  const geometry = feature.geometry
  if (geometry?.type === 'Polygon') shapes.push(geometry.coordinates.map(ringPath).join(''))
  if (geometry?.type === 'MultiPolygon') for (const polygon of geometry.coordinates) shapes.push(polygon.map(ringPath).join(''))
}
const meridians = [-120, -60, 0, 60, 120].map(longitude => `<path d="M${((longitude + 180) / 360 * width).toFixed(1)} 0V${height}"/>`).join('')
const parallels = [-60, -30, 0, 30, 60].map(latitude => `<path d="M0 ${((90 - latitude) / 180 * height).toFixed(1)}H${width}"/>`).join('')
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
<title id="title">世界现代海岸线参考图</title>
<desc id="desc">由 Natural Earth 1:110m land 公共领域数据转换；仅用于地理定位，不表示历史政权或公元 1000 年疆界。</desc>
<g fill="none" stroke="#87ada6" stroke-width="0.7" opacity="0.23">${meridians}${parallels}</g>
<g fill="#315852" fill-rule="evenodd" stroke="#78988c" stroke-width="0.65" opacity="0.95">${shapes.map(path => `<path d="${path}"/>`).join('')}</g>
</svg>\n`
await mkdir(resolve(root, 'sites/history/assets'), { recursive: true })
await writeFile(output, svg)
console.log(`Wrote ${output} from ${data.features.length} Natural Earth features.`)

// The explore workbench has its own cartography, keeping the existing homepage
// illustration unchanged. All three layers are present-day geography.
const linePath = line => `M${line.map(xy).join('L')}`
const riverPaths = rivers.features.flatMap(feature => {
  const geometry = feature.geometry
  if (geometry?.type === 'LineString') return [linePath(geometry.coordinates)]
  if (geometry?.type === 'MultiLineString') return geometry.coordinates.map(linePath)
  return []
})
const lakePaths = lakes.features.flatMap(feature => {
  const geometry = feature.geometry
  if (geometry?.type === 'Polygon') return [geometry.coordinates.map(ringPath).join('')]
  if (geometry?.type === 'MultiPolygon') return geometry.coordinates.map(polygon => polygon.map(ringPath).join(''))
  return []
})
const exploreSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
<title id="title">现代世界地理参考底图</title>
<desc id="desc">Natural Earth 1:110m 陆地、湖泊和河流的公共领域数据。此图没有历史疆域。</desc>
<defs>
  <linearGradient id="ocean" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#153944"/><stop offset=".56" stop-color="#0b2b38"/><stop offset="1" stop-color="#071c29"/></linearGradient>
  <linearGradient id="land" x1=".15" x2=".92" y1=".05" y2=".95"><stop stop-color="#567a69"/><stop offset=".52" stop-color="#386154"/><stop offset="1" stop-color="#294b45"/></linearGradient>
  <filter id="coast-depth" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#020d16" flood-opacity=".8"/></filter>
</defs>
<rect width="${width}" height="${height}" fill="url(#ocean)"/>
<g fill="none" stroke="#8ea89b" stroke-width=".55" opacity=".19">${meridians}${parallels}</g>
<g fill="url(#land)" fill-rule="evenodd" stroke="#98b6a2" stroke-width=".9" filter="url(#coast-depth)">${shapes.map(path => `<path d="${path}"/>`).join('')}</g>
<g fill="#0d4251" fill-rule="evenodd" stroke="#8bb9b0" stroke-width=".45" opacity=".88">${lakePaths.map(path => `<path d="${path}"/>`).join('')}</g>
<g fill="none" stroke="#8fc0b5" stroke-width="1.15" stroke-linejoin="round" stroke-linecap="round" opacity=".65">${riverPaths.map(path => `<path d="${path}"/>`).join('')}</g>
</svg>\n`
const exploreOutput = resolve(root, 'sites/history/assets/explore-basemap.svg')
await writeFile(exploreOutput, exploreSvg)
console.log(`Wrote ${exploreOutput} from ${data.features.length} land, ${rivers.features.length} river and ${lakes.features.length} lake features.`)
