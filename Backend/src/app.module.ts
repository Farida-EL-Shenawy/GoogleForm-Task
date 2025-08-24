import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FormsModule } from './forms/forms.module';
import { User } from './users/user.entity';
import { Form } from './forms/form.entity';
import { Question } from './forms/question.entity';
import { Response } from './forms/response.entity';
import * as dotenv from 'dotenv';
import { ShareLink } from './forms/share-link.entity';
dotenv.config();


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      url: process.env.DATABASE_URL,
      synchronize: true,
      logging: true,
      entities: [User, Form, Question, Response, ShareLink],
      autoLoadEntities: true,
    }),
    AuthModule,
    UsersModule,
    FormsModule,
  ],
})
export class AppModule {}
