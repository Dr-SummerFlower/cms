import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConcertsModule } from './concerts/concerts.module';
import { EcdsaModule } from './ecdsa/ecdsa.module';
import { EmailModule } from './email/email.module';
import { GlobalModule } from './global/global.module';
import { InitModule } from './init/init.module';
import { StoragesModule } from './storages/storages.module';
import { TicketsModule } from './tickets/tickets.module';
import { UsersModule } from './users/users.module';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
