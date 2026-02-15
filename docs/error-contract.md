# Error Contract

## Response Format

All HTTP errors follow this structure:

```json
{
  "statusCode": 409,
  "message": "Sesión firmada no puede modificarse",
  "error": "Conflict"
}
```

## HTTP Status Codes

### Client Errors (4xx)

| Code | Error | Use Case |
|------|-------|----------|
| 400 | Bad Request | DTO validation failure |
| 401 | Unauthorized | Missing/invalid JWT |
| 403 | Forbidden | Role/permission denied |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Invalid state transition |
| 410 | Gone | Soft-deleted resource |
| 423 | Locked | Legal hold blocking |
| 429 | Too Many Requests | Rate limit exceeded |

### Server Errors (5xx)

| Code | Error | Use Case |
|------|-------|----------|
| 500 | Internal Server Error | Unhandled exception |

## Validation Errors

400 responses include validation details:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "validationErrors": [
    {
      "field": "email",
      "constraints": {
        "isEmail": "Debe ser un email válido"
      }
    }
  ]
}
```

## State Transition Errors

409 responses for invalid transitions:

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

## Legal Hold Errors

423 responses for blocked operations:

```json
{
  "statusCode": 423,
  "message": "Sesión bajo retención legal. Eliminación prohibida.",
  "error": "Locked"
}
```

## Rate Limit Errors

429 responses:

```json
{
  "statusCode": 429,
  "message": "Demasiadas solicitudes, intenta más tarde"
}
```

## Prisma Error Mapping

| Prisma Code | HTTP | Message |
|-------------|------|---------|
| P2002 | 409 | El recurso ya existe |
| P2025 | 404 | Recurso no encontrado |
| P2003 | 400 | Referencia a recurso inválida |

## Production Safety

- Stack traces NEVER exposed
- Internal error details hidden
- Generic message for 500 errors
- Full logging server-side only

## GlobalExceptionFilter

Location: `src/common/filters/global-exception.filter.ts`

Handles all exceptions uniformly:

1. Extracts status code and message
2. Maps Prisma errors to HTTP codes
3. Sanitizes response for production
4. Logs full details server-side
