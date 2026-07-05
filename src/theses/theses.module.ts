import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Thesis } from './thesis.entity.js';
import { ThesesController } from './theses.controller.js';
import { ThesesService } from './theses.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Thesis])],
  controllers: [ThesesController],
  providers: [ThesesService],
})
export class ThesesModule {}
