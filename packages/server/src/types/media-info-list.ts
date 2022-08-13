export interface MediaInfoList {
  [id: string]: {
    title: string;
    authors: string;
    thumbnail: {
      url: string;
      width: number;
      height: number;
    };
    duration: number;
  };
}

export const mediaInfoListSchema = {
  type: 'object',
  additionalProperties: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
      },
      authors: {
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
      duration: {
        type: 'number',
      },
    },
  },
};
