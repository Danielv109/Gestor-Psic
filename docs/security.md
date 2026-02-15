# Security

## Authentication

### JWT Configuration

| Parameter | Value |
|-----------|-------|
| Algorithm | HS256 |
| Access Token TTL | 15 minutes |
| Refresh Token TTL | 7 days |
| Token Rotation | Enabled |

### Password Policy

- Minimum 12 characters
- Argon2id hashing
- Salt per-user

### Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /auth/login | 5 | 1 min |
| POST /auth/refresh | 10 | 1 min |
| POST /export/* | 3 | 5 min |
| POST /system/bootstrap | 1 | 24h |

## Authorization

### RBAC Roles

| Role | Description |
|------|-------------|
| TERAPEUTA | Full access to assigned patients |
| ASISTENTE | Read-only, no clinical narratives |
| SUPERVISOR | Audit access, case supervision |
| AUDITOR | Full read access, including deleted |

### ABAC Rules

- Therapist can only access assigned patients
- Session editing requires ownership
- Signature requires therapist match

## Encryption

### Clinical Narratives

| Parameter | Value |
|-----------|-------|
| Algorithm | AES-256-GCM |
| Key Derivation | HKDF-SHA256 |
| IV | 12 bytes random |
| Key Rotation | Configurable |

### Protected Fields

- `clinicalNarrativeEncrypted`
- `shadowNote.contentEncrypted`

## Input Validation

### Global ValidationPipe

- `whitelist: true` - Strip unknown properties
- `forbidNonWhitelisted: true` - Reject extra properties
- `transform: true` - Auto-transform types
- `stopAtFirstError: false` - Report all errors

### DTO Decorators

- `@IsNotEmpty()` on required fields
- `@IsUUID('4')` on ID references
- `@MaxLength()` on text fields
- `@IsEmail()` on email fields

## Security Headers

Recommended production headers (configure in reverse proxy):

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```
