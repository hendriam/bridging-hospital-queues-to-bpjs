const fs                            = require('fs');
const logging                       = require('../libs/logging');
const tokenValidator                = require('../utility/ValidationJwt');
const Response                      = require('../helpers/response');
const moment                        = require('moment');
const needle                        = require('needle');
const iniParser                     = require('../libs/iniParser');
const Loket                         = require('../models/Loket.js');
const AntrianPoliklinik             = require('../models/AntrianPoliklinik.js');
const Pasien                        = require('../models/Pasien.js');

const validateUpdateWaktu = fs.readFileSync('./data/update_waktu.json', 'utf-8');

const Ajv = require('ajv');
const { exit } = require('process');
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

exports.getLoket = async (req, res) => {
    let config   = iniParser.get();

    let loket = await getLoket();
    if (loket === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[LOKET][ERROR]");
    }
    logging.info(`[LOKET][SUCCESSFULLY] ${JSON.stringify(loket)}`);
    return Response(res, "Ok", loket, 200, "[LOKET][SUCCESSFULLY]");
}

exports.findOneLoket = async (req, res) => {
    let loket = await getOneLoket(req.params.Id);
    if (loket === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[LOKET][ERROR]");
    }

    if (loket === null) {
        return Response(res, "Data Tidak Ditemukan", null, 201, "[REGISTER][FIND-ONE][NOT-FOUND]");
    }
    return Response(res, "Ok", loket, 200, "[LOKET][SUCCESSFULLY]");
};

exports.callAntrean = async (req, res) => {
    let tanggalperiksa = moment().format("YYYY-MM-DD");
    let antrean = await getAntrean(tanggalperiksa);
    if (antrean === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[ANTREAN][ERROR]");
    }
    if (antrean.length === 0) {
        return Response(res, "Antrean checkin tidak tersedia.", null, 201, "[ANTREAN][ERROR]");
    }
    logging.info(`[ANTREAN][SUCCESSFULLY] ${JSON.stringify(antrean)}`);

    let tempantreanpanggil = null;
    for (const i in antrean) {
        if (antrean[i].taskid === 1 && antrean[i].status === "checkin") {
            tempantreanpanggil = antrean[i];
            break;
        }
    }
    
    if (tempantreanpanggil === null) {
        return Response(res, "Antrean checkin tidak tersedia.", null, 201, "[ANTREAN][ERROR]");
    }

    let dataUpdateAntrian = {
        status                  : "dipanggil",
        waktu_dipanggil_admisi  : moment().format("YYYY-MM-DD HH:mm:ss"),
        loket_id    : req.body.loket_id
    }

    let updateAntrian = await updateAntrianPoliklinik(tempantreanpanggil._id, dataUpdateAntrian);
    if (updateAntrian == "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[ANTREAN][UPDATE][ERROR]");
    }
    logging.info(`[ANTREAN][UPDATE][SUCCESSFULLY] ${JSON.stringify(updateAntrian)}`);

    return Response(res, "Ok", updateAntrian, 200, "[ANTREAN][SUCCESSFULLY]");
}

exports.updateLoket = async (req, res) => {
    let config   = iniParser.get();
    let body = {
        status : 1
    }
    let loket = await updateLoket(req.body.loket_id, body);
    if (loket === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[LOKET-UPDATE][ERROR]");
    }

    if (loket === null) {
        return Response(res, "Not Oke", null, 201, "[LOKET-UPDATE][ERROR]");
    }
    logging.info(`[LOKET-UPDATE][SUCCESSFULLY] ${JSON.stringify(loket)}`);
    return Response(res, "Ok", loket, 200, "[LOKET-UPDATE][SUCCESSFULLY]");
}

exports.totalAntrean = async (req, res) => {
    let tanggalperiksa = moment().format("YYYY-MM-DD");
    let data = await _totalAntrean(tanggalperiksa);
    if (data === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[ANTREAN][ERROR]");
    }

    // logging.info(`[ANTREAN][SUCCESSFULLY] ${JSON.stringify(data)}`);
    return Response(res, "Ok", data, 200, "[ANTREAN][SUCCESSFULLY]");
}

exports.sisaAntrean = async (req, res) => {
    let tanggalperiksa = moment().format("YYYY-MM-DD");
    let data = await _sisaAntrean(tanggalperiksa);
    if (data === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[SISA-ANTREAN][ERROR]");
    }

    // logging.info(`[SISA-ANTREAN][SUCCESSFULLY] ${JSON.stringify(data)}`);
    return Response(res, "Ok", data, 200, "[SISA-ANTREAN][SUCCESSFULLY]");
}

