const fs                            = require('fs');
const logging                       = require('../libs/logging');
const tokenValidator                = require('../utility/ValidationJwt');
const Response                      = require('../helpers/response');
const moment                        = require('moment');
const needle                        = require('needle');
const iniParser                     = require('../libs/iniParser');
const Poliklinik                    = require('../models/Poliklinik.js');
const Loket                         = require('../models/Loket.js');
const AntrianPoliklinik             = require('../models/AntrianPoliklinik.js');
const Pasien                        = require('../models/Pasien.js');
const AntrianDipanggil              = require('../models/AntrianDipanggil.js');
const AntrianTemp                   = require('../models/AntrianTemp.js');

const validateUpdateWaktu           = fs.readFileSync('./data/update_waktu.json', 'utf-8');
const Dokter                        = fs.readFileSync('./data/dokter.json', 'utf-8');

const Ajv = require('ajv');
const { exit } = require('process');
const { stringify } = require('querystring');
const { json } = require('express/lib/response');
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
    let data = await getPoliklinik();
    if (data === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[POLI][ERROR]");
    }
    return Response(res, "Ok", data, 200, "[POLI][SUCCESSFULLY]");
}

exports.getOnePoli = async (req, res) => {
    let data = await _getOnePoli(req.params.Id);
    if (data === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[POLI][ERROR]");
    }

    if (data === null) {
        return Response(res, "Data Tidak Ditemukan", null, 201, "[POLI][FIND-ONE][NOT-FOUND]");
    }
    return Response(res, "Ok", data, 200, "[POLI][SUCCESSFULLY]");
};

exports.getListAntreanByPoliId = async (req, res) => {
    let tanggalperiksa = moment().format("YYYY-MM-DD");

    let data = await _getAntreanByPoli(tanggalperiksa, req.params.poliid);
    if (data === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[ANTREAN][DIPANGGIL-DILAYANI][ERROR]");
    }
    if (data.length === 0) {
        return Response(res, "Antrean tidak tersedia.", null, 201, "[ANTREAN][DIPANGGIL-DILAYANI][ERROR]");
    }

    let result2 = [];

    var result = data.reduce((hash, obj) => {
        let key = `${obj.kodedokter}`;
        hash[key] = hash[key] || {kodedokter : "", namadokter : "", antrean: [] };
        hash[key]["kodedokter"] = obj.kodedokter;
        hash[key]["namadokter"] = obj.namadokter;
        hash[key]["antrean"].push(obj)
        return hash;
    },{});
    result2 = Object.values(result);
    
    return Response(res, "Ok", result2, 200, "[ANTREAN][DIPANGGIL-DILAYANI][SUCCESSFULLY]");
}

exports.totalAntrean = async (req, res) => {
    let tanggalperiksa = moment().format("YYYY-MM-DD");
    let data = await _totalAntrean(tanggalperiksa, req.params.poliid);
    if (data === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[ANTREAN][ERROR]");
    }
    return Response(res, "Ok", data, 200, "[ANTREAN][SUCCESSFULLY]");
}

exports.sisaAntrean = async (req, res) => {
    let tanggalperiksa = moment().format("YYYY-MM-DD");
    let data = await _sisaAntrean(tanggalperiksa, req.params.poliid, req.params.dokter);
    if (data === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[SISA-ANTREAN][ERROR]");
    }
    return Response(res, "Ok", data, 200, "[SISA-ANTREAN][SUCCESSFULLY]");
}

