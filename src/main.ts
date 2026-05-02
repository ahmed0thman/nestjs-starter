import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { env } from './common/config/env/env';
import { I18nValidationPipe } from 'nestjs-i18n';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  // set global prefix for all routes
  const globalPrefix = `api/${env.API_VERSION}`;
  app.setGlobalPrefix(globalPrefix);
  app.use(cookieParser());
  app.useGlobalPipes(new I18nValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('My API')
    .setDescription('My API description')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${globalPrefix}/docs`, app, document);

  await app.listen(env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
