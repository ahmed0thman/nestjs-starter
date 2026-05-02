// import { Post } from 'src/generated/prisma/client';
import { PostSelect } from 'src/generated/prisma/models';

// type postKeys = {
//   [K in keyof Post]: true;
// };

export const postCreatedSelect: PostSelect = {
  id: true,
  title: true,
  createdAt: true,
} as const;

export const postFoundSelect: PostSelect = {
  id: true,
  title: true,
  content: true,
  published: true,
  publishedAt: true,
  isEdited: true,
  updatedAt: true,
  isDeleted: true,
  isReported: true,
  isBlocked: true,
  isBlockedAt: true,
  owner: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  },
  createdAt: true,
} as const;
