# Jira toolkit (Cursor)

Leitura de issues via MCP e criação de histórias/subtasks via REST API no projeto SV.

## When to use what

| Need | Use |
|------|-----|
| Buscar issue, JQL, cadastrar história + subtasks | **`agt-jira-workflow`** |
| Referência de API, ADF, payloads e curl | **`@skill-jira-workflow`** |
| Commits e PR | [GITHUB.md](GITHUB.md) |

Invoke the agent by name in chat or via the agent picker. Skill: `@skill-jira-workflow`.

## Default settings

| Setting | Value |
|---------|-------|
| Instance | `https://sauvvitech-team.atlassian.net` |
| Project | `SV` |
| Story issuetype id | `10003` |
| Subtask issuetype id | `10005` |
| Leitura | MCP `user-jira-mcp` (`get_issue`, `jql_search`) |
| Criação | REST `POST /rest/api/3/issue` via `curl` |
| Credenciais | `JIRA_USER_EMAIL` + `JIRA_API_KEY` (de `~/.cursor/mcp.json`, **nunca commitar**) |

## Agent

| Agent | Read-only | Focus |
|-------|-----------|--------|
| [agt-jira-workflow](agents/agt-jira-workflow.md) | no | MCP read → plan → curl create (Story + Subtasks) |

## Skill

| Skill | Purpose |
|-------|---------|
| [skill-jira-workflow](skills/skill-jira-workflow/SKILL.md) | Auth, ADF, payloads, curl commands, JQL |

## Workflow overview

```text
Leitura: get_issue / jql_search (MCP user-jira-mcp)
Criação:
  → plan (Story + Subtasks, títulos feat(scope) ...)
  → user approval
  → export creds from ~/.cursor/mcp.json
  → GET /myself (accountId)
  → POST /issue (Story)
  → POST /issue (Subtasks com parent)
```

## Issue types (quick reference)

| Tipo | issuetype id | Parent |
|------|--------------|--------|
| História (Story) | `10003` | — |
| Subtask | `10005` | key da história |

Full details: [skill-jira-workflow](skills/skill-jira-workflow/SKILL.md).

## Related docs

- [GITHUB.md](GITHUB.md) — commits e PR
- [RULES.md](RULES.md) — Cursor rules index
- [QUALITY.md](QUALITY.md) — code quality agents and skills
