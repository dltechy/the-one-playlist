export const getYouTubePlaylistVideoIds = (
  playlistId: string,
): Promise<string[]> => {
  const getYouTubePlaylistVideoIdsPromise = new Promise<string[]>((resolve) => {
    const PLAYER_ID = 'youtube-playlist-loader';

    const div = document.createElement('div');
    div.id = PLAYER_ID;
    div.style.display = 'none';
    document.body.appendChild(div);

    let player: YT.Player | null = null;
    let cleanup: (() => void) | null = null;

    const onReadyListener = (): void => {
      resolve(player?.getPlaylist() ?? []);
      cleanup?.();
    };

    const onErrorListener = (): void => {
      resolve([]);
      cleanup?.();
    };

    cleanup = (): void => {
      player?.removeEventListener('onReady', onReadyListener);
      player?.removeEventListener('onError', onErrorListener);

      player?.destroy();

      document.body.removeChild(
        document.getElementById(PLAYER_ID) as HTMLElement,
      );
    };

    player = new window.YT.Player(PLAYER_ID, {
      playerVars: {
        listType: 'playlist',
        list: playlistId,
        playsinline: 1,
      },
    });

    player.addEventListener('onReady', onReadyListener);
    player.addEventListener('onError', onErrorListener);
  });

  return getYouTubePlaylistVideoIdsPromise;
};
