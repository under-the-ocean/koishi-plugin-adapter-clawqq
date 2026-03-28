import { MessageEncoder } from 'koishi'

export const PRIVATE_PFX = 'private:'

export class OpenClawMessageEncoder extends MessageEncoder {
  private buffer: string = ''

  async visit(element: any): Promise<void> {
    const text = await this.encode(element)
    if (text) {
      this.buffer += text
    }
  }

  async flush(): Promise<void> {
    this.buffer = ''
  }

  async encode(element: any): Promise<string> {
    switch (element.type) {
      case 'text':
        return element.content
      case 'at':
        if (element.userId === this.bot.selfId) {
          return `@${this.bot.user?.name || 'Bot'}`
        }
        return `@${element.name || element.userId}`
      case 'image':
        return `[图片](${element.url})`
      case 'voice':
        return `[语音](${element.url})`
      case 'video':
        return `[视频](${element.url})`
      case 'file':
        return `[文件](${element.url})`
      case 'forward':
        return `[转发消息]`
      case 'quote':
        return `[引用消息]`
      default:
        return ''
    }
  }

  async decode(content: string): Promise<any[]> {
    const elements: any[] = []
    elements.push({
      type: 'text',
      content,
    })
    return elements
  }
}