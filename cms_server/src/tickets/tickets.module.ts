import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Concert, ConcertSchema } from '../concerts/entities/concert.entity';
import { EcdsaModule } from '../ecdsa/ecdsa.module';
import { EmailModule } from '../email/email.module';
import { User, UserSchema } from '../users/entities/user.entity';
import { Ticket, TicketSchema } from './entities/ticket.entity';
import {
  VerificationRecord,
  VerificationRecordSchema,
} from './entities/verification-record.entity';
import { TicketsController, VerifyController } from './tickets.controller';
import { TicketsService } from './tickets.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ticket.name, schema: TicketSchema },
      { name: VerificationRecord.name, schema: VerificationRecordSchema },
      { name: Concert.name, schema: ConcertSchema },
      { name: User.name, schema: UserSchema },
    ]),
    EcdsaModule,
    EmailModule,
  ],
  controllers: [TicketsController, VerifyController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
