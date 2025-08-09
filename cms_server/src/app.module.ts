import { RedisModule } from '@nestjs-redis/client';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConcertsModule } from './concerts/concerts.module';
import { EmailModule } from './email/email.module';
import { GlobalModule } from './global/global.module';
import { InitModule } from './init/init.module';
import { UsersModule } from './users/users.module';

const envFilePath = ['.env'];
const IS_DEV = process.env.RUNNING_ENV !== 'prod';
if (IS_DEV) {
  envFilePath.unshift('.env.dev');
} else {
  envFilePath.unshift('.env.prod');
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('DB_URI'),
      }),
      inject: [ConfigService],
    }),
    RedisModule.forRootAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'client',
        options: {
          url: configService.get<string>('REDIS_URI'),
        },
      }),
    }),
    GlobalModule,
    UsersModule,
    AuthModule,
    EmailModule,
    InitModule,
    ConcertsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
