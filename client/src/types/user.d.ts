interface User {
  userId: string;
  username: string;
  password: string;
  avatar: string;
  role?: string;
  tag?: string;
  createTime: number;
  online?: boolean; // 是否在线
}