exports.getAntreanDipanggilDilayaniByLoket = async (req, res) => {
    let tanggalperiksa = moment().format("YYYY-MM-DD");
    let data = await _getAntreanDipanggilDilayaniByLoket(tanggalperiksa, req.params.loketid);
    if (data === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[ANTREAN][DIPANGGIL-DILAYANI][ERROR]");
    }

    if (data === null) {
        return Response(res, "Antrean checkin tidak tersedia.", null, 201, "[ANTREAN][DIPANGGIL-DILAYANI][ERROR]");
    }
    
    // logging.info(`[ANTREAN][DIPANGGIL-DILAYANI][SUCCESSFULLY] ${JSON.stringify(data)}`);
    return Response(res, "Ok", data, 200, "[ANTREAN][DIPANGGIL-DILAYANI][SUCCESSFULLY]");
}

exports.getAntreanDipanggilDilayani = async (req, res) => {
    let tanggalperiksa = moment().format("YYYY-MM-DD");
    let data = await _getAntreanDipanggilDilayani(tanggalperiksa);
    if (data === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[ANTREAN][DIPANGGIL-DILAYANI][ERROR]");
    }

    if (data.length === 0) {
        return Response(res, "Antrean checkin tidak tersedia.", null, 201, "[ANTREAN][DIPANGGIL-DILAYANI][ERROR]");
    }
    
    // logging.info(`[ANTREAN][DIPANGGIL-DILAYANI][SUCCESSFULLY] ${JSON.stringify(data)}`);
    return Response(res, "Ok", data, 200, "[ANTREAN][DIPANGGIL-DILAYANI][SUCCESSFULLY]");
}

exports.updateWaktu = async (req, res) => {
    let config   = iniParser.get();
    validateData = ajv.compile(JSON.parse(validateUpdateWaktu));

    let {
        kodebooking,
        taskid,
        waktu
    } = req.body;

    dataValidate(req.body)
    .then(async function () {
        let getAntrian    = await getAntrianPoliklinikByKodeBooking(kodebooking);
        if (getAntrian === "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][ANTRIAN-KOSONG][ERROR]");
        }
        if (getAntrian == null){
            return Response(res, "Antrean Tidak Ditemukan", null, 201, "[GET-ANTRIAN][ANTRIAN-KOSONG][ERROR]");
        }

        let updatewaktu = await requestUrl(config.updatewaktu.url, req.body);
        if (updatewaktu === "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[PUSH-UPDATE-WAKTU][ERROR]");
        }
        if (updatewaktu.metadata.code != 200) {
            return Response(res, updatewaktu.metadata.message, null, 201, "[PUSH-UPDATE-WAKTU][FAILED]");
        }
        logging.info(`[PUSH-UPDATE-WAKTU][SUCCESSFULLY] ${JSON.stringify(updatewaktu)}`);

        let dataUpdateAntrian;
        if (taskid === 2) {
            dataUpdateAntrian = {
                status          : 'dilayani',
                taskid          : taskid,
                pasienbaru      : 0,
                waktu_dilayani_admisi   : moment().format("YYYY-MM-DD HH:mm:ss"),
                updatedAt       : moment().format("YYYY-MM-DD HH:mm:ss"),
            }

            let getPasien = await getPasienByRM(getAntrian.norm);
            if (getPasien === "ERROR") {
                return Response(res, "Internal Server Error", null, 201, "[GET-PASIEN][ERROR]");
            }

            let dataUpdatePasien = {
                pasienbaru  : 0,
            }
            let updatepasien = await updatePasien(getPasien._id, dataUpdatePasien);
            if (updatepasien == "ERROR") {
                return Response(res, "Internal Server Error", null, 201, "[UPDATE-PASIEN-LOCAL][ERROR]");
            }
            logging.info(`[UPDATE-PASIEN-LOCAL][SUCCESSFULLY] ${JSON.stringify(updatepasien)}`);
        } 
        else if (taskid === 3) {
            dataUpdateAntrian = {
                status          : 'checkin',
                taskid          : taskid,
                waktu_tunggu_poli   : moment().format("YYYY-MM-DD HH:mm:ss"),
                updatedAt       : moment().format("YYYY-MM-DD HH:mm:ss"),
            }    
        }
        else if (taskid === 4) {
            dataUpdateAntrian = {
                status          : 'dilayani',
                taskid          : taskid,
                waktu_dilayani_poli   : moment().format("YYYY-MM-DD HH:mm:ss"),
                updatedAt       : moment().format("YYYY-MM-DD HH:mm:ss"),
            }    
        }
        else if (taskid === 5) {
            dataUpdateAntrian = {
                status          : 'dilayani',
                taskid          : taskid,
                waktu_tunggu_farmasi   : moment().format("YYYY-MM-DD HH:mm:ss"),
                updatedAt       : moment().format("YYYY-MM-DD HH:mm:ss"),
            }    
        }
        else if (taskid === 6) {
            dataUpdateAntrian = {
                status          : 'dilayani',
                taskid          : taskid,
                waktu_dilayani_farmasi   : moment().format("YYYY-MM-DD HH:mm:ss"),
                updatedAt       : moment().format("YYYY-MM-DD HH:mm:ss"),
            }    
        }
        else if (taskid === 7) {
            dataUpdateAntrian = {
                status          : 'selesai',
                taskid          : taskid,
                waktu_dilayani_selesai   : moment().format("YYYY-MM-DD HH:mm:ss"),
                updatedAt       : moment().format("YYYY-MM-DD HH:mm:ss"),
            }    
        }
        else {
            dataUpdateAntrian = {
                status          : 'batal',
                taskid          : taskid,
                waktu_batal     : moment().format("YYYY-MM-DD HH:mm:ss"),
                updatedAt       : moment().format("YYYY-MM-DD HH:mm:ss"),
            }   
        }

        let updateAntrian = await updateAntrianPoliklinik(getAntrian._id, dataUpdateAntrian);
        if (updateAntrian == "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[UPDATE-ANTREAN-LOCAL][ERROR]");
        }
        logging.info(`[UPDATE-ANTREAN-LOCAL][SUCCESSFULLY] ${JSON.stringify(updateAntrian)}`);

        return Response(res, "Ok", null, 200, "[UPDATE-WAKTU][SUCCESSFULLY]");
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

        return Response(res, "Validation Form Error", data, 422, `[UPDATE-WAKTU][VALIDATION][FORM][ERROR] ${err.message}`);
    });
};

