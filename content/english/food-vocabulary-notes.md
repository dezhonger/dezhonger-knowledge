# 水果与蔬菜词汇整理

整理日期：2026-09-07。

## 收录范围

根据用户提供的《总结水果英语词汇》《总结蔬菜英语单词》两份对话清单整理。计数按英文拼写去重，不把同一词在不同章节的重复出现算作新增内容，也不把词汇条数当作物种数。

| 范围 | 去重词条 | 内容 |
| --- | ---: | --- |
| 水果 | 244 | 水果名、加工品、果实部位、口感和成熟状态等 |
| 蔬菜 | 243 | 蔬菜名、菌菇、香草、海藻和易混名称等 |
| 两类合计 | 478 | 9 个词同时出现在两类中 |
| 新增记录 | 405 | 保存在 `vocabulary/food.jsonl` |
| 补充既有记录 | 73 | 在原文件中补充分类、食物义或相关词，保留原 ID 和学习阶段 |

清单中总称 fruit、vegetable 和段落提到的 Welsh onion 也已纳入。重复总结段落不会另外创建词条。açaí、jalapeño 保留原拼写，说明中包含 acai、jalapeno，便于普通键盘搜索。

## 分类与内容维护

入口为食物 → 水果、食物 → 蔬菜，各自再按原清单内容细分。分类使用稳定 ID 和 parentId；同一个词可关联多个子类，父分类查询自动去重。果实部位、口感和易混名称有独立子类，避免与水果、蔬菜名称混在一个无分组的大清单中。

tomato、cucumber 等保留“植物学果实”与“烹饪蔬菜”的两种入口。分类为学习浏览服务，不是严格的植物分类学体系。例如根菜组包含作为地下茎的莲藕，菌菇组明确标注属于真菌。

同拼写的多义词保留一条记录，食物义置于前面，原有其他义项继续保留。例如 date 保留日期义、rocket 保留火箭义。英美地区名称如 eggplant / aubergine、arugula / rocket 是不同拼写的词条，通过 synonyms 链接。

这些记录设置 `editorial: true`，以后运行词表导入时保留人工补充。主题清单不等于考试大纲，未给新增词编造八个阶段归属。固定来源的 sourceCount/sourceIncluded 保持原值。

## 译名校正

原清单作为词汇范围来源，少量易混名称经校正后收录：

- Buddha's hand 为佛手（指状香橼），与 bergamot（香柠檬，常称佛手柑）不同。[加州大学柑橘品种资料](https://citrusvariety.ucr.edu/crc3768)
- rose apple 指蒲桃 Syzygium jambos；wax apple / Java apple 通常指莲雾 Syzygium samarangense；water apple 指水蒲桃 Syzygium aqueum。[新加坡国家公园局蒲桃资料](https://www.nparks.gov.sg/florafaunaweb/flora/3/1/3161)、[蒲桃属资料](https://www.nparks.gov.sg/news/news-detail/evolution-and-speciation-patterns-of-the-world%27s-largest-tree-genus-syzygium-identified-after-a-two-year-study-involving-over-60-local-and-international-collaborators)
- ambarella 指 Spondias dulcis 的果实，不直接沿用“南酸枣”译名。[佛罗里达大学 Spondias 资料](https://edis.ifas.ufl.edu/publication/MG059/pdf)
- rapini / broccoli rabe 是 Brassica rapa 的叶菜类型，与芜菁近缘，不是西兰花幼苗或中国芥蓝。[加州大学园艺资料](https://ucanr.edu/site/mg-sonoma/rapini-broccoli-raab)
- yucca 是丝兰；yuca 是木薯 cassava 的另一名称。两者不合并成同一食材。[佛罗里达大学木薯资料](https://blogs.ifas.ufl.edu/jacksonco/2017/06/09/cassava-a-crop-for-the-back-forty/)

同时补充 prune 的干果含义，区分 chives 与 garlic chives，并在 morning glory、pawpaw、Chinese cabbage 等地区用法较多的通称中注明语境。

## 音标与发音

已有词保留原音标。新增词优先逐口音匹配仓库固定版本的 IPA Dict，来源与 MIT 许可沿用 `sources.json` 和 `LICENSES/`。basil 按香草词义采用清单明确给出的英美读音；Welsh onion 补充短语参考音标。其余清单中未标明口音的音标存为 reference，不伪装成两种口音都经过核对。

英美发音按钮沿用现有 Web Speech API，朗读英文词语本身。主题补充不增加在线词典或音频服务依赖。罕见地方名称仍可能有不同读法与译名，可继续在同一记录中精编。
