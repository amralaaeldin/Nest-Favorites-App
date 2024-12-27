import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './../prisma.service';
import { User, Prisma, FavoriteList } from '@prisma/client';


@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService
  ) { }

  async create(createUserDto: Prisma.UserCreateInput): Promise<User> {
    return await this.prisma.user.create({
      data: createUserDto,
    });
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findOneById(id: bigint): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async findUserFavoriteList(userId: bigint): Promise<FavoriteList> {
    let favoriteList = await this.prisma.favoriteList.findUnique({
      where: {
        userId,
      },
    });

    if (!favoriteList) {
      favoriteList = await this.prisma.favoriteList.create({
        data: {
          user: {
            connect: {
              id: userId,
            },
          },
        },
      });
    }

    return favoriteList;
  }
}
