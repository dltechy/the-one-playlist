import { Test, TestingModule } from '@nestjs/testing';

import { getConfigImport } from '@app/helpers/__tests__/imports/config-imports.helper';

import { YouTubeController } from '../youtube.controller';
import { YouTubeService } from '../youtube.service';
import { youtubeServiceMock } from './mocks/youtube.mocks';
import { youtubeSamples } from './samples/youtube.samples';

describe('YouTubeController', () => {
  // Properties & methods

  let controller: YouTubeController;

  const [youtubeSample1] = youtubeSamples;

  const initializeModule = async (): Promise<TestingModule> => {
    const module = await Test.createTestingModule({
      imports: [getConfigImport()],
      controllers: [YouTubeController],
      providers: [
        {
          provide: YouTubeService,
          useValue: youtubeServiceMock,
        },
      ],
    }).compile();

    controller = module.get(YouTubeController);

    return module;
  };

  // Before/after methods

  beforeAll(async () => {
    await initializeModule();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // Tests

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPlaylist', () => {
    it('should return playlist', async () => {
      youtubeServiceMock.getPlaylist.mockResolvedValue(youtubeSample1.playlist);

      const playlist = await controller.getPlaylist({
        id: youtubeSample1.playlistId,
      });

      expect(playlist).toEqual(youtubeSample1.playlist);
    });
  });

  describe('getVideos', () => {
    it('should return videos', async () => {
      youtubeServiceMock.getVideos.mockResolvedValue(youtubeSample1.videos);

      const videos = await controller.getVideos({
        videoIds: youtubeSample1.videoIds,
      });

      expect(videos).toEqual(youtubeSample1.videos);
    });
  });
});
