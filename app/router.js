const Router = require('koa-router');
const rank = require('./controller/rank');
const version = require('./controller/version');

let router = new Router();
 
router.get('/api/rank', rank.getRank);
router.post('/api/score', rank.addScore);

router.post('/api/admin/version', version.updateVersion);
router.delete('/api/admin/version', version.delVersion);
router.get('/api/latestVersion', version.getLatestVersion);

module.exports = router;