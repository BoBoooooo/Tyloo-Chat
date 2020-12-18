import axios from '@/api/axios';

/**
 * 群名模糊搜索用户
 * @param string
 */
export function getGroupsByName(groupName: string) {
  return axios.get(`/group/findByName?groupName=${groupName}`);
}

/**
 * 群分页消息
 * @param params
 */
export async function getGroupMessages(params: PagingParams) {
  // eslint-disable-next-line no-return-await
  return await axios.get('/group/groupMessages', {
    params,
  });
}
