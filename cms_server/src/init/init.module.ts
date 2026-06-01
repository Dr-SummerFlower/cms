import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Concert, ConcertSchema } from '../concerts/entities/concert.entity';
import { EcdsaModule } from '../ecdsa/ecdsa.module';
import { StoragesModule } from '../storages/storages.module';
import { User, UserSchema } from '../users/entities/user.entity';
import { InitService } from './init.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Concert.name, schema: ConcertSchema },
    ]),
    StoragesModule,
    EcdsaModule,
  ],
  providers: [InitService],
})
export class InitModule {}
