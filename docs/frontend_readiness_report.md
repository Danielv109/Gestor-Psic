# Frontend Readiness Report

**Date**: 2026-02-04T20:11:21-06:00  
**Backend**: v1.0.0-frozen  
**Scope**: Endpoint stability and frontend consumption rules

---

## 1. Endpoints Frontend-Safe ✅

### Authentication (`/auth`)
| Method | Endpoint | Rate Limit | Status |
|--------|----------|------------|--------|
| POST | `/auth/login` | 5/min | ✅ Public |
| POST | `/auth/refresh` | 10/min | ✅ Public |
| POST | `/auth/logout` | - | ✅ Auth |
| POST | `/auth/logout-all` | - | ✅ Auth |
| POST | `/auth/change-password` | - | ✅ Auth |

### Patients (`/patients`)
| Method | Endpoint | RBAC | ABAC |
|--------|----------|------|------|
| POST | `/patients` | TERAPEUTA, SUPERVISOR | - |
| GET | `/patients` | TERAPEUTA, SUPERVISOR, ASISTENTE | - |
| GET | `/patients/:id` | TERAPEUTA, SUPERVISOR, ASISTENTE | PatientAccessPolicy |
| GET | `/patients/:id/team` | TERAPEUTA, SUPERVISOR | PatientAccessPolicy |
| PUT | `/patients/:id` | TERAPEUTA, SUPERVISOR | PatientAccessPolicy |
| DELETE | `/patients/:id` | SUPERVISOR | PatientAccessPolicy |

### Sessions (`/sessions`)
| Method | Endpoint | RBAC | ABAC |
|--------|----------|------|------|
| POST | `/sessions` | TERAPEUTA | - |
| GET | `/sessions` | TERAPEUTA, SUPERVISOR | - |
| GET | `/sessions/patient/:patientId` | TERAPEUTA, SUPERVISOR | - |
| GET | `/sessions/:id` | TERAPEUTA, SUPERVISOR | SessionAccessPolicy |
| GET | `/sessions/:id/versions` | TERAPEUTA, SUPERVISOR | SessionAccessPolicy |
| PUT | `/sessions/:id` | TERAPEUTA | SessionAccessPolicy |
| POST | `/sessions/:id/sign` | TERAPEUTA | SessionAccessPolicy |

### Appointments (`/appointments`)
| Method | Endpoint | RBAC | ABAC |
|--------|----------|------|------|
| POST | `/appointments` | ALL | - |
| GET | `/appointments/upcoming` | ALL | - |
| GET | `/appointments/range` | ALL | - |
| GET | `/appointments/:id` | ALL | AppointmentAccessPolicy |
| PUT | `/appointments/:id` | ALL | AppointmentAccessPolicy |
| POST | `/appointments/:id/confirm` | ALL | AppointmentAccessPolicy |
| POST | `/appointments/:id/cancel` | ALL | AppointmentAccessPolicy |
| DELETE | `/appointments/:id` | SUPERVISOR | AppointmentAccessPolicy |

### Workflow (`/workflow`)
| Method | Endpoint | RBAC |
|--------|----------|------|
| GET | `/workflow/appointment/:id/status` | ALL |
| POST | `/workflow/appointment/:id/confirm` | ALL |
| POST | `/workflow/appointment/:id/no-show` | ALL |
| POST | `/workflow/appointment/:id/cancel` | ALL |
| POST | `/workflow/appointment/:id/start-session` | TERAPEUTA |
| POST | `/workflow/session/:id/end` | TERAPEUTA |
| POST | `/workflow/session/:id/sign` | TERAPEUTA |

### Shadow Notes (`/shadow-notes`)
| Method | Endpoint | Notes |
|--------|----------|-------|
| ALL | All endpoints | TERAPEUTA only, personal encryption |

### Export (`/export`)
| Method | Endpoint | Rate Limit |
|--------|----------|------------|
| POST | `/export/*` | 3/5min |

---

## 2. Endpoints Frontend-Risk ⚠️

| Endpoint | Risk | Mitigation |
|----------|------|------------|
| `POST /system/bootstrap` | One-time only | 410 GONE after first use |
| `PUT /sessions/:id` | 409 if signed | Check `isLocked` before showing edit |
| `DELETE /patients/:id` | SUPERVISOR only | Hide button for other roles |

---

## 3. Status Codes Frontend DEBE Manejar

| Code | Meaning | Frontend Action |
|------|---------|-----------------|
| 200 | Success | Display data |
| 201 | Created | Redirect to detail |
| 204 | No Content | Success toast, no body |
| 400 | Validation error | Show field errors |
| 401 | Unauthorized | Redirect to login |
| 403 | Forbidden | Show "Access denied" |
| 404 | Not Found | Show "Not found" |
| 409 | Conflict | Show state error |
| 410 | Gone | Resource deleted |
| 423 | Locked | Legal hold warning |
| 429 | Rate limited | Show "Too many requests" |

---

## 4. Error Response Format

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

---

## 5. Reglas que Frontend DEBE Respetar

### Authentication
1. Store `accessToken` in memory (not localStorage)
2. Store `refreshToken` in httpOnly cookie (or secure storage)
3. Auto-refresh before expiry (15 min TTL)
4. On 401, attempt refresh once, then logout

### Authorization
1. Check `user.globalRole` before showing UI elements
2. Hide "Delete" for non-SUPERVISOR
3. Hide edit button if `session.isLocked = true`

### State Transitions
1. Check `legalStatus` before allowing edit
2. SIGNED/AMENDED/VOIDED sessions are READ-ONLY
3. Show warning before signing (irreversible)

### Validation
1. Validate on frontend BEFORE submit
2. All IDs must be UUIDv4
3. Required fields: check DTOs

### Rate Limiting
1. Disable login button briefly after failure
2. Show exponential backoff on 429
3. Export debounce: 5 min minimum

### Security
1. Never log tokens or passwords
2. Sanitize all user input
3. Use HTTPS only
