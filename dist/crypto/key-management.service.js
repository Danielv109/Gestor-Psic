"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var KeyManagementService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyManagementService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto_interfaces_1 = require("./interfaces/crypto.interfaces");
const crypto = require("crypto");
let KeyManagementService = KeyManagementService_1 = class KeyManagementService {
    constructor(config, prisma) {
        this.config = config;
        this.prisma = prisma;
        this.logger = new common_1.Logger(KeyManagementService_1.name);
        this.keyStore = new Map();
        this.keyMetadataCache = new Map();
    }
    async onModuleInit() {
        await this.initializeMasterKey();
        await this.loadActiveKeys();
        this.logger.log('KeyManagementService initialized');
    }
    async initializeMasterKey() {
        const masterKeyHex = this.config.get('ENCRYPTION_MASTER_KEY');
        if (!masterKeyHex) {
            throw new Error('ENCRYPTION_MASTER_KEY is required. Must be 64-character hex string (32 bytes)');
        }
        if (masterKeyHex.length !== 64) {
            throw new Error(`ENCRYPTION_MASTER_KEY must be exactly 64 hex characters. Got ${masterKeyHex.length}`);
        }
        this.masterKey = Buffer.from(masterKeyHex, 'hex');
        this.logger.log('Master key initialized from configuration');
    }
    async loadActiveKeys() {
        const activeKeys = await this.prisma.encryptionKey.findMany({
            where: { isActive: true },
        });
        for (const key of activeKeys) {
            const metadata = {
                keyId: key.id,
                purpose: key.purpose,
                version: key.version,
                algorithm: key.algorithm,
                isActive: key.isActive,
                createdAt: key.createdAt,
                rotatedAt: key.rotatedAt ?? undefined,
                expiresAt: key.expiresAt ?? undefined,
            };
            this.keyMetadataCache.set(key.id, metadata);
            const derivedKey = this.deriveKeyForPurpose(key.purpose, key.version);
            this.keyStore.set(key.id, derivedKey);
        }
        this.logger.log(`Loaded ${activeKeys.length} active encryption keys`);
    }
    async getActiveKey(purpose) {
        for (const [keyId, metadata] of this.keyMetadataCache) {
            if (metadata.purpose === purpose && metadata.isActive) {
                if (metadata.expiresAt && metadata.expiresAt < new Date()) {
                    continue;
                }
                return metadata;
            }
        }
        return this.createKey(purpose);
    }
    async createKey(purpose) {
        const lastKey = await this.prisma.encryptionKey.findFirst({
            where: { purpose },
            orderBy: { version: 'desc' },
        });
        const version = (lastKey?.version ?? 0) + 1;
        const keyRecord = await this.prisma.encryptionKey.create({
            data: {
                purpose,
                version,
                algorithm: 'AES-256-GCM',
                isActive: true,
                vaultKeyPath: `vault://syntegra/keys/${purpose}/v${version}`,
            },
        });
        const derivedKey = this.deriveKeyForPurpose(purpose, version);
        this.keyStore.set(keyRecord.id, derivedKey);
        const metadata = {
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
    async rotateKey(purpose) {
        const currentKey = await this.getActiveKey(purpose);
        await this.prisma.encryptionKey.update({
            where: { id: currentKey.keyId },
            data: {
                isActive: false,
                rotatedAt: new Date(),
            },
        });
        const cachedMeta = this.keyMetadataCache.get(currentKey.keyId);
        if (cachedMeta) {
            cachedMeta.isActive = false;
            cachedMeta.rotatedAt = new Date();
        }
        const newKey = await this.createKey(purpose);
        this.logger.warn(`Key rotated: ${purpose} v${currentKey.version} -> v${newKey.version}`);
        return {
            oldKey: { ...currentKey, isActive: false, rotatedAt: new Date() },
            newKey,
        };
    }
    async getKeyById(keyId) {
        if (this.keyStore.has(keyId)) {
            return this.keyStore.get(keyId);
        }
        const keyRecord = await this.prisma.encryptionKey.findUnique({
            where: { id: keyId },
        });
        if (!keyRecord) {
            throw new crypto_interfaces_1.DecryptionError(`Key not found: ${keyId}`, keyId, '', crypto_interfaces_1.DecryptionFailureReason.KEY_NOT_FOUND);
        }
        if (keyRecord.rotatedAt && !keyRecord.isActive) {
            this.logger.warn(`Using rotated key for decryption: ${keyId}`);
        }
        const derivedKey = this.deriveKeyForPurpose(keyRecord.purpose, keyRecord.version);
        this.keyStore.set(keyId, derivedKey);
        this.keyMetadataCache.set(keyId, {
            keyId: keyRecord.id,
            purpose: keyRecord.purpose,
            version: keyRecord.version,
            algorithm: keyRecord.algorithm,
            isActive: keyRecord.isActive,
            createdAt: keyRecord.createdAt,
            rotatedAt: keyRecord.rotatedAt ?? undefined,
            expiresAt: keyRecord.expiresAt ?? undefined,
        });
        return derivedKey;
    }
    deriveUserPersonalKey(userId) {
        const info = `user-personal-key:${userId}`;
        return Buffer.from(crypto.hkdfSync('sha256', this.masterKey, '', info, 32));
    }
    async validateKeyForDecryption(keyId) {
        const metadata = this.keyMetadataCache.get(keyId);
        if (!metadata) {
            await this.getKeyById(keyId);
            return;
        }
        if (metadata.expiresAt && metadata.expiresAt < new Date()) {
            throw new crypto_interfaces_1.DecryptionError(`Key expired: ${keyId}`, keyId, '', crypto_interfaces_1.DecryptionFailureReason.KEY_EXPIRED);
        }
    }
    deriveKeyForPurpose(purpose, version) {
        const info = `syntegra:${purpose}:v${version}`;
        return Buffer.from(crypto.hkdfSync('sha256', this.masterKey, '', info, 32));
    }
    getKeyMetadata(keyId) {
        return this.keyMetadataCache.get(keyId);
    }
    async listKeys(purpose) {
        const keys = await this.prisma.encryptionKey.findMany({
            where: { purpose },
            orderBy: { version: 'desc' },
        });
        return keys.map((k) => ({
            keyId: k.id,
            purpose: k.purpose,
            version: k.version,
            algorithm: k.algorithm,
            isActive: k.isActive,
            createdAt: k.createdAt,
            rotatedAt: k.rotatedAt ?? undefined,
            expiresAt: k.expiresAt ?? undefined,
        }));
    }
};
exports.KeyManagementService = KeyManagementService;
exports.KeyManagementService = KeyManagementService = KeyManagementService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], KeyManagementService);
//# sourceMappingURL=key-management.service.js.map