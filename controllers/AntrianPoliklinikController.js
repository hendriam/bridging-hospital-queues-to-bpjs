const fs            = require('fs');
const AntrianPoliklinik = require('../models/AntrianPoliklinik.js');
const JadwalDokter      = require('../models/JadwalDokter.js');
const DataDokter        = require('../models/DataDokter.js');
const Poliklinik        = require('../models/Poliklinik.js');
const Pasien            = require('../models/Pasien.js');
const PengaturanSimrs   = require('../models/PengaturanSimrs.js');
const logging           = require('../libs/logging');
const tokenValidator    = require('../utility/ValidationJwt');
const Response          = require('../helpers/response');
const moment            = require('moment');
const sprintf           = require('extsprintf').sprintf;
const needle            = require('needle');
const iniParser         = require('../libs/iniParser');
const AntrianTemp       = require('../models/AntrianTemp.js');

const validateNewPatient        = fs.readFileSync('./data/create_pasien.json', 'utf-8');
const validateGetAntrian        = fs.readFileSync('./data/get_antrian.json', 'utf-8');
const validateGetAntrianUmum    = fs.readFileSync('./data/get_antrian_umum.json', 'utf-8');
const validateBatalAntrian      = fs.readFileSync('./data/batal_antrian.json', 'utf-8');
const validateCheckinAntrian    = fs.readFileSync('./data/checkin.json', 'utf-8');
const validateValidasiAntrian   = fs.readFileSync('./data/validasi_antrian.json', 'utf-8');
const validateRekapAntrian      = fs.readFileSync('./data/rekap_antrian.json', 'utf-8');

const STATUS_ANTRIAN_POLIKLINIK_KOSONG      = "kosong";
const STATUS_ANTRIAN_POLIKLINIK_DIISI       = "diisi";
const STATUS_ANTRIAN_POLIKLINIK_DILAYANI    = "dilayani";
const STATUS_ANTRIAN_POLIKLINIK_SELESAI     = "selesai";
const STATUS_ANTRIAN_POLIKLINIK_TIDAK_ADA   = "tidak ada";
const STATUS_ANTRIAN_POLIKLINIK_DIBATALKAN  = "dibatalkan";

const JENIS_BPJS = "BPJS";
const JENIS_UMUM = "UMUM";

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

exports.home = async (req, res) => {
    return Response(res, "Ok", 'Welcome', 200, "[GET-ANTRIAN][SUCCESSFULLY]");
};

exports.getAntrian = async (req, res) => {
    let config   = iniParser.get();
    logging.info(`[HTTP][REQUEST][HEADER] ${JSON.stringify(req.headers)}`);
    logging.info(`[HTTP][REQUEST][BODY] ${JSON.stringify(req.body)}`);
    logging.info(`[HTTP][REQUEST][PARAMS] ${JSON.stringify(req.params)}`);

    await tokenValidator.Authentication(req, res);
    validateData = ajv.compile(JSON.parse(validateGetAntrian));

    let {
        nomorkartu,
        nik,
        nohp,
        kodepoli,
        norm,
        tanggalperiksa,
        kodedokter,
        jampraktek,
        jeniskunjungan,
        nomorreferensi
    } = req.body;

    dataValidate(req.body)
    .then(async function () {
        if (nomorkartu.length != 13) {
            return Response(res, "Nomor Kartu yang dimasukkan tidak valid", null, 201, "[GET-ANTRIAN][NO-KARTU][AVAILABLE]");
        }

        if (nik.length != 16) {
            return Response(res, "NIK yang dimasukkan tidak valid", null, 201, "[GET-ANTRIAN][NIK][AVAILABLE]");
        }

        if (jeniskunjungan != 1 && jeniskunjungan != 2 && jeniskunjungan != 3 && jeniskunjungan != 4) {
            return Response(res, "Jenis Kunjungan yang dimasukkan tidak valid", null, 201, "[GET-ANTRIAN][JENIS-KUnJUNGAN][AVAILABLE]");
        }

        // let day                 = moment(tanggalperiksa).day();

        // let checkTglPeriksaDanPoli = await getAntrianByTglPeriksaPoliNoKartuNik(tanggalperiksa, kodepoli, nomorkartu, nik, kodedokter);
        // if (checkTglPeriksaDanPoli == "ERROR") {
        //     return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][NO-KARTU][ERROR]");
        // } 
        // if (checkTglPeriksaDanPoli.length > 0) {
        //     let lastAntrian = checkTglPeriksaDanPoli.slice(-1)[0];
        //     if (lastAntrian.status != "batal") {
        //         return Response(res, "Nomor Antrean Hanya Dapat Diambil 1 Kali Pada Tanggal Yang Sama", null, 201, "[GET-ANTRIAN][NO-KARTU][AVAILABLE]");
        //     }
        // }

        // let checkNoKartu = await getAntrianByNoKartu(nomorkartu, tanggalperiksa);
        // if (checkNoKartu == "ERROR") {
        //     return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][NO-KARTU][ERROR]");
        // } else if (checkNoKartu !== null){
        //     return Response(res, "No Kartu yang Dimasukkan Sudah di Gunakan Sebelumnya", null, 201, "[GET-ANTRIAN][NO-KARTU][AVAILABLE]");
        // }

        // let checkNIK = await getAntrianByNIK(nik, tanggalperiksa);
        // if (checkNIK == "ERROR") {
        //     return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][NO-NIK][ERROR]");
        // } else if (checkNIK !== null){
        //     return Response(res, "NIK yang Dimasukkan Sudah di Gunakan Sebelumnya", null, 201, "[GET-ANTRIAN][NO-NIK][AVAILABLE]");
        // }

        // let checkNoReferensi = await getAntrianByNoReferensi(nomorreferensi);
        // if (checkNoReferensi == "ERROR") {
        //     return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][NO-REFERENSI][ERROR]");
        // } else if (checkNoReferensi !== null){
        //     return Response(res, "No Referensi yang Dimasukkan Sudah di Gunakan Sebelumnya", null, 201, "[GET-ANTRIAN][NO-REFERENSI][AVAILABLE]");
        // }

        let poliklinik = await getPoliklinik(kodepoli);
        if (poliklinik == "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][POLIKLINIK][ERROR]");
        } else if(poliklinik === null){
            return Response(res, "Data Poli Tidak Ditemukan", null, 201, "[GET-ANTRIAN][POLIKLINIK][NOT-FOUND]");
        }

        let checkTanggalPeriksa = periksaTanggalFromJkn(tanggalperiksa);
        if (checkTanggalPeriksa.result === false) {
            return Response(res, checkTanggalPeriksa.message, null, 201, "[GET-ANTRIAN][TANGGAL-PERIKSA][NOT-VALID]");
        }

        // let DataDokter = await getDataDokter(kodedokter);
        let TempDataDokter = await requestUrlGet(config.dokter.url);
        if (TempDataDokter == "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][DATA-DOKTER]][ERROR]");
        } else if(TempDataDokter.metadata.code !== 200){
            return Response(res, "Data Dokter Tidak Ditemukan", null, 201, "[GET-ANTRIAN][DATA-DOKTER][NOT-FOUND]");
        }

        let DataDokter = {};
        for (let i = 0; i < TempDataDokter.response.length; i++) {
            if(TempDataDokter.response[i].kodedokter === kodedokter) {
                DataDokter = {
                    nama : TempDataDokter.response[i].namadokter
                }
            }
        }

        // let check_day = await convertTglPeriksaToDay(tanggalperiksa);
        let check_day = moment(tanggalperiksa).day();
        let arr_jampraktek = jampraktek.split("-");

        // let jadwalDokter = await getJadwalDokter(check_day, poliklinik._id, DataDokter._id, arr_jampraktek[0], arr_jampraktek[1]);
        // if (jadwalDokter == "ERROR") {
        //     return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][JADWAL-DOKTER]][ERROR]");
        // } else if(jadwalDokter == null){
        //     return Response(res, `Jadwal Dokter ${DataDokter.nama} Tersebut Belum Tersedia, Silahkan Reschedule Tanggal dan Jam Praktek Lainnya`, null, 201, "[GET-ANTRIAN][JADWAL-DOKTER][NOT-FOUND]");
        // }

        let dataReq = {
            kodepoli:kodepoli,
            tanggal:tanggalperiksa,
        }
        let jadwalDokter = await requestUrl(config.jadwaldokter.url, dataReq);
        if (jadwalDokter === "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[JADWAL-DOKTER][ERROR]");
        }
        if (jadwalDokter.metadata.code != 200) {
            return Response(res, "Pendaftaran ke Poli Ini Sedang Tutup", null, 201, "[JADWAL-DOKTER][FAILED]");
        }
        logging.info(`[JADWAL-DOKTER][SUCCESSFULLY] ${JSON.stringify(jadwalDokter)}`);

        let tempdatadokter = null;
        for (let i = 0; i < jadwalDokter.response.length; i++) {
            if (kodedokter == jadwalDokter.response[i].kodedokter && jampraktek == jadwalDokter.response[i].jadwal) {
                // tempdatadokter.push(jadwalDokter.response[i]);
                tempdatadokter = jadwalDokter.response[i];
            }
        }
        
        if(tempdatadokter == null){
            return Response(res, `Jadwal Dokter ${DataDokter.nama} Tersebut Belum Tersedia, Silahkan Reschedule Tanggal dan Jam Praktek Lainnya`, null, 201, "[GET-ANTRIAN][JADWAL-DOKTER][NOT-FOUND]");
        }
    
        let cekPasien = await getPasienByNoKartu(nomorkartu);
        let pasienBaru = 0;
        if (cekPasien == "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][PASIEN][ERROR]");
        } else if(cekPasien === null){
            return Response(res, "Data pasien ini tidak ditemukan, silahkan Melakukan Registrasi Pasien Baru", null, 202, "[GET-ANTRIAN][PASIEN][NOT-FOUND]");
        }

        if ("pasienbaru" in cekPasien) {
            if (cekPasien.pasienbaru == 1) {
                pasienBaru = 1;
            }
        }

        // cek tanggal periksa, jika sama dengan tanggal hari ini periksa jam, jika >= jam tutup muncul validasi poli tutup. 
        let datetoday = moment().format('YYYY-MM-DD');
        let timetoday = moment().format('HH:mm');
        let timeclose = arr_jampraktek[1];
        if (moment(tanggalperiksa, 'YYYY-MM-DD').format('YYYY-MM-DD').toString() == moment(datetoday, 'YYYY-MM-DD').format('YYYY-MM-DD').toString()) {
            if (moment(timetoday, 'HH:mm').format('HH:mm').toString() >= moment(timeclose, 'HH:mm').format('HH:mm').toString()) {
                return Response(res, `Pendaftaran Ke Poli ${poliklinik.nama} Sudah Tutup Jam ${timeclose}`, null, 201, "[GET-ANTRIAN][NOT-FOUND]");
            }
        }

        let AbjadAntrean = "";
        // tempdatadokter.kodesubspesialis
        // AbjadAntrean = SwitchAbjad(kodepoli);
        AbjadAntrean = SwitchAbjad(tempdatadokter.kodesubspesialis);
        if (AbjadAntrean === null) {
            return Response(res, "Abjad antrean belum tersedia.", null, 201, "[GET-ANTRIAN][ERROR]");
        }

        let _getAntrianByTglPeriksaPoliSubSpesialisNoKartuKodeDokter = await getAntrianByTglPeriksaPoliSubSpesialisNoKartuKodeDokter(tanggalperiksa, tempdatadokter.kodesubspesialis, nomorkartu, kodedokter);
        if (_getAntrianByTglPeriksaPoliSubSpesialisNoKartuKodeDokter == "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][NO-KARTU][ERROR]");
        } 
        if (_getAntrianByTglPeriksaPoliSubSpesialisNoKartuKodeDokter.length > 0) {
            let lastAntrian = _getAntrianByTglPeriksaPoliSubSpesialisNoKartuKodeDokter.slice(-1)[0];
            if (lastAntrian.status != "batal") {
                return Response(res, "Nomor Antrean Hanya Dapat Diambil 1 Kali Pada Tanggal Yang Sama", null, 201, "[GET-ANTRIAN][NO-KARTU][AVAILABLE]");
            }
        }

        let subSpesialis = await getPoliklinik(tempdatadokter.kodesubspesialis);
        if (subSpesialis == "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][SUB-POLIKLINIK][ERROR]");
        } else if(subSpesialis === null){
            return Response(res, "Sub Spesialis Tidak Ditemukan", null, 201, "[GET-ANTRIAN][SUB-POLIKLINIK][NOT-FOUND]");
        }

        let arr_jadwal = tempdatadokter.jadwal.split("-");

        let _kuotajkn = 30;
        let _kuotanonjkn = 30;
        let _sisakuotajkn = 0
        let _sisakuotanonjkn = 0
        let urutantrean;
        let estimasiDilayani = 0;
        let estimasiSelesai = 0;

        // let getAntrian    = await getAntrianPoliklinik(kodepoli, kodedokter, tanggalperiksa, jampraktek);
        let getAntrian    = await getAntrianPoliklinikBySubSpesialisKodeDokterTglPeriksaJamPraktek(tempdatadokter.kodesubspesialis, kodedokter, tanggalperiksa, jampraktek);
        if (getAntrian === "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][GET-ANTRIAN-KOSONG][ERROR]");
        } else if(getAntrian.length == 0){
            
            let tanggaltutup = moment(tanggalperiksa + ' ' + arr_jadwal[1], 'YYYY-MM-DD HH:mm');
            
            let timeStart   = moment(arr_jadwal[1], 'HH:mm').subtract(arr_jadwal[0], 'HH:mm').format("HH:mm");

            let timeFinish = moment(timeStart, 'HH:mm').subtract('00:06', 'HH:mm').format("HH:mm");

            estimasiDilayani = moment(tanggaltutup, 'HH:mm').subtract(timeStart, 'HH:mm').format();

            estimasiSelesai = moment(tanggaltutup, 'HH:mm').subtract(timeFinish, 'HH:mm').format();
           
            urutantrean = 1;
            _sisakuotajkn = _kuotajkn - 1;
            _sisakuotanonjkn = _kuotanonjkn -1;
        } else {

            // let getAntrian2    = await getAntrianPoliklinik2(kodepoli, kodedokter, tanggalperiksa, jampraktek);
            let getAntrian2    = await getAntrianPoliklinikBySubSpesialisKodeDokterTglPeriksaJamPraktek(tempdatadokter.kodesubspesialis, kodedokter, tanggalperiksa, jampraktek);

            let lastAntrian = getAntrian.slice(-1);

            let tanggaltutup = moment(tanggalperiksa + ' ' + arr_jadwal[1], 'YYYY-MM-DD HH:mm');
            
            let timeStart   = moment(arr_jadwal[1], 'HH:mm').subtract(lastAntrian[0].waktu_selesai, 'HH:mm').format("HH:mm");

            let timeFinish = moment(timeStart, 'HH:mm').subtract('00:06', 'HH:mm').format("HH:mm");

            estimasiDilayani = moment(tanggaltutup, 'HH:mm').subtract(timeStart, 'HH:mm').format();

            estimasiSelesai = moment(tanggaltutup, 'HH:mm').subtract(timeFinish, 'HH:mm').format();
            countantrean = getAntrian.length;
            maxangkaantrean = await biggestNumberInArray(getAntrian);
            
            countantrean2 = getAntrian2.length;

            urutantrean = maxangkaantrean + 1;
            // _sisakuotajkn = (_kuotajkn + countantrean2) - urutantrean;
            // _sisakuotanonjkn = (_kuotanonjkn + countantrean2) - urutantrean;

            _sisakuotajkn = _kuotajkn - urutantrean;
            _sisakuotanonjkn = _kuotanonjkn - urutantrean;
        }

        let _angkadokter = 1;
        let lastAngkaAntrian = 0;

        let getAntrianBySubSpesialisTglPeriksa = await _getAntrianBySubSpesialisTglPeriksa(tempdatadokter.kodesubspesialis, tanggalperiksa);
        if (getAntrianBySubSpesialisTglPeriksa.length !== 0) {

            var max = getAntrianBySubSpesialisTglPeriksa.reduce(function(a, b) {
                return Math.max(a.angkadokter, b.angkadokter);
            });

            let getAntrianForKodeBooking = await _getAntrianForKodeBooking(tempdatadokter.kodesubspesialis, kodedokter, tanggalperiksa, jampraktek);
            if (getAntrianForKodeBooking.length !== 0) {
                let lastAntrianForKodeBooking = getAntrianForKodeBooking.slice(-1);
                lastAngkaAntrian = lastAntrianForKodeBooking[0].angkaantrean;
                _angkadokter = lastAntrianForKodeBooking[0].angkadokter;

            } else {
                _angkadokter = max.angkadokter + 1;
            }
        }

        let dataResponse = {};
        // dataResponse.nomorantrean       = AbjadAntrean+"-"+sprintf("%d", urutantrean),
        dataResponse.nomorantrean       = AbjadAntrean+""+_angkadokter+"-"+sprintf("%d", lastAngkaAntrian+1),
        // dataResponse.angkaantrean       = urutantrean
        dataResponse.angkaantrean       = lastAngkaAntrian+1
        // dataResponse.kodebooking        = moment(tanggalperiksa, 'YYYY-MM-DD').format("DDMMYYYY")+AbjadAntrean+sprintf("%03d", urutantrean)
        dataResponse.kodebooking        = moment(tanggalperiksa, 'YYYY-MM-DD').format("DDMMYYYY")+AbjadAntrean+""+_angkadokter+""+sprintf("%03d", lastAngkaAntrian+1)
        dataResponse.norm               = cekPasien.no_rm
        dataResponse.namapoli           = tempdatadokter.namasubspesialis
        dataResponse.namadokter         = tempdatadokter.namadokter
        dataResponse.estimasidilayani   = parseInt(moment(estimasiDilayani).format("x"));
        dataResponse.kuotajkn           = _kuotajkn
        dataResponse.sisakuotajkn       = _sisakuotajkn
        dataResponse.kuotanonjkn        = _kuotanonjkn
        dataResponse.sisakuotanonjkn    = _sisakuotanonjkn
        dataResponse.keterangan         =  pasienBaru === 1 ? "Peserta harap 60 menit lebih awal dari jam praktek guna pencatatan administrasi." : "Peserta harap 60 menit lebih awal dari jam praktek guna pencatatan administrasi."

        let _jenispasien = 'JKN';

        let dataPushAantian = {
            kodebooking     : dataResponse.kodebooking,
            jenispasien     : _jenispasien,
            nomorkartu      : nomorkartu,
            nik             : nik,
            nohp            : nohp,
            kodepoli        : tempdatadokter.kodesubspesialis,
            namapoli        : dataResponse.namapoli,
            pasienbaru      : pasienBaru,
            norm            : cekPasien.no_rm,
            tanggalperiksa  : tanggalperiksa,
            kodedokter      : kodedokter,
            namadokter      : dataResponse.namadokter,
            jampraktek      : jampraktek,
            jeniskunjungan  : jeniskunjungan,
            nomorreferensi  : nomorreferensi,
            nomorantrean    : dataResponse.nomorantrean,
            angkaantrean    : dataResponse.angkaantrean,
            estimasidilayani: dataResponse.estimasidilayani,
            sisakuotajkn    : dataResponse.sisakuotajkn,
            kuotajkn        : dataResponse.kuotajkn,
            sisakuotanonjkn : dataResponse.sisakuotanonjkn,
            kuotanonjkn     : dataResponse.kuotanonjkn,
            keterangan      : dataResponse.keterangan,
        }

        // let addAntrean = await requestUrl(config.addantrean.url, dataPushAantian);
        // if (addAntrean === "ERROR") {
        //     return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][GET-ANTRIAN-KOSONG][ERROR]");
        // }
        // if (addAntrean.metadata.code != 200) {
        //     return Response(res, addAntrean.metadata.message, null, 201, "[PUSH-ANTRIAN][FAILED]");
        // }
        // logging.info(`[PUSH-ANTRIAN][SUCCESSFULLY] ${JSON.stringify(addAntrean)}`);

        let dataCreateAntrian = {
            nomorkartu      : nomorkartu,
            nik             : nik,
            nohp            : nohp,
            poliklinik_id   : subSpesialis._id,
            kodepoli        : kodepoli,
            kodesubpoli     : tempdatadokter.kodesubspesialis,
            norm            : cekPasien.no_rm,
            tanggalperiksa  : tanggalperiksa,
            // dokter_id       : DataDokter._id,
            namadokter      : DataDokter.nama,
            kodedokter      : kodedokter,
            jampraktek      : jampraktek,
            jeniskunjungan  : jeniskunjungan,
            nomorreferensi  : nomorreferensi,
            hurufantrean    : AbjadAntrean,
            nomorantrean    : dataResponse.nomorantrean,
            angkaantrean    : dataResponse.angkaantrean,
            angkadokter     : _angkadokter,
            kodebooking     : dataResponse.kodebooking,
            estimasidilayani: dataResponse.estimasidilayani,
            waktu_dilayani  : moment(estimasiDilayani).format("HH:mm"),
            waktu_selesai   : moment(estimasiSelesai).format("HH:mm"),
            waktu_checkin   : null,

            waktu_tunggu_admisi     : null,
            waktu_dilayani_admisi   : null,
            waktu_tunggu_poli       : null,
            waktu_dilayani_poli     : null,
            waktu_tunggu_farmasi    : null,
            waktu_dilayani_farmasi  : null,
            waktu_dilayani_selesai  : null,

            waktu_dipanggil_admisi  : null,
            waktu_dipanggil_poli  : null,
            waktu_dipanggil_farmasi  : null,

            waktu_batal             : null,
            // kuotajkn        : dataResponse.kuotajkn,
            // sisakuotajkn    : dataResponse.sisakuotajkn,
            // kuotanonjkn     : dataResponse.kuotanonjkn,
            // sisakuotanonjkn : dataResponse.sisakuotanonjkn,
            jenispasien     : _jenispasien,
            pasienbaru      : pasienBaru,
            keterangan      : dataResponse.keterangan,
            status          : 'menunggu',
            taskid          : 0,
            loket_id        : null,
            loket_farmasi_id: null,
            status_display  : false,
            jenisantrean    : "mjkn",
            createdAt       : moment().format("YYYY-MM-DD HH:mm:ss"),
            updatedAt       : moment().format("YYYY-MM-DD HH:mm:ss"),
        }

        let createAntrianPoli = await createAntrianPoliklinik(dataCreateAntrian);
        if (createAntrianPoli == "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][ERROR]");
        }

        return Response(res, "Ok", dataResponse, 200, "[GET-ANTRIAN][SUCCESSFULLY]");
    })
    .catch(function (err) {
        console.log(err);
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

        return Response(res, "Validation Form Error", data, 422, `[GET-ANTRIAN][VALIDATION][FORM][ERROR] ${err.message}`);
    });
};

