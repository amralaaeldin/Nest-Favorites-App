import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { BigIntToJSON } from './utils/bigint-tojson';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );
  app.enableCors();

  dotenv.config();
  new BigIntToJSON();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
