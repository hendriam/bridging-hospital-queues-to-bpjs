const mongoose  = require('mongoose');
const iniParser = require('../libs/iniParser');
var config      = iniParser.get();

const masterPasienSchema = mongoose.Schema({
    no_rm           : String,
    no_identitas    : String,
    nomorkk         : String,
    nama_pasien     : String,
    jenkel          : String,
    gol_darah       : String,
    tempat_lahir    : String,
    tgl_lahir       : String,
    umur            : String,
    no_telp         : String,
    no_hp           : String,
    alamat          : String,
    kota            : String,
    kecamatan       : String,
    kelurahan       : String,
    rt_rw           : String,
    domisili        : String,
    agama           : String,
    pendidikan      : String,
    pekerjaan       : String,
    status_kawin    : String,
    catatan         : String,
    nama_wali       : String,
    alamat_wali     : String,
    hubungan_wali   : String,
    status          : String,
    berat_badan     : String,
    suku            : String,
    bahasa          : String,
    warga_negara    : String,
    negara          : String,
    provinsi        : String,
    ras             : String,
    kewarganegaraan : String,
    no_bpjs         : String,
    pasienbaru      : Number,
    create_by       : String,
    update_by       : String,
    createdAt       : String,
    updatedAt       : String
}, {
    timestamps: false
});

module.exports = mongoose.model(config.mongodb.db_pasien, masterPasienSchema, config.mongodb.db_pasien);