exports.getAntrianUmum = async (req, res) => {
    let config   = iniParser.get();
    logging.info(`[HTTP][REQUEST][HEADER] ${JSON.stringify(req.headers)}`);
    logging.info(`[HTTP][REQUEST][BODY] ${JSON.stringify(req.body)}`);
    logging.info(`[HTTP][REQUEST][PARAMS] ${JSON.stringify(req.params)}`);

    await tokenValidator.Authentication(req, res);
    validateData = ajv.compile(JSON.parse(validateGetAntrianUmum));

    let {
        nomorkartu,
        nik,
        nohp,
        kodepoli,
        norm,
        tanggalperiksa,
        kodedokter,
        jampraktek,
        jeniskunjungan,
        nomorreferensi
    } = req.body;

    dataValidate(req.body)
    .then(async function () {
        if (nik.length != 16) {
            return Response(res, "NIK yang dimasukkan tidak valid", null, 201, "[GET-ANTRIAN][NIK][AVAILABLE]");
        }

        if (jeniskunjungan != 1 && jeniskunjungan != 2 && jeniskunjungan != 3 && jeniskunjungan != 4) {
            return Response(res, "Jenis Kunjungan yang dimasukkan tidak valid", null, 201, "[GET-ANTRIAN][JENIS-KUnJUNGAN][AVAILABLE]");
        }

        // let day                 = moment(tanggalperiksa).day();

        // let checkTglPeriksaDanPoli = await getAntrianByTglPeriksaPoliNik(tanggalperiksa, kodepoli, nik, kodedokter);
        // if (checkTglPeriksaDanPoli == "ERROR") {
        //     return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][NO-KARTU][ERROR]");
        // } 
        // if (checkTglPeriksaDanPoli.length > 0) {
        //     let lastAntrian = checkTglPeriksaDanPoli.slice(-1)[0];
        //     if (lastAntrian.status != "batal") {
        //         return Response(res, "Nomor Antrean Hanya Dapat Diambil 1 Kali Pada Tanggal Yang Sama", null, 201, "[GET-ANTRIAN][NO-KARTU][AVAILABLE]");
        //     }
        // }

        // let checkNoKartu = await getAntrianByNoKartu(nomorkartu, tanggalperiksa);
        // if (checkNoKartu == "ERROR") {
        //     return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][NO-KARTU][ERROR]");
        // } else if (checkNoKartu !== null){
        //     return Response(res, "No Kartu yang Dimasukkan Sudah di Gunakan Sebelumnya", null, 201, "[GET-ANTRIAN][NO-KARTU][AVAILABLE]");
        // }

        // let checkNIK = await getAntrianByNIK(nik, tanggalperiksa);
        // if (checkNIK == "ERROR") {
        //     return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][NO-NIK][ERROR]");
        // } else if (checkNIK !== null){
        //     return Response(res, "NIK yang Dimasukkan Sudah di Gunakan Sebelumnya", null, 201, "[GET-ANTRIAN][NO-NIK][AVAILABLE]");
        // }

        // let checkNoReferensi = await getAntrianByNoReferensi(nomorreferensi);
        // if (checkNoReferensi == "ERROR") {
        //     return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][NO-REFERENSI][ERROR]");
        // } else if (checkNoReferensi !== null){
        //     return Response(res, "No Referensi yang Dimasukkan Sudah di Gunakan Sebelumnya", null, 201, "[GET-ANTRIAN][NO-REFERENSI][AVAILABLE]");
        // }

        let poliklinik = await getPoliklinik(kodepoli);
        if (poliklinik == "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][POLIKLINIK][ERROR]");
        } else if(poliklinik === null){
            return Response(res, "Data Poli Tidak Ditemukan", null, 201, "[GET-ANTRIAN][POLIKLINIK][NOT-FOUND]");
        }

        let checkTanggalPeriksa = periksaTanggalFromJkn(tanggalperiksa);
        if (checkTanggalPeriksa.result === false) {
            return Response(res, checkTanggalPeriksa.message, null, 201, "[GET-ANTRIAN][TANGGAL-PERIKSA][NOT-VALID]");
        }

        // let DataDokter = await getDataDokter(kodedokter);
        let TempDataDokter = await requestUrlGet(config.dokter.url);
        if (TempDataDokter == "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][DATA-DOKTER]][ERROR]");
        } else if(TempDataDokter.metadata.code !== 200){
            return Response(res, "Data Dokter Tidak Ditemukan", null, 201, "[GET-ANTRIAN][DATA-DOKTER][NOT-FOUND]");
        }

        let DataDokter = {};
        for (let i = 0; i < TempDataDokter.response.length; i++) {
            if(TempDataDokter.response[i].kodedokter === kodedokter) {
                DataDokter = {
                    nama : TempDataDokter.response[i].namadokter
                }
            }
        }

        // if (DataDokter == "ERROR") {
        //     return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][DATA-DOKTER]][ERROR]");
        // } else if(DataDokter === null){
        //     return Response(res, "Data Dokter Tidak Ditemukan", null, 201, "[GET-ANTRIAN][DATA-DOKTER][NOT-FOUND]");
        // }

        // let check_day = await convertTglPeriksaToDay(tanggalperiksa);
        let check_day = moment(tanggalperiksa).day();
        let arr_jampraktek = jampraktek.split("-");

        // let jadwalDokter = await getJadwalDokter(check_day, poliklinik._id, DataDokter._id, arr_jampraktek[0], arr_jampraktek[1]);
        // if (jadwalDokter == "ERROR") {
        //     return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][JADWAL-DOKTER]][ERROR]");
        // } else if(jadwalDokter == null){
        //     return Response(res, `Jadwal Dokter ${DataDokter.nama} Tersebut Belum Tersedia, Silahkan Reschedule Tanggal dan Jam Praktek Lainnya`, null, 201, "[GET-ANTRIAN][JADWAL-DOKTER][NOT-FOUND]");
        // }

        let dataReq = {
            kodepoli:kodepoli,
            tanggal:tanggalperiksa,
        }
        let jadwalDokter = await requestUrl(config.jadwaldokter.url, dataReq);
        if (jadwalDokter === "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[JADWAL-DOKTER][ERROR]");
        }
        if (jadwalDokter.metadata.code != 200) {
            return Response(res, "Pendaftaran ke Poli Ini Sedang Tutup", null, 201, "[JADWAL-DOKTER][FAILED]");
        }
        logging.info(`[JADWAL-DOKTER][SUCCESSFULLY] ${JSON.stringify(jadwalDokter)}`);

        let tempdatadokter = null;
        for (let i = 0; i < jadwalDokter.response.length; i++) {
            if (kodedokter == jadwalDokter.response[i].kodedokter && jampraktek == jadwalDokter.response[i].jadwal) {
                // tempdatadokter.push(jadwalDokter.response[i]);
                tempdatadokter = jadwalDokter.response[i];
            }
        }
        
        if(tempdatadokter == null){
            return Response(res, `Jadwal Dokter ${DataDokter.nama} Tersebut Belum Tersedia, Silahkan Reschedule Tanggal dan Jam Praktek Lainnya`, null, 201, "[GET-ANTRIAN][JADWAL-DOKTER][NOT-FOUND]");
        }
    
        let cekPasien = await getPasienByNik(nik);
        let pasienBaru = 0;
        if (cekPasien == "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][PASIEN][ERROR]");
        } else if(cekPasien === null){
            return Response(res, "Data pasien ini tidak ditemukan, silahkan Melakukan Registrasi Pasien Baru", null, 202, "[GET-ANTRIAN][PASIEN][NOT-FOUND]");
        }

        if ("pasienbaru" in cekPasien) {
            if (cekPasien.pasienbaru == 1) {
                pasienBaru = 1;
            }
        }

        // cek tanggal periksa, jika sama dengan tanggal hari ini periksa jam, jika >= jam tutup muncul validasi poli tutup. 
        let datetoday = moment().format('YYYY-MM-DD');
        let timetoday = moment().format('HH:mm');
        let timeclose = arr_jampraktek[1];
        if (moment(tanggalperiksa, 'YYYY-MM-DD').format('YYYY-MM-DD').toString() == moment(datetoday, 'YYYY-MM-DD').format('YYYY-MM-DD').toString()) {
            if (moment(timetoday, 'HH:mm').format('HH:mm').toString() >= moment(timeclose, 'HH:mm').format('HH:mm').toString()) {
                return Response(res, `Pendaftaran Ke Poli ${poliklinik.nama} Sudah Tutup Jam ${timeclose}`, null, 201, "[GET-ANTRIAN][NOT-FOUND]");
            }
        }

        let AbjadAntrean = "";
        // tempdatadokter.kodesubspesialis
        // AbjadAntrean = SwitchAbjad(kodepoli);
        AbjadAntrean = SwitchAbjad(tempdatadokter.kodesubspesialis);
        if (AbjadAntrean === null) {
            return Response(res, "Abjad antrean belum tersedia.", null, 201, "[GET-ANTRIAN][ERROR]");
        }

        let _getAntrianByTglPeriksaPoliSubSpesialisNikKodeDokter = await getAntrianByTglPeriksaPoliSubSpesialisNikKodeDokter(tanggalperiksa, tempdatadokter.kodesubspesialis, nik, kodedokter);
        if (_getAntrianByTglPeriksaPoliSubSpesialisNikKodeDokter == "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][NO-KARTU][ERROR]");
        } 
        if (_getAntrianByTglPeriksaPoliSubSpesialisNikKodeDokter.length > 0) {
            let lastAntrian = _getAntrianByTglPeriksaPoliSubSpesialisNikKodeDokter.slice(-1)[0];
            if (lastAntrian.status != "batal") {
                return Response(res, "Nomor Antrean Hanya Dapat Diambil 1 Kali Pada Tanggal Yang Sama", null, 201, "[GET-ANTRIAN][NO-KARTU][AVAILABLE]");
            }
        }

        let subSpesialis = await getPoliklinik(tempdatadokter.kodesubspesialis);
        if (subSpesialis == "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][SUB-POLIKLINIK][ERROR]");
        } else if(subSpesialis === null){
            return Response(res, "Sub Spesialis Tidak Ditemukan", null, 201, "[GET-ANTRIAN][SUB-POLIKLINIK][NOT-FOUND]");
        }

        let arr_jadwal = tempdatadokter.jadwal.split("-");

        let _kuotajkn = 30;
        let _kuotanonjkn = 30;
        let _sisakuotajkn = 0
        let _sisakuotanonjkn = 0
        let urutantrean;
        let estimasiDilayani = 0;
        let estimasiSelesai = 0;

        // let getAntrian    = await getAntrianPoliklinik(kodepoli, kodedokter, tanggalperiksa, jampraktek);
        let getAntrian    = await getAntrianPoliklinikBySubSpesialisKodeDokterTglPeriksaJamPraktek(tempdatadokter.kodesubspesialis, kodedokter, tanggalperiksa, jampraktek);
        if (getAntrian === "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][GET-ANTRIAN-KOSONG][ERROR]");
        } else if(getAntrian.length == 0){
            
            let tanggaltutup = moment(tanggalperiksa + ' ' + arr_jadwal[1], 'YYYY-MM-DD HH:mm');
            
            let timeStart   = moment(arr_jadwal[1], 'HH:mm').subtract(arr_jadwal[0], 'HH:mm').format("HH:mm");

            let timeFinish = moment(timeStart, 'HH:mm').subtract('00:06', 'HH:mm').format("HH:mm");

            estimasiDilayani = moment(tanggaltutup, 'HH:mm').subtract(timeStart, 'HH:mm').format();

            estimasiSelesai = moment(tanggaltutup, 'HH:mm').subtract(timeFinish, 'HH:mm').format();
        
            urutantrean = 1;
            _sisakuotajkn = _kuotajkn - 1;
            _sisakuotanonjkn = _kuotanonjkn -1;
        } else {

            // let getAntrian2    = await getAntrianPoliklinik2(kodepoli, kodedokter, tanggalperiksa, jampraktek);
            let getAntrian2    = await getAntrianPoliklinikBySubSpesialisKodeDokterTglPeriksaJamPraktek(tempdatadokter.kodesubspesialis, kodedokter, tanggalperiksa, jampraktek);

            let lastAntrian = getAntrian.slice(-1);

            let tanggaltutup = moment(tanggalperiksa + ' ' + arr_jadwal[1], 'YYYY-MM-DD HH:mm');
            
            let timeStart   = moment(arr_jadwal[1], 'HH:mm').subtract(lastAntrian[0].waktu_selesai, 'HH:mm').format("HH:mm");

            let timeFinish = moment(timeStart, 'HH:mm').subtract('00:06', 'HH:mm').format("HH:mm");

            estimasiDilayani = moment(tanggaltutup, 'HH:mm').subtract(timeStart, 'HH:mm').format();

            estimasiSelesai = moment(tanggaltutup, 'HH:mm').subtract(timeFinish, 'HH:mm').format();
            countantrean = getAntrian.length;
            maxangkaantrean = await biggestNumberInArray(getAntrian);
            
            countantrean2 = getAntrian2.length;

            urutantrean = maxangkaantrean + 1;
            // _sisakuotajkn = (_kuotajkn + countantrean2) - urutantrean;
            // _sisakuotanonjkn = (_kuotanonjkn + countantrean2) - urutantrean;

            _sisakuotajkn = _kuotajkn - urutantrean;
            _sisakuotanonjkn = _kuotanonjkn - urutantrean;
        }

        let _angkadokter = 1;
        let lastAngkaAntrian = 0;

        let getAntrianBySubSpesialisTglPeriksa = await _getAntrianBySubSpesialisTglPeriksa(tempdatadokter.kodesubspesialis, tanggalperiksa);
        if (getAntrianBySubSpesialisTglPeriksa.length !== 0) {

            var max = getAntrianBySubSpesialisTglPeriksa.reduce(function(a, b) {
                return Math.max(a.angkadokter, b.angkadokter);
            });

            let getAntrianForKodeBooking = await _getAntrianForKodeBooking(tempdatadokter.kodesubspesialis, kodedokter, tanggalperiksa, jampraktek);
            if (getAntrianForKodeBooking.length !== 0) {
                let lastAntrianForKodeBooking = getAntrianForKodeBooking.slice(-1);
                lastAngkaAntrian = lastAntrianForKodeBooking[0].angkaantrean;
                _angkadokter = lastAntrianForKodeBooking[0].angkadokter;

            } else {
                _angkadokter = max.angkadokter + 1;
            }
        }

        let dataResponse = {};
        // dataResponse.nomorantrean       = AbjadAntrean+"-"+sprintf("%d", urutantrean),
        dataResponse.nomorantrean       = AbjadAntrean+""+_angkadokter+"-"+sprintf("%d", lastAngkaAntrian+1),
        // dataResponse.angkaantrean       = urutantrean
        dataResponse.angkaantrean       = lastAngkaAntrian+1
        // dataResponse.kodebooking        = moment(tanggalperiksa, 'YYYY-MM-DD').format("DDMMYYYY")+AbjadAntrean+sprintf("%03d", urutantrean)
        dataResponse.kodebooking        = moment(tanggalperiksa, 'YYYY-MM-DD').format("DDMMYYYY")+AbjadAntrean+""+_angkadokter+""+sprintf("%03d", lastAngkaAntrian+1)
        dataResponse.norm               = cekPasien.no_rm
        dataResponse.namapoli           = tempdatadokter.namasubspesialis
        dataResponse.namadokter         = tempdatadokter.namadokter
        dataResponse.estimasidilayani   = parseInt(moment(estimasiDilayani).format("x"));
        dataResponse.kuotajkn           = _kuotajkn
        dataResponse.sisakuotajkn       = _sisakuotajkn
        dataResponse.kuotanonjkn        = _kuotanonjkn
        dataResponse.sisakuotanonjkn    = _sisakuotanonjkn
        dataResponse.keterangan         =  pasienBaru === 1 ? "Peserta harap 60 menit lebih awal dari jam praktek guna pencatatan administrasi." : "Peserta harap 60 menit lebih awal dari jam praktek guna pencatatan administrasi."
 
        let _jenispasien = 'NON JKN';

        let dataPushAantian = {
            kodebooking     : dataResponse.kodebooking,
            jenispasien     : _jenispasien,
            nomorkartu      : nomorkartu,
            nik             : nik,
            nohp            : nohp,
            kodepoli        : tempdatadokter.kodesubspesialis,
            namapoli        : dataResponse.namapoli,
            pasienbaru      : pasienBaru,
            norm            : cekPasien.no_rm,
            tanggalperiksa  : tanggalperiksa,
            kodedokter      : kodedokter,
            namadokter      : dataResponse.namadokter,
            jampraktek      : jampraktek,
            jeniskunjungan  : jeniskunjungan,
            nomorreferensi  : nomorreferensi,
            nomorantrean    : dataResponse.nomorantrean,
            angkaantrean    : dataResponse.angkaantrean,
            estimasidilayani: dataResponse.estimasidilayani,
            sisakuotajkn    : dataResponse.sisakuotajkn,
            kuotajkn        : dataResponse.kuotajkn,
            sisakuotanonjkn : dataResponse.sisakuotanonjkn,
            kuotanonjkn     : dataResponse.kuotanonjkn,
            keterangan      : dataResponse.keterangan,
        }

        // let addAntrean = await requestUrl(config.addantrean.url, dataPushAantian);
        // if (addAntrean === "ERROR") {
        //     return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][GET-ANTRIAN-KOSONG][ERROR]");
        // }
        // if (addAntrean.metadata.code != 200) {
        //     return Response(res, addAntrean.metadata.message, null, 201, "[PUSH-ANTRIAN][FAILED]");
        // }
        // logging.info(`[PUSH-ANTRIAN][SUCCESSFULLY] ${JSON.stringify(addAntrean)}`);

        let dataCreateAntrian = {
            nomorkartu      : nomorkartu,
            nik             : nik,
            nohp            : nohp,
            poliklinik_id   : subSpesialis._id,
            kodepoli        : kodepoli,
            kodesubpoli     : tempdatadokter.kodesubspesialis,
            norm            : cekPasien.no_rm,
            tanggalperiksa  : tanggalperiksa,
            // dokter_id       : DataDokter._id,
            namadokter      : DataDokter.nama,
            kodedokter      : kodedokter,
            jampraktek      : jampraktek,
            jeniskunjungan  : jeniskunjungan,
            nomorreferensi  : nomorreferensi,
            hurufantrean    : AbjadAntrean,
            nomorantrean    : dataResponse.nomorantrean,
            angkaantrean    : dataResponse.angkaantrean,
            angkadokter     : _angkadokter,
            kodebooking     : dataResponse.kodebooking,
            estimasidilayani: dataResponse.estimasidilayani,
            waktu_dilayani  : moment(estimasiDilayani).format("HH:mm"),
            waktu_selesai   : moment(estimasiSelesai).format("HH:mm"),
            waktu_checkin   : null,

            waktu_tunggu_admisi     : null,
            waktu_dilayani_admisi   : null,
            waktu_tunggu_poli       : null,
            waktu_dilayani_poli     : null,
            waktu_tunggu_farmasi    : null,
            waktu_dilayani_farmasi  : null,
            waktu_dilayani_selesai  : null,

            waktu_dipanggil_admisi  : null,
            waktu_dipanggil_poli  : null,
            waktu_dipanggil_farmasi  : null,

            waktu_batal             : null,
            // kuotajkn        : dataResponse.kuotajkn,
            // sisakuotajkn    : dataResponse.sisakuotajkn,
            // kuotanonjkn     : dataResponse.kuotanonjkn,
            // sisakuotanonjkn : dataResponse.sisakuotanonjkn,
            jenispasien     : _jenispasien,
            pasienbaru      : pasienBaru,
            keterangan      : dataResponse.keterangan,
            status          : 'menunggu',
            taskid          : 0,
            loket_id        : null,
            loket_farmasi_id: null,
            status_display  : false,
            jenisantrean    : "mjkn",
            createdAt       : moment().format("YYYY-MM-DD HH:mm:ss"),
            updatedAt       : moment().format("YYYY-MM-DD HH:mm:ss"),
        }

        let createAntrianPoli = await createAntrianPoliklinik(dataCreateAntrian);
        if (createAntrianPoli == "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][ERROR]");
        }

        return Response(res, "Ok", dataResponse, 200, "[GET-ANTRIAN][SUCCESSFULLY]");
    })
    .catch(function (err) {
        console.log(err);
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

        return Response(res, "Validation Form Error", data, 422, `[GET-ANTRIAN][VALIDATION][FORM][ERROR] ${err.message}`);
    });
};

exports.getAntrianOnSite = async (req, res) => {
    let config   = iniParser.get();
    logging.info(`[HTTP][REQUEST][HEADER] ${JSON.stringify(req.headers)}`);
    logging.info(`[HTTP][REQUEST][BODY] ${JSON.stringify(req.body)}`);
    logging.info(`[HTTP][REQUEST][PARAMS] ${JSON.stringify(req.params)}`);

    await tokenValidator.Authentication(req, res);

    let {
        nomorkartu,
        nik,
        nohp,
        kodepoli,
        norm,
        tanggalperiksa,
        kodedokter,
        jampraktek,
        jeniskunjungan,
        nomorreferensi
    } = req.body;

    let getAntreanTemp = await _getOneAntrianTemp(req.body.antrian_temp_id);
    if (getAntreanTemp.kodebooking === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][ANTRIAN-KOSONG][ERROR]");
    }
    if (getAntreanTemp == null){
        return Response(res, "Antrean tidak ditemukan", null, 201, "[GET-ANTRIAN][ANTRIAN-KOSONG][ERROR]");
    }
    if (typeof getAntreanTemp.kodebooking !== "undefined" || getAntreanTemp.hasOwnProperty('undefined')) {
        return Response(res, "Kode booking sudah ada.", null, 201, "[GET-ANTRIAN][ANTRIAN-KOSONG][ERROR]");
    }

    if (nomorkartu.length != 13) {
        return Response(res, "Nomor Kartu yang dimasukkan tidak valid", null, 201, "[GET-ANTRIAN][NO-KARTU][AVAILABLE]");
    }

    // if (nik.length != 16) {
    //     return Response(res, "NIK yang dimasukkan tidak valid", null, 201, "[GET-ANTRIAN][NIK][AVAILABLE]");
    // }

    // if (norm.length != 6) {
    //     return Response(res, "RM yang dimasukkan tidak valid", null, 201, "[GET-ANTRIAN][RM][AVAILABLE]");
    // }

    if (jeniskunjungan != 1 && jeniskunjungan != 2 && jeniskunjungan != 3 && jeniskunjungan != 4) {
        return Response(res, "Jenis Kunjungan yang dimasukkan tidak valid", null, 201, "[GET-ANTRIAN][JENIS-KUnJUNGAN][AVAILABLE]");
    }

    // let checkTglPeriksaDanPoli = await getAntrianByTglPeriksaPoliNoKartu(tanggalperiksa, kodepoli, nomorkartu, kodedokter);
    // if (checkTglPeriksaDanPoli == "ERROR") {
    //     return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][NO-KARTU][ERROR]");
    // } 
    // if (checkTglPeriksaDanPoli.length > 0) {
    //     let lastAntrian = checkTglPeriksaDanPoli.slice(-1)[0];
    //     if (lastAntrian.status != "batal") {
    //         return Response(res, "Nomor Antrean Hanya Dapat Diambil 1 Kali Pada Tanggal Yang Sama", null, 201, "[GET-ANTRIAN][NO-KARTU][AVAILABLE]");
    //     }
    // }

    let poliklinik = await getPoliklinik(kodepoli);
    if (poliklinik == "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][POLIKLINIK][ERROR]");
    } else if(poliklinik === null){
        return Response(res, "Data Poli Tidak Ditemukan", null, 201, "[GET-ANTRIAN][POLIKLINIK][NOT-FOUND]");
    }

    let checkTanggalPeriksa = periksaTanggal(tanggalperiksa);
    if (checkTanggalPeriksa.result === false) {
        return Response(res, checkTanggalPeriksa.message, null, 201, "[GET-ANTRIAN][TANGGAL-PERIKSA][NOT-VALID]");
    }

    // let DataDokter = await getDataDokter(kodedokter);
    let TempDataDokter = await requestUrlGet(config.dokter.url);
    if (TempDataDokter == "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][DATA-DOKTER]][ERROR]");
    } else if(TempDataDokter.metadata.code !== 200){
        return Response(res, "Data Dokter Tidak Ditemukan", null, 201, "[GET-ANTRIAN][DATA-DOKTER][NOT-FOUND]");
    }

    let DataDokter = {};
    for (let i = 0; i < TempDataDokter.response.length; i++) {
        if(TempDataDokter.response[i].kodedokter === kodedokter) {
            DataDokter = {
                nama : TempDataDokter.response[i].namadokter
            }
        }
    }
   
    let check_day = moment(tanggalperiksa).day();
    let arr_jampraktek = jampraktek.split("-");

    let dataReq = {
        kodepoli:kodepoli,
        tanggal:tanggalperiksa,
    }
    let jadwalDokter = await requestUrl(config.jadwaldokter.url, dataReq);
    if (jadwalDokter === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[JADWAL-DOKTER][ERROR]");
    }
    if (jadwalDokter.metadata.code != 200) {
        return Response(res, "Pendaftaran ke Poli Ini Sedang Tutup", null, 201, "[JADWAL-DOKTER][FAILED]");
    }
    logging.info(`[JADWAL-DOKTER][SUCCESSFULLY] ${JSON.stringify(jadwalDokter)}`);

    let tempdatadokter = null;
    for (let i = 0; i < jadwalDokter.response.length; i++) {
        if (kodedokter == jadwalDokter.response[i].kodedokter && jampraktek == jadwalDokter.response[i].jadwal) {
            tempdatadokter = jadwalDokter.response[i];
        }
    }
    
    if(tempdatadokter == null){
        return Response(res, `Jadwal Dokter ${DataDokter.nama} Tersebut Belum Tersedia, Silahkan Reschedule Tanggal dan Jam Praktek Lainnya`, null, 201, "[GET-ANTRIAN][JADWAL-DOKTER][NOT-FOUND]");
    }

    let cekPasien = await getPasienByNoKartu(nomorkartu);

    let pasienBaru = 0;
    if (cekPasien == "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][PASIEN][ERROR]");
    } else if(cekPasien === null){
        return Response(res, "Data pasien ini tidak ditemukan, silahkan Melakukan Registrasi Pasien Baru", null, 202, "[GET-ANTRIAN][PASIEN][NOT-FOUND]");
    }

    if ("pasienbaru" in cekPasien) {
        if (cekPasien.pasienbaru == 1) {
            pasienBaru = 1;
        }
    }

    // cek tanggal periksa, jika sama dengan tanggal hari ini periksa jam, jika >= jam tutup muncul validasi poli tutup. 
    let datetoday = moment().format('YYYY-MM-DD');
    let timetoday = moment().format('HH:mm');
    let timeclose = arr_jampraktek[1];
    if (moment(tanggalperiksa, 'YYYY-MM-DD').format('YYYY-MM-DD').toString() == moment(datetoday, 'YYYY-MM-DD').format('YYYY-MM-DD').toString()) {
        if (moment(timetoday, 'HH:mm').format('HH:mm').toString() >= moment(timeclose, 'HH:mm').format('HH:mm').toString()) {
            return Response(res, `Pendaftaran Ke Poli ${poliklinik.nama} Sudah Tutup Jam ${timeclose}`, null, 201, "[GET-ANTRIAN][NOT-FOUND]");
        }
    }

    let AbjadAntrean = "";
    // tempdatadokter.kodesubspesialis
    // AbjadAntrean = SwitchAbjad(kodepoli);
    AbjadAntrean = SwitchAbjad(tempdatadokter.kodesubspesialis);
    if (AbjadAntrean === null) {
        return Response(res, "Abjad antrean belum tersedia.", null, 201, "[GET-ANTRIAN][ERROR]");
    }

    let _getAntrianByTglPeriksaPoliSubSpesialisNoKartuKodeDokter = await getAntrianByTglPeriksaPoliSubSpesialisNoKartuKodeDokter(tanggalperiksa, tempdatadokter.kodesubspesialis, nomorkartu, kodedokter);
    if (_getAntrianByTglPeriksaPoliSubSpesialisNoKartuKodeDokter == "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][NO-KARTU][ERROR]");
    } 
    if (_getAntrianByTglPeriksaPoliSubSpesialisNoKartuKodeDokter.length > 0) {
        let lastAntrian = _getAntrianByTglPeriksaPoliSubSpesialisNoKartuKodeDokter.slice(-1)[0];
        if (lastAntrian.status != "batal") {
            return Response(res, "Nomor Antrean Hanya Dapat Diambil 1 Kali Pada Tanggal Yang Sama", null, 201, "[GET-ANTRIAN][NO-KARTU][AVAILABLE]");
        }
    }

    let subSpesialis = await getPoliklinik(tempdatadokter.kodesubspesialis);
    if (subSpesialis == "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][SUB-POLIKLINIK][ERROR]");
    } else if(subSpesialis === null){
        return Response(res, "Sub Spesialis Tidak Ditemukan", null, 201, "[GET-ANTRIAN][SUB-POLIKLINIK][NOT-FOUND]");
    }

    let arr_jadwal = tempdatadokter.jadwal.split("-");

    let _kuotajkn = 30;
    let _kuotanonjkn = 30;
    let _sisakuotajkn = 0
    let _sisakuotanonjkn = 0
    let urutantrean;
    let estimasiDilayani = 0;
    let estimasiSelesai = 0;

    // let getAntrian    = await getAntrianPoliklinik(kodepoli, kodedokter, tanggalperiksa, jampraktek);
    let getAntrian    = await getAntrianPoliklinikBySubSpesialisKodeDokterTglPeriksaJamPraktek(tempdatadokter.kodesubspesialis, kodedokter, tanggalperiksa, jampraktek);
    if (getAntrian === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][GET-ANTRIAN-KOSONG][ERROR]");
    } else if(getAntrian.length == 0){
        
        let tanggaltutup = moment(tanggalperiksa + ' ' + arr_jadwal[1], 'YYYY-MM-DD HH:mm');
        
        let timeStart   = moment(arr_jadwal[1], 'HH:mm').subtract(arr_jadwal[0], 'HH:mm').format("HH:mm");

        let timeFinish = moment(timeStart, 'HH:mm').subtract('00:06', 'HH:mm').format("HH:mm");

        estimasiDilayani = moment(tanggaltutup, 'HH:mm').subtract(timeStart, 'HH:mm').format();

        estimasiSelesai = moment(tanggaltutup, 'HH:mm').subtract(timeFinish, 'HH:mm').format();
       
        urutantrean = 1;
        _sisakuotajkn = _kuotajkn - 1;
        _sisakuotanonjkn = _kuotanonjkn -1;
    } else {

        // let getAntrian2    = await getAntrianPoliklinik2(kodepoli, kodedokter, tanggalperiksa, jampraktek);
        let getAntrian2    = await getAntrianPoliklinikBySubSpesialisKodeDokterTglPeriksaJamPraktek(tempdatadokter.kodesubspesialis, kodedokter, tanggalperiksa, jampraktek);

        let lastAntrian = getAntrian.slice(-1);

        let tanggaltutup = moment(tanggalperiksa + ' ' + arr_jadwal[1], 'YYYY-MM-DD HH:mm');
        
        let timeStart   = moment(arr_jadwal[1], 'HH:mm').subtract(lastAntrian[0].waktu_selesai, 'HH:mm').format("HH:mm");

        let timeFinish = moment(timeStart, 'HH:mm').subtract('00:06', 'HH:mm').format("HH:mm");

        estimasiDilayani = moment(tanggaltutup, 'HH:mm').subtract(timeStart, 'HH:mm').format();

        estimasiSelesai = moment(tanggaltutup, 'HH:mm').subtract(timeFinish, 'HH:mm').format();
        countantrean = getAntrian.length;
        maxangkaantrean = await biggestNumberInArray(getAntrian);
        
        countantrean2 = getAntrian2.length;

        urutantrean = maxangkaantrean + 1;
        _sisakuotajkn = (_kuotajkn + countantrean2) - urutantrean;
        _sisakuotanonjkn = (_kuotanonjkn + countantrean2) - urutantrean;
    }

    let _angkadokter = 1;
    let lastAngkaAntrian = 0;

    let getAntrianBySubSpesialisTglPeriksa = await _getAntrianBySubSpesialisTglPeriksa(tempdatadokter.kodesubspesialis, tanggalperiksa);
    if (getAntrianBySubSpesialisTglPeriksa.length !== 0) {

        var max = getAntrianBySubSpesialisTglPeriksa.reduce(function(a, b) {
            return Math.max(a.angkadokter, b.angkadokter);
        });

        let getAntrianForKodeBooking = await _getAntrianForKodeBooking(tempdatadokter.kodesubspesialis, kodedokter, tanggalperiksa, jampraktek);
        if (getAntrianForKodeBooking.length !== 0) {
            let lastAntrianForKodeBooking = getAntrianForKodeBooking.slice(-1);
            lastAngkaAntrian = lastAntrianForKodeBooking[0].angkaantrean;
            _angkadokter = lastAntrianForKodeBooking[0].angkadokter;

        } else {
            // _angkadokter = max.angkadokter + 1;
            _angkadokter = max + 1;
        }
    }

    let _getSisaAntrianPoliklinikBySubSpesialisKodeDokterTglPeriksaJamPraktek = await getSisaAntrianPoliklinikBySubSpesialisKodeDokterTglPeriksaJamPraktek(tempdatadokter.kodesubspesialis, kodedokter, tanggalperiksa, jampraktek);

    let dataResponse = {};
    // dataResponse.nomorantrean       = AbjadAntrean+"-"+sprintf("%d", urutantrean),
    dataResponse.nomorantrean       = AbjadAntrean+""+_angkadokter+"-"+sprintf("%d", lastAngkaAntrian+1),
    // dataResponse.angkaantrean       = urutantrean
    dataResponse.angkaantrean       = lastAngkaAntrian+1
    // dataResponse.kodebooking        = moment(tanggalperiksa, 'YYYY-MM-DD').format("DDMMYYYY")+AbjadAntrean+sprintf("%03d", urutantrean)
    dataResponse.kodebooking        = moment(tanggalperiksa, 'YYYY-MM-DD').format("DDMMYYYY")+AbjadAntrean+""+_angkadokter+""+sprintf("%03d", lastAngkaAntrian+1)
    dataResponse.norm               = cekPasien.no_rm
    dataResponse.namapoli           = tempdatadokter.namasubspesialis
    dataResponse.namadokter         = tempdatadokter.namadokter
    dataResponse.estimasidilayani   = parseInt(moment(estimasiDilayani).format("x"));
    dataResponse.kuotajkn           = _kuotajkn
    dataResponse.sisakuotajkn       = _sisakuotajkn
    dataResponse.kuotanonjkn        = _kuotanonjkn
    dataResponse.sisakuotanonjkn    = _sisakuotanonjkn
    dataResponse.keterangan         = "Peserta harap 60 menit lebih awal guna pencatatan administrasi."
    dataResponse.sisaantrean        = _getSisaAntrianPoliklinikBySubSpesialisKodeDokterTglPeriksaJamPraktek.length

    let _jenispasien = 'JKN';

    let dataPushAantian = {
        kodebooking     : dataResponse.kodebooking,
        jenispasien     : _jenispasien,
        nomorkartu      : nomorkartu,
        nik             : cekPasien.no_identitas,
        nohp            : nohp,
        kodepoli        : tempdatadokter.kodesubspesialis,
        namapoli        : dataResponse.namapoli,
        pasienbaru      : pasienBaru,
        norm            : cekPasien.no_rm,
        tanggalperiksa  : tanggalperiksa,
        kodedokter      : kodedokter,
        namadokter      : dataResponse.namadokter,
        jampraktek      : jampraktek,
        jeniskunjungan  : jeniskunjungan,
        nomorreferensi  : nomorreferensi,
        nomorantrean    : dataResponse.nomorantrean,
        angkaantrean    : dataResponse.angkaantrean,
        estimasidilayani: dataResponse.estimasidilayani,
        sisakuotajkn    : dataResponse.sisakuotajkn,
        kuotajkn        : dataResponse.kuotajkn,
        sisakuotanonjkn : dataResponse.sisakuotanonjkn,
        kuotanonjkn     : dataResponse.kuotanonjkn,
        keterangan      : dataResponse.keterangan,
    }

    let addAntrean = await requestUrl(config.addantrean.url, dataPushAantian);
    if (addAntrean === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][GET-ANTRIAN-KOSONG][ERROR]");
    }
    if (addAntrean.metadata.code != 200) {
        return Response(res, addAntrean.metadata.message, null, 201, "[PUSH-ANTRIAN][FAILED]");
    }
    logging.info(`[PUSH-ANTRIAN][SUCCESSFULLY] ${JSON.stringify(addAntrean)}`);

    let waktu =  moment().format("YYYY-MM-DD HH:mm:ss")
    let dataPushCheckinAantian = {
        kodebooking     : dataResponse.kodebooking,
        // taskid          : pasienBaru === 1 ? 1 : 3,
        taskid          : 1,
        waktu      : parseInt(moment(waktu).format("x")),
    }
    let checkinAntrean = await requestUrl(config.updatewaktu.url, dataPushCheckinAantian);
    if (checkinAntrean === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][GET-ANTRIAN-KOSONG][ERROR]");
    }
    if (checkinAntrean.metadata.code != 200) {
        return Response(res, checkinAntrean.metadata.message, null, 201, "[CANCEL-ANTRIAN][FAILED]");
    }
    logging.info(`[CHECKIN-ANTRIAN][SUCCESSFULLY] ${JSON.stringify(checkinAntrean)}`);

    let dataCreateAntrian = {
        nomorkartu      : nomorkartu,
        nik             : cekPasien.no_identitas,
        nohp            : nohp,
        poliklinik_id   : subSpesialis._id,
        kodepoli        : kodepoli,
        kodesubpoli     : tempdatadokter.kodesubspesialis,
        norm            : cekPasien.no_rm,
        tanggalperiksa  : tanggalperiksa,
        // dokter_id       : DataDokter._id,
        namadokter      : dataResponse.namadokter,
        kodedokter      : kodedokter,
        jampraktek      : jampraktek,
        jeniskunjungan  : jeniskunjungan,
        nomorreferensi  : nomorreferensi,
        hurufantrean    : AbjadAntrean,
        nomorantrean    : dataResponse.nomorantrean,
        angkaantrean    : dataResponse.angkaantrean,
        angkadokter     : _angkadokter,
        kodebooking     : dataResponse.kodebooking,
        estimasidilayani: dataResponse.estimasidilayani,
        waktu_dilayani  : moment(estimasiDilayani).format("HH:mm"),
        waktu_selesai   : moment(estimasiSelesai).format("HH:mm"),
        waktu_checkin   : moment().format("YYYY-MM-DD HH:mm:ss"),

        waktu_tunggu_admisi     : moment().format("YYYY-MM-DD HH:mm:ss"),
        waktu_dilayani_admisi   : null,
        waktu_tunggu_poli       : null,
        waktu_dilayani_poli     : null,
        waktu_tunggu_farmasi    : null,
        waktu_dilayani_farmasi  : null,
        waktu_dilayani_selesai  : null,

        waktu_dipanggil_admisi  : null,
        waktu_dipanggil_poli  : null,
        waktu_dipanggil_farmasi  : null,

        waktu_batal             : null,
        // kuotajkn        : dataResponse.kuotajkn,
        // sisakuotajkn    : dataResponse.sisakuotajkn,
        // kuotanonjkn     : dataResponse.kuotanonjkn,
        // sisakuotanonjkn : dataResponse.sisakuotanonjkn,

        jenispasien     : _jenispasien,
        pasienbaru      : pasienBaru,
        keterangan      : dataResponse.keterangan,
        status          : 'checkin',
        // taskid          : pasienBaru === 1 ? 1 : 3,
        // status          : 'menunggu',
        taskid          : 1,
        loket_id        : null,
        loket_farmasi_id: null,
        status_display  : false,
        jenisantrean    : "console",
        createdAt       : moment().format("YYYY-MM-DD HH:mm:ss"),
        updatedAt       : moment().format("YYYY-MM-DD HH:mm:ss"),
    }

    let createAntrianPoli = await createAntrianPoliklinik(dataCreateAntrian);
    if (createAntrianPoli == "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][ERROR]");
    }

    let body = {
        kodebooking : dataResponse.kodebooking,
        updatedAt  : moment().format("YYYY-MM-DD HH:mm:ss"),
    }
    let updateAntrian = await updateAntrianTemp(req.body.antrian_temp_id, body);
    if (updateAntrian === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[ANTREAN-UPDATE][ERROR]");
    }
    logging.info(`[ANTREAN-UPDATE][SUCCESSFULLY] ${JSON.stringify(updateAntrian)}`);

    return Response(res, "Ok", dataResponse, 200, "[GET-ANTRIAN][SUCCESSFULLY]");
};

