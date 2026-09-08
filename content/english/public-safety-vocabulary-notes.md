# 犯罪与公共安全词汇整理

整理日期：2026-09-08。依据用户提供的本地对话词汇清单整理。

来源文件 SHA-256：`0636d4b91ed3734aeaf33eb2c236809b7b87caa08e895315008291d12f1371b0`。

## 收录范围

新增主题：社会 → 犯罪与公共安全（Crime & Public Safety），稳定 ID 为 `crime-public-safety`。

清单中 405 行词汇经大小写和重复出现归一后，共 388 个词条：新增 168 条、补充已有 220 条，全站词库增至 12,812 条。首表中的 13 个事件名称全部纳入，也关联“安防监控”入口。

分组沿用对话内容：犯罪与安全基础、盗窃与财产犯罪、欺诈与经济犯罪、暴力与人身伤害、绑架威胁与骚扰、非法闯入与可疑行为、破坏与纵火、公共秩序、毒品与违禁品、武器、警察与执法、调查与证据、法院与司法、监狱与刑罚、安防监控、事故与应急安全、道路安全、网络犯罪。

## 数据维护

- 新词存于 `vocabulary/public-safety.jsonl`，已有词在原文件中补充，并设置 `editorial: true`。重新导入固定词表时保留这些编辑。
- 单词通过 `topicIds` 关联多个入口，父主题查询自动去重。`senses[].topicIds` 对应具体语境的释义；battery、cell、charge、stalk 等保留原义并增加本主题用法。
- `n./v.` 等混合标注拆成独立词性和释义，如 risk 的名词“风险”和动词“冒险”、criminal 的名词“犯罪者”和形容词“犯罪的”。显示仍使用集中定义的英文缩写。
- `break-in` 与 `break in` 分别为名词和短语动词，使用 `/vocabulary/break-in` 与 `/vocabulary/break-in-verb`。first aid 与已有 first-aid 的路径冲突通过 `first-aid-phrase` 区分，不覆盖已有链接。
- 固定考试词表的阶段归属和 sourceCount/sourceIncluded 保持原值。主题清单不等于考试大纲。

## 释义与用法

burglary 在日常中常译入室盗窃，但法律语境还可能涉及非法进入建筑物后意图实施其他犯罪；manslaughter 也不能全部等同于过失杀人。对应说明参考 [Cornell LII：burglary](https://www.law.cornell.edu/wex/burglary) 和 [Cornell LII：manslaughter](https://www.law.cornell.edu/wex/manslaughter)，以概括英语用法为目的。

encampment 本义为营地或临时驻扎点；loitering、dumpster diving 等名称本身也不直接判定行为是否违法。drug use 和 hacker 按本分类的安防、网络犯罪语境收录，同时说明其更宽泛的普通用法。CCTV 展开为 closed-circuit television，并补充 abandoned 与 unattended 的区别。

## 音标与检查

已有读音保留，缺少的英美音标分别匹配固定版 IPA Dict；未注明口音的原文 IPA 存为 reference。suspect、convict、abuse 的同形异音区别写入补充说明。发音继续共用 Web Speech API。

内容校验包括原始条目覆盖、13 个事件标签覆盖、重复 ID 和单词检查、词性与分类引用、既有释义和阶段保留；随后执行英语测试、全站构建及浏览器验证。
