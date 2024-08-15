const mongoose  = require('mongoose');
const iniParser = require('../libs/iniParser');
var config      = iniParser.get();

const loketSchema = mongoose.Schema({
    nama            : String,
    status          : Number,
}, {
    timestamps: false
});

module.exports = mongoose.model(config.mongodb.db_loket, loketSchema, config.mongodb.db_loket);