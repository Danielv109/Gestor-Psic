import { GlobalRole } from '@prisma/client';
export declare const ROLES_KEY = "roles";
export declare const Roles: (...roles: GlobalRole[]) => import("@nestjs/common").CustomDecorator<string>;
