/* eslint-disable @typescript-eslint/no-require-imports */
const Koa = require('koa');
const compress = require('koa-compress');
const mount = require('koa-mount');
const bodyParser = require('koa-bodyparser');
const path = require('path');
const fs = require('fs');
const proxy = require('koa2-proxy-middleware');
const request = require('request-promise');
const winston = require('winston');
const dayjs = require('dayjs');
const { v4: uuidv4 } = require('uuid');

const isProd = process.env.NODE_ENV === 'production';

const root = path.join(__dirname, 'dist');
let indexHtmlTemplate;

const app = new Koa();

// request id
app.use(async (ctx, next) => {
  ctx.requestId = uuidv4().substr(0, 8);
  ctx.set('X-Request-Id', ctx.requestId);
  return next();
});

// time cost
app.use(async (ctx, next) => {
  const _s = Date.now();
  await next();
  ctx.set('X-Response-Time', Date.now() - _s);
});

// error handler
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (e) {
    ctx.logger.error('Uncaught error: %O', e);
  }
});

app.use(bodyParser());
app.use(
  compress({
    threshold: 2048,
    gzip: {
      flush: require('zlib').constants.Z_SYNC_FLUSH,
    },
    deflate: {
      flush: require('zlib').constants.Z_SYNC_FLUSH,
    },
    br: false, // 禁用br解决https gzip不生效加载缓慢问题
  }),
);

// ctx logger
app.use((ctx, next) => {
  if (!ctx.logger) {
    const ctxLoggingFormat = winston.format.printf(({ level, message, timestamp }) => {
      return `${dayjs(timestamp).format('YYYY-MM-DDTHH:mm:ssZ')} [${level}] [${ctx.requestId} ${ctx.method.toUpperCase()} ${
        ctx.url
      }] ${message}`;
    });
    ctx.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(winston.format.splat(), winston.format.timestamp(), ctxLoggingFormat),
      transports: [
        //
        // - Write all logs with importance level of `error` or less to `error.log`
        // - Write all logs with importance level of `info` or less to `combined.log`
        //
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console(),
      ],
    });
  }
  return next();
});

if (!isProd) {
  app.use(
    proxy({
      targets: {
        '/dist/(.*)': {
          target: 'http://localhost:8000/',
          changeOrigin: true,
        },
      },
    }),
  );
}

let render;
app.use(async (ctx, next) => {
  const ext = path.extname(ctx.path);
  // 符合要求的路由才进行服务端渲染，否则走静态文件逻辑
  if (!ext) {
    if (!render) {
      render = require('./dist/umi.server');
    }
    const _s = Date.now();
    // 这里默认是字符串渲染
    ctx.type = 'text/html';
    ctx.status = 200;
    let html;
    const renderRes = await render({
      path: ctx.url,
    });
    if (renderRes.error) {
      ctx.logger.error(`SSR error: %O`, renderRes.error);
      if (isProd) {
        if (!indexHtmlTemplate) {
          indexHtmlTemplate = fs.readFileSync(path.join(root, 'index.html'), 'utf-8');
        }
        html = indexHtmlTemplate;
      } else {
        html = await request.get('http://localhost:8000');
      }
    } else {
      html = renderRes.html;
      const ssrCost = Date.now() - _s;
      ctx.set('X-SSR-Success', 'true');
      ctx.set('X-SSR-Time', ssrCost);
      ctx.logger.info(`SSR in %d ms`, ssrCost);
    }
    ctx.body = html;
  } else {
    await next();
  }
});

/**
 * 注意这里的静态目录设置，需要和umi打包出来的目录是同一个
 * 这里最好是用nginx配置静态目录，如果是用cdn方式部署，这里可以忽略
 */
isProd && app.use(mount('/dist', require('koa-static')(root)));

app.listen(7001);
console.log(`SSR Server is listening on http://localhost:7001 (pid: ${process.pid})`);

// module.exports = app.callback();