function getLoket() {
    return new Promise(function (resolve, reject) {
        Loket.find({
            status : 0,
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function getOneLoket(_id) {
    return new Promise(function (resolve, reject) {
        Loket.findOne({
            _id : _id,
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function updateLoket(_id, _data) {
    return new Promise(async function (resolve, reject) {
        Loket.findByIdAndUpdate(_id, _data, {
            new: true
        })
        .then(_data => {
            resolve(_data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function getAntrean(_tanggalperiksa) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.find({
            tanggalperiksa : _tanggalperiksa,
            // pasienbaru : 1,
            taskid : 1,
            status : 'checkin',
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function _totalAntrean(_tanggalperiksa) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.find({
            tanggalperiksa : _tanggalperiksa,
            // pasienbaru : 1,
            // status : { $in : ['menunggu', 'checkin', 'dipanggil']},
            // taskid : {  $gt: 0 }
            taskid : { $in : [1,2]},
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function _sisaAntrean(_tanggalperiksa) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.find({
            tanggalperiksa : _tanggalperiksa,
            // pasienbaru : 1,
            // status : { $in : ['menunggu', 'checkin', 'dipanggil']},
            // taskid : {  $gt: 3 }
            taskid : { $in : [1,2]},
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function _getAntreanDipanggilDilayaniByLoket(_tanggalperiksa, _loket_id) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.findOne({
            tanggalperiksa : _tanggalperiksa,
            // pasienbaru : 1,
            // status : { $in : ['dipanggil', 'dilayani']},
            taskid : { $in : [1,2]},
            // taskid : {  $gt: 3 },
            loket_id : _loket_id,
        })
        .populate('loket_id')
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function _getAntreanDipanggilDilayani(_tanggalperiksa) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.find({
            tanggalperiksa : _tanggalperiksa,
            // pasienbaru : 1,
            status : { $in : ['dipanggil', 'dilayani']},
            taskid : { $in : [1,2]},
        })
        .populate('loket_id')
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function updateAntrianPoliklinik(_id, _data) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.findByIdAndUpdate(_id, _data, {
            new: true
        })
        .then(_data => {
            resolve(_data);
        })
        .catch(err => {
            resolve("ERROR");
        })
    });
};

function updatePasien(_id, _data) {
    return new Promise(function (resolve, reject) {
        Pasien.findByIdAndUpdate(_id, _data, {
            new: true
        })
        .then(_data => {
            resolve(_data);
        })
        .catch(err => {
            resolve("ERROR");
        })
    });
};

function getPasienByRM(_norm) {
    return new Promise(function (resolve, reject) {
        Pasien.findOne({
            no_rm           : _norm,
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function getAntrianPoliklinikByKodeBooking(_kodebooking) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.findOne({
            kodebooking : _kodebooking,
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function requestUrl (_url, _body) {
    return new Promise(async function (resolve, reject) {
        let options = {
            timeout : 60000,
            json    : true
        }

        needle.post(_url, _body, options, function(err, resp) {
            if (err) {
                resolve('ERROR');
            }
            else {
                resolve(resp.body)
            }
        });
    });
}
