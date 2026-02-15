import { IsUUID, IsString, IsNumber, IsOptional, IsDateString, Min, Max } from 'class-validator';

export class CreateTestResultDto {
    @IsString()
    testName: string;

    @IsOptional()
    @IsString()
    testCode?: string;

    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    rawScore: number;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    maxScore?: number;

    @IsOptional()
    @IsString()
    severity?: string;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @Max(100)
    percentile?: number;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsDateString()
    appliedAt: string;

    @IsOptional()
    @IsUUID()
    sessionId?: string;
}
