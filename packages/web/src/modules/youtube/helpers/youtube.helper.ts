import { sleep } from '@app/helpers/timeout/sleep.helper';

let player: YT.Player;

export const loadPlayer = async (elementName: string): Promise<YT.Player> => {
  while (!window.YT?.Player) {
    // eslint-disable-next-line no-await-in-loop
    await sleep(1000);
  }

  if (player) {
    player.destroy();
  }

  const host = process.env.NEXT_PUBLIC_APP_HOST;

  player = await new Promise<YT.Player>((resolve) => {
    const _player = new window.YT.Player(elementName, {
      width: '100%',
      height: '100%',
      playerVars: {
        autoplay: 1,
        playsinline: 1,
        enablejsapi: 1,
        origin: host,
      },
      events: {
        onReady: (): void => {
          resolve(_player);
        },
      },
    });
  });

  return player;
};
