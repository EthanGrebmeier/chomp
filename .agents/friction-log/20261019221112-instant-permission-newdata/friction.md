---
title: 'Instant permission newData.ref fails at evaluation time'
severity: 'minor'
---

### Expected Behavior
Permission rule deployment should reject unsupported APIs, or newData.ref should evaluate like data.ref.

### Current Behavior
A rule containing newData.ref deploys successfully, but authenticated guest SDK writes fail later with permission-evaluation-failed and OVERLOAD_NOT_FOUND.

### Possible Solution
Use an immutable scalar appListId marker to distinguish real grocery-list scopes. Deny scope changes and test create/update/unlink through authenticated SDK clients before accepting a rule change.

### Minimal Reproducible Example
Add size(newData.ref('groceryList.id')) == 0 to gqc_workspaces_v1.update, deploy on the allowlisted dev app, and run pnpm test:quantity:sync. The owner-shares-workspace assertion fails. data.ref works.

### Context
Encountered while integrating the quantity model into the actual app. The failure was caught by the existing SDK permission suite; no production rules were changed.
