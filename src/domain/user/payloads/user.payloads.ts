export const userValidatedSelect = {
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
    select: {
      id: true,
      failedLoginAttempts: true,
      lastFailedLogin: true,
      lockoutUntil: true,
      lastPasswordChange: true,
      mfaEnabled: true,
      mfaMethod: true,
    },
  },
} as const;

export const userFoundSelect = {
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
};
