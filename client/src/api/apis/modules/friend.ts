import axios from '@/api/axios';

/**
 * 群分页消息
 * @param params
 */
export async function getFriendMessage(params: PagingParams) {
  return await axios.get(`/friend/friendMessages`, {
    params,
  });
}
