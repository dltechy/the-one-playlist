import { HttpException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { createRethrowUnknownErrorAsyncTest } from '@app/helpers/__tests__/errors/error-tests.helper';
import { getConfigImport } from '@app/helpers/__tests__/imports/config-imports.helper';
import { axiosMock } from '@app/helpers/__tests__/mocks/axios.mocks';
import { axiosSamples } from '@app/helpers/__tests__/samples/axios.samples';
import { axiosSymbol } from '@app/helpers/imports/imports.helper';

import { YouTubeService } from '../youtube.service';
import { youtubeSamples } from './samples/youtube.samples';

describe('YouTubeService', () => {
  // Properties & methods

  let service: YouTubeService;

  const [youtubeSample1, youtubeSample2, youtubeSample3] = youtubeSamples;

  const initializeModule = async (): Promise<TestingModule> => {
    const module = await Test.createTestingModule({
      imports: [getConfigImport()],
      providers: [
        YouTubeService,
        {
          provide: axiosSymbol,
          useValue: axiosMock,
        },
      ],
    }).compile();

    service = module.get(YouTubeService);

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
    expect(service).toBeDefined();
  });

  describe('getPlaylist', () => {
    it('should return playlist', async () => {
      axiosMock.get.mockResolvedValue(youtubeSample1.playlistResponse);

      const playlist = await service.getPlaylist(youtubeSample1.playlistId);

      expect(playlist).toEqual(
        expect.objectContaining(youtubeSample1.playlist),
      );
    });

    it('should throw error if playlist is not found', async () => {
      axiosMock.get.mockResolvedValue({
        data: {
          items: [],
        },
      });

      await expect(
        service.getPlaylist(youtubeSample1.playlistId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should return axios error', async () => {
      axiosMock.get.mockRejectedValue(axiosSamples.error);

      await expect(
        service.getPlaylist(youtubeSample1.playlistId),
      ).rejects.toBeInstanceOf(HttpException);
    });

    createRethrowUnknownErrorAsyncTest({
      mockedObjectGetter: () => axiosMock,
      mockedMethod: 'get',
      testedPromiseGetter: () => service.getPlaylist(youtubeSample1.playlistId),
    });
  });

  describe('getVideos', () => {
    it('should return videos', async () => {
      axiosMock.get.mockResolvedValue(youtubeSample1.videosResponse);

      const videos = await service.getVideos(youtubeSample1.videoIds);

      expect(videos).toEqual(expect.objectContaining(youtubeSample1.videos));
    });

    it('should parse duration', async () => {
      axiosMock.get.mockResolvedValue(youtubeSample2.videosResponse);

      const videos = await service.getVideos(youtubeSample2.videoIds);

      const videoId = youtubeSample2.videoIds[0];
      expect(videos[videoId].duration).toEqual(
        youtubeSample2.videos[videoId].duration,
      );
    });

    it('should parse 0 duration', async () => {
      axiosMock.get.mockResolvedValue(youtubeSample3.videosResponse);

      const videos = await service.getVideos(youtubeSample3.videoIds);

      const videoId = youtubeSample3.videoIds[0];
      expect(videos[videoId].duration).toEqual(
        youtubeSample3.videos[videoId].duration,
      );
    });

    it('should return axios error', async () => {
      axiosMock.get.mockRejectedValue(axiosSamples.error);

      await expect(
        service.getVideos(youtubeSample1.videoIds),
      ).rejects.toBeInstanceOf(HttpException);
    });

    createRethrowUnknownErrorAsyncTest({
      mockedObjectGetter: () => axiosMock,
      mockedMethod: 'get',
      testedPromiseGetter: () => service.getVideos(youtubeSample1.videoIds),
    });
  });
});
