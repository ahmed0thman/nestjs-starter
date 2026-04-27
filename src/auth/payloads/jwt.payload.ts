export interface JwtPayload {
  sub: string; // user ID
  iat: number; // issued at timestamp
  exp: number; // expiration timestamp
  jti: string; // JWT ID, a unique identifier for the token
  [key: string]: any; // additional custom claims
}
