import {
  Add,
  Delete,
  DragHandle,
  Info,
  InfoOutlined,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Modal,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import cookie from 'cookie';
import { Property } from 'csstype';
import { useRouter } from 'next/router';
import {
  FC,
  FormEvent,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from 'react-beautiful-dnd';
import { v4 as uuidv4 } from 'uuid';

import {
  getSpotifyPlaylistDetails,
  getSpotifyPlaylistTrackDetails,
  spotifyLogin,
  spotifyLogout,
} from '@app/modules/spotify/apis/spotify.api';
import {
  connect as spotifyConnect,
  disconnect as spotifyDisconnect,
} from '@app/modules/spotify/helpers/spotify.helper';
import {
  getYouTubePlaylistDetails,
  getYouTubeVideoDetails,
} from '@app/modules/youtube/apis/youtube.api';
import { loadYouTubePlaylist } from '@app/modules/youtube/helpers/youtubePlaylist.helper';

import { PlayerContext, PlayerContextType } from '../contexts/player.context';
import { PlayerActionType } from '../reducers/player.reducer';
import {
  createEmptyMediaInfoList,
  MediaInfoList,
} from '../types/mediaInfoList';
import { MediaService } from '../types/mediaService';
import { PlaylistInfo } from '../types/playlistInfo';

export const PlaylistManager: FC = () => {
  // Properties

  const MEDIA_NUMBER_WIDTH = 24;
  const THUMBNAIL_MAX_WIDTH = 96;
  const THUMBNAIL_MAX_HEIGHT = 54;

  const router = useRouter();
  const prevIsRouterReady = useRef(false);

  const inputRef = useRef<HTMLElement>(null);

  const [playlistLink, setPlaylistLink] = useState('');
  const [playlistLinkError, setPlaylistLinkError] = useState('');

  const [isLoadingMedia, setIsLoadingMedia] = useState(true);

  const [spotifyRefreshToken, setSpotifyRefreshToken] = useState<string>('');

  const {
    playerState: { playlistInfoList, mediaInfoList, isPlaylistManagerOpen },
    playerDispatch,
  } = useContext(PlayerContext) as PlayerContextType;

  const playlistManagerItemIds = useRef<
    {
      itemId: string;
      titleElementId: string;
      itemsElementId: string;
    }[]
  >([]);

  const [animationId, setAnimationId] = useState(-1);
  const [isEnabled, setIsEnabled] = useState(false);

  const [isShowingInfo, setIsShowingInfo] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [itemHoverIndex, setItemHoverIndex] = useState(-1);
  const [textHoverId, setTextHoverId] = useState('');

  const [tempPlaylistInfoList, setTempPlaylistInfoList] =
    useState(playlistInfoList);
  const prevIsPlaylistManagerOpen = useRef(!isPlaylistManagerOpen);

  const [tick, setTick] = useState(false);
  const prevTick = useRef(!tick);

  // General methods

  const getQueryPlaylistIds = useCallback((): string[] => {
    const { query } = router;
    let playlistIds: string[];
    if (query.playlistIds != null) {
      playlistIds = Array.isArray(query.playlistIds)
        ? query.playlistIds
        : [query.playlistIds];
    } else {
      playlistIds = [];
    }

    return playlistIds;
  }, [router]);

  const loadYouTube = useCallback(
    async (
      playlistInfo: PlaylistInfo,
    ): Promise<MediaInfoList[MediaService.YouTube]> => {
      const videoIds = await loadYouTubePlaylist(playlistInfo.id);
      const videos = await getYouTubeVideoDetails(videoIds);

      videoIds.forEach((id) => {
        playlistInfo.mediaIds.push(id);
      });

      return videos;
    },
    [],
  );

  const loadSpotify = useCallback(
    async (
      playlistInfo: PlaylistInfo,
    ): Promise<MediaInfoList[MediaService.Spotify]> => {
      const { trackIds, tracks } = await getSpotifyPlaylistTrackDetails(
        playlistInfo.id,
      );

      trackIds.forEach((id) => {
        playlistInfo.mediaIds.push(id);
      });

      return tracks;
    },
    [],
  );

  // Effects

  // This is required to make react-beautiful-dnd work with react strict mode
  useEffect(() => {
    if (isPlaylistManagerOpen !== prevIsPlaylistManagerOpen.current) {
      if (isPlaylistManagerOpen) {
        setAnimationId(requestAnimationFrame(() => setIsEnabled(true)));
      } else if (animationId !== 0) {
        cancelAnimationFrame(animationId);
        setIsEnabled(false);
      }

      prevIsPlaylistManagerOpen.current = isPlaylistManagerOpen;
    }
  }, [isPlaylistManagerOpen, playlistInfoList, animationId]);

  // Focus on input when modal is opened
  useEffect(() => {
    if (isEnabled) {
      inputRef.current?.focus();
    }
  }, [isEnabled]);

  // Update login state
  useEffect(() => {
    if (tick !== prevTick.current) {
      const cookies = cookie.parse(document.cookie);
      setSpotifyRefreshToken(cookies.spotifyRefreshToken);

      if (cookies.spotifyRefreshToken != null) {
        spotifyConnect().catch();
      } else {
        spotifyDisconnect();
      }

      prevTick.current = tick;
      setTimeout(() => setTick((prev) => !prev), 1000);
    }
  }, [tick]);

  // Set playlist item IDs
  useEffect(() => {
    while (
      tempPlaylistInfoList.length > playlistManagerItemIds.current.length
    ) {
      playlistManagerItemIds.current.push({
        itemId: uuidv4(),
        titleElementId: uuidv4(),
        itemsElementId: uuidv4(),
      });
    }
    if (tempPlaylistInfoList.length < playlistManagerItemIds.current.length) {
      playlistManagerItemIds.current.splice(tempPlaylistInfoList.length);
    }
  }, [tempPlaylistInfoList]);

  // Load playlists from query
  useEffect(() => {
    if (!prevIsRouterReady.current && router.isReady) {
      const loadPlaylists = async (): Promise<void> => {
        const playlistIds = getQueryPlaylistIds();
        if (playlistIds != null && playlistIds.length > 0) {
          setIsLoadingMedia(true);

          const newTempPlaylistInfoList = [...tempPlaylistInfoList];
          const newMediaInfoList: MediaInfoList = {
            ...createEmptyMediaInfoList(),
          };

          const loadedPlaylistIds: string[] = [];

          for (let i = 0; i < playlistIds.length; i += 1) {
            try {
              const playlistId = playlistIds[i];
              const [service, id] = playlistId.split(' ');

              if (service != null && id != null) {
                /* eslint-disable no-await-in-loop */
                switch (service) {
                  case MediaService.YouTube: {
                    const playlistInfo = await getYouTubePlaylistDetails(id);
                    const videos = await loadYouTube(playlistInfo);

                    newTempPlaylistInfoList.push(playlistInfo);
                    Object.keys(videos).forEach((mediaId) => {
                      newMediaInfoList[playlistInfo.service][mediaId] =
                        videos[mediaId];
                    });
                    break;
                  }
                  case MediaService.Spotify: {
                    const playlistInfo = await getSpotifyPlaylistDetails(id);
                    const tracks = await loadSpotify(playlistInfo);

                    newTempPlaylistInfoList.push(playlistInfo);
                    Object.keys(tracks).forEach((mediaId) => {
                      newMediaInfoList[playlistInfo.service][mediaId] =
                        tracks[mediaId];
                    });
                    break;
                  }
                  default: {
                    break;
                  }
                }
                /* eslint-enable no-await-in-loop */
              }

              loadedPlaylistIds.push(playlistId);
            } catch {
              // Do nothing
            }
          }

          setTempPlaylistInfoList(newTempPlaylistInfoList);

          playerDispatch({
            type: PlayerActionType.UpdatePlaylistInfoList,
            payload: {
              playlistInfoList: newTempPlaylistInfoList,
              mediaInfoList: newMediaInfoList,
            },
          });

          playerDispatch({ type: PlayerActionType.ClosePlaylistManager });
        }
      };
      loadPlaylists()
        .catch()
        .finally(() => {
          setIsLoadingMedia(false);
        });

      prevIsRouterReady.current = router.isReady;
    }
  }, [
    router,
    tempPlaylistInfoList,
    playerDispatch,
    getQueryPlaylistIds,
    loadYouTube,
    loadSpotify,
  ]);

  // Handlers

  const handlePlaylistDragEnd = (event: DropResult): void => {
    const srcIndex = event.source?.index ?? 0;
    const dstIndex = event.destination?.index ?? srcIndex;

    const newTempPlaylistInfoList = [...tempPlaylistInfoList];

    const draggedElement = newTempPlaylistInfoList.splice(srcIndex, 1)[0];
    newTempPlaylistInfoList.splice(dstIndex, 0, draggedElement);

    const draggedItemIds = playlistManagerItemIds.current.splice(
      srcIndex,
      1,
    )[0];
    playlistManagerItemIds.current.splice(dstIndex, 0, draggedItemIds);

    setTempPlaylistInfoList(newTempPlaylistInfoList);

    setIsDragging(false);
  };

  const handleLoadPlaylistClick = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    const loadPlaylist = async (): Promise<void> => {
      if (!isLoadingMedia) {
        setIsLoadingMedia(true);

        let playlistError = 'Invalid playlist link';

        const youtubeLinkRegex =
          /^https?:\/\/www\.youtube\.com\/playlist\?.*list=([^&]+).*$/;
        const spotifyLinkRegex =
          /^https?:\/\/(?:[^/]*\.)*spotify\.com\/playlist\/([^/?]+).*$/;

        let match = youtubeLinkRegex.exec(playlistLink);
        if (match && match[1]) {
          const playlistId = match[1];
          if (
            tempPlaylistInfoList.findIndex(
              (playlistInfo) =>
                playlistInfo.service === MediaService.YouTube &&
                playlistInfo.id === playlistId,
            ) === -1
          ) {
            const playlistInfo = await getYouTubePlaylistDetails(playlistId);

            setTempPlaylistInfoList((prev) => {
              const newTempPlaylistInfoList = [...prev];
              newTempPlaylistInfoList.push(playlistInfo);

              return newTempPlaylistInfoList;
            });

            playlistError = '';
          } else {
            playlistError = 'Playlist already exists';
          }
        }

        if (!match) {
          match = spotifyLinkRegex.exec(playlistLink);
          if (match && match[1]) {
            const playlistId = match[1];
            if (
              tempPlaylistInfoList.findIndex(
                (playlistInfo) =>
                  playlistInfo.service === MediaService.Spotify &&
                  playlistInfo.id === playlistId,
              ) === -1
            ) {
              const playlistInfo = await getSpotifyPlaylistDetails(playlistId);

              setTempPlaylistInfoList((prev) => {
                const newTempPlaylistInfoList = [...prev];
                newTempPlaylistInfoList.push(playlistInfo);

                return newTempPlaylistInfoList;
              });

              playlistError = '';
            } else {
              playlistError = 'Playlist already exists';
            }
          }
        }

        if (playlistError === '') {
          setPlaylistLink('');
        }
        setPlaylistLinkError(playlistError);
      }
    };
    loadPlaylist()
      .catch()
      .finally(() => {
        setIsLoadingMedia(false);
      });
  };

  const handleSave = async (): Promise<void> => {
    try {
      setIsLoadingMedia(true);

      const prevPlaylistInfo = playlistInfoList.reduce(
        (prev, current) => {
          prev[`${current.service} ${current.id}`] = current;
          return prev;
        },
        {} as {
          [key: string]: PlaylistInfo;
        },
      );

      const newPlaylistInfoList = [...tempPlaylistInfoList];
      const newMediaInfoList: MediaInfoList = { ...createEmptyMediaInfoList() };

      const playlistIds = newPlaylistInfoList.map(
        (playlistInfo) => `${playlistInfo.service} ${playlistInfo.id}`,
      );

      /* eslint-disable no-await-in-loop */
      for (let i = 0; i < newPlaylistInfoList.length; i += 1) {
        const playlistInfo = newPlaylistInfoList[i];
        const playlistId = `${playlistInfo.service} ${playlistInfo.id}`;

        if (prevPlaylistInfo[playlistId]) {
          playlistInfo.mediaIds = prevPlaylistInfo[playlistId].mediaIds;

          playlistInfo.mediaIds.forEach((mediaId) => {
            newMediaInfoList[playlistInfo.service][mediaId] =
              mediaInfoList[playlistInfo.service][mediaId];
          });
        } else {
          switch (playlistInfo.service) {
            case MediaService.YouTube: {
              const videos = await loadYouTube(playlistInfo);

              Object.keys(videos).forEach((mediaId) => {
                newMediaInfoList[playlistInfo.service][mediaId] =
                  videos[mediaId];
              });
              break;
            }
            case MediaService.Spotify: {
              const tracks = await loadSpotify(playlistInfo);

              Object.keys(tracks).forEach((mediaId) => {
                newMediaInfoList[playlistInfo.service][mediaId] =
                  tracks[mediaId];
              });
              break;
            }
            default: {
              break;
            }
          }
        }
      }
      /* eslint-enable no-await-in-loop */

      router.replace({
        query: {
          ...router.query,
          playlistIds,
        },
      });

      setPlaylistLink('');
      setPlaylistLinkError('');
      setTempPlaylistInfoList(newPlaylistInfoList);

      playerDispatch({
        type: PlayerActionType.UpdatePlaylistInfoList,
        payload: {
          playlistInfoList: newPlaylistInfoList,
          mediaInfoList: newMediaInfoList,
        },
      });

      playerDispatch({ type: PlayerActionType.Play });

      playerDispatch({ type: PlayerActionType.ClosePlaylistManager });
    } finally {
      setIsLoadingMedia(false);
    }
  };

  const handleClose = (): void => {
    if (!isLoadingMedia) {
      setPlaylistLink('');
      setPlaylistLinkError('');
      setTempPlaylistInfoList(playlistInfoList);

      playerDispatch({
        type: PlayerActionType.ClosePlaylistManager,
      });
    }
  };

  // Element

  const renderThumbnail = (playlistInfo: PlaylistInfo): JSX.Element => {
    const { url } = playlistInfo.thumbnail;
    let objectFit: Property.ObjectFit = 'contain';
    let width = THUMBNAIL_MAX_WIDTH;
    let height = THUMBNAIL_MAX_HEIGHT;

    switch (playlistInfo.service) {
      case MediaService.YouTube: {
        objectFit = 'cover';
        break;
      }
      default: {
        const sizeRatio =
          playlistInfo.thumbnail.width / playlistInfo.thumbnail.height;
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

    return (
      <Box width={THUMBNAIL_MAX_WIDTH} height={THUMBNAIL_MAX_HEIGHT}>
        <Box
          component="img"
          src={url}
          alt="Video thumbnail"
          width={THUMBNAIL_MAX_WIDTH}
          height={THUMBNAIL_MAX_HEIGHT}
          sx={{ objectFit }}
        />
      </Box>
    );
  };

  return (
    <Modal open={isPlaylistManagerOpen} onClose={(): void => handleClose()}>
      <Box
        display="flex"
        width="100%"
        height="100%"
        sx={{ pointerEvents: 'none' }}
      >
        <Box margin="auto" sx={{ pointerEvents: 'auto' }}>
          <Stack spacing={2} width={800} padding={4} bgcolor="background.paper">
            <Stack direction="row" spacing={1}>
              <Box
                component="form"
                flexGrow={1}
                onSubmit={handleLoadPlaylistClick}
              >
                <TextField
                  label="Playlist link"
                  variant="outlined"
                  fullWidth
                  value={playlistLink}
                  error={playlistLinkError !== ''}
                  helperText={playlistLinkError}
                  disabled={isLoadingMedia}
                  inputRef={inputRef}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          type="submit"
                          aria-label="Load playlist"
                          disabled={isLoadingMedia}
                        >
                          <Add />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  onChange={(event): void =>
                    setPlaylistLink(event.target.value.trim())
                  }
                />
              </Box>

              <Box height="fit-content" paddingTop={0.25}>
                <IconButton
                  onClick={(): void => setIsShowingInfo((prev) => !prev)}
                >
                  {isShowingInfo ? (
                    <Info fontSize="large" />
                  ) : (
                    <InfoOutlined fontSize="large" />
                  )}
                </IconButton>
              </Box>
            </Stack>

            <Box display="flex" width="100%" justifyContent="center">
              {spotifyRefreshToken == null ? (
                <Button
                  variant="contained"
                  onClick={(): Promise<void> => spotifyLogin().catch()}
                >
                  Login with Spotify
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  onClick={(): Promise<void> => spotifyLogout().catch()}
                >
                  Logout from Spotify
                </Button>
              )}
            </Box>

            {isShowingInfo ? (
              <Box>
                <List
                  sx={{
                    paddingTop: 0,
                    paddingBottom: 0,
                  }}
                >
                  <ListSubheader>
                    <ListItemText>Supported services:</ListItemText>
                  </ListSubheader>
                  <ListItem
                    sx={{
                      paddingTop: 0,
                      paddingBottom: 0,
                    }}
                  >
                    <List
                      sx={{
                        paddingTop: 0,
                        paddingBottom: 0,
                      }}
                    >
                      <ListItem
                        sx={{
                          display: 'list-item',
                          listStyle: 'disc',
                          paddingTop: 0,
                          paddingBottom: 0,
                          marginLeft: 4,
                        }}
                      >
                        <ListItemText>YouTube</ListItemText>
                      </ListItem>
                      <ListItem
                        sx={{
                          display: 'list-item',
                          listStyle: 'disc',
                          paddingTop: 0,
                          paddingBottom: 0,
                          marginLeft: 4,
                        }}
                      >
                        <ListItemText>Spotify (login required)</ListItemText>
                      </ListItem>
                    </List>
                  </ListItem>
                </List>
              </Box>
            ) : null}

            <Box maxHeight={576} overflow="auto">
              <DragDropContext
                onDragStart={(): void => setIsDragging(true)}
                onDragEnd={handlePlaylistDragEnd}
              >
                {isEnabled ? (
                  <Droppable droppableId="playlist-manager-droppable">
                    {(droppableProvided): JSX.Element => (
                      <List
                        ref={droppableProvided.innerRef}
                        {...droppableProvided.droppableProps}
                      >
                        {tempPlaylistInfoList.map((playlistInfo, index) => (
                          <ListItem
                            key={
                              playlistManagerItemIds.current[index]?.itemId ??
                              uuidv4()
                            }
                            disablePadding
                            divider={
                              (isDragging && index > 0) ||
                              (!isDragging &&
                                index < tempPlaylistInfoList.length - 1)
                            }
                          >
                            <Draggable
                              draggableId={
                                playlistManagerItemIds.current[index]?.itemId ??
                                uuidv4()
                              }
                              index={index}
                              disableInteractiveElementBlocking
                            >
                              {(
                                draggableProvided,
                                draggableSnapshot,
                              ): JSX.Element => (
                                <ListItemButton
                                  onMouseEnter={(): void =>
                                    setItemHoverIndex(index)
                                  }
                                  onMouseLeave={(): void =>
                                    setItemHoverIndex(-1)
                                  }
                                  ref={draggableProvided.innerRef}
                                  {...draggableProvided.draggableProps}
                                >
                                  <Stack width="100%" paddingX={1}>
                                    <Box>
                                      <Typography
                                        variant="body2"
                                        component="p"
                                        color="text.secondary"
                                      >
                                        {playlistInfo.service}
                                      </Typography>
                                    </Box>

                                    <Stack
                                      direction="row"
                                      spacing={1}
                                      width="100%"
                                      alignItems="center"
                                    >
                                      <Box
                                        {...draggableProvided.dragHandleProps}
                                      >
                                        {!draggableSnapshot.isDragging &&
                                        (isDragging ||
                                          itemHoverIndex !== index) ? (
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

                                      {renderThumbnail(playlistInfo)}

                                      <Stack
                                        width="100%"
                                        justifyContent="center"
                                      >
                                        <Tooltip
                                          title={playlistInfo.title}
                                          placement="bottom-start"
                                          open={
                                            textHoverId ===
                                              playlistManagerItemIds.current[
                                                index
                                              ]?.titleElementId ?? uuidv4()
                                          }
                                        >
                                          <Typography
                                            variant="body1"
                                            component="span"
                                            display="-webkit-box"
                                            height={48}
                                            marginBottom={1}
                                            overflow="hidden"
                                            sx={{
                                              WebkitBoxOrient: 'vertical',
                                              WebkitLineClamp: 2,
                                            }}
                                            onMouseEnter={(): void =>
                                              setTextHoverId(
                                                playlistManagerItemIds.current[
                                                  index
                                                ]?.titleElementId ?? uuidv4(),
                                              )
                                            }
                                            onMouseLeave={(): void =>
                                              setTextHoverId('')
                                            }
                                          >
                                            {playlistInfo.title}
                                          </Typography>
                                        </Tooltip>
                                        <Tooltip
                                          title={`${playlistInfo.itemCount} item(s)`}
                                          placement="bottom-start"
                                          open={
                                            textHoverId ===
                                              playlistManagerItemIds.current[
                                                index
                                              ]?.itemsElementId ?? uuidv4()
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
                                                playlistManagerItemIds.current[
                                                  index
                                                ]?.itemsElementId ?? uuidv4(),
                                              )
                                            }
                                            onMouseLeave={(): void =>
                                              setTextHoverId('')
                                            }
                                          >
                                            {`${playlistInfo.itemCount} item(s)`}
                                          </Typography>
                                        </Tooltip>
                                      </Stack>
                                      <IconButton
                                        onClick={(): void =>
                                          setTempPlaylistInfoList((prev) => {
                                            const newTempPlaylistInfoList = [
                                              ...prev,
                                            ];
                                            newTempPlaylistInfoList.splice(
                                              index,
                                              1,
                                            );

                                            return newTempPlaylistInfoList;
                                          })
                                        }
                                      >
                                        <Delete />
                                      </IconButton>
                                    </Stack>
                                  </Stack>
                                </ListItemButton>
                              )}
                            </Draggable>
                          </ListItem>
                        ))}
                        {droppableProvided.placeholder}
                      </List>
                    )}
                  </Droppable>
                ) : null}
              </DragDropContext>
            </Box>

            <Stack direction="row-reverse" spacing={1}>
              <Box width={96}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={(): void => handleClose()}
                >
                  Cancel
                </Button>
              </Box>
              <Box width={96}>
                <LoadingButton
                  variant="contained"
                  fullWidth
                  loading={isLoadingMedia}
                  onClick={(): Promise<void> => handleSave().catch()}
                >
                  Save
                </LoadingButton>
              </Box>
            </Stack>
          </Stack>
        </Box>
      </Box>
    </Modal>
  );
};
