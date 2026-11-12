# 结构化历史数据

后续按实体类型建立子目录，每条记录一个 UTF-8 JSON 文件，文件名与 `id` 一致。实体类型及字段约束见 `scripts/history/model.mjs`。基础验证使用 `npm run validate:history`。

关键事实的采用值只写在实体字段；`assertions/` 用 JSON Pointer 指向该字段，可保存冲突候选值与裁决理由，但不复制采用值；`evidence/` 指向断言中的具体候选及 `sources/`。首批样本只涉及已核对的政权、人物、任期与事件；未录入疆域几何或推测的亲属／继承关系。
