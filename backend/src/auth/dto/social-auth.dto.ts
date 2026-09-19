import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SocialAuthDto {
  @IsIn(['google', 'apple', 'facebook'])
  provider: 'google' | 'apple' | 'facebook';

  @IsString()
  @IsNotEmpty()
  credential: string;

  @IsOptional()
  @IsString()
  country?: string;
}
