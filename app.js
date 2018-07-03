const Koa = require('koa');
const koaBody = require('koa-body');
const logger = require('koa-logger');
const serve = require('koa-static');
const Redis = require('ioredis');

const router = require('./app/router');

const app = new Koa();

app.redis = new Redis();
app.use(koaBody({
    strict: false
}));
app.use(logger());
app.use(serve('/home/lizhaoji'));
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3000);