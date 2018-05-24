const Koa = require('koa');
const koaBody = require('koa-body');
const logger = require('koa-logger');
const serve = require('koa-static');

const router = require('./app/router');

const app = new Koa();

app.use(koaBody());
app.use(logger());
app.use(serve('/home/lizhaoji'));
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3000);