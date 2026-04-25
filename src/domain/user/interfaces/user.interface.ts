import { authSecurity, Role, User } from 'src/generated/prisma/client';

export interface IUserValidated extends Pick<
  User,
  | 'id'
  | 'email'
  | 'firstName'
  | 'lastName'
  | 'username'
  | 'password'
  | 'status'
  | 'verified'
> {
  authSecurities?: Pick<
    authSecurity,
    | 'id'
    | 'failedLoginAttempts'
    | 'lastFailedLogin'
    | 'lockoutUntil'
    | 'lastPasswordChange'
    | 'mfaEnabled'
    | 'mfaMethod'
  >;
  role: Pick<Role, 'id' | 'name'>;
}
