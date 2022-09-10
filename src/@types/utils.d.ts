type Awaited<T> = T extends PromiseLike<infer U> ? U : T;
type Newable<T = any> = new (...args: any) => T;
