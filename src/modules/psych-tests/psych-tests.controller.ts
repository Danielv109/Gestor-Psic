import { Controller, Get, Post, Delete, Param, Body, Req, Query } from '@nestjs/common';
import { PsychTestsService } from './psych-tests.service';
import { CreateTestResultDto } from './dto/create-test-result.dto';

@Controller()
export class PsychTestsController {
    constructor(private readonly psychTests: PsychTestsService) { }

    @Get('psych-tests/catalog')
    getCatalog() {
        return this.psychTests.getCatalog();
    }

    @Post('patients/:patientId/test-results')
    async createResult(
        @Param('patientId') patientId: string,
        @Body() dto: CreateTestResultDto,
        @Req() req: any,
    ) {
        return this.psychTests.create(patientId, dto, {
            id: req.user.sub,
            ip: req.ip || '0.0.0.0',
        });
    }

    @Get('patients/:patientId/test-results')
    async getResults(
        @Param('patientId') patientId: string,
        @Query('testName') testName?: string,
    ) {
        return this.psychTests.findByPatient(patientId, testName);
    }

    @Get('patients/:patientId/test-results/evolution')
    async getEvolution(
        @Param('patientId') patientId: string,
        @Query('testName') testName: string,
    ) {
        return this.psychTests.getEvolution(patientId, testName);
    }

    @Get('patients/:patientId/test-results/tests')
    async getDistinctTests(@Param('patientId') patientId: string) {
        return this.psychTests.getDistinctTests(patientId);
    }

    @Delete('test-results/:id')
    async deleteResult(@Param('id') id: string, @Req() req: any) {
        return this.psychTests.delete(id, {
            id: req.user.sub,
            ip: req.ip || '0.0.0.0',
        });
    }
}
