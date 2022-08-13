import { HttpException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';

import { YouTubeConfig } from '@app/config/youtube.config';
import { axiosSymbol, AxiosType } from '@app/helpers/imports/imports.helper';
import { MediaInfoList } from '@app/types/media-info-list';

@Injectable()
export class YouTubeService {
  constructor(
    private readonly configService: ConfigService,
    @Inject(axiosSymbol) private readonly axios: AxiosType,
  ) {}

  public async getVideos(videoIds: string[]): Promise<MediaInfoList> {
    const url = 'https://youtube.googleapis.com/youtube/v3/videos';

    const { apiKey } = this.configService.get<YouTubeConfig>('youtube');

    const videos: MediaInfoList = {};

    let startVideoId = 0;
    let batchVideoIds: string[] = videoIds.slice(
      startVideoId,
      startVideoId + 50,
    );

    try {
      while (batchVideoIds.length > 0) {
        const query = `part=snippet%2CcontentDetails&id=${batchVideoIds.join(
          ',',
        )}&key=${apiKey}`;

        const {
          data,
        }: { data: GoogleAppsScript.YouTube.Schema.VideoListResponse } =
          // eslint-disable-next-line no-await-in-loop
          await this.axios.get(`${url}?${query}`);

        data.items.forEach(({ id, snippet, contentDetails }) => {
          const durationRegex = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;
          const matches = durationRegex.exec(contentDetails.duration);

          let duration = 0;
          if (matches) {
            if (matches[1]) {
              duration += parseInt(matches[1], 10) * 3600;
            }
            if (matches[2]) {
              duration += parseInt(matches[2], 10) * 60;
            }
            if (matches[3]) {
              duration += parseInt(matches[3], 10);
            }
            duration *= 1000;
          }

          videos[id] = {
            title: snippet.title,
            authors: snippet.channelTitle,
            thumbnail: {
              url: snippet.thumbnails.default.url,
              width: snippet.thumbnails.default.width,
              height: snippet.thumbnails.default.height,
            },
            duration,
          };
        });

        startVideoId += 50;
        batchVideoIds = videoIds.slice(startVideoId, startVideoId + 50);
      }

      return videos;
    } catch (e) {
      if (e instanceof AxiosError && e.response) {
        throw new HttpException(e.response.data, e.response.status);
      }

      throw e;
    }
  }
}
