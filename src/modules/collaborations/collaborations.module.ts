// src/modules/collaborations/collaborations.module.ts
import { Module } from '@nestjs/common';
import { CollaborationsRepository } from './collaborations.repository';

@Module({
    providers: [CollaborationsRepository],
    exports: [CollaborationsRepository],
})
export class CollaborationsModule { }
