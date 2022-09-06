export const spotifyServiceMock = {
  setKeys: jest.fn(),
  login: jest.fn(),
  loginCallback: jest.fn(),
  token: jest.fn(),
  logout: jest.fn(),
  getPlaylist: jest.fn(),
  getAlbum: jest.fn(),
  getPlaylistTracks: jest.fn(),
  getAlbumTracks: jest.fn(),
  getTracks: jest.fn(),
  playTrack: jest.fn(),
};
