# Power Automate Flow Spec — Phase 1 (No Premium)

> **Docs version:** 0.1.7 (updated 2026-03-04)
> See [CHANGELOG.md](../CHANGELOG.md) for release history.

## 1. Goal

Implement a scheduled Power Automate flow (no Premium connectors) that:

1. Polls the API for new swag submissions
2. Writes new rows into an Excel table
3. Posts a Teams notification per new submission
4. Stores the returned cursor (`nextSince`) for the next run

This uses the existing endpoint:

- `GET /api/integrations/submissions?since=<ISO>&limit=100`
- Header: `x-flow-token: <POWER_AUTOMATE_FLOW_TOKEN>`

> **Deprecation note:** Webhook push is intentionally unsupported in the current phase. This integration is polling-only by design.

---

## 2. Prerequisites

### 2.1 API setup

In API `.env`:

```env
POWER_AUTOMATE_FLOW_TOKEN=replace-with-long-random-secret
```

Restart API after env changes.

### 2.2 Excel setup (OneDrive or SharePoint)

Create workbook `SwagSubmissions.xlsx` with table `SwagSubmissions` and columns:

- `requestId`
- `submittedAt`
- `name`
- `email`
- `company`
- `shirtSize`
- `shippingAddress`
- `reason`
- `status`
- `sourceIp`

Optional (recommended for dedupe): make `requestId` unique using workbook governance process.

### 2.3 Cursor storage list (SharePoint)

Create list `SwagFlowState` with columns:

- `Title` (single line text) — use value `submissions-cursor`
- `Cursor` (single line text) — stores ISO datetime string

Seed one row:

- `Title = submissions-cursor`
- `Cursor = 1970-01-01T00:00:00.000Z`

---

## 3. Flow Design

## 3.1 Trigger

- **Recurrence**
  - Interval: `1`
  - Frequency: `Minute`

## 3.2 Actions (in order)

1. **Get items** (SharePoint)
   - Site Address: your site
   - List Name: `SwagFlowState`
   - Filter Query: `Title eq 'submissions-cursor'`
   - Top Count: `1`

2. **Compose sinceCursor**
   - Expression:
   ```text
   if(
     empty(first(body('Get_items')?['value'])?['Cursor']),
     '1970-01-01T00:00:00.000Z',
     first(body('Get_items')?['value'])?['Cursor']
   )
   ```

3. **HTTP** (standard connector)
   - Method: `GET`
   - URI:
   ```text
  http://<api-host>/api/integrations/submissions?since=@{encodeUriComponent(outputs('Compose_sinceCursor'))}&limit=100
   ```
   - Headers:
     - `x-flow-token`: `<same as POWER_AUTOMATE_FLOW_TOKEN>`

4. **Parse JSON**
   - Content: `body('HTTP')`
   - Schema:
   ```json
   {
     "type": "object",
     "properties": {
       "data": {
         "type": "array",
         "items": {
           "type": "object",
           "properties": {
             "submittedAt": { "type": "string" },
             "requestId": { "type": "string" },
             "status": { "type": "string" },
             "name": { "type": "string" },
             "email": { "type": "string" },
             "company": { "type": "string" },
             "githubUsername": { "type": "string" },
             "shirtSize": { "type": "string" },
             "country": { "type": "string" },
             "shippingAddress": { "type": "string" },
             "reason": { "type": "string" },
             "sourceIp": { "type": "string" }
           },
           "required": [
             "submittedAt",
             "requestId",
             "status",
             "name",
             "email",
             "company",
             "githubUsername",
             "shirtSize",
             "country",
             "shippingAddress",
             "reason",
             "sourceIp"
           ]
         }
       },
       "nextSince": {
         "type": ["string", "null"]
       },
       "count": {
         "type": "number"
       }
     },
     "required": ["data", "nextSince", "count"]
   }
   ```

5. **Condition — hasRows**
   - Expression:
   ```text
   greater(length(body('Parse_JSON')?['data']), 0)
   ```

6. **If yes → Apply to each** `body('Parse_JSON')?['data']`
   - **Add a row into a table** (Excel Online)
     - File: `SwagSubmissions.xlsx`
     - Table: `SwagSubmissions`
     - Column mapping:
       - `requestId` → `items('Apply_to_each')?['requestId']`
       - `submittedAt` → `items('Apply_to_each')?['submittedAt']`
       - `name` → `items('Apply_to_each')?['name']`
       - `email` → `items('Apply_to_each')?['email']`
       - `company` → `items('Apply_to_each')?['company']`
       - `shirtSize` → `items('Apply_to_each')?['shirtSize']`
       - `shippingAddress` → `items('Apply_to_each')?['shippingAddress']`
       - `reason` → `items('Apply_to_each')?['reason']`
       - `status` → `items('Apply_to_each')?['status']`
       - `sourceIp` → `items('Apply_to_each')?['sourceIp']`

   - **Post message in a chat or channel** (Teams)
     - Message body template:
     ```text
     New swag request: @{items('Apply_to_each')?['name']} (@{items('Apply_to_each')?['email']})
     Size: @{items('Apply_to_each')?['shirtSize']}
     Request ID: @{items('Apply_to_each')?['requestId']}
     Submitted: @{items('Apply_to_each')?['submittedAt']}
     ```

