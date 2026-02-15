// src/crypto/examples/crypto-usage.example.ts
/**
 * EJEMPLOS DE USO DEL CRYPTO MODULE
 * 
 * Este archivo muestra cómo usar CryptoService y KeyManagementService
 * en los diferentes escenarios de Syntegra Clinical OS.
 */

// ============================================================
// EJEMPLO 1: Cifrar narrativa clínica al crear sesión
// ============================================================

/*
// En SessionsService.create():

import { CryptoService } from '../../crypto/crypto.service';

async create(dto: CreateSessionDto, actor: AuthenticatedUser) {
  // ... validaciones ...

  // Cifrar narrativa ANTES de guardar
  let encryptedPayload = null;
  
  if (dto.clinicalNarrative) {
    encryptedPayload = await this.cryptoService.encryptClinicalNarrative({
      subjectiveReport: dto.clinicalNarrative.subjectiveReport,
      objectiveObservation: dto.clinicalNarrative.objectiveObservation,
      assessment: dto.clinicalNarrative.assessment,
      plan: dto.clinicalNarrative.plan,
    });
  }

  // Guardar en BD solo los bytes cifrados
  const session = await this.sessionsRepo.create({
    // ...otros campos...
    clinicalNarrativeEncrypted: encryptedPayload?.encrypted,  // Buffer
    narrativeIV: encryptedPayload?.iv,                         // Buffer
    narrativeKeyId: encryptedPayload?.keyId,                   // UUID de la clave
  });
}
*/

// ============================================================
// EJEMPLO 2: Descifrar narrativa al leer sesión
// ============================================================

/*
async findById(id: string, actor: AuthenticatedUser) {
  const session = await this.sessionsRepo.findById(id);

  // Solo descifrar si hay datos cifrados
  let clinicalNarrative = null;
  
  if (session.clinicalNarrativeEncrypted && session.narrativeIV) {
    clinicalNarrative = await this.cryptoService.decryptClinicalNarrative(
      {
        encrypted: session.clinicalNarrativeEncrypted,
        iv: session.narrativeIV,
        keyId: session.narrativeKeyId,
      },
      session.id,      // Para auditoría de errores
      actor.id,        // Quién descifra
    );
  }

  // Retornar SIN los campos cifrados
  return {
    id: session.id,
    patientId: session.patientId,
    therapistId: session.therapistId,
    startedAt: session.startedAt,
    // clinicalNarrativeEncrypted: NUNCA exponer
    // narrativeIV: NUNCA exponer
    clinicalNarrative, // Ya descifrado
  };
}
*/

// ============================================================
// EJEMPLO 3: Shadow Notes con clave personal
// ============================================================

/*
// La clave de Shadow Notes se deriva del userId
// SOLO el terapeuta propietario puede descifrar

async create(dto: CreateShadowNoteDto, actor: AuthenticatedUser) {
  // Cifrar con clave PERSONAL del terapeuta
  const { encrypted, iv } = await this.cryptoService.encryptShadowNote(
    dto.content,
    actor.id,  // La clave se deriva de este ID
  );

  return this.shadowNotesRepo.create({
    sessionId: dto.sessionId,
    therapistId: actor.id,
    contentEncrypted: encrypted,
    contentIV: iv,
    // NO hay keyId externo, la clave es personal
  });
}

async findById(id: string, actor: AuthenticatedUser) {
  const note = await this.shadowNotesRepo.findById(id);
  
  // CRÍTICO: Verificar ownership ANTES de descifrar
  if (note.therapistId !== actor.id) {
    throw new ForbiddenException('Sin acceso');
  }

  const content = await this.cryptoService.decryptShadowNote(
    note.contentEncrypted,
    note.contentIV,
    actor.id,  // La clave se deriva de quien pide
    id,
  );

  return { id: note.id, content };
}
*/

// ============================================================
// EJEMPLO 4: Rotación de claves
// ============================================================

/*
// Endpoint para rotación manual (solo admins/sistema):

@Post('rotate-key')
@Roles(GlobalRole.SUPERVISOR)
async rotateKey() {
  const result = await this.cryptoService.rotateKey(KeyPurpose.CLINICAL_NOTES);
  
  return {
    message: 'Clave rotada exitosamente',
    oldVersion: result.oldVersion,
    newVersion: result.newVersion,
    newKeyId: result.keyId,
  };
  
  // NOTA: Los datos existentes siguen usando la clave anterior.
  // Los nuevos datos usarán la nueva clave automáticamente.
}
*/

// ============================================================
// EJEMPLO 5: Re-cifrar datos post-rotación
// ============================================================

/*
// Para migrar datos antiguos a nueva clave:

@Post('sessions/:id/re-encrypt')
@Roles(GlobalRole.SUPERVISOR)
async reEncrypt(@Param('id') id: string) {
  const session = await this.sessionsRepo.findById(id);
  
  // Re-cifrar (descifra con clave vieja, cifra con nueva)
  const newPayload = await this.cryptoService.reEncryptClinicalNarrative(
    {
      encrypted: session.clinicalNarrativeEncrypted,
      iv: session.narrativeIV,
      keyId: session.narrativeKeyId,
    },
    id,
    actor.id,
  );

  // Actualizar registro
  await this.sessionsRepo.update(id, {
    clinicalNarrativeEncrypted: newPayload.encrypted,
    narrativeIV: newPayload.iv,
    narrativeKeyId: newPayload.keyId,
  });
}
*/

// ============================================================
// EJEMPLO 6: Manejo de errores de descifrado
// ============================================================

/*
import { DecryptionError, DecryptionFailureReason } from '../../crypto';

try {
  const narrative = await this.cryptoService.decryptClinicalNarrative(
    payload,
    sessionId,
    actorId,
  );
} catch (error) {
  if (error instanceof DecryptionError) {
    switch (error.reason) {
      case DecryptionFailureReason.KEY_NOT_FOUND:
        // La clave no existe - datos corruptos o migración incompleta
        throw new InternalServerErrorException('Error de integridad');
      
      case DecryptionFailureReason.KEY_EXPIRED:
        // La clave expiró - necesita re-cifrado
        throw new BadRequestException('Datos requieren migración');
      
      case DecryptionFailureReason.AUTH_TAG_MISMATCH:
        // Datos modificados o corruptos
        throw new BadRequestException('Integridad de datos comprometida');
      
      case DecryptionFailureReason.CORRUPTED_DATA:
        // JSON inválido después de descifrar
        throw new InternalServerErrorException('Datos corruptos');
    }
  }
  throw error;
}
*/

export { };
