import { Injectable } from '@nestjs/common';
import { User } from './user.entity';
import { DeepPartial } from 'typeorm';

@Injectable()
export class UsersService {

  async findAllUsers() {
    return User.find();
  }

}
