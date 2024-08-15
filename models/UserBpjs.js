const mongoose  = require('mongoose');
const iniParser = require('../libs/iniParser');
var config      = iniParser.get();

const bahasaSchema = mongoose.Schema({
    username    : String,
    password    : String,
    last_login  : String,
    createdAt   : String,
    updatedAt   : String
}, {
    timestamps: false
});

module.exports = mongoose.model(config.mongodb.db_user_bpjs, bahasaSchema, config.mongodb.db_user_bpjs);