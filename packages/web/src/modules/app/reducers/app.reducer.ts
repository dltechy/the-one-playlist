export enum AppActionType {
  OpenSidebar = 'OPEN_SIDEBAR',
  CloseSidebar = 'CLOSE_SIDEBAR',
}

export interface AppAction {
  type: AppActionType;
  payload?: Partial<AppState>;
}

export interface AppState {
  isSidebarOpen: boolean;
}

export const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case AppActionType.OpenSidebar: {
      return { ...state, isSidebarOpen: true };
    }
    case AppActionType.CloseSidebar: {
      return { ...state, isSidebarOpen: false };
    }

    default: {
      return state;
    }
  }
};
