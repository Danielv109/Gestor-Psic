# Legal Compliance

## Regulatory Framework

- **NOM-004-SSA3-2012**: Clinical records for medical services
- **LFPDPPP**: Protection of personal data held by private parties

## Clinical Session Lifecycle

### Legal Status Enum

| Status | Description | Immutable |
|--------|-------------|-----------|
| DRAFT | In progress, editable | No |
| PENDING_REVIEW | Complete, awaiting signature | No |
| SIGNED | Digitally signed | Yes |
| AMENDED | Signed with addendums | Yes |
| VOIDED | Legally annulled | Yes (final) |

### Valid Transitions

```
DRAFT → PENDING_REVIEW
PENDING_REVIEW → SIGNED | DRAFT
SIGNED → AMENDED | VOIDED
AMENDED → VOIDED
VOIDED → (none)
```

### Signature Requirements

1. Session must have clinical narrative
2. Session must be closed (`endedAt` set)
3. Only therapist owner can sign
4. Signature generates SHA-256 hash
5. `isLocked = true` after signature

## Addendum (Post-Signature)

- Addendums do NOT modify original record
- Stored in `SessionAddendum` table
- Each addendum requires signature
- Sequential numbering enforced

## Voiding Sessions

- Requires SUPERVISOR or AUDITOR role
- Must provide legal justification
- Original content preserved
- Audit trail mandatory

## Legal Hold

Sessions under legal hold (`hasLegalHold = true`):

- Cannot be deleted (423 Locked)
- Cannot be voided without authorization
- Protected from soft delete

## Audit Trail

### AuditLog Properties

- **Immutable**: No update/delete ever
- **Excluded from soft delete**: Always preserved
- **Indexed**: By actor, resource, timestamp

### Logged Actions

| Action | Description |
|--------|-------------|
| CREATE | Resource creation |
| READ | Data access (sensitive) |
| UPDATE | Modification |
| DELETE | Soft delete |
| SIGN | Digital signature |
| AMEND | Addendum creation |
| VOID | Legal annulment |
| EXPORT | Data export |
| DECRYPT | Narrative decryption |

## Data Retention

- Clinical records: 5 years minimum (NOM-004)
- Audit logs: Never deleted
- Soft-deleted records: Preserved with `deletedAt`
