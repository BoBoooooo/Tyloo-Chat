export interface AppState {
  user: User;
  token: string;
  activeTabName: 'message' | 'contacts';
  apiUrl: string;
}

const appState: AppState = {
  user: {
    userId: '',
    username: '',
    password: '',
    avatar: '',
    createTime: 0,
  },
  token: localStorage.getItem('token') as string,
  activeTabName: 'message',
  apiUrl: process.env.VUE_APP_API_URL || '',
};

export default appState;
