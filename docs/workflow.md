# Workflow

## Appointment Lifecycle

### States

| Status | Description | Final |
|--------|-------------|-------|
| SCHEDULED | Created, pending confirmation | No |
| CONFIRMED | Patient confirmed | No |
| IN_PROGRESS | Session active | No |
| COMPLETED | Session finished | Yes |
| CANCELLED | Appointment cancelled | Yes |
| NO_SHOW | Patient did not attend | Yes |

### Transitions

```
SCHEDULED → CONFIRMED | CANCELLED | NO_SHOW
CONFIRMED → IN_PROGRESS | CANCELLED | NO_SHOW
IN_PROGRESS → COMPLETED
```

### Business Rules

1. Only CONFIRMED appointments can start sessions
2. Session creation transitions appointment to IN_PROGRESS
3. Session end transitions appointment to COMPLETED
4. Final states are immutable

## Session Lifecycle

### Creation

- Triggered by `startSession()` on CONFIRMED appointment
- Sets `startedAt` timestamp
- Creates draft session

### Editing

- Only owner therapist can edit
- Only DRAFT sessions editable
- Clinical narrative encrypted on save

### Closing

- Sets `endedAt` and calculates `durationMinutes`
- Transitions `isDraft` to false
- Ready for signature

### Signing

- Generates SHA-256 signature hash
- Sets `isLocked = true`
- Records `signedAt` timestamp
- Session becomes immutable

## State Machines

### AppointmentStateMachine

Location: `src/modules/workflow/appointment-state-machine.ts`

- `validateTransition()`: Throws on invalid transition
- `canCreateSession()`: Checks if session can start
- `isFinal()`: Checks if state is terminal

### SessionLegalStateMachine

Location: `src/modules/workflow/session-legal-state-machine.ts`

- `validateTransition()`: Returns 409 on invalid
- `validateCanUpdate()`: Blocks locked sessions
- `validateCanDelete()`: Blocks legal hold

## Workflow Services

### ClinicalWorkflowService

Orchestrates appointment and session lifecycle:

- `confirmAppointment()`
- `startSession()`
- `endSession()`
- `signSession()`

### AmendmentService

Handles post-signature operations:

- `createAddendum()`
- `signAddendum()`
- `voidSession()`

## Event Emission

All state changes emit workflow events for:

- Logging
- Notifications (future)
- Integration hooks (future)
