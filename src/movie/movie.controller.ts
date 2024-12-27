import { Controller, Post, Body, HttpCode, Get, Put, Delete, UseGuards, Param, Req, Query } from '@nestjs/common';
import { MovieService } from './movie.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { CreateFavoriteMovieDto, UpdateFavoriteMovieDto } from './dto/movie.dto';

@Controller('/')
export class MovieController {
  constructor(private readonly movieService: MovieService) { }

  @Get('movies')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  search(@Query('s') s: string, @Query('page') page: number) {
    return this.movieService.search(s, page = 1);
  }

  @Post('favorites')
  @UseGuards(AuthGuard)
  @HttpCode(201)
  createFavorite(@Body() createFavoriteMovieDto: CreateFavoriteMovieDto, @Req() req: any) {
    return this.movieService.createFavorite(createFavoriteMovieDto, req.body.user);
  }

  @Get('favorites')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  getFavorites(@Req() req: any, @Query('page') page: number) {
    return this.movieService.getFavorites(req.body.user, page = 1);
  }

  @Put('favorites/:id')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  updateFavorite(@Body() updateFavoriteMovieDto: UpdateFavoriteMovieDto, @Param('id') id: bigint, @Req() req: any) {
    return this.movieService.updateFavorite(id, req.body.user, updateFavoriteMovieDto);
  }

  @Delete('favorites/:id')
  @UseGuards(AuthGuard)
  @HttpCode(204)
  deleteFavorite(@Param('id') id: bigint, @Req() req: any) {
    return this.movieService.deleteFavorite(id, req.body.user);
  }
}