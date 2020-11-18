import { Dictionary } from './entity/dictionary.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DictionaryController } from './dictionary.controller';
import { DictionaryService } from './dictionary.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Dictionary])
  ],
  providers: [DictionaryService],
  controllers: [DictionaryController],
  exports: [DictionaryService]
})
export class DictionaryModule {}
