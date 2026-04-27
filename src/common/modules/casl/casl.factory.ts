import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/services/prisma.service';
import { Action, RuleSubject, type AppAbility } from './casl.types';
import { AppLoggerService } from '../logger/logger.service';
import { RUserFound } from 'src/domain/user/responses/user-found.response';

@Injectable()
export class CaslFactory {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async createForUser(user: RUserFound): Promise<AppAbility> {
    const { can, build, cannot } = new AbilityBuilder<AppAbility>(
      createMongoAbility,
    );
    // Fetch permissions for the user's roles
    const permissions = await this.prismaService.permission.findMany({
      where: {
        roleId: user.role.id,
      },
    });
    // sort permissions so all inverted permissions come last (e.g. inverted === true)
    permissions.sort((a, b) => {
      if (a.inverted && !b.inverted) return 1;
      if (!a.inverted && b.inverted) return -1;
      return 0;
    });
    // this.logger.log(
    //   `Permissions for user ${user.id}: ${JSON.stringify(permissions)}`,
    // );

    // Build abilities based on permissions
    for (const perm of permissions) {
      const conditions = {};
      if (perm.conditions && typeof perm.conditions === 'object') {
        if (
          'field' in perm.conditions &&
          typeof perm.conditions.field === 'string' &&
          'operator' in perm.conditions &&
          typeof perm.conditions.operator === 'string' &&
          'valueSource' in perm.conditions &&
          (typeof perm.conditions.valueSource === 'string' ||
            typeof perm.conditions.valueSource === 'number' ||
            typeof perm.conditions.valueSource === 'boolean')
        ) {
          const { field, operator, valueSource } = perm.conditions;
          conditions[field] = {
            [operator]: valueSource,
          };
        }
      }
      // this.logger.warn(
      //   `Processing permission: action=${perm.action}, subject=${perm.subject}, conditions=${JSON.stringify(
      //     conditions,
      //   )}, inverted=${perm.inverted}`,
      // );
      if (perm.inverted) {
        // push inverted permissions to the end of the rules array, so they are evaluated last
        cannot(perm.action as Action, perm.subject as RuleSubject, conditions);
      } else {
        can(perm.action as Action, perm.subject as RuleSubject, conditions);
      }
    }
    return build();
  }
}
