import { authSecurity, User } from 'src/generated/prisma/client';

export interface IUserValidated extends Pick<
  User,
  | 'id'
  | 'email'
  | 'firstName'
  | 'lastName'
  | 'username'
  | 'password'
  | 'role'
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
}