exports.getAntrianOnSitePasienLama = async (req, res) => {
    let config   = iniParser.get();
    logging.info(`[HTTP][REQUEST][HEADER] ${JSON.stringify(req.headers)}`);
    logging.info(`[HTTP][REQUEST][BODY] ${JSON.stringify(req.body)}`);
    logging.info(`[HTTP][REQUEST][PARAMS] ${JSON.stringify(req.params)}`);

    await tokenValidator.Authentication(req, res);

    let {
        nomorkartu,
        nik,
        nohp,
        kodepoli,
        norm,
        tanggalperiksa,
        kodedokter,
        jampraktek,
        jeniskunjungan,
        nomorreferensi
    } = req.body;

    if (jeniskunjungan != 1 && jeniskunjungan != 2 && jeniskunjungan != 3 && jeniskunjungan != 4) {
        return Response(res, "Jenis Kunjungan yang dimasukkan tidak valid", null, 201, "[GET-ANTRIAN][JENIS-KUnJUNGAN][AVAILABLE]");
    }

    let poliklinik = await getPoliklinik(kodepoli);
    if (poliklinik == "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][POLIKLINIK][ERROR]");
    } else if(poliklinik === null){
        return Response(res, "Data Poli Tidak Ditemukan", null, 201, "[GET-ANTRIAN][POLIKLINIK][NOT-FOUND]");
    }

    let checkTanggalPeriksa = periksaTanggal(tanggalperiksa);
    if (checkTanggalPeriksa.result === false) {
        return Response(res, checkTanggalPeriksa.message, null, 201, "[GET-ANTRIAN][TANGGAL-PERIKSA][NOT-VALID]");
    }

    // let DataDokter = await getDataDokter(kodedokter);
    let TempDataDokter = await requestUrlGet(config.dokter.url);
    if (TempDataDokter == "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][DATA-DOKTER]][ERROR]");
    } else if(TempDataDokter.metadata.code !== 200){
        return Response(res, "Data Dokter Tidak Ditemukan", null, 201, "[GET-ANTRIAN][DATA-DOKTER][NOT-FOUND]");
    }

    let DataDokter = {};
    for (let i = 0; i < TempDataDokter.response.length; i++) {
        if(TempDataDokter.response[i].kodedokter === kodedokter) {
            DataDokter = {
                nama : TempDataDokter.response[i].namadokter
            }
        }
    }
   
    let check_day = moment(tanggalperiksa).day();
    let arr_jampraktek = jampraktek.split("-");

    let dataReq = {
        kodepoli:kodepoli,
        tanggal:tanggalperiksa,
    }
    let jadwalDokter = await requestUrl(config.jadwaldokter.url, dataReq);
    if (jadwalDokter === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[JADWAL-DOKTER][ERROR]");
    }
    if (jadwalDokter.metadata.code != 200) {
        return Response(res, "Pendaftaran ke Poli Ini Sedang Tutup", null, 201, "[JADWAL-DOKTER][FAILED]");
    }
    logging.info(`[JADWAL-DOKTER][SUCCESSFULLY] ${JSON.stringify(jadwalDokter)}`);

    let tempdatadokter = null;
    for (let i = 0; i < jadwalDokter.response.length; i++) {
        if (kodedokter == jadwalDokter.response[i].kodedokter && jampraktek == jadwalDokter.response[i].jadwal) {
            tempdatadokter = jadwalDokter.response[i];
        }
    }
    
    if(tempdatadokter == null){
        return Response(res, `Jadwal Dokter ${DataDokter.nama} Tersebut Belum Tersedia, Silahkan Reschedule Tanggal dan Jam Praktek Lainnya`, null, 201, "[GET-ANTRIAN][JADWAL-DOKTER][NOT-FOUND]");
    }

    let cekPasien = await getPasienByNoKartu(nomorkartu);

    let pasienBaru = 0;
    if (cekPasien == "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][PASIEN][ERROR]");
    } else if(cekPasien === null){
        return Response(res, "Data pasien ini tidak ditemukan, silahkan Melakukan Registrasi Pasien Baru", null, 202, "[GET-ANTRIAN][PASIEN][NOT-FOUND]");
    }

    // if ("pasienbaru" in cekPasien) {
    //     if (cekPasien.pasienbaru == 1) {
    //         pasienBaru = 1;
    //     }
    // }

    // cek tanggal periksa, jika sama dengan tanggal hari ini periksa jam, jika >= jam tutup muncul validasi poli tutup. 
    let datetoday = moment().format('YYYY-MM-DD');
    let timetoday = moment().format('HH:mm');
    let timeclose = arr_jampraktek[1];
    if (moment(tanggalperiksa, 'YYYY-MM-DD').format('YYYY-MM-DD').toString() == moment(datetoday, 'YYYY-MM-DD').format('YYYY-MM-DD').toString()) {
        if (moment(timetoday, 'HH:mm').format('HH:mm').toString() >= moment(timeclose, 'HH:mm').format('HH:mm').toString()) {
            return Response(res, `Pendaftaran Ke Poli ${poliklinik.nama} Sudah Tutup Jam ${timeclose}`, null, 201, "[GET-ANTRIAN][NOT-FOUND]");
        }
    }

    let AbjadAntrean = "";
    // tempdatadokter.kodesubspesialis
    // AbjadAntrean = SwitchAbjad(kodepoli);
    AbjadAntrean = SwitchAbjad(tempdatadokter.kodesubspesialis);
    if (AbjadAntrean === null) {
        return Response(res, "Abjad antrean belum tersedia.", null, 201, "[GET-ANTRIAN][ERROR]");
    }

    let _getAntrianByTglPeriksaPoliSubSpesialisNoKartuKodeDokter = await getAntrianByTglPeriksaPoliSubSpesialisNoKartuKodeDokter(tanggalperiksa, tempdatadokter.kodesubspesialis, nomorkartu, kodedokter);
    if (_getAntrianByTglPeriksaPoliSubSpesialisNoKartuKodeDokter == "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][NO-KARTU][ERROR]");
    } 
    if (_getAntrianByTglPeriksaPoliSubSpesialisNoKartuKodeDokter.length > 0) {
        let lastAntrian = _getAntrianByTglPeriksaPoliSubSpesialisNoKartuKodeDokter.slice(-1)[0];
        if (lastAntrian.status != "batal") {
            return Response(res, "Nomor Antrean Hanya Dapat Diambil 1 Kali Pada Tanggal Yang Sama", null, 201, "[GET-ANTRIAN][NO-KARTU][AVAILABLE]");
        }
    }

    let subSpesialis = await getPoliklinik(tempdatadokter.kodesubspesialis);
    if (subSpesialis == "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][SUB-POLIKLINIK][ERROR]");
    } else if(subSpesialis === null){
        return Response(res, "Sub Spesialis Tidak Ditemukan", null, 201, "[GET-ANTRIAN][SUB-POLIKLINIK][NOT-FOUND]");
    }

    let arr_jadwal = tempdatadokter.jadwal.split("-");

    let _kuotajkn = 30;
    let _kuotanonjkn = 30;
    let _sisakuotajkn = 0
    let _sisakuotanonjkn = 0
    let urutantrean;
    let estimasiDilayani = 0;
    let estimasiSelesai = 0;

    // let getAntrian    = await getAntrianPoliklinik(kodepoli, kodedokter, tanggalperiksa, jampraktek);
    let getAntrian    = await getAntrianPoliklinikBySubSpesialisKodeDokterTglPeriksaJamPraktek(tempdatadokter.kodesubspesialis, kodedokter, tanggalperiksa, jampraktek);
    if (getAntrian === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][GET-ANTRIAN-KOSONG][ERROR]");
    } else if(getAntrian.length == 0){
        
        let tanggaltutup = moment(tanggalperiksa + ' ' + arr_jadwal[1], 'YYYY-MM-DD HH:mm');
        
        let timeStart   = moment(arr_jadwal[1], 'HH:mm').subtract(arr_jadwal[0], 'HH:mm').format("HH:mm");

        let timeFinish = moment(timeStart, 'HH:mm').subtract('00:06', 'HH:mm').format("HH:mm");

        estimasiDilayani = moment(tanggaltutup, 'HH:mm').subtract(timeStart, 'HH:mm').format();

        estimasiSelesai = moment(tanggaltutup, 'HH:mm').subtract(timeFinish, 'HH:mm').format();
       
        urutantrean = 1;
        _sisakuotajkn = _kuotajkn - 1;
        _sisakuotanonjkn = _kuotanonjkn -1;
    } else {

        // let getAntrian2    = await getAntrianPoliklinik2(kodepoli, kodedokter, tanggalperiksa, jampraktek);
        let getAntrian2    = await getAntrianPoliklinikBySubSpesialisKodeDokterTglPeriksaJamPraktek(tempdatadokter.kodesubspesialis, kodedokter, tanggalperiksa, jampraktek);

        let lastAntrian = getAntrian.slice(-1);

        let tanggaltutup = moment(tanggalperiksa + ' ' + arr_jadwal[1], 'YYYY-MM-DD HH:mm');
        
        let timeStart   = moment(arr_jadwal[1], 'HH:mm').subtract(lastAntrian[0].waktu_selesai, 'HH:mm').format("HH:mm");

        let timeFinish = moment(timeStart, 'HH:mm').subtract('00:06', 'HH:mm').format("HH:mm");

        estimasiDilayani = moment(tanggaltutup, 'HH:mm').subtract(timeStart, 'HH:mm').format();

        estimasiSelesai = moment(tanggaltutup, 'HH:mm').subtract(timeFinish, 'HH:mm').format();
        countantrean = getAntrian.length;
        maxangkaantrean = await biggestNumberInArray(getAntrian);
        
        countantrean2 = getAntrian2.length;

        urutantrean = maxangkaantrean + 1;
        _sisakuotajkn = (_kuotajkn + countantrean2) - urutantrean;
        _sisakuotanonjkn = (_kuotanonjkn + countantrean2) - urutantrean;
    }

    let _angkadokter = 1;
    let lastAngkaAntrian = 0;

    let getAntrianBySubSpesialisTglPeriksa = await _getAntrianBySubSpesialisTglPeriksa(tempdatadokter.kodesubspesialis, tanggalperiksa);
    if (getAntrianBySubSpesialisTglPeriksa.length !== 0) {

        var max = getAntrianBySubSpesialisTglPeriksa.reduce(function(a, b) {
            return Math.max(a.angkadokter, b.angkadokter);
        });

        let getAntrianForKodeBooking = await _getAntrianForKodeBooking(tempdatadokter.kodesubspesialis, kodedokter, tanggalperiksa, jampraktek);
        if (getAntrianForKodeBooking.length !== 0) {
            let lastAntrianForKodeBooking = getAntrianForKodeBooking.slice(-1);
            lastAngkaAntrian = lastAntrianForKodeBooking[0].angkaantrean;
            _angkadokter = lastAntrianForKodeBooking[0].angkadokter;

        } else {
            _angkadokter = max.angkadokter + 1;
        }
    }

    let _getSisaAntrianPoliklinikBySubSpesialisKodeDokterTglPeriksaJamPraktek = await getSisaAntrianPoliklinikBySubSpesialisKodeDokterTglPeriksaJamPraktek(tempdatadokter.kodesubspesialis, kodedokter, tanggalperiksa, jampraktek);

    let dataResponse = {};
    // dataResponse.nomorantrean       = AbjadAntrean+"-"+sprintf("%d", urutantrean),
    dataResponse.nomorantrean       = AbjadAntrean+""+_angkadokter+"-"+sprintf("%d", lastAngkaAntrian+1),
    // dataResponse.angkaantrean       = urutantrean
    dataResponse.angkaantrean       = lastAngkaAntrian+1
    // dataResponse.kodebooking        = moment(tanggalperiksa, 'YYYY-MM-DD').format("DDMMYYYY")+AbjadAntrean+sprintf("%03d", urutantrean)
    dataResponse.kodebooking        = moment(tanggalperiksa, 'YYYY-MM-DD').format("DDMMYYYY")+AbjadAntrean+""+_angkadokter+""+sprintf("%03d", lastAngkaAntrian+1)
    dataResponse.norm               = cekPasien.no_rm
    dataResponse.namapoli           = tempdatadokter.namasubspesialis
    dataResponse.namadokter         = tempdatadokter.namadokter
    dataResponse.estimasidilayani   = parseInt(moment(estimasiDilayani).format("x"));
    dataResponse.kuotajkn           = _kuotajkn
    dataResponse.sisakuotajkn       = _sisakuotajkn
    dataResponse.kuotanonjkn        = _kuotanonjkn
    dataResponse.sisakuotanonjkn    = _sisakuotanonjkn
    dataResponse.keterangan         = "Peserta harap 60 menit lebih awal guna pencatatan administrasi."
    dataResponse.sisaantrean        = _getSisaAntrianPoliklinikBySubSpesialisKodeDokterTglPeriksaJamPraktek.length

    let _jenispasien = 'JKN';

    let dataPushAantian = {
        kodebooking     : dataResponse.kodebooking,
        jenispasien     : _jenispasien,
        nomorkartu      : nomorkartu,
        nik             : cekPasien.no_identitas,
        nohp            : nohp,
        kodepoli        : tempdatadokter.kodesubspesialis,
        namapoli        : dataResponse.namapoli,
        pasienbaru      : pasienBaru,
        norm            : cekPasien.no_rm,
        tanggalperiksa  : tanggalperiksa,
        kodedokter      : kodedokter,
        namadokter      : dataResponse.namadokter,
        jampraktek      : jampraktek,
        jeniskunjungan  : jeniskunjungan,
        nomorreferensi  : nomorreferensi,
        nomorantrean    : dataResponse.nomorantrean,
        angkaantrean    : dataResponse.angkaantrean,
        estimasidilayani: dataResponse.estimasidilayani,
        sisakuotajkn    : dataResponse.sisakuotajkn,
        kuotajkn        : dataResponse.kuotajkn,
        sisakuotanonjkn : dataResponse.sisakuotanonjkn,
        kuotanonjkn     : dataResponse.kuotanonjkn,
        keterangan      : dataResponse.keterangan,
    }

    let addAntrean = await requestUrl(config.addantrean.url, dataPushAantian);
    if (addAntrean === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][GET-ANTRIAN-KOSONG][ERROR]");
    }
    if (addAntrean.metadata.code != 200) {
        return Response(res, addAntrean.metadata.message, null, 201, "[PUSH-ANTRIAN][FAILED]");
    }
    logging.info(`[PUSH-ANTRIAN][SUCCESSFULLY] ${JSON.stringify(addAntrean)}`);

    let waktu =  moment().format("YYYY-MM-DD HH:mm:ss")
    let dataPushCheckinAantian = {
        kodebooking     : dataResponse.kodebooking,
        // taskid          : pasienBaru === 1 ? 1 : 3,
        taskid          : 3,
        waktu      : parseInt(moment(waktu).format("x")),
    }
    let checkinAntrean = await requestUrl(config.updatewaktu.url, dataPushCheckinAantian);
    if (checkinAntrean === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][GET-ANTRIAN-KOSONG][ERROR]");
    }
    if (checkinAntrean.metadata.code != 200) {
        return Response(res, checkinAntrean.metadata.message, null, 201, "[CANCEL-ANTRIAN][FAILED]");
    }
    logging.info(`[CHECKIN-ANTRIAN][SUCCESSFULLY] ${JSON.stringify(checkinAntrean)}`);

    let dataCreateAntrian = {
        nomorkartu      : nomorkartu,
        nik             : cekPasien.no_identitas,
        nohp            : nohp,
        poliklinik_id   : subSpesialis._id,
        kodepoli        : kodepoli,
        kodesubpoli     : tempdatadokter.kodesubspesialis,
        norm            : cekPasien.no_rm,
        tanggalperiksa  : tanggalperiksa,
        // dokter_id       : DataDokter._id,
        namadokter      : dataResponse.namadokter,
        kodedokter      : kodedokter,
        jampraktek      : jampraktek,
        jeniskunjungan  : jeniskunjungan,
        nomorreferensi  : nomorreferensi,
        hurufantrean    : AbjadAntrean,
        nomorantrean    : dataResponse.nomorantrean,
        angkaantrean    : dataResponse.angkaantrean,
        angkadokter     : _angkadokter,
        kodebooking     : dataResponse.kodebooking,
        estimasidilayani: dataResponse.estimasidilayani,
        waktu_dilayani  : moment(estimasiDilayani).format("HH:mm"),
        waktu_selesai   : moment(estimasiSelesai).format("HH:mm"),
        waktu_checkin   : moment().format("YYYY-MM-DD HH:mm:ss"),

        waktu_tunggu_admisi     : moment().format("YYYY-MM-DD HH:mm:ss"),
        waktu_dilayani_admisi   : null,
        waktu_tunggu_poli       : null,
        waktu_dilayani_poli     : null,
        waktu_tunggu_farmasi    : null,
        waktu_dilayani_farmasi  : null,
        waktu_dilayani_selesai  : null,

        waktu_dipanggil_admisi  : null,
        waktu_dipanggil_poli  : null,
        waktu_dipanggil_farmasi  : null,

        waktu_batal             : null,
        // kuotajkn        : dataResponse.kuotajkn,
        // sisakuotajkn    : dataResponse.sisakuotajkn,
        // kuotanonjkn     : dataResponse.kuotanonjkn,
        // sisakuotanonjkn : dataResponse.sisakuotanonjkn,

        jenispasien     : _jenispasien,
        pasienbaru      : pasienBaru,
        keterangan      : dataResponse.keterangan,
        status          : 'checkin',
        taskid          : pasienBaru === 1 ? 1 : 3,
        // status          : 'menunggu',
        // taskid          : 1,
        loket_id        : null,
        loket_farmasi_id: null,
        status_display  : false,
        jenisantrean    : "console",
        createdAt       : moment().format("YYYY-MM-DD HH:mm:ss"),
        updatedAt       : moment().format("YYYY-MM-DD HH:mm:ss"),
    }

    let createAntrianPoli = await createAntrianPoliklinik(dataCreateAntrian);
    if (createAntrianPoli == "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][ERROR]");
    }
   
    return Response(res, "Ok", dataResponse, 200, "[GET-ANTRIAN][SUCCESSFULLY]");
};

