export interface JwtPayload {
  sub: string; // user ID
  iat: number; // issued at timestamp
  exp: number; // expiration timestamp
  [key: string]: any; // additional custom claims
}