exports.callAntrean = async (req, res) => {
    let tanggalperiksa = moment().format("YYYY-MM-DD");

    let getAntrianDipanggil = await _getAntrianDipanggil("POLI", req.body.lorong, tanggalperiksa);
    if (getAntrianDipanggil === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[ANTREAN][ERROR]");
    }
    if (getAntrianDipanggil.length > 0) {
        return Response(res, "Sedang Ada Pemanggilan", null, 201, "[ANTREAN][KOSONG]");
    }

    let antrean = await getAntrean(tanggalperiksa, req.body.poli_id, req.body.kodedokter);
    if (antrean === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[ANTREAN][ERROR]");
    }
    if (antrean.length === 0) {
        return Response(res, "Antrean tidak tersedia.", null, 201, "[ANTREAN][ERROR]");
    }

    let tempantreanpanggil = null;
    for (const i in antrean) {
        if (antrean[i].taskid === 3 && antrean[i].status === "checkin") {
            tempantreanpanggil = antrean[i];
            break;
        }
    }

    if (tempantreanpanggil === null) {
        return Response(res, "Antrean tidak tersedia.", null, 201, "[ANTREAN][ERROR]");
    }

    let allAntrean = await getAllAntrean(tanggalperiksa);

    for (let j = 0; j < allAntrean.length; j++) {
        if (allAntrean[j].poliklinik_id.lorong == req.body.lorong) {
            let updateStatusDisplayToFalse = await _updateStatusDisplayToFalse(allAntrean[j]._id, {status_display : false});
            if (updateStatusDisplayToFalse == "ERROR") {
                return Response(res, "Internal Server Error", null, 201, "[ANTREAN][UPDATE][ERROR]");
            }
        }
    }

    let dataAntrianDipanggil = {
        antrian_id : tempantreanpanggil._id,
        jenisantrean : 'POLI',
        lorong      : req.body.lorong,
        tanggalantrean : tanggalperiksa,
        createdAt  : moment().format("YYYY-MM-DD HH:mm:ss"),
        updatedAt  : moment().format("YYYY-MM-DD HH:mm:ss"),
    }

    let createAntrianDipanggil = await _createAntrianDipanggil(dataAntrianDipanggil);
    if (createAntrianDipanggil == "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[CREATE-ANTRIAN-DIPANGGIL][ERROR]");
    }
    logging.info(`[CREATE-ANTRIAN-DIPANGGIL][SUCCESSFULLY] ${JSON.stringify(createAntrianDipanggil)}`);

    let dataUpdateAntrian = {
        status                  : "dipanggil",
        status_display          : true,
        waktu_dipanggil_poli    : moment().format("YYYY-MM-DD HH:mm:ss"),
    }

    let updateAntrian = await updateAntrianPoliklinik(tempantreanpanggil._id, dataUpdateAntrian);
    if (updateAntrian == "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[ANTREAN][UPDATE][ERROR]");
    }
    logging.info(`[ANTREAN][UPDATE][SUCCESSFULLY] ${JSON.stringify(updateAntrian)}`);
    

    return Response(res, "Ok", updateAntrian, 200, "[ANTREAN][SUCCESSFULLY]");
}

exports.batalPemanggilan = async (req, res) => {
    // batal local
    let dataUpdateAntrian = {
        status          : 'batal',
        taskid          : 99,
        waktu_batal     : moment().format("YYYY-MM-DD HH:mm:ss"),
        updatedAt       : moment().format("YYYY-MM-DD HH:mm:ss"),
    }
    let updateAntrian = await updateAntrianPoliklinik(req.params.id, dataUpdateAntrian);
    if (updateAntrian == "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[UPDATE-ANTREAN-LOCAL][ERROR]");
    }
    logging.info(`[UPDATE-ANTREAN-LOCAL][SUCCESSFULLY] ${JSON.stringify(updateAntrian)}`);

    // delete local
    let deleteAntrianDipanggil = await _deleteAntrianDipanggil("POLI", req.params.lorong);
    if (deleteAntrianDipanggil == "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[DELETE-ANTRIAN-DIPANGGIL][ERROR]");
    }
    logging.info(`[DELETE-ANTRIAN-DIPANGGIL][SUCCESSFULLY] ${JSON.stringify(deleteAntrianDipanggil)}`);

    return Response(res, "Ok", updateAntrian, 200, "[SISA-ANTREAN][SUCCESSFULLY]");
}

exports.getAntreanDipanggilDilayaniByPoli = async (req, res) => {
    let tanggalperiksa = moment().format("YYYY-MM-DD");
    let data = await _getAntreanDipanggilDilayaniByPoli(tanggalperiksa, req.params.poliid, req.params.dokter);
    if (data === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[ANTREAN][DIPANGGIL-DILAYANI][ERROR]");
    }

    if (data === null) {
        return Response(res, "Antrean checkin tidak tersedia.", null, 201, "[ANTREAN][DIPANGGIL-DILAYANI][ERROR]");
    }
    
    return Response(res, "Ok", data, 200, "[ANTREAN][DIPANGGIL-DILAYANI][SUCCESSFULLY]");
}