exports.getAntrianUmumOnSite = async (req, res) => {
    let config   = iniParser.get();
    logging.info(`[HTTP][REQUEST][HEADER] ${JSON.stringify(req.headers)}`);
    logging.info(`[HTTP][REQUEST][BODY] ${JSON.stringify(req.body)}`);
    logging.info(`[HTTP][REQUEST][PARAMS] ${JSON.stringify(req.params)}`);

    await tokenValidator.Authentication(req, res);

    let {
        nomorkartu,
        nik,
        nohp,
        kodepoli,
        norm,
        tanggalperiksa,
        kodedokter,
        jampraktek,
        jeniskunjungan,
        nomorreferensi
    } = req.body;

    let getAntreanTemp = await _getOneAntrianTemp(req.body.antrian_temp_id);
    if (getAntreanTemp.kodebooking === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][ANTRIAN-KOSONG][ERROR]");
    }
    if (getAntreanTemp == null){
        return Response(res, "Antrean tidak ditemukan", null, 201, "[GET-ANTRIAN][ANTRIAN-KOSONG][ERROR]");
    }
    if (typeof getAntreanTemp.kodebooking !== "undefined" || getAntreanTemp.hasOwnProperty('undefined')) {
        return Response(res, "Kode booking sudah ada.", null, 201, "[GET-ANTRIAN][ANTRIAN-KOSONG][ERROR]");
    }

    if (nik.length != 16) {
        return Response(res, "NIK yang dimasukkan tidak valid", null, 201, "[GET-ANTRIAN][NIK][AVAILABLE]");
    }

    // if (jeniskunjungan != 1 && jeniskunjungan != 2 && jeniskunjungan != 3 && jeniskunjungan != 4) {
    //     return Response(res, "Jenis Kunjungan yang dimasukkan tidak valid", null, 201, "[GET-ANTRIAN][JENIS-KUnJUNGAN][AVAILABLE]");
    // }

    // let checkTglPeriksaDanPoli = await getAntrianByTglPeriksaPoliNik(tanggalperiksa, kodepoli, nik, kodedokter);
    // if (checkTglPeriksaDanPoli == "ERROR") {
    //     return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][NO-KARTU][ERROR]");
    // } 
    // if (checkTglPeriksaDanPoli.length > 0) {
    //     let lastAntrian = checkTglPeriksaDanPoli.slice(-1)[0];
    //     if (lastAntrian.status != "batal") {
    //         return Response(res, "Nomor Antrean Hanya Dapat Diambil 1 Kali Pada Tanggal Yang Sama", null, 201, "[GET-ANTRIAN][NO-KARTU][AVAILABLE]");
    //     }
    // }

    let poliklinik = await getPoliklinik(kodepoli);
    if (poliklinik == "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][POLIKLINIK][ERROR]");
    } else if(poliklinik === null){
        return Response(res, "Data Poli Tidak Ditemukan", null, 201, "[GET-ANTRIAN][POLIKLINIK][NOT-FOUND]");
    }

    let checkTanggalPeriksa = periksaTanggal(tanggalperiksa);
    if (checkTanggalPeriksa.result === false) {
        return Response(res, checkTanggalPeriksa.message, null, 201, "[GET-ANTRIAN][TANGGAL-PERIKSA][NOT-VALID]");
    }

    // let DataDokter = await getDataDokter(kodedokter);
    let TempDataDokter = await requestUrlGet(config.dokter.url);
    if (TempDataDokter == "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][DATA-DOKTER]][ERROR]");
    } else if(TempDataDokter.metadata.code !== 200){
        return Response(res, "Data Dokter Tidak Ditemukan", null, 201, "[GET-ANTRIAN][DATA-DOKTER][NOT-FOUND]");
    }

    let DataDokter = {};
    for (let i = 0; i < TempDataDokter.response.length; i++) {
        if(TempDataDokter.response[i].kodedokter === kodedokter) {
            DataDokter = {
                nama : TempDataDokter.response[i].namadokter
            }
        }
    }

    // let check_day = await convertTglPeriksaToDay(tanggalperiksa);
    let check_day = moment(tanggalperiksa).day();
    let arr_jampraktek = jampraktek.split("-");

    let dataReq = {
        kodepoli:kodepoli,
        tanggal:tanggalperiksa,
    }
    let jadwalDokter = await requestUrl(config.jadwaldokter.url, dataReq);
    if (jadwalDokter === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[JADWAL-DOKTER][ERROR]");
    }
    if (jadwalDokter.metadata.code != 200) {
        return Response(res, "Pendaftaran ke Poli Ini Sedang Tutup", null, 201, "[JADWAL-DOKTER][FAILED]");
    }
    logging.info(`[JADWAL-DOKTER][SUCCESSFULLY] ${JSON.stringify(jadwalDokter)}`);

    let tempdatadokter = null;
    for (let i = 0; i < jadwalDokter.response.length; i++) {
        if (kodedokter == jadwalDokter.response[i].kodedokter && jampraktek == jadwalDokter.response[i].jadwal) {
            // tempdatadokter.push(jadwalDokter.response[i]);
            tempdatadokter = jadwalDokter.response[i];
        }
    }
    
    if(tempdatadokter == null){
        return Response(res, `Jadwal Dokter ${DataDokter.nama} Tersebut Belum Tersedia, Silahkan Reschedule Tanggal dan Jam Praktek Lainnya`, null, 201, "[GET-ANTRIAN][JADWAL-DOKTER][NOT-FOUND]");
    }

    let cekPasien = await getPasienByNik(nik);
    let pasienBaru = 0;
    if (cekPasien == "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][PASIEN][ERROR]");
    } else if(cekPasien === null){
        return Response(res, "Data pasien ini tidak ditemukan, silahkan Melakukan Registrasi Pasien Baru", null, 202, "[GET-ANTRIAN][PASIEN][NOT-FOUND]");
    }

    if ("pasienbaru" in cekPasien) {
        if (cekPasien.pasienbaru == 1) {
            pasienBaru = 1;
        }
    }

    // cek tanggal periksa, jika sama dengan tanggal hari ini periksa jam, jika >= jam tutup muncul validasi poli tutup. 
    let datetoday = moment().format('YYYY-MM-DD');
    let timetoday = moment().format('HH:mm');
    let timeclose = arr_jampraktek[1];
    if (moment(tanggalperiksa, 'YYYY-MM-DD').format('YYYY-MM-DD').toString() == moment(datetoday, 'YYYY-MM-DD').format('YYYY-MM-DD').toString()) {
        if (moment(timetoday, 'HH:mm').format('HH:mm').toString() >= moment(timeclose, 'HH:mm').format('HH:mm').toString()) {
            return Response(res, `Pendaftaran Ke Poli ${poliklinik.nama} Sudah Tutup Jam ${timeclose}`, null, 201, "[GET-ANTRIAN][NOT-FOUND]");
        }
    }

    let AbjadAntrean = "";
    // tempdatadokter.kodesubspesialis
    // AbjadAntrean = SwitchAbjad(kodepoli);
    AbjadAntrean = SwitchAbjad(tempdatadokter.kodesubspesialis);
    if (AbjadAntrean === null) {
        return Response(res, "Abjad antrean belum tersedia.", null, 201, "[GET-ANTRIAN][ERROR]");
    }

    let _getAntrianByTglPeriksaPoliSubSpesialisNikKodeDokter = await getAntrianByTglPeriksaPoliSubSpesialisNikKodeDokter(tanggalperiksa, tempdatadokter.kodesubspesialis, nik, kodedokter);
    if (_getAntrianByTglPeriksaPoliSubSpesialisNikKodeDokter == "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][NO-KARTU][ERROR]");
    } 
    if (_getAntrianByTglPeriksaPoliSubSpesialisNikKodeDokter.length > 0) {
        let lastAntrian = _getAntrianByTglPeriksaPoliSubSpesialisNikKodeDokter.slice(-1)[0];
        if (lastAntrian.status != "batal") {
            return Response(res, "Nomor Antrean Hanya Dapat Diambil 1 Kali Pada Tanggal Yang Sama", null, 201, "[GET-ANTRIAN][NO-KARTU][AVAILABLE]");
        }
    }

    let subSpesialis = await getPoliklinik(tempdatadokter.kodesubspesialis);
    if (subSpesialis == "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][SUB-POLIKLINIK][ERROR]");
    } else if(subSpesialis === null){
        return Response(res, "Sub Spesialis Tidak Ditemukan", null, 201, "[GET-ANTRIAN][SUB-POLIKLINIK][NOT-FOUND]");
    }

    let arr_jadwal = tempdatadokter.jadwal.split("-");

    let _kuotajkn = 30;
    let _kuotanonjkn = 30;
    let _sisakuotajkn = 0
    let _sisakuotanonjkn = 0
    let urutantrean;
    let estimasiDilayani = 0;
    let estimasiSelesai = 0;

    // let getAntrian    = await getAntrianPoliklinik(kodepoli, kodedokter, tanggalperiksa, jampraktek);
    let getAntrian    = await getAntrianPoliklinikBySubSpesialisKodeDokterTglPeriksaJamPraktek(tempdatadokter.kodesubspesialis, kodedokter, tanggalperiksa, jampraktek);
    if (getAntrian === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][GET-ANTRIAN-KOSONG][ERROR]");
    } else if(getAntrian.length == 0){
        
        let tanggaltutup = moment(tanggalperiksa + ' ' + arr_jadwal[1], 'YYYY-MM-DD HH:mm');
        
        let timeStart   = moment(arr_jadwal[1], 'HH:mm').subtract(arr_jadwal[0], 'HH:mm').format("HH:mm");

        let timeFinish = moment(timeStart, 'HH:mm').subtract('00:06', 'HH:mm').format("HH:mm");

        estimasiDilayani = moment(tanggaltutup, 'HH:mm').subtract(timeStart, 'HH:mm').format();

        estimasiSelesai = moment(tanggaltutup, 'HH:mm').subtract(timeFinish, 'HH:mm').format();
    
        urutantrean = 1;
        _sisakuotajkn = _kuotajkn - 1;
        _sisakuotanonjkn = _kuotanonjkn -1;
    } else {

        // let getAntrian2    = await getAntrianPoliklinik2(kodepoli, kodedokter, tanggalperiksa, jampraktek);
        let getAntrian2    = await getAntrianPoliklinikBySubSpesialisKodeDokterTglPeriksaJamPraktek(tempdatadokter.kodesubspesialis, kodedokter, tanggalperiksa, jampraktek);

        let lastAntrian = getAntrian.slice(-1);

        let tanggaltutup = moment(tanggalperiksa + ' ' + arr_jadwal[1], 'YYYY-MM-DD HH:mm');
        
        let timeStart   = moment(arr_jadwal[1], 'HH:mm').subtract(lastAntrian[0].waktu_selesai, 'HH:mm').format("HH:mm");

        let timeFinish = moment(timeStart, 'HH:mm').subtract('00:06', 'HH:mm').format("HH:mm");

        estimasiDilayani = moment(tanggaltutup, 'HH:mm').subtract(timeStart, 'HH:mm').format();

        estimasiSelesai = moment(tanggaltutup, 'HH:mm').subtract(timeFinish, 'HH:mm').format();
        countantrean = getAntrian.length;
        maxangkaantrean = await biggestNumberInArray(getAntrian);
        
        countantrean2 = getAntrian2.length;

        urutantrean = maxangkaantrean + 1;
        _sisakuotajkn = (_kuotajkn + countantrean2) - urutantrean;
        _sisakuotanonjkn = (_kuotanonjkn + countantrean2) - urutantrean;
    }

    let _angkadokter = 1;
    let lastAngkaAntrian = 0;

    let getAntrianBySubSpesialisTglPeriksa = await _getAntrianBySubSpesialisTglPeriksa(tempdatadokter.kodesubspesialis, tanggalperiksa);
    if (getAntrianBySubSpesialisTglPeriksa.length !== 0) {

        var max = getAntrianBySubSpesialisTglPeriksa.reduce(function(a, b) {
            return Math.max(a.angkadokter, b.angkadokter);
        });

        let getAntrianForKodeBooking = await _getAntrianForKodeBooking(tempdatadokter.kodesubspesialis, kodedokter, tanggalperiksa, jampraktek);
        if (getAntrianForKodeBooking.length !== 0) {
            let lastAntrianForKodeBooking = getAntrianForKodeBooking.slice(-1);
            lastAngkaAntrian = lastAntrianForKodeBooking[0].angkaantrean;
            _angkadokter = lastAntrianForKodeBooking[0].angkadokter;

        } else {
            _angkadokter = max.angkadokter + 1;
        }
    }

    let _getSisaAntrianPoliklinikBySubSpesialisKodeDokterTglPeriksaJamPraktek = await getSisaAntrianPoliklinikBySubSpesialisKodeDokterTglPeriksaJamPraktek(tempdatadokter.kodesubspesialis, kodedokter, tanggalperiksa, jampraktek);

    let dataResponse = {};
    // dataResponse.nomorantrean       = AbjadAntrean+"-"+sprintf("%d", urutantrean),
    dataResponse.nomorantrean       = AbjadAntrean+""+_angkadokter+"-"+sprintf("%d", lastAngkaAntrian+1),
    // dataResponse.angkaantrean       = urutantrean
    dataResponse.angkaantrean       = lastAngkaAntrian+1
    // dataResponse.kodebooking        = moment(tanggalperiksa, 'YYYY-MM-DD').format("DDMMYYYY")+AbjadAntrean+sprintf("%03d", urutantrean)
    dataResponse.kodebooking        = moment(tanggalperiksa, 'YYYY-MM-DD').format("DDMMYYYY")+AbjadAntrean+""+_angkadokter+""+sprintf("%03d", lastAngkaAntrian+1)
    dataResponse.norm               = cekPasien.no_rm
    dataResponse.namapoli           = tempdatadokter.namasubspesialis
    dataResponse.namadokter         = tempdatadokter.namadokter
    dataResponse.estimasidilayani   = parseInt(moment(estimasiDilayani).format("x"));
    dataResponse.kuotajkn           = _kuotajkn
    dataResponse.sisakuotajkn       = _sisakuotajkn
    dataResponse.kuotanonjkn        = _kuotanonjkn
    dataResponse.sisakuotanonjkn    = _sisakuotanonjkn
    dataResponse.keterangan         = "Peserta harap 60 menit lebih awal guna pencatatan administrasi."
    dataResponse.sisaantrean        = _getSisaAntrianPoliklinikBySubSpesialisKodeDokterTglPeriksaJamPraktek.length

    let _jenispasien = 'NON JKN';

    let dataPushAantian = {
        kodebooking     : dataResponse.kodebooking,
        jenispasien     : _jenispasien,
        nomorkartu      : nomorkartu,
        nik             : cekPasien.no_identitas,
        nohp            : nohp,
        kodepoli        : tempdatadokter.kodesubspesialis,
        namapoli        : dataResponse.namapoli,
        pasienbaru      : pasienBaru,
        norm            : cekPasien.no_rm,
        tanggalperiksa  : tanggalperiksa,
        kodedokter      : kodedokter,
        namadokter      : dataResponse.namadokter,
        jampraktek      : jampraktek,
        jeniskunjungan  : jeniskunjungan,
        nomorreferensi  : nomorreferensi,
        nomorantrean    : dataResponse.nomorantrean,
        angkaantrean    : dataResponse.angkaantrean,
        estimasidilayani: dataResponse.estimasidilayani,
        sisakuotajkn    : dataResponse.sisakuotajkn,
        kuotajkn        : dataResponse.kuotajkn,
        sisakuotanonjkn : dataResponse.sisakuotanonjkn,
        kuotanonjkn     : dataResponse.kuotanonjkn,
        keterangan      : dataResponse.keterangan,
    }

    let addAntrean = await requestUrl(config.addantrean.url, dataPushAantian);
    if (addAntrean === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][GET-ANTRIAN-KOSONG][ERROR]");
    }
    if (addAntrean.metadata.code != 200) {
        return Response(res, addAntrean.metadata.message, null, 201, "[PUSH-ANTRIAN][FAILED]");
    }
    logging.info(`[PUSH-ANTRIAN][SUCCESSFULLY] ${JSON.stringify(addAntrean)}`);

    // push checkin
    let waktu =  moment().format("YYYY-MM-DD HH:mm:ss")
    let dataPushCheckinAantian = {
        kodebooking     : dataResponse.kodebooking,
        // taskid          : pasienBaru === 1 ? 1 : 3,
        taskid          : 1,
        waktu      : parseInt(moment(waktu).format("x")),
    }
    let checkinAntrean = await requestUrl(config.updatewaktu.url, dataPushCheckinAantian);
    if (checkinAntrean === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][GET-ANTRIAN-KOSONG][ERROR]");
    }
    if (checkinAntrean.metadata.code != 200) {
        return Response(res, checkinAntrean.metadata.message, null, 201, "[CANCEL-ANTRIAN][FAILED]");
    }
    logging.info(`[CHECKIN-ANTRIAN][SUCCESSFULLY] ${JSON.stringify(checkinAntrean)}`);

    let dataCreateAntrian = {
        nomorkartu      : nomorkartu,
        nik             : cekPasien.no_identitas,
        nohp            : nohp,
        poliklinik_id   : subSpesialis._id,
        kodepoli        : kodepoli,
        kodesubpoli     : tempdatadokter.kodesubspesialis,
        norm            : cekPasien.no_rm,
        tanggalperiksa  : tanggalperiksa,
        // dokter_id       : DataDokter._id,
        namadokter      : dataResponse.namadokter,
        kodedokter      : kodedokter,
        jampraktek      : jampraktek,
        jeniskunjungan  : jeniskunjungan,
        nomorreferensi  : nomorreferensi,
        hurufantrean    : AbjadAntrean,
        nomorantrean    : dataResponse.nomorantrean,
        angkaantrean    : dataResponse.angkaantrean,
        angkadokter     : _angkadokter,
        kodebooking     : dataResponse.kodebooking,
        estimasidilayani: dataResponse.estimasidilayani,
        waktu_dilayani  : moment(estimasiDilayani).format("HH:mm"),
        waktu_selesai   : moment(estimasiSelesai).format("HH:mm"),
        waktu_checkin   : moment().format("YYYY-MM-DD HH:mm:ss"),

        waktu_tunggu_admisi     : moment().format("YYYY-MM-DD HH:mm:ss"),
        waktu_dilayani_admisi   : null,
        waktu_tunggu_poli       : null,
        waktu_dilayani_poli     : null,
        waktu_tunggu_farmasi    : null,
        waktu_dilayani_farmasi  : null,
        waktu_dilayani_selesai  : null,

        waktu_dipanggil_admisi  : null,
        waktu_dipanggil_poli  : null,
        waktu_dipanggil_farmasi  : null,

        waktu_batal             : null,
        // kuotajkn        : dataResponse.kuotajkn,
        // sisakuotajkn    : dataResponse.sisakuotajkn,
        // kuotanonjkn     : dataResponse.kuotanonjkn,
        // sisakuotanonjkn : dataResponse.sisakuotanonjkn,

        jenispasien     : _jenispasien,
        pasienbaru      : pasienBaru,
        keterangan      : dataResponse.keterangan,
        status          : 'checkin',
        // taskid          : pasienBaru === 1 ? 1 : 3,
        // status          : 'menunggu',
        taskid          : 1,
        loket_id        : null,
        loket_farmasi_id: null,
        status_display  : false,
        jenisantrean    : "console",
        createdAt       : moment().format("YYYY-MM-DD HH:mm:ss"),
        updatedAt       : moment().format("YYYY-MM-DD HH:mm:ss"),
    }

    let createAntrianPoli = await createAntrianPoliklinik(dataCreateAntrian);
    if (createAntrianPoli == "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][ERROR]");
    }

    let body = {
        kodebooking : dataResponse.kodebooking,
        updatedAt  : moment().format("YYYY-MM-DD HH:mm:ss"),
    }
    let updateAntrian = await updateAntrianTemp(req.body.antrian_temp_id, body);
    if (updateAntrian === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[ANTREAN-UPDATE][ERROR]");
    }
    logging.info(`[ANTREAN-UPDATE][SUCCESSFULLY] ${JSON.stringify(updateAntrian)}`);

    return Response(res, "Ok", dataResponse, 200, "[GET-ANTRIAN][SUCCESSFULLY]");
};

exports.getAntrianUmumOnSitePasienLama = async (req, res) => {
    let config   = iniParser.get();
    logging.info(`[HTTP][REQUEST][HEADER] ${JSON.stringify(req.headers)}`);
    logging.info(`[HTTP][REQUEST][BODY] ${JSON.stringify(req.body)}`);
    logging.info(`[HTTP][REQUEST][PARAMS] ${JSON.stringify(req.params)}`);

    await tokenValidator.Authentication(req, res);

    let {
        nomorkartu,
        nik,
        nohp,
        kodepoli,
        norm,
        tanggalperiksa,
        kodedokter,
        jampraktek,
        jeniskunjungan,
        nomorreferensi
    } = req.body;

    // let getAntreanTemp = await _getOneAntrianTemp(req.body.antrian_temp_id);
    // if (getAntreanTemp.kodebooking === "ERROR") {
    //     return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][ANTRIAN-KOSONG][ERROR]");
    // }
    // if (getAntreanTemp == null){
    //     return Response(res, "Antrean tidak ditemukan", null, 201, "[GET-ANTRIAN][ANTRIAN-KOSONG][ERROR]");
    // }
    // if (typeof getAntreanTemp.kodebooking !== "undefined" || getAntreanTemp.hasOwnProperty('undefined')) {
    //     return Response(res, "Kode booking sudah ada.", null, 201, "[GET-ANTRIAN][ANTRIAN-KOSONG][ERROR]");
    // }

    if (nik.length != 16) {
        return Response(res, "NIK yang dimasukkan tidak valid", null, 201, "[GET-ANTRIAN][NIK][AVAILABLE]");
    }

    // if (jeniskunjungan != 1 && jeniskunjungan != 2 && jeniskunjungan != 3 && jeniskunjungan != 4) {
    //     return Response(res, "Jenis Kunjungan yang dimasukkan tidak valid", null, 201, "[GET-ANTRIAN][JENIS-KUnJUNGAN][AVAILABLE]");
    // }

    // let checkTglPeriksaDanPoli = await getAntrianByTglPeriksaPoliNik(tanggalperiksa, kodepoli, nik, kodedokter);
    // if (checkTglPeriksaDanPoli == "ERROR") {
    //     return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][NO-KARTU][ERROR]");
    // } 
    // if (checkTglPeriksaDanPoli.length > 0) {
    //     let lastAntrian = checkTglPeriksaDanPoli.slice(-1)[0];
    //     if (lastAntrian.status != "batal") {
    //         return Response(res, "Nomor Antrean Hanya Dapat Diambil 1 Kali Pada Tanggal Yang Sama", null, 201, "[GET-ANTRIAN][NO-KARTU][AVAILABLE]");
    //     }
    // }

    let poliklinik = await getPoliklinik(kodepoli);
    if (poliklinik == "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][POLIKLINIK][ERROR]");
    } else if(poliklinik === null){
        return Response(res, "Data Poli Tidak Ditemukan", null, 201, "[GET-ANTRIAN][POLIKLINIK][NOT-FOUND]");
    }

    let checkTanggalPeriksa = periksaTanggal(tanggalperiksa);
    if (checkTanggalPeriksa.result === false) {
        return Response(res, checkTanggalPeriksa.message, null, 201, "[GET-ANTRIAN][TANGGAL-PERIKSA][NOT-VALID]");
    }

    // let DataDokter = await getDataDokter(kodedokter);
    let TempDataDokter = await requestUrlGet(config.dokter.url);
    if (TempDataDokter == "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][DATA-DOKTER]][ERROR]");
    } else if(TempDataDokter.metadata.code !== 200){
        return Response(res, "Data Dokter Tidak Ditemukan", null, 201, "[GET-ANTRIAN][DATA-DOKTER][NOT-FOUND]");
    }

    let DataDokter = {};
    for (let i = 0; i < TempDataDokter.response.length; i++) {
        if(TempDataDokter.response[i].kodedokter === kodedokter) {
            DataDokter = {
                nama : TempDataDokter.response[i].namadokter
            }
        }
    }

    // let check_day = await convertTglPeriksaToDay(tanggalperiksa);
    let check_day = moment(tanggalperiksa).day();
    let arr_jampraktek = jampraktek.split("-");

    let dataReq = {
        kodepoli:kodepoli,
        tanggal:tanggalperiksa,
    }
    let jadwalDokter = await requestUrl(config.jadwaldokter.url, dataReq);
    if (jadwalDokter === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[JADWAL-DOKTER][ERROR]");
    }
    if (jadwalDokter.metadata.code != 200) {
        return Response(res, "Pendaftaran ke Poli Ini Sedang Tutup", null, 201, "[JADWAL-DOKTER][FAILED]");
    }
    logging.info(`[JADWAL-DOKTER][SUCCESSFULLY] ${JSON.stringify(jadwalDokter)}`);

    let tempdatadokter = null;
    for (let i = 0; i < jadwalDokter.response.length; i++) {
        if (kodedokter == jadwalDokter.response[i].kodedokter && jampraktek == jadwalDokter.response[i].jadwal) {
            // tempdatadokter.push(jadwalDokter.response[i]);
            tempdatadokter = jadwalDokter.response[i];
        }
    }
    
    if(tempdatadokter == null){
        return Response(res, `Jadwal Dokter ${DataDokter.nama} Tersebut Belum Tersedia, Silahkan Reschedule Tanggal dan Jam Praktek Lainnya`, null, 201, "[GET-ANTRIAN][JADWAL-DOKTER][NOT-FOUND]");
    }

    let cekPasien = await getPasienByNik(nik);
    let pasienBaru = 0;
    if (cekPasien == "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][PASIEN][ERROR]");
    } else if(cekPasien === null){
        return Response(res, "Data pasien ini tidak ditemukan, silahkan Melakukan Registrasi Pasien Baru", null, 202, "[GET-ANTRIAN][PASIEN][NOT-FOUND]");
    }

    // if ("pasienbaru" in cekPasien) {
    //     if (cekPasien.pasienbaru == 1) {
    //         pasienBaru = 1;
    //     }
    // }

    // cek tanggal periksa, jika sama dengan tanggal hari ini periksa jam, jika >= jam tutup muncul validasi poli tutup. 
    let datetoday = moment().format('YYYY-MM-DD');
    let timetoday = moment().format('HH:mm');
    let timeclose = arr_jampraktek[1];
    if (moment(tanggalperiksa, 'YYYY-MM-DD').format('YYYY-MM-DD').toString() == moment(datetoday, 'YYYY-MM-DD').format('YYYY-MM-DD').toString()) {
        if (moment(timetoday, 'HH:mm').format('HH:mm').toString() >= moment(timeclose, 'HH:mm').format('HH:mm').toString()) {
            return Response(res, `Pendaftaran Ke Poli ${poliklinik.nama} Sudah Tutup Jam ${timeclose}`, null, 201, "[GET-ANTRIAN][NOT-FOUND]");
        }
    }

    let AbjadAntrean = "";
    // tempdatadokter.kodesubspesialis
    // AbjadAntrean = SwitchAbjad(kodepoli);
    AbjadAntrean = SwitchAbjad(tempdatadokter.kodesubspesialis);
    if (AbjadAntrean === null) {
        return Response(res, "Abjad antrean belum tersedia.", null, 201, "[GET-ANTRIAN][ERROR]");
    }

    let _getAntrianByTglPeriksaPoliSubSpesialisNikKodeDokter = await getAntrianByTglPeriksaPoliSubSpesialisNikKodeDokter(tanggalperiksa, tempdatadokter.kodesubspesialis, nik, kodedokter);
    if (_getAntrianByTglPeriksaPoliSubSpesialisNikKodeDokter == "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][NO-KARTU][ERROR]");
    } 
    if (_getAntrianByTglPeriksaPoliSubSpesialisNikKodeDokter.length > 0) {
        let lastAntrian = _getAntrianByTglPeriksaPoliSubSpesialisNikKodeDokter.slice(-1)[0];
        if (lastAntrian.status != "batal") {
            return Response(res, "Nomor Antrean Hanya Dapat Diambil 1 Kali Pada Tanggal Yang Sama", null, 201, "[GET-ANTRIAN][NO-KARTU][AVAILABLE]");
        }
    }

    let subSpesialis = await getPoliklinik(tempdatadokter.kodesubspesialis);
    if (subSpesialis == "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][SUB-POLIKLINIK][ERROR]");
    } else if(subSpesialis === null){
        return Response(res, "Sub Spesialis Tidak Ditemukan", null, 201, "[GET-ANTRIAN][SUB-POLIKLINIK][NOT-FOUND]");
    }

    let arr_jadwal = tempdatadokter.jadwal.split("-");

    let _kuotajkn = 30;
    let _kuotanonjkn = 30;
    let _sisakuotajkn = 0
    let _sisakuotanonjkn = 0
    let urutantrean;
    let estimasiDilayani = 0;
    let estimasiSelesai = 0;

    // let getAntrian    = await getAntrianPoliklinik(kodepoli, kodedokter, tanggalperiksa, jampraktek);
    let getAntrian    = await getAntrianPoliklinikBySubSpesialisKodeDokterTglPeriksaJamPraktek(tempdatadokter.kodesubspesialis, kodedokter, tanggalperiksa, jampraktek);
    if (getAntrian === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][GET-ANTRIAN-KOSONG][ERROR]");
    } else if(getAntrian.length == 0){
        
        let tanggaltutup = moment(tanggalperiksa + ' ' + arr_jadwal[1], 'YYYY-MM-DD HH:mm');
        
        let timeStart   = moment(arr_jadwal[1], 'HH:mm').subtract(arr_jadwal[0], 'HH:mm').format("HH:mm");

        let timeFinish = moment(timeStart, 'HH:mm').subtract('00:06', 'HH:mm').format("HH:mm");

        estimasiDilayani = moment(tanggaltutup, 'HH:mm').subtract(timeStart, 'HH:mm').format();

        estimasiSelesai = moment(tanggaltutup, 'HH:mm').subtract(timeFinish, 'HH:mm').format();
    
        urutantrean = 1;
        _sisakuotajkn = _kuotajkn - 1;
        _sisakuotanonjkn = _kuotanonjkn -1;
    } else {

        // let getAntrian2    = await getAntrianPoliklinik2(kodepoli, kodedokter, tanggalperiksa, jampraktek);
        let getAntrian2    = await getAntrianPoliklinikBySubSpesialisKodeDokterTglPeriksaJamPraktek(tempdatadokter.kodesubspesialis, kodedokter, tanggalperiksa, jampraktek);

        let lastAntrian = getAntrian.slice(-1);

        let tanggaltutup = moment(tanggalperiksa + ' ' + arr_jadwal[1], 'YYYY-MM-DD HH:mm');
        
        let timeStart   = moment(arr_jadwal[1], 'HH:mm').subtract(lastAntrian[0].waktu_selesai, 'HH:mm').format("HH:mm");

        let timeFinish = moment(timeStart, 'HH:mm').subtract('00:06', 'HH:mm').format("HH:mm");

        estimasiDilayani = moment(tanggaltutup, 'HH:mm').subtract(timeStart, 'HH:mm').format();

        estimasiSelesai = moment(tanggaltutup, 'HH:mm').subtract(timeFinish, 'HH:mm').format();
        countantrean = getAntrian.length;
        maxangkaantrean = await biggestNumberInArray(getAntrian);
        
        countantrean2 = getAntrian2.length;

        urutantrean = maxangkaantrean + 1;
        _sisakuotajkn = (_kuotajkn + countantrean2) - urutantrean;
        _sisakuotanonjkn = (_kuotanonjkn + countantrean2) - urutantrean;
    }

    let _angkadokter = 1;
    let lastAngkaAntrian = 0;

    let getAntrianBySubSpesialisTglPeriksa = await _getAntrianBySubSpesialisTglPeriksa(tempdatadokter.kodesubspesialis, tanggalperiksa);
    if (getAntrianBySubSpesialisTglPeriksa.length !== 0) {

        var max = getAntrianBySubSpesialisTglPeriksa.reduce(function(a, b) {
            return Math.max(a.angkadokter, b.angkadokter);
        });

        let getAntrianForKodeBooking = await _getAntrianForKodeBooking(tempdatadokter.kodesubspesialis, kodedokter, tanggalperiksa, jampraktek);
        if (getAntrianForKodeBooking.length !== 0) {
            let lastAntrianForKodeBooking = getAntrianForKodeBooking.slice(-1);
            lastAngkaAntrian = lastAntrianForKodeBooking[0].angkaantrean;
            _angkadokter = lastAntrianForKodeBooking[0].angkadokter;

        } else {
            _angkadokter = max.angkadokter + 1;
        }
    }

    let _getSisaAntrianPoliklinikBySubSpesialisKodeDokterTglPeriksaJamPraktek = await getSisaAntrianPoliklinikBySubSpesialisKodeDokterTglPeriksaJamPraktek(tempdatadokter.kodesubspesialis, kodedokter, tanggalperiksa, jampraktek);

    let dataResponse = {};
    // dataResponse.nomorantrean       = AbjadAntrean+"-"+sprintf("%d", urutantrean),
    dataResponse.nomorantrean       = AbjadAntrean+""+_angkadokter+"-"+sprintf("%d", lastAngkaAntrian+1),
    // dataResponse.angkaantrean       = urutantrean
    dataResponse.angkaantrean       = lastAngkaAntrian+1
    // dataResponse.kodebooking        = moment(tanggalperiksa, 'YYYY-MM-DD').format("DDMMYYYY")+AbjadAntrean+sprintf("%03d", urutantrean)
    dataResponse.kodebooking        = moment(tanggalperiksa, 'YYYY-MM-DD').format("DDMMYYYY")+AbjadAntrean+""+_angkadokter+""+sprintf("%03d", lastAngkaAntrian+1)
    dataResponse.norm               = cekPasien.no_rm
    dataResponse.namapoli           = tempdatadokter.namasubspesialis
    dataResponse.namadokter         = tempdatadokter.namadokter
    dataResponse.estimasidilayani   = parseInt(moment(estimasiDilayani).format("x"));
    dataResponse.kuotajkn           = _kuotajkn
    dataResponse.sisakuotajkn       = _sisakuotajkn
    dataResponse.kuotanonjkn        = _kuotanonjkn
    dataResponse.sisakuotanonjkn    = _sisakuotanonjkn
    dataResponse.keterangan         = "Peserta harap 60 menit lebih awal guna pencatatan administrasi."
    dataResponse.sisaantrean        = _getSisaAntrianPoliklinikBySubSpesialisKodeDokterTglPeriksaJamPraktek.length

    let _jenispasien = 'NON JKN';

    let dataPushAantian = {
        kodebooking     : dataResponse.kodebooking,
        jenispasien     : _jenispasien,
        nomorkartu      : nomorkartu,
        nik             : cekPasien.no_identitas,
        nohp            : nohp,
        kodepoli        : tempdatadokter.kodesubspesialis,
        namapoli        : dataResponse.namapoli,
        pasienbaru      : pasienBaru,
        norm            : cekPasien.no_rm,
        tanggalperiksa  : tanggalperiksa,
        kodedokter      : kodedokter,
        namadokter      : dataResponse.namadokter,
        jampraktek      : jampraktek,
        jeniskunjungan  : jeniskunjungan,
        nomorreferensi  : nomorreferensi,
        nomorantrean    : dataResponse.nomorantrean,
        angkaantrean    : dataResponse.angkaantrean,
        estimasidilayani: dataResponse.estimasidilayani,
        sisakuotajkn    : dataResponse.sisakuotajkn,
        kuotajkn        : dataResponse.kuotajkn,
        sisakuotanonjkn : dataResponse.sisakuotanonjkn,
        kuotanonjkn     : dataResponse.kuotanonjkn,
        keterangan      : dataResponse.keterangan,
    }

    let addAntrean = await requestUrl(config.addantrean.url, dataPushAantian);
    if (addAntrean === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][GET-ANTRIAN-KOSONG][ERROR]");
    }
    if (addAntrean.metadata.code != 200) {
        return Response(res, addAntrean.metadata.message, null, 201, "[PUSH-ANTRIAN][FAILED]");
    }
    logging.info(`[PUSH-ANTRIAN][SUCCESSFULLY] ${JSON.stringify(addAntrean)}`);

    // push checkin
    let waktu =  moment().format("YYYY-MM-DD HH:mm:ss")
    let dataPushCheckinAantian = {
        kodebooking     : dataResponse.kodebooking,
        // taskid          : pasienBaru === 1 ? 1 : 3,
        taskid          : 1,
        waktu      : parseInt(moment(waktu).format("x")),
    }
    let checkinAntrean = await requestUrl(config.updatewaktu.url, dataPushCheckinAantian);
    if (checkinAntrean === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][GET-ANTRIAN-KOSONG][ERROR]");
    }
    if (checkinAntrean.metadata.code != 200) {
        return Response(res, checkinAntrean.metadata.message, null, 201, "[CANCEL-ANTRIAN][FAILED]");
    }
    logging.info(`[CHECKIN-ANTRIAN][SUCCESSFULLY] ${JSON.stringify(checkinAntrean)}`);

    let dataCreateAntrian = {
        nomorkartu      : nomorkartu,
        nik             : cekPasien.no_identitas,
        nohp            : nohp,
        poliklinik_id   : subSpesialis._id,
        kodepoli        : kodepoli,
        kodesubpoli     : tempdatadokter.kodesubspesialis,
        norm            : cekPasien.no_rm,
        tanggalperiksa  : tanggalperiksa,
        // dokter_id       : DataDokter._id,
        namadokter      : dataResponse.namadokter,
        kodedokter      : kodedokter,
        jampraktek      : jampraktek,
        jeniskunjungan  : jeniskunjungan,
        nomorreferensi  : nomorreferensi,
        hurufantrean    : AbjadAntrean,
        nomorantrean    : dataResponse.nomorantrean,
        angkaantrean    : dataResponse.angkaantrean,
        angkadokter     : _angkadokter,
        kodebooking     : dataResponse.kodebooking,
        estimasidilayani: dataResponse.estimasidilayani,
        waktu_dilayani  : moment(estimasiDilayani).format("HH:mm"),
        waktu_selesai   : moment(estimasiSelesai).format("HH:mm"),
        waktu_checkin   : moment().format("YYYY-MM-DD HH:mm:ss"),

        waktu_tunggu_admisi     : moment().format("YYYY-MM-DD HH:mm:ss"),
        waktu_dilayani_admisi   : null,
        waktu_tunggu_poli       : null,
        waktu_dilayani_poli     : null,
        waktu_tunggu_farmasi    : null,
        waktu_dilayani_farmasi  : null,
        waktu_dilayani_selesai  : null,

        waktu_dipanggil_admisi  : null,
        waktu_dipanggil_poli  : null,
        waktu_dipanggil_farmasi  : null,

        waktu_batal             : null,
        // kuotajkn        : dataResponse.kuotajkn,
        // sisakuotajkn    : dataResponse.sisakuotajkn,
        // kuotanonjkn     : dataResponse.kuotanonjkn,
        // sisakuotanonjkn : dataResponse.sisakuotanonjkn,

        jenispasien     : _jenispasien,
        pasienbaru      : pasienBaru,
        keterangan      : dataResponse.keterangan,
        status          : 'checkin',
        // taskid          : pasienBaru === 1 ? 1 : 3,
        // status          : 'menunggu',
        taskid          : 3,
        loket_id        : null,
        loket_farmasi_id: null,
        status_display  : false,
        jenisantrean    : "console",
        createdAt       : moment().format("YYYY-MM-DD HH:mm:ss"),
        updatedAt       : moment().format("YYYY-MM-DD HH:mm:ss"),
    }

    let createAntrianPoli = await createAntrianPoliklinik(dataCreateAntrian);
    if (createAntrianPoli == "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][ERROR]");
    }

    let body = {
        kodebooking : dataResponse.kodebooking,
        updatedAt  : moment().format("YYYY-MM-DD HH:mm:ss"),
    }
    let updateAntrian = await updateAntrianTemp(req.body.antrian_temp_id, body);
    if (updateAntrian === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[ANTREAN-UPDATE][ERROR]");
    }
    logging.info(`[ANTREAN-UPDATE][SUCCESSFULLY] ${JSON.stringify(updateAntrian)}`);

    return Response(res, "Ok", dataResponse, 200, "[GET-ANTRIAN][SUCCESSFULLY]");
};

