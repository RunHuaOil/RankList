const Koa = require('koa');
const koaBody = require('koa-body');
const logger = require('koa-logger');
const serve = require('koa-static');
const Redis = require('ioredis');
const moment = require('moment-timezone');

const router = require('./app/router');

const app = new Koa();

app.proxy = true;
app.redis = new Redis(`redis://:${process.env.redisPass}@127.0.0.1:6379/0`);
app.use(koaBody({
    strict: false
}));
app.use(logger());
app.use(serve('/home/lizhaoji'));
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3000);

setInterval(async () => {
    let time = moment.tz("Asia/Shanghai");
    let day = time.format('dddd');
    if (day === 'Sunday') {
        await app.redis.del('rank:score')
    }
}, 1000 * 60 * 60 * 23);