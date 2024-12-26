import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './../user/user.service';
import { PrismaService } from './../prisma.service';

@Module({
  imports: [],
  controllers: [AuthController],
  providers: [AuthService, JwtService, UserService, PrismaService],
})
export class AuthModule { }
