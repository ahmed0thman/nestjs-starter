import { User } from 'src/generated/prisma/client';

export type CreatedUserDTO = Pick<
  User,
  'id' | 'email' | 'firstName' | 'lastName' | 'username'
>;
