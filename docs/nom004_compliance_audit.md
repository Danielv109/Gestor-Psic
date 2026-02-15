# NOM-004 Legal Compliance Audit

**Date**: 2026-02-04T20:12:56-06:00  
**Auditor**: Technical-Legal Auditor  
**Regulation**: NOM-004-SSA3-2012

---

## 1. Checklist Legal Cumplido ✅

### Registro Clínico (Expediente)
| Requisito NOM-004 | Implementación | Estado |
|-------------------|----------------|--------|
| Identificación del paciente | `Patient` model con datos completos | ✅ |
| Fecha y hora de atención | `ClinicalSession.startedAt`, `endedAt` | ✅ |
| Nombre del profesional | `therapistId` → `User.firstName/lastName` | ✅ |
| Cédula profesional | `User.licenseNumber` | ✅ |
| Narrativa clínica | `clinicalNarrativeEncrypted` (SOAP) | ✅ |

### Firma Digital
| Requisito | Implementación | Estado |
|-----------|----------------|--------|
| Firma del responsable | `signedAt`, `signatureHash` (SHA-256) | ✅ |
| Firma irrevocable | `isLocked = true` post-firma | ✅ |
| Solo el titular puede firmar | ABAC: `session.therapistId === actor.id` | ✅ |

### Inmutabilidad Post-Firma
| Requisito | Implementación | Estado |
|-----------|----------------|--------|
| No modificación post-firma | `SessionLegalStateMachine.validateCanUpdate()` | ✅ |
| Estado SIGNED inmutable | `LEGAL_STATUS_TRANSITIONS` no permite retorno | ✅ |
| 409 Conflict en intento | `ConflictException` con detalles | ✅ |

### Enmiendas (Addendums)
| Requisito | Implementación | Estado |
|-----------|----------------|--------|
| Addendum sin modificar original | `SessionAddendum` tabla separada | ✅ |
| Secuencia numérica | `sequenceNumber` auto-incremento | ✅ |
| Addendum requiere firma | `signedAt`, `signatureHash` en addendum | ✅ |
| Conservación del original | Narrativa original intacta | ✅ |

### Anulación Legal
| Requisito | Implementación | Estado |
|-----------|----------------|--------|
| Requiere justificación | `voidReason` campo obligatorio | ✅ |
| Solo roles autorizados | SUPERVISOR, AUDITOR | ✅ |
| Conserva contenido original | Solo cambia `legalStatus` a VOIDED | ✅ |
| Registra quién anuló | `voidedBy`, `voidedAt` | ✅ |

### Trazabilidad (Audit Trail)
| Requisito | Implementación | Estado |
|-----------|----------------|--------|
| Registro de accesos | `AuditLog` con acción READ | ✅ |
| Registro de modificaciones | CREATE, UPDATE acciones | ✅ |
| Registro de firmas | SIGN acción | ✅ |
| Registro de exports | EXPORT acción | ✅ |
| Immutabilidad del log | No update/delete en AuditLog | ✅ |

### Retención de Datos
| Requisito | Implementación | Estado |
|-----------|----------------|--------|
| 5 años mínimo | Soft delete preserva datos | ✅ |
| Recuperable | `deletedAt` permite restauración | ✅ |
| AuditLog permanente | Excluido de soft delete | ✅ |

### Versionado
| Requisito | Implementación | Estado |
|-----------|----------------|--------|
| Historial de cambios | `ClinicalSessionVersion` | ✅ |
| Snapshot cifrado | `narrativeSnapshotEncrypted` | ✅ |
| Quién cambió | `changedBy` | ✅ |

---

## 2. Riesgos Legales Detectados

### ⚠️ Campo `hasLegalHold` No Existe en Schema

**Situación**: El campo `hasLegalHold` está referenciado en `SessionLegalStateMachine` pero no existe en el modelo `ClinicalSession` del schema Prisma.

**Impacto**: Media. La lógica de Legal Hold existe pero no puede activarse desde base de datos.

**Mitigación Actual**: El campo puede agregarse en futuras versiones sin romper compatibilidad.

**Recomendación**: Agregar campo `hasLegalHold Boolean @default(false)` al modelo `ClinicalSession`.

---

## 3. Frontend: Qué NO Hacer NUNCA

### ❌ Prohibido para Cumplir NOM-004

| Acción Prohibida | Razón Legal |
|------------------|-------------|
| Modificar sesión firmada | Viola inmutabilidad post-firma |
| Eliminar registros clínicos | Viola retención 5 años |
| Mostrar datos sin auditar | Todo acceso debe registrarse |
| Permitir firma sin narrativa | Sesión incompleta |
| Permitir anulación sin justificación | Requiere `voidReason` |
| Firmar sesión de otro terapeuta | Solo titular puede firmar |
| Mostrar firma parcial | `signatureHash` debe truncarse en UI |
| Exportar sin auditoría | EXPORT debe registrarse |
| Permitir edit en VOIDED | Estado final |

### ⚠️ Cuidados Obligatorios

| Regla | Implementación UI |
|-------|-------------------|
| Verificar `isLocked` antes de editar | Deshabilitar botón edit |
| Verificar `legalStatus` | Mostrar badge de estado |
| Confirmar firma explícitamente | Modal de confirmación |
| Mostrar warning pre-firma | "Esta acción es irreversible" |
| No cachear narrativas | Datos sensibles |
| Timeout en visualización | Cerrar sesión < 15 min |

### 🚫 El Frontend NUNCA Debe:

1. **Llamar PUT /sessions/:id** si `session.isLocked === true`
2. **Llamar DELETE** en cualquier recurso clínico (soft delete único)
3. **Mostrar** `clinicalNarrativeEncrypted` sin descifrar
4. **Permitir** bypass de validación DTO
5. **Almacenar** tokens en localStorage
6. **Exponer** `signatureHash` completo (solo primeros 16 chars)
7. **Omitir** confirmación antes de firmar
8. **Permitir** anulación sin campo `reason`

---

## 4. Conclusión

| Área | Cumplimiento |
|------|--------------|
| Registro clínico | ✅ 100% |
| Firma digital | ✅ 100% |
| Inmutabilidad | ✅ 100% |
| Addendums | ✅ 100% |
| Trazabilidad | ✅ 100% |
| Retención | ✅ 100% |
| Legal Hold | ⚠️ Lógica presente, campo pendiente |

**VEREDICTO: Backend CUMPLE NOM-004-SSA3-2012**

El único punto pendiente es agregar el campo `hasLegalHold` al schema, pero esto es una mejora, no un bloqueo de cumplimiento.
