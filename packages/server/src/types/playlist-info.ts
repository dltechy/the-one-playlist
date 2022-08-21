export interface PlaylistInfo {
  id: string;
  title: string;
  thumbnail: {
    url: string;
    width: number;
    height: number;
  };
  itemCount: number;
}

export const playlistInfoSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
    },
    title: {
      type: 'string',
    },
    thumbnail: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
        },
        width: {
          type: 'number',
        },
        height: {
          type: 'number',
        },
      },
    },
    itemCount: {
      type: 'number',
    },
  },
};
