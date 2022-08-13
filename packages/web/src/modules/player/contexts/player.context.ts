import { createContext, Dispatch } from 'react';

import { PlayerAction, PlayerState } from '../reducers/player.reducer';

export interface PlayerContextType {
  playerState: PlayerState;
  playerDispatch: Dispatch<PlayerAction>;
}

export const PlayerContext = createContext<PlayerContextType | null>(null);
