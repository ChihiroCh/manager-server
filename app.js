const Koa = require('koa');
const app = new Koa();
const views = require('koa-views');
const json = require('koa-json');
const onerror = require('koa-onerror');
const bodyparser = require('koa-bodyparser');
const logger = require('koa-logger');
const router = require('koa-router')();
const jwt = require('jsonwebtoken');
const koajwt = require('koa-jwt');

const users = require('./routes/users');
const menus = require('./routes/menus');
const roles = require('./routes/roles');
const dept = require('./routes/dept');
const leaves = require('./routes/leaves');

require('./config/db');
// error handler
onerror(app);

// middlewares
app.use(
  bodyparser({
    enableTypes: ['json', 'form', 'text']
  })
);
app.use(json());
app.use(logger());
app.use(require('koa-static')(__dirname + '/public'));

app.use(
  views(__dirname + '/views', {
    extension: 'pug'
  })
);

// logger
app.use(async (ctx, next) => {
  const start = new Date();
  await next();
  const ms = new Date() - start;
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
});
app.use(
  koajwt({ secret: 'chihiro' }).unless({
    path: [/^\/api\/users\/login/]
  })
);

router.prefix('/api');
// routes
router.use(users.routes(), users.allowedMethods());
router.use(menus.routes(), menus.allowedMethods());
router.use(roles.routes(), roles.allowedMethods());
router.use(dept.routes(), dept.allowedMethods());
router.use(leaves.routes(), leaves.allowedMethods());
app.use(router.routes(), router.allowedMethods());

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx);
});

module.exports = app;
