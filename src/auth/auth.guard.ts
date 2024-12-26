import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import * as dotenv from 'dotenv';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';

dotenv.config();


@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    @InjectRedis() private readonly redis: Redis,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }

    let decoded = null;
    try {
      decoded = await this.jwtService.verifyAsync(
        token,
        {
          secret: process.env.JWT_SECRET,
        }
      );

    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const keys = await this.redis.keys(`refresh:${decoded.id}:${decoded.email}:*`);
    if (keys.length == 0) {
      throw new UnauthorizedException('Invalid or expired token');
    }



    request.body = request.body || {};
    request.body['user'] = decoded;
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers['authorization'];
    if (!authHeader) {
      return undefined;
    }
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}