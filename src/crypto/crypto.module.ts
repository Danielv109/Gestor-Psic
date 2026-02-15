// src/crypto/crypto.module.ts
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CryptoService } from './crypto.service';
import { KeyManagementService } from './key-management.service';

@Global()
@Module({
    imports: [ConfigModule],
    providers: [CryptoService, KeyManagementService],
    exports: [CryptoService, KeyManagementService],
})
export class CryptoModule { }
