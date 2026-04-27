import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { CaslFactory } from './casl.factory';
import AppError from 'src/common/errors/app.error';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import {
  CHECK_ABILITY_KEY,
  RequiredRule,
} from 'src/common/decorators/abilities.decorator';
import { PrismaService } from 'src/common/services/prisma.service';
import { Entity } from './casl.types';
import { AppLoggerService } from '../logger/logger.service';
import { RUserFound } from 'src/domain/user/responses/user-found.response';
import { ForbiddenError, subject } from '@casl/ability';
import { YcI18nService } from '../yc-i18n/yc-i18n.service';

@Injectable()
export class CaslGuard implements CanActivate {
  constructor(
    private readonly caslFactory: CaslFactory,
    private readonly prismaService: PrismaService,
    private readonly reflector: Reflector,
    private readonly logger: AppLoggerService,
    private readonly ycI18nService: YcI18nService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rules = this.reflector.get<RequiredRule[]>(
      CHECK_ABILITY_KEY,
      context.getHandler(),
    );
    if (!rules) return true; // if no rules are defined, allow access

    const request = context.switchToHttp().getRequest<Request>();
    this.logger.log(
      `Checking abilities for request ${request.method} ${request.url}`,
      'CaslGuard',
    );
    const user = request.user as RUserFound;
    if (!user) throw AppError.unauthorized();
    const ability = await this.caslFactory.createForUser(user);
    for (const rule of rules) {
      this.logger.log(
        `Checking rule: action=${rule.action}, subject=${rule.subject}`,
        'CaslGuard',
      );
      const { action, subject: entity } = rule;

      if (entity === 'all') {
        ForbiddenError.from(ability)
          .setMessage(this.ycI18nService.t('errors.forbidden'))
          .throwUnlessCan(action, entity);
        return true;
      }

      const subjectIdParam = request.params.id;
      const subjectId = Array.isArray(subjectIdParam)
        ? subjectIdParam[0]
        : subjectIdParam;
      if (!subjectId) {
        ForbiddenError.from(ability)
          .setMessage(this.ycI18nService.t('errors.forbidden'))
          .throwUnlessCan(action, entity);
        return true;
      }

      const subjectInstance = await this.fetchSubject(entity, subjectId);
      if (!subjectInstance) {
        ForbiddenError.from(ability)
          .setMessage(this.ycI18nService.t('errors.forbidden'))
          .throwUnlessCan(action, entity);
        return true;
      }

      const wrappedSubject = subject(
        entity,
        subjectInstance,
      ) as unknown as Entity;
      if (!ability.can(action, wrappedSubject)) {
        ForbiddenError.from(ability)
          .setMessage(this.ycI18nService.t('errors.forbidden'))
          .throwUnlessCan(action, wrappedSubject);
        return true;
      }
    }
    return true;
  }

  private async fetchSubject(subject: Entity, id: string | number) {
    switch (subject) {
      case 'User':
        return await this.prismaService.user.findUnique({
          where: { id: String(id) },
        });
      case 'Post':
        return await this.prismaService.post.findUnique({
          where: { id: Number(id) },
        });
    }
  }
}
