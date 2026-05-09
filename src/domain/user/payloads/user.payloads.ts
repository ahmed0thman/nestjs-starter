import { authSecuritySelect, UserSelect } from 'src/generated/prisma/models';

export const userValidatedAuthSecuritiesSelect: authSecuritySelect = {
  id: true,
  failedLoginAttempts: true,
  lastFailedLogin: true,
  lockoutUntil: true,
  lastPasswordChange: true,
  mfaEnabled: true,
  mfaMethod: true,
};

export const userValidatedSelect: UserSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  username: true,
  password: true,
  status: true,
  verified: true,
  role: {
    select: {
      id: true,
      name: true,
    },
  },
  authSecurities: {
    select: userValidatedAuthSecuritiesSelect,
  },
} as const;

export const userFoundSelect: UserSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  username: true,
  status: true,
  role: {
    select: {
      id: true,
      name: true,
    },
  },
  authSecurities: {
    select: {
      id: true,
      lastPasswordChange: true,
    },
  },
} as const;
