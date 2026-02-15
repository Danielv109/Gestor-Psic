# Frontend ↔ Backend Integration Guide

**Version**: v1.0.0-backend-frozen  
**Date**: 2026-02-04

---

## 1. Authentication Flow

### Login Sequence

```
1. POST /auth/login → { accessToken, refreshToken, user }
2. Store accessToken (memory only)
3. Store refreshToken (secure storage)
4. Include header: Authorization: Bearer {accessToken}
```

### Token Refresh Sequence

```
1. Detect 401 response OR accessToken near expiry
2. POST /auth/refresh → { accessToken, refreshToken }
3. Replace both tokens
4. Retry original request
```

### Logout Sequence

```
1. POST /auth/logout with refreshToken in body
2. Clear local tokens
3. Redirect to login
```

### Token Expiry

| Token | TTL | Action |
|-------|-----|--------|
| accessToken | 15 min | Refresh before expiry |
| refreshToken | 7 days | Re-login if expired |

### 401 Handling

```
IF 401 received:
    IF refresh attempt NOT made:
        → Attempt token refresh
        → Retry original request
    ELSE:
        → Clear tokens
        → Redirect to login
```

---

## 2. Error Handling

### Standard Error Response

```json
{
  "statusCode": 400,
  "message": "Descripción del error",
  "error": "Bad Request"
}
```

### Status Codes

| Code | Meaning | Frontend Action |
|------|---------|-----------------|
| 200 | Success | Display data |
| 201 | Created | Redirect to detail view |
| 204 | No Content | Show success, no body |
| 400 | Validation error | Show field errors |
| 401 | Unauthorized | Token refresh or logout |
| 403 | Forbidden | Show "Acceso denegado" |
| 404 | Not Found | Show "No encontrado" |
| 409 | Conflict | Show state error message |
| 410 | Gone | Resource was deleted |
| 423 | Locked | Show legal hold warning |
| 429 | Too Many Requests | Show "Intenta más tarde" |
| 500 | Server Error | Show generic error |

### Validation Errors (400)

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "validationErrors": [
    { "field": "email", "constraints": { "isEmail": "..." } }
  ]
}
```

**Frontend Action**: Map `validationErrors` to form fields.

### State Transition Errors (409)

```json
{
  "statusCode": 409,
  "message": "Transición inválida: SIGNED → DRAFT",
  "error": "Conflict",
  "currentState": "SIGNED",
  "targetState": "DRAFT",
  "allowedTransitions": ["AMENDED", "VOIDED"]
}
```

**Frontend Action**: Refresh session state, update UI.

---

## 3. Session Workflow

### States

| State | Editable | UI |
|-------|----------|-----|
| DRAFT | ✅ Yes | Show edit button |
| PENDING_REVIEW | ✅ Yes | Show "Revisar" |
| SIGNED | ❌ No | Hide edit, show "Firmada" |
| AMENDED | ❌ No | Show addendum button |
| VOIDED | ❌ No | Show "Anulada", read-only |

### Create → Sign Flow

```
1. POST /appointments → Create appointment
2. POST /workflow/appointment/:id/confirm → Confirm
3. POST /workflow/appointment/:id/start-session → Create session
4. PUT /sessions/:id → Save narrative (multiple times)
5. POST /workflow/session/:id/end → Close session
6. POST /workflow/session/:id/sign → Sign (IRREVERSIBLE)
```

### Pre-Sign Checks

Before calling `/sign`:

```
- Verify session.startedAt exists
- Verify session.endedAt exists
- Verify narrative has content
- Show confirmation dialog: "Esta acción es irreversible"
```

### Post-Sign Rules

After session is signed:

```
- Hide edit button
- Disable narrative fields
- Show signature info (truncated hash)
- Enable "Agregar Addendum" button
```

---

## 4. Call Order

### Application Startup

```
1. Check stored refreshToken validity
2. IF valid: POST /auth/refresh
3. IF invalid: Show login screen
4. After login: GET /patients (role-based)
```

### Viewing a Session

```
1. GET /sessions/:id → Session with decrypted narrative
2. Check session.isLocked
3. IF locked: Read-only mode
4. IF not locked: Edit mode
```

### Creating Appointment

```
1. GET /patients → Get patient list (for dropdown)
2. POST /appointments → Create appointment
3. Redirect to calendar or appointment detail
```

---

## 5. Role-Based UI

### TERAPEUTA

```
- Create patients ✅
- Create sessions ✅
- Sign sessions ✅
- Delete anything ❌
```

### SUPERVISOR

```
- View all sessions ✅
- Delete resources ✅
- Sign sessions ❌ (only owner)
- Void sessions ✅
```

### ASISTENTE

```
- Create appointments ✅
- View patients (limited) ✅
- View clinical narratives ❌
- Edit sessions ❌
```

### AUDITOR

```
- Read all (including deleted) ✅
- Modify anything ❌
- Export data ✅
```

---

## 6. Typical Errors to Avoid

### ❌ Error 1: Editing Signed Session

```
Problem: PUT /sessions/:id when session.isLocked = true
Result: 409 Conflict
Solution: Check isLocked before showing edit button
```

### ❌ Error 2: Signing Without Narrative

```
Problem: POST /sessions/:id/sign without content
Result: 400 Bad Request
Solution: Validate narrative exists before signing
```

### ❌ Error 3: Multiple Sign Attempts

```
Problem: Double-click on sign button
Result: First succeeds, second returns 409
Solution: Disable button after first click
```

### ❌ Error 4: Wrong Token on Refresh

```
Problem: Using accessToken instead of refreshToken
Result: 401 Unauthorized
Solution: POST /auth/refresh with { refreshToken }
```

### ❌ Error 5: Deleting Without Permission

```
Problem: DELETE /patients/:id as TERAPEUTA
Result: 403 Forbidden
Solution: Hide delete button for non-SUPERVISOR
```

### ❌ Error 6: Rate Limit on Login

```
Problem: 6+ login attempts in 1 minute
Result: 429 Too Many Requests
Solution: Implement backoff, show countdown
```

### ❌ Error 7: Signing Another's Session

```
Problem: POST /sessions/:id/sign where therapistId ≠ current user
Result: 403 Forbidden
Solution: Only show sign button if owner
```

---

## 7. Required Headers

### Every Request

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

### Optional

```
X-Request-ID: {uuid}  (for debugging)
```

---

## 8. Data Formats

### Dates

- Send: ISO 8601 (`2024-01-15T10:30:00Z`)
- Receive: ISO 8601 string

### UUIDs

- All IDs are UUIDv4
- Validate before sending

### Clinical Narrative (SOAP)

```json
{
  "subjectiveReport": "string",
  "objectiveObservation": "string",
  "assessment": "string",
  "plan": "string",
  "additionalNotes": "string (optional)"
}
```

---

## 9. Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /auth/login | 5 | 1 min |
| POST /auth/refresh | 10 | 1 min |
| POST /export/* | 3 | 5 min |

### On 429 Response

```
1. Show "Demasiadas solicitudes"
2. Wait Retry-After header value (if present)
3. Enable button after delay
```

---

## 10. Session State Machine

```
          ┌─────────────────────────────────────┐
          │                                     │
          ▼                                     │
      DRAFT ──────► PENDING_REVIEW ─────► SIGNED
          ▲              │                   │
          │              │                   │
          └──────────────┘                   │
                                             ▼
                                        AMENDED ──► VOIDED
                                             │          ▲
                                             └──────────┘
```

**Rules**:
- SIGNED cannot return to DRAFT
- VOIDED is final
- Only TERAPEUTA owner can sign
