import { SetMetadata } from '@nestjs/common';
import { Action, RuleSubject } from '../modules/casl/casl.types';

export const CHECK_ABILITY_KEY = 'check_ability';
export interface RequiredRule {
  action: Action;
  subject: RuleSubject;
}

export const CheckAbilities = (...handlers: RequiredRule[]) =>
  SetMetadata(CHECK_ABILITY_KEY, handlers);
