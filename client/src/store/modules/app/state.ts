import cookie from 'js-cookie';

export interface AppState {
  user: User;
  token: string;
  mobile: boolean;
  background: string;
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
  token: cookie.get('token') as string,
  mobile: false,
  background: '',
  activeTabName: 'message',
  apiUrl: process.env.VUE_APP_API_URL,
};

export default appState;
