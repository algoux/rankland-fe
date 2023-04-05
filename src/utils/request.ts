import { extend, Context } from 'umi-request';
import { isBrowser } from 'umi';
import { message } from 'antd';

export class ApiException extends Error {
  public code: number;
  public message: string;

  public constructor(code: number, message: string) {
    super(`Request failed with code: ${code}, message: ${message}`);
    this.name = 'ApiException';
    this.code = code;
    this.message = message;
    // @ts-ignore
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class HttpException extends Error {
  public status: number;

  public constructor(status: number, statusText: string) {
    super(`Request error: ${status} ${statusText}`);
    this.name = 'HttpException';
    this.status = status;
    // @ts-ignore
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export let apiRequestAdapter: ReturnType<typeof extend>;
export let cdnApiRequestAdapter: ReturnType<typeof extend>;

export type RequestAdapter = ReturnType<typeof extend>;

// const parseDataInterceptor = async (response: Response) => {
//   const data = await response.clone().json();
//   if (typeof data.code === 'number') {
//     if (data.code === 0) {
//       return data.data;
//     } else {
//       throw new ApiException(data.code, data.message);
//     }
//   }
//   throw new HttpException(response.status, response.statusText);
// };

const parseResponseMiddleware = async (ctx: Context, next: () => void) => {
  const { req } = ctx;
  const { url, options } = req;

  await next();

  const { res } = ctx;
  if (!options.getResponse) {
    let data: any;
    try {
      data = await res.clone().json();
    } catch (e) {
      console.warn('Trying to parse response failed:', e);
    }
    if (typeof data?.code === 'number') {
      if (data.code === 0) {
        ctx.res = data.data;
        return;
      } else {
        throw new ApiException(data.code, data.message);
      }
    }
    throw new HttpException(res.status, res.statusText);
  } else {
    ctx.res = {
      data: res.body,
      response: res,
    };
    if (res.status >= 400) {
      throw new HttpException(res.status, res.statusText);
    }
  }
};

const middlewares: Array<(ctx: Context, next: () => void) => Promise<void>> = [
  parseResponseMiddleware,
];

if (isBrowser()) {
  const clientExceptionMiddleware = async (ctx: Context, next: () => void) => {
    try {
      await next();
    } catch (e) {
      if (e instanceof ApiException) {
        message.error(`${e.message} (code ${e.code})`);
      } else {
        message.error(e.message);
      }
      throw e;
    }
  };
  middlewares.unshift(clientExceptionMiddleware);
  apiRequestAdapter = extend({
    prefix: process.env.API_BASE_CLIENT,
    timeout: 30000,
    parseResponse: false,
  });
  cdnApiRequestAdapter = extend({
    prefix: process.env.CDN_API_BASE_CLIENT,
    timeout: 30000,
    parseResponse: false,
  });
} else {
  apiRequestAdapter = extend({
    prefix: process.env.API_BASE_SERVER,
    timeout: 5000,
    parseResponse: false,
  });
  cdnApiRequestAdapter = extend({
    prefix: process.env.CDN_API_BASE_SERVER,
    timeout: 5000,
    parseResponse: false,
  });
}

middlewares.forEach((middleware) => {
  apiRequestAdapter.use(middleware);
});
middlewares.forEach((middleware) => {
  cdnApiRequestAdapter.use(middleware);
});

export { useRequest as useReq } from 'ahooks';
