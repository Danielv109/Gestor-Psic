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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SensitiveAccessInterceptor = exports.AuditSensitiveAccess = exports.AUDIT_SENSITIVE_ACCESS_KEY = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const core_1 = require("@nestjs/core");
const audit_service_1 = require("./audit.service");
exports.AUDIT_SENSITIVE_ACCESS_KEY = 'audit:sensitiveAccess';
const AuditSensitiveAccess = (config) => (0, common_1.SetMetadata)(exports.AUDIT_SENSITIVE_ACCESS_KEY, config);
exports.AuditSensitiveAccess = AuditSensitiveAccess;
let SensitiveAccessInterceptor = class SensitiveAccessInterceptor {
    constructor(reflector, auditService) {
        this.reflector = reflector;
        this.auditService = auditService;
    }
    intercept(context, next) {
        const config = this.reflector.get(exports.AUDIT_SENSITIVE_ACCESS_KEY, context.getHandler());
        if (!config) {
            return next.handle();
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            return next.handle();
        }
        const resourceId = request.params[config.resourceIdParam];
        const patientId = config.includePatientId && config.patientIdParam
            ? request.params[config.patientIdParam]
            : undefined;
        return next.handle().pipe((0, operators_1.tap)({
            next: () => {
                this.auditService.logSensitiveAccess({
                    actorId: user.id,
                    actorRole: user.globalRole,
                    actorIp: user.ip || request.ip,
                    resource: config.resource,
                    resourceId,
                    patientId,
                    accessType: config.accessType,
                }).catch((err) => {
                    console.error('Failed to log sensitive access:', err);
                });
            },
            error: () => {
            },
        }));
    }
};
exports.SensitiveAccessInterceptor = SensitiveAccessInterceptor;
exports.SensitiveAccessInterceptor = SensitiveAccessInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        audit_service_1.AuditService])
], SensitiveAccessInterceptor);
//# sourceMappingURL=sensitive-access.interceptor.js.map