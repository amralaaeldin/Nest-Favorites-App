import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './../prisma.service';
import { User, Prisma } from '@prisma/client';


@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService
  ) { }

  async create(createUserDto: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data: createUserDto,
    });
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findOneById(id: number): Promise<User | null> {
    const user = this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }
}
