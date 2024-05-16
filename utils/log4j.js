const log4js = require('log4js');

const levels = {
  trace: log4js.levels.TRACE, //设置常量
  debug: log4js.levels.DEBUG,
  info: log4js.levels.INFO,
  warn: log4js.levels.WARN,
  error: log4js.levels.ERROR,
  fatal: log4js.levels.FATAL
};

log4js.configure({
  appenders: {
    console: { type: 'console' },
    info: {
      type: 'file', //设置文件保存
      filename: 'logs/all-logs.log' //设置info的文件路径
    },
    error: {
      type: 'dateFile',
      filename: 'logs/log',
      pattern: 'yyyy-MM-dd.log',
      alwaysIncludePattern: true // 设置文件名称是 filename + pattern
    }
  },
  categories: {
    default: { appenders: ['console'], level: 'debug' },
    info: {
      appenders: ['info', 'console'],
      level: 'info'
    },
    error: {
      appenders: ['console', 'error'],
      level: 'error'
    }
  }
});

/**
 * 日志输出 level为debug
 */

exports.debug = content => {
  let logger = log4js.getLogger('debug');
  logger.level = levels.debug;
  logger.debug(content);
};

/**
 * 日志输出 level为info
 */

exports.info = content => {
  let logger = log4js.getLogger('info'); //这里需要传入上面定义的配置
  logger.level = levels.info;
  logger.info(content);
};

/**
 * 日志输出 level为error
 */

exports.error = content => {
  let logger = log4js.getLogger('error');
  logger.level = levels.error;
  logger.error(content);
};
