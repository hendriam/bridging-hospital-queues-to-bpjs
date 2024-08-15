const mongoose  = require('mongoose');
const iniParser = require('../libs/iniParser');
var config      = iniParser.get();
var ObjectId    = mongoose.Schema.Types.ObjectId;

const antrianOperasiSchema = mongoose.Schema({
    kode_booking        : String,
    tanggal_operasi     : String,
    jenis_tindakan      : String,
    kode_poli           : String,
    nama_poli           : String,
    terlaksana          : String,
    no_peserta          : String,
    status              : String,
    keterangan          : String,
    waktu_dilayani      : String,
    waktu_selesai       : String,
    bedah_sentral_id    : {
        type    : ObjectId,
        ref     : config.mongodb.db_bedah_sentral,
        required: true
    },
    createdAt           : String,
    updatedAt           : String
}, {
    timestamps: false
});

module.exports = mongoose.model(config.mongodb.db_antrian_operasi, antrianOperasiSchema, config.mongodb.db_antrian_operasi);