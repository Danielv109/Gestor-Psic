import { GlobalRole } from '@prisma/client';
export interface AuthenticatedUser {
    id: string;
    email: string;
    globalRole: GlobalRole;
    firstName: string;
    lastName: string;
    ip: string;
    userAgent?: string;
}
