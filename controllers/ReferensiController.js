const fs                            = require('fs');
const logging                       = require('../libs/logging');
const tokenValidator                = require('../utility/ValidationJwt');
const Response                      = require('../helpers/response');
const moment                        = require('moment');
const needle                        = require('needle');
const iniParser                     = require('../libs/iniParser');
const AntrianPoliklinik             = require('../models/AntrianPoliklinik.js');
const Pasien                        = require('../models/Pasien.js');

const validateListTaskID = fs.readFileSync('./data/list_task_id.json', 'utf-8');
const validateUpdateWaktu = fs.readFileSync('./data/update_waktu.json', 'utf-8');
const validateUpdateJadwalDokter = fs.readFileSync('./data/update_jadwal_dokter.json', 'utf-8');

const urllocal = 'http://localhost:7000';

const Ajv = require('ajv');
const { exit } = require('process');
const DataDokter = require('../models/DataDokter');
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

exports.getPoli = async (req, res) => {
    let config   = iniParser.get();
    await tokenValidator.Authentication(req, res);

    let poli = await requestUrlGet(config.poli.url);
    if (poli === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[POLI][ERROR]");
    }
    if (poli.metadata.code != 200) {
        return Response(res, poli.metadata.message, null, 201, "[POLI][FAILED]");
    }
    logging.info(`[POLI][SUCCESSFULLY] ${JSON.stringify(poli)}`);

    return Response(res, "Ok", poli.response, 200, "[POLI][SUCCESSFULLY]");

}

exports.getDokter = async (req, res) => {
    let config   = iniParser.get();
    await tokenValidator.Authentication(req, res);

    let dokter = await requestUrlGet(config.dokter.url);
    if (dokter === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[DOKTER][ERROR]");
    }
    if (dokter.metadata.code != 200) {
        return Response(res, dokter.metadata.message, null, 201, "[DOKTER][FAILED]");
    }
    logging.info(`[DOKTER][SUCCESSFULLY] ${JSON.stringify(dokter)}`);

    return Response(res, "Ok", dokter.response, 200, "[DOKTER][SUCCESSFULLY]");

}

exports.getJadwalDokter = async (req, res) => {
    let config   = iniParser.get();
    await tokenValidator.Authentication(req, res);

    let dataReq = {
        kodepoli,
        tanggal,
    } = req.params;

    let jadwaldokter = await requestUrl(config.jadwaldokter.url, dataReq);
    if (jadwaldokter === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[JADWAL-DOKTER][ERROR]");
    }
    if (jadwaldokter.metadata.code != 200) {
        return Response(res, jadwaldokter.metadata.message, null, 201, "[JADWAL-DOKTER][FAILED]");
    }
    logging.info(`[JADWAL-DOKTER][SUCCESSFULLY] ${JSON.stringify(jadwaldokter)}`);

    return Response(res, "Ok", jadwaldokter.response, 200, "[JADWAL-DOKTER][SUCCESSFULLY]");

}

exports.getListTaskID = async (req, res) => {
    let config   = iniParser.get();

    await tokenValidator.Authentication(req, res);
    validateData = ajv.compile(JSON.parse(validateListTaskID));
    logging.info(`[HTTP][REQUEST][BODY] ${JSON.stringify(req.body)}`);

    let {
        kodebooking,
    } = req.body;

    dataValidate(req.body)
    .then(async function () {
        let listTaskID = await requestUrl(config.listtaskid.url, req.body);
        if (listTaskID === "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[PUSH-GET-TASK-ID][ERROR]");
        }
        if (listTaskID.metadata.code != 200) {
            return Response(res, listTaskID.metadata.message, null, 201, "[PUSH-GET-TASK-ID][FAILED]");
        }
        logging.info(`[PUSH-GET-TASK-ID][SUCCESSFULLY] ${JSON.stringify(listTaskID)}`);

        return Response(res, "Ok", listTaskID.response, 200, "[GET-LIST-TASK-ID][SUCCESSFULLY]");
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

        return Response(res, "Validation Form Error", data, 422, `[GET-LIST-TASK-ID][VALIDATION][FORM][ERROR] ${err.message}`);
    });
};

exports.updateWaktu = async (req, res) => {
    let config   = iniParser.get();

    await tokenValidator.Authentication(req, res);
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
                status          : 'dilayani',
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
                status          : 'selesai',
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

exports.updateJadwalDokter = async (req, res) => {
    let config   = iniParser.get();

    await tokenValidator.Authentication(req, res);
    validateData = ajv.compile(JSON.parse(validateUpdateJadwalDokter));

    let {
        kodepoli,
        kodesubspesialis,
        kodedokter,
        jadwal,
    } = req.body;


    dataValidate(req.body)
    .then(async function () {
        let updateJadwalDokter = await requestUrl(config.updatejadwaldokter.url, req.body);
        if (updateJadwalDokter === "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[PUSH-UPDATE-JADWAL-DOKTER][ERROR]");
        }
        if (updateJadwalDokter.metadata.code != 200) {
            return Response(res, updateJadwalDokter.metadata.message, null, 201, "[PUSH-UPDATE-JADWAL-DOKTER][FAILED]");
        }
        logging.info(`[PUSH-UPDATE-JADWAL-DOKTER][SUCCESSFULLY] ${JSON.stringify(updateJadwalDokter)}`);

        return Response(res, "Ok", updateJadwalDokter.response, 200, "[UPDATE-JADWAL-DOKTER][SUCCESSFULLY]");
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

        return Response(res, "Validation Form Error", data, 422, `[UPDATE-JADWAL-DOKTER][VALIDATION][FORM][ERROR] ${err.message}`);
    });
};

