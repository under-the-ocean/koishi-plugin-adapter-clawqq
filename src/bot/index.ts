import { Context, noop, Schema, Session, Universal } from 'koishi'
import { BaseBot } from './base'
import * as OpenClaw from '../utils'

export * from './base'
export * from './message'

export class OpenClawBot<C extends Context, T extends OpenClawBot.Config = OpenClawBot.Config> extends BaseBot<C, T> {
  constructor(ctx: C, config: T) {
    super(ctx, config, 'openclaw')
    this.selfId = config.selfId
    this.internal = new OpenClaw.Internal(this)
    this.user = {
      id: config.selfId,
      name: 'OpenClaw Bot',
      avatar: `http://q.qlogo.cn/headimg_dl?dst_uin=${config.selfId}&spec=640`,
    }
  }

  async stop() {
    await super.stop()
  }

  async initialize() {
    await Promise.all([
      this.getLogin(),
    ]).then(() => this.online(), error => this.offline(error))
  }

  async getChannel(channelId: string) {
    if (channelId.startsWith('private:')) {
      const userId = channelId.slice('private:'.length)
      return {
        id: channelId,
        type: Universal.Channel.Type.DIRECT,
        name: userId,
      } satisfies Universal.Channel
    }
    const data = await this.internal.getGroupInfo(channelId)
    return OpenClaw.adaptChannel(data)
  }

  async getGuild(guildId: string) {
    const data = await this.internal.getGroupInfo(guildId)
    return OpenClaw.adaptGuild(data)
  }

  async getGuildList() {
    const data = await this.internal.getGroupList()
    return { data: data.map(OpenClaw.adaptGuild) }
  }

  async getChannelList(guildId: string) {
    return { data: [await this.getChannel(guildId)] }
  }

  async getGuildMember(guildId: string, userId: string) {
    const data = await this.internal.getGroupMemberInfo(guildId, userId)
    return OpenClaw.decodeGuildMember(data)
  }

  async getGuildMemberList(guildId: string) {
    const data = await this.internal.getGroupMemberList(guildId)
    return { data: data.map(OpenClaw.decodeGuildMember) }
  }

  async kickGuildMember(guildId: string, userId: string, permanent?: boolean) {
    return this.internal.setGroupKick(guildId, userId, permanent)
  }

  async muteGuildMember(guildId: string, userId: string, duration: number) {
    return this.internal.setGroupBan(guildId, userId, Math.round(duration / 1000))
  }

  async muteChannel(channelId: string, guildId?: string, enable?: boolean) {
    return this.internal.setGroupWholeBan(channelId, enable)
  }

  async checkPermission(name: string, session: Partial<Session>) {
    if (name === 'openclaw.group.admin') {
      return session.author?.roles?.[0]?.id === 'admin'
    } else if (name === 'openclaw.group.owner') {
      return session.author?.roles?.[0]?.id === 'owner'
    }
    return super.checkPermission(name, session)
  }
}

export namespace OpenClawBot {
  export interface BaseConfig extends BaseBot.Config {
    selfId: string
    appId: string
    clientSecret: string
  }

  export const BaseConfig: Schema<BaseConfig> = Schema.object({
    selfId: Schema.string().description('机器人的账号。').required(),
    appId: Schema.string().description('QQ 开放平台的 App ID。').required(),
    clientSecret: Schema.string().role('secret').description('QQ 开放平台的 Client Secret。').required(),
  })

  export type Config = BaseConfig

  export const Config: Schema<Config> = Schema.intersect([
    BaseConfig,
    Schema.object({
      advanced: BaseBot.AdvancedConfig,
    }),
  ])
}