import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { env } from './common/config/env/env';
import { I18nValidationPipe } from 'nestjs-i18n';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // set global prefix for all routes
  const globalPrefix = `api/${env.API_VERSION}`;
  app.setGlobalPrefix(globalPrefix);
  app.useGlobalPipes(new I18nValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('My API')
    .setDescription('My API description')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${globalPrefix}/docs`, app, document);

  await app.listen(env.PORT ?? 3000);
}
bootstrap();
