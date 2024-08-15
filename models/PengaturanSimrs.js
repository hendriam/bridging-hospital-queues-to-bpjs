const mongoose  = require('mongoose');
const iniParser = require('../libs/iniParser');
var config      = iniParser.get();
var ObjectId    = mongoose.Schema.Types.ObjectId;

const pengaturanSimrsSchema = mongoose.Schema({
    nama        : String,
    keterangan  : String,
    alamat      : String,
    no_telp     : String,
    motto       : String,
    visi        : String,
    misi        : String,
    mulai_no_rm : String,
    waktu_kamar : String,
}, {
    timestamps: false
});

module.exports = mongoose.model(config.mongodb.db_pengaturan_simrs, pengaturanSimrsSchema, config.mongodb.db_pengaturan_simrs);