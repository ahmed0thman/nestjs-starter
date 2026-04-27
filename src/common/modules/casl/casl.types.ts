import { MongoAbility } from '@casl/ability';

export type Action = 'manage' | 'create' | 'read' | 'update' | 'delete';
export type Entity = 'User' | 'Post';
export type RuleSubject = Entity | 'all';

export type Condition<F = unknown, T = unknown> =
  | {
      field: keyof F;
      operator: '$eq' | '$ne' | '$gt' | '$lt' | '$in' | '$nin';
      valueSource: keyof T;
    }
  | object;

export type AppAbility = MongoAbility<[Action, RuleSubject]>;
