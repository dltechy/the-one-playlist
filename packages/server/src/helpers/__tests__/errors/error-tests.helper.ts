export function createRethrowUnknownErrorAsyncTest({
  beforeEach,
  afterEach,
  testedPromiseGetter,
  mockedObjectGetter,
  mockedMethod,
}: {
  beforeEach?: () => void | Promise<void>;
  afterEach?: () => void | Promise<void>;
  mockedObjectGetter: () => unknown;
  mockedMethod: string;
  testedPromiseGetter: () => Promise<unknown>;
}): void {
  it('should rethrow unknown error', async () => {
    if (beforeEach) {
      await beforeEach();
    }

    const mockedObject = mockedObjectGetter();

    const sampleError = new Error('sampleError');

    const originalFunction = mockedObject[mockedMethod];
    mockedObject[mockedMethod] = jest.fn().mockRejectedValue(sampleError);

    await expect(testedPromiseGetter()).rejects.toEqual(sampleError);

    mockedObject[mockedMethod] = originalFunction;

    if (afterEach) {
      await afterEach();
    }
  });
}
