import { IpcHandle, Window } from '@doubleshot/nest-electron'
import { AppService } from '@main/app.service'
import { Controller } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { BrowserWindow } from 'electron'
import { type Observable, of } from 'rxjs'

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Window() private readonly mainWin: BrowserWindow,
  ) {}

  @IpcHandle('msg')
  public handleSendMsg(@Payload() msg: string): Observable<string> {
    const { webContents } = this.mainWin
    webContents.send('reply-msg', 'this is msg from webContents.send')
    return of(
      `The main process received your message: ${msg} at time: ${this.appService.getTime()}`,
    )
  }
}
