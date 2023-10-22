import { PixivIllust, UgoiraMetaData } from "@markpolochina/pixiv.ts";

declare global {
  interface Window {
    electron: {
      sendMsg(msg: string): Promise<string>;
      onReplyMsg(cb: (msg: string) => any): void;
      ipcInvoke(channel: string, ...args: any[]): Promise<any>;
      ipcOn(channel: string, cb: (...args: any[]) => any): any;
      ipcRemoveAll(channel: string): any;
      ipcSend(channel: string, ...args: any[]): void;
      ipcSendSync(channel: string, ...args: any[]): any;
      ipcOnce(channel: string, cb: (...args: any[]) => any): any;
      apiAdapter(
        url: string,
        method: "GET" | "POST" | "PUT" | "DELETE",
        params: any,
        body: any
      ): Promise<any>;
      downloadTo(url: string, rename: string, dir: string): Promise<void>;
      downloadPixivTo(illustObj: PixivIllust, dir: string, page?: number): Promise<void>;
      downloadPixivUgoiraTo(illustObj: PixivIllust, dir: string, meta: UgoiraMetaData): Promise<void>;
    };
  }
}

export {};
