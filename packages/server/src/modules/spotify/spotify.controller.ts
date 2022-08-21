import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBadRequestResponse,
  ApiFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request, Response } from 'express';

import { AppConfig } from '@app/config/app.config';
import { MediaInfoList, mediaInfoListSchema } from '@app/types/media-info-list';
import { PlaylistInfo, playlistInfoSchema } from '@app/types/playlist-info';

import { GetPlaylistParamsDto } from './dtos/get-playlist-params.dto';
import { GetPlaylistTracksParamsDto } from './dtos/get-playlist-tracks-params.dto';
import { LoginCallbackQueryDto } from './dtos/login-callback-query.dto';
import { PlayTrackDto } from './dtos/play-track.dto';
import { PlayTrackParamsDto } from './dtos/play-track-params.dto';
import { SpotifyService } from './spotify.service';

@ApiTags('Spotify')
@Controller('spotify')
export class SpotifyController {
  constructor(
    private readonly configService: ConfigService,
    private readonly spotifyService: SpotifyService,
  ) {}

  @Get('auth/login')
  @ApiOperation({ summary: 'Redirects the user to the Spotify login page' })
  @ApiFoundResponse({
    description: 'User successfully redirected to the Spotify login page',
  })
  public login(@Res() res: Response): void {
    const authQueryParameters = this.spotifyService.login();

    res.redirect(
      `https://accounts.spotify.com/authorize?${authQueryParameters}`,
    );
  }

  @Get('auth/login-callback')
  @ApiOperation({ summary: 'Callback API for Spotify login' })
  @ApiFoundResponse({
    description: 'User successfully logged in to Spotify',
  })
  @ApiBadRequestResponse({ description: 'Invalid input' })
  public async loginCallback(
    @Query() { code }: LoginCallbackQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const { webBaseUrl } = this.configService.get<AppConfig>('app');

    await this.spotifyService.loginCallback({
      code,
      res,
    });

    res.redirect(`${webBaseUrl}/close`);
  }

  @Post('auth/token')
  @HttpCode(200)
  @ApiOperation({ summary: 'Refreshes the Spotify login tokens' })
  @ApiOkResponse({
    description: 'Spotify login tokens successfully refreshed',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid/missing refresh token' })
  public async token(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.spotifyService.token({ req, res });
  }

  @Post('auth/logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Logs the user out of Spotify' })
  @ApiOkResponse({
    description: 'User successfully logged out',
  })
  public async logout(
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.spotifyService.logout({ res });
  }

  @Get('playlists/:id')
  @ApiOperation({ summary: 'Retrieves playlist data from Spotify' })
  @ApiOkResponse({
    description: 'Playlist data successfully retrieved',
    schema: playlistInfoSchema,
  })
  @ApiBadRequestResponse({ description: 'Invalid input' })
  public async getPlaylist(
    @Param() { id: playlistId }: GetPlaylistParamsDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PlaylistInfo> {
    const playlist = await this.spotifyService.getPlaylist({
      playlistId,
      req,
      res,
    });

    return playlist;
  }

  @Get('playlists/:id/tracks')
  @ApiOperation({ summary: 'Retrieves playlist track data from Spotify' })
  @ApiOkResponse({
    description: 'Track data successfully retrieved',
    schema: mediaInfoListSchema,
  })
  @ApiBadRequestResponse({ description: 'Invalid input' })
  public async getPlaylistTracks(
    @Param() { id: playlistId }: GetPlaylistTracksParamsDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{
    trackIds: string[];
    tracks: MediaInfoList;
  }> {
    const { trackIds, tracks } = await this.spotifyService.getPlaylistTracks({
      playlistId,
      req,
      res,
    });

    return {
      trackIds,
      tracks,
    };
  }

  @Post('tracks/:id/play')
  @HttpCode(200)
  @ApiOperation({ summary: 'Plays a track' })
  @ApiOkResponse({ description: 'Track successfully played' })
  @ApiBadRequestResponse({ description: 'Invalid input' })
  public async playTrack(
    @Param() { id: trackId }: PlayTrackParamsDto,
    @Body() { deviceId }: PlayTrackDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.spotifyService.playTrack({
      deviceId,
      trackId,
      req,
      res,
    });
  }
}