7. **After condition (always) — Update item** (SharePoint)
   - Update the same `SwagFlowState` row
   - `Cursor` value:
   ```text
   if(
     empty(body('Parse_JSON')?['nextSince']),
    outputs('Compose_sinceCursor'),
     body('Parse_JSON')?['nextSince']
   )
   ```

---

## 4. Expression Cheat-Sheet (Copy/Paste)

Use this section when the designer renames actions with suffixes like `_2`.

### 4.1 Common action-name variants

- `Get items` → `Get_items` or `Get_items_2`
- `Compose sinceCursor` → `Compose_sinceCursor` or `Compose_sinceCursor_2`
- `HTTP` → `HTTP` or `HTTP_2`
- `Parse JSON` → `Parse_JSON` or `Parse_JSON_2`
- `Apply to each` → `Apply_to_each` or `Apply_to_each_2`

If your expression fails, replace action names to match your flow's exact internal names.

### 4.2 Cursor fallback (Compose)

```text
if(
  empty(first(body('Get_items')?['value'])?['Cursor']),
  '1970-01-01T00:00:00.000Z',
  first(body('Get_items')?['value'])?['Cursor']
)
```

### 4.3 Poll URI (HTTP GET)

```text
http://<api-host>/api/integrations/submissions?since=@{encodeUriComponent(outputs('Compose_sinceCursor'))}&limit=100
```

### 4.4 Has rows condition

```text
greater(length(body('Parse_JSON')?['data']), 0)
```

### 4.5 Current item mappings (inside Apply to each)

```text
items('Apply_to_each')?['requestId']
items('Apply_to_each')?['submittedAt']
items('Apply_to_each')?['name']
items('Apply_to_each')?['email']
items('Apply_to_each')?['company']
items('Apply_to_each')?['shirtSize']
items('Apply_to_each')?['shippingAddress']
items('Apply_to_each')?['reason']
items('Apply_to_each')?['status']
items('Apply_to_each')?['sourceIp']
```

### 4.6 Cursor advance expression (Update item)

```text
if(
  empty(body('Parse_JSON')?['nextSince']),
  outputs('Compose_sinceCursor'),
  body('Parse_JSON')?['nextSince']
)
```

### 4.7 Safe initialization values

- Default cursor: `1970-01-01T00:00:00.000Z`
- Limit for normal runs: `100`
- Limit for catch-up runs: `500`

### 4.8 Optional dedupe check expression (pre-Excel insert)

After `List rows present in a table` filtered by `requestId`:

```text
equals(length(body('List_rows_present_in_a_table')?['value']), 0)
```

---

## 5. Idempotency and Duplicate Safety

1. API returns rows in ascending `createdAt` order.
2. API cursor is `nextSince = last returned submittedAt`.
3. API query uses strict `createdAt > since`, so previously-seen rows are not returned again when cursor is saved correctly.
4. If flow fails after writing some rows but before saving cursor, duplicates may happen on retry.
5. Mitigation:
   - Add a dedupe check in flow before Excel write (`List rows present in a table` filtered by `requestId`), or
   - enforce operational uniqueness on `requestId`.

---

## 6. Error Handling Recommendations

1. Add a **Scope — poll and process** and a **Scope — on failure**.
2. Configure **Run after** on failure scope for `has failed`, `has timed out`.
3. In failure scope, post a Teams alert with `workflow().run.name` and error summary.
4. Do not advance cursor when HTTP response is non-200 or Parse JSON fails.

---

## 7. Operational Defaults

- Poll interval: 1–5 minutes
- `limit`: 100 (increase to 500 if backlog catch-up needed)
- Keep API and Flow clocks in UTC
- Keep `POWER_AUTOMATE_FLOW_TOKEN` secret and rotate quarterly

---

## 8. Smoke Test Checklist

1. Submit one new swag request via SSH.
2. Run flow manually.
3. Confirm one new Excel row appears.
4. Confirm one Teams message appears.
5. Confirm `SwagFlowState.Cursor` advances to that submission `submittedAt`.
6. Run flow again with no new submissions.
7. Confirm zero new Excel rows and cursor remains stable.