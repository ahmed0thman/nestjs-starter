import { userRole, userStatus } from 'src/generated/prisma/enums';

export interface IUserPayload {
  sub: string;
  jti?: string; // JWT ID, a unique identifier for the token, optional as we use it only for refresh tokens
  email: string;
  firstName: string;
  lastName: string | null;
  username: string;
  role: userRole;
  status: userStatus;
}

export interface ITokensPayload {
  accessToken: string;
  refreshToken: string;
}

export interface IAuthUser {
  user: IUserPayload;
  token: ITokensPayload;
}
