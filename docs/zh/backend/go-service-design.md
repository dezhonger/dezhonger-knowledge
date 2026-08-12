---
title: 设计一个小型 Go 服务
description: 保持传输、规则、持久化与运行时边界清晰的最小 Go 服务架构。
---

# 设计一个小型 Go 服务

真正有用的问题不是“应该选择哪个 Go 框架”，而是：**每项决策应该放在哪里，才能避免一次修改扩散到整个服务？**

## 四个边界

```text
HTTP 请求
    │
    ▼
传输层 ── 解码、认证、编码
    │
    ▼
应用层 ── 授权、执行业务规则
    │
    ▼
存储层 ── 表达查询和状态变化
    │
    ▼
PostgreSQL ── 约束与事务
```

这不意味着每个接口都必须建立四个 Package，而是要明确所有权：

- HTTP 状态码与 Header 属于传输层。
- “只有管理员可以创建用户”属于应用层。
- SQL 和数据库特有错误属于存储层。
- 唯一性、外键和事务完整性也必须由数据库保护。

## 紧凑的项目结构

```text
cmd/api/main.go          进程启动和退出
internal/app/            Use Case 与 HTTP 组合
internal/store/          PostgreSQL 查询和事务
internal/auth/           密码、Session 与策略辅助逻辑
internal/migrations/     带版本的 Schema 变化
```

先保持紧凑。只有当一部分代码具有独立的变化原因时才拆分 Package，而不是为了让目录和架构图中的每个方框一一对应。

## 让 Handler 保持简单

Handler 应当直接展示请求生命周期：

```go
func (h *Handler) createNote(w http.ResponseWriter, r *http.Request) {
    user := auth.UserFromContext(r.Context())

    var input CreateNoteInput
    if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
        writeError(w, http.StatusBadRequest, "invalid_request")
        return
    }

    note, err := h.notes.Create(r.Context(), user.ID, input)
    if err != nil {
        h.writeApplicationError(w, err)
        return
    }

    writeJSON(w, http.StatusCreated, note)
}
```

解码、调用一个 Use Case、映射结果已经足够。定义业务对象的校验规则应能够在 HTTP 之外复用。

## 在多个层次保护约束

应用校验负责提供准确错误，数据库约束负责在并发和其他写入方存在时保护状态。

以用户名唯一为例：

1. 查询前执行标准化和格式校验。
2. 在 PostgreSQL 中声明唯一约束。
3. 把约束冲突转换为稳定的应用错误。

只在写入前查询会产生竞态条件；只依赖约束而不转换错误，则会得到难以使用的 API。

## 配置也是接口

启动时一次性读取并验证运行时配置，然后把类型明确的依赖向内传递。不要在 Handler 中临时读取环境变量，否则配置错误只会在特定请求路径运行时才暴露。

以下配置无效时至少应立即终止启动：

- 监听地址；
- 数据库 URL；
- 公网 Origin 和 Cookie 安全模式；
- Session 时长；
- 必填的 Secret。

## 退出也是一次状态变化

优雅退出不只是捕获 `SIGTERM`。服务需要停止接收新任务，为已有请求提供有上限的完成窗口，最后关闭数据库资源。

这个上限十分重要：无限等待会阻止部署完成，立即退出则可能中断已经提交的响应，使客户端面对一次结果不明确的操作。

## Review 清单

- 阅读者能否快速找到启动、路由、业务规则和 SQL？
- 认证和授权是否为两个独立决策？
- 数据库约束是否保护了与应用校验相同的业务约束？
- 可重试和不可重试错误是否能够区分？
- 健康检查是否真的验证了它声称代表的依赖？
- 进程是否可以在明确的时间上限内退出？

随着服务增长，这些问题仍然容易回答，说明架构发挥了作用。
