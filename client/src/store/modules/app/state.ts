export interface AppState {
  user: User;
  token: string;
  mobile: boolean;
  background: string;
  activeTabName: 'message' | 'contacts';
}

const appState: AppState = {
  user: {
    userId: '',
    username: '',
    password: '',
    avatar: '',
    createTime: 0,
  },
  token: '',
  mobile: false,
  background: '',
  activeTabName: 'message',
};

export default appState;
