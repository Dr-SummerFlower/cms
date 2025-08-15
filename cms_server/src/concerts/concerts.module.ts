import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from '../auth/auth.module';
import { EcdsaModule } from '../ecdsa/ecdsa.module';
import { EmailModule } from '../email/email.module';
import { Ticket, TicketSchema } from '../tickets/entities/ticket.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { ConcertsController } from './concerts.controller';
import { ConcertsSchedulerService } from './concerts-scheduler.service';
import { ConcertsService } from './concerts.service';
import { Concert, ConcertSchema } from './entities/concert.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Concert.name, schema: ConcertSchema },
      { name: Ticket.name, schema: TicketSchema },
      { name: User.name, schema: UserSchema },
    ]),
    ScheduleModule.forRoot(),
    forwardRef(() => AuthModule),
    EcdsaModule,
    EmailModule,
  ],
  controllers: [ConcertsController],
  providers: [ConcertsService, ConcertsSchedulerService],
  exports: [ConcertsService],
})
export class ConcertsModule {}
