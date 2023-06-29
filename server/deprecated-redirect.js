/* eslint-disable @typescript-eslint/no-require-imports */
const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const winston = require('winston');
const dayjs = require('dayjs');
const { v4: uuidv4 } = require('uuid');

const port = parseInt(process.env.PORT, 10) || 7002;

const NEW_HOST = 'https://rl.algoux.cn';

const knownUrlKeywordToGeneralReplacementMap = {
  当前选中榜单的标识符: 'rankId',
  由官方整理和维护的: 'official',
  榜单合集: 'collection',
  探索: 'search',
  榜单: 'ranklist',
  游乐场: 'playground',
  直播: 'live',
  关键词: 'kw',
  聚焦: 'focus',
  是: 'yes',
};

const convertUrl = (url) => {
  let newUrl = url;
  Object.keys(knownUrlKeywordToGeneralReplacementMap).forEach((key) => {
    newUrl = newUrl.replace(key, knownUrlKeywordToGeneralReplacementMap[key]);
  });
  return newUrl;
};

// app logger
const appLoggingFormat = winston.format.printf(({ level, message, timestamp }) => {
  return `${dayjs(timestamp).format('YYYY-MM-DDTHH:mm:ssZ')} [${level}] ${message}`;
});
const appLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.splat(), winston.format.timestamp(), appLoggingFormat),
  transports: [
    new winston.transports.File({ filename: 'logs/app-redirect-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/app-redirect-all.log' }),
    new winston.transports.Console(),
  ],
});

// koa app
const app = new Koa();
app.proxy = true;

// request id middleware
app.use(async (ctx, next) => {
  ctx.requestId = uuidv4().substr(0, 8);
  ctx.set('X-Request-Id', ctx.requestId);
  return next();
});

// time cost middleware
app.use(async (ctx, next) => {
  const _s = Date.now();
  ctx.startAt = _s;
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

// ctx logger middleware
app.use((ctx, next) => {
  if (!ctx.logger) {
    const ctxLoggingFormat = winston.format.printf(({ level, message, timestamp }) => {
      return `${dayjs(timestamp).format('YYYY-MM-DDTHH:mm:ssZ')} [${level}] [${process.pid}] [${ctx.requestId}] [${
        ctx.ip
      }/${Date.now() - ctx.startAt}ms ${ctx.method.toUpperCase()} ${ctx.url}] ${message}`;
    });
    ctx.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(winston.format.splat(), winston.format.timestamp(), ctxLoggingFormat),
      transports: [
        new winston.transports.File({ filename: 'logs/ctx-redirect-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/ctx-redirect-all.log' }),
        new winston.transports.Console(),
      ],
    });
  }
  return next();
});

const router = new Router();

router.get('*', (ctx, next) => {
  const newQuery = {};
  Object.keys(ctx.query).forEach((key) => {
    const k = knownUrlKeywordToGeneralReplacementMap[key] || key;
    newQuery[k] = ctx.query[key];
  });
  const search = new URLSearchParams(newQuery).toString();
  const newUrl = `${convertUrl(decodeURIComponent(ctx.path))}${search ? `?${search}` : ''}`;
  const nextUrl = `${NEW_HOST}${newUrl}`;
  ctx.logger.info('Redirecting to %s', nextUrl);
  ctx.redirect(nextUrl);
});

app.use(router.routes()).use(router.allowedMethods());

async function main() {
  app.listen(port);
  console.log(`Redirection Server is listening on http://localhost:${port} (pid: ${process.pid})`);
}

main();
