# 地理素材登记

| 文件 | 原始数据 | 作者与许可 | 本站处理 | 限制 |
| --- | --- | --- | --- | --- |
| `sites/history/assets/world-land.svg` | [Natural Earth 1:110m land GeoJSON](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson)，2026-11-11 获取；[官方网站](https://www.naturalearthdata.com/downloads/110m-physical-vectors/110m-land/) | Tom Patterson、Nathaniel Vaughn Kelso 及贡献者；[公共领域](https://www.naturalearthdata.com/about/terms-of-use/)，允许修改与再发布。 | 只投影并简化为本站配色的海岸线 SVG，保留数据来源说明。 | 现代地理参考；**不表示公元 1000 年海岸或历史疆域**，不得作为政权边界依据。 |
| `sites/history/assets/summer-mountains-met.jpg` | [大都会艺术博物馆馆藏 39915《Summer Mountains》](https://www.metmuseum.org/art/collection/search/39915)，原图来自[馆方开放 API](https://collectionapi.metmuseum.org/public/collection/v1/objects/39915) | 传屈鼎，约 1050 年；馆藏页标记 Public Domain，馆方[开放获取政策](https://www.metmuseum.org/policies/image-resources)以 CC0 提供公共领域作品图像，允许修改与再发布。 | 从馆方原图缩放到 1600×640，JPEG 质量 82；本站文件 SHA-256 `878ce0bba40da4885766e1269ff28e55ffc8a1a2b5edc356ccb2bbfad062cc8a`。 | 仅作北宋艺术馆藏，不代表公元 1000 年事件现场、疆域或人物画像。 |

原始 GeoJSON 保存在 `docs/design/assets/ne_110m_land.geojson`，SHA-256 为 `9e0729ee253ca7d7a5c4ae9395fb1902264c5377c52e224d13dd85010e2835d9`。本站 SVG 由 `node scripts/history/generate-basemap.mjs` 生成，构建与运行均无需联网。

当前没有获授权的历史人物画像或历史疆域图片。详情页使用数据驱动的时间图及明确的待核验状态。