exports.newPatient = async (req, res) => {
    logging.info(`[HTTP][REQUEST][HEADER] ${JSON.stringify(req.headers)}`);
    logging.info(`[HTTP][REQUEST][BODY] ${JSON.stringify(req.body)}`);
    logging.info(`[HTTP][REQUEST][PARAMS] ${JSON.stringify(req.params)}`);

    await tokenValidator.Authentication(req, res);
    validateData = ajv.compile(JSON.parse(validateNewPatient));

    let {
        nomorkartu,
        nik,
        nomorkk,
        nama,
        jeniskelamin,
        tanggallahir,
        nohp,
        alamat,
        kodeprop,
        namaprop,
        kodedati2,
        namadati2,
        kodekec,
        namakec,
        kodekel,
        namakel,
        rw,
        rt
    } = req.body;

    dataValidate(req.body)
    .then(async function () {
        
        if (nomorkartu == "" || nomorkartu == null) {
            return Response(res, "Nomor Kartu Belum Diisi", null, 201, "[NEW-PATIENT][NO-KARTU][EMPTY]");
        }

        if (nik == "" || nik == null) {
            return Response(res, "NIK Belum Diisi", null, 201, "[NEW-PATIENT][NIK][EMPTY]");
        }

        if (nomorkk == "" || nomorkk == null) {
            return Response(res, "Nomor KK Belum Diisi", null, 201, "[NEW-PATIENT][NO-KK][EMPTY]");
        }

        if (isNaN(nomorkartu)) {
            return Response(res, "Format Nomor Kartu Tidak Sesuai", null, 201, "[NEW-PATIENT][NO-KARTU][AVAILABLE]");
        }

        if (isNaN(nik)) {
            return Response(res, "Format NIK Tidak Sesuai", null, 201, "[NEW-PATIENT][NO-KARTU][AVAILABLE]");
        }

        if (isNaN(nomorkk)) {
            return Response(res, "Format KK Tidak Sesuai", null, 201, "[NEW-PATIENT][NO-KARTU][AVAILABLE]");
        }

        if (nomorkartu.length != 13) {
            return Response(res, "Format Nomor Kartu Tidak Sesuai", null, 201, "[NEW-PATIENT][NO-KARTU][AVAILABLE]");
        }
        
        if (nik.length != 16) {
            return Response(res, "Format NIK Tidak Sesuai", null, 201, "[NEW-PATIENT][NIK][AVAILABLE]");
        }

        if (nomorkk.length != 16) {
            return Response(res, "Format KK Tidak Sesuai", null, 201, "[NEW-PATIENT][NO-KK][AVAILABLE]");
        }

        if (nama == "" || nama == null) {
            return Response(res, "Nama Belum Diisi", null, 201, "[NEW-PATIENT][NAMA][EMPTY]");
        }

        if (jeniskelamin == "" || jeniskelamin == null) {
            return Response(res, "Jenis Kelamin Belum Dipilih", null, 201, "[NEW-PATIENT][JENIS-KELAMIN][EMPTY]");
        }

        if (tanggallahir == "" || tanggallahir == null) {
            return Response(res, "Tanggal Lahir Belum Diisi", null, 201, "[NEW-PATIENT][TGL-LAHIR][EMPTY]");
        }

        if (moment(tanggallahir).isAfter(moment(), "day")) {
            return Response(res, "Format Tanggal Lahir Tidak Sesuai", null, 201, "[NEW-PATIENT][TGL-LAHIR][FORMAT-DATE-NOT-FOUND]");
        }

        if (nohp == "" || nohp == null) {
            return Response(res, "No.HP Belum Diisi", null, 201, "[NEW-PATIENT][NOHP][EMPTY]");
        }

        if (alamat == "" || alamat == null) {
            return Response(res, "Alamat Belum Diisi", null, 201, "[NEW-PATIENT][ALAMAT][EMPTY]");
        }

        if (kodeprop == "" || kodeprop == null) {
            return Response(res, "Kode Propinsi Belum Diisi", null, 201, "[NEW-PATIENT][KODEPROP][EMPTY]");
        }

        if (namaprop == "" || namaprop == null) {
            return Response(res, "Nama Propinsi Belum Diisi", null, 201, "[NEW-PATIENT][NAMAPROP][EMPTY]");
        }
        
        if (kodedati2 == "" || kodedati2 == null) {
            return Response(res, "Kode Dati 2 Belum Diisi", null, 201, "[NEW-PATIENT][KODEDATI2][EMPTY]");
        }

        if (namadati2 == "" || namadati2 == null) {
            return Response(res, "Dati 2 Belum Diisi", null, 201, "[NEW-PATIENT][NAMADATI2][EMPTY]");
        }

        if (kodekec == "" || kodekec == null) {
            return Response(res, "Kode Kecamatan Belum Diisi", null, 201, "[NEW-PATIENT][KODEKEC][EMPTY]");
        }

        if (namakec == "" || namakec == null) {
            return Response(res, "Kecamatan Belum Diisi", null, 201, "[NEW-PATIENT][NAMAKEC][EMPTY]");
        }

        if (kodekel == "" || kodekel == null) {
            return Response(res, "Kode Kelurahan Belum Diisi", null, 201, "[NEW-PATIENT][KODEKEL][EMPTY]");
        }

        if (namakel == "" || namakel == null) {
            return Response(res, "Kelurahan Belum Diisi", null, 201, "[NEW-PATIENT][NAMAKEL][EMPTY]");
        }

        if (rt == "" || rt == null) {
            return Response(res, "RT Belum Diisi", null, 201, "[NEW-PATIENT][RT][EMPTY]");
        }

        if (rw == "" || rw == null) {
            return Response(res, "RW Belum Diisi", null, 201, "[NEW-PATIENT][RW][EMPTY]");
        }

        if (jeniskelamin != "L" && jeniskelamin != "P") {
            return Response(res, "Jenis kelamin harus L atau P", null, 201, "[GET-ANTRIAN][JENIS-KELAMIN][AVAILABLE]");
        }
        let _jeniskelamin = "";
        if (jeniskelamin === "L") {
            _jeniskelamin = "Laki-laki";
        } else if (jeniskelamin === "P") {
            _jeniskelamin = "Perempuan";
        }

        // let cekPasien = await getPasien2(nomorkartu, nik);
        let cekPasien = await getPasienByNoKartu(nomorkartu);
        if (cekPasien == "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[NEW-PATIENT][GET-PASIEN][ERROR]");
        }
        if (cekPasien != null) {
            return Response(res, "Data Peserta Sudah Pernah Dientrikan", null, 201, "[NEW-PATIENT][GET-PASIEN][ERROR]");
        }

        let dataPengaturanSimrs = await getDataPengaturanSimrs();
        if (dataPengaturanSimrs == "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[NEW-PATIENT][PENGATURAN-SIMRS][ERROR]");
        }
        logging.debug(`[NEW-PATIENT] Data Pengaturan SIMRS => ${JSON.stringify(dataPengaturanSimrs)}`);

        let nomorRekamMedik = dataPengaturanSimrs[0].mulai_no_rm;

        let dataResponse = {};
        dataResponse.norm   = nomorRekamMedik;

        let dataCreatePatient = {
            no_rm           : nomorRekamMedik,
            no_identitas    : nik,
            nomorkk         : nomorkk,
            nama_pasien     : nama,
            jenkel          : _jeniskelamin,
            gol_darah       : "O",
            tempat_lahir    : "-",
            tgl_lahir       : tanggallahir,
            umur            : "0",
            no_telp         : "0",
            no_hp           : nohp,
            alamat          : alamat,
            kota            : "",
            kecamatan       : "",
            kelurahan       : "",
            rt_rw           : rt + "/" + rw,
            domisili        : "",
            agama           : "",
            pendidikan      : "",
            pekerjaan       : "",
            status_kawin    : "",
            catatan         : "",
            nama_wali       : "",
            alamat_wali     : "",
            hubungan_wali   : "",
            status          : "",
            berat_badan     : "",
            suku            : "",
            bahasa          : "",
            warga_negara    : "",
            negara          : "",
            provinsi        : "",
            ras             : "",
            kewarganegaraan : "",
            no_bpjs         : nomorkartu,
            pasienbaru      : 1,
            create_by       : "-",
            update_by       : "-",
            createdAt       : moment().format("YYYY-MM-DD HH:mm:ss"),
            updatedAt       : moment().format("YYYY-MM-DD HH:mm:ss"),
        };

        let NewPatient = await createNewPatient(dataCreatePatient);
        if (NewPatient == "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][ERROR]");
        }
        logging.debug(`[NEW-PATIENT] Pasien baru berhasil disimpan => ${JSON.stringify(dataCreatePatient)}`);

        let dataUpdatePengaturanSimrs = {
            mulai_no_rm: parseInt(dataPengaturanSimrs[0].mulai_no_rm) + 1,
            updatedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
        };

        let _updatePengaturanSimrs = await updatePengaturanSimrs(dataPengaturanSimrs[0]._id, dataUpdatePengaturanSimrs);
        logging.debug(`[NEW-PATIENT][PENGATURAN-SIMRS] No. RM Pada Pengaturan SIMRS berhasil di update => ${JSON.stringify(_updatePengaturanSimrs)}`);

        return Response(res, "Harap datang ke admisi untuk melengkapi data rekam medis.", dataResponse, 200, "[NEW-PATIENT][SUCCESSFULLY]");
    })
    .catch(function (err) {
        console.log(err);
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

        return Response(res, "Validation Form Error", data, 422, `[GET-ANTRIAN][VALIDATION][FORM][ERROR] ${err.message}`);
    });
};

