import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule, ObserveInstrument } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  const config= new DocumentBuilder()
    .setTitle("dbml_app_api")
    .setDescription("restfull api for development")
    .setVersion("1.0")
    .addTag("dbml")
    .build();

  const documentFactory=()=>SwaggerModule.createDocument(app,config);
  SwaggerModule.setup('api',app,documentFactory)

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
