import { Module } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './../user/user.service';
import { PrismaService } from './../prisma.service';

@Module({
  imports: [],
  controllers: [MovieController],
  providers: [MovieService, JwtService, UserService, PrismaService],
})
export class MovieModule { }
