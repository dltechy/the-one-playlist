import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { MediaInfoList, mediaInfoListSchema } from '@app/types/media-info-list';
import { PlaylistInfo, playlistInfoSchema } from '@app/types/playlist-info';

import { GetPlaylistParamsDto } from './dtos/get-playlist-params.dto';
import { GetVideosQueryDto } from './dtos/get-videos-query.dto';
import { YouTubeService } from './youtube.service';

@ApiTags('YouTube')
@Controller('youtube')
export class YouTubeController {
  constructor(private readonly youtubeService: YouTubeService) {}

  @Get('playlists/:id')
  @ApiOperation({ summary: 'Retrieves playlist data from YouTube' })
  @ApiOkResponse({
    description: 'Playlist data successfully retrieved',
    schema: playlistInfoSchema,
  })
  @ApiBadRequestResponse({ description: 'Invalid input' })
  public async getPlaylist(
    @Param() { id: playlistId }: GetPlaylistParamsDto,
  ): Promise<PlaylistInfo> {
    const playlist = await this.youtubeService.getPlaylist(playlistId);
    return playlist;
  }

  @Get('videos')
  @ApiOperation({ summary: 'Retrieves video data from YouTube' })
  @ApiOkResponse({
    description: 'Video data successfully retrieved',
    schema: mediaInfoListSchema,
  })
  @ApiBadRequestResponse({ description: 'Invalid input' })
  public async getVideos(
    @Query() { videoIds }: GetVideosQueryDto,
  ): Promise<MediaInfoList> {
    const videos = await this.youtubeService.getVideos(videoIds);
    return videos;
  }
}
