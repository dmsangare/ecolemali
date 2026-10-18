import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters';

function validateEnv() {
  const logger = new Logger('EnvCheck');
  const required = ["DATABASE_URL", "JWT_SECRET", "JWT_REFRESH_SECRET"];

  for (const key of required) {
    const value = process.env[key];
    if (!value || value.trim() === "" || value === "CHANGE_ME" || value.startsWith("CHANGE_ME")) {
      logger.error(`Variable d'environnement manquante ou invalide : ${key}`);
      logger.error("Verifiez votre fichier .env avant de demarrer l'application.");
      process.exit(1);
    }
  }
  logger.log("Variables d'environnement OK");
}

async function bootstrap() {
  validateEnv();
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 3000);
  const nodeEnv = config.get<string>('NODE_ENV', 'development');

  app.use(helmet());
  app.use(cookieParser());

  app.enableCors({
    origin: config.get<string>('FRONTEND_URL', 'http://localhost:5173').split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Les fichiers /uploads/ et /documents/ sont servis via des routes API protegees.
  // Plus de useStaticAssets pour eviter l'acces non authentifie.
  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('SIS-MALI API')
      .setDescription("API REST du Systeme d'Information Scolaire pour le Mali")
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', name: 'Authorization', in: 'header' },
        'access-token',
      )
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, { swaggerOptions: { persistAuthorization: true } });
    logger.log(`Swagger: http://localhost:${port}/api/docs`);
  }

  await app.listen(port, '0.0.0.0');
  logger.log(`SIS-MALI API running on http://0.0.0.0:${port}`);
}

bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});