exports.newPatientAndGetAntrean = async (req, res) => {
    let config   = iniParser.get();
    logging.info(`[HTTP][REQUEST][HEADER] ${JSON.stringify(req.headers)}`);
    logging.info(`[HTTP][REQUEST][BODY] ${JSON.stringify(req.body)}`);
    logging.info(`[HTTP][REQUEST][PARAMS] ${JSON.stringify(req.params)}`);

    await tokenValidator.Authentication(req, res);
    validateData = ajv.compile(JSON.parse(validateNewPatient));

    let {
        nomorkartu,
        nik,
        nomorkk,
        nama,
        jeniskelamin,
        tanggallahir,
        nohp,
        alamat,
        kodeprop,
        namaprop,
        kodedati2,
        namadati2,
        kodekec,
        namakec,
        kodekel,
        namakel,
        rw,
        rt,

        kodepoli,
        norm,
        tanggalperiksa,
        kodedokter,
        jampraktek,
        jeniskunjungan,
        nomorreferensi
    } = req.body;

    dataValidate(req.body)
    .then(async function () {
        
        if (nomorkartu == "" || nomorkartu == null) {
            return Response(res, "Nomor Kartu Belum Diisi", null, 201, "[NEW-PATIENT][NO-KARTU][EMPTY]");
        }

        if (nik == "" || nik == null) {
            return Response(res, "NIK Belum Diisi", null, 201, "[NEW-PATIENT][NIK][EMPTY]");
        }

        if (nomorkk == "" || nomorkk == null) {
            return Response(res, "Nomor KK Belum Diisi", null, 201, "[NEW-PATIENT][NO-KK][EMPTY]");
        }

        if (isNaN(nomorkartu)) {
            return Response(res, "Format Nomor Kartu Tidak Sesuai", null, 201, "[NEW-PATIENT][NO-KARTU][AVAILABLE]");
        }

        if (isNaN(nik)) {
            return Response(res, "Format NIK Tidak Sesuai", null, 201, "[NEW-PATIENT][NO-KARTU][AVAILABLE]");
        }

        if (isNaN(nomorkk)) {
            return Response(res, "Format KK Tidak Sesuai", null, 201, "[NEW-PATIENT][NO-KARTU][AVAILABLE]");
        }

        if (nomorkartu.length != 13) {
            return Response(res, "Format Nomor Kartu Tidak Sesuai", null, 201, "[NEW-PATIENT][NO-KARTU][AVAILABLE]");
        }
        
        if (nik.length != 16) {
            return Response(res, "Format NIK Tidak Sesuai", null, 201, "[NEW-PATIENT][NIK][AVAILABLE]");
        }

        if (nomorkk.length != 16) {
            return Response(res, "Format KK Tidak Sesuai", null, 201, "[NEW-PATIENT][NO-KK][AVAILABLE]");
        }

        if (nama == "" || nama == null) {
            return Response(res, "Nama Belum Diisi", null, 201, "[NEW-PATIENT][NAMA][EMPTY]");
        }

        if (jeniskelamin == "" || jeniskelamin == null) {
            return Response(res, "Jenis Kelamin Belum Dipilih", null, 201, "[NEW-PATIENT][JENIS-KELAMIN][EMPTY]");
        }

        if (tanggallahir == "" || tanggallahir == null) {
            return Response(res, "Tanggal Lahir Belum Diisi", null, 201, "[NEW-PATIENT][TGL-LAHIR][EMPTY]");
        }

        if (moment(tanggallahir).isAfter(moment(), "day")) {
            return Response(res, "Format Tanggal Lahir Tidak Sesuai", null, 201, "[NEW-PATIENT][TGL-LAHIR][FORMAT-DATE-NOT-FOUND]");
        }

        if (alamat == "" || alamat == null) {
            return Response(res, "Alamat Belum Diisi", null, 201, "[NEW-PATIENT][ALAMAT][EMPTY]");
        }

        if (kodeprop == "" || kodeprop == null) {
            return Response(res, "Kode Propinsi Belum Diisi", null, 201, "[NEW-PATIENT][KODEPROP][EMPTY]");
        }

        if (namaprop == "" || namaprop == null) {
            return Response(res, "Nama Propinsi Belum Diisi", null, 201, "[NEW-PATIENT][NAMAPROP][EMPTY]");
        }
        
        if (kodedati2 == "" || kodedati2 == null) {
            return Response(res, "Kode Dati 2 Belum Diisi", null, 201, "[NEW-PATIENT][KODEDATI2][EMPTY]");
        }

        if (namadati2 == "" || namadati2 == null) {
            return Response(res, "Dati 2 Belum Diisi", null, 201, "[NEW-PATIENT][NAMADATI2][EMPTY]");
        }

        if (kodekec == "" || kodekec == null) {
            return Response(res, "Kode Kecamatan Belum Diisi", null, 201, "[NEW-PATIENT][KODEKEC][EMPTY]");
        }

        if (namakec == "" || namakec == null) {
            return Response(res, "Kecamatan Belum Diisi", null, 201, "[NEW-PATIENT][NAMAKEC][EMPTY]");
        }

        if (kodekel == "" || kodekel == null) {
            return Response(res, "Kode Kelurahan Belum Diisi", null, 201, "[NEW-PATIENT][KODEKEL][EMPTY]");
        }

        if (namakel == "" || namakel == null) {
            return Response(res, "Kelurahan Belum Diisi", null, 201, "[NEW-PATIENT][NAMAKEL][EMPTY]");
        }

        if (rt == "" || rt == null) {
            return Response(res, "RT Belum Diisi", null, 201, "[NEW-PATIENT][RT][EMPTY]");
        }

        if (rw == "" || rw == null) {
            return Response(res, "RW Belum Diisi", null, 201, "[NEW-PATIENT][RW][EMPTY]");
        }

        if (jeniskelamin != "L" && jeniskelamin != "P") {
            return Response(res, "Jenis kelamin harus L atau P", null, 201, "[GET-ANTRIAN][JENIS-KELAMIN][AVAILABLE]");
        }
        let _jeniskelamin = "";
        if (jeniskelamin === "L") {
            _jeniskelamin = "Laki-laki";
        } else if (jeniskelamin === "P") {
            _jeniskelamin = "Perempuan";
        }

        if (jeniskunjungan != 1 && jeniskunjungan != 2 && jeniskunjungan != 3 && jeniskunjungan != 4) {
            return Response(res, "Jenis Kunjungan yang dimasukkan tidak valid", null, 201, "[GET-ANTRIAN][JENIS-KUnJUNGAN][AVAILABLE]");
        }

        // let cekPasien = await getPasien2(nomorkartu, nik);
        let cekPasien = await getPasienByNoKartu(nomorkartu);
        if (cekPasien == "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[NEW-PATIENT][GET-PASIEN][ERROR]");
        }
        if (cekPasien != null) {
            return Response(res, "Data Peserta Sudah Pernah Dientrikan", null, 201, "[NEW-PATIENT][GET-PASIEN][ERROR]");
        }

        let dataPengaturanSimrs = await getDataPengaturanSimrs();
        if (dataPengaturanSimrs == "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[NEW-PATIENT][PENGATURAN-SIMRS][ERROR]");
        }
        logging.debug(`[NEW-PATIENT] Data Pengaturan SIMRS => ${JSON.stringify(dataPengaturanSimrs)}`);

        let nomorRekamMedik = dataPengaturanSimrs[0].mulai_no_rm;

        // let dataResponse = {};
        // dataResponse.norm   = nomorRekamMedik;

        let dataCreatePatient = {
            no_rm           : nomorRekamMedik,
            no_identitas    : nik,
            nomorkk         : nomorkk,
            nama_pasien     : nama,
            jenkel          : _jeniskelamin,
            gol_darah       : "O",
            tempat_lahir    : "-",
            tgl_lahir       : tanggallahir,
            umur            : "0",
            no_telp         : "0",
            no_hp           : nohp,
            alamat          : alamat,
            kota            : "",
            kecamatan       : "",
            kelurahan       : "",
            rt_rw           : rt + "/" + rw,
            domisili        : "",
            agama           : "",
            pendidikan      : "",
            pekerjaan       : "",
            status_kawin    : "",
            catatan         : "",
            nama_wali       : "",
            alamat_wali     : "",
            hubungan_wali   : "",
            status          : "",
            berat_badan     : "",
            suku            : "",
            bahasa          : "",
            warga_negara    : "",
            negara          : "",
            provinsi        : "",
            ras             : "",
            kewarganegaraan : "",
            no_bpjs         : nomorkartu,
            pasienbaru      : 1,
            create_by       : "-",
            update_by       : "-",
            createdAt       : moment().format("YYYY-MM-DD HH:mm:ss"),
            updatedAt       : moment().format("YYYY-MM-DD HH:mm:ss"),
        };

        let NewPatient = await createNewPatient(dataCreatePatient);
        if (NewPatient == "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][ERROR]");
        }
        logging.debug(`[NEW-PATIENT] Pasien baru berhasil disimpan => ${JSON.stringify(dataCreatePatient)}`);

        let dataUpdatePengaturanSimrs = {
            mulai_no_rm: parseInt(dataPengaturanSimrs[0].mulai_no_rm) + 1,
            updatedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
        };

        let _updatePengaturanSimrs = await updatePengaturanSimrs(dataPengaturanSimrs[0]._id, dataUpdatePengaturanSimrs);
        logging.debug(`[NEW-PATIENT][PENGATURAN-SIMRS] No. RM Pada Pengaturan SIMRS berhasil di update => ${JSON.stringify(_updatePengaturanSimrs)}`);

        let checkTglPeriksaDanPoli = await getAntrianByTglPeriksaPoliNoKartu(tanggalperiksa, kodepoli, nomorkartu, kodedokter);
        if (checkTglPeriksaDanPoli == "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][NO-KARTU][ERROR]");
        } 
        if (checkTglPeriksaDanPoli.length > 0) {
            let lastAntrian = checkTglPeriksaDanPoli.slice(-1)[0];
            if (lastAntrian.status != "batal") {
                return Response(res, "Nomor Antrean Hanya Dapat Diambil 1 Kali Pada Tanggal Yang Sama", null, 201, "[GET-ANTRIAN][NO-KARTU][AVAILABLE]");
            }
        }

        let poliklinik = await getPoliklinik(kodepoli);
        if (poliklinik == "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][POLIKLINIK][ERROR]");
        } else if(poliklinik === null){
            return Response(res, "Data Poli Tidak Ditemukan", null, 201, "[GET-ANTRIAN][POLIKLINIK][NOT-FOUND]");
        }

        let checkTanggalPeriksa = periksaTanggal(tanggalperiksa);
        if (checkTanggalPeriksa.result === false) {
            return Response(res, checkTanggalPeriksa.message, null, 201, "[GET-ANTRIAN][TANGGAL-PERIKSA][NOT-VALID]");
        }

        // let DataDokter = await getDataDokter(kodedokter);
        let TempDataDokter = await requestUrlGet(config.dokter.url);
        if (TempDataDokter == "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][DATA-DOKTER]][ERROR]");
        } else if(TempDataDokter.metadata.code !== 200){
            return Response(res, "Data Dokter Tidak Ditemukan", null, 201, "[GET-ANTRIAN][DATA-DOKTER][NOT-FOUND]");
        }

        let DataDokter = {};
        for (let i = 0; i < TempDataDokter.response.length; i++) {
            if(TempDataDokter.response[i].kodedokter === kodedokter) {
                DataDokter = {
                    nama : TempDataDokter.response[i].namadokter
                }
            }
        }
    
        let check_day = moment(tanggalperiksa).day();
        let arr_jampraktek = jampraktek.split("-");

        let dataReq = {
            kodepoli:kodepoli,
            tanggal:tanggalperiksa,
        }
        let jadwalDokter = await requestUrl(config.jadwaldokter.url, dataReq);
        if (jadwalDokter === "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[JADWAL-DOKTER][ERROR]");
        }
        if (jadwalDokter.metadata.code != 200) {
            return Response(res, "Pendaftaran ke Poli Ini Sedang Tutup", null, 201, "[JADWAL-DOKTER][FAILED]");
        }
        logging.info(`[JADWAL-DOKTER][SUCCESSFULLY] ${JSON.stringify(jadwalDokter)}`);

        let tempdatadokter = null;
        for (let i = 0; i < jadwalDokter.response.length; i++) {
            if (kodedokter == jadwalDokter.response[i].kodedokter && jampraktek == jadwalDokter.response[i].jadwal) {
                tempdatadokter = jadwalDokter.response[i];
            }
        }
        
        if(tempdatadokter == null){
            return Response(res, `Jadwal Dokter ${DataDokter.nama} Tersebut Belum Tersedia, Silahkan Reschedule Tanggal dan Jam Praktek Lainnya`, null, 201, "[GET-ANTRIAN][JADWAL-DOKTER][NOT-FOUND]");
        }

        // cek tanggal periksa, jika sama dengan tanggal hari ini periksa jam, jika >= jam tutup muncul validasi poli tutup. 
        let datetoday = moment().format('YYYY-MM-DD');
        let timetoday = moment().format('HH:mm');
        let timeclose = arr_jampraktek[1];
        if (moment(tanggalperiksa, 'YYYY-MM-DD').format('YYYY-MM-DD').toString() == moment(datetoday, 'YYYY-MM-DD').format('YYYY-MM-DD').toString()) {
            if (moment(timetoday, 'HH:mm').format('HH:mm').toString() >= moment(timeclose, 'HH:mm').format('HH:mm').toString()) {
                return Response(res, `Pendaftaran Ke Poli ${poliklinik.nama} Sudah Tutup Jam ${timeclose}`, null, 201, "[GET-ANTRIAN][NOT-FOUND]");
            }
        }

        let AbjadAntrean = "";
        AbjadAntrean = SwitchAbjad(kodepoli);
        if (AbjadAntrean === null) {
            return Response(res, "Abjad antrean belum tersedia.", null, 201, "[GET-ANTRIAN][ERROR]");
        }

        let arr_jadwal = tempdatadokter.jadwal.split("-");

        let _kuotajkn = 30;
        let _kuotanonjkn = 30;
        let _sisakuotajkn = 0
        let _sisakuotanonjkn = 0
        let urutantrean;
        let estimasiDilayani = 0;
        let estimasiSelesai = 0;

        let getAntrian    = await getAntrianPoliklinik(kodepoli, kodedokter, tanggalperiksa, jampraktek);
        if (getAntrian === "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][GET-ANTRIAN-KOSONG][ERROR]");
        } else if(getAntrian.length == 0){
            
            let tanggaltutup = moment(tanggalperiksa + ' ' + arr_jadwal[1], 'YYYY-MM-DD HH:mm');
            
            let timeStart   = moment(arr_jadwal[1], 'HH:mm').subtract(arr_jadwal[0], 'HH:mm').format("HH:mm");

            let timeFinish = moment(timeStart, 'HH:mm').subtract('00:06', 'HH:mm').format("HH:mm");

            estimasiDilayani = moment(tanggaltutup, 'HH:mm').subtract(timeStart, 'HH:mm').format();

            estimasiSelesai = moment(tanggaltutup, 'HH:mm').subtract(timeFinish, 'HH:mm').format();
        
            urutantrean = 1;
            _sisakuotajkn = _kuotajkn - 1;
            _sisakuotanonjkn = _kuotanonjkn -1;
        } else {

            let getAntrian2    = await getAntrianPoliklinik2(kodepoli, kodedokter, tanggalperiksa, jampraktek);

            let lastAntrian = getAntrian.slice(-1);

            let tanggaltutup = moment(tanggalperiksa + ' ' + arr_jadwal[1], 'YYYY-MM-DD HH:mm');
            
            let timeStart   = moment(arr_jadwal[1], 'HH:mm').subtract(lastAntrian[0].waktu_selesai, 'HH:mm').format("HH:mm");

            let timeFinish = moment(timeStart, 'HH:mm').subtract('00:06', 'HH:mm').format("HH:mm");

            estimasiDilayani = moment(tanggaltutup, 'HH:mm').subtract(timeStart, 'HH:mm').format();

            estimasiSelesai = moment(tanggaltutup, 'HH:mm').subtract(timeFinish, 'HH:mm').format();
            countantrean = getAntrian.length;
            maxangkaantrean = await biggestNumberInArray(getAntrian);
            
            countantrean2 = getAntrian2.length;

            urutantrean = maxangkaantrean + 1;
            _sisakuotajkn = (_kuotajkn + countantrean2) - urutantrean;
            _sisakuotanonjkn = (_kuotanonjkn + countantrean2) - urutantrean;
        }

        let dataResponse = {};
        dataResponse.nomorantrean       = AbjadAntrean+"-"+sprintf("%d", urutantrean),
        dataResponse.angkaantrean       = urutantrean
        dataResponse.kodebooking        = moment(tanggalperiksa, 'YYYY-MM-DD').format("DDMMYYYY")+AbjadAntrean+sprintf("%03d", urutantrean)
        dataResponse.norm               = nomorRekamMedik
        dataResponse.namapoli           = poliklinik.nama
        dataResponse.namadokter         = DataDokter.nama
        dataResponse.estimasidilayani   = parseInt(moment(estimasiDilayani).format("x"));
        dataResponse.kuotajkn           = _kuotajkn
        dataResponse.sisakuotajkn       = _sisakuotajkn
        dataResponse.kuotanonjkn        = _kuotanonjkn
        dataResponse.sisakuotanonjkn    = _sisakuotanonjkn
        dataResponse.keterangan         = "Peserta harap 60 menit lebih awal guna pencatatan administrasi."

        let _jenispasien = 'JKN';

        let dataCreateAntrian = {
            nomorkartu      : nomorkartu,
            nik             : nik,
            nohp            : nohp,
            poliklinik_id   : poliklinik._id,
            kodepoli        : kodepoli,
            norm            : nomorRekamMedik,
            tanggalperiksa  : tanggalperiksa,
            // dokter_id       : DataDokter._id,
            namadokter      : DataDokter.nama,
            kodedokter      : kodedokter,
            jampraktek      : jampraktek,
            jeniskunjungan  : jeniskunjungan,
            nomorreferensi  : nomorreferensi,
            hurufantrean    : AbjadAntrean,
            nomorantrean    : dataResponse.nomorantrean,
            angkaantrean    : dataResponse.angkaantrean,
            kodebooking     : dataResponse.kodebooking,
            estimasidilayani: dataResponse.estimasidilayani,
            waktu_dilayani  : moment(estimasiDilayani).format("HH:mm"),
            waktu_selesai   : moment(estimasiSelesai).format("HH:mm"),
            waktu_checkin   : null,

            waktu_tunggu_admisi     : null,
            waktu_dilayani_admisi   : null,
            waktu_tunggu_poli       : null,
            waktu_dilayani_poli     : null,
            waktu_tunggu_farmasi    : null,
            waktu_dilayani_farmasi  : null,
            waktu_dilayani_selesai  : null,

            waktu_dipanggil_admisi  : null,
            waktu_dipanggil_poli  : null,
            waktu_dipanggil_farmasi  : null,

            waktu_batal             : null,
            // kuotajkn        : dataResponse.kuotajkn,
            // sisakuotajkn    : dataResponse.sisakuotajkn,
            // kuotanonjkn     : dataResponse.kuotanonjkn,
            // sisakuotanonjkn : dataResponse.sisakuotanonjkn,

            jenispasien     : _jenispasien,
            pasienbaru      : 1,
            keterangan      : dataResponse.keterangan,
            status          : 'checkin',
            taskid          : 1,
            loket_id        : null,
            loket_farmasi_id: null,
            status_display  : false,
            createdAt       : moment().format("YYYY-MM-DD HH:mm:ss"),
            updatedAt       : moment().format("YYYY-MM-DD HH:mm:ss"),
        }

        let createAntrianPoli = await createAntrianPoliklinik(dataCreateAntrian);
        if (createAntrianPoli == "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][ERROR]");
        }

        let dataPushAantian = {
            kodebooking     : dataResponse.kodebooking,
            jenispasien     : _jenispasien,
            nomorkartu      : nomorkartu,
            nik             : nik,
            nohp            : nohp,
            kodepoli        : kodepoli,
            namapoli        : dataResponse.namapoli,
            pasienbaru      : 1,
            norm            : nomorRekamMedik,
            tanggalperiksa  : tanggalperiksa,
            kodedokter      : kodedokter,
            namadokter      : dataResponse.namadokter,
            jampraktek      : jampraktek,
            jeniskunjungan  : jeniskunjungan,
            nomorreferensi  : nomorreferensi,
            nomorantrean    : dataResponse.nomorantrean,
            angkaantrean    : dataResponse.angkaantrean,
            estimasidilayani: dataResponse.estimasidilayani,
            sisakuotajkn    : dataResponse.sisakuotajkn,
            kuotajkn        : dataResponse.kuotajkn,
            sisakuotanonjkn : dataResponse.sisakuotanonjkn,
            kuotanonjkn     : dataResponse.kuotanonjkn,
            keterangan      : dataResponse.keterangan,
        }

        let addAntrean = await requestUrl(config.addantrean.url, dataPushAantian);
        if (addAntrean === "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][GET-ANTRIAN-KOSONG][ERROR]");
        }
        if (addAntrean.metadata.code != 200) {
            return Response(res, addAntrean.metadata.message, null, 201, "[PUSH-ANTRIAN][FAILED]");
        }
        logging.info(`[PUSH-ANTRIAN][SUCCESSFULLY] ${JSON.stringify(addAntrean)}`);

        let waktu =  moment().format("YYYY-MM-DD HH:mm:ss")
        let dataPushCheckinAantian = {
            kodebooking     : dataResponse.kodebooking,
            taskid          : 1,
            waktu      : parseInt(moment(waktu).format("x")),
        }

        let checkinAntrean = await requestUrl(config.updatewaktu.url, dataPushCheckinAantian);
        if (checkinAntrean === "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][GET-ANTRIAN-KOSONG][ERROR]");
        }
        if (checkinAntrean.metadata.code != 200) {
            return Response(res, checkinAntrean.metadata.message, null, 201, "[CANCEL-ANTRIAN][FAILED]");
        }
        logging.info(`[CHECKIN-ANTRIAN][SUCCESSFULLY] ${JSON.stringify(checkinAntrean)}`);

        // return Response(res, "Harap datang ke admisi untuk melengkapi data rekam medis.", dataResponse, 200, "[NEW-PATIENT][SUCCESSFULLY]");
        return Response(res, "Ok", dataResponse, 200, "[GET-ANTRIAN][SUCCESSFULLY]");
    })
    .catch(function (err) {
        console.log(err);
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

        return Response(res, "Validation Form Error", data, 422, `[GET-ANTRIAN][VALIDATION][FORM][ERROR] ${err.message}`);
    });
};

exports.newPatientNonBpjs = async (req, res) => {
    logging.info(`[HTTP][REQUEST][HEADER] ${JSON.stringify(req.headers)}`);
    logging.info(`[HTTP][REQUEST][BODY] ${JSON.stringify(req.body)}`);
    logging.info(`[HTTP][REQUEST][PARAMS] ${JSON.stringify(req.params)}`);

    await tokenValidator.Authentication(req, res);
    validateData = ajv.compile(JSON.parse(validateNewPatient));

    let {
        nomorkartu,
        nik,
        nomorkk,
        nama,
        jeniskelamin,
        tanggallahir,
        nohp,
        alamat,
        kodeprop,
        namaprop,
        kodedati2,
        namadati2,
        kodekec,
        namakec,
        kodekel,
        namakel,
        rw,
        rt
    } = req.body;

    dataValidate(req.body)
    .then(async function () {
        
        // if (nomorkartu == "" || nomorkartu == null) {
        //     return Response(res, "Nomor Kartu Belum Diisi", null, 201, "[NEW-PATIENT][NO-KARTU][EMPTY]");
        // }

        if (nik == "" || nik == null) {
            return Response(res, "NIK Belum Diisi", null, 201, "[NEW-PATIENT][NIK][EMPTY]");
        }

        if (nomorkk == "" || nomorkk == null) {
            return Response(res, "Nomor KK Belum Diisi", null, 201, "[NEW-PATIENT][NO-KK][EMPTY]");
        }

        // if (isNaN(nomorkartu)) {
        //     return Response(res, "Format Nomor Kartu Tidak Sesuai", null, 201, "[NEW-PATIENT][NO-KARTU][AVAILABLE]");
        // }

        if (isNaN(nik)) {
            return Response(res, "Format NIK Tidak Sesuai", null, 201, "[NEW-PATIENT][NO-KARTU][AVAILABLE]");
        }

        if (isNaN(nomorkk)) {
            return Response(res, "Format KK Tidak Sesuai", null, 201, "[NEW-PATIENT][NO-KARTU][AVAILABLE]");
        }

        // if (nomorkartu.length != 13) {
        //     return Response(res, "Format Nomor Kartu Tidak Sesuai", null, 201, "[NEW-PATIENT][NO-KARTU][AVAILABLE]");
        // }
        
        if (nik.length != 16) {
            return Response(res, "Format NIK Tidak Sesuai", null, 201, "[NEW-PATIENT][NIK][AVAILABLE]");
        }

        if (nomorkk.length != 16) {
            return Response(res, "Format KK Tidak Sesuai", null, 201, "[NEW-PATIENT][NO-KK][AVAILABLE]");
        }

        if (nama == "" || nama == null) {
            return Response(res, "Nama Belum Diisi", null, 201, "[NEW-PATIENT][NAMA][EMPTY]");
        }

        if (jeniskelamin == "" || jeniskelamin == null) {
            return Response(res, "Jenis Kelamin Belum Dipilih", null, 201, "[NEW-PATIENT][JENIS-KELAMIN][EMPTY]");
        }

        if (tanggallahir == "" || tanggallahir == null) {
            return Response(res, "Tanggal Lahir Belum Diisi", null, 201, "[NEW-PATIENT][TGL-LAHIR][EMPTY]");
        }

        if (moment(tanggallahir).isAfter(moment(), "day")) {
            return Response(res, "Format Tanggal Lahir Tidak Sesuai", null, 201, "[NEW-PATIENT][TGL-LAHIR][FORMAT-DATE-NOT-FOUND]");
        }

        if (alamat == "" || alamat == null) {
            return Response(res, "Alamat Belum Diisi", null, 201, "[NEW-PATIENT][ALAMAT][EMPTY]");
        }

        if (kodeprop == "" || kodeprop == null) {
            return Response(res, "Kode Propinsi Belum Diisi", null, 201, "[NEW-PATIENT][KODEPROP][EMPTY]");
        }

        if (namaprop == "" || namaprop == null) {
            return Response(res, "Nama Propinsi Belum Diisi", null, 201, "[NEW-PATIENT][NAMAPROP][EMPTY]");
        }
        
        if (kodedati2 == "" || kodedati2 == null) {
            return Response(res, "Kode Dati 2 Belum Diisi", null, 201, "[NEW-PATIENT][KODEDATI2][EMPTY]");
        }

        if (namadati2 == "" || namadati2 == null) {
            return Response(res, "Dati 2 Belum Diisi", null, 201, "[NEW-PATIENT][NAMADATI2][EMPTY]");
        }

        if (kodekec == "" || kodekec == null) {
            return Response(res, "Kode Kecamatan Belum Diisi", null, 201, "[NEW-PATIENT][KODEKEC][EMPTY]");
        }

        if (namakec == "" || namakec == null) {
            return Response(res, "Kecamatan Belum Diisi", null, 201, "[NEW-PATIENT][NAMAKEC][EMPTY]");
        }

        if (kodekel == "" || kodekel == null) {
            return Response(res, "Kode Kelurahan Belum Diisi", null, 201, "[NEW-PATIENT][KODEKEL][EMPTY]");
        }

        if (namakel == "" || namakel == null) {
            return Response(res, "Kelurahan Belum Diisi", null, 201, "[NEW-PATIENT][NAMAKEL][EMPTY]");
        }

        if (rt == "" || rt == null) {
            return Response(res, "RT Belum Diisi", null, 201, "[NEW-PATIENT][RT][EMPTY]");
        }

        if (rw == "" || rw == null) {
            return Response(res, "RW Belum Diisi", null, 201, "[NEW-PATIENT][RW][EMPTY]");
        }

        if (jeniskelamin != "L" && jeniskelamin != "P") {
            return Response(res, "Jenis kelamin harus L atau P", null, 201, "[GET-ANTRIAN][JENIS-KELAMIN][AVAILABLE]");
        }
        let _jeniskelamin = "";
        if (jeniskelamin === "L") {
            _jeniskelamin = "Laki-laki";
        } else if (jeniskelamin === "P") {
            _jeniskelamin = "Perempuan";
        }

        let cekPasien = await getPasienByNik(nik);
        if (cekPasien == "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[NEW-PATIENT][GET-PASIEN][ERROR]");
        }
        if (cekPasien != null) {
            return Response(res, "Data Peserta Sudah Pernah Dientrikan", null, 201, "[NEW-PATIENT][GET-PASIEN][ERROR]");
        }

        let dataPengaturanSimrs = await getDataPengaturanSimrs();
        if (dataPengaturanSimrs == "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[NEW-PATIENT][PENGATURAN-SIMRS][ERROR]");
        }
        logging.debug(`[NEW-PATIENT] Data Pengaturan SIMRS => ${JSON.stringify(dataPengaturanSimrs)}`);

        let nomorRekamMedik = dataPengaturanSimrs[0].mulai_no_rm;

        let dataResponse = {};
        dataResponse.norm   = nomorRekamMedik;

        let dataCreatePatient = {
            no_rm           : nomorRekamMedik,
            no_identitas    : nik,
            nomorkk         : nomorkk,
            nama_pasien     : nama,
            jenkel          : _jeniskelamin,
            gol_darah       : "O",
            tempat_lahir    : "-",
            tgl_lahir       : tanggallahir,
            umur            : "0",
            no_telp         : "0",
            no_hp           : nohp,
            alamat          : alamat,
            kota            : "",
            kecamatan       : "",
            kelurahan       : "",
            rt_rw           : rt + "/" + rw,
            domisili        : "",
            agama           : "",
            pendidikan      : "",
            pekerjaan       : "",
            status_kawin    : "",
            catatan         : "",
            nama_wali       : "",
            alamat_wali     : "",
            hubungan_wali   : "",
            status          : "",
            berat_badan     : "",
            suku            : "",
            bahasa          : "",
            warga_negara    : "",
            negara          : "",
            provinsi        : "",
            ras             : "",
            kewarganegaraan : "",
            no_bpjs         : nomorkartu,
            pasienbaru      : 1,
            create_by       : "-",
            update_by       : "-",
            createdAt       : moment().format("YYYY-MM-DD HH:mm:ss"),
            updatedAt       : moment().format("YYYY-MM-DD HH:mm:ss"),
        };

        let NewPatient = await createNewPatient(dataCreatePatient);
        if (NewPatient == "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][ERROR]");
        }
        logging.debug(`[NEW-PATIENT] Pasien baru berhasil disimpan => ${JSON.stringify(dataCreatePatient)}`);

        let dataUpdatePengaturanSimrs = {
            mulai_no_rm: parseInt(dataPengaturanSimrs[0].mulai_no_rm) + 1,
            updatedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
        };

        let _updatePengaturanSimrs = await updatePengaturanSimrs(dataPengaturanSimrs[0]._id, dataUpdatePengaturanSimrs);
        logging.debug(`[NEW-PATIENT][PENGATURAN-SIMRS] No. RM Pada Pengaturan SIMRS berhasil di update => ${JSON.stringify(_updatePengaturanSimrs)}`);

        return Response(res, "Harap datang ke admisi untuk melengkapi data rekam medis.", dataResponse, 200, "[NEW-PATIENT][SUCCESSFULLY]");
    })
    .catch(function (err) {
        console.log(err);
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

        return Response(res, "Validation Form Error", data, 422, `[GET-ANTRIAN][VALIDATION][FORM][ERROR] ${err.message}`);
    });
};

