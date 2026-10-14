import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from "cookie-parser";
import { AppModule, ObserveInstrument } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.WEB_APP_URL ?? "http://localhost:5173",
    credentials: true,
  });

  const config= new DocumentBuilder()
    .setTitle("dbml_app_api")
    .setDescription("restfull api for development")
    .setVersion("1.0")
    .addTag("dbml")
    .build();

  const documentFactory=()=>SwaggerModule.createDocument(app,config);
  SwaggerModule.setup('api',app,documentFactory)

  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
