import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { MediaInfoList, mediaInfoListSchema } from '@app/types/media-info-list';

import { GetVideosQueryDto } from './dtos/get-videos-query.dto';
import { YouTubeService } from './youtube.service';

@ApiTags('YouTube')
@Controller('youtube')
export class YouTubeController {
  constructor(private readonly youtubeService: YouTubeService) {}

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
