const Joi = require('joi');
const moment = require('moment-timezone');

const key = 'lizhaoji';
const gameKey = 'game:version';

async function updateVersion(ctx) {
    const schema = Joi.object().keys({
        key: Joi.string().token().min(1).required(),
        gameName: Joi.string().min(1).max(20).required(),
        sVersion: Joi.string().min(1).max(16).required(),
        nVersion: Joi.number().positive().integer().min(1).required(),
        url: Joi.string().uri().required(),
        intro: Joi.string().min(1).max(200).required(),
        isForce: Joi.boolean().required()
    });

    let validateObj = ctx.request.body || {};
    const {error, value} = Joi.validate(validateObj, schema);
    if (error) return ctx.response.body = {code: 0, msg: error.toString()};
    if (value.key !== key) return ctx.response.body = {code: -1, msg: 'key error'};
    delete value.key;

    let isExists = await ctx.app.redis.hexists(gameKey, value.gameName);
    if (isExists) {
        let result = await ctx.app.redis.hget(gameKey, value.gameName);
        let dataList = JSON.parse(result);
        let latestVersion = dataList[dataList.length - 1];
        if (value.nVersion > latestVersion.nVersion) {
            dataList.push(value);
            await ctx.app.redis.hset(gameKey, value.gameName, JSON.stringify(dataList));
        } else {
            return ctx.response.body = {code: -3, msg: 'nVersion less than latest version'}
        }
    } else {
        await ctx.app.redis.hset(gameKey, value.gameName, JSON.stringify([value]));
    }

    return ctx.response.body = {code: 1, msg: 'success to update version'}
}

async function delVersion(ctx) {
    const schema = Joi.object().keys({
        key: Joi.string().token().min(1).required(),
        gameName: Joi.string().min(1).max(20).required(),
        nVersion: Joi.number().positive().integer().min(1).required(),
    });
    const {error, value} = Joi.validate(ctx.request.body, schema);
    if (error) return ctx.response.body = {code: 0, msg: error.toString()};
    if (value.key !== key) return ctx.response.body = {code: -1, msg: 'key error'};

    let result = await ctx.app.redis.hget(gameKey, value.gameName);
    let dataList = JSON.parse(result);

    let newDataList = [];
    for (let item of dataList) {
        if (value.nVersion !== item.nVersion) newDataList.push(item);
    }

    if (newDataList.length > 0) {
        if (newDataList.length !== dataList.length) {
            await ctx.app.redis.hset(gameKey, value.gameName, JSON.stringify(newDataList));
        }
    } else {
        await ctx.app.redis.hdel(gameKey, value.gameName);
    }
    return ctx.response.body = {code: 1, msg: `success to del ${value.nVersion} version`}
}


async function getLatestVersion(ctx) {
    const schema = Joi.object().keys({
        key: Joi.string().token().min(1).required(),
        gameName: Joi.string().min(1).max(20).required(),
    });
    const {error, value} = Joi.validate(ctx.query, schema);
    if (error) return ctx.response.body = {code: 0, msg: error.toString()};
    if (value.key !== key) return ctx.response.body = {code: -1, msg: 'key error'};

    let result = await ctx.app.redis.hget(gameKey, value.gameName);

    let dataList = null;
    if (result) {
        dataList = JSON.parse(result);
    } else {
        return ctx.response.body = {code: -4, msg: `${value.gameName} is no exists`}
    }

    let newTime = moment.tz("Asia/Shanghai");
    let date = newTime.format('YYYY-MM-DD');
    let dateDetail = newTime.format('YYYY-MM-DD H:mm');
    await Promise.all([
        ctx.app.redis.hset(`${value.gameName}:dailyVisit:${date}`,
            ctx.request.ip, dateDetail),    // 记录每日访问数
        ctx.app.redis.sadd(value.gameName + ':allVisit',
            ctx.request.ip),    // 记录ip访问了一次
    ]);

    return ctx.response.body = {code: 1, msg: 'success to get latestVersion', data: dataList.pop()}
}


async function getVisitData(ctx) {
    const schema = Joi.object().keys({
        key: Joi.string().token().min(1).required(),
        gameName: Joi.string().min(1).max(20).required(),
    });
    const {error, value} = Joi.validate(ctx.query, schema);
    if (error) return ctx.response.body = {code: 0, msg: error.toString()};
    if (value.key !== key) return ctx.response.body = {code: -1, msg: 'key error'};

    let allVisits = await ctx.app.redis.scard(value.gameName + ':allVisit');

    let keys = await ctx.app.redis.keys(value.gameName + ':dailyVisit:*');

    let DailyVisits = {};
    for (let key of keys) {
        DailyVisits[key] = {};
        DailyVisits[key].count = (await ctx.app.redis.hlen(key));
        DailyVisits[key].row = (await ctx.app.redis.hgetall(key));
    }
    return ctx.response.body = {
        code: 1, msg: 'success to get visit data', data: {
            allVisits, DailyVisits
        }
    }
}


module.exports = {
    getLatestVersion,
    delVersion,
    updateVersion,
    getVisitData,
};