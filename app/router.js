const Router = require('koa-router');
const rank = require('./controller/rank');

let router = new Router();
 
router.get('/api/rank', rank.getRank);
router.post('/api/score', rank.addScore);

module.exports = router;