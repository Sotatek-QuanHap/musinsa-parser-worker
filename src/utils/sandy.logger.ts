import * as os from 'os';
export class SandyLogger {
  public static enableDebug: boolean = true;
  public static enableFinish: boolean = false;
  public static enableComplete: boolean = false;
  public static enableInfo: boolean = true;
  public static enablePrintLog: boolean = true;
  public static clazzDisable: Map<string, boolean> = new Map();
  private static queue: {
    timestamp: number;
    message: string;
    key: string;
    topic: string;
    hostname: string;
  }[] = [];
  private static queueError: {
    timestamp: number;
    message: string;
    key: string;
    topic: string;
    context: any;
    hostname: string;
  }[] = [];
  private context: string[];
  private starts: number[];
  private scheduleTimeouts: any[];
  private warningTime = 3000;
  private warningCallback: any = undefined;
  private warningMessage = '';
  private scheduleWarnings: any[];
  private timeoutTime = 6000;
  private timeoutCallback: any = undefined;
  private timeoutMessage = '';
  public key: string = '';
  private steps: number[];
  private clazz: string = '';
  public static hostname = os.hostname();

  constructor(
    // context: string,
    fnOptions?: {
      warningTime?: number;
      warningCallback?: any;
      warningMessage?: string;
      timeoutTime?: number;
      timeoutCallback?: any;
      timeoutMessage?: string;
      partition?: string;
      offset?: string;
      clazz?: string;
    },
  ) {
    this.clazz = fnOptions?.clazz || '';
    this.scheduleTimeouts = [];
    this.scheduleWarnings = [];
    this.steps = [];
    this.context = [];
    if (fnOptions?.partition || fnOptions?.offset) {
      // this.context.push(`${fnOptions.partition}~${fnOptions.offset}`)
      this.key = `${fnOptions.partition}~${fnOptions.offset}`;
    }
    // this.context.push(context);
    this.starts = [];
    if (fnOptions) {
      const {
        warningTime,
        warningCallback,
        warningMessage,
        timeoutTime,
        timeoutCallback,
        timeoutMessage,
      } = fnOptions;
      this.warningTime = warningTime || this.warningTime;
      this.warningMessage = warningMessage || this.warningMessage;
      this.warningCallback = warningCallback || this.warningCallback;
      this.timeoutTime = timeoutTime || this.timeoutTime;
      this.timeoutMessage = timeoutMessage || this.timeoutMessage;
      this.timeoutCallback = timeoutCallback || this.timeoutCallback;
    }
  }

  private startSchedule({
    event,
    warningTime,
    warningCallback,
    warningMessage,
    timeoutTime,
    timeoutCallback,
    timeoutMessage,
  }: {
    event: string;
    warningTime?: number;
    warningCallback?: any;
    warningMessage?: string;
    timeoutTime?: number;
    timeoutCallback?: any;
    timeoutMessage?: string;
  }) {
    const scheduleWarning = setTimeout(() => {
      this.buildLog(
        `TIMEOUT-WARNING`,
        `Event [${event}]${warningMessage || this.warningMessage}`,
      );
      const callback = warningCallback || this.warningCallback;
      if (typeof callback == 'function') {
        callback();
      }
    }, warningTime || this.warningTime);
    this.scheduleWarnings.push(scheduleWarning);

    const scheduleTimeout = setTimeout(() => {
      this.buildLog(
        '[TIMEOUT-ERROR]',
        `Event [${event}]${timeoutMessage || this.timeoutMessage}`,
      );
      const callback = timeoutCallback || this.timeoutCallback;
      if (typeof callback == 'function') {
        callback();
      }
    }, timeoutTime || this.timeoutTime);
    this.scheduleTimeouts.push(scheduleTimeout);
  }

  public finishSchedule() {
    try {
      const scheduleWarning = this.scheduleWarnings.pop();
      if (scheduleWarning) clearTimeout(scheduleWarning);
    } catch (error) {
      this.error('ERROR-AT-FINISH-WARNING', error);
    }
    try {
      const scheduleTimeout = this.scheduleTimeouts.pop();
      if (scheduleTimeout) clearTimeout(scheduleTimeout);
    } catch (error) {
      this.error('ERROR-AT-FINISH-TIMEOUT', error);
    }
  }

  start(
    fn: string,
    id?: string,
    fnOptions?: {
      warningTime?: number;
      warningCallback?: any;
      warningMessage?: string;
      timeoutTime?: number;
      timeoutCallback?: any;
      timeoutMessage?: string;
    },
  ) {
    this.steps.push(0);
    this.starts.push(Date.now());
    this.finishSchedule();
    this.context.push(`${fn}`);
    this.setId(id || '');
    this.startSchedule({ event: 'START', ...fnOptions });
    this.log('START');
  }

