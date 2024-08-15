const mongoose  = require('mongoose');
const iniParser = require('../libs/iniParser');
var config      = iniParser.get();
var ObjectId    = mongoose.Schema.Types.ObjectId;

const bedahSentralSchema = mongoose.Schema({
    kode                : String,
    nama                : String,
    tarif               : String,
    keterangan          : String,
    tipe_layanan_id     : {
        type    : ObjectId,
        ref     : config.mongodb.db_tipe_layanan,
        required: true
    },
    kategori_operasi_bedah_sentral_id     : {
        type    : ObjectId,
        ref     : config.mongodb.db_kategori_operasi_bedah_sentral,
        required: true
    },
    createdAt           : String,
    updatedAt           : String
}, {
    timestamps: false
});

module.exports = mongoose.model(config.mongodb.db_bedah_sentral, bedahSentralSchema, config.mongodb.db_bedah_sentral);