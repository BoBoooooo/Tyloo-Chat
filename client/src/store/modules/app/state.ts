export interface AppState {
  user: User;
  token: string;
  activeTabName: 'message' | 'contacts';
  apiUrl: string;
  loading: boolean;
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
  apiUrl: process.env.VUE_APP_API_URL || '', // 后台api地址
  loading: false, // 全局Loading状态
};

export default appState;
