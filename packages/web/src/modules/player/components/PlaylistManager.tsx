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
  SxProps,
  TextField,
  Theme,
  Tooltip,
  Typography,
  useMediaQuery,
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
  getSpotifyAlbumTrackDetails,
  getSpotifyPlaylistTrackDetails,
  getSpotifyTrackDetails,
  spotifyLogin,
  spotifyLogout,
} from '@app/modules/spotify/apis/spotify.api';
import {
  connect as spotifyConnect,
  disconnect as spotifyDisconnect,
  getBaseSpotifyPlaylistInfo,
  getSpotifyPlaylistInfo,
} from '@app/modules/spotify/helpers/spotify.helper';
import { getYouTubeVideoDetails } from '@app/modules/youtube/apis/youtube.api';
import {
  getBaseYouTubePlaylistInfo,
  getYouTubePlaylistInfo,
} from '@app/modules/youtube/helpers/youtube.helper';
import { getYouTubePlaylistVideoIds } from '@app/modules/youtube/helpers/youtubePlaylist.helper';
import { theme } from '@app/styles/theme';

import { PlayerContext, PlayerContextType } from '../contexts/player.context';
import { PlayerActionType } from '../reducers/player.reducer';
import {
  createEmptyMediaInfoList,
  MediaInfoList,
} from '../types/mediaInfoList';
import { MediaService } from '../types/mediaService';
import { comparePlaylistInfo, PlaylistInfo } from '../types/playlistInfo';
import { PlaylistType } from '../types/playlistType';

