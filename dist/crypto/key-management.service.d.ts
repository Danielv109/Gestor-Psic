import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionKeyMetadata, KeyPurpose } from './interfaces/crypto.interfaces';
export declare class KeyManagementService implements OnModuleInit {
    private readonly config;
    private readonly prisma;
    private readonly logger;
    private readonly keyStore;
    private readonly keyMetadataCache;
    private masterKey;
    constructor(config: ConfigService, prisma: PrismaService);
    onModuleInit(): Promise<void>;
    private initializeMasterKey;
    private loadActiveKeys;
    getActiveKey(purpose: KeyPurpose): Promise<EncryptionKeyMetadata>;
    createKey(purpose: KeyPurpose): Promise<EncryptionKeyMetadata>;
    rotateKey(purpose: KeyPurpose): Promise<{
        oldKey: EncryptionKeyMetadata;
        newKey: EncryptionKeyMetadata;
    }>;
    getKeyById(keyId: string): Promise<Buffer>;
    deriveUserPersonalKey(userId: string): Buffer;
    validateKeyForDecryption(keyId: string): Promise<void>;
    private deriveKeyForPurpose;
    getKeyMetadata(keyId: string): EncryptionKeyMetadata | undefined;
    listKeys(purpose: KeyPurpose): Promise<EncryptionKeyMetadata[]>;
}
