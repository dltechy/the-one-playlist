import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { HttpMethod } from '@app/constants/http-request.constants';
import { createQueryValidationTests } from '@app/helpers/__tests__/validation/query-validation.helper';
import { initializeGlobalPipes } from '@app/helpers/initialization/global-pipes-initialization.helper';

import { YouTubeController } from '../youtube.controller';
import { YouTubeService } from '../youtube.service';
import { youtubeServiceMock } from './mocks/youtube.mocks';

describe('YouTubeController (validation)', () => {
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

    initializeGlobalPipes(app);

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

  describe('getVideos', () => {
    const requiredQuery = {};

    createQueryValidationTests({
      appGetter: () => app,
      requiredQuery,
      httpMethod: HttpMethod.Get,
      path: '/youtube/videos',
      expectedSuccessStatusCode: 200,
      propertyTestValues: [
        {
          property: 'videoIds',
          successValues: ['string', ['string'], ['string1', 'string2']],
          failValues: ['', [''], ['string1', '']],
        },
      ],
    });
  });
});
