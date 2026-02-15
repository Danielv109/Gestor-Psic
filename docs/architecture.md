# Architecture

## Overview

Syntegra Clinical OS is a NestJS-based backend for clinical psychology practice management with strict regulatory compliance (NOM-004-SSA3).

## Stack

| Layer | Technology |
|-------|------------|
| Framework | NestJS 10.x |
| Database | PostgreSQL (Neon) |
| ORM | Prisma 5.x |
| Auth | JWT + Refresh Tokens |
| Crypto | AES-256-GCM + HKDF |

## Module Structure

```
src/
├── auth/              # Authentication/authorization
├── crypto/            # Encryption services
├── prisma/            # Database layer
├── common/            # Shared utilities
│   ├── decorators/
│   ├── filters/       # GlobalExceptionFilter
│   ├── guards/
│   ├── pipes/         # ValidationPipe
│   └── throttling/    # Rate limiting
└── modules/
    ├── patients/
    ├── sessions/
    ├── appointments/
    ├── shadow-notes/
    ├── audit/
    ├── workflow/
    ├── export/
    └── system/
```

## Design Principles

1. **Zero Trust**: Every request validated, no implicit trust
2. **Defense in Depth**: Multiple security layers
3. **Immutable Audit Trail**: AuditLog never modified/deleted
4. **Encryption at Rest**: Clinical narratives AES-256-GCM encrypted

## Data Flow

```
Request → JWT Guard → RBAC → ABAC → Service → Repository → Prisma → DB
                                        ↓
                                   AuditService
```

## Key Services

| Service | Responsibility |
|---------|----------------|
| `AuthService` | Login, tokens, password management |
| `CryptoService` | Encryption/decryption of clinical data |
| `AuditService` | Immutable audit trail |
| `ClinicalWorkflowService` | Appointment/session lifecycle |
| `SessionLegalStateMachine` | Legal status transitions |

## Soft Delete

All clinical entities use soft delete via Prisma middleware. `AuditLog` is excluded (immutable).
