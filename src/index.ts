import { Session } from 'koishi'
import { OpenClawBot } from './bot'
import * as OpenClaw from './utils'

export { OpenClaw }

export * from './bot'

export default OpenClawBot

declare module '@satorijs/core' {
  interface Session {
    openclaw?: OpenClaw.Payload & OpenClaw.Internal
  }
}

declare module 'koishi' {
  interface Events {
    'openclaw/message-reactions-updated'(session: Session): void
    'openclaw/channel-updated'(session: Session): void
    'openclaw/channel-created'(session: Session): void
    'openclaw/channel-destroyed'(session: Session): void
  }
}