exports.getAntreanDipanggilDilayani = async (req, res) => {
    let tanggalperiksa = moment().format("YYYY-MM-DD");
    let data = await _getAntreanDipanggilDilayani(tanggalperiksa, req.params.poliid);
    console.log(req.params.poliid);
    exit(1);
    // if (data === "ERROR") {
    //     return Response(res, "Internal Server Error", null, 201, "[ANTREAN][DIPANGGIL-DILAYANI][ERROR]");
    // }

    // if (data.length === 0) {
    //     return Response(res, "Antrean checkin tidak tersedia.", null, 201, "[ANTREAN][DIPANGGIL-DILAYANI][ERROR]");
    // }
    
    return Response(res, "Ok", data, 200, "[ANTREAN][DIPANGGIL-DILAYANI][SUCCESSFULLY]");
}

exports.getAntreanDipanggilDilayaniAll = async (req, res) => {
    let config   = iniParser.get();
    let tanggalperiksa = moment().format("YYYY-MM-DD");
    
    // let dokter = await requestUrlGet(config.dokter.url);
    // if (dokter === "ERROR") {
    //     return Response(res, "Internal Server Error", null, 201, "[DOKTER][ERROR]");
    // }
    // if (dokter.metadata.code != 200) {
    //     return Response(res, dokter.metadata.message, null, 201, "[DOKTER][FAILED]");
    // }

    // // let dokter = JSON.parse(Dokter);

    // let datadokter = dokter.response;

    // let antreanbydokter = [];
    // for (const key in datadokter) {
    //     let data = await _getAntreanDipanggilDilayaniByDokter(tanggalperiksa, datadokter[key].kodedokter);
    //     if (data.length > 0) {
    //         datadokter[key]["antrean"] = data;
    //         antreanbydokter.push(datadokter[key]);
    //     }
    // }

    let allantrean = await getAllAntrean(tanggalperiksa);
    // let allantrean = await _getAntreanDipanggilDilayaniByDokter(tanggalperiksa);
    let antreanbydokter = [];

    var result = allantrean.reduce((hash, obj) => {
        let key = `${ obj.kodesubpoli}-${obj.kodedokter}`;
        hash[key] = hash[key] || { kodesubpoli : "", kodedokter : "", namadokter : "", antrean: {} };
        hash[key]["kodesubpoli"] = obj.kodesubpoli;
        hash[key]["kodedokter"] = obj.kodedokter;
        hash[key]["namadokter"] = obj.namadokter;
        
        if (((obj.status == "dipanggil" && obj.taskid == 3) || (obj.status == "dilayani" && obj.taskid == 4) || (obj.status == "checkin" && obj.taskid == 5) || (obj.status == "selesai" && obj.taskid == 5) || (obj.status == "dilayani" && obj.taskid == 6) || (obj.status == "selesai" && obj.taskid == 7) || (obj.status == "batal" && obj.taskid == 99))) {
            hash[key]["antrean"] = obj;
        }

        // hash[key]["antrean"].push(obj)
        
        return hash;
    },{});
    antreanbydokter = Object.values(result);

    return Response(res, "Ok", antreanbydokter, 200, "[ANTREAN-ALL][DIPANGGIL-DILAYANI][SUCCESSFULLY]");
}

exports.eksperimen = async (req, res) => {
    let config   = iniParser.get();
    let tanggalperiksa = moment().format("YYYY-MM-DD");
    
    let allantrean = await getAllAntrean(tanggalperiksa);
    let result2 = [];

    var result = allantrean.reduce((hash, obj) => {
        let key = `${ obj.kodesubpoli}-${obj.kodedokter}`;
        hash[key] = hash[key] || { kodesubpoli : "", kodedokter : "", antrean: [] };
        hash[key]["kodesubpoli"] = obj.kodesubpoli;
        hash[key]["kodedokter"] = obj.kodedokter;
        hash[key]["antrean"].push(obj)
        return hash;
    },{});
    result2 = Object.values(result);

    return Response(res, "Ok", result2, 200, "[ANTREAN-ALL][DIPANGGIL-DILAYANI][SUCCESSFULLY]");
}