export const PlaylistManager: FC = () => {
  // Properties

  const MEDIA_NUMBER_WIDTH = 24;
  const THUMBNAIL_MAX_WIDTH = 96;
  const THUMBNAIL_MAX_HEIGHT = 54;

  const router = useRouter();
  const prevIsRouterReady = useRef(false);

  const sm = useMediaQuery(theme.breakpoints.up('sm'));

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
  const [tempMediaInfoList, setTempMediaInfoList] = useState(mediaInfoList);
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
      _playlistInfoList: PlaylistInfo[],
    ): Promise<MediaInfoList[MediaService.YouTube]> => {
      const videoIds: string[] = [];

      for (let i = 0; i < _playlistInfoList.length; i += 1) {
        const playlistInfo = _playlistInfoList[i];

        switch (playlistInfo.type) {
          case PlaylistType.Video: {
            break;
          }
          default: {
            // eslint-disable-next-line no-await-in-loop
            const _videoIds = await getYouTubePlaylistVideoIds(playlistInfo.id);

            playlistInfo.mediaIds.push(..._videoIds);
            videoIds.push(..._videoIds);
          }
        }
      }

      return videoIds.length > 0 ? getYouTubeVideoDetails(videoIds) : {};
    },
    [],
  );

  const loadSpotify = useCallback(
    async (
      playlistInfo: PlaylistInfo,
    ): Promise<MediaInfoList[MediaService.Spotify]> => {
      switch (playlistInfo.type) {
        case PlaylistType.Playlist: {
          const { trackIds, tracks } = await getSpotifyPlaylistTrackDetails(
            playlistInfo.id,
          );

          trackIds.forEach((id) => {
            playlistInfo.mediaIds.push(id);
          });

          return tracks;
        }
        case PlaylistType.Album: {
          const { trackIds, tracks } = await getSpotifyAlbumTrackDetails(
            playlistInfo.id,
          );

          trackIds.forEach((id) => {
            playlistInfo.mediaIds.push(id);
          });

          return tracks;
        }
        case PlaylistType.Track: {
          const tracks = await getSpotifyTrackDetails([playlistInfo.id]);
          return tracks;
        }
        default: {
          return {};
        }
      }
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
  }, [isPlaylistManagerOpen, animationId]);

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

          /* eslint-disable no-await-in-loop */
          for (let i = 0; i < playlistIds.length; i += 1) {
            try {
              const playlistId = playlistIds[i];
              const [service, type, id] = playlistId.split(' ') as [
                MediaService,
                PlaylistType,
                string,
              ];

              const basePlaylistInfo = { service, type, id } as PlaylistInfo;

              let playlistInfo: PlaylistInfo | undefined;
              let mediaInfo: MediaInfoList[MediaService.None] | undefined;

              switch (service) {
                case MediaService.YouTube: {
                  ({ playlistInfo, mediaInfo } = await getYouTubePlaylistInfo(
                    basePlaylistInfo,
                  ));
                  break;
                }
                case MediaService.Spotify: {
                  ({ playlistInfo, mediaInfo } = await getSpotifyPlaylistInfo(
                    basePlaylistInfo,
                  ));
                  break;
                }
                default: {
                  break;
                }
              }

              if (playlistInfo) {
                newTempPlaylistInfoList.push(playlistInfo);

                if (mediaInfo) {
                  newMediaInfoList[service][id] = mediaInfo[id];
                } else {
                  switch (service) {
                    case MediaService.Spotify: {
                      const tracks = await loadSpotify(playlistInfo);

                      Object.keys(tracks).forEach((trackId) => {
                        if (playlistInfo && type === PlaylistType.Album) {
                          tracks[trackId].thumbnail = {
                            ...playlistInfo.thumbnail,
                          };
                        }

                        newMediaInfoList[service][trackId] = tracks[trackId];
                      });
                      break;
                    }
                    default: {
                      break;
                    }
                  }
                }

                loadedPlaylistIds.push(playlistId);
              }
            } catch {
              // Do nothing
            }
          }
          /* eslint-enable no-await-in-loop */

          const youtubePlaylistInfoList = newTempPlaylistInfoList.filter(
            (playlistInfo) => playlistInfo.service === MediaService.YouTube,
          );
          const videos = await loadYouTube(youtubePlaylistInfoList);
          Object.keys(videos).forEach((videoId) => {
            newMediaInfoList[MediaService.YouTube][videoId] = videos[videoId];
          });

          setTempPlaylistInfoList(newTempPlaylistInfoList);
          setTempMediaInfoList(newMediaInfoList);

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

        let basePlaylistInfo: PlaylistInfo | null;
        let playlistInfo: PlaylistInfo | undefined;
        let mediaInfo: MediaInfoList[MediaService.None] | undefined;

        basePlaylistInfo = getBaseYouTubePlaylistInfo(playlistLink);
        if (basePlaylistInfo != null) {
          ({ playlistInfo, mediaInfo } = await getYouTubePlaylistInfo(
            basePlaylistInfo,
          ));
        }

        if (basePlaylistInfo == null) {
          basePlaylistInfo = getBaseSpotifyPlaylistInfo(playlistLink);
          if (basePlaylistInfo != null) {
            ({ playlistInfo, mediaInfo } = await getSpotifyPlaylistInfo(
              basePlaylistInfo,
            ));
          }
        }

        if (playlistInfo) {
          if (
            tempPlaylistInfoList.findIndex(
              (info) => playlistInfo && comparePlaylistInfo(info, playlistInfo),
            ) === -1
          ) {
            setTempPlaylistInfoList((prev) => {
              const newTempPlaylistInfoList = [...prev];
              if (playlistInfo) {
                newTempPlaylistInfoList.push(playlistInfo);
              }

              return newTempPlaylistInfoList;
            });

            setTempMediaInfoList((prev) => {
              const newTempMediaInfoList = { ...prev };
              if (mediaInfo) {
                Object.keys(mediaInfo).forEach((mediaId) => {
                  if (playlistInfo && mediaInfo) {
                    newTempMediaInfoList[playlistInfo.service][mediaId] =
                      mediaInfo[mediaId];
                  }
                });
              }

              return newTempMediaInfoList;
            });

            playlistError = '';
          } else {
            switch (playlistInfo.type) {
              case PlaylistType.Playlist: {
                playlistError = 'Playlist already exists';
                break;
              }
              case PlaylistType.Album: {
                playlistError = 'Album already exists';
                break;
              }
              case PlaylistType.Video: {
                playlistError = 'Video already exists';
                break;
              }
              case PlaylistType.Track: {
                playlistError = 'Track already exists';
                break;
              }
              default: {
                playlistError = 'Unknown playlist type';
                break;
              }
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
          prev[`${current.service} ${current.type} ${current.id}`] = current;
          return prev;
        },
        {} as {
          [key: string]: PlaylistInfo;
        },
      );

      const newPlaylistInfoList = [...tempPlaylistInfoList];
      const newMediaInfoList: MediaInfoList = { ...createEmptyMediaInfoList() };

      const playlistIds = newPlaylistInfoList.map(
        ({ service, type, id }) => `${service} ${type} ${id}`,
      );

      /* eslint-disable no-await-in-loop */
      for (let i = 0; i < newPlaylistInfoList.length; i += 1) {
        const playlistInfo = newPlaylistInfoList[i];

        const { service, type, id, thumbnail } = playlistInfo;
        const playlistId = `${service} ${type} ${id}`;

        if (prevPlaylistInfo[playlistId]) {
          playlistInfo.mediaIds = prevPlaylistInfo[playlistId].mediaIds;

          playlistInfo.mediaIds.forEach((mediaId) => {
            newMediaInfoList[service][mediaId] =
              tempMediaInfoList[service][mediaId];
          });
        } else {
          switch (type) {
            case PlaylistType.Video:
            case PlaylistType.Track: {
              newMediaInfoList[service][playlistInfo.mediaIds[0]] =
                tempMediaInfoList[service][playlistInfo.mediaIds[0]];
              break;
            }
            default: {
              switch (service) {
                case MediaService.Spotify: {
                  const tracks = await loadSpotify(playlistInfo);

                  Object.keys(tracks).forEach((trackId) => {
                    if (type === PlaylistType.Album) {
                      tracks[trackId].thumbnail = { ...thumbnail };
                    }

                    newMediaInfoList[service][trackId] = tracks[trackId];
                  });
                  break;
                }
                default: {
                  break;
                }
              }
              break;
            }
          }
        }
      }
      /* eslint-enable no-await-in-loop */

      const youtubePlaylistInfoList = newPlaylistInfoList.filter(
        (playlistInfo) =>
          playlistInfo.service === MediaService.YouTube &&
          !prevPlaylistInfo[
            `${playlistInfo.service} ${playlistInfo.type} ${playlistInfo.id}`
          ],
      );
      const videos = await loadYouTube(youtubePlaylistInfoList);
      Object.keys(videos).forEach((videoId) => {
        newMediaInfoList[MediaService.YouTube][videoId] = videos[videoId];
      });

      router.replace({
        query: {
          ...router.query,
          playlistIds,
        },
      });

      setPlaylistLink('');
      setPlaylistLinkError('');
      setTempPlaylistInfoList(newPlaylistInfoList);
      setTempMediaInfoList(newMediaInfoList);

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
      setTempMediaInfoList(mediaInfoList);

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

  const compactListStyle: SxProps<Theme> = {
    paddingTop: 0,
    paddingBottom: 0,
  };
  const discListStyle: SxProps<Theme> = {
    ...compactListStyle,
    display: 'list-item',
    listStyle: 'disc',
  };
  const circleListStyle: SxProps<Theme> = {
    ...compactListStyle,
    display: 'list-item',
    listStyle: 'circle',
  };

  return (
    <Modal open={isPlaylistManagerOpen} onClose={(): void => handleClose()}>
      <Box
        display="flex"
        width="100%"
        height="100%"
        sx={{ pointerEvents: 'none' }}
      >
        <Box display="flex" width="100%" height="100%" margin="auto">
          <Stack
            spacing={2}
            width={sm ? '75%' : '100%'}
            maxWidth={sm ? 800 : '100%'}
            maxHeight="100%"
            padding={4}
            margin="auto"
            bgcolor="background.paper"
            sx={{ pointerEvents: 'auto' }}
          >
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
                <List sx={compactListStyle}>
                  <ListSubheader>
                    <ListItemText>Supported services:</ListItemText>
                  </ListSubheader>
                  <ListItem sx={compactListStyle}>
                    <List sx={compactListStyle}>
                      <ListItem
                        sx={{
                          ...discListStyle,
                          marginLeft: 4,
                        }}
                      >
                        <ListItemText>YouTube</ListItemText>
                      </ListItem>
                      <ListItem sx={compactListStyle}>
                        <List sx={compactListStyle}>
                          <ListItem
                            sx={{
                              ...circleListStyle,
                              marginLeft: 8,
                            }}
                          >
                            <ListItemText>Playlist</ListItemText>
                          </ListItem>
                          <ListItem
                            sx={{
                              ...circleListStyle,
                              marginLeft: 8,
                            }}
                          >
                            <ListItemText>Video</ListItemText>
                          </ListItem>
                        </List>
                      </ListItem>

                      <ListItem
                        sx={{
                          ...discListStyle,
                          marginLeft: 4,
                        }}
                      >
                        <ListItemText>Spotify (login required)</ListItemText>
                      </ListItem>
                      <ListItem sx={compactListStyle}>
                        <List sx={compactListStyle}>
                          <ListItem
                            sx={{
                              ...circleListStyle,
                              marginLeft: 8,
                            }}
                          >
                            <ListItemText>Playlist</ListItemText>
                          </ListItem>
                          <ListItem
                            sx={{
                              ...circleListStyle,
                              marginLeft: 8,
                            }}
                          >
                            <ListItemText>Album</ListItemText>
                          </ListItem>
                          <ListItem
                            sx={{
                              ...circleListStyle,
                              marginLeft: 8,
                            }}
                          >
                            <ListItemText>Track</ListItemText>
                          </ListItem>
                        </List>
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
                                  disableRipple
                                  onMouseEnter={(): void =>
                                    setItemHoverIndex(index)
                                  }
                                  onMouseLeave={(): void =>
                                    setItemHoverIndex(-1)
                                  }
                                  ref={draggableProvided.innerRef}
                                  {...draggableProvided.draggableProps}
                                  {...draggableProvided.dragHandleProps}
                                >
                                  <Stack width="100%" paddingX={1}>
                                    <Box>
                                      <Typography
                                        variant="body2"
                                        component="p"
                                        color="text.secondary"
                                      >
                                        {`${playlistInfo.service} - ${playlistInfo.type}`}
                                      </Typography>
                                    </Box>

                                    <Stack
                                      direction="row"
                                      spacing={1}
                                      width="100%"
                                      alignItems="center"
                                    >
                                      <Box>
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
