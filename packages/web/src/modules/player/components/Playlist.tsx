import {
  AppBar,
  Box,
  List,
  ListItem,
  ListItemButton,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { Property } from 'csstype';
import { FC, useContext, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { getDurationString } from '@app/helpers/player/playerTime.helper';

import { PlayerContext, PlayerContextType } from '../contexts/player.context';
import { PlayerActionType } from '../reducers/player.reducer';
import { MediaId } from '../types/mediaId';
import { MediaInfoList } from '../types/mediaInfoList';
import { MediaService } from '../types/mediaService';

export const Playlist: FC = () => {
  // Properties

  const PLAYLIST_HOLDER_ID = 'playlist-holder';
  const INVALID_MEDIA_TEXT = 'Unknown';

  const MEDIA_NUMBER_WIDTH = 24;
  const THUMBNAIL_MAX_WIDTH = 96;
  const THUMBNAIL_MAX_HEIGHT = 54;

  const playlistItemIds = useRef<
    {
      itemId: string;
      titleElementId: string;
      authorsElementId: string;
    }[]
  >([]);

  const [hoverId, setHoverId] = useState('');

  const {
    playerState: { mediaIds, mediaInfoList, mediaIndex },
    playerDispatch,
  } = useContext(PlayerContext) as PlayerContextType;

  // Effects

  // Set playlist item IDs
  useEffect(() => {
    while (mediaIds.length > playlistItemIds.current.length) {
      playlistItemIds.current.push({
        itemId: uuidv4(),
        titleElementId: uuidv4(),
        authorsElementId: uuidv4(),
      });
    }
    if (mediaIds.length < playlistItemIds.current.length) {
      playlistItemIds.current.splice(mediaIds.length);
    }
  }, [mediaIds]);

  // Scroll to new media
  useEffect(() => {
    const listHolder = document.getElementById(
      PLAYLIST_HOLDER_ID,
    ) as HTMLElement;
    const list = listHolder.children[0] as HTMLElement;
    const listItem = list.children[0] as HTMLElement;

    if (listItem) {
      const listItemRect = listItem.getBoundingClientRect();
      const listItemHeight = listItemRect.height;

      const centerY = (mediaIndex - 2) * listItemHeight;

      listHolder.scrollTo(0, centerY);
    }
  }, [mediaIds, mediaIndex]);

  // Element

  const renderThumbnail = (
    mediaId: MediaId,
    mediaInfo: MediaInfoList[MediaService.None][''],
  ): JSX.Element => {
    let url = '';
    let objectFit: Property.ObjectFit = 'contain';
    let width = THUMBNAIL_MAX_WIDTH;
    let height = THUMBNAIL_MAX_HEIGHT;

    let duration = 0;
    const durationRight = 4;
    const durationBottom = 4;

    if (mediaInfo) {
      url = mediaInfo.thumbnail.url;
      duration = mediaInfo.duration;

      switch (mediaId.service) {
        case MediaService.YouTube: {
          objectFit = 'cover';
          break;
        }
        default: {
          const sizeRatio =
            mediaInfo.thumbnail.width / mediaInfo.thumbnail.height;
          const maxSizeRatio = THUMBNAIL_MAX_WIDTH / THUMBNAIL_MAX_HEIGHT;

          if (sizeRatio >= maxSizeRatio) {
            width = THUMBNAIL_MAX_WIDTH;
            height = width / sizeRatio;
          } else {
            height = THUMBNAIL_MAX_HEIGHT;
            width = height * sizeRatio;
          }
          break;
        }
      }
    }

    return (
      <Box
        display="flex"
        minWidth={THUMBNAIL_MAX_WIDTH}
        minHeight={THUMBNAIL_MAX_HEIGHT}
        lineHeight={0}
        alignItems="center"
        justifyContent="center"
      >
        <Box position="relative">
          <Box
            component="img"
            src={url}
            alt="Video thumbnail"
            width={width}
            height={height}
            sx={{ objectFit }}
          />
          <Typography
            variant="caption"
            component="span"
            position="absolute"
            right={durationRight}
            bottom={durationBottom}
            padding={0.25}
            fontWeight="bold"
            lineHeight={1}
            bgcolor="primary.contrastText"
          >
            {getDurationString({ duration })}
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Stack height="100%">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div">
            {`Playing: ${Math.min(mediaIndex + 1, mediaIds.length)} / ${
              mediaIds.length
            }`}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        id={PLAYLIST_HOLDER_ID}
        height="100%"
        border="1px solid"
        borderColor="divider"
        overflow="auto"
      >
        <List disablePadding>
          {mediaIds.map((mediaId, index) => {
            const mediaInfo = mediaInfoList[mediaId.service][mediaId.id];

            return (
              <ListItem
                key={playlistItemIds.current[index]?.itemId ?? uuidv4()}
                disablePadding
                divider
              >
                <ListItemButton
                  selected={index === mediaIndex}
                  onClick={(): void =>
                    playerDispatch({
                      type: PlayerActionType.PlayMediaAt,
                      payload: {
                        mediaIndex: index,
                      },
                    })
                  }
                  disableGutters
                >
                  <Stack paddingX={1}>
                    <Box>
                      <Typography
                        variant="body2"
                        component="p"
                        color="text.secondary"
                      >
                        {mediaId.service}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box>
                        <Typography
                          variant="body2"
                          component="p"
                          width={MEDIA_NUMBER_WIDTH}
                          textAlign="center"
                          color="text.secondary"
                        >
                          {index + 1}
                        </Typography>
                      </Box>

                      {renderThumbnail(mediaId, mediaInfo)}

                      <Stack width="100%" justifyContent="center">
                        <Tooltip
                          title={mediaInfo?.title ?? INVALID_MEDIA_TEXT}
                          open={
                            hoverId ===
                              playlistItemIds.current[index]?.titleElementId ??
                            uuidv4()
                          }
                        >
                          <Typography
                            variant="body1"
                            component="span"
                            display="-webkit-box"
                            height="3rem"
                            marginBottom={1}
                            overflow="hidden"
                            sx={{
                              WebkitBoxOrient: 'vertical',
                              WebkitLineClamp: 2,
                            }}
                            onMouseEnter={(): void =>
                              setHoverId(
                                playlistItemIds.current[index]
                                  ?.titleElementId ?? uuidv4(),
                              )
                            }
                            onMouseLeave={(): void => setHoverId('')}
                          >
                            {mediaInfo?.title ?? INVALID_MEDIA_TEXT}
                          </Typography>
                        </Tooltip>
                        <Tooltip
                          title={mediaInfo?.authors ?? INVALID_MEDIA_TEXT}
                          open={
                            hoverId ===
                              playlistItemIds.current[index]
                                ?.authorsElementId ?? uuidv4()
                          }
                        >
                          <Typography
                            variant="body2"
                            component="p"
                            display="-webkit-box"
                            overflow="hidden"
                            color="text.secondary"
                            sx={{
                              WebkitBoxOrient: 'vertical',
                              WebkitLineClamp: 1,
                            }}
                            onMouseEnter={(): void =>
                              setHoverId(
                                playlistItemIds.current[index]
                                  ?.authorsElementId ?? uuidv4(),
                              )
                            }
                            onMouseLeave={(): void => setHoverId('')}
                          >
                            {mediaInfo?.authors ?? INVALID_MEDIA_TEXT}
                          </Typography>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </Stack>
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Stack>
  );
};
