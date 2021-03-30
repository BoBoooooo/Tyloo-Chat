import axios, { AxiosInstance } from 'axios';
import { requestSuccess, requestFail, responseSuccess, responseFail } from './interceptors';

const fetch: AxiosInstance = axios.create({
  timeout: 60000, // 超时时间一分钟
  baseURL: process.env.VUE_APP_API_URL,
  headers: {
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
  },
  // 不携带cookie
  withCredentials: false,
});

fetch.interceptors.request.use(requestSuccess, requestFail);
fetch.interceptors.response.use(responseSuccess, responseFail);

export default fetch;
