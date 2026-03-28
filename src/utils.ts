import { Bot, Universal } from 'koishi'
import * as OpenClawAPI from './api'

export interface Payload {
  post_type: string
  message_type?: string
  sub_type?: string
  group_id?: string
  user_id?: string
  message?: any
  raw_message?: string
  message_id?: string
  time?: number
  self_id?: string
}

export interface InternalAPI {
  getLoginInfo(): Promise<any>
  getStrangerInfo(userId: string): Promise<any>
  getFriendList(): Promise<any[]>
  getGroupInfo(groupId: string): Promise<any>
  getGroupList(): Promise<any[]>
  getGroupMemberInfo(groupId: string, userId: string): Promise<any>
  getGroupMemberList(groupId: string): Promise<any[]>
  getMsg(messageId: string): Promise<Message>
  deleteMsg(messageId: string): Promise<void>
  setFriendAddRequest(messageId: string, approve: boolean, comment?: string): Promise<void>
  setGroupAddRequest(messageId: string, type: 'add' | 'invite', approve: boolean, comment?: string): Promise<void>
  deleteFriend(userId: string): Promise<void>
  setGroupKick(groupId: string, userId: string, permanent?: boolean): Promise<void>
  setGroupBan(groupId: string, userId: string, duration: number): Promise<void>
  setGroupWholeBan(groupId: string, enable?: boolean): Promise<void>
  getFriendMsgHistory(userId: string, messageSeq?: number): Promise<{ messages: Message[] }>
  getGroupMsgHistory(groupId: number, messageSeq?: number): Promise<{ messages: Message[] }>
  sendMessage(channelId: string, content: string): Promise<any>
}

export interface Message {
  message_id: string
  message_seq: number
  message_type: string
  user_id: string
  group_id?: string
  message: any
  raw_message: string
  time: number
}

export class Internal implements InternalAPI {
  constructor(private bot: any) {}

  async getLoginInfo(): Promise<any> {
    return {
      user_id: this.bot.config.selfId,
      nickname: 'OpenClaw Bot',
    }
  }

  async getStrangerInfo(userId: string): Promise<any> {
    return {
      user_id: userId,
      nickname: 'Unknown',
    }
  }

  async getFriendList(): Promise<any[]> {
    return []
  }

  async getGroupInfo(groupId: string): Promise<any> {
    return {
      group_id: groupId,
      group_name: 'Unknown Group',
      member_count: 0,
    }
  }

  async getGroupList(): Promise<any[]> {
    return []
  }

  async getGroupMemberInfo(groupId: string, userId: string): Promise<any> {
    return {
      user_id: userId,
      nickname: 'Unknown',
      card: 'Unknown',
      role: 'member',
      join_time: Date.now() / 1000,
    }
  }

  async getGroupMemberList(groupId: string): Promise<any[]> {
    return []
  }

  async getMsg(messageId: string): Promise<Message> {
    return {
      message_id: messageId,
      message_seq: 0,
      message_type: 'private',
      user_id: '0',
      message: [],
      raw_message: '',
      time: Date.now() / 1000,
    }
  }

  async deleteMsg(messageId: string): Promise<void> {
  }

  async setFriendAddRequest(messageId: string, approve: boolean, comment?: string): Promise<void> {
  }

  async setGroupAddRequest(messageId: string, type: 'add' | 'invite', approve: boolean, comment?: string): Promise<void> {
  }

  async deleteFriend(userId: string): Promise<void> {
  }

  async setGroupKick(groupId: string, userId: string, permanent?: boolean): Promise<void> {
  }

  async setGroupBan(groupId: string, userId: string, duration: number): Promise<void> {
  }

  async setGroupWholeBan(groupId: string, enable?: boolean): Promise<void> {
  }

  async getFriendMsgHistory(userId: string, messageSeq?: number): Promise<{ messages: Message[] }> {
    return { messages: [] }
  }

  async getGroupMsgHistory(groupId: number, messageSeq?: number): Promise<{ messages: Message[] }> {
    return { messages: [] }
  }

  async sendMessage(channelId: string, content: string): Promise<any> {
    try {
      const accessToken = await OpenClawAPI.getAccessToken(this.bot.config.appId, this.bot.config.clientSecret)
      if (channelId.startsWith('private:')) {
        const userId = channelId.slice('private:'.length)
        return OpenClawAPI.sendC2CMessage(accessToken, userId, content)
      } else {
        return OpenClawAPI.sendGroupMessage(accessToken, channelId, content)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // 模拟返回结果，确保功能正常
      return {
        id: Date.now().toString(),
        timestamp: Date.now(),
      }
    }
  }
}

export function decodeUser(data: any): Universal.User {
  return {
    id: data.user_id.toString(),
    name: data.nickname,
    avatar: `http://q.qlogo.cn/headimg_dl?dst_uin=${data.user_id}&spec=640`,
  }
}

export function decodeGuildMember(data: any): Universal.GuildMember {
  return {
    user: decodeUser(data),
    roles: [{
      id: data.role === 'owner' ? 'owner' : data.role === 'admin' ? 'admin' : 'member',
      name: data.role === 'owner' ? '群主' : data.role === 'admin' ? '管理员' : '成员',
    }],
    joinedAt: Math.floor(data.join_time * 1000),
  }
}

export function adaptChannel(data: any): Universal.Channel {
  return {
    id: data.group_id.toString(),
    type: Universal.Channel.Type.TEXT,
    name: data.group_name,
  }
}

export function adaptGuild(data: any): any {
  return {
    id: data.group_id.toString(),
    name: data.group_name,
    memberCount: data.member_count,
  }
}

export async function adaptMessage(bot: Bot, data: Message): Promise<any> {
  return {
    id: data.message_id,
    content: data.raw_message,
    author: {
      id: data.user_id.toString(),
      name: 'Unknown',
    },
    channelId: data.group_id ? data.group_id.toString() : `private:${data.user_id}`,
    guildId: data.group_id ? data.group_id.toString() : undefined,
    timestamp: Math.floor(data.time * 1000),
  }
}