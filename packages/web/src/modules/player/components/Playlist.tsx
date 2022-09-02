import { DragHandle, Edit, Shuffle } from '@mui/icons-material';
import {
  AppBar,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { Property } from 'csstype';
import { useRouter } from 'next/router';
import { FC, useContext, useEffect, useRef, useState } from 'react';
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from 'react-beautiful-dnd';
import { v4 as uuidv4 } from 'uuid';

import { getDurationString } from '@app/helpers/player/playerTime.helper';
import { theme } from '@app/styles/theme';

import { PlayerContext, PlayerContextType } from '../contexts/player.context';
import { PlayerActionType } from '../reducers/player.reducer';
import { compareMediaIds, MediaId } from '../types/mediaId';
import { MediaInfoList } from '../types/mediaInfoList';
import { MediaService } from '../types/mediaService';

export const Playlist: FC = () => {
  // Properties

  const PLAYLIST_HOLDER_ID = 'playlist-holder';
  const INVALID_MEDIA_TEXT = 'Unknown';

  const MEDIA_NUMBER_WIDTH = 24;
  const THUMBNAIL_MAX_WIDTH = 96;
  const THUMBNAIL_MAX_HEIGHT = 54;

  const router = useRouter();

  const md = useMediaQuery(theme.breakpoints.up('md'));

  const playlistItemIds = useRef<
    {
      itemId: string;
      titleElementId: string;
      authorsElementId: string;
    }[]
  >([]);

  const [isEnabled, setIsEnabled] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [itemHoverIndex, setItemHoverIndex] = useState(-1);
  const [textHoverId, setTextHoverId] = useState('');

  const {
    playerState: { mediaIds, mediaInfoList, mediaIndex },
    playerDispatch,
  } = useContext(PlayerContext) as PlayerContextType;

  // Effects

  // Initialization
  useEffect(() => {
    // This is required to make react-beautiful-dnd work with react strict mode
    const animation = requestAnimationFrame(() => setIsEnabled(true));

    return () => {
      cancelAnimationFrame(animation);
      setIsEnabled(false);
    };
  }, []);

  // Set playlist item IDs
  useEffect(() => {
    if (isEnabled) {
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
    }
  }, [isEnabled, mediaIds]);

  // Scroll to new media
  useEffect(() => {
    if (isEnabled) {
      const listHolder = document.getElementById(
        PLAYLIST_HOLDER_ID,
      ) as HTMLElement;
      const list = listHolder.children[0] as HTMLElement;
      const listItem = list.children[0] as HTMLElement;

      if (listItem) {
        const listItemRect = listItem.getBoundingClientRect();
        const listItemHeight = listItemRect.height;

        const centerY = (mediaIndex - (md ? 2 : 0)) * listItemHeight;

        listHolder.scrollTo(0, centerY);
      }
    }
  }, [isEnabled, mediaIndex, md]);

  // Handlers

  const handleShuffleClick = (): void => {
    const { shuffle, ...query } = router.query;
    router.replace({ query });

    playerDispatch({ type: PlayerActionType.ShuffleOn });
  };

  const handlePlaylistDragEnd = (event: DropResult): void => {
    const srcIndex = event.source?.index ?? 0;
    const dstIndex = event.destination?.index ?? srcIndex;

    const newMediaIds = [...mediaIds];

    const draggedElement = newMediaIds.splice(srcIndex, 1)[0];
    newMediaIds.splice(dstIndex, 0, draggedElement);

    const draggedItemIds = playlistItemIds.current.splice(srcIndex, 1)[0];
    playlistItemIds.current.splice(dstIndex, 0, draggedItemIds);

    const newMediaIndex = newMediaIds.findIndex((id) =>
      compareMediaIds(id, mediaIds[mediaIndex]),
    );

    playerDispatch({
      type: PlayerActionType.UpdateMediaIds,
      payload: {
        mediaIds: newMediaIds,
        mediaIndex: newMediaIndex,
      },
    });

    setIsDragging(false);
  };

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
          <Typography variant="h6" component="div" flexGrow={1}>
            {`Playing: ${Math.min(mediaIndex + 1, mediaIds.length)} / ${
              mediaIds.length
            }`}
          </Typography>
          <Stack direction="row" spacing={1}>
            <IconButton
              aria-label="Shuffle playlist"
              onClick={handleShuffleClick}
            >
              <Shuffle />
            </IconButton>
            <IconButton
              aria-label="Edit playlist"
              onClick={(): void =>
                playerDispatch({ type: PlayerActionType.OpenPlaylistManager })
              }
            >
              <Edit />
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>

      <Box
        id={PLAYLIST_HOLDER_ID}
        height="100%"
        border="1px solid"
        borderColor="divider"
        overflow="auto"
      >
        <DragDropContext
          onDragStart={(): void => setIsDragging(true)}
          onDragEnd={handlePlaylistDragEnd}
        >
          {isEnabled ? (
            <Droppable droppableId="playlist-droppable">
              {(droppableProvided): JSX.Element => (
                <List
                  disablePadding
                  ref={droppableProvided.innerRef}
                  {...droppableProvided.droppableProps}
                >
                  {mediaIds.map((mediaId, index) => {
                    const mediaInfo =
                      mediaInfoList[mediaId.service][mediaId.id];

                    return (
                      <ListItem
                        key={playlistItemIds.current[index]?.itemId ?? uuidv4()}
                        disablePadding
                        divider
                      >
                        <Draggable
                          draggableId={
                            playlistItemIds.current[index]?.itemId ?? uuidv4()
                          }
                          index={index}
                          disableInteractiveElementBlocking
                        >
                          {(
                            draggableProvided,
                            draggableSnapshot,
                          ): JSX.Element => (
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
                              disableRipple
                              onMouseEnter={(): void =>
                                setItemHoverIndex(index)
                              }
                              onMouseLeave={(): void => setItemHoverIndex(-1)}
                              ref={draggableProvided.innerRef}
                              {...draggableProvided.draggableProps}
                              {...draggableProvided.dragHandleProps}
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

                                <Stack
                                  direction="row"
                                  spacing={1}
                                  alignItems="center"
                                >
                                  <Box>
                                    {!draggableSnapshot.isDragging &&
                                    (isDragging || itemHoverIndex !== index) ? (
                                      <Typography
                                        variant="body2"
                                        component="p"
                                        width={MEDIA_NUMBER_WIDTH}
                                        textAlign="center"
                                        color="text.secondary"
                                      >
                                        {index + 1}
                                      </Typography>
                                    ) : (
                                      <Box
                                        width={MEDIA_NUMBER_WIDTH}
                                        lineHeight={0}
                                        textAlign="center"
                                        color="text.secondary"
                                      >
                                        <DragHandle />
                                      </Box>
                                    )}
                                  </Box>

                                  {renderThumbnail(mediaId, mediaInfo)}

                                  <Stack width="100%" justifyContent="center">
                                    <Tooltip
                                      title={
                                        mediaInfo?.title ?? INVALID_MEDIA_TEXT
                                      }
                                      open={
                                        textHoverId ===
                                          playlistItemIds.current[index]
                                            ?.titleElementId ?? uuidv4()
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
                                          setTextHoverId(
                                            playlistItemIds.current[index]
                                              ?.titleElementId ?? uuidv4(),
                                          )
                                        }
                                        onMouseLeave={(): void =>
                                          setTextHoverId('')
                                        }
                                      >
                                        {mediaInfo?.title ?? INVALID_MEDIA_TEXT}
                                      </Typography>
                                    </Tooltip>
                                    <Tooltip
                                      title={
                                        mediaInfo?.authors ?? INVALID_MEDIA_TEXT
                                      }
                                      open={
                                        textHoverId ===
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
                                          setTextHoverId(
                                            playlistItemIds.current[index]
                                              ?.authorsElementId ?? uuidv4(),
                                          )
                                        }
                                        onMouseLeave={(): void =>
                                          setTextHoverId('')
                                        }
                                      >
                                        {mediaInfo?.authors ??
                                          INVALID_MEDIA_TEXT}
                                      </Typography>
                                    </Tooltip>
                                  </Stack>
                                </Stack>
                              </Stack>
                            </ListItemButton>
                          )}
                        </Draggable>
                      </ListItem>
                    );
                  })}
                  {droppableProvided.placeholder}
                </List>
              )}
            </Droppable>
          ) : null}
        </DragDropContext>
      </Box>
    </Stack>
  );
};
