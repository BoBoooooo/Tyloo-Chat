import { AxiosRequestConfig, AxiosResponse } from 'axios';
import Vue from 'vue';
import store from '@/store/index';
import { CLEAR_USER } from '../../store/modules/app/mutation-types';

// 请求拦截器
export const requestSuccess = (request: AxiosRequestConfig) => {
  const token = localStorage.getItem('token');
  // eslint-disable-next-line no-param-reassign
  request.headers.token = token;
  return request;
};

export const requestFail = (error: AxiosRequestConfig) => Promise.reject(error);

// 接收拦截器
export const responseSuccess = (response: AxiosResponse) => {
  // token过期时清空登录态重新登录
  const { data } = response;
  if (data.code === 401) {
    Vue.prototype.$message.error(data.msg);
    store.commit(`app/${CLEAR_USER}`);
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  }
  return response;
};

export const responseFail = (error: AxiosResponse) => Promise.reject(error);
