import { MailerModule } from '@nestjs-modules/mailer';
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';
import { RedisModule } from '@nestjs-redis/client';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import * as path from 'path';
import { GlobalFilter } from './global.filter';
import { GlobalInterceptor } from './global.interceptor';

// 环境配置文件路径数组
const envFilePath: string[] = ['.env'];

/**
 * 开发环境标识
 * @constant {boolean} IS_DEV
 * @description 判断当前是否为开发环境，用于区分开发和生产环境配置
 */
export const IS_DEV: boolean = process.env.RUNNING_ENV !== 'prod';

// 根据环境加载对应的配置文件
if (IS_DEV) {
  // 开发环境优先加载.env.dev配置文件
  envFilePath.unshift('.env.dev');
} else {
  // 生产环境优先加载.env.prod配置文件
  envFilePath.unshift('.env.prod');
}

/**
 * 全局模块
 * @class GlobalModule
 * @description 配置应用的全局服务，包括数据库连接、缓存、邮件服务和全局拦截器/过滤器
 */
@Module({
  imports: [
    // 全局配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: envFilePath,
    }),
    // MongoDB数据库连接配置
    MongooseModule.forRootAsync({
      inject: [ConfigService], // 注入配置服务
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>(
          'DB_URI',
          'mongodb://localhost:27017/cms_default', // 默认数据库连接字符串
        ),
        maxPoolSize: 50,
        connectTimeoutMS: 30000,
        serverSelectionTimeoutMS: 5000,
      }),
    }),
    // Redis缓存配置
    RedisModule.forRootAsync({
      isGlobal: true, // 设置为全局模块
      inject: [ConfigService], // 注入配置服务
      useFactory: (config: ConfigService) => ({
        type: 'client',
        options: {
          url: config.get<string>('REDIS_URI', 'redis://localhost:6379'), // 默认Redis连接字符串
        },
      }),
    }),
    // 邮件服务配置
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        // SMTP传输配置
        transport: {
          host: 'smtp.qq.com', // QQ邮箱SMTP服务器地址
          port: 465, // SSL端口
          secure: true, // 使用SSL加密
          auth: {
            user: config.get<string>('NOTIFY_EMAIL_USER'), // 发件人邮箱
            pass: config.get<string>('NOTIFY_EMAIL_PWD'), // 邮箱授权码
          },
        },
        // 默认发件人配置
        defaults: {
          from: `"演唱会管理组" <${config.get<string>('NOTIFY_EMAIL_USER')}>`,
        },
        // 模板引擎配置
        template: {
          dir: path.join(path.resolve(), 'template'), // 模板文件目录
          adapter: new PugAdapter(), // 使用Pug模板引擎
          options: {
            strict: true, // 启用严格模式
          },
        },
      }),
    }),
    ScheduleModule.forRoot(),
  ],
  providers: [
    // 全局响应拦截器提供者
    {
      provide: 'APP_INTERCEPTOR',
      useClass: GlobalInterceptor,
    },
    // 全局异常过滤器提供者
    {
      provide: 'APP_FILTER',
      useClass: GlobalFilter,
    },
    // 密钥提供者
    {
      provide: 'ENCRYPTION_KEY',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return config.get<string>(
          'ENCRYPTION_KEY',
          'default-key-32-characters-long!',
        );
      },
    },
  ],
})
export class GlobalModule {}
