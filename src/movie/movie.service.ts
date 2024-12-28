import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { CreateFavoriteMovieDto, UpdateFavoriteMovieDto } from './dto/movie.dto';
import { PrismaService } from './../prisma.service';
import { Movie } from '@prisma/client';
import { JWTPayloadDto } from './../auth/dto/auth.dto';
import axios from 'axios';


@Injectable()
export class MovieService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
  ) { }

  async getMovieByTitle(title: string, favoriteListId: bigint): Promise<any> {
    const movie = await this.prisma.movie.findUnique({
      where: {
        title_favoriteListId: {
          title,
          favoriteListId,
        },
      }
    })
    return movie;
  }

  async search(searchQuery: string, page: number): Promise<any> {
    try {
      let results = { data: null };

      const cacheKey = `searchQuery:${searchQuery}-page:${page}`;

      results.data = JSON.parse(await this.redis.get(cacheKey));

      if (!results.data) {
        results = await axios.get(`http://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}&s=${searchQuery}&page=${page}`);

        if (results.data?.Response === 'False') {
          throw new NotFoundException(results.data.Error);
        }

        const mappedData = results.data.Search.map(item => ({
          title: item.Title,
          image: item.Poster,
          year: item.Year,
          id: item.imdbID,
          type: item.Type
        }));

        results.data.Search = mappedData;

        await this.redis.set(
          cacheKey,
          JSON.stringify(results.data),
          'EX',
          1 * 24 * 60 * 60, // 1 day
        );
      }

      const pageSize = 10; // based on the API response

      const totalPages = Math.ceil(results.data.totalResults / pageSize);
      return {
        data: results.data.Search,
        page,
        size: results.data.Search.length,
        totalPages: totalPages ? totalPages : 1,
        nextPage: page < totalPages ? page + 1 : null,
        previousPage: page > 1 ? page - 1 : null,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        throw new InternalServerErrorException('An error occurred while processing the search.');
      }
    }
  }

  async createFavorite(createFavoriteMovieDto: CreateFavoriteMovieDto, user: JWTPayloadDto): Promise<Movie | { message: string }> {
    const alreadyExists = await this.getMovieByTitle(createFavoriteMovieDto.title, user.favoriteListId);
    if (alreadyExists) {
      return {
        message: 'Movie already exists in favorites',
      }
    }

    try {
      return await this.prisma.movie.create({
        data: {
          ...createFavoriteMovieDto,
          favoriteListId: user.favoriteListId,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('An error occurred while creating the favorite movie.');
    }
  }

  async getFavorites(user: JWTPayloadDto, page: number): Promise<{
    data: Movie[],
    page: number,
    size: number,
    totalPages: number,
    nextPage: number,
    previousPage: number
  }> {
    try {
      const favorites = await this.prisma.movie.findMany({
        where: {
          favoriteListId: user.favoriteListId
        },
        take: 15,
        skip: 15 * (page - 1),
      });

      const totalCount = await this.prisma.movie.count({
        where: {
          favoriteListId: user.favoriteListId
        },
      });

      const totalPages = Math.ceil(totalCount / 15);
      return {
        data: favorites,
        page,
        size: favorites.length,
        totalPages: totalPages ? totalPages : 1,
        nextPage: page < totalPages ? page + 1 : null,
        previousPage: page > 1 ? page - 1 : null,
      }
    } catch (error) {
      throw new InternalServerErrorException('An error occurred while retrieving the favorite movies.');
    }
  }

  async updateFavorite(id: bigint, user: JWTPayloadDto, updateFavoriteMovieDto: UpdateFavoriteMovieDto) {
    try {
      await this.prisma.movie.update({
        where: {
          id_favoriteListId: {
            id,
            favoriteListId: user.favoriteListId,
          },
        },
        data: {
          description: updateFavoriteMovieDto.description,
        },
      });

      return {
        message: 'Movie updated successfully',
      }
    } catch (error) {
      if (error.meta?.cause.includes('not found')) {
        throw new NotFoundException(`Movie with id ${id} not found`);
      } else {
        throw new InternalServerErrorException('An error occurred while updating the favorite movie.');
      }
    }
  }

  async deleteFavorite(id: bigint, user: JWTPayloadDto) {
    try {
      await this.prisma.movie.delete({
        where: {
          id_favoriteListId: {
            id,
            favoriteListId: user.favoriteListId,
          },
        },
      });

      return {
        message: 'Movie deleted successfully',
      }
    } catch (error) {
      if (error.meta?.cause.includes('not exist')) {
        throw new NotFoundException(`Movie with id ${id} not found`);
      } else {
        throw new InternalServerErrorException('An error occurred while deleting the favorite movie.');
      }
    }
  }
}