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
const { createClient } = require('redis');
const util = require('util');

const isProd = process.env.NODE_ENV === 'production';
const port = parseInt(process.env.PORT, 10) || 7001;
const root = path.join(__dirname, '../dist');
let render;
let indexHtmlTemplate;

// app logger
const appLoggingFormat = winston.format.printf(({ level, message, timestamp }) => {
  return `${dayjs(timestamp).format('YYYY-MM-DDTHH:mm:ssZ')} [${level}] ${message}`;
});
const appLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.splat(), winston.format.timestamp(), appLoggingFormat),
  transports: [
    new winston.transports.File({ filename: 'logs/app-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/app-all.log' }),
    new winston.transports.Console(),
  ],
});

// redis client
const redisClient = createClient({
  password: process.env.REDIS_PASS || null,
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
});
redisClient.on('error', (err) => appLogger.error('Redis client error: %O', err));

// koa app
const app = new Koa();

// request id middleware
app.use(async (ctx, next) => {
  ctx.requestId = uuidv4().substr(0, 8);
  ctx.set('X-Request-Id', ctx.requestId);
  return next();
});

// time cost middleware
app.use(async (ctx, next) => {
  const _s = Date.now();
  await next();
  ctx.set('X-Response-Time', Date.now() - _s);
});

// error handler middleware
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (e) {
    ctx.logger.error('Uncaught error: %O', e);
    ctx.throw(500, 'Internal Server Error');
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

// ctx logger middleware
app.use((ctx, next) => {
  if (!ctx.logger) {
    const ctxLoggingFormat = winston.format.printf(({ level, message, timestamp }) => {
      return `${dayjs(timestamp).format('YYYY-MM-DDTHH:mm:ssZ')} [${level}] [${
        ctx.requestId
      } ${ctx.method.toUpperCase()} ${ctx.url}] ${message}`;
    });
    ctx.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(winston.format.splat(), winston.format.timestamp(), ctxLoggingFormat),
      transports: [
        new winston.transports.File({ filename: 'logs/ctx-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/ctx-all.log' }),
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

function getSSRCacheKey(url) {
  return util.format('rankland_node_ssr_cache_%s', url);
}

app.use(async (ctx, next) => {
  const ext = path.extname(ctx.path);
  // 符合要求的路由才进行服务端渲染，否则走静态文件逻辑
  if (!ext) {
    if (!render) {
      render = require(path.join(root, 'umi.server'));
    }
    const _s = Date.now();
    // 这里默认是字符串渲染
    ctx.type = 'text/html';
    ctx.status = 200;
    let html;
    const cacheKey = getSSRCacheKey(ctx.url);
    try {
      const cached = await redisClient.get(cacheKey);
      if (typeof cached === 'string' && cached.startsWith('<!DOCTYPE html>')) {
        html = cached;
        const ssrCost = Date.now() - _s;
        ctx.set('X-SSR-Success', 'true');
        ctx.set('X-SSR-Time', ssrCost);
        ctx.logger.info(`SSR in %d ms (with cache)`, ssrCost);
      } else {
        const renderRes = await render({
          path: ctx.url,
        });
        if (renderRes.error) {
          throw renderRes.error;
        } else {
          html = renderRes.html;
          const ssrCost = Date.now() - _s;
          ctx.set('X-SSR-Success', 'true');
          ctx.set('X-SSR-Time', ssrCost);
          ctx.logger.info(`SSR in %d ms`, ssrCost);
        }
        redisClient.setEx(cacheKey, 60, html);
      }
    } catch (e) {
      ctx.logger.error(`SSR error: %O`, e);
      if (isProd) {
        html = indexHtmlTemplate;
      } else {
        html = await request.get('http://localhost:8000');
      }
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

async function main() {
  if (isProd) {
    indexHtmlTemplate = fs.readFileSync(path.join(root, 'index.html'), 'utf-8');
  }
  await redisClient.connect();
  app.listen(port);
  console.log(`SSR Server is listening on http://localhost:${port} (pid: ${process.pid})`);
}

main();