  startThread(
    fn: string,
    id?: string,
    fnOptions?: {
      warningTime?: number;
      warningCallback?: any;
      warningMessage?: string;
      timeoutTime?: number;
      timeoutCallback?: any;
      timeoutMessage?: string;
    },
  ) {
    const logger = new SandyLogger();
    logger.start(fn, id, fnOptions);
    return logger;
  }

  setId(id: string) {
    if (id) this.context[this.context.length - 1] += `:${id}`;
  }

  next(message: string = '', input?: any) {
    this.finishSchedule();
    this.startSchedule({
      event: `STEP-${++this.steps[this.steps.length - 1]}`,
    });
    // this.log(`[STEP-${this.steps[this.steps.length - 1]}][${message}]`);
    this.debug(
      `[STEP-${this.steps[this.steps.length - 1]}][${message}]`,
      input,
    );
  }

  finish(message?: string) {
    if (message) this.buildLog('FINISH', `[message at finish]: ${message}`);
    this.finishSchedule();
    const msg = this.context.pop();
    const time = this.starts.pop();
    this.steps.pop();
    if (time) this.buildLog('FINISH', `[${msg}] spend (${Date.now() - time})`);
  }

  complete(message?: string) {
    if (message) this.buildLog('FINISH', `[message at finish]: ${message}`);
    this.finishSchedule();
    const msg = this.context.pop();
    const time = this.starts.pop();
    this.steps.pop();
    this.buildLog('COMPLETE', `[${msg}] spend (${Date.now() - (time || 0)})`);
  }

  clearWhenError(message: string, error: any) {
    this.error(message, error);
    for (const schedule of this.scheduleTimeouts) {
      clearTimeout(schedule);
    }
    this.scheduleTimeouts = [];
    for (const schedule of this.scheduleWarnings) {
      clearTimeout(schedule);
    }
    this.scheduleWarnings = [];
    this.context.splice(2);
    this.starts.splice(2);
    const msg = this.context.pop();
    const time = this.starts.pop();
    this.steps.pop();
    if (time)
      this.buildLog(
        'FINISH-CLEAR-ERROR',
        `[${msg}] spend (${Date.now() - time})`,
      );
  }

  private formatObj(value: any) {
    if (!value) return '';
    if (typeof value == 'string') {
      return value;
    }
    try {
      return JSON.stringify(value);
    } catch (error) {
      console.log('ERROR-AT-FORMAT-OBJ:', error);
    }
    return value;
  }

  private buildLog(level: string, message: any, input?: any) {
    if (SandyLogger.clazzDisable.get(`${this.clazz}-all`) && level != 'ERROR') {
      return;
    }
    if (
      SandyLogger.clazzDisable.get(`${this.clazz}-${level.toLowerCase()}`) &&
      level != 'ERROR'
    ) {
      return;
    }
    const enableField = `enable${level.charAt(0).toUpperCase()}${level.substring(1).toLowerCase()}`;
    if (
      !SandyLogger[enableField] &&
      ['DEBUG', 'LOG', 'FINISH', 'COMPLETE'].includes(level)
    ) {
      return;
    }
    try {
      const msg = [`[${this.key}]`, `[${level}]`] as string[];
      msg.push(`[${this.context.join('][')}]`);
      msg.push(": '");
      msg.push(this.formatObj(message));
      msg.push("'");
      const q = {
        timestamp: Date.now(),
        key: `${this.clazz}_${this.key}`,
        topic: this.clazz,
      };
      if (level == 'ERROR') {
        SandyLogger.queueError.push({
          ...q,
          message: msg.join(''),
          context: input,
          hostname: SandyLogger.hostname,
        });
      }
      if (input) msg.push(` - '${this.formatObj(input)}'`);

      SandyLogger.queue.push({
        ...q,
        message: msg.join(''),
        hostname: SandyLogger.hostname,
      });
      if (SandyLogger.enablePrintLog) {
        if (level == 'ERROR') {
          console.error(msg.join(''));
        } else {
          console.log(msg.join(''));
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      // If something wrong, do not anything.
    }
  }

  /**
   * debug: log chi tiết giá trị của biến
   * @param message nội dung hoặc tên biến muốn log
   * @param input giá trị của biến
   */
  debug(message: any, input: any) {
    this.buildLog('DEBUG', message, input);
  }

  /**
   * info: thông tin step by step
   * @param message
   */
  log(message: any) {
    this.buildLog('INFO', message);
  }

  /**
   * warning: (không đầy đủ), trigger những trạng thái không bình (nhưng không gây lỗi ngay)
   * @param message
   */
  warn(message: any, input?: any) {
    this.buildLog('WARN', message, input);
  }

  /**
   * error: log lỗi khi try catch
   * @param message
   * @param error
   */
  error(message: any, error?: any) {
    this.buildLog('ERROR', message, error?.stack || error);
  }

  errorAndFinish(message: any, error?: any) {
    this.buildLog('ERROR', message, error?.stack || error);
    this.finish();
  }
}
