const mongoose  = require('mongoose');
const iniParser = require('../libs/iniParser');
var config      = iniParser.get();

const tipeLayananSchema = mongoose.Schema({
    name            : String,
    description     : String,
    createdAt       : String,
    updatedAt       : String
}, {
    timestamps: false
});

module.exports = mongoose.model(config.mongodb.db_tipe_layanan, tipeLayananSchema, config.mongodb.db_tipe_layanan);