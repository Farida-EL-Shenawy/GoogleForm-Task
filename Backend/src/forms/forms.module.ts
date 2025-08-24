import { Module } from '@nestjs/common';
import { FormsService } from './forms.service';
import { FormsController, ShareController } from './forms.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Form } from './form.entity';
import { Question } from './question.entity';
import { Response } from './response.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Form, Question, Response])],
  controllers: [FormsController,ShareController],
  providers: [FormsService],
})
export class FormsModule {}
