import { Bot, Context, Schema, Universal } from 'koishi'
import * as OpenClaw from '../utils'
import { OpenClawMessageEncoder, PRIVATE_PFX } from './message'

export class BaseBot<C extends Context = Context, T extends BaseBot.Config = BaseBot.Config> extends Bot<C, T> {
  static MessageEncoder = OpenClawMessageEncoder
  static inject = ['http']

  public parent?: BaseBot
  public internal: any

  async createDirectChannel(userId: string) {
    return { id: `${PRIVATE_PFX}${userId}`, type: Universal.Channel.Type.DIRECT }
  }

  async getMessage(channelId: string, messageId: string) {
    const data = await this.internal.getMsg(messageId)
    return await OpenClaw.adaptMessage(this as any, data)
  }

  async deleteMessage(channelId: string, messageId: string) {
    await this.internal.deleteMsg(messageId)
  }

  async getLogin() {
    const data = await this.internal.getLoginInfo()
    this.user = OpenClaw.decodeUser(data)
    return this.toJSON()
  }

  async getUser(userId: string) {
    const data = await this.internal.getStrangerInfo(userId)
    return OpenClaw.decodeUser(data)
  }

  async getFriendList() {
    const data = await this.internal.getFriendList()
    return { data: data.map(OpenClaw.decodeUser) }
  }

  async handleFriendRequest(messageId: string, approve: boolean, comment?: string) {
    await this.internal.setFriendAddRequest(messageId, approve, comment)
  }

  async handleGuildRequest(messageId: string, approve: boolean, comment?: string) {
    await this.internal.setGroupAddRequest(messageId, 'invite', approve, comment)
  }

  async handleGuildMemberRequest(messageId: string, approve: boolean, comment?: string) {
    await this.internal.setGroupAddRequest(messageId, 'add', approve, comment)
  }

  async deleteFriend(userId: string) {
    await this.internal.deleteFriend(userId)
  }

  async getMessageList(channelId: string, before?: string, direction: Universal.Direction = 'before') {
    if (direction !== 'before') throw new Error('Unsupported direction.')
    // include `before` message
    let list: any[] = []

    // 私聊频道以 "private:" 开头，使用 get_friend_msg_history
    if (channelId.startsWith('private:')) {
      const userId = channelId.slice('private:'.length)
      if (before) {
        const msg = await this.internal.getMsg(before)
        if (msg?.message_seq) {
          list = (await this.internal.getFriendMsgHistory(userId, msg.message_seq)).messages
        }
      } else {
        list = (await this.internal.getFriendMsgHistory(userId)).messages
      }
    } else {
      // 群聊频道使用 get_group_msg_history
      if (before) {
        const msg = await this.internal.getMsg(before)
        if (msg?.message_seq) {
          list = (await this.internal.getGroupMsgHistory(Number(channelId), msg.message_seq)).messages
        }
      } else {
        list = (await this.internal.getGroupMsgHistory(Number(channelId))).messages
      }
    }

    // 从旧到新
    return { data: await Promise.all(list.map(item => OpenClaw.adaptMessage(this as any, item))) }
  }

  async sendMessage(channelId: string, content: string) {
    return this.internal.sendMessage(channelId, content)
  }
}

export namespace BaseBot {
  export interface Config {
    advanced?: AdvancedConfig
  }

  export interface AdvancedConfig {
    splitMixedContent?: boolean
  }

  export const AdvancedConfig: Schema<AdvancedConfig> = Schema.object({
    splitMixedContent: Schema.boolean().description('是否自动在混合内容间插入空格。').default(true),
  }).description('高级设置')
}