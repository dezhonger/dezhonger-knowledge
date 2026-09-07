# 英语内容维护指南

本目录是英语站唯一的人工维护内容来源。站点采用独立的 English Learning 品牌；页面不显示 Dezhonger，也不链接其他 dezhonger.com 站点。

## 内容格式

- `taxonomy.json`：阶段、主题、语法分类、表达场景、词性、标签与难度的集中定义。
- `vocabulary/*.jsonl`：一行一个完整 JSON 词条，公开词表按字母分片；`food.jsonl` 收录本次新增的水果与蔬菜主题词。
- `vocabulary/<slug>.json`：精编词条，一词一文件。它们与 JSONL 分片互斥，不重复保存同一个词。
- `grammar/<slug>/index.md`：语法主题元数据与公共正文；同目录其他 Markdown 是不同学习深度。
- `expressions/<slug>.json`：一表达一份，中英文本、场景和相关表达通过 ID 关联。
- `sources.json`：外部数据源的固定 revision、文件名与 SHA-256。
- `vocabulary-report.json`：此次完整词表导入的覆盖数量及口音缺项清单。

完整类型见 `scripts/english/types.d.ts`。构建时验证重复 ID、重复单词、分类引用、树循环和例句字段，不允许同一条内容按分类复制多份。

## 日常编辑

新增少量单词可复制 `apple.json`，修改 id、word、senses、levelIds、topicIds，文件名与 id 一致。id 为小写 ASCII slug；保留路径的普通单词使用已有映射，如 index 为 `word-index`。

编辑既有导入词时，找到对应 JSONL 的单行，并设置 `editorial: true`，让以后重新导入时保留人工补充。少量精编词也可以移到独立 `<id>.json`，同时从原分片删除；两种存储方式不能重复保存同一词。导入脚本会保留独立 JSON 和标为 editorial 的 JSONL 记录，并补充公开词表归属。

`senses` 按词性组织，中文必填，英文与例句可选。无内容的可选字段直接省略，不使用空字符串或虚构例句。`pronunciation.uk/us.ipa` 是对应口音，`variants` 保存其他读音；`reference` 仅在无法确认口音时保存通用参考音标。缺失英美音标不能互相复制凑齐。两种口音的发音按钮仍可使用设备语音。

主题树用 parentId 支持任意层级。查询父分类自动包含后代并去重；不必在每个词中重复填写所有祖先。表达的 sceneIds 可跨亲子、工作、日常。语法主题阶段从深度层 levelIds 汇总，主题只拥有一个详情 URL。

批量新增内容后同步更新导入报告的数量统计，再运行测试。报告中 sourceCount/sourceIncluded 表示固定来源的覆盖情况，不要把自行新增词混入这两项。

## 词表范围

| 分类 | 来源 | 来源条目 | 当前收录（含少量精编补充） |
| --- | --- | ---: | ---: |
| 幼儿 | Dolch Pre-primer + Primer + Nouns | 187 | 190 |
| 小学 | Fry 1000 | 1,000 | 1,004 |
| 初中 | ECDICT zk | 1,603 | 1,606 |
| 高中 | ECDICT gk | 3,677 | 3,678 |
| CET4 | ECDICT cet4 | 3,849 | 3,849 |
| CET6 | ECDICT cet6 | 5,407 | 5,408 |
| IELTS | ECDICT ielts | 5,040 | 5,042 |
| TOEFL | ECDICT toefl | 6,974 | 6,975 |

总共 11,901 个去重词条。所有指定源词表均完整纳入。“完整”指覆盖这些固定版本的公开词表，不表示所有地区、教材或考试存在一个官方唯一词汇大纲。

释义来源为 MIT 许可的 ECDICT；词表和音标分别来自 MIT 许可的 Words with Toddlers 与 IPA Dict。独立精编条目及高频功能词做了补充与纠正。源词典仍可能有多义、专业义或陈旧释义，不能声称全部经过逐词人工教学审校。

英式音标覆盖 10,733 个词，美式覆盖 11,189 个词，两者都有的为 10,450 个。剩余缺项保留清单，不伪造读音。

## 水果与蔬菜补充

2026-09-07 根据用户提供的两份词汇清单新增 405 条、补充已有 73 条。水果分类 244 条、蔬菜分类 243 条，包含食材、加工品和相关描述词；共享 9 条，父分类自动去重。详细整理范围与译名校正见 [food-vocabulary-notes.md](food-vocabulary-notes.md)。这些主题补充不改变八个固定词表的覆盖统计；新增词未随意指定考试等级。

未标明口音的清单音标仅保存为 reference；能在固定版 IPA Dict 中匹配的英美读音分别补充，不能确定时不互相复制。

## 重新导入

普通构建完全离线使用仓库内容，不下载词典。只有明确刷新数据时才运行：

```bash
npm run import:english -- /path/to/source-cache
```

缓存文件由 `sources.json` 指定：ECDICT CSV、13 份 Dolch/Fry 文本、en_UK.txt 与 en_US.txt。下载地址分别是对应 repository/revision 下的 `ecdict.csv`、`shared/word_lists/<file>`、`data/<file>`。脚本逐个检查 SHA-256，然后导入全部标签记录、关联音标、合并精编条目并输出覆盖报告。上游版本升级时先更新来源文件与校验值，再审查差异。

本地已下载的缓存位于 `.cache/english-sources/`，不进入 Git 或 Docker。许可文本保存在 `LICENSES/` 并随网站发布到词表来源页。

## 开发与检查

```bash
npm run dev:english       # 生成并启动 http://127.0.0.1:5176
npm run check:english     # JS/CSS 语法与内容模型
npm run test:english      # 自动生成后运行测试
npm run build:english     # 校验、生成、检查全部页面与链接
npm run build:all         # 整个内容站构建链
```

`sites/english/` 是可再生输出，已从 Git 和 Docker 输入上下文排除；Docker builder 会从内容源重新生成，并将产物复制进最终 Nginx 镜像。不要手工维护这些 HTML。

## 随机背词

`/vocabulary/practice` 支持八个词表、1–500 的整数数量、组内不重复抽取。小词表不足指定数量时抽取全部词并说明实际数量。默认不显示中文释义，逐条点击显示/隐藏；重新抽词清空上一组的显示状态。

大组每页 25 个，分页保持本组抽样与已揭晓状态。刷新页面保留 URL 中的词表/数量，不保存长期学习记录。发音复用统一 speech.js 服务，不接付费 TTS 或词典音频。

## 页面缓存与词库地址

首页仅显示单词、语法和常用表达三个入口。旧页面不继续发布，`/index.html` 跳转到当前首页，首页响应禁止存储旧版本。

新版客户端从 `/data/practice.v1.json`、`/data/search.v1.json` 读取数据，每次加载重新验证缓存。旧版缓存脚本请求的 `/vocabulary.json` 由同一份当前词库生成适配数据；上一版带资源哈希的两个 JSON 地址也转到稳定数据地址。这里保留的是数据契约，不是旧页面或另一套内容源。
