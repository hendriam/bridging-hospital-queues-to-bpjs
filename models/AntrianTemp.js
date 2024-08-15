const mongoose  = require('mongoose');
const iniParser = require('../libs/iniParser');
var ObjectId    = mongoose.Schema.Types.ObjectId;
var config      = iniParser.get();

const antrianTempSchema = mongoose.Schema({
    hurufantrean    : String,
    nomorantrean    : String,
    angkaantrean    : Number,
    status          : String,
    tanggalantrean  : String,
    jenisantrean    : String,
    loket_id   : {
        type    : ObjectId,
        ref     : config.mongodb.db_loket,
        required: false
    },
    loket_farmasi_id   : {
        type    : ObjectId,
        ref     : config.mongodb.db_farmasi,
        required: false
    },
    status_display  : Boolean,
    kefarmasi       : Boolean,
    kodebooking     : String,
    createdAt       : String,
    updatedAt       : String,
    
}, {
    timestamps: false
});

module.exports = mongoose.model(config.mongodb.db_antrian_temp, antrianTempSchema, config.mongodb.db_antrian_temp);