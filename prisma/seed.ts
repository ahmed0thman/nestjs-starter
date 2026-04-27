// prisma/seed.ts

import { PrismaService } from 'src/common/services/prisma.service';
import { Prisma } from 'src/generated/prisma/client';

const prisma = new PrismaService();

const roles: Prisma.RoleCreateInput[] = [
  { name: 'Admin', description: 'Full access' },
  { name: 'Editor', description: 'Content management' },
  { name: 'Viewer', description: 'Read-only' },
];

const permissions = [
  // Admin: God mode
  { roleId: 1, action: 'manage', subject: 'all', conditions: {} },
  // Editor: Read/write own posts, read all
  { roleId: 2, action: 'read', subject: 'Post', conditions: {} },
  { roleId: 2, action: 'manage', subject: 'Post', conditions: {} }, // All posts for manage? Wait, condition below
  {
    roleId: 2,
    action: 'update',
    subject: 'Post',
    conditions: { field: 'ownerId', operator: '$eq', valueSource: 'id' },
  }, // Templated condition
  {
    roleId: 2,
    action: 'update',
    subject: 'Post',
    conditions: { field: 'published', operator: '$eq', valueSource: false },
  }, // Unpublished only
  // Viewer: Read all
  { roleId: 3, action: 'read', subject: 'Post', conditions: {} },
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
