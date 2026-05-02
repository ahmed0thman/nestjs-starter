// prisma/seed.ts

import { PrismaService } from 'src/common/services/prisma.service';
import { Prisma } from 'src/generated/prisma/client';

const prisma = new PrismaService();

const roles: Prisma.RoleCreateInput[] = [
  { name: 'Super Admin', description: 'System Cardinal' },
  { name: 'Admin', description: 'Full access' },
  { name: 'User', description: 'Standard user' },
];

const permissions = [
  // Super Admin: God mode
  { roleId: 1, action: 'manage', subject: 'all', conditions: {} },
  // Admin: manage all users and posts, but cannot delete published posts
  {
    roleId: 2,
    action: 'manage',
    subject: 'Post',
    conditions: {},
  },
  {
    roleId: 2,
    action: 'delete',
    subject: 'Post',
    inverted: true,
    conditions: { field: 'published', operator: '$eq', valueSource: true },
  },
  // User: Manage own profile
  {
    roleId: 3,
    action: 'manage',
    subject: 'User',
    conditions: { field: 'id', operator: '$eq', valueSource: 'id' },
  },

  // User: Manage own posts, read all published posts
  {
    roleId: 3,
    action: 'manage',
    subject: 'Post',
    conditions: { field: 'ownerId', operator: '$eq', valueSource: 'id' },
  },

  // User: Read all Published posts, (More specific permissions comes later)
  {
    roleId: 3,
    action: 'read',
    subject: 'Post',
    conditions: { field: 'published', operator: '$eq', valueSource: true },
  },
];

async function main() {
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      create: role,
      update: role,
    });
  }
  for (const perm of permissions) {
    await prisma.permission.create({
      data: perm,
    });
  }
  // Add users...
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
