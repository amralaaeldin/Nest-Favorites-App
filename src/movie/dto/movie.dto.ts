import { IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateFavoriteMovieDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsPositive()
  year: number;
}

export class UpdateFavoriteMovieDto {
  @IsOptional()
  @IsString()
  description?: string;
}