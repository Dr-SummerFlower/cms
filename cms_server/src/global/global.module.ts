import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RedisModule } from '@nestjs-redis/client';
import { MailerModule } from '@nestjs-modules/mailer';
import path from 'path';
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';
import { GlobalInterceptor } from './global.interceptor';
import { GlobalFilter } from './global.filter';

// 环境配置文件路径数组
const envFilePath = ['.env'];
// 是否为开发环境
export const IS_DEV = process.env.RUNNING_ENV !== 'prod';

// 根据环境加载对应的配置文件
if (IS_DEV) {
  envFilePath.unshift('.env.dev');
} else {
  envFilePath.unshift('.env.prod');
}

@Module({
  imports: [
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
          'mongodb://localhost:27017/show_tix_default', // 默认数据库连接字符串
        ),
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
            user: config.get<string>('EMAIL_USER'), // 发件人邮箱
            pass: config.get<string>('EMAIL_PWD'), // 邮箱授权码
          },
        },
        // 默认发件人配置
        defaults: {
          from: `"演唱会管理组" <${config.get<string>('EMAIL_USER')}>`,
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
  ],
  providers: [
    {
      provide: 'APP_INTERCEPTOR',
      useClass: GlobalInterceptor,
    },
    {
      provide: 'APP_FILTER',
      useClass: GlobalFilter,
    },
  ],
})
export class GlobalModule {}
