const mongoose  = require('mongoose');
const iniParser = require('../libs/iniParser');
var ObjectId    = mongoose.Schema.Types.ObjectId;
var config      = iniParser.get();

const jadwalDokterSchema = mongoose.Schema({
    day             : Number,
    open_at         : String,
    close_at        : String,
    dokter_id       : {
        type    : ObjectId,
        ref     : config.mongodb.db_data_dokters,
        required: true
    },
    poliklinik_id   : {
        type    : ObjectId,
        ref     : config.mongodb.db_polyclinics,
        required: true
    },
    createdAt       : String,
    updatedAt       : String
}, {
    timestamps: false
});

module.exports = mongoose.model(config.mongodb.db_jadwal_dokters, jadwalDokterSchema, config.mongodb.db_jadwal_dokters);