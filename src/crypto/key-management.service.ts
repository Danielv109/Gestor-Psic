// src/crypto/key-management.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import {
    EncryptionKeyMetadata,
    KeyPurpose,
    DecryptionError,
    DecryptionFailureReason,
} from './interfaces/crypto.interfaces';
import * as crypto from 'crypto';

/**
 * KeyManagementService
 * 
 * Simula integración con HSM/Vault para gestión segura de claves.
 * En producción, las claves estarían en:
 * - AWS KMS
 * - HashiCorp Vault
 * - Azure Key Vault
 * - Hardware Security Module (HSM)
 * 
 * NUNCA almacena claves en texto plano en la base de datos.
 * Solo almacena referencias (keyId) a las claves en el HSM.
 */
@Injectable()
export class KeyManagementService implements OnModuleInit {
    private readonly logger = new Logger(KeyManagementService.name);

    // Simulación de HSM en memoria (en producción, sería llamada a HSM/Vault)
    private readonly keyStore: Map<string, Buffer> = new Map();

    // Cache de metadata de claves
    private readonly keyMetadataCache: Map<string, EncryptionKeyMetadata> = new Map();

    // Clave maestra derivada del secret de configuración
    private masterKey: Buffer;

    constructor(
        private readonly config: ConfigService,
        private readonly prisma: PrismaService,
    ) { }

    async onModuleInit() {
        await this.initializeMasterKey();
        await this.loadActiveKeys();
        this.logger.log('KeyManagementService initialized');
    }

    /**
     * Inicializar clave maestra desde configuración
     * En producción: esto vendría de HSM o Vault
     */
    private async initializeMasterKey() {
        const masterKeyHex = this.config.get<string>('ENCRYPTION_MASTER_KEY');

        if (!masterKeyHex) {
            throw new Error(
                'ENCRYPTION_MASTER_KEY is required. Must be 64-character hex string (32 bytes)',
            );
        }

        if (masterKeyHex.length !== 64) {
            throw new Error(
                `ENCRYPTION_MASTER_KEY must be exactly 64 hex characters. Got ${masterKeyHex.length}`,
            );
        }

        this.masterKey = Buffer.from(masterKeyHex, 'hex');
        this.logger.log('Master key initialized from configuration');
    }

    /**
     * Cargar claves activas desde BD al iniciar
     */
    private async loadActiveKeys() {
        const activeKeys = await this.prisma.encryptionKey.findMany({
            where: { isActive: true },
        });

        for (const key of activeKeys) {
            const metadata: EncryptionKeyMetadata = {
                keyId: key.id,
                purpose: key.purpose as KeyPurpose,
                version: key.version,
                algorithm: key.algorithm,
                isActive: key.isActive,
                createdAt: key.createdAt,
                rotatedAt: key.rotatedAt ?? undefined,
                expiresAt: key.expiresAt ?? undefined,
            };

            this.keyMetadataCache.set(key.id, metadata);

            // Derivar clave del propósito
            const derivedKey = this.deriveKeyForPurpose(key.purpose, key.version);
            this.keyStore.set(key.id, derivedKey);
        }

        this.logger.log(`Loaded ${activeKeys.length} active encryption keys`);
    }

    /**
     * Obtener clave activa para un propósito
     */
    async getActiveKey(purpose: KeyPurpose): Promise<EncryptionKeyMetadata> {
        // Buscar en cache primero
        for (const [keyId, metadata] of this.keyMetadataCache) {
            if (metadata.purpose === purpose && metadata.isActive) {
                // Verificar que no haya expirado
                if (metadata.expiresAt && metadata.expiresAt < new Date()) {
                    continue;
                }
                return metadata;
            }
        }

        // Si no hay clave activa, crear una nueva
        return this.createKey(purpose);
    }

    /**
     * Crear nueva clave de cifrado
     */
    async createKey(purpose: KeyPurpose): Promise<EncryptionKeyMetadata> {
        // Obtener último número de versión
        const lastKey = await this.prisma.encryptionKey.findFirst({
            where: { purpose },
            orderBy: { version: 'desc' },
        });

        const version = (lastKey?.version ?? 0) + 1;

        // Crear registro en BD (solo metadata, no la clave real)
        const keyRecord = await this.prisma.encryptionKey.create({
            data: {
                purpose,
                version,
                algorithm: 'AES-256-GCM',
                isActive: true,
                vaultKeyPath: `vault://syntegra/keys/${purpose}/v${version}`,
            },
        });

        // Derivar clave real y almacenar en memoria
        const derivedKey = this.deriveKeyForPurpose(purpose, version);
        this.keyStore.set(keyRecord.id, derivedKey);

        const metadata: EncryptionKeyMetadata = {
            keyId: keyRecord.id,
            purpose,
            version,
            algorithm: keyRecord.algorithm,
            isActive: true,
            createdAt: keyRecord.createdAt,
        };

        this.keyMetadataCache.set(keyRecord.id, metadata);

        this.logger.log(`Created new encryption key: ${purpose} v${version}`);

        return metadata;
    }

