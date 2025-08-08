import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Applicaton');
  const app: INestApplication = await NestFactory.create(AppModule);
  const configService: ConfigService = app.get(ConfigService);

  // 全局前缀
  app.setGlobalPrefix('api');

  // CORS配置
  app.enableCors({
    origin: true,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
  });

  // 全局管道配置
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动删除未在DTO中定义的属性
      forbidNonWhitelisted: true, // 禁止提交未在DTO中定义的属性
      transform: true, // 自动类型转换
    }),
  );

  // Swagger配置
  const config: Omit<OpenAPIObject, 'paths'> = new DocumentBuilder()
    .setTitle('演唱会管理系统API')
    .setDescription('演唱会管理系统的RESTful API文档')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'bearer',
    )
    .build();
  const document: OpenAPIObject = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // 获取端口
  const port: number = configService.get<number>('PORT') || 3000;

  await app.listen(port);
  logger.log(`服务器启动成功，端口：${port}`);
  logger.log(`Swagger文档地址：http://localhost:${port}/api-docs`);
}

bootstrap().catch((error: Error): never => {
  console.error('应用启动失败:', error);
  process.exit(1);
});
