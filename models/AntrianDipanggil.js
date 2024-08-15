const mongoose  = require('mongoose');
const iniParser = require('../libs/iniParser');
var ObjectId    = mongoose.Schema.Types.ObjectId;
var config      = iniParser.get();

const antrianDipanggilSchema = mongoose.Schema({
    antrian_id   : {
        type    : ObjectId,
        ref     : config.mongodb.db_antrian_temp,
        required: false
    },
    jenisantrean    : String,
    lorong          : String,
    tanggalantrean  : String,
    createdAt       : String,
    updatedAt       : String,
    
}, {
    timestamps: false
});

module.exports = mongoose.model(config.mongodb.db_antrian_dipanggil, antrianDipanggilSchema, config.mongodb.db_antrian_dipanggil);