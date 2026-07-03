import { RoutineLogger } from '@/logger'
import { BaseContext } from './baseContext'

export class RoutineContext extends BaseContext {
  public logger: RoutineLogger

  constructor(routineName: string) {
    super()
    this.logger = new RoutineLogger(routineName)
  }
}
