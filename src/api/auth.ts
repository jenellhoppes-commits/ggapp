import request from '@/utils/http'
import { HttpError } from '@/utils/http/error'
import { ApiStatus } from '@/utils/http/status'

const isFrontendMode = import.meta.env.VITE_ACCESS_MODE === 'frontend'
const LOCAL_USER_KEY = 'ggap-demo-user'

const localUsers: Record<
  string,
  {
    password: string
    userId: number
    roles: string[]
    email: string
    merchantId?: string
    agentId?: string
  }
> = {
  super: {
    password: '123456',
    userId: 1,
    roles: ['R_SUPER'],
    email: 'admin@ggap.local'
  },
  agent: {
    agentId: 'A00001',
    password: '123456',
    userId: 2,
    roles: ['R_AGENT'],
    email: 'agent@ggap.local'
  },
  merchant: {
    merchantId: 'M00001',
    password: '123456',
    userId: 3,
    roles: ['R_MERCHANT'],
    email: 'merchant@ggap.local'
  }
}

const getLocalUser = (userName?: string) => {
  const key = (userName || localStorage.getItem(LOCAL_USER_KEY) || 'super').toLowerCase()
  return { key, profile: localUsers[key] || localUsers.super }
}

/**
 * 登录
 * @param params 登录参数
 * @returns 登录响应
 */
export async function fetchLogin(params: Api.Auth.LoginParams): Promise<Api.Auth.LoginResponse> {
  if (isFrontendMode) {
    const { key, profile } = getLocalUser(params.userName)
    if (!localUsers[key] || profile.password !== params.password) {
      throw new HttpError('帳號或密碼錯誤', ApiStatus.unauthorized)
    }

    localStorage.setItem(LOCAL_USER_KEY, key)
    return {
      token: `demo-access-token-${key}`,
      refreshToken: `demo-refresh-token-${key}`
    }
  }

  return request.post<Api.Auth.LoginResponse>({
    url: '/api/auth/login',
    params
    // showSuccessMessage: true // 显示成功消息
    // showErrorMessage: false // 不显示错误消息
  })
}

/**
 * 获取用户信息
 * @returns 用户信息
 */
export async function fetchGetUserInfo(): Promise<Api.Auth.UserInfo> {
  if (isFrontendMode) {
    const { key, profile } = getLocalUser()
    return {
      buttons: ['add', 'edit', 'delete', 'export', 'approve'],
      roles: profile.roles,
      userId: profile.userId,
      merchantId: profile.merchantId,
      agentId: profile.agentId,
      userName: key === 'super' ? 'GGAP 管理者' : key === 'agent' ? '示範代理' : '示範商戶',
      email: profile.email
    }
  }

  return request.get<Api.Auth.UserInfo>({
    url: '/api/user/info'
    // 自定义请求头
    // headers: {
    //   'X-Custom-Header': 'your-custom-value'
    // }
  })
}
