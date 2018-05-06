const Koa = require('koa');
const koaBody = require('koa-body');
const logger = require('koa-logger')

const router = require('./app/router');

const app = new Koa();

app.use(logger())
app.use(koaBody());
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3000);