exports.DashboardPerTanggal = async (req, res) => {
    let config   = iniParser.get();
    await tokenValidator.Authentication(req, res);

    let dataReq = {
        tanggal,
        waktu,
    } = req.params;

    let dashboardpertanggal = await requestUrl(config.DashboardPerTanggal.url, dataReq);
    if (dashboardpertanggal === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[Dashboard Per Tanggal][ERROR]");
    }
    if (dashboardpertanggal.metadata.code != 200) {
        return Response(res, dashboardpertanggal.metadata.message, null, 201, "[Dashboard Per Tanggal][FAILED]");
    }
    logging.info(`[Dashboard Per Tanggal][SUCCESSFULLY] ${JSON.stringify(dashboardpertanggal)}`);

    return Response(res, "Ok", dashboardpertanggal.response, 200, "[Dashboard Per Tanggal][SUCCESSFULLY]");

}

exports.DashboardPerBulan = async (req, res) => {
    let config   = iniParser.get();
    await tokenValidator.Authentication(req, res);

    let dataReq = {
        bulan,
        tahun,
        waktu,
    } = req.params;

    let dashboardperbulan = await requestUrl(config.DashboardPerBulan.url, dataReq);
    if (dashboardperbulan === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[Dashboard Per Bulan][ERROR]");
    }
    if (dashboardperbulan.metadata.code != 200) {
        return Response(res, dashboardperbulan.metadata.message, null, 201, "[Dashboard Per Bulan][FAILED]");
    }
    logging.info(`[Dashboard Per Bulan][SUCCESSFULLY] ${JSON.stringify(dashboardperbulan)}`);

    return Response(res, "Ok", dashboardperbulan.response, 200, "[Dashboard Per Bulan][SUCCESSFULLY]");

}

exports.findRujukanByNoKartu = async (req, res) => {
    let config   = iniParser.get();

    let rujukanfktp = await requestUrlGet(urllocal+'/rujukan/search/no-kartu/'+req.params.nokartu);
    if (rujukanfktp === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[RUJUKAN-FKTP][ERROR]");
    }
    // if (rujukanfktp.metaData.code != 200) {
    //     return Response(res, rujukanfktp.metaData.message, null, 201, "[RUJUKAN-FKTP][FAILED]");
    // }

    let rujukanfktrl = await requestUrlGet(urllocal+'/rujukan/rs/search/no-kartu/'+req.params.nokartu);
    if (rujukanfktrl === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[RUJUKAN-FKTRL][ERROR]");
    }
    // if (rujukanfktrl.metaData.code != 200) {
    //     return Response(res, rujukanfktrl.metaData.message, null, 201, "[RUJUKAN-FKTRL][FAILED]");
    // }

    if (rujukanfktp.metaData.code != 200 && rujukanfktrl.metaData.code != 200) {
        return Response(res, 'Rujukan Tidak Ada.', null, 201, "[RUJUKAN][FAILED]");
    }

    let rujukan = [
        rujukanfktp,
        rujukanfktrl,
    ];

    return Response(res, "Ok", rujukan, 200, "[RUJUKAN][SUCCESSFULLY]");
};

exports.findRujukanRsByNoKartu = async (req, res) => {
    let config   = iniParser.get();
    let rujukan = await requestUrlGet(urllocal+'/rujukan/rs/search/no-kartu/'+req.params.nokartu);
    if (rujukan === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[RUJUKAN][ERROR]");
    }
    if (rujukan.metaData.code != 200) {
        return Response(res, rujukan.metaData.message, null, 201, "[RUJUKAN][FAILED]");
    }
    logging.info(`[RUJUKAN][SUCCESSFULLY] ${JSON.stringify(rujukan)}`);

    return Response(res, "Ok", rujukan.response, 200, "[RUJUKAN][SUCCESSFULLY]");
};

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

function getPasienByRM(_norm) {
    return new Promise(function (resolve, reject) {
        Pasien.findOne({
            no_rm : _norm,
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

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

function requestUrlGet (_url) {
    return new Promise(async function (resolve, reject) {
        let options = {
            timeout : 60000,
            json    : true
        }

        needle.get(_url, options, function(err, resp) {
            if (err) {
                resolve('ERROR');
            }
            else {
                resolve(resp.body)
            }
        });
    });
}