exports.getAntreanDipanggilDilayaniDisplayTrue = async (req, res) => {
    let tanggalperiksa = moment().format("YYYY-MM-DD");
    let data = await _getAntreanDipanggilDilayaniDisplayTrue(tanggalperiksa);
    if (data === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[ANTREAN-ALL][DIPANGGIL-DILAYANI][ERROR]");
    }

    if (data === null) {
        return Response(res, "Not oke.", null, 201, "[ANTREAN-ALL][DIPANGGIL-DILAYANI][ERROR]");
    }

    let totalantrean = await _getTotalAntreanByDokter(tanggalperiksa, data.kodedokter);
    let sisaantrean = await _getSisaAntreanByDokter(tanggalperiksa, data.kodedokter);

    data = {
        antrean : data,
        total_antrean : totalantrean.length,
        sisa_antrean : totalantrean.length - sisaantrean.length,
    }

    return Response(res, "Ok", data, 200, "[ANTREAN-ALL][DIPANGGIL-DILAYANI][SUCCESSFULLY]");
}

exports.getAntreanDipanggilDilayaniDisplayTrueHallway = async (req, res) => {
    let tanggalperiksa = moment().format("YYYY-MM-DD");
    let data = await _getAntreanDipanggilDilayaniDisplayTrue(tanggalperiksa);
    if (data === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[ANTREAN-ALL][DIPANGGIL-DILAYANI][ERROR]");
    }

    if (data.length === 0) {
        return Response(res, "Not oke.", null, 201, "[ANTREAN-ALL][DIPANGGIL-DILAYANI][ERROR]");
    }

    let tempDisplay = null;
    for (let i = 0; i < data.length; i++) {
        if (data[i].poliklinik_id.lorong == req.params.hallway) {
            tempDisplay = data[i];
        }        
    }

    if (tempDisplay === null) {
        return Response(res, "Null.", null, 201, "[ANTREAN-ALL][DIPANGGIL-DILAYANI][ERROR]");
    }

    let totalantrean = await _getTotalAntreanByDokter(tanggalperiksa, tempDisplay.kodedokter);
    let sisaantrean = await _getSisaAntreanByDokter(tanggalperiksa, tempDisplay.kodedokter);

    data = {
        antrean : tempDisplay,
        total_antrean : totalantrean.length,
        sisa_antrean : totalantrean.length - sisaantrean.length,
    }

    return Response(res, "Ok", data, 200, "[ANTREAN-ALL][DIPANGGIL-DILAYANI][SUCCESSFULLY]");
}

