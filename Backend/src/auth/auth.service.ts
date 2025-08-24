import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  async register(email: string, name: string, password: string) {
    if (!email || !name || !password) {
      throw new BadRequestException('All fields (email, name, password) are required.');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Invalid email format.');
    }
    if (password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters long.');
    }
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('Email already in use. Please login instead.');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, name, password: hashedPassword }).save();

    return { userId: user.id, message: 'Registration successful.' };
  }

  async login(email: string, password: string) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Email not found. Please register first.');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Incorrect password. Please try again.');
    }
    const token = jwt.sign(
      { userId: user.id },
      'a0f1e2d3c4b5a6d7e8f9g0h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0b1c2d3'
    );

    return { token };
  }
}
