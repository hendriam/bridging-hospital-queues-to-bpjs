const mongoose  = require('mongoose');
const iniParser = require('../libs/iniParser');
var config      = iniParser.get();

const farmasiSchema = mongoose.Schema({
    nama            : String,
    status          : Number,
}, {
    timestamps: false
});

module.exports = mongoose.model(config.mongodb.db_farmasi, farmasiSchema, config.mongodb.db_farmasi);