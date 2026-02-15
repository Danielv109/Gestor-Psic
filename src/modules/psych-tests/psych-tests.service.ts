import { Injectable, NotFoundException } from '@nestjs/common';
import { PsychTestsRepository } from './psych-tests.repository';
import { CreateTestResultDto } from './dto/create-test-result.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditResource } from '@prisma/client';

// Catálogo de pruebas más utilizadas en psicología clínica
export interface SeverityRange { min: number; max: number; label: string }
export interface TestCatalogEntry { code: string; name: string; maxScore: number | null; severities: SeverityRange[] }

export const PSYCH_TEST_CATALOG: TestCatalogEntry[] = [
    {
        code: 'BDI-II', name: 'Inventario de Depresión de Beck', maxScore: 63,
        severities: [
            { min: 0, max: 13, label: 'Mínimo' },
            { min: 14, max: 19, label: 'Leve' },
            { min: 20, max: 28, label: 'Moderado' },
            { min: 29, max: 63, label: 'Severo' },
        ]
    },
    {
        code: 'BAI', name: 'Inventario de Ansiedad de Beck', maxScore: 63,
        severities: [
            { min: 0, max: 7, label: 'Mínimo' },
            { min: 8, max: 15, label: 'Leve' },
            { min: 16, max: 25, label: 'Moderado' },
            { min: 26, max: 63, label: 'Severo' },
        ]
    },
    {
        code: 'PHQ-9', name: 'Patient Health Questionnaire-9', maxScore: 27,
        severities: [
            { min: 0, max: 4, label: 'Mínimo' },
            { min: 5, max: 9, label: 'Leve' },
            { min: 10, max: 14, label: 'Moderado' },
            { min: 15, max: 19, label: 'Moderadamente severo' },
            { min: 20, max: 27, label: 'Severo' },
        ]
    },
    {
        code: 'GAD-7', name: 'Generalized Anxiety Disorder-7', maxScore: 21,
        severities: [
            { min: 0, max: 4, label: 'Mínimo' },
            { min: 5, max: 9, label: 'Leve' },
            { min: 10, max: 14, label: 'Moderado' },
            { min: 15, max: 21, label: 'Severo' },
        ]
    },
    {
        code: 'HAMILTON-D', name: 'Escala de Hamilton para Depresión', maxScore: 52,
        severities: [
            { min: 0, max: 7, label: 'Normal' },
            { min: 8, max: 13, label: 'Leve' },
            { min: 14, max: 18, label: 'Moderado' },
            { min: 19, max: 22, label: 'Severo' },
            { min: 23, max: 52, label: 'Muy severo' },
        ]
    },
    { code: 'MMPI-2', name: 'Inventario Multifásico de Personalidad de Minnesota', maxScore: null, severities: [] },
    { code: 'STAI', name: 'Inventario de Ansiedad Estado-Rasgo', maxScore: 80, severities: [] },
    { code: 'SCL-90', name: 'Symptom Checklist-90', maxScore: null, severities: [] },
];

@Injectable()
export class PsychTestsService {
    constructor(
        private readonly repo: PsychTestsRepository,
        private readonly audit: AuditService,
    ) { }

    getCatalog() {
        return PSYCH_TEST_CATALOG;
    }

    async create(patientId: string, dto: CreateTestResultDto, user: { id: string; ip: string }) {
        // Auto-calculate severity from catalog if not provided
        let severity = dto.severity;
        if (!severity && dto.testCode) {
            const catalogEntry = PSYCH_TEST_CATALOG.find(t => t.code === dto.testCode);
            if (catalogEntry) {
                const match = catalogEntry.severities.find(
                    s => dto.rawScore >= s.min && dto.rawScore <= s.max,
                );
                if (match) severity = match.label;
            }
        }

        const result = await this.repo.create({
            patientId,
            therapistId: user.id,
            sessionId: dto.sessionId,
            testName: dto.testName,
            testCode: dto.testCode,
            rawScore: dto.rawScore,
            maxScore: dto.maxScore,
            severity,
            percentile: dto.percentile,
            notes: dto.notes,
            appliedAt: new Date(dto.appliedAt),
        });

        await this.audit.log({
            actorId: user.id,
            actorIp: user.ip,
            action: AuditAction.CREATE,
            resource: AuditResource.PSYCH_TEST,
            resourceId: result.id,
            patientId,
            details: { testName: dto.testName, rawScore: dto.rawScore },
        });

        return result;
    }

    async findByPatient(patientId: string, testName?: string) {
        return this.repo.findByPatient(patientId, testName);
    }

    async getEvolution(patientId: string, testName: string) {
        return this.repo.getEvolution(patientId, testName);
    }

    async getDistinctTests(patientId: string) {
        return this.repo.getDistinctTests(patientId);
    }

    async delete(id: string, user: { id: string; ip: string }) {
        const result = await this.repo.findById(id);
        if (!result) throw new NotFoundException('Resultado no encontrado');

        await this.repo.delete(id);

        await this.audit.log({
            actorId: user.id,
            actorIp: user.ip,
            action: AuditAction.DELETE,
            resource: AuditResource.PSYCH_TEST,
            resourceId: id,
            patientId: result.patientId,
        });
    }
}
