import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StoragesModule } from '../storages/storages.module';
import { User, UserSchema } from '../users/entities/user.entity';
import { InitService } from './init.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    StoragesModule,
  ],
  providers: [InitService],
})
export class InitModule {}
