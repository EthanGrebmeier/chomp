---
title: 'Instant permission equality between JSON array and CEL list rejects matching members'
severity: 'minor'
---

### Expected Behavior
A JSON membership array equal to a one-element CEL list authorizes its owner.

### Current Behavior
The creation rule data.memberIds == [auth.id] evaluated false although auth.id in data.memberIds was true. A real SDK transaction and admin debugTransact reproduced it.

### Possible Solution
Use an explicit owner check plus auth.id in data.memberIds. The attempted size(data.memberIds) expression also returned a server error for the JSON field; do not use it as a verified cardinality check. Validate permission expressions against the actual SDK.

### Minimal Reproducible Example
Create a workspace with memberIds containing the authenticated user ID and use the equality rule above. See scripts/quantity/test-app.mjs and features/quantity/__tests__/instant-protocol.test.ts.

### Context
Isolated quantity workspace setup. No existing application records were changed.
