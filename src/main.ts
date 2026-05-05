import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Habilitar CORS para aceitar requisições do frontend
  app.enableCors({
    origin: 'http://localhost:4200', // URL do frontend
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Authorization'
  });
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
