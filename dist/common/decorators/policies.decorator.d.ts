import { Type } from '@nestjs/common';
import { PolicyHandler } from '../interfaces/policy-handler.interface';
export declare const CHECK_POLICIES_KEY = "check_policies";
export declare const CheckPolicies: (...handlers: Type<PolicyHandler>[]) => import("@nestjs/common").CustomDecorator<string>;
