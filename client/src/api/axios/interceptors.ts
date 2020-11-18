import { AxiosRequestConfig, AxiosResponse } from 'axios';
import cookie from 'js-cookie';

// 请求拦截器
export const requestSuccess = (request: AxiosRequestConfig) => {
  const token = cookie.get('token');
  // eslint-disable-next-line no-param-reassign
  request.headers.token = token;
  return request;
};

export const requestFail = (error: AxiosRequestConfig) => Promise.reject(error);

// 接收拦截器
export const responseSuccess = (response: AxiosResponse) => response;

export const responseFail = (error: AxiosResponse) => Promise.reject(error);
