import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as fs from 'node:fs';
import * as path from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConcertsModule } from './concerts/concerts.module';
import { EcdsaModule } from './ecdsa/ecdsa.module';
import { EmailModule } from './email/email.module';
import { FeedbackModule } from './feedback/feedback.module';
import { GlobalModule } from './global/global.module';
import { InitModule } from './init/init.module';
import { StoragesModule } from './storages/storages.module';
import { TicketsModule } from './tickets/tickets.module';
import { UsersModule } from './users/users.module';

const envFilePath: string[] = ['.env'];
const IS_DEV: boolean = process.env.RUNNING_ENV !== 'prod';
if (IS_DEV) {
  envFilePath.unshift('.env.dev');
} else {
  envFilePath.unshift('.env.prod');
}

if (!fs.existsSync(path.join(path.resolve(), 'public'))) {
  fs.mkdirSync(path.join(path.resolve(), 'public'));
}

@Module({
  imports: [
    GlobalModule,
    UsersModule,
    AuthModule,
    EmailModule,
    InitModule,
    ConcertsModule,
    EcdsaModule,
    TicketsModule,
    StoragesModule,
    FeedbackModule,
    ServeStaticModule.forRootAsync({
      useFactory: () => {
        return [
          {
            rootPath: path.join(path.resolve(), 'public'),
            serveRoot: '/',
            exclude: ['/api/*'],
          },
        ];
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