exports.newPatientNonBpjsAndGetAntrean = async (req, res) => {
    let config   = iniParser.get();
    logging.info(`[HTTP][REQUEST][HEADER] ${JSON.stringify(req.headers)}`);
    logging.info(`[HTTP][REQUEST][BODY] ${JSON.stringify(req.body)}`);
    logging.info(`[HTTP][REQUEST][PARAMS] ${JSON.stringify(req.params)}`);

    await tokenValidator.Authentication(req, res);
    validateData = ajv.compile(JSON.parse(validateNewPatient));

    let {
        nomorkartu,
        nik,
        nomorkk,
        nama,
        jeniskelamin,
        tanggallahir,
        nohp,
        alamat,
        kodeprop,
        namaprop,
        kodedati2,
        namadati2,
        kodekec,
        namakec,
        kodekel,
        namakel,
        rw,
        rt,

        kodepoli,
        norm,
        tanggalperiksa,
        kodedokter,
        jampraktek,
        jeniskunjungan,
        nomorreferensi
    } = req.body;

    dataValidate(req.body)
    .then(async function () {
        
        // if (nomorkartu == "" || nomorkartu == null) {
        //     return Response(res, "Nomor Kartu Belum Diisi", null, 201, "[NEW-PATIENT][NO-KARTU][EMPTY]");
        // }

        if (nik == "" || nik == null) {
            return Response(res, "NIK Belum Diisi", null, 201, "[NEW-PATIENT][NIK][EMPTY]");
        }

        if (nomorkk == "" || nomorkk == null) {
            return Response(res, "Nomor KK Belum Diisi", null, 201, "[NEW-PATIENT][NO-KK][EMPTY]");
        }

        // if (isNaN(nomorkartu)) {
        //     return Response(res, "Format Nomor Kartu Tidak Sesuai", null, 201, "[NEW-PATIENT][NO-KARTU][AVAILABLE]");
        // }

        if (isNaN(nik)) {
            return Response(res, "Format NIK Tidak Sesuai", null, 201, "[NEW-PATIENT][NO-KARTU][AVAILABLE]");
        }

        if (isNaN(nomorkk)) {
            return Response(res, "Format KK Tidak Sesuai", null, 201, "[NEW-PATIENT][NO-KARTU][AVAILABLE]");
        }

        // if (nomorkartu.length != 13) {
        //     return Response(res, "Format Nomor Kartu Tidak Sesuai", null, 201, "[NEW-PATIENT][NO-KARTU][AVAILABLE]");
        // }
        
        if (nik.length != 16) {
            return Response(res, "Format NIK Tidak Sesuai", null, 201, "[NEW-PATIENT][NIK][AVAILABLE]");
        }

        if (nomorkk.length != 16) {
            return Response(res, "Format KK Tidak Sesuai", null, 201, "[NEW-PATIENT][NO-KK][AVAILABLE]");
        }

        if (nama == "" || nama == null) {
            return Response(res, "Nama Belum Diisi", null, 201, "[NEW-PATIENT][NAMA][EMPTY]");
        }

        if (jeniskelamin == "" || jeniskelamin == null) {
            return Response(res, "Jenis Kelamin Belum Dipilih", null, 201, "[NEW-PATIENT][JENIS-KELAMIN][EMPTY]");
        }

        if (tanggallahir == "" || tanggallahir == null) {
            return Response(res, "Tanggal Lahir Belum Diisi", null, 201, "[NEW-PATIENT][TGL-LAHIR][EMPTY]");
        }

        if (moment(tanggallahir).isAfter(moment(), "day")) {
            return Response(res, "Format Tanggal Lahir Tidak Sesuai", null, 201, "[NEW-PATIENT][TGL-LAHIR][FORMAT-DATE-NOT-FOUND]");
        }

        if (alamat == "" || alamat == null) {
            return Response(res, "Alamat Belum Diisi", null, 201, "[NEW-PATIENT][ALAMAT][EMPTY]");
        }

        if (kodeprop == "" || kodeprop == null) {
            return Response(res, "Kode Propinsi Belum Diisi", null, 201, "[NEW-PATIENT][KODEPROP][EMPTY]");
        }

        if (namaprop == "" || namaprop == null) {
            return Response(res, "Nama Propinsi Belum Diisi", null, 201, "[NEW-PATIENT][NAMAPROP][EMPTY]");
        }
        
        if (kodedati2 == "" || kodedati2 == null) {
            return Response(res, "Kode Dati 2 Belum Diisi", null, 201, "[NEW-PATIENT][KODEDATI2][EMPTY]");
        }

        if (namadati2 == "" || namadati2 == null) {
            return Response(res, "Dati 2 Belum Diisi", null, 201, "[NEW-PATIENT][NAMADATI2][EMPTY]");
        }

        if (kodekec == "" || kodekec == null) {
            return Response(res, "Kode Kecamatan Belum Diisi", null, 201, "[NEW-PATIENT][KODEKEC][EMPTY]");
        }

        if (namakec == "" || namakec == null) {
            return Response(res, "Kecamatan Belum Diisi", null, 201, "[NEW-PATIENT][NAMAKEC][EMPTY]");
        }

        if (kodekel == "" || kodekel == null) {
            return Response(res, "Kode Kelurahan Belum Diisi", null, 201, "[NEW-PATIENT][KODEKEL][EMPTY]");
        }

        if (namakel == "" || namakel == null) {
            return Response(res, "Kelurahan Belum Diisi", null, 201, "[NEW-PATIENT][NAMAKEL][EMPTY]");
        }

        if (rt == "" || rt == null) {
            return Response(res, "RT Belum Diisi", null, 201, "[NEW-PATIENT][RT][EMPTY]");
        }

        if (rw == "" || rw == null) {
            return Response(res, "RW Belum Diisi", null, 201, "[NEW-PATIENT][RW][EMPTY]");
        }

        if (jeniskelamin != "L" && jeniskelamin != "P") {
            return Response(res, "Jenis kelamin harus L atau P", null, 201, "[GET-ANTRIAN][JENIS-KELAMIN][AVAILABLE]");
        }
        let _jeniskelamin = "";
        if (jeniskelamin === "L") {
            _jeniskelamin = "Laki-laki";
        } else if (jeniskelamin === "P") {
            _jeniskelamin = "Perempuan";
        }

        if (jeniskunjungan != 1 && jeniskunjungan != 2 && jeniskunjungan != 3 && jeniskunjungan != 4) {
            return Response(res, "Jenis Kunjungan yang dimasukkan tidak valid", null, 201, "[GET-ANTRIAN][JENIS-KUnJUNGAN][AVAILABLE]");
        }

        let cekPasien = await getPasienByNik(nik);
        if (cekPasien == "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[NEW-PATIENT][GET-PASIEN][ERROR]");
        }
        if (cekPasien != null) {
            return Response(res, "Data Peserta Sudah Pernah Dientrikan", null, 201, "[NEW-PATIENT][GET-PASIEN][ERROR]");
        }

        let dataPengaturanSimrs = await getDataPengaturanSimrs();
        if (dataPengaturanSimrs == "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[NEW-PATIENT][PENGATURAN-SIMRS][ERROR]");
        }
        logging.debug(`[NEW-PATIENT] Data Pengaturan SIMRS => ${JSON.stringify(dataPengaturanSimrs)}`);

        let nomorRekamMedik = dataPengaturanSimrs[0].mulai_no_rm;

        // let dataResponse = {};
        // dataResponse.norm   = nomorRekamMedik;

        let dataCreatePatient = {
            no_rm           : nomorRekamMedik,
            no_identitas    : nik,
            nomorkk         : nomorkk,
            nama_pasien     : nama,
            jenkel          : _jeniskelamin,
            gol_darah       : "O",
            tempat_lahir    : "-",
            tgl_lahir       : tanggallahir,
            umur            : "0",
            no_telp         : "0",
            no_hp           : nohp,
            alamat          : alamat,
            kota            : "",
            kecamatan       : "",
            kelurahan       : "",
            rt_rw           : rt + "/" + rw,
            domisili        : "",
            agama           : "",
            pendidikan      : "",
            pekerjaan       : "",
            status_kawin    : "",
            catatan         : "",
            nama_wali       : "",
            alamat_wali     : "",
            hubungan_wali   : "",
            status          : "",
            berat_badan     : "",
            suku            : "",
            bahasa          : "",
            warga_negara    : "",
            negara          : "",
            provinsi        : "",
            ras             : "",
            kewarganegaraan : "",
            no_bpjs         : nomorkartu,
            pasienbaru      : 1,
            create_by       : "-",
            update_by       : "-",
            createdAt       : moment().format("YYYY-MM-DD HH:mm:ss"),
            updatedAt       : moment().format("YYYY-MM-DD HH:mm:ss"),
        };

        let NewPatient = await createNewPatient(dataCreatePatient);
        if (NewPatient == "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][ERROR]");
        }
        logging.debug(`[NEW-PATIENT] Pasien baru berhasil disimpan => ${JSON.stringify(dataCreatePatient)}`);

        let dataUpdatePengaturanSimrs = {
            mulai_no_rm: parseInt(dataPengaturanSimrs[0].mulai_no_rm) + 1,
            updatedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
        };

        let _updatePengaturanSimrs = await updatePengaturanSimrs(dataPengaturanSimrs[0]._id, dataUpdatePengaturanSimrs);
        logging.debug(`[NEW-PATIENT][PENGATURAN-SIMRS] No. RM Pada Pengaturan SIMRS berhasil di update => ${JSON.stringify(_updatePengaturanSimrs)}`);

        let checkTglPeriksaDanPoli = await getAntrianByTglPeriksaPoliNik(tanggalperiksa, kodepoli, nik, kodedokter);
        if (checkTglPeriksaDanPoli == "ERROR") {
                return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][NO-KARTU][ERROR]");
        } 
        if (checkTglPeriksaDanPoli.length > 0) {
            let lastAntrian = checkTglPeriksaDanPoli.slice(-1)[0];
            if (lastAntrian.status != "batal") {
                return Response(res, "Nomor Antrean Hanya Dapat Diambil 1 Kali Pada Tanggal Yang Sama", null, 201, "[GET-ANTRIAN][NO-KARTU][AVAILABLE]");
            }
        }

        let poliklinik = await getPoliklinik(kodepoli);
        if (poliklinik == "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][POLIKLINIK][ERROR]");
        } else if(poliklinik === null){
            return Response(res, "Data Poli Tidak Ditemukan", null, 201, "[GET-ANTRIAN][POLIKLINIK][NOT-FOUND]");
        }

        let checkTanggalPeriksa = periksaTanggal(tanggalperiksa);
        if (checkTanggalPeriksa.result === false) {
            return Response(res, checkTanggalPeriksa.message, null, 201, "[GET-ANTRIAN][TANGGAL-PERIKSA][NOT-VALID]");
        }

        // let DataDokter = await getDataDokter(kodedokter);
        let TempDataDokter = await requestUrlGet(config.dokter.url);
        if (TempDataDokter == "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][DATA-DOKTER]][ERROR]");
        } else if(TempDataDokter.metadata.code !== 200){
            return Response(res, "Data Dokter Tidak Ditemukan", null, 201, "[GET-ANTRIAN][DATA-DOKTER][NOT-FOUND]");
        }

        let DataDokter = {};
        for (let i = 0; i < TempDataDokter.response.length; i++) {
            if(TempDataDokter.response[i].kodedokter === kodedokter) {
                DataDokter = {
                    nama : TempDataDokter.response[i].namadokter
                }
            }
        }
    
        let check_day = moment(tanggalperiksa).day();
        let arr_jampraktek = jampraktek.split("-");

        let dataReq = {
            kodepoli:kodepoli,
            tanggal:tanggalperiksa,
        }
        let jadwalDokter = await requestUrl(config.jadwaldokter.url, dataReq);
        if (jadwalDokter === "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[JADWAL-DOKTER][ERROR]");
        }
        if (jadwalDokter.metadata.code != 200) {
            return Response(res, "Pendaftaran ke Poli Ini Sedang Tutup", null, 201, "[JADWAL-DOKTER][FAILED]");
        }
        logging.info(`[JADWAL-DOKTER][SUCCESSFULLY] ${JSON.stringify(jadwalDokter)}`);

        let tempdatadokter = null;
        for (let i = 0; i < jadwalDokter.response.length; i++) {
            if (kodedokter == jadwalDokter.response[i].kodedokter && jampraktek == jadwalDokter.response[i].jadwal) {
                tempdatadokter = jadwalDokter.response[i];
            }
        }
        
        if(tempdatadokter == null){
            return Response(res, `Jadwal Dokter ${DataDokter.nama} Tersebut Belum Tersedia, Silahkan Reschedule Tanggal dan Jam Praktek Lainnya`, null, 201, "[GET-ANTRIAN][JADWAL-DOKTER][NOT-FOUND]");
        }

        // cek tanggal periksa, jika sama dengan tanggal hari ini periksa jam, jika >= jam tutup muncul validasi poli tutup. 
        let datetoday = moment().format('YYYY-MM-DD');
        let timetoday = moment().format('HH:mm');
        let timeclose = arr_jampraktek[1];
        if (moment(tanggalperiksa, 'YYYY-MM-DD').format('YYYY-MM-DD').toString() == moment(datetoday, 'YYYY-MM-DD').format('YYYY-MM-DD').toString()) {
            if (moment(timetoday, 'HH:mm').format('HH:mm').toString() >= moment(timeclose, 'HH:mm').format('HH:mm').toString()) {
                return Response(res, `Pendaftaran Ke Poli ${poliklinik.nama} Sudah Tutup Jam ${timeclose}`, null, 201, "[GET-ANTRIAN][NOT-FOUND]");
            }
        }

        let AbjadAntrean = "";
        AbjadAntrean = SwitchAbjad(kodepoli);
        if (AbjadAntrean === null) {
            return Response(res, "Abjad antrean belum tersedia.", null, 201, "[GET-ANTRIAN][ERROR]");
        }

        let arr_jadwal = tempdatadokter.jadwal.split("-");

        let _kuotajkn = 30;
        let _kuotanonjkn = 30;
        let _sisakuotajkn = 0
        let _sisakuotanonjkn = 0
        let urutantrean;
        let estimasiDilayani = 0;
        let estimasiSelesai = 0;

        let getAntrian    = await getAntrianPoliklinik(kodepoli, kodedokter, tanggalperiksa, jampraktek);
        if (getAntrian === "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][GET-ANTRIAN-KOSONG][ERROR]");
        } else if(getAntrian.length == 0){
            
            let tanggaltutup = moment(tanggalperiksa + ' ' + arr_jadwal[1], 'YYYY-MM-DD HH:mm');
            
            let timeStart   = moment(arr_jadwal[1], 'HH:mm').subtract(arr_jadwal[0], 'HH:mm').format("HH:mm");

            let timeFinish = moment(timeStart, 'HH:mm').subtract('00:06', 'HH:mm').format("HH:mm");

            estimasiDilayani = moment(tanggaltutup, 'HH:mm').subtract(timeStart, 'HH:mm').format();

            estimasiSelesai = moment(tanggaltutup, 'HH:mm').subtract(timeFinish, 'HH:mm').format();
        
            urutantrean = 1;
            _sisakuotajkn = _kuotajkn - 1;
            _sisakuotanonjkn = _kuotanonjkn -1;
        } else {

            let getAntrian2    = await getAntrianPoliklinik2(kodepoli, kodedokter, tanggalperiksa, jampraktek);

            let lastAntrian = getAntrian.slice(-1);

            let tanggaltutup = moment(tanggalperiksa + ' ' + arr_jadwal[1], 'YYYY-MM-DD HH:mm');
            
            let timeStart   = moment(arr_jadwal[1], 'HH:mm').subtract(lastAntrian[0].waktu_selesai, 'HH:mm').format("HH:mm");

            let timeFinish = moment(timeStart, 'HH:mm').subtract('00:06', 'HH:mm').format("HH:mm");

            estimasiDilayani = moment(tanggaltutup, 'HH:mm').subtract(timeStart, 'HH:mm').format();

            estimasiSelesai = moment(tanggaltutup, 'HH:mm').subtract(timeFinish, 'HH:mm').format();
            countantrean = getAntrian.length;
            maxangkaantrean = await biggestNumberInArray(getAntrian);
            
            countantrean2 = getAntrian2.length;

            urutantrean = maxangkaantrean + 1;
            _sisakuotajkn = (_kuotajkn + countantrean2) - urutantrean;
            _sisakuotanonjkn = (_kuotanonjkn + countantrean2) - urutantrean;
        }

        let dataResponse = {};
        dataResponse.nomorantrean       = AbjadAntrean+"-"+sprintf("%d", urutantrean),
        dataResponse.angkaantrean       = urutantrean
        dataResponse.kodebooking        = moment(tanggalperiksa, 'YYYY-MM-DD').format("DDMMYYYY")+AbjadAntrean+sprintf("%03d", urutantrean)
        dataResponse.norm               = nomorRekamMedik
        dataResponse.namapoli           = poliklinik.nama
        dataResponse.namadokter         = DataDokter.nama
        dataResponse.estimasidilayani   = parseInt(moment(estimasiDilayani).format("x"));
        dataResponse.kuotajkn           = _kuotajkn
        dataResponse.sisakuotajkn       = _sisakuotajkn
        dataResponse.kuotanonjkn        = _kuotanonjkn
        dataResponse.sisakuotanonjkn    = _sisakuotanonjkn
        dataResponse.keterangan         = "Peserta harap 60 menit lebih awal guna pencatatan administrasi."

        let _jenispasien = 'NON JKN';

        let dataCreateAntrian = {
            nomorkartu      : nomorkartu,
            nik             : nik,
            nohp            : nohp,
            poliklinik_id   : poliklinik._id,
            kodepoli        : kodepoli,
            norm            : nomorRekamMedik,
            tanggalperiksa  : tanggalperiksa,
            // dokter_id       : DataDokter._id,
            namadokter      : DataDokter.nama,
            kodedokter      : kodedokter,
            jampraktek      : jampraktek,
            jeniskunjungan  : jeniskunjungan,
            nomorreferensi  : nomorreferensi,
            hurufantrean    : AbjadAntrean,
            nomorantrean    : dataResponse.nomorantrean,
            angkaantrean    : dataResponse.angkaantrean,
            kodebooking     : dataResponse.kodebooking,
            estimasidilayani: dataResponse.estimasidilayani,
            waktu_dilayani  : moment(estimasiDilayani).format("HH:mm"),
            waktu_selesai   : moment(estimasiSelesai).format("HH:mm"),
            waktu_checkin   : null,

            waktu_tunggu_admisi     : null,
            waktu_dilayani_admisi   : null,
            waktu_tunggu_poli       : null,
            waktu_dilayani_poli     : null,
            waktu_tunggu_farmasi    : null,
            waktu_dilayani_farmasi  : null,
            waktu_dilayani_selesai  : null,

            waktu_dipanggil_admisi  : null,
            waktu_dipanggil_poli  : null,
            waktu_dipanggil_farmasi  : null,

            waktu_batal             : null,
            // kuotajkn        : dataResponse.kuotajkn,
            // sisakuotajkn    : dataResponse.sisakuotajkn,
            // kuotanonjkn     : dataResponse.kuotanonjkn,
            // sisakuotanonjkn : dataResponse.sisakuotanonjkn,

            jenispasien     : _jenispasien,
            pasienbaru      : 1,
            keterangan      : dataResponse.keterangan,
            status          : 'checkin',
            taskid          : 1,
            loket_id        : null,
            loket_farmasi_id: null,
            status_display  : false,
            createdAt       : moment().format("YYYY-MM-DD HH:mm:ss"),
            updatedAt       : moment().format("YYYY-MM-DD HH:mm:ss"),
        }

        let createAntrianPoli = await createAntrianPoliklinik(dataCreateAntrian);
        if (createAntrianPoli == "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][ERROR]");
        }

        let dataPushAantian = {
            kodebooking     : dataResponse.kodebooking,
            jenispasien     : _jenispasien,
            nomorkartu      : nomorkartu,
            nik             : nik,
            nohp            : nohp,
            kodepoli        : kodepoli,
            namapoli        : dataResponse.namapoli,
            pasienbaru      : 1,
            norm            : nomorRekamMedik,
            tanggalperiksa  : tanggalperiksa,
            kodedokter      : kodedokter,
            namadokter      : dataResponse.namadokter,
            jampraktek      : jampraktek,
            jeniskunjungan  : jeniskunjungan,
            nomorreferensi  : nomorreferensi,
            nomorantrean    : dataResponse.nomorantrean,
            angkaantrean    : dataResponse.angkaantrean,
            estimasidilayani: dataResponse.estimasidilayani,
            sisakuotajkn    : dataResponse.sisakuotajkn,
            kuotajkn        : dataResponse.kuotajkn,
            sisakuotanonjkn : dataResponse.sisakuotanonjkn,
            kuotanonjkn     : dataResponse.kuotanonjkn,
            keterangan      : dataResponse.keterangan,
        }

        let addAntrean = await requestUrl(config.addantrean.url, dataPushAantian);
        if (addAntrean === "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][GET-ANTRIAN-KOSONG][ERROR]");
        }
        if (addAntrean.metadata.code != 200) {
            return Response(res, addAntrean.metadata.message, null, 201, "[PUSH-ANTRIAN][FAILED]");
        }
        logging.info(`[PUSH-ANTRIAN][SUCCESSFULLY] ${JSON.stringify(addAntrean)}`);

        let waktu =  moment().format("YYYY-MM-DD HH:mm:ss")
        let dataPushCheckinAantian = {
            kodebooking     : dataResponse.kodebooking,
            taskid          : 1,
            waktu      : parseInt(moment(waktu).format("x")),
        }

        let checkinAntrean = await requestUrl(config.updatewaktu.url, dataPushCheckinAantian);
        if (checkinAntrean === "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][GET-ANTRIAN-KOSONG][ERROR]");
        }
        if (checkinAntrean.metadata.code != 200) {
            return Response(res, checkinAntrean.metadata.message, null, 201, "[CANCEL-ANTRIAN][FAILED]");
        }
        logging.info(`[CHECKIN-ANTRIAN][SUCCESSFULLY] ${JSON.stringify(checkinAntrean)}`);

        // return Response(res, "Harap datang ke admisi untuk melengkapi data rekam medis.", dataResponse, 200, "[NEW-PATIENT][SUCCESSFULLY]");
        return Response(res, "Ok", dataResponse, 200, "[GET-ANTRIAN][SUCCESSFULLY]");
    })
    .catch(function (err) {
        console.log(err);
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

        return Response(res, "Validation Form Error", data, 422, `[GET-ANTRIAN][VALIDATION][FORM][ERROR] ${err.message}`);
    });
};

exports.statusAntrian = async (req, res) => {
    let config   = iniParser.get();
    logging.info(`[HTTP][REQUEST][HEADER] ${JSON.stringify(req.headers)}`);
    logging.info(`[HTTP][REQUEST][BODY] ${JSON.stringify(req.body)}`);
    logging.info(`[HTTP][REQUEST][PARAMS] ${JSON.stringify(req.params)}`);

    await tokenValidator.Authentication(req, res);

    try {
        let {
            kodepoli,
            kodedokter,
            tanggalperiksa,
            jampraktek
        } = req.body;

        let poliklinik              = await getPoliklinik(kodepoli);
        if (poliklinik == "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[STATUS-ANTRIAN][POLIKLINIK][ERROR]");
        } else if(poliklinik === null){
            return Response(res, "Poli Tidak Ditemukan", null, 201, "[STATUS-ANTRIAN][POLIKLINIK][NOT-FOUND]");
        }

        let isDateValid = moment(tanggalperiksa, 'YYYY-MM-DD', true).isValid();
        if (!isDateValid) {
            return Response(res, "Format Tanggal Tidak Sesuai, format yang benar adalah yyyy-mm-dd", null, 201, "[STATUS-ANTRIAN][POLIKLINIK][FORMAT-DATE-NOT-VALID]");
        } 

        if (moment(tanggalperiksa).isBefore(moment(), "day")) {
            return Response(res, "Tanggal Periksa Tidak Berlaku", null, 201, "[STATUS-ANTRIAN][POLIKLINIK][FORMAT-DATE-NOT-FOUND]");
        }

        // let DataDokter = await getDataDokter(kodedokter);
        // if (DataDokter == "ERROR") {
        //     return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][DATA-DOKTER]][ERROR]");
        // } else if(DataDokter === null){
        //     return Response(res, "Data Dokter Tidak Ditemukan", null, 201, "[GET-ANTRIAN][DATA-DOKTER][NOT-FOUND]");
        // }

        let TempDataDokter = await requestUrlGet(config.dokter.url);
        if (TempDataDokter == "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][DATA-DOKTER]][ERROR]");
        } else if(TempDataDokter.metadata.code !== 200){
            return Response(res, "Data Dokter Tidak Ditemukan", null, 201, "[GET-ANTRIAN][DATA-DOKTER][NOT-FOUND]");
        }

        let DataDokter = {};
        for (let i = 0; i < TempDataDokter.response.length; i++) {
            if(TempDataDokter.response[i].kodedokter === kodedokter) {
                DataDokter = {
                    nama : TempDataDokter.response[i].namadokter
                }
            }
        }

        let dataReq = {
            kodepoli:kodepoli,
            tanggal:tanggalperiksa,
        }
        let jadwalDokter = await requestUrl(config.jadwaldokter.url, dataReq);
        if (jadwalDokter === "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[JADWAL-DOKTER][ERROR]");
        }
        if (jadwalDokter.metadata.code != 200) {
            return Response(res, "Pendaftaran ke Poli Ini Sedang Tutup", null, 201, "[JADWAL-DOKTER][FAILED]");
        }
    
        let tempdatadokter = null;
        for (let i = 0; i < jadwalDokter.response.length; i++) {
            if (kodedokter == jadwalDokter.response[i].kodedokter && jampraktek == jadwalDokter.response[i].jadwal) {
                tempdatadokter = jadwalDokter.response[i];
            }
        }

        let urutantrean = 0;
        let totalantrean = 0;
        let sisaantrean = 0;
        let antreanpanggil = '-';
        let kuotajkn = 30;
        let kuotanonjkn = 30;
        let sisakuotajkn = 0;
        let sisakuotanonjkn = 0;
        let keterangan = '';

        // let getAntrian    = await getAntrianPoliklinik3(kodepoli, kodedokter, tanggalperiksa, jampraktek);
        let getAntrian = await getTotalAntrianPoliklinikKecualiBatalBySubSpesialisKodeDokterTglPeriksaJamPraktek(tempdatadokter.kodesubspesialis, kodedokter, tanggalperiksa, jampraktek);
        if (getAntrian === "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][ANTRIAN-KOSONG][ERROR]");
        } else if(getAntrian.length == 0 || getAntrian == null){
            // return Response(res, "Antrean kosong", null, 201, "[GET-ANTRIAN][ANTRIAN-KOSONG][ERROR]");
            totalantrean = 0;
            sisaantrean = 0;
            antreanpanggil = '-';
            sisakuotajkn = kuotajkn - totalantrean;
            sisakuotanonjkn = kuotanonjkn - totalantrean;
            keterangan = '';
        } else {
            // let getAntrianTaskIdGreaterThan5    = await getAntrianByTaskId(kodepoli, kodedokter, tanggalperiksa, jampraktek);
            // let getSisaAntrean    = await getTotalAntreanByTaskID(kodepoli, kodedokter, tanggalperiksa, jampraktek);
            let getSisaAntrean = await getTotalAntrianPoliklinikKecualiBatalByTaskID(tempdatadokter.kodesubspesialis, kodedokter, tanggalperiksa, jampraktek);
            // let getAntrianMenunggu    = await getAntrianMenungguPoliklinik(kodepoli, kodedokter, tanggalperiksa, jampraktek, 'menunggu');
            // let getAntrianDilayani    = await getAntrianDilayaniPoliklinik(kodepoli, kodedokter, tanggalperiksa, jampraktek, 'dilayani');
            // let getAntrianDilayani    = await getAntrianDilayaniByTaskID(kodepoli, kodedokter, tanggalperiksa, jampraktek, 'dilayani');
            let getAntrianDilayani    = await getAntrianDilayaniByTaskID4BySubpoli(tempdatadokter.kodesubspesialis, kodedokter, tanggalperiksa, jampraktek);

            totalantrean = getAntrian.length;
            // sisaantrean = getAntrianMenunggu.length;
            sisaantrean = getSisaAntrean.length;
            antreanpanggil = getAntrianDilayani == null ? '-' : getAntrianDilayani.nomorantrean;
            sisakuotajkn = kuotajkn - totalantrean;
            sisakuotanonjkn = kuotanonjkn - totalantrean;
            keterangan = '';
        }
                    
        let dataResponse = {};
        dataResponse.namapoli           = poliklinik.nama;  
        dataResponse.namadokter         = DataDokter.nama;
        dataResponse.totalantrean       = totalantrean;
        dataResponse.sisaantrean        = sisaantrean;
        dataResponse.antreanpanggil     = antreanpanggil;
        dataResponse.sisakuotajkn       = sisakuotajkn;
        dataResponse.kuotajkn           = kuotajkn;
        dataResponse.sisakuotanonjkn    = sisakuotanonjkn;
        dataResponse.kuotanonjkn        = kuotanonjkn;
        dataResponse.keterangan         = keterangan;

        return Response(res, "Ok", dataResponse, 200, "[STATUS-ANTRIAN][SUCCESSFULLY]");
    } catch (e) {
        console.log(e);
        
        return Response(res, "Internal Server Error", null, 500, `[GET-ANTRIAN][ERROR] ${e.message}`);
    }
};

exports.sisaAntrian = async (req, res) => {
    logging.info(`[HTTP][REQUEST][HEADER] ${JSON.stringify(req.headers)}`);
    logging.info(`[HTTP][REQUEST][BODY] ${JSON.stringify(req.body)}`);
    logging.info(`[HTTP][REQUEST][PARAMS] ${JSON.stringify(req.params)}`);

    await tokenValidator.Authentication(req, res);

    try {
        let {
            kodebooking,
        } = req.body;

        let getAntrian    = await getAntrianPoliklinikByKodeBooking(kodebooking);
        if (getAntrian === "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][ANTRIAN-KOSONG][ERROR]");
        }
        if (getAntrian == null){
            return Response(res, "Antrean Tidak Ditemukan", null, 201, "[GET-ANTRIAN][ANTRIAN-KOSONG][ERROR]");
        }
        // if (getAntrian.status == 'batal'){
        //     return Response(res, "Antrean Tidak Ditemukan atau Sudah Dibatalkan", null, 201, "[GET-ANTRIAN][ANTRIAN-KOSONG][ERROR]");
        // }

        let poliklinik = await getPoliklinik(getAntrian.kodepoli);
        if (poliklinik == "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][POLIKLINIK][ERROR]");
        } else if(poliklinik === null){
            return Response(res, "Data Poli Tidak Ditemukan", null, 201, "[GET-ANTRIAN][POLIKLINIK][NOT-FOUND]");
        }

        // let DataDokter = await getDataDokter(getAntrian.kodedokter);
        // if (DataDokter == "ERROR") {
        //     return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][DATA-DOKTER]][ERROR]");
        // } else if(DataDokter === null){
        //     return Response(res, "Data Dokter Tidak Ditemukan", null, 201, "[GET-ANTRIAN][DATA-DOKTER][NOT-FOUND]");
        // }

        let sisaAntrian = 0;
        let waktudilayani = 0;

        // let getAntrianDilayani    = await getAntrianDilayaniByTaskID(getAntrian.kodepoli, getAntrian.kodedokter, getAntrian.tanggalperiksa, getAntrian.jampraktek);
        let getAntrianDilayani    = await getAntrianDilayaniByTaskID4BySubpoli(getAntrian.kodesubpoli, getAntrian.kodedokter, getAntrian.tanggalperiksa, getAntrian.jampraktek);
        // let getTotalAntrian    = await getTotalAntreanByTaskID(getAntrian.kodepoli, getAntrian.kodedokter, getAntrian.tanggalperiksa, getAntrian.jampraktek);
        let getTotalAntrian = await getTotalAntrianPoliklinikKecualiBatalByTaskID(getAntrian.kodesubpoli, getAntrian.kodedokter, getAntrian.tanggalperiksa, getAntrian.jampraktek);
        // let getAntrianDilayani = await getAntrianDilayaniPoliklinik(getAntrian.kodepoli, getAntrian.kodedokter, getAntrian.tanggalperiksa, getAntrian.jampraktek, 'dilayani');
        if (getAntrianDilayani != null) {
            // sisaAntrian = parseInt(getAntrian.angkaantrean) - parseInt(getAntrianDilayani.angkaantrean);
            sisaAntrian = getTotalAntrian.length;
            waktudilayani = getAntrianDilayani.waktu_dilayani;
        } else {
            // let getAntrianMenunggu    = await getAntrianMenungguPoliklinik(getAntrian.kodepoli, getAntrian.kodedokter, getAntrian.tanggalperiksa, getAntrian.jampraktek, 'menunggu');
            // let getAntrianMenunggu    = await getTotalAntreanByTaskID(getAntrian.kodepoli, getAntrian.kodedokter, getAntrian.tanggalperiksa, getAntrian.jampraktek);
            let getAntrianMenunggu = await getTotalAntrianPoliklinikKecualiBatalByTaskID(getAntrian.kodesubpoli, getAntrian.kodedokter, getAntrian.tanggalperiksa, getAntrian.jampraktek);
        if (getAntrianMenunggu.length === 0) {
                waktudilayani = getAntrian.waktu_dilayani;
            } else {
                waktudilayani = getAntrianMenunggu[0].waktu_dilayani;
            }
            // sisaAntrian = getAntrianMenunggu.length;
            sisaAntrian = getTotalAntrian.length;
        }

        let startTime = moment(waktudilayani, "HH:mm");
        let endTime = moment(getAntrian.waktu_dilayani, "HH:mm");
        let duration = moment.duration(endTime.diff(startTime));
        let minutes = parseInt(duration.asMinutes())
        let seconds = parseInt(duration.asSeconds());

        let dataResponse = {};
        dataResponse.nomorantrean       = getAntrian.nomorantrean;
        dataResponse.namapoli           = poliklinik.nama;
        // dataResponse.namadokter         = DataDokter.nama;
        dataResponse.namadokter         = getAntrian.namadokter;
        dataResponse.sisaantrean        = sisaAntrian;
        dataResponse.antreanpanggil     = getAntrianDilayani == null ? "-" : getAntrianDilayani.nomorantrean;
        dataResponse.waktutunggu        = seconds;
        dataResponse.keterangan         =  `Waktu tunggu ${minutes} menit`;

        return Response(res, "Ok", dataResponse, 200, "[SISA-ANTRIAN][SUCCESSFULLY]");
    } catch (e) {
        return Response(res, "Internal Server Error", null, 201, `[SISA-ANTRIAN][ERROR] ${e.message}`);
    }
};

exports.batalAntrian = async (req, res) => {
    let config   = iniParser.get();

    logging.info(`[HTTP][REQUEST][HEADER] ${JSON.stringify(req.headers)}`);
    logging.info(`[HTTP][REQUEST][BODY] ${JSON.stringify(req.body)}`);
    logging.info(`[HTTP][REQUEST][PARAMS] ${JSON.stringify(req.params)}`);

    await tokenValidator.Authentication(req, res);
    validateData = ajv.compile(JSON.parse(validateBatalAntrian));

    let {
        kodebooking,
        keterangan,
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

        if (getAntrian.status === "dilayani") {
            return Response(res, "Pasien Sudah Dilayani, Antrean Tidak Dapat Dibatalkan", null, 201, "[GET-ANTRIAN][GAGAL][STATUS SUDAH DILAYANI]");
        }

        if (getAntrian.status === "selesai") {
            return Response(res, "Antrean Sudah Selesai", null, 201, "[GET-ANTRIAN][GAGAL][STATUS SUDAH DILAYANI]");
        }

        if (getAntrian.status === "batal") {
            return Response(res, "Antrean Tidak Ditemukan atau Sudah Dibatalkan", null, 201, "[GET-ANTRIAN][GAGAL][STATUS SUDAH DIBATAL]");
        }

        let dataPushBatalAantian = {
            kodebooking     : kodebooking,
            keterangan      : keterangan,
        }

        let cancelAntrean = await requestUrl(config.cancelantrean.url, dataPushBatalAantian);
        if (cancelAntrean === "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][GET-ANTRIAN-KOSONG][ERROR]");
        }
        if (cancelAntrean.metadata.code != 200) {
            return Response(res, cancelAntrean.metadata.message, null, 201, "[CANCEL-ANTRIAN][FAILED]");
        }
        logging.info(`[CANCEL-ANTRIAN][SUCCESSFULLY] ${JSON.stringify(cancelAntrean)}`);

        let dataUpdateAntrian = {
            status      : 'batal',
            taskid      : 0,
            keterangan  : keterangan,
            waktu_batal   : moment().format("YYYY-MM-DD HH:mm:ss"),
            updatedAt   : moment().format("YYYY-MM-DD HH:mm:ss"),
        }

        let updateAntrian = await updateAntrianPoliklinik(getAntrian._id, dataUpdateAntrian);
        if (updateAntrian == "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[BATAL-ANTRIAN][ERROR]");
        }

        return Response(res, "Ok", null, 200, "[BATAL-ANTRIAN][SUCCESSFULLY]");
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

        return Response(res, "Validation Form Error", data, 422, `[BATAL-ANTRIAN][VALIDATION][FORM][ERROR] ${err.message}`);
    });
};

