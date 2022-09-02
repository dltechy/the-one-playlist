import { createContext, Dispatch } from 'react';

import { AppAction, AppState } from '../reducers/app.reducer';

export interface AppContextType {
  appState: AppState;
  appDispatch: Dispatch<AppAction>;
}

export const AppContext = createContext<AppContextType | null>(null);
