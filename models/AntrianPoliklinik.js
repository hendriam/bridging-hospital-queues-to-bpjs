const mongoose  = require('mongoose');
const iniParser = require('../libs/iniParser');
var ObjectId    = mongoose.Schema.Types.ObjectId;
var config      = iniParser.get();

// const antrianPolyclinicSchema = mongoose.Schema({
//     tanggal_periksa     : String,
//     kode_booking        : String,
//     no_antrian          : String,
//     no_urut             : String,
//     status              : String,
//     keterangan          : String,
//     waktu_dilayani      : String,
//     waktu_selesai       : String,
//     jadwal_dokter_id    : {
//         type    : ObjectId,
//         ref     : config.mongodb.db_jadwal_dokters,
//         required: true
//     },
//     poliklinik_id       : {
//         type    : ObjectId,
//         ref     : config.mongodb.db_polyclinics,
//         required: true
//     },
//     no_kartu        : String,
//     nik             : String,
//     no_telp         : String,
//     no_referensi    : String,
//     jenis_referensi : String,
//     jenis_request   : String,
//     poli_eksekutif  : String,
//     jenis_antrian   : String,
//     norm            : String,
//     kodedokter      : String,
//     jampraktek      : String,
//     jeniskunjungan  : String,
//     createdAt       : String,
//     updatedAt       : String
// }, {
//     timestamps: false
// });

const antrianPolyclinicSchema = mongoose.Schema({
    nomorkartu      : String,
    nik             : String,
    nohp            : String,
    poliklinik_id   : {
        type    : ObjectId,
        ref     : config.mongodb.db_polyclinics,
        required: true
    },
    kodepoli        : String,
    kodesubpoli     : String,
    norm            : String,
    tanggalperiksa  : String,
    // dokter_id       : {
    //     type    : ObjectId,
    //     ref     : config.mongodb.db_data_dokters,
    //     required: true
    // },
    namadokter      : String,
    kodedokter      : String,
    jampraktek      : String,
    jeniskunjungan  : String,
    nomorreferensi  : String,

    hurufantrean    : String,
    nomorantrean    : String,
    angkaantrean    : Number,
    angkadokter     : Number,
    
    kodebooking     : String,
    estimasidilayani: Number,
    waktu_dilayani  : String,
    waktu_selesai   : String,
    waktu_checkin   : String,

    waktu_tunggu_admisi     : String,
    waktu_dipanggil_admisi  : String,
    waktu_dilayani_admisi   : String,

    waktu_tunggu_poli       : String,
    waktu_dipanggil_poli  : String,
    waktu_dilayani_poli     : String,

    waktu_tunggu_farmasi    : String,
    waktu_dipanggil_farmasi  : String,
    waktu_dilayani_farmasi  : String,

    waktu_dilayani_selesai  : String,
    waktu_batal  : String,

    keterangan      : String,
    
    kuotajkn        : Number,
    sisakuotajkn    : Number,
    kuotanonjkn     : Number,
    sisakuotanonjkn : Number,

    jenispasien     : String,
    pasienbaru      : Number,

    status          : String,
    taskid          : Number,
    
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

    status_display : Boolean,

    jenisantrean    : String,
    createdAt       : String,
    updatedAt       : String,
    
}, {
    timestamps: false
});

module.exports = mongoose.model(config.mongodb.db_antrian_polyclinics, antrianPolyclinicSchema, config.mongodb.db_antrian_polyclinics);