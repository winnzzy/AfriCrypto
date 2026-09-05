import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

// Shape matches UserProfile from the frontend's types.ts.
export interface UserProfileDto {
  userId: string;
  username: string;
  country: string;
  isVerified: boolean;
  p2pRating: number;
  p2pTrades: number;
  notificationsEnabled: boolean;
  profilePicUrl?: string;
  avatarInitial: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  toProfile(user: User): UserProfileDto {
    return {
      userId: user.id,
      username: user.username,
      country: user.country,
      isVerified: user.isVerified,
      p2pRating: user.p2pRating,
      p2pTrades: user.p2pTrades,
      notificationsEnabled: user.notificationsEnabled,
      profilePicUrl: user.profilePicUrl ?? undefined,
      avatarInitial: user.avatarInitial,
    };
  }

  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getProfile(id: string): Promise<UserProfileDto> {
    return this.toProfile(await this.findById(id));
  }

  async updateProfile(id: string, dto: UpdateUserDto): Promise<UserProfileDto> {
    // Mirrors the frontend mock behaviour: changing the username refreshes
    // the display initial too, rather than leaving it stale.
    const data: Partial<User> = { ...dto };
    if (dto.username) {
      data.avatarInitial = dto.username.charAt(0).toUpperCase();
    }

    const user = await this.prisma.user.update({ where: { id }, data });
    return this.toProfile(user);
  }
}
