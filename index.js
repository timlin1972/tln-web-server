const express = require('express');

const MODULE_NAME = 'web-server';

const DEF_PORT = 3000;
const DEF_LEVEL = 'info';
const DEF_LOGGER = null;
const DEF_PUBLIC_DIR = null;

const DEF_CONFIGS = {
  logger: DEF_LOGGER,
  port: DEF_PORT,
  publicDir: DEF_PUBLIC_DIR,
}

class WebServer {
  constructor(configs=DEF_CONFIGS) {
    this.app = express();
    this.port = configs.port || DEF_PORT;
    this.logger = configs.logger || DEF_LOGGER;
    this.publicDir = configs.publicDir || DEF_PUBLIC_DIR;

    this.httpServer = null;

    if (this.publicDir)  this.app.use(express.static(this.publicDir));

    this.log('info', 'Initialized');
  }

  start = () => new Promise((resolve) => {
      this.httpServer = this.app.listen(this.port, () => {
        this.log('info', `http server is listening at port ${this.port}`);
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

  log = (level=DEF_LEVEL, msg) => 
    this.logger ? 
      this.logger.log(MODULE_NAME, level, msg) :
      console.log(`${level}: [${MODULE_NAME}] ${msg}`);

  toString = () => `[${MODULE_NAME}]\n\
    \tlogger: ${this.logger ? 'yes' : 'no'}\n\
    \tport: ${this.port}\n\
    \tpublicDir: ${this.publicDir}\n\
    `;  
}

module.exports = WebServer;
