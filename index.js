const express = require('express');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');

const MODULE_NAME = 'web-server';

const STR_HTTP_LISTEN = 'http server is listening at port';
const STR_HTTPS_LISTEN = 'https server is listening at port';

const DEF_HTTP_PORT = 3000;
const DEF_HTTPS_PORT = 3001;
const DEF_FORCE_HTTPS = true;
const DEF_LEVEL = 'info';
const DEF_LOGGER = null;
const DEF_PUBLIC_DIR = null;
const DEF_I18N = null;
const DEF_KEY = fs.readFileSync(path.join(__dirname, '..', 'lib/credentials/key.pem'), 'utf8');
const DEF_CERT = fs.readFileSync(path.join(__dirname, '..', 'lib/credentials/cert.pem'), 'utf8');

const DEF_CONFIGS = {
  logger: DEF_LOGGER,
  httpPort: DEF_HTTP_PORT,
  httpsPort: DEF_HTTPS_PORT,
  forceHttps: DEF_FORCE_HTTPS,
  publicDir: DEF_PUBLIC_DIR,
  i18n: DEF_I18N,
  key: DEF_KEY,
  cert: DEF_CERT,
}

const httpsRedirect = (httpsPort) => (
  (req, res, next) => {
    if (!req.secure) {
      const incomingUrl = `http://${req.headers.host}${req.url}`;
      const incomingHostname = url.parse(incomingUrl).hostname;
      const httpsUrl = `https://${incomingHostname}:${httpsPort}${req.url}`;
      res.redirect(httpsUrl);
    } else {
      next();
    }
  }
);

class WebServer {
  constructor(configs=DEF_CONFIGS) {
    this.app = express();
    this.httpPort = configs.httpPort || DEF_HTTP_PORT;
    this.httpsPort = configs.httpsPort || DEF_HTTPS_PORT;
    this.forceHttps = configs.forceHttps || DEF_FORCE_HTTPS;
    this.logger = configs.logger || DEF_LOGGER;
    this.publicDir = configs.publicDir || DEF_PUBLIC_DIR;
    this.i18n = configs.i18n || DEF_I18N;
    this.key = configs.key || DEF_KEY;
    this.cert = configs.cert || DEF_CERT;

    this.httpServer = null;
    this.httpsServer = null;

    if (this.forceHttps)  this.app.use(httpsRedirect(this.httpsPort));
    if (this.publicDir)   this.app.use(express.static(this.publicDir));

    this.app.use((_, res) => res.redirect('/'));

    this.log('info', 'Initialized');
  }

  start = () => new Promise((resolve) => {
    const setHttpsServer = () => {
      const { app, key, cert, httpsPort } = this;
      
      this.httpsServer = https.createServer({ key, cert }, app).listen(httpsPort, () => {
        const msgListeningI18n = this.i18n ? this.i18n.t(STR_HTTPS_LISTEN) : STR_HTTPS_LISTEN;
        this.log('info', `${msgListeningI18n} ${this.httpsPort}`);

        return resolve(null);
      });
    };

    this.httpServer = this.app.listen(this.httpPort, () => {
      const msgListeningI18n = this.i18n ? this.i18n.t(STR_HTTP_LISTEN) : STR_HTTP_LISTEN;
      this.log('info', `${msgListeningI18n} ${this.httpPort}`);

      return setHttpsServer();
    });
  });

  stop = () => new Promise((resolve) => {
    this.httpServer.close(() => {
      this.log('warn', 'http server is closed');
      resolve(null);
    })
  });

  getApp = () => this.app;
  getHttpServer = () => this.httpServer;
  getHttpsServer = () => this.httpsServer;

  log = (level=DEF_LEVEL, msg) => {
    const msgI18n = this.i18n ? this.i18n.t(msg) : msg;
    this.logger ? 
      this.logger.log(MODULE_NAME, level, msgI18n) :
      console.log(`${level}: [${MODULE_NAME}] ${msgI18n}`);
  }

  toString = () => `[${MODULE_NAME}]\n\
    \tlogger: ${this.logger ? 'yes' : 'no'}\n\
    \thttpPort: ${this.httpPort}\n\
    \thttpsPort: ${this.httpsPort}\n\
    \tforceHttps: ${this.forceHttps}\n\
    \tpublicDir: ${this.publicDir}\n\
    `;  
}

module.exports = WebServer;