    /**
     * Rotar clave - crear nueva versión y marcar anterior como inactiva
     */
    async rotateKey(purpose: KeyPurpose): Promise<{
        oldKey: EncryptionKeyMetadata;
        newKey: EncryptionKeyMetadata;
    }> {
        // Obtener clave actual
        const currentKey = await this.getActiveKey(purpose);

        // Desactivar clave actual
        await this.prisma.encryptionKey.update({
            where: { id: currentKey.keyId },
            data: {
                isActive: false,
                rotatedAt: new Date(),
            },
        });

        // Actualizar cache
        const cachedMeta = this.keyMetadataCache.get(currentKey.keyId);
        if (cachedMeta) {
            cachedMeta.isActive = false;
            cachedMeta.rotatedAt = new Date();
        }

        // Crear nueva clave
        const newKey = await this.createKey(purpose);

        this.logger.warn(
            `Key rotated: ${purpose} v${currentKey.version} -> v${newKey.version}`,
        );

        return {
            oldKey: { ...currentKey, isActive: false, rotatedAt: new Date() },
            newKey,
        };
    }

    /**
     * Obtener clave por ID (para descifrado de datos históricos)
     */
    async getKeyById(keyId: string): Promise<Buffer> {
        // Verificar en cache
        if (this.keyStore.has(keyId)) {
            return this.keyStore.get(keyId)!;
        }

        // Buscar en BD
        const keyRecord = await this.prisma.encryptionKey.findUnique({
            where: { id: keyId },
        });

        if (!keyRecord) {
            throw new DecryptionError(
                `Key not found: ${keyId}`,
                keyId,
                '',
                DecryptionFailureReason.KEY_NOT_FOUND,
            );
        }

        // Verificar si está revocada
        if (keyRecord.rotatedAt && !keyRecord.isActive) {
            // Permitir descifrado con claves rotadas pero loguear warning
            this.logger.warn(`Using rotated key for decryption: ${keyId}`);
        }

        // Derivar y cachear
        const derivedKey = this.deriveKeyForPurpose(
            keyRecord.purpose,
            keyRecord.version,
        );
        this.keyStore.set(keyId, derivedKey);

        // Cachear metadata
        this.keyMetadataCache.set(keyId, {
            keyId: keyRecord.id,
            purpose: keyRecord.purpose as KeyPurpose,
            version: keyRecord.version,
            algorithm: keyRecord.algorithm,
            isActive: keyRecord.isActive,
            createdAt: keyRecord.createdAt,
            rotatedAt: keyRecord.rotatedAt ?? undefined,
            expiresAt: keyRecord.expiresAt ?? undefined,
        });

        return derivedKey;
    }

    /**
     * Derivar clave personal para un usuario (Shadow Notes)
     */
    deriveUserPersonalKey(userId: string): Buffer {
        // HKDF para derivar clave única por usuario
        const info = `user-personal-key:${userId}`;
        return Buffer.from(crypto.hkdfSync('sha256', this.masterKey, '', info, 32));
    }

    /**
     * Verificar si una clave puede usarse para descifrado
     */
    async validateKeyForDecryption(keyId: string): Promise<void> {
        const metadata = this.keyMetadataCache.get(keyId);

        if (!metadata) {
            // Intentar cargar
            await this.getKeyById(keyId);
            return;
        }

        // Las claves expiradas no pueden usarse
        if (metadata.expiresAt && metadata.expiresAt < new Date()) {
            throw new DecryptionError(
                `Key expired: ${keyId}`,
                keyId,
                '',
                DecryptionFailureReason.KEY_EXPIRED,
            );
        }
    }

    /**
     * Derivar clave específica para propósito usando HKDF
     * Esto simula lo que haría el HSM internamente
     */
    private deriveKeyForPurpose(purpose: string, version: number): Buffer {
        const info = `syntegra:${purpose}:v${version}`;
        return Buffer.from(crypto.hkdfSync('sha256', this.masterKey, '', info, 32));
    }

    /**
     * Obtener metadata de una clave
     */
    getKeyMetadata(keyId: string): EncryptionKeyMetadata | undefined {
        return this.keyMetadataCache.get(keyId);
    }

    /**
     * Listar todas las claves de un propósito
     */
    async listKeys(purpose: KeyPurpose): Promise<EncryptionKeyMetadata[]> {
        const keys = await this.prisma.encryptionKey.findMany({
            where: { purpose },
            orderBy: { version: 'desc' },
        });

        return keys.map((k) => ({
            keyId: k.id,
            purpose: k.purpose as KeyPurpose,
            version: k.version,
            algorithm: k.algorithm,
            isActive: k.isActive,
            createdAt: k.createdAt,
            rotatedAt: k.rotatedAt ?? undefined,
            expiresAt: k.expiresAt ?? undefined,
        }));
    }
}
