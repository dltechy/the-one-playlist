import { INestApplication } from '@nestjs/common';
import * as qs from 'qs';
import * as request from 'supertest';

import { HttpMethod } from '@app/constants/http-request.constants';

export function createParamsValidationTests({
  appGetter,
  beforeEach,
  afterEach,
  requiredParams,
  requiredQuery = {},
  requiredBody = {},
  httpMethod,
  path,
  cookies = [],
  expectedSuccessStatusCode,
  expectedFailStatusCode = 400,
  propertyTestValues,
}: {
  appGetter: () => INestApplication;
  beforeEach?: () => void | Promise<void>;
  afterEach?: () => void | Promise<void>;
  requiredParams: { [key: string]: string };
  requiredQuery?: { [key: string]: string | string[] };
  requiredBody?: {};
  httpMethod: HttpMethod;
  path: string;
  cookies?: string[];
  expectedSuccessStatusCode: number;
  expectedFailStatusCode?: number;
  propertyTestValues: {
    property: string;
    successValues: string[];
    failValues: string[];
  }[];
}): void {
  const runTest = async ({
    params,
    exptectedStatusCode,
  }: {
    params: { [key: string]: string };
    exptectedStatusCode: number;
  }): Promise<void> => {
    if (beforeEach) {
      await beforeEach();
    }

    let pathWithParams = path;
    Object.keys(params).forEach((param) => {
      pathWithParams = pathWithParams.replace(
        new RegExp(`:${param}(\\/|$)`),
        `${params[param]}$1`,
      );
    });

    const { statusCode } = await request(appGetter().getHttpServer())
      [httpMethod](pathWithParams)
      .set('Cookie', cookies)
      .query(qs.stringify(requiredQuery))
      .send(requiredBody);

    expect(statusCode).toEqual(exptectedStatusCode);

    if (afterEach) {
      await afterEach();
    }
  };

  describe('req.params', () => {
    propertyTestValues.forEach(({ property, successValues, failValues }) => {
      describe(property, () => {
        successValues.forEach((value) => {
          it(`should accept "${value}"`, async () => {
            await runTest({
              params: {
                ...requiredParams,
                [property]: value,
              },
              exptectedStatusCode: expectedSuccessStatusCode,
            });
          });
        });

        failValues.forEach((value) => {
          it(`should reject "${value}"`, async () => {
            await runTest({
              params: {
                ...requiredParams,
                [property]: value,
              },
              exptectedStatusCode: expectedFailStatusCode,
            });
          });
        });
      });
    });
  });
}