exports.batalAntrianOnSite = async (req, res) => {
    let config   = iniParser.get();

    logging.info(`[HTTP][REQUEST][HEADER] ${JSON.stringify(req.headers)}`);
    logging.info(`[HTTP][REQUEST][BODY] ${JSON.stringify(req.body)}`);
    logging.info(`[HTTP][REQUEST][PARAMS] ${JSON.stringify(req.params)}`);

    await tokenValidator.Authentication(req, res);
    validateData = ajv.compile(JSON.parse(validateBatalAntrian));

    let {
        kodebooking,
        keterangan,
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

        if (getAntrian.status === "dilayani") {
            return Response(res, "Pasien Sudah Dilayani, Antrean Tidak Dapat Dibatalkan", null, 201, "[GET-ANTRIAN][GAGAL][STATUS SUDAH DILAYANI]");
        }

        if (getAntrian.status === "selesai") {
            return Response(res, "Antrean Sudah Selesai", null, 201, "[GET-ANTRIAN][GAGAL][STATUS SUDAH DILAYANI]");
        }

        if (getAntrian.status === "batal") {
            return Response(res, "Antrean Tidak Ditemukan atau Sudah Dibatalkan", null, 201, "[GET-ANTRIAN][GAGAL][STATUS SUDAH DIBATAL]");
        }

        let dataPushBatalAantian = {
            kodebooking     : kodebooking,
            keterangan      : keterangan,
        }

        let cancelAntrean = await requestUrl(config.cancelantrean.url, dataPushBatalAantian);
        if (cancelAntrean === "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][GET-ANTRIAN-KOSONG][ERROR]");
        }
        if (cancelAntrean.metadata.code != 200) {
            return Response(res, cancelAntrean.metadata.message, null, 201, "[CANCEL-ANTRIAN][FAILED]");
        }
        logging.info(`[CANCEL-ANTRIAN][SUCCESSFULLY] ${JSON.stringify(cancelAntrean)}`);

        let dataUpdateAntrian = {
            status      : 'batal',
            keterangan  : keterangan,
            waktu_batal   : moment().format("YYYY-MM-DD HH:mm:ss"),
            updatedAt   : moment().format("YYYY-MM-DD HH:mm:ss"),
        }

        let updateAntrian = await updateAntrianPoliklinik(getAntrian._id, dataUpdateAntrian);
        if (updateAntrian == "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[BATAL-ANTRIAN][ERROR]");
        }

        return Response(res, "Ok", null, 200, "[BATAL-ANTRIAN][SUCCESSFULLY]");
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

        return Response(res, "Validation Form Error", data, 422, `[BATAL-ANTRIAN][VALIDATION][FORM][ERROR] ${err.message}`);
    });
};

exports.checkinAntrianOnsite = async (req, res) => {
    let config   = iniParser.get();
    logging.info(`[HTTP][REQUEST][HEADER] ${JSON.stringify(req.headers)}`);
    logging.info(`[HTTP][REQUEST][BODY] ${JSON.stringify(req.body)}`);
    logging.info(`[HTTP][REQUEST][PARAMS] ${JSON.stringify(req.params)}`);

    await tokenValidator.Authentication(req, res);
    validateData = ajv.compile(JSON.parse(validateCheckinAntrian));

    let {
        kodebooking,
        waktu,
    } = req.body;

    dataValidate(req.body)
    .then(async function () {
        let getAntreanTemp = await _getOneAntrianTemp(req.body.antrian_temp_id);
        if (getAntreanTemp.kodebooking === "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][ANTRIAN-KOSONG][ERROR]");
        }
        if (getAntreanTemp == null){
            return Response(res, "Antrean tidak ditemukan", null, 201, "[GET-ANTRIAN][ANTRIAN-KOSONG][ERROR]");
        }
        if (typeof getAntreanTemp.kodebooking !== "undefined" || getAntreanTemp.hasOwnProperty('undefined')) {
            return Response(res, "Antrean sudah di checkin.", null, 201, "[GET-ANTRIAN][ANTRIAN-KOSONG][ERROR]");
        }

        let getAntrian    = await getAntrianPoliklinikByKodeBooking(kodebooking);
        if (getAntrian === "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][ANTRIAN-KOSONG][ERROR]");
        }
        if (getAntrian == null){
            return Response(res, "Antrean kosong", null, 201, "[GET-ANTRIAN][ANTRIAN-KOSONG][ERROR]");
        }

        let _taskid = 1;
        let _status  = 'checkin';
        // if (getAntrian.pasienbaru === 0) {
        //     _taskid = 3;
        //     // _status  = 'menunggu poli';
        // }

        let dataPushCheckinAantian = {
            kodebooking     : kodebooking,
            taskid          : _taskid,
            waktu      : waktu,
        }

        let checkinAntrean = await requestUrl(config.updatewaktu.url, dataPushCheckinAantian);
        if (checkinAntrean === "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][GET-ANTRIAN-KOSONG][ERROR]");
        }
        if (checkinAntrean.metadata.code != 200) {
            return Response(res, checkinAntrean.metadata.message, null, 201, "[CANCEL-ANTRIAN][FAILED]");
        }
        logging.info(`[CHECKIN-ANTRIAN][SUCCESSFULLY] ${JSON.stringify(checkinAntrean)}`);

        let dataUpdateAntrian = {
            status          : _status,
            taskid          : _taskid,
            waktu_checkin   : moment().format("YYYY-MM-DD HH:mm:ss"),
            waktu_tunggu_admisi : moment().format("YYYY-MM-DD HH:mm:ss"),
            // waktu_dilayani_admisi : getAntrian.pasienbaru === 0 ? moment().format("YYYY-MM-DD HH:mm:ss") : null,
            // waktu_tunggu_poli : getAntrian.pasienbaru === 0 ? moment().format("YYYY-MM-DD HH:mm:ss") : null,
            updatedAt       : moment().format("YYYY-MM-DD HH:mm:ss"),
        }

        let updateAntrian = await updateAntrianPoliklinik(getAntrian._id, dataUpdateAntrian);
        if (updateAntrian == "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[CHEKIN-ANTRIAN][ERROR]");
        }

        let bodyUpdateAntrianTemp = {
            kodebooking : kodebooking,
            updatedAt  : moment().format("YYYY-MM-DD HH:mm:ss"),
        }
        let _updateAntrianTemp = await updateAntrianTemp(req.body.antrian_temp_id, bodyUpdateAntrianTemp);
        if (_updateAntrianTemp === "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[ANTREAN-UPDATE][ERROR]");
        }
        logging.info(`[ANTREAN-UPDATE][SUCCESSFULLY] ${JSON.stringify(_updateAntrianTemp)}`);

        return Response(res, "Ok", null, 200, "[CHECKIN-ANTRIAN][SUCCESSFULLY]");

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

        return Response(res, "Validation Form Error", data, 422, `[BATAL-ANTRIAN][VALIDATION][FORM][ERROR] ${err.message}`);
    });
};

exports.checkinAntrian = async (req, res) => {
    let config   = iniParser.get();
    logging.info(`[HTTP][REQUEST][HEADER] ${JSON.stringify(req.headers)}`);
    logging.info(`[HTTP][REQUEST][BODY] ${JSON.stringify(req.body)}`);
    logging.info(`[HTTP][REQUEST][PARAMS] ${JSON.stringify(req.params)}`);

    await tokenValidator.Authentication(req, res);
    validateData = ajv.compile(JSON.parse(validateCheckinAntrian));

    let {
        kodebooking,
        waktu,
    } = req.body;

    dataValidate(req.body)
    .then(async function () {
        let getAntrian    = await getAntrianPoliklinikByKodeBooking(kodebooking);
        if (getAntrian === "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][ANTRIAN-KOSONG][ERROR]");
        }
        if (getAntrian == null){
            return Response(res, "Antrean kosong", null, 201, "[GET-ANTRIAN][ANTRIAN-KOSONG][ERROR]");
        }

        let _taskid = 1;
        let _status  = 'checkin';
        if (getAntrian.pasienbaru === 0) {
            _taskid = 3;
            // _status  = 'menunggu poli';
        }

        let dataPushCheckinAantian = {
            kodebooking     : kodebooking,
            taskid          : _taskid,
            waktu      : waktu,
        }

        let checkinAntrean = await requestUrl(config.updatewaktu.url, dataPushCheckinAantian);
        if (checkinAntrean === "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[GET-ANTRIAN][GET-ANTRIAN-KOSONG][ERROR]");
        }
        if (checkinAntrean.metadata.code != 200) {
            return Response(res, checkinAntrean.metadata.message, null, 201, "[CANCEL-ANTRIAN][FAILED]");
        }
        logging.info(`[CHECKIN-ANTRIAN][SUCCESSFULLY] ${JSON.stringify(checkinAntrean)}`);

        let dataUpdateAntrian = {
            status          : _status,
            taskid          : _taskid,
            waktu_checkin   : moment().format("YYYY-MM-DD HH:mm:ss"),
            // waktu_tunggu_admisi : moment().format("YYYY-MM-DD HH:mm:ss"),
            // waktu_dilayani_admisi : getAntrian.pasienbaru === 0 ? moment().format("YYYY-MM-DD HH:mm:ss") : null,
            // waktu_tunggu_poli : getAntrian.pasienbaru === 0 ? moment().format("YYYY-MM-DD HH:mm:ss") : null,
            updatedAt       : moment().format("YYYY-MM-DD HH:mm:ss"),
        }

        let updateAntrian = await updateAntrianPoliklinik(getAntrian._id, dataUpdateAntrian);
        if (updateAntrian == "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[CHEKIN-ANTRIAN][ERROR]");
        }

        let bodyUpdateAntrianTemp = {
            kodebooking : kodebooking,
            updatedAt  : moment().format("YYYY-MM-DD HH:mm:ss"),
        }
        let _updateAntrianTemp = await updateAntrianTemp(req.body.antrian_temp_id, bodyUpdateAntrianTemp);
        if (_updateAntrianTemp === "ERROR") {
            return Response(res, "Internal Server Error", null, 201, "[ANTREAN-UPDATE][ERROR]");
        }
        logging.info(`[ANTREAN-UPDATE][SUCCESSFULLY] ${JSON.stringify(_updateAntrianTemp)}`);

        return Response(res, "Ok", null, 200, "[CHECKIN-ANTRIAN][SUCCESSFULLY]");

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

        return Response(res, "Validation Form Error", data, 422, `[BATAL-ANTRIAN][VALIDATION][FORM][ERROR] ${err.message}`);
    });
};

function createAntrianPoliklinik(_data) {
    return new Promise(function (resolve, reject) {
        const SaveData = new AntrianPoliklinik(_data)
        SaveData.save()
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        })
    });
};

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

function getAntrianByTglPeriksaPoliNoKartuNik(_tanggal_periksa, _kodepoli, _nomorkartu, _nik, _kodedokter) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.find({
            nomorkartu      : _nomorkartu,
            nik             : _nik,
            tanggalperiksa  : _tanggal_periksa,
            kodepoli        : _kodepoli,
            kodedokter      : _kodedokter
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function getAntrianByTglPeriksaPoliNoKartu(_tanggal_periksa, _kodepoli, _nomorkartu, _kodedokter) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.find({
            nomorkartu      : _nomorkartu,
            tanggalperiksa  : _tanggal_periksa,
            kodepoli        : _kodepoli,
            kodedokter      : _kodedokter
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function getAntrianByTglPeriksaPoliSubSpesialisNoKartuKodeDokter(_tanggal_periksa, _kodesubpoli, _nomorkartu, _kodedokter) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.find({
            nomorkartu      : _nomorkartu,
            tanggalperiksa  : _tanggal_periksa,
            kodesubpoli     : _kodesubpoli,
            kodedokter      : _kodedokter
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function getAntrianByTglPeriksaPoliSubSpesialisNikKodeDokter(_tanggal_periksa, _kodesubpoli, _nik, _kodedokter) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.find({
            nik             : _nik,
            tanggalperiksa  : _tanggal_periksa,
            kodesubpoli     : _kodesubpoli,
            kodedokter      : _kodedokter
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function getAntrianByTglPeriksaPoliNik(_tanggal_periksa, _kodepoli, _nik, _kodedokter) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.find({
            nik             : _nik,
            tanggalperiksa  : _tanggal_periksa,
            kodepoli        : _kodepoli,
            kodedokter      : _kodedokter
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function getAntrianByNoKartu(_no_kartu, _tanggal_periksa) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.findOne({
            nomorkartu: _no_kartu,
            tanggalperiksa: _tanggal_periksa
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function getAntrianByNIK(_no_nik, _tanggal_periksa) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.findOne({
            nik: _no_nik,
            tanggalperiksa: _tanggal_periksa
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function getAntrianByNoReferensi(_no_referensi) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.findOne({
            nomorreferensi: _no_referensi,
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function getPoliklinik(_kode) {
    return new Promise(function (resolve, reject) {
        Poliklinik.findOne({
            kode : _kode,
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function getDataDokter(_kodedokter) {
    return new Promise(function (resolve, reject) {
        DataDokter.findOne({
            kode : _kodedokter,
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function getJadwalDokter(_check_day, _poli_id, _dokter_id, _open_at, _close_at) {
    return new Promise(function (resolve, reject) {
        JadwalDokter.findOne({
            day : _check_day,
            poliklinik_id : _poli_id,
            dokter_id : _dokter_id,
            open_at : _open_at,
            close_at : _close_at,
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function getAntrianPoliklinikByTglPeriksa(_tanggalperiksa) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.find({
            tanggalperiksa : _tanggalperiksa,
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function getAntrianPoliklinik(_kodepoli, _kodedokter, _tanggalperiksa, _jampraktek) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.find({
            kodepoli : _kodepoli,
            kodedokter : _kodedokter,
            tanggalperiksa : _tanggalperiksa,
            jampraktek : _jampraktek,
            // status : { $ne : 'batal'}
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function getAntrianPoliklinik2(_kodepoli, _kodedokter, _tanggalperiksa, _jampraktek) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.find({
            kodepoli : _kodepoli,
            kodedokter : _kodedokter,
            tanggalperiksa : _tanggalperiksa,
            jampraktek : _jampraktek,
            // status : 'batal'
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function getAntrianPoliklinik3(_kodepoli, _kodedokter, _tanggalperiksa, _jampraktek) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.find({
            kodepoli : _kodepoli,
            kodedokter : _kodedokter,
            tanggalperiksa : _tanggalperiksa,
            jampraktek : _jampraktek,
            status : { $ne : 'batal'}
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function getTotalAntrianPoliklinikKecualiBatalBySubSpesialisKodeDokterTglPeriksaJamPraktek(_kodesubpoli, _kodedokter, _tanggalperiksa, _jampraktek) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.find({
            kodesubpoli : _kodesubpoli,
            kodedokter : _kodedokter,
            tanggalperiksa : _tanggalperiksa,
            jampraktek : _jampraktek,
            status : { $ne : 'batal'}
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function getAntrianPoliklinikBySubSpesialisKodeDokterTglPeriksaJamPraktek(_kodesubpoli, _kodedokter, _tanggalperiksa, _jampraktek) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.find({
            kodesubpoli : _kodesubpoli,
            kodedokter : _kodedokter,
            tanggalperiksa : _tanggalperiksa,
            jampraktek : _jampraktek,
            // status : { $ne : 'batal'}
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function getSisaAntrianPoliklinikBySubSpesialisKodeDokterTglPeriksaJamPraktek(_kodesubpoli, _kodedokter, _tanggalperiksa, _jampraktek) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.find({
            kodesubpoli     : _kodesubpoli,
            kodedokter      : _kodedokter,
            tanggalperiksa  : _tanggalperiksa,
            jampraktek      : _jampraktek,
            taskid          : {  $in: [0,1,2,3,4] },
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function getTotalAntrianPoliklinikKecualiBatalByTaskID(_kodesubpoli, _kodedokter, _tanggalperiksa, _jampraktek) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.find({
            kodesubpoli     : _kodesubpoli,
            kodedokter      : _kodedokter,
            tanggalperiksa  : _tanggalperiksa,
            jampraktek      : _jampraktek,
            taskid          : {  $in: [0,1,2,3,4] },
            status          : { $ne : 'batal'}
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function getAntrianDilayaniByTaskID4BySubpoli(_kodesubpoli, _kodedokter, _tanggalperiksa, _jampraktek) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.findOne({
            kodesubpoli     : _kodesubpoli,
            kodedokter : _kodedokter,
            tanggalperiksa : _tanggalperiksa,
            jampraktek : _jampraktek,
            taskid : 4,
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function getAntrianMenungguPoliklinik(_kodepoli, _kodedokter, _tanggalperiksa, _jampraktek, _status) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.find({
            kodepoli : _kodepoli,
            kodedokter : _kodedokter,
            tanggalperiksa : _tanggalperiksa,
            jampraktek : _jampraktek,
            status : _status,
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function getAntrianDilayaniPoliklinik(_kodepoli, _kodedokter, _tanggalperiksa, _jampraktek, _status) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.findOne({
            kodepoli : _kodepoli,
            kodedokter : _kodedokter,
            tanggalperiksa : _tanggalperiksa,
            jampraktek : _jampraktek,
            status : _status,
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

function getAntrianByTaskId(_kodepoli, _kodedokter, _tanggalperiksa, _jampraktek) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.find({
            kodepoli : _kodepoli,
            kodedokter : _kodedokter,
            tanggalperiksa : _tanggalperiksa,
            jampraktek : _jampraktek,
            taskid : {  $gt: 5 },
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function getAntrianByTaskId5(_kodepoli, _kodedokter, _tanggalperiksa, _jampraktek) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.findOne({
            kodepoli : _kodepoli,
            kodedokter : _kodedokter,
            tanggalperiksa : _tanggalperiksa,
            jampraktek : _jampraktek,
            taskid : 5,
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function getTotalAntreanByTaskID(_kodepoli, _kodedokter, _tanggalperiksa, _jampraktek) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.find({
            kodepoli : _kodepoli,
            kodedokter : _kodedokter,
            tanggalperiksa : _tanggalperiksa,
            jampraktek : _jampraktek,
            taskid : { $in : [0,1,2,3,4]},
            status : { $ne : 'batal'}
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function getAntrianDilayaniByTaskID(_kodepoli, _kodedokter, _tanggalperiksa, _jampraktek) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.findOne({
            kodepoli : _kodepoli,
            kodedokter : _kodedokter,
            tanggalperiksa : _tanggalperiksa,
            jampraktek : _jampraktek,
            taskid : 4,
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function periksaTanggal(_tanggal) {
    let datePeriksa = moment(new Date(_tanggal)).format('YYYY-MM-DD');
    let dateNow = moment(new Date()).format('YYYY-MM-DD');
    let date7Days = moment(new Date().addDays(7)).format('YYYY-MM-DD');

    let result  = true;
    let message = '';
    if (dateNow > datePeriksa) {
        result = false;
        message = "Tanggal periksa tidak benar, hanya dapat memasukkan tanggal H atau H+"
    } 

    let response = {
        result : result,
        message : message
    }

    return response;
}

function periksaTanggalFromJkn(_tanggal) {
    let datePeriksa = moment(new Date(_tanggal)).format('YYYY-MM-DD');
    let dateNow = moment(new Date()).format('YYYY-MM-DD');
    let date7Days = moment(new Date().addDays(7)).format('YYYY-MM-DD');

    let result  = true;
    let message = '';
    if (dateNow >= datePeriksa) {
        result = false;
        message = "Tanggal periksa tidak benar, hanya dapat memasukkan tanggal H+"
    } 

    let response = {
        result : result,
        message : message
    }

    return response;
}

function getPasien(_nomorkartu, _nik, _norm) {
    return new Promise(function (resolve, reject) {
        Pasien.findOne({
            no_bpjs         : _nomorkartu,
            no_identitas    : _nik,
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

function getPasienByNoKartu(_nomorkartu) {
    return new Promise(function (resolve, reject) {
        Pasien.findOne({
            no_bpjs         : _nomorkartu,
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function getPasienByNik(_nik) {
    return new Promise(function (resolve, reject) {
        Pasien.findOne({
            no_identitas    : _nik,
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function getPasien2(_nomorkartu, _nik) {
    return new Promise(function (resolve, reject) {
        Pasien.findOne({
            no_bpjs         : _nomorkartu,
            no_identitas    : _nik,
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function getPasienOnsite(_nomorkartu) {
    return new Promise(function (resolve, reject) {
        Pasien.findOne({
            no_bpjs         : _nomorkartu,
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function getPasienUmumOnsite(_nik) {
    return new Promise(function (resolve, reject) {
        Pasien.findOne({
            no_identitas    : _nik,
            // no_bpjs         : _nik,
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function getDataPengaturanSimrs() {
    return new Promise(async function (resolve, reject) {
        PengaturanSimrs.find()
        .then(_data => {
            resolve(_data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function createNewPatient(_data) {
    return new Promise(function (resolve, reject) {
        const SaveData = new Pasien(_data)
        SaveData.save()
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        })
    });
};

function updatePengaturanSimrs(_id, __dataUpdatePengaturanSimrs) {
    return new Promise(async function (resolve, reject) {
        PengaturanSimrs.findByIdAndUpdate(_id, __dataUpdatePengaturanSimrs, {
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

function biggestNumberInArray (arr) {
    // The largest number at first should be the first element or null for empty array
    var largest = arr[0].angkaantrean || null;

    // Current number, handled by the loop
    var number = null;
    for (var i = 0; i < arr.length; i++) {
        // Update current number
        number = arr[i].angkaantrean;

        // Compares stored largest number with current number, stores the largest one
        largest = Math.max(largest, number);
    }

    return largest;
}

function convertTglPeriksaToDay(__tglperiksa) {
    let ___tglperiksa = new Date(__tglperiksa)
    let _tglperiksa = moment(___tglperiksa).format('dddd');

    // Monday = 1
    // Tuesday = 2
    // Wednesday = 3
    // Thursday = 4
    // Friday = 5
    // Saturday = 6
    // Sunday =7

    let check_day;
    switch (_tglperiksa) {
        case "Monday":
            check_day = 1;
            break;

        case "Tuesday":
            check_day = 2;
            break;

        case "Wednesday":
            check_day = 3;
            break;

        case "Thursday":
            check_day = 4;
            break;

        case "Friday":
            check_day = 5;
            break;

        case "Saturday":
            check_day = 6;
            break;

        case "Sunday":
            check_day = 7;
            break;
    }

    return check_day;
}

Date.prototype.addDays = function (days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
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

let CharAntrean = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"];

function SwitchAbjad(params) {
    let nextAbjad;
    switch (params) {
        case "005":
            nextAbjad = "GH";
        break;
        case "010":
            nextAbjad = "EM";
        break;
        case "014":
            nextAbjad = "TI";
        break;
        case "018":
            nextAbjad = "BD";
        break;
        case "080":
            nextAbjad = "NI";
        break;
        case "086":
            nextAbjad = "NE";
        break;
        case "089":
            nextAbjad = "ON";
        break;
        case "172":
            nextAbjad = "NT";
        break;
        case "ORT":
            nextAbjad = "OT";
        break;
        case "GIG":
            nextAbjad = "GG";
        break;
        case "INT":
            nextAbjad = "PD";
        break;
        case "ANA":
            nextAbjad = "AN";
        break;
        case "BED":
            nextAbjad = "BU";
        break;
        case "SAR":
            nextAbjad = "SA";
        break;
        case "THT":
            nextAbjad = "TH";
        break;
        case "MAT":
            nextAbjad = "MA";
        break;
        case "JIW":
            nextAbjad = "JW";
        break;
        case "URO":
            nextAbjad = "UR";
        break;
        case "PAR":
            nextAbjad = "PR";
        break;
        case "OBG":
            nextAbjad = "OB";
        break;
        case "BDA":
            nextAbjad = "BA";
        break;
        case "JAN":
            nextAbjad = "JA";
        break;
        case "KLT":
            nextAbjad = "KM";
        break;
        case "BSY":
            nextAbjad = "BS";
        break;
        case "PAK":
            nextAbjad = "Q";
        break;
        case "IRM":
            nextAbjad = "RM";
        break;
        case "BTK":
            nextAbjad = "BT";
        break;
        case "BDP":
            nextAbjad = "T";
        break;
        case "UMU":
            nextAbjad = "U";
        break;
        case "BDM":
            nextAbjad = "BM";
        break;
        // case "V":
        //     nextAbjad = "W";
        // break;
        // case "W":
        //     nextAbjad = "X";
        // break;
        // case "X":
        //     nextAbjad = "Y";
        // break;
        // case "Y":
        //     nextAbjad = "Z";
        // break;
        default:
            nextAbjad = null;
        break;
    }

    return nextAbjad;
}

// function SwitchAbjad(params) {
//     let nextAbjad;
//     switch (params) {
//         case "ORT":
//             nextAbjad = "A";
//         break;
//         case "GIG":
//             nextAbjad = "B";
//         break;
//         case "INT":
//             nextAbjad = "C";
//         break;
//         case "ANA":
//             nextAbjad = "D";
//         break;
//         case "BED":
//             nextAbjad = "E";
//         break;
//         case "SAR":
//             nextAbjad = "F";
//         break;
//         case "THT":
//             nextAbjad = "G";
//         break;
//         case "MAT":
//             nextAbjad = "H";
//         break;
//         case "JIW":
//             nextAbjad = "I";
//         break;
//         case "URO":
//             nextAbjad = "J";
//         break;
//         case "PAR":
//             nextAbjad = "K";
//         break;
//         case "OBG":
//             nextAbjad = "L";
//         break;
//         case "BDA":
//             nextAbjad = "M";
//         break;
//         case "JAN":
//             nextAbjad = "N";
//         break;
//         case "KLT":
//             nextAbjad = "O";
//         break;
//         case "BSY":
//             nextAbjad = "P";
//         break;
//         case "PAK":
//             nextAbjad = "Q";
//         break;
//         case "IRM":
//             nextAbjad = "R";
//         break;
//         // case "R":
//         //     nextAbjad = "S";
//         // break;
//         case "BDP":
//             nextAbjad = "T";
//         break;
//         case "UMU":
//             nextAbjad = "U";
//         break;
//         case "BDM":
//             nextAbjad = "V";
//         break;
//         // case "V":
//         //     nextAbjad = "W";
//         // break;
//         // case "W":
//         //     nextAbjad = "X";
//         // break;
//         // case "X":
//         //     nextAbjad = "Y";
//         // break;
//         // case "Y":
//         //     nextAbjad = "Z";
//         // break;
//         default:
//             nextAbjad = null;
//         break;
//     }

//     return nextAbjad;
// }

function updateAntrianTemp(_id, _data) {
    return new Promise(function (resolve, reject) {
        AntrianTemp.findByIdAndUpdate(_id, _data, {
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

function _getOneAntrianTemp(_id) {
    return new Promise(function (resolve, reject) {
        AntrianTemp.findOne({
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

function _getAntrianForKodeBooking(_kodesubpoli, _kodedokter, _tanggalperiksa, _jampraktek) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.find({
            kodesubpoli     : _kodesubpoli,
            kodedokter      : _kodedokter,
            tanggalperiksa  : _tanggalperiksa,
            jampraktek      : _jampraktek,
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}

function _getAntrianBySubSpesialisTglPeriksa(_kodesubpoli, _tanggalperiksa) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.find({
            kodesubpoli     : _kodesubpoli,
            tanggalperiksa  : _tanggalperiksa,
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        });
    });
}