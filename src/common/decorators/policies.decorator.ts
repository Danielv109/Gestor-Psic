// src/common/decorators/policies.decorator.ts
import { SetMetadata, Type } from '@nestjs/common';
import { PolicyHandler } from '../interfaces/policy-handler.interface';

export const CHECK_POLICIES_KEY = 'check_policies';
export const CheckPolicies = (...handlers: Type<PolicyHandler>[]) =>
    SetMetadata(CHECK_POLICIES_KEY, handlers);
