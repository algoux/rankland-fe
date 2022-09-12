export enum LogicExceptionKind {
  NotFound = 'NotFound',
}

export class LogicException extends Error {
  public kind: LogicExceptionKind;

  public constructor(kind: LogicExceptionKind) {
    super(`logic exception with kind: ${kind}`);
    this.name = 'LogicException';
    this.kind = kind;
    // @ts-ignore
    Error.captureStackTrace(this, this.constructor);
  }
}
