import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.enableCors();
  app.setGlobalPrefix('api');

  const port = configService.get<number>('port') ?? 3000;
  await app.listen(port);
  Logger.log(`AfriCrypto backend listening on http://localhost:${port}/api`, 'Bootstrap');
}

bootstrap();
