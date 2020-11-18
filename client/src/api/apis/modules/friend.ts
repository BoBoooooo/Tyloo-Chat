import axios from '@/api/axios';

/**
 * 群分页消息
 * @param params
 */
// eslint-disable-next-line import/prefer-default-export
export async function getFriendMessage(params: PagingParams) {
  // eslint-disable-next-line no-return-await
  return await axios.get('/friend/friendMessages', {
    params,
  });
}
