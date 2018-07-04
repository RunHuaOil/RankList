const Joi = require('joi');

const key = 'lizhaoji';
const setKey = 'rank:score';

async function addScore(ctx) {
    const schema = Joi.object().keys({
        key: Joi.string().token().min(1).required(),
        name: Joi.string().min(1).max(16).required(),
        score: Joi.number().positive().integer().min(1).required()
    });

    let validateObj = ctx.request.body || {};
    const {error, value} = Joi.validate(validateObj, schema);
    if (error) return ctx.response.body = {code: 0, msg: error.toString()};
    if (value.key !== key) return ctx.response.body = {code: -1, msg: 'key error'};

    let index = await ctx.app.redis.zrank(setKey, value.name);
    if (index !== null) return ctx.response.body = {code: -2, msg: 'name existed'};

    let [result, rankList] = await Promise.all([
        ctx.app.redis.zadd(setKey, value.score, value.name),
        ctx.app.redis.zrevrange(setKey, 100, -1)
    ]);

    if (rankList.length !== 0) ctx.app.redis.zrem(setKey, rankList);

    ctx.response.body = {code: 1, msg: 'success to add score'}
}

async function getRank(ctx) {
    const schema = Joi.object().keys({
        key: Joi.string().token().min(1).required(),
    });
    const {error, value} = Joi.validate(ctx.query, schema);
    if (error) return ctx.response.body = {code: 0, msg: error.toString()};
    if (value.key !== key) return ctx.response.body = {code: -1, msg: 'key error'};

    let rankList = await ctx.app.redis.zrevrange(setKey, 0, 99, 'WITHSCORES');

    let dataList = [];
    while (rankList.length !== 0) {
        let name = rankList.shift();
        let score = rankList.shift();
        dataList.push({name, score});
    }
    ctx.response.body = {code: 1, msg: 'success to get rankList', data: dataList}
}


async function delScoreByName(ctx) {
    const schema = Joi.object().keys({
        key: Joi.string().token().min(1).required(),
        name: Joi.string().min(1).max(16).required(),
    });
    const {error, value} = Joi.validate(ctx.query, schema);
    if (error) return ctx.response.body = {code: 0, msg: error.toString()};
    if (value.key !== key) return ctx.response.body = {code: -1, msg: 'key error'};

    let res = await ctx.app.redis.zrem(setKey, value.name);
    if (!res) return ctx.response.body = {code: -5, msg: '删除失败,名字或不存在'};
    return ctx.response.body = {code: 1, msg: `success to del ${value.name} score`}
}


async function delRankList(ctx) {
    const schema = Joi.object().keys({
        key: Joi.string().token().min(1).required(),
    });
    const {error, value} = Joi.validate(ctx.query, schema);
    if (error) return ctx.response.body = {code: 0, msg: error.toString()};
    if (value.key !== key) return ctx.response.body = {code: -1, msg: 'key error'};

    let res = await ctx.app.redis.del(setKey);
    if (!res) return ctx.response.body = {code: -5, msg: '删除失败'};
    return ctx.response.body = {code: 1, msg: `success to del rank`}
}


module.exports = {
    addScore,
    getRank,
    delScoreByName,
    delRankList
};