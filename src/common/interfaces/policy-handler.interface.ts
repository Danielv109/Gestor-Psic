// src/common/interfaces/policy-handler.interface.ts
import { AuthenticatedUser } from './authenticated-user.interface';
import { PolicyContext } from './policy-context.interface';

export interface PolicyHandler {
    handle(user: AuthenticatedUser, request: any, context?: PolicyContext): Promise<boolean>;
}