function groupByKey(array, key) {
    return array
      .reduce((hash, obj) => {
        if(obj[key] === undefined) return hash; 
        return Object.assign(hash, { [obj[key]]:( hash[obj[key]] || [] ).concat(obj)})
      }, {})
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
                status          : req.body.status,
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

        // let deleteAntrianDipanggil = await _deleteAntrianDipanggil("POLI");
        // if (deleteAntrianDipanggil == "ERROR") {
        //     return Response(res, "Internal Server Error", null, 201, "[DELETE-ANTRIAN-DIPANGGIL][ERROR]");
        // }
        // logging.info(`[DELETE-ANTRIAN-DIPANGGIL][SUCCESSFULLY] ${JSON.stringify(deleteAntrianDipanggil)}`);

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

function getPoliklinik() {
    return new Promise(function (resolve, reject) {
        Poliklinik.find({
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function _getOnePoli(_id) {
    return new Promise(function (resolve, reject) {
        Poliklinik.findOne({
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

function getAntrean(_tanggalperiksa, _poli_id, _kodedokter) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.find({
            tanggalperiksa : _tanggalperiksa,
            poliklinik_id : _poli_id,
            kodedokter : _kodedokter,
            taskid : 3,
            status : 'checkin',
        })
        .populate('poliklinik_id')
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function getAllAntrean(_tanggalperiksa) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.find({
            tanggalperiksa : _tanggalperiksa,
            // taskid : 3,
            // status : 'dipanggil',
        })
        .populate('poliklinik_id')
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function _totalAntrean(_tanggalperiksa, _poli_id) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.find({
            tanggalperiksa : _tanggalperiksa,
            poliklinik_id : _poli_id,
            // pasienbaru : 1,
            // status : { $in : ['menunggu', 'checkin', 'dipanggil']},
            // taskid : {  $gt: 0 }
            taskid : { $in : [3,4]},
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function _sisaAntrean(_tanggalperiksa, _poli_id, _kodedokter) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.find({
            tanggalperiksa : _tanggalperiksa,
            poliklinik_id : _poli_id,
            kodedokter : _kodedokter,
            // pasienbaru : 1,
            // status : { $in : ['menunggu', 'checkin', 'dipanggil']},
            // taskid : {  $gt: 5 }
            taskid : { $in : [3,4]},
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

function _getAntreanDipanggilDilayaniByPoli(_tanggalperiksa, _poli_id, _kodedokter) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.findOne({
            tanggalperiksa : _tanggalperiksa,
            poliklinik_id : _poli_id,
            kodedokter : _kodedokter,
            status : { $in : ['dipanggil', 'dilayani']},
            taskid : { $in : [3,4]},
        })
        .populate('poliklinik_id')
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function _getAntreanByPoli(_tanggalperiksa, _poli_id) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.find({
            tanggalperiksa : _tanggalperiksa,
            poliklinik_id : _poli_id,
        })
        .populate('poliklinik_id')
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function _getAntreanDipanggilDilayani(_tanggalperiksa, _poli_id) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.find({
            tanggalperiksa : _tanggalperiksa,
            poliklinik_id : _poli_id,
            status : { $in : ['dipanggil', 'dilayani']},
            taskid : { $in : [3,4]},
        })
        .populate('poliklinik_id')
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function _getAntreanDipanggilDilayaniAll(_tanggalperiksa) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.find({
            tanggalperiksa : _tanggalperiksa,
            // poliklinik_id : _poli_id,
            // status : { $in : ['dipanggil', 'dilayani']},
            taskid : { $in : [3,4]},
        })
        .populate('poliklinik_id')
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function _getAntreanDipanggilDilayaniByDokter(_tanggalperiksa, _kodedokter) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.find({
            tanggalperiksa : _tanggalperiksa,
            kodedokter : _kodedokter,
            // poliklinik_id : _poli_id,
            status : { $in : ['dipanggil', 'dilayani', 'selesai']},
            // taskid : { $in : [4]},
        })
        .populate('poliklinik_id')
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function _getAntreanDipanggilDilayaniDisplayTrue(_tanggalperiksa) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.find({
            tanggalperiksa : _tanggalperiksa,
            status_display : true,
            // taskid : { $in : [3]},
        })
        .populate('poliklinik_id')
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function _getTotalAntreanByDokter(_tanggalperiksa, _kodedokter) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.find({
            tanggalperiksa : _tanggalperiksa,
            kodedokter : _kodedokter,
            // poliklinik_id : _poli_id,
            // status : { $in : ['dipanggil', 'dilayani']},
            taskid : { $in : [3,4,5]},
        })
        .populate('poliklinik_id')
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function _getSisaAntreanByDokter(_tanggalperiksa, _kodedokter) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.find({
            tanggalperiksa : _tanggalperiksa,
            kodedokter : _kodedokter,
            // poliklinik_id : _poli_id,
            // status : { $in : ['dipanggil', 'dilayani']},
            taskid : { $in : [5]},
        })
        .populate('poliklinik_id')
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function _updateAllStatusDisplayToFalse(_tanggalperiksa, _data) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.updateMany({tanggalperiksa : _tanggalperiksa}, _data, {
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

function _updateStatusDisplayToFalse(_id, _data) {
    return new Promise(function (resolve, reject) {
        // AntrianPoliklinik.updateMany({tanggalperiksa : _tanggalperiksa}, _data, {
        //     new: true
        // })
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

function _createAntrianDipanggil(_data) {
    return new Promise(function (resolve, reject) {
        const SaveData = new AntrianDipanggil(_data)
        SaveData.save()
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        })
    });
};

function _getAntrianDipanggil(_jenisantrean, _lorong, _tanggalperiksa) {
    return new Promise(function (resolve, reject) {
        AntrianDipanggil.find({
            jenisantrean : _jenisantrean,
            lorong : _lorong,
            tanggalantrean : _tanggalperiksa,
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function _deleteAntrianDipanggil(_jenisantrean, _lorong) {
    return new Promise(function (resolve, reject) {
        AntrianDipanggil.deleteMany({
            jenisantrean : _jenisantrean,
            lorong : _lorong
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

exports.selesaiPemanggilan = async (req, res) => {
    let deleteAntrianDipanggil = await _deleteAntrianDipanggil("POLI", req.params.lorong);
    if (deleteAntrianDipanggil == "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[DELETE-ANTRIAN-DIPANGGIL][ERROR]");
    }
    return Response(res, "Ok", deleteAntrianDipanggil, 200, "[DELETE-ANTRIAN-DIPANGGIL][SUCCESSFULLY]");
}