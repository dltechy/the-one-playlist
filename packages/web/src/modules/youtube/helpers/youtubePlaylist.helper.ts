export const loadYouTubePlaylist = (playlistId: string): Promise<string[]> => {
  const loadYouTubePlaylistPromise = new Promise<string[]>((resolve) => {
    const PLAYER_ID = 'youtube-playlist-loader';

    const div = document.createElement('div');
    div.id = PLAYER_ID;
    div.style.display = 'none';
    document.body.appendChild(div);

    const cleanup = (player: YT.Player): void => {
      player.destroy();

      document.body.removeChild(
        document.getElementById(PLAYER_ID) as HTMLElement,
      );
    };

    const player = new window.YT.Player(PLAYER_ID, {
      playerVars: {
        listType: 'playlist',
        list: playlistId,
        playsinline: 1,
      },
      events: {
        onReady: (): void => {
          resolve(player.getPlaylist());
          cleanup(player);
        },
        onError: (): void => {
          resolve([]);
          cleanup(player);
        },
      },
    });
  });

  return loadYouTubePlaylistPromise;
};
