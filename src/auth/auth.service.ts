import { ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { SignupDto, LoginDto, RefreshTokenDto, LoginResponseDto } from './dto/auth.dto';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @InjectRedis() private readonly redis: Redis,
  ) { }

  async validateRefreshToken(refreshToken: string) {
    let decoded = null;
    let storedToken = null;
    try {
      decoded = await this.jwtService.verifyAsync(refreshToken, { secret: process.env.JWT_SECRET });

      const redisKey = `refresh:${decoded.id}:${decoded.email}:${decoded.issuedAt}`;
      storedToken = await this.redis.get(redisKey);

    } catch (error) {
      throw new InternalServerErrorException();
    }

    if (!storedToken || storedToken !== refreshToken) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return decoded;
  }

  async signup(SignupDto: SignupDto) {
    const existingUser = await this.userService.findOneByEmail(SignupDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(SignupDto.password, parseInt(process.env.SALT_ROUNDS));

    try {
      await this.userService.create({
        ...SignupDto,
        password: hashedPassword,
      });
    } catch (error) {
      throw new InternalServerErrorException('Error creating user');
    }

    return {
      message: 'User created successfully',
    }
  }

  async login(LoginDto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.userService.findOneByEmail(LoginDto.email);

    if (!user) {
      throw new NotFoundException(`User with email ${LoginDto.email} not found`);
    }

    const isCorrectPassword = await bcrypt.compare(LoginDto.password, user.password);
    if (!isCorrectPassword) {
      throw new UnauthorizedException();
    }

    const userFavoriteList = await this.userService.findUserFavoriteList(user.id);

    const payload = { id: user.id, email: user.email, favoriteListId: userFavoriteList.id };

    const issuedAt = new Date().getTime();
    const accessToken = await this.jwtService.signAsync(payload, { expiresIn: '1m', secret: process.env.JWT_SECRET })
    const refreshToken = await this.jwtService.signAsync({
      ...payload,
      issuedAt
    }, { expiresIn: '7d', secret: process.env.JWT_SECRET })

    await this.redis.set(
      `refresh:${user.id}:${user.email}:${issuedAt}`,
      refreshToken,
      'EX',
      7 * 24 * 60 * 60, // 7 days
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(RefreshTokenDto: RefreshTokenDto) {
    const decoded = await this.validateRefreshToken(RefreshTokenDto.refresh_token);

    const newAccessToken = await this.jwtService.signAsync(
      { id: decoded.id, email: decoded.email, favoriteListId: decoded.favoriteListId },
      { expiresIn: '15m', secret: process.env.JWT_SECRET },
    );

    return { accessToken: newAccessToken };
  }

  async revokeRefreshToken(RefreshTokenDto: RefreshTokenDto) {
    const decoded = await this.validateRefreshToken(RefreshTokenDto.refresh_token);
    const redisKey = `refresh:${decoded.id}:${decoded.email}:${decoded.issuedAt}`;
    await this.redis.del(redisKey);

    return { message: 'Refresh token revoked' };
  }

  async revokeAllRefreshTokensForUser(RefreshTokenDto: RefreshTokenDto) {
    const decoded = await this.validateRefreshToken(RefreshTokenDto.refresh_token);
    const keys = await this.redis.keys(`refresh:${decoded.id}:${decoded.email}:*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }

    return { message: 'Refresh tokens revoked' };
  }
}
