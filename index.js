const express = require('express');

const MODULE_NAME = 'web-server';

const DEF_PORT = 3000;
const DEF_LEVEL = 'info';
const DEF_LOGGER = null;
const DEF_PUBLIC_DIR = null;
const DEF_I18N = null;

const DEF_CONFIGS = {
  logger: DEF_LOGGER,
  port: DEF_PORT,
  publicDir: DEF_PUBLIC_DIR,
  i18n: DEF_I18N,
}

class WebServer {
  constructor(configs=DEF_CONFIGS) {
    this.app = express();
    this.port = configs.port || DEF_PORT;
    this.logger = configs.logger || DEF_LOGGER;
    this.publicDir = configs.publicDir || DEF_PUBLIC_DIR;
    this.i18n = configs.i18n || DEF_I18N;

    this.httpServer = null;

    if (this.publicDir)  this.app.use(express.static(this.publicDir));

    this.log('info', 'Initialized');
  }

  start = () => new Promise((resolve) => {
      this.httpServer = this.app.listen(this.port, () => {
        const msgListeningI18n = this.i18n 
            ? this.i18n.t('http server is listening at port') 
            : 'http server is listening at port';

        this.log('info', `${msgListeningI18n} ${this.port}`);
        resolve(null);
        return;
      });
    });

  stop = () => new Promise((resolve) => {
      this.httpServer.close(() => {
        this.log('warn', 'http server is closed');
        resolve(null);
      })
    });

  getApp = () => this.app;

  log = (level=DEF_LEVEL, msg) => {
    const msgI18n = this.i18n ? this.i18n.t(msg) : msg;
    this.logger ? 
      this.logger.log(MODULE_NAME, level, msgI18n) :
      console.log(`${level}: [${MODULE_NAME}] ${msgI18n}`);
  }

  toString = () => `[${MODULE_NAME}]\n\
    \tlogger: ${this.logger ? 'yes' : 'no'}\n\
    \tport: ${this.port}\n\
    \tpublicDir: ${this.publicDir}\n\
    `;  
}

module.exports = WebServer;
