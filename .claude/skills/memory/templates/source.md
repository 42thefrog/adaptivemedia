---
type: Source
title: <Source / dataset / system name>
description: <One sentence: what this source is and what it's the record of.>
tags: [source, <domain>]
timestamp: <YYYY-MM-DDThh:mm:ss±hh:mm>
---

# <Source name>

<What the source is, what it holds, and how it's reached. If it is not a
dataset, describe it in prose and delete the table block below.>

<!--
Only keep this table block if the source is genuinely a dataset (e.g. a
ClickHouse table). It mirrors the OkfTable shape in server/artifact-feed.ts.
-->

| Property | Value |
|---|---|
| Engine | clickhouse |
| Database | <database> |
| Table | <table> |
| Row count estimate | <n> |
| Partition key | <optional> |
| Order by | <optional> |

## Fields

| Name | Type | Description |
|---|---|---|
| <field> | <ClickHouse type> | <what it means; note any joins> |

# Related

- [Bundle index](/<user_id>/index.md)

# Citations

[1] <source — file link, or system/doc reference>
