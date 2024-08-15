const express   = require('express'),
    app         = express(),
    port        = process.env.PORT || 7067,
    bodyParser  = require('body-parser');

const https         = require('https');
const http         = require('http');
const fs            = require('fs');
const key    = fs.readFileSync('./ssl/rsumitrasejati.key', 'utf-8');
const cert   = fs.readFileSync('./ssl/rsumitrasejati.crt', 'utf-8');
const ca = fs.readFileSync('./ssl/rsumitrasejati.ca-bundle', 'utf-8');

const credentials   = {
    key: key,
    cert: cert,
    ca: ca
};

const logging   = require('./libs/logging');
const iniParser = require('./libs/iniParser');
const args      = require('minimist')(process.argv.slice(2));
const cors      = require('cors');
require('custom-env').env(true);

process.env.TZ = 'Asia/Jakarta';

let config = {
    log: {
        path: "var/log/",
        level: "debug"
    }
};

if (args.h || args.help) {
    // TODO: print USAGE
    console.log("Usage: node " + __filename + " --config");
    process.exit(-1);
}

configFile = args.c || args.config || './configs/config.ini';
config = iniParser.init(config, configFile, args);
config.log.level = args.logLevel || config.log.level;

// Initialize logging
logging.init({
    path: config.log.path,
    level: config.log.level
});

const dbConfig = require('./configs/database.js');
const mongoose = require('mongoose');
mongoose.set('useUnifiedTopology', true);

mongoose.Promise = global.Promise;

// Connecting to the database
mongoose.connect(dbConfig.url, {
    useNewUrlParser: true
}).then(() => {
    logging.debug(`[MongoDB] Successfully connected to the database`);
}).catch(err => {
    logging.error(`[MongoDB] Could not connect to the database. Exiting now... ${err}`);
    process.exit();
});

app.use(cors());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-access-token");
    res.header('Access-Control-Allow-Methods', "GET,PUT,POST,DELETE,PATCH,OPTIONS");
    res.sendError = (response, dataSet = []) => {
        return response.status(500).json({
            status  : false,
            message : dataSet[0].msg,
            data    : null
        });
    };
    next();
});

var routes = require('./routes/route');
routes(app);

// https.createServer(credentials, app).listen(port);
app.listen(port);

logging.info(`[BRIDGING_ANTRIAN_BPJS] READY => PORT ${JSON.stringify(port)}`);
