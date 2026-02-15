import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { SystemBootstrapService } from './system-bootstrap.service';
import { BootstrapUserDto } from './interfaces/bootstrap.interfaces';
export declare class SystemBootstrapController {
    private readonly bootstrapService;
    private readonly configService;
    constructor(bootstrapService: SystemBootstrapService, configService: ConfigService);
    bootstrap(dto: BootstrapUserDto, setupToken: string, req: Request): Promise<import("./interfaces/bootstrap.interfaces").BootstrapResult>;
    private extractIp;
}
