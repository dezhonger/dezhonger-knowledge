import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

// Manual asset-generation utility. The checked-in Natural Earth land data is
// public domain; it is never used as a historical polity boundary.
const root = resolve(import.meta.dirname, '../..')
const input = resolve(root, 'docs/design/assets/ne_110m_land.geojson')
const output = resolve(root, 'sites/history/assets/world-land.svg')
const data = JSON.parse(await readFile(input, 'utf8'))
if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) throw new Error('Natural Earth FeatureCollection required')

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
