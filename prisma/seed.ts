// prisma/seed.ts
import { PrismaClient, GlobalRole, ContextualRole } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
    console.log('🌱 Seeding database...');

    // Create therapist user
    const terapeuta = await prisma.user.upsert({
        where: { email: 'terapeuta@gestor.psic' },
        update: {},
        create: {
            email: 'terapeuta@gestor.psic',
            passwordHash: hashPassword('Terapeuta2026!'),
            firstName: 'Ana',
            lastName: 'García López',
            globalRole: GlobalRole.TERAPEUTA,
            licenseNumber: 'CEDULA-PSI-12345',
            isActive: true,
        },
    });
    console.log(`✅ Terapeuta: ${terapeuta.email} (${terapeuta.id})`);

    // Create supervisor user
    const supervisor = await prisma.user.upsert({
        where: { email: 'supervisor@gestor.psic' },
        update: {},
        create: {
            email: 'supervisor@gestor.psic',
            passwordHash: hashPassword('Supervisor2026!'),
            firstName: 'Carlos',
            lastName: 'Martínez Ruiz',
            globalRole: GlobalRole.SUPERVISOR,
            licenseNumber: 'CEDULA-PSI-67890',
            isActive: true,
        },
    });
    console.log(`✅ Supervisor: ${supervisor.email} (${supervisor.id})`);

    // Create a sample patient
    const patient = await prisma.patient.create({
        data: {
            externalId: 'PAC-001',
            firstName: 'María',
            lastName: 'Rodríguez Hernández',
            dateOfBirth: new Date('1990-05-15'),
            gender: 'Femenino',
            contactPhone: '+52 55 1234 5678',
            contactEmail: 'maria.rodriguez@email.com',
            address: 'Calle Reforma 123, Col. Centro, CDMX',
            emergencyContactName: 'José Rodríguez',
            emergencyPhone: '+52 55 8765 4321',
            emergencyRelation: 'Padre',
            createdBy: terapeuta.id,
            isActive: true,
        },
    });
    console.log(`✅ Patient: ${patient.firstName} ${patient.lastName} (${patient.id})`);

    // Assign therapist to patient via ClinicalCollaboration
    await prisma.clinicalCollaboration.create({
        data: {
            patientId: patient.id,
            userId: terapeuta.id,
            contextualRole: ContextualRole.TERAPEUTA_TITULAR,
            isActive: true,
        },
    });
    console.log(`✅ Assigned terapeuta as TERAPEUTA_TITULAR for ${patient.firstName}`);

    // Assign supervisor to patient
    await prisma.clinicalCollaboration.create({
        data: {
            patientId: patient.id,
            userId: supervisor.id,
            contextualRole: ContextualRole.SUPERVISOR_CASO,
            isActive: true,
        },
    });
    console.log(`✅ Assigned supervisor as SUPERVISOR_CASO for ${patient.firstName}`);

    console.log('\n📋 Login credentials:');
    console.log('  Terapeuta: terapeuta@gestor.psic / Terapeuta2026!');
    console.log('  Supervisor: supervisor@gestor.psic / Supervisor2026!');
    console.log('\n🌱 Seed complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
