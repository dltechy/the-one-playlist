import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { YouTubeController } from '../youtube.controller';
import { YouTubeService } from '../youtube.service';
import { youtubeServiceMock } from './mocks/youtube.mocks';

describe('YouTubeController (routes)', () => {
  // Properties & methods

  let app: INestApplication;

  const initializeModule = async (): Promise<TestingModule> => {
    const module = await Test.createTestingModule({
      controllers: [YouTubeController],
      providers: [
        {
          provide: YouTubeService,
          useValue: youtubeServiceMock,
        },
      ],
    }).compile();

    return module;
  };

  const initializeApp = async (module: TestingModule): Promise<void> => {
    app = module.createNestApplication(undefined, {
      logger: false,
    });

    await app.init();
  };

  // Before/after methods

  beforeAll(async () => {
    const module = await initializeModule();
    await initializeApp(module);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // Tests

  it('should connect to "GET /youtube/videos"', async () => {
    await request(app.getHttpServer()).get('/youtube/videos');

    expect(youtubeServiceMock.getVideos).toHaveBeenCalled();
  });
});
