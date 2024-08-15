const fs                            = require('fs');
const AntrianOperasi                = require('../models/AntrianOperasi.js');
const BedahSentral                  = require('../models/BedahSentral.js');
const KategoriOperasiBedahSentral   = require('../models/KategoriOperasiBedahSentral.js');
const TipeLayanan                   = require('../models/TipeLayanan.js');
const logging                       = require('../libs/logging');
const tokenValidator                = require('../utility/ValidationJwt');
const Response                      = require('../helpers/response');
const moment                        = require('moment');

const validateListJadwalOperasi = fs.readFileSync('./data/list_jadwal_operasi.json', 'utf-8');
const validateListKodeBooking = fs.readFileSync('./data/list_kode_booking.json', 'utf-8');

const Ajv = require('ajv');
//show All error if data not valid
const ajv = new Ajv({
    allErrors: true,
    loopRequired: Infinity
});

var validateData;

function dataValidate(data) {
    return new Promise((next, reject) => {
        validator = validateData(data);
        validate = validateData;

        if (!validator) {
            logging.error(JSON.stringify(validate.errors));
            reject(validate.errors);
        }
        next();
    });
}

exports.getListJadwalOperasi = async (req, res) => {
    logging.info(`[HTTP][REQUEST][HEADER] ${JSON.stringify(req.headers)}`);
    logging.info(`[HTTP][REQUEST][BODY] ${JSON.stringify(req.body)}`);
    logging.info(`[HTTP][REQUEST][PARAMS] ${JSON.stringify(req.params)}`);

    await tokenValidator.Authentication(req, res);
    validateData = ajv.compile(JSON.parse(validateListJadwalOperasi));

    let {
        tanggalawal,
        tanggalakhir
    } = req.body;

    dataValidate(req.body)
    .then(async function () {
        let compareDate = await membandingkanTanggal(tanggalawal, tanggalakhir);
        if (compareDate === false) {
            return Response(res, "Tanggal Akhir Tidak Boleh Lebih Kecil dari Tanggal Awal.", null, 201, "[GET-LIST-JADWAL-OPERASI][COMPARE-DATE][NOT-VALID]");
        }

        let getList = await getListJadwalOperasiByTanggal(moment(tanggalawal).format("YYYY-MM-DD HH:mm:ss"), tanggalakhir);
        let listJadwalOperasi = [];

        getList.forEach(element => {
            let dataResponse = {};
            
            dataResponse.kodebooking    = element.kode_booking;
            dataResponse.tanggaloperasi = element.tanggal_operasi;
            dataResponse.jenistindakan  = element.jenis_tindakan;
            dataResponse.kodepoli       = element.kode_poli;
            dataResponse.namapoli       = element.nama_poli;
            dataResponse.terlaksana     = parseInt(element.terlaksana);
            dataResponse.nopeserta      = element.no_peserta;
            dataResponse.lastupdate     = parseInt(moment(moment().format("YYYY-MM-DD HH:mm:ss")).format("x"));

            listJadwalOperasi.push(dataResponse);
        });

        let response = {
            list : listJadwalOperasi,
        };

        return Response(res, "Ok", response, 200, "[GET-LIST-JADWAL-OPERASI][SUCCESSFULLY]");
    })
    .catch(function (err) {
        let data = {
            errors: []
        }

        for (var i = 0; i < err.length; i++) {
            let obj = {
                type    : err[i].dataPath.slice(1),
                message : err[i].message
            }
            data.errors.push(obj);
        }

        return Response(res, "Validation Form Error", data, 422, `[GET-LIST-JADWAL-OPERASI][VALIDATION][FORM][ERROR] ${err.message}`);
    });
};

exports.getListOperasiKodeBooking = async (req, res) => {
    logging.info(`[HTTP][REQUEST][HEADER] ${JSON.stringify(req.headers)}`);
    logging.info(`[HTTP][REQUEST][BODY] ${JSON.stringify(req.body)}`);
    logging.info(`[HTTP][REQUEST][PARAMS] ${JSON.stringify(req.params)}`);

    await tokenValidator.Authentication(req, res);
    validateData = ajv.compile(JSON.parse(validateListKodeBooking));

    let {
        nopeserta
    } = req.body;

    dataValidate(req.body)
    .then(async function () {
        if (nopeserta.length != 13) {
            return Response(res, "Nomor Kartu yang dimasukkan tidak valid", null, 201, "[GET-ANTRIAN][NO-KARTU][AVAILABLE]");
        }

        let getList = await getListJadwalOperasiByNoPeserta(nopeserta);
        let listJadwalOperasi = [];

        getList.forEach(element => {
            let dataResponse = {};
            
            dataResponse.kodebooking    = element.kode_booking;
            dataResponse.tanggaloperasi = element.tanggal_operasi;
            dataResponse.jenistindakan  = element.jenis_tindakan;
            dataResponse.kodepoli       = element.kode_poli;
            dataResponse.namapoli       = element.nama_poli;
            dataResponse.terlaksana     = parseInt(element.terlaksana);

            listJadwalOperasi.push(dataResponse);
        });

        let response = {
            list : listJadwalOperasi,
        };

        return Response(res, "Ok", response, 200, "[GET-LIST-OPERASI-KODE-BOOKING][SUCCESSFULLY]");
    })
    .catch(function (err) {
        let data = {
            errors: []
        }

        for (var i = 0; i < err.length; i++) {
            let obj = {
                type    : err[i].dataPath.slice(1),
                message : err[i].message
            }
            data.errors.push(obj);
        }

        return Response(res, "Validation Form Error", data, 422, `[GET-LIST-OPERASI-KODE-BOOKING][VALIDATION][FORM][ERROR] ${err.message}`);
    });
};

function getListJadwalOperasiByTanggal(_tanggal_awal, _tanggal_akhir) {
    return new Promise(function (resolve, reject) {
        AntrianOperasi.find({ 
            tanggal_operasi : { $gte: _tanggal_awal, $lte: _tanggal_akhir }
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function getListJadwalOperasiByNoPeserta(_no_peserta) {
    return new Promise(function (resolve, reject) {
        AntrianOperasi.find({ 
            no_peserta : _no_peserta,
            terlaksana : 0
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function membandingkanTanggal(_tanggal1, _tanggal2) {
    let tanggalStart = moment(new Date(_tanggal1)).format('YYYY-MM-DD');
    let tanggalFinish = moment(new Date(_tanggal2)).format('YYYY-MM-DD');

    let result = true;
    if (tanggalStart > tanggalFinish) {
        result = false;
    }

    return result;
}