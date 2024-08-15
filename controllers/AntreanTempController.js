const fs = require("fs");
const AntrianTemp = require("../models/AntrianTemp.js");
const AntrianDipanggil = require("../models/AntrianDipanggil.js");
const AntrianPoliklinik = require("../models/AntrianPoliklinik.js");
const Loket = require("../models/Loket.js");
const Pasien = require("../models/Pasien.js");
const logging = require("../libs/logging");
const Response = require("../helpers/response");
const moment = require("moment");
const sprintf = require("extsprintf").sprintf;
const needle = require("needle");
const iniParser = require("../libs/iniParser");

const { exit } = require("process");

const STATUS_MENUNGGU = "menunggu";
const STATUS_DIPANGGIL = "dipanggil";
const STATUS_DILAYANI = "dilayani";
const STATUS_SELESAI = "selesai";
const STATUS_TIDAK_ADA = "tidak ada";
const STATUS_DIBATALKAN = "dibatalkan";

const ANTREAN_BPJS = "BPJS";
const ANTREAN_MJKN = "MJKN";
const ANTREAN_UMUM = "UMUM";
const ANTREAN_FARMASI = "FARMASI";

exports.getAntrianTempBpjs = async (req, res) => {
    let config = iniParser.get();
    const today = moment().format("YYYY-MM-DD");
    const _hurufantrean = "B";

    let data = await getAntrianTemp(today, ANTREAN_BPJS);

    if (data === "ERROR") {
        return Response(
            res,
            "Internal Server Error",
            null,
            201,
            "[ANTREAN-TEMP-ERROR]"
        );
    }

    let _angkaantrean;
    if (data.length == 0) {
        _angkaantrean = 1;
    } else {
        let maxangkaantrean = await biggestNumberInArray(data);
        _angkaantrean = maxangkaantrean + 1;
    }
    const _nomorantrean = _hurufantrean + "-" + sprintf("%d", _angkaantrean);

    let dataCreate = {
        hurufantrean: _hurufantrean,
        nomorantrean: _nomorantrean,
        angkaantrean: _angkaantrean,
        status: STATUS_MENUNGGU,
        tanggalantrean: today,
        jenisantrean: ANTREAN_BPJS,
        loket_id: null,
        status_display: false,
        kefarmasi: false,
        createdAt: moment().format("YYYY-MM-DD HH:mm:ss"),
        updatedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
    };

    let create = await createAntrianTemp(dataCreate);
    if (create == "ERROR") {
        return Response(
            res,
            "Internal Server Error",
            null,
            201,
            "[GET-ANTRIAN][ERROR]"
        );
    }
    logging.info(
        `[ANTRIAN-TEMP-CREATE][SUCCESSFULLY] ${JSON.stringify(create)}`
    );

    let dataResponse = {};
    dataResponse.hurufantrean = _hurufantrean;
    dataResponse.nomorantrean = _nomorantrean;
    dataResponse.angkaantrean = _angkaantrean;
    dataResponse.status = STATUS_MENUNGGU;
    dataResponse.tanggalantrean = today;
    dataResponse.jenisantrean = ANTREAN_BPJS;
    dataResponse.createdAt = moment().format("YYYY-MM-DD HH:mm:ss");
    dataResponse.updatedAt = moment().format("YYYY-MM-DD HH:mm:ss");

    return Response(res, "Ok", dataResponse, 200, "[POLI][SUCCESSFULLY]");
};

exports.getAntrianTempMjkn = async (req, res) => {
    let config = iniParser.get();
    const today = moment().format("YYYY-MM-DD");
    const _hurufantrean = "M";

    let data = await getAntrianTemp(today, ANTREAN_MJKN);

    if (data === "ERROR") {
        return Response(
            res,
            "Internal Server Error",
            null,
            201,
            "[ANTREAN-TEMP-ERROR]"
        );
    }

    let _angkaantrean;
    if (data.length == 0) {
        _angkaantrean = 1;
    } else {
        let maxangkaantrean = await biggestNumberInArray(data);
        _angkaantrean = maxangkaantrean + 1;
    }
    const _nomorantrean = _hurufantrean + "-" + sprintf("%d", _angkaantrean);

    let dataCreate = {
        hurufantrean: _hurufantrean,
        nomorantrean: _nomorantrean,
        angkaantrean: _angkaantrean,
        status: STATUS_MENUNGGU,
        tanggalantrean: today,
        jenisantrean: ANTREAN_MJKN,
        loket_id: null,
        status_display: false,
        kefarmasi: false,
        createdAt: moment().format("YYYY-MM-DD HH:mm:ss"),
        updatedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
    };

    let create = await createAntrianTemp(dataCreate);
    if (create == "ERROR") {
        return Response(
            res,
            "Internal Server Error",
            null,
            201,
            "[GET-ANTRIAN][ERROR]"
        );
    }
    logging.info(
        `[ANTRIAN-TEMP-CREATE][SUCCESSFULLY] ${JSON.stringify(create)}`
    );

    let dataResponse = {};
    dataResponse.hurufantrean = _hurufantrean;
    dataResponse.nomorantrean = _nomorantrean;
    dataResponse.angkaantrean = _angkaantrean;
    dataResponse.status = STATUS_MENUNGGU;
    dataResponse.tanggalantrean = today;
    dataResponse.jenisantrean = ANTREAN_MJKN;
    dataResponse.createdAt = moment().format("YYYY-MM-DD HH:mm:ss");
    dataResponse.updatedAt = moment().format("YYYY-MM-DD HH:mm:ss");

    return Response(res, "Ok", dataResponse, 200, "[POLI][SUCCESSFULLY]");
};

exports.getAntrianTempUmum = async (req, res) => {
    let config = iniParser.get();
    const today = moment().format("YYYY-MM-DD");
    const _hurufantrean = "U";

    let data = await getAntrianTemp(today, ANTREAN_UMUM);

    if (data === "ERROR") {
        return Response(
            res,
            "Internal Server Error",
            null,
            201,
            "[ANTREAN-TEMP-ERROR]"
        );
    }

    let _angkaantrean;
    if (data.length == 0) {
        _angkaantrean = 1;
    } else {
        let maxangkaantrean = await biggestNumberInArray(data);
        _angkaantrean = maxangkaantrean + 1;
    }
    const _nomorantrean = _hurufantrean + "-" + sprintf("%d", _angkaantrean);

    let dataCreate = {
        hurufantrean: _hurufantrean,
        nomorantrean: _nomorantrean,
        angkaantrean: _angkaantrean,
        status: STATUS_MENUNGGU,
        tanggalantrean: today,
        jenisantrean: ANTREAN_UMUM,
        loket_id: null,
        status_display: false,
        kefarmasi: false,
        createdAt: moment().format("YYYY-MM-DD HH:mm:ss"),
        updatedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
    };

    let create = await createAntrianTemp(dataCreate);
    if (create == "ERROR") {
        return Response(
            res,
            "Internal Server Error",
            null,
            201,
            "[GET-ANTRIAN][ERROR]"
        );
    }
    logging.info(
        `[ANTRIAN-TEMP-CREATE][SUCCESSFULLY] ${JSON.stringify(create)}`
    );

    let dataResponse = {};
    dataResponse.hurufantrean = _hurufantrean;
    dataResponse.nomorantrean = _nomorantrean;
    dataResponse.angkaantrean = _angkaantrean;
    dataResponse.status = STATUS_MENUNGGU;
    dataResponse.tanggalantrean = today;
    dataResponse.jenisantrean = ANTREAN_UMUM;
    dataResponse.createdAt = moment().format("YYYY-MM-DD HH:mm:ss");
    dataResponse.updatedAt = moment().format("YYYY-MM-DD HH:mm:ss");

    return Response(res, "Ok", dataResponse, 200, "[POLI][SUCCESSFULLY]");
};

exports.getAntrianTempFarmasi = async (req, res) => {
    let config = iniParser.get();
    const today = moment().format("YYYY-MM-DD");
    const _hurufantrean = "F";

    if (req.body.kodebooking == "" || req.body.kodebooking == null) {
        return Response(
            res,
            "Kode booking wajib diisi.",
            null,
            201,
            "[ANTREAN-TEMP-ERROR]"
        );
    }

    if (req.body.kodebooking.length != 14) {
        return Response(
            res,
            "Format Kode Booking Tidak Sesuai",
            null,
            201,
            "[NEW-PATIENT][NO-KARTU][AVAILABLE]"
        );
    }

    let getAntrian = await getAntrianPoliklinikByKodeBooking(
        req.body.kodebooking
    );
    if (getAntrian === "ERROR") {
        return Response(
            res,
            "Internal Server Error",
            null,
            201,
            "[GET-ANTRIAN][ANTRIAN-KOSONG][ERROR]"
        );
    }
    if (getAntrian == null) {
        return Response(
            res,
            "Kode Booking Tidak Ditemukan",
            null,
            201,
            "[GET-ANTRIAN][ANTRIAN-KOSONG][ERROR]"
        );
    }

    if (getAntrian.taskid === 5 && getAntrian.status === "selesai") {
        return Response(
            res,
            "Antrian sudah selesai di poli.",
            null,
            201,
            "[ANTREAN-TEMP-ERROR]"
        );
    }

    if (getAntrian.status === "selesai") {
        return Response(
            res,
            "Antrian sudah selesai.",
            null,
            201,
            "[ANTREAN-TEMP-ERROR]"
        );
    }

    if (getAntrian.status !== "checkin" || getAntrian.taskid !== 5) {
        return Response(
            res,
            "Antrian poli belum selesai.",
            null,
            201,
            "[ANTREAN-TEMP-ERROR]"
        );
    }

    let AntrianTempByKodeBooking = await getAntrianTempByKodeBooking(
        today,
        ANTREAN_FARMASI,
        req.body.kodebooking
    );
    if (AntrianTempByKodeBooking === "ERROR") {
        return Response(
            res,
            "Internal Server Error",
            null,
            201,
            "[ANTREAN-TEMP-ERROR]"
        );
    }
    if (AntrianTempByKodeBooking !== null) {
        return Response(
            res,
            "Kode booking ini sudah ambil antrean",
            null,
            201,
            "[ANTREAN-TEMP-ERROR]"
        );
    }

    let data = await getAntrianTemp(today, ANTREAN_FARMASI);
    if (data === "ERROR") {
        return Response(
            res,
            "Internal Server Error",
            null,
            201,
            "[ANTREAN-TEMP-ERROR]"
        );
    }

    let _angkaantrean;
    if (data.length == 0) {
        _angkaantrean = 1;
    } else {
        let maxangkaantrean = await biggestNumberInArray(data);
        _angkaantrean = maxangkaantrean + 1;
    }
    const _nomorantrean = _hurufantrean + "-" + sprintf("%d", _angkaantrean);

    let dataCreate = {
        hurufantrean: _hurufantrean,
        nomorantrean: _nomorantrean,
        angkaantrean: _angkaantrean,
        status: STATUS_MENUNGGU,
        tanggalantrean: today,
        jenisantrean: ANTREAN_FARMASI,
        loket_id: null,
        loket_farmasi_id: null,
        status_display: false,
        kodebooking: req.body.kodebooking,
        createdAt: moment().format("YYYY-MM-DD HH:mm:ss"),
        updatedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
    };

    let create = await createAntrianTemp(dataCreate);
    if (create == "ERROR") {
        return Response(
            res,
            "Internal Server Error",
            null,
            201,
            "[GET-ANTRIAN][ERROR]"
        );
    }
    logging.info(
        `[ANTRIAN-TEMP-CREATE][SUCCESSFULLY] ${JSON.stringify(create)}`
    );

    let dataResponse = {};
    dataResponse.hurufantrean = _hurufantrean;
    dataResponse.nomorantrean = _nomorantrean;
    dataResponse.angkaantrean = _angkaantrean;
    dataResponse.status = STATUS_MENUNGGU;
    dataResponse.tanggalantrean = today;
    dataResponse.jenisantrean = ANTREAN_FARMASI;
    dataResponse.createdAt = moment().format("YYYY-MM-DD HH:mm:ss");
    dataResponse.updatedAt = moment().format("YYYY-MM-DD HH:mm:ss");

    return Response(res, "Ok", dataResponse, 200, "[POLI][SUCCESSFULLY]");
};

exports.getAntreanDipanggilDilayaniByLoket = async (req, res) => {
    let today = moment().format("YYYY-MM-DD");
    let data = await _getAntreanDipanggilDilayaniByLoket(
        today,
        req.params.loketid,
        req.params.jenis
    );
    if (data === "ERROR") {
        return Response(
            res,
            "Internal Server Error",
            null,
            201,
            "[ANTREAN][DIPANGGIL-DILAYANI][ERROR]"
        );
    }

    if (data === null) {
        return Response(
            res,
            "Not ok",
            null,
            201,
            "[ANTREAN][DIPANGGIL-DILAYANI-KOSONG]"
        );
    }

    return Response(
        res,
        "Ok",
        data,
        200,
        "[ANTREAN][DIPANGGIL-DILAYANI][SUCCESSFULLY]"
    );
};

exports.getAntreanDipanggilDilayaniByFarmasi = async (req, res) => {
    let today = moment().format("YYYY-MM-DD");
    let data = await _getAntreanDipanggilDilayaniByFarmasi(
        today,
        req.params.farmasiid
    );
    if (data === "ERROR") {
        return Response(
            res,
            "Internal Server Error",
            null,
            201,
            "[ANTREAN][DIPANGGIL-DILAYANI][ERROR]"
        );
    }

    if (data === null) {
        return Response(
            res,
            "Not ok",
            null,
            201,
            "[ANTREAN][DIPANGGIL-DILAYANI-KOSONG]"
        );
    }

    return Response(
        res,
        "Ok",
        data,
        200,
        "[ANTREAN][DIPANGGIL-DILAYANI][SUCCESSFULLY]"
    );
};

exports.sisaAntrean = async (req, res) => {
    let today = moment().format("YYYY-MM-DD");
    let data = await _sisaAntrean(today, req.params.jenis);
    if (data === "ERROR") {
        return Response(
            res,
            "Internal Server Error",
            null,
            201,
            "[SISA-ANTREAN][ERROR]"
        );
    }
    return Response(res, "Ok", data, 200, "[SISA-ANTREAN][SUCCESSFULLY]");
};

exports.callAntrean = async (req, res) => {
    let today = moment().format("YYYY-MM-DD");

    let jenisantreandipanggil = "";
    if (req.params.jenis !== "FARMASI") {
        jenisantreandipanggil = "ADMISI";
    } else {
        jenisantreandipanggil = "FARMASI";
    }

    let getAntrianDipanggil = await _getAntrianDipanggil(
        jenisantreandipanggil,
        today
    );
    if (getAntrianDipanggil === "ERROR") {
        return Response(
            res,
            "Internal Server Error",
            null,
            201,
            "[ANTREAN][ERROR]"
        );
    }
    if (getAntrianDipanggil.length > 0) {
        return Response(
            res,
            "Sedang Ada Pemanggilan",
            null,
            201,
            "[ANTREAN][KOSONG]"
        );
    }

    let antrean = await getAntrianTemp(today, req.params.jenis);
    if (antrean === "ERROR") {
        return Response(
            res,
            "Internal Server Error",
            null,
            201,
            "[ANTREAN][ERROR]"
        );
    }
    if (antrean.length === 0) {
        return Response(
            res,
            "Antrean tidak tersedia.",
            null,
            201,
            "[ANTREAN][KOSONG]"
        );
    }

    let tempantreanpanggil = null;
    for (const i in antrean) {
        if (antrean[i].status === "menunggu") {
            tempantreanpanggil = antrean[i];
            break;
        }
    }

    let dataUpdateAntrian = {};
    if (tempantreanpanggil === null) {
        return Response(
            res,
            "Antrean tidak tersedia.",
            null,
            201,
            "[ANTREAN][ERROR]"
        );
    }

    if (req.params.jenis !== "FARMASI") {
        dataUpdateAntrian = {
            status: "dipanggil",
            status_display: req.body.status_display,
            updatedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
            loket_id: req.body.loket_id,
        };
    } else {
        dataUpdateAntrian = {
            status: "dipanggil",
            status_display: req.body.status_display,
            updatedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
            loket_farmasi_id: req.body.loket_farmasi_id,
        };
    }

    let jenisantrean = {};
    if (req.params.jenis !== "FARMASI") {
        jenisantrean = { $in: ["BPJS", "MJKN", "UMUM"] };
    } else {
        jenisantrean = { $in: ["FARMASI"] };
    }
    let updateAllStatusDisplayToFalse = await _updateAllStatusDisplayToFalse(
        today,
        jenisantrean,
        { status_display: false }
    );
    if (updateAllStatusDisplayToFalse == "ERROR") {
        return Response(
            res,
            "Internal Server Error",
            null,
            201,
            "[ANTREAN][UPDATE][ERROR]"
        );
    }

    let _updateAntrianTemp = await updateAntrianTemp(
        tempantreanpanggil._id,
        dataUpdateAntrian
    );
    if (_updateAntrianTemp == "ERROR") {
        return Response(
            res,
            "Internal Server Error",
            null,
            201,
            "[ANTREAN][UPDATE][ERROR]"
        );
    }
    logging.info(
        `[ANTREAN][UPDATE][SUCCESSFULLY] ${JSON.stringify(_updateAntrianTemp)}`
    );

    let dataAntrianDipanggil = {
        antrian_id: tempantreanpanggil._id,
        jenisantrean: jenisantreandipanggil,
        tanggalantrean: today,
        createdAt: moment().format("YYYY-MM-DD HH:mm:ss"),
        updatedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
    };
    let createAntrianDipanggil = await _createAntrianDipanggil(
        dataAntrianDipanggil
    );
    if (createAntrianDipanggil == "ERROR") {
        return Response(
            res,
            "Internal Server Error",
            null,
            201,
            "[CREATE-ANTRIAN-DIPANGGIL][ERROR]"
        );
    }
    logging.info(
        `[CREATE-ANTRIAN-DIPANGGIL][SUCCESSFULLY] ${JSON.stringify(
            createAntrianDipanggil
        )}`
    );

    return Response(
        res,
        "Ok",
        _updateAntrianTemp,
        200,
        "[ANTREAN][SUCCESSFULLY]"
    );
};

exports.selesaiPemanggilan = async (req, res) => {
    let getOneAntrianTemp = await _getOneAntrianTemp(req.params.id);
    if (getOneAntrianTemp == "ERROR") {
        return Response(
            res,
            "Internal Server Error",
            null,
            201,
            "[ANTREAN][UPDATE][ERROR]"
        );
    }
    if (getOneAntrianTemp == null) {
        return Response(
            res,
            "Antrean tidak ditemukan",
            null,
            201,
            "[GET-ANTRIAN][ANTRIAN-KOSONG][ERROR]"
        );
    }

    let jenisantreandipanggil = "";
    if (getOneAntrianTemp.jenisantrean !== "FARMASI") {
        jenisantreandipanggil = "ADMISI";
    } else {
        jenisantreandipanggil = "FARMASI";
    }
    let deleteAntrianDipanggil = await _deleteAntrianDipanggil(
        jenisantreandipanggil
    );
    if (deleteAntrianDipanggil == "ERROR") {
        return Response(
            res,
            "Internal Server Error",
            null,
            201,
            "[DELETE-ANTRIAN-DIPANGGIL][ERROR]"
        );
    }
    logging.info(
        `[DELETE-ANTRIAN-DIPANGGIL][SUCCESSFULLY] ${JSON.stringify(
            deleteAntrianDipanggil
        )}`
    );

    return Response(
        res,
        "Ok",
        deleteAntrianDipanggil,
        200,
        "[SISA-ANTREAN][SUCCESSFULLY]"
    );
};

exports.getMsAntrianDiPanggil = async (req, res) => {
    let getOneMsAntrianDiPanggil = await _getOneMsAntrianDiPanggil(
        req.params.id
    );
    if (getOneMsAntrianDiPanggil == "ERROR") {
        return Response(
            res,
            "Internal Server Error",
            null,
            201,
            "[ANTREAN][UPDATE][ERROR]"
        );
    }
    if (getOneMsAntrianDiPanggil == null) {
        return Response(
            res,
            "Antrean tidak ditemukan",
            null,
            201,
            "[GET-ANTRIAN][ANTRIAN-KOSONG][ERROR]"
        );
    }
    logging.info(
        `[DELETE-ANTRIAN-DIPANGGIL][SUCCESSFULLY] ${JSON.stringify(
            getOneMsAntrianDiPanggil
        )}`
    );

    return Response(
        res,
        "Ok",
        getOneMsAntrianDiPanggil,
        200,
        "[SISA-ANTREAN][SUCCESSFULLY]"
    );
};

exports.batalPemanggilan = async (req, res) => {
    let config = iniParser.get();
    let waktu = moment().format("YYYY-MM-DD HH:mm:ss");

    // update local
    let dataUpdateAntrian = {
        status: STATUS_DIBATALKAN,
        updatedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
    };
    let updateAntrian = await updateAntrianTemp(
        req.params.id,
        dataUpdateAntrian
    );
    if (updateAntrian == "ERROR") {
        return Response(
            res,
            "Internal Server Error",
            null,
            201,
            "[ANTREAN][UPDATE][ERROR]"
        );
    }
    logging.info(
        `[ANTREAN][UPDATE][SUCCESSFULLY] ${JSON.stringify(updateAntrian)}`
    );

    // update bpjs
    if (updateAntrian.jenisantrean === "FARMASI") {
        // update ke bpjs
        let updatePushAntren = {
            kodebooking: updateAntrian.kodebooking,
            taskid: 99,
            waktu: parseInt(moment(waktu).format("x")),
        };
        let updatewaktuBatal = await requestUrl(
            config.updatewaktu.url,
            updatePushAntren
        );
        if (updatewaktuBatal === "ERROR") {
            return Response(
                res,
                "Internal Server Error",
                null,
                201,
                "[PUSH-UPDATE-WAKTU][ERROR]"
            );
        }
        if (updatewaktuBatal.metadata.code != 200) {
            return Response(
                res,
                updatewaktuBatal.metadata.message,
                null,
                201,
                "[PUSH-UPDATE-WAKTU][FAILED]"
            );
        }
        logging.info(
            `[PUSH-UPDATE-WAKTU][SUCCESSFULLY] ${JSON.stringify(
                updatewaktuBatal
            )}`
        );

        // update local
        let getAntrian = await getAntrianPoliklinikByKodeBooking(
            updateAntrian.kodebooking
        );
        if (getAntrian === "ERROR") {
            return Response(
                res,
                "Internal Server Error",
                null,
                201,
                "[GET-ANTRIAN][ANTRIAN-KOSONG][ERROR]"
            );
        }
        if (getAntrian == null) {
            return Response(
                res,
                "Kode Booking Tidak Ditemukan",
                null,
                201,
                "[GET-ANTRIAN][ANTRIAN-KOSONG][ERROR]"
            );
        }

        let dataUpdateAntrianBatal = {
            status: "batal",
            taskid: 99,
            waktu_batal: moment().format("YYYY-MM-DD HH:mm:ss"),
            updatedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
        };
        let updateAntrianPoliklinikBatal = await _updateAntrianPoliklinik(
            getAntrian._id,
            dataUpdateAntrianBatal
        );
        if (updateAntrianPoliklinikBatal == "ERROR") {
            return Response(
                res,
                "Internal Server Error",
                null,
                201,
                "[UPDATE-ANTREAN-LOCAL][ERROR]"
            );
        }
        logging.info(
            `[UPDATE-ANTREAN-LOCAL][SUCCESSFULLY] ${JSON.stringify(
                updateAntrianPoliklinikBatal
            )}`
        );
    }

    let jenisantreandipanggil = "";
    if (updateAntrian.jenisantrean !== "FARMASI") {
        jenisantreandipanggil = "ADMISI";
    } else {
        jenisantreandipanggil = "FARMASI";
    }
    let deleteAntrianDipanggil = await _deleteAntrianDipanggil(
        jenisantreandipanggil
    );
    if (deleteAntrianDipanggil == "ERROR") {
        return Response(
            res,
            "Internal Server Error",
            null,
            201,
            "[DELETE-ANTRIAN-DIPANGGIL][ERROR]"
        );
    }
    logging.info(
        `[DELETE-ANTRIAN-DIPANGGIL][SUCCESSFULLY] ${JSON.stringify(
            deleteAntrianDipanggil
        )}`
    );

    return Response(
        res,
        "Ok",
        updateAntrian,
        200,
        "[SISA-ANTREAN][SUCCESSFULLY]"
    );
};

exports.updateStatus = async (req, res) => {
    let config = iniParser.get();
    let today = moment().format("YYYY-MM-DD");
    let waktu = moment().format("YYYY-MM-DD HH:mm:ss");

    let getAntreanTemp = await _getOneAntrianTemp(req.params.id);
    if (getAntreanTemp === "ERROR") {
        return Response(
            res,
            "Internal Server Error",
            null,
            201,
            "[GET-ANTRIAN][ANTRIAN-KOSONG][ERROR]"
        );
    }
    if (getAntreanTemp == null) {
        return Response(
            res,
            "Antrean tidak ditemukan",
            null,
            201,
            "[GET-ANTRIAN][ANTRIAN-KOSONG][ERROR]"
        );
    }

    let getAntrian = await getAntrianPoliklinikByKodeBooking(
        getAntreanTemp.kodebooking
    );
    if (getAntrian === "ERROR") {
        return Response(
            res,
            "Internal Server Error",
            null,
            201,
            "[GET-ANTRIAN][ANTRIAN-KOSONG][ERROR]"
        );
    }
    if (getAntrian == null) {
        return Response(
            res,
            "Kode Booking Tidak Ditemukan",
            null,
            201,
            "[GET-ANTRIAN][ANTRIAN-KOSONG][ERROR]"
        );
    }

    let jenisantrean = {};
    if (req.body.jenis !== "FARMASI") {
        jenisantrean = { $in: ["BPJS", "MJKN", "UMUM"] };
    } else {
        jenisantrean = { $in: ["FARMASI"] };
    }

    if (req.body.status === STATUS_DILAYANI) {
        // let updateAllStatusDisplayToFalse = await _updateAllStatusDisplayToFalse(today, jenisantrean, {status_display : false});
        // if (updateAllStatusDisplayToFalse == "ERROR") {
        //     return Response(res, "Internal Server Error", null, 201, "[ANTREAN][UPDATE][ERROR]");
        // }

        if (req.body.jenis === "FARMASI") {
            // update ke bpjs
            let updatePushAntren = {
                kodebooking: getAntreanTemp.kodebooking,
                taskid: 6,
                waktu: parseInt(moment(waktu).format("x")),
            };
            let updatewaktuDilayani = await requestUrl(
                config.updatewaktu.url,
                updatePushAntren
            );
            if (updatewaktuDilayani === "ERROR") {
                return Response(
                    res,
                    "Internal Server Error",
                    null,
                    201,
                    "[PUSH-UPDATE-WAKTU][ERROR]"
                );
            }
            if (updatewaktuDilayani.metadata.code != 200) {
                return Response(
                    res,
                    updatewaktuDilayani.metadata.message,
                    null,
                    201,
                    "[PUSH-UPDATE-WAKTU][FAILED]"
                );
            }
            logging.info(
                `[PUSH-UPDATE-WAKTU][SUCCESSFULLY] ${JSON.stringify(
                    updatewaktuDilayani
                )}`
            );

            let dataUpdateAntrianDilayani = {
                status: "dilayani",
                taskid: 6,
                waktu_dilayani_farmasi: moment().format("YYYY-MM-DD HH:mm:ss"),
                updatedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
            };
            let updateAntrianPoliklinikDilayani =
                await _updateAntrianPoliklinik(
                    getAntrian._id,
                    dataUpdateAntrianDilayani
                );
            if (updateAntrianPoliklinikDilayani == "ERROR") {
                return Response(
                    res,
                    "Internal Server Error",
                    null,
                    201,
                    "[UPDATE-ANTREAN-LOCAL][ERROR]"
                );
            }
            logging.info(
                `[UPDATE-ANTREAN-LOCAL][SUCCESSFULLY] ${JSON.stringify(
                    updateAntrianPoliklinikDilayani
                )}`
            );
        } else {
            // if (getAntrian.pasienbaru === 1) {
            //     if (getAntrian.status === "menunggu" && getAntrian.taskid === 0) {
            //         // update waktu ke bpjs
            //         waktu =  moment().format("YYYY-MM-DD HH:mm:ss")
            //         let updatePushJknCheckin = {
            //             kodebooking : getAntreanTemp.kodebooking,
            //             taskid      : 1,
            //             waktu       : parseInt(moment(waktu).format("x")),
            //         }
            //         let updatewaktuCheckin = await requestUrl(config.updatewaktu.url, updatePushJknCheckin);
            //         if (updatewaktuCheckin === "ERROR") {
            //             return Response(res, "Internal Server Error", null, 201, "[PUSH-UPDATE-WAKTU][ERROR]");
            //         }
            //         if (updatewaktuCheckin.metadata.code != 200) {
            //             return Response(res, updatewaktuCheckin.metadata.message, null, 201, "[PUSH-UPDATE-WAKTU][FAILED]");
            //         }
            //         logging.info(`[PUSH-UPDATE-WAKTU][SUCCESSFULLY] ${JSON.stringify(updatewaktuCheckin)}`);

            //         // update waktu ke local
            //         let dataUpdateAntrianCheckin = {
            //             status          : 'checkin',
            //             taskid          : 1,
            //             pasienbaru      : 0,
            //             waktu_checkin   : moment().format("YYYY-MM-DD HH:mm:ss"),
            //             waktu_dipanggil_admisi   : moment().format("YYYY-MM-DD HH:mm:ss"),
            //             updatedAt       : moment().format("YYYY-MM-DD HH:mm:ss"),
            //         }
            //         let updateAntrianPoliklinikCheckin = await _updateAntrianPoliklinik(getAntrian._id, dataUpdateAntrianCheckin);
            //         if (updateAntrianPoliklinikCheckin == "ERROR") {
            //             return Response(res, "Internal Server Error", null, 201, "[UPDATE-ANTREAN-LOCAL][ERROR]");
            //         }
            //         logging.info(`[UPDATE-ANTREAN-LOCAL][SUCCESSFULLY] ${JSON.stringify(updateAntrianPoliklinikCheckin)}`);
            //     }

            //     // update waktu ke bpjs
            //     waktu =  moment().format("YYYY-MM-DD HH:mm:ss")
            //     let updatePushJknDilayani = {
            //         kodebooking : getAntreanTemp.kodebooking,
            //         taskid      : 2,
            //         waktu       : parseInt(moment(waktu).format("x")),
            //     }
            //     let updatewaktuDilayani = await requestUrl(config.updatewaktu.url, updatePushJknDilayani);
            //     if (updatewaktuDilayani === "ERROR") {
            //         return Response(res, "Internal Server Error", null, 201, "[PUSH-UPDATE-WAKTU][ERROR]");
            //     }
            //     if (updatewaktuDilayani.metadata.code != 200) {
            //         return Response(res, updatewaktuDilayani.metadata.message, null, 201, "[PUSH-UPDATE-WAKTU][FAILED]");
            //     }
            //     logging.info(`[PUSH-UPDATE-WAKTU][SUCCESSFULLY] ${JSON.stringify(updatewaktuDilayani)}`);

            //     // update waktu ke local
            //     let dataUpdateAntrianDilayani = {
            //         status          : 'dilayani',
            //         taskid          : 2,
            //         pasienbaru      : 0,
            //         waktu_dilayani_admisi   : moment().format("YYYY-MM-DD HH:mm:ss"),
            //         updatedAt       : moment().format("YYYY-MM-DD HH:mm:ss"),
            //     }
            //     let updateAntrianPoliklinikDilayani = await _updateAntrianPoliklinik(getAntrian._id, dataUpdateAntrianDilayani);
            //     if (updateAntrianPoliklinikDilayani == "ERROR") {
            //         return Response(res, "Internal Server Error", null, 201, "[UPDATE-ANTREAN-LOCAL][ERROR]");
            //     }
            //     logging.info(`[UPDATE-ANTREAN-LOCAL][SUCCESSFULLY] ${JSON.stringify(updateAntrianPoliklinikDilayani)}`);

            //     let getPasien = await getPasienByRM(getAntrian.norm);
            //     if (getPasien === "ERROR") {
            //         return Response(res, "Internal Server Error", null, 201, "[GET-PASIEN][ERROR]");
            //     }

            //     let dataUpdatePasien = {
            //         pasienbaru  : 0,
            //     }
            //     let _updatepasien = await updatePasien(getPasien._id, dataUpdatePasien);
            //     if (_updatepasien == "ERROR") {
            //         return Response(res, "Internal Server Error", null, 201, "[UPDATE-PASIEN-LOCAL][ERROR]");
            //     }
            //     logging.info(`[UPDATE-PASIEN-LOCAL][SUCCESSFULLY] ${JSON.stringify(_updatepasien)}`);
            // } else {

            // }

            // update waktu ke bpjs
            waktu = moment().format("YYYY-MM-DD HH:mm:ss");
            let updatePushJknDilayani = {
                kodebooking: getAntreanTemp.kodebooking,
                taskid: 2,
                waktu: parseInt(moment(waktu).format("x")),
            };
            let updatewaktuDilayani = await requestUrl(
                config.updatewaktu.url,
                updatePushJknDilayani
            );
            if (updatewaktuDilayani === "ERROR") {
                return Response(
                    res,
                    "Internal Server Error",
                    null,
                    201,
                    "[PUSH-UPDATE-WAKTU][ERROR]"
                );
            }
            if (updatewaktuDilayani.metadata.code != 200) {
                return Response(
                    res,
                    updatewaktuDilayani.metadata.message,
                    null,
                    201,
                    "[PUSH-UPDATE-WAKTU][FAILED]"
                );
            }
            logging.info(
                `[PUSH-UPDATE-WAKTU][SUCCESSFULLY] ${JSON.stringify(
                    updatewaktuDilayani
                )}`
            );

            // update waktu ke local
            let dataUpdateAntrianDilayani = {
                status: "dilayani",
                taskid: 2,
                pasienbaru: 0,
                waktu_dilayani_admisi: moment().format("YYYY-MM-DD HH:mm:ss"),
                updatedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
            };
            let updateAntrianPoliklinikDilayani =
                await _updateAntrianPoliklinik(
                    getAntrian._id,
                    dataUpdateAntrianDilayani
                );
            if (updateAntrianPoliklinikDilayani == "ERROR") {
                return Response(
                    res,
                    "Internal Server Error",
                    null,
                    201,
                    "[UPDATE-ANTREAN-LOCAL][ERROR]"
                );
            }
            logging.info(
                `[UPDATE-ANTREAN-LOCAL][SUCCESSFULLY] ${JSON.stringify(
                    updateAntrianPoliklinikDilayani
                )}`
            );

            let getPasien = await getPasienByRM(getAntrian.norm);
            if (getPasien === "ERROR") {
                return Response(
                    res,
                    "Internal Server Error",
                    null,
                    201,
                    "[GET-PASIEN][ERROR]"
                );
            }

            let dataUpdatePasien = {
                pasienbaru: 0,
            };
            let _updatepasien = await updatePasien(
                getPasien._id,
                dataUpdatePasien
            );
            if (_updatepasien == "ERROR") {
                return Response(
                    res,
                    "Internal Server Error",
                    null,
                    201,
                    "[UPDATE-PASIEN-LOCAL][ERROR]"
                );
            }
            logging.info(
                `[UPDATE-PASIEN-LOCAL][SUCCESSFULLY] ${JSON.stringify(
                    _updatepasien
                )}`
            );
        }

        // let jenisantreandipanggil = "";
        // if (req.body.jenis !== "FARMASI") {
        //     jenisantreandipanggil = "ADMISI";
        // } else {
        //     jenisantreandipanggil = "FARMASI";
        // }
        // let deleteAntrianDipanggil = await _deleteAntrianDipanggil(jenisantreandipanggil);
        // if (deleteAntrianDipanggil == "ERROR") {
        //     return Response(res, "Internal Server Error", null, 201, "[DELETE-ANTRIAN-DIPANGGIL][ERROR]");
        // }
        // logging.info(`[DELETE-ANTRIAN-DIPANGGIL][SUCCESSFULLY] ${JSON.stringify(deleteAntrianDipanggil)}`);
    }

    if (req.body.status === STATUS_SELESAI) {
        if (req.body.jenis === "FARMASI") {
            // update ke bpjs
            let updatePushAntren = {
                kodebooking: getAntreanTemp.kodebooking,
                taskid: 7,
                waktu: parseInt(moment(waktu).format("x")),
            };
            let updatewaktuDilayani = await requestUrl(
                config.updatewaktu.url,
                updatePushAntren
            );
            if (updatewaktuDilayani === "ERROR") {
                return Response(
                    res,
                    "Internal Server Error",
                    null,
                    201,
                    "[PUSH-UPDATE-WAKTU][ERROR]"
                );
            }
            if (updatewaktuDilayani.metadata.code != 200) {
                return Response(
                    res,
                    updatewaktuDilayani.metadata.message,
                    null,
                    201,
                    "[PUSH-UPDATE-WAKTU][FAILED]"
                );
            }
            logging.info(
                `[PUSH-UPDATE-WAKTU][SUCCESSFULLY] ${JSON.stringify(
                    updatewaktuDilayani
                )}`
            );

            let dataUpdateAntrianDilayani = {
                status: "selesai",
                taskid: 7,
                waktu_dilayani_selesai: moment().format("YYYY-MM-DD HH:mm:ss"),
                updatedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
            };
            let updateAntrianPoliklinikDilayani =
                await _updateAntrianPoliklinik(
                    getAntrian._id,
                    dataUpdateAntrianDilayani
                );
            if (updateAntrianPoliklinikDilayani == "ERROR") {
                return Response(
                    res,
                    "Internal Server Error",
                    null,
                    201,
                    "[UPDATE-ANTREAN-LOCAL][ERROR]"
                );
            }
            logging.info(
                `[UPDATE-ANTREAN-LOCAL][SUCCESSFULLY] ${JSON.stringify(
                    updateAntrianPoliklinikDilayani
                )}`
            );
        } else {
            if (getAntrian.status !== "checkin" && getAntrian.taskid !== 3) {
                // update ke bpjs
                let updatePushJkn = {
                    kodebooking: getAntreanTemp.kodebooking,
                    taskid: 3,
                    waktu: parseInt(moment(waktu).format("x")),
                };
                let updatewaktu = await requestUrl(
                    config.updatewaktu.url,
                    updatePushJkn
                );
                if (updatewaktu === "ERROR") {
                    return Response(
                        res,
                        "Internal Server Error",
                        null,
                        201,
                        "[PUSH-UPDATE-WAKTU][ERROR]"
                    );
                }
                if (updatewaktu.metadata.code != 200) {
                    return Response(
                        res,
                        updatewaktu.metadata.message,
                        null,
                        201,
                        "[PUSH-UPDATE-WAKTU][FAILED]"
                    );
                }
                logging.info(
                    `[PUSH-UPDATE-WAKTU][SUCCESSFULLY] ${JSON.stringify(
                        updatewaktu
                    )}`
                );

                let dataUpdateAntrian = {
                    status: "checkin",
                    taskid: 3,
                    waktu_tunggu_poli: moment().format("YYYY-MM-DD HH:mm:ss"),
                    updatedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
                };
                let updateAntrianPoliklinik = await _updateAntrianPoliklinik(
                    getAntrian._id,
                    dataUpdateAntrian
                );
                if (updateAntrianPoliklinik == "ERROR") {
                    return Response(
                        res,
                        "Internal Server Error",
                        null,
                        201,
                        "[UPDATE-ANTREAN-LOCAL][ERROR]"
                    );
                }
                logging.info(
                    `[UPDATE-ANTREAN-LOCAL][SUCCESSFULLY] ${JSON.stringify(
                        updateAntrianPoliklinik
                    )}`
                );
            }
        }

        // let antrean = await _getAllAntreanDipanggilDilayaniByLoket(today, jenisantrean);
        // const indexTrueDisplay = antrean.findIndex(object => {
        //     return object.status_display === true;
        // });

        // const nextIndexTrueDisplay = indexTrueDisplay + 1;
        // let elementNextTrueDisplay = null;
        // for (let i = 0; i < antrean.length; i++) {
        //     if (antrean[i] == nextIndexTrueDisplay) {
        //         elementNextTrueDisplay = antrean[nextIndexTrueDisplay];
        //     }
        // }

        // if (elementNextTrueDisplay === null ) {
        //     if (antrean.length !== 0) {
        //         let updateStatusDisplayNextElementToTrue = await _updateStatusDisplayNextElementToTrue(antrean[0]._id, {status_display : true});
        //         if (updateStatusDisplayNextElementToTrue == "ERROR") {
        //             return Response(res, "Internal Server Error", null, 201, "[ANTREAN][UPDATE][ERROR]");
        //         }
        //     }
        // } else {
        //     let updateStatusDisplayNextElementToTrue = await _updateStatusDisplayNextElementToTrue(elementNextTrueDisplay._id, {status_display : true});
        //     if (updateStatusDisplayNextElementToTrue == "ERROR") {
        //         return Response(res, "Internal Server Error", null, 201, "[ANTREAN][UPDATE][ERROR]");
        //     }
        // }
    }

    if (req.body.status === STATUS_DIBATALKAN) {
        if (req.body.jenis === "FARMASI") {
            // update ke bpjs
            let updatePushAntren = {
                kodebooking: getAntreanTemp.kodebooking,
                taskid: 99,
                waktu: parseInt(moment(waktu).format("x")),
            };
            let updatewaktuDilayani = await requestUrl(
                config.updatewaktu.url,
                updatePushAntren
            );
            if (updatewaktuDilayani === "ERROR") {
                return Response(
                    res,
                    "Internal Server Error",
                    null,
                    201,
                    "[PUSH-UPDATE-WAKTU][ERROR]"
                );
            }
            if (updatewaktuDilayani.metadata.code != 200) {
                return Response(
                    res,
                    updatewaktuDilayani.metadata.message,
                    null,
                    201,
                    "[PUSH-UPDATE-WAKTU][FAILED]"
                );
            }
            logging.info(
                `[PUSH-UPDATE-WAKTU][SUCCESSFULLY] ${JSON.stringify(
                    updatewaktuDilayani
                )}`
            );

            // update local
            let dataUpdateAntrianBatal = {
                status: "batal",
                taskid: 99,
                waktu_batal: moment().format("YYYY-MM-DD HH:mm:ss"),
                updatedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
            };
            let updateAntrianPoliklinikBatal = await _updateAntrianPoliklinik(
                getAntrian._id,
                dataUpdateAntrianBatal
            );
            if (updateAntrianPoliklinikBatal == "ERROR") {
                return Response(
                    res,
                    "Internal Server Error",
                    null,
                    201,
                    "[UPDATE-ANTREAN-LOCAL][ERROR]"
                );
            }
            logging.info(
                `[UPDATE-ANTREAN-LOCAL][SUCCESSFULLY] ${JSON.stringify(
                    updateAntrianPoliklinikBatal
                )}`
            );
        } else {
            if (getAntrian.pasienbaru === 1) {
                let getPasien = await getPasienByRM(getAntrian.norm);
                if (getPasien === "ERROR") {
                    return Response(
                        res,
                        "Internal Server Error",
                        null,
                        201,
                        "[GET-PASIEN][ERROR]"
                    );
                }

                let dataUpdatePasien = {
                    pasienbaru: 0,
                };
                let _updatepasien = await updatePasien(
                    getPasien._id,
                    dataUpdatePasien
                );
                if (_updatepasien == "ERROR") {
                    return Response(
                        res,
                        "Internal Server Error",
                        null,
                        201,
                        "[UPDATE-PASIEN-LOCAL][ERROR]"
                    );
                }
                logging.info(
                    `[UPDATE-PASIEN-LOCAL][SUCCESSFULLY] ${JSON.stringify(
                        _updatepasien
                    )}`
                );
            }

            // update ke bpjs
            let updatePushAntren = {
                kodebooking: getAntreanTemp.kodebooking,
                taskid: 99,
                waktu: parseInt(moment(waktu).format("x")),
            };
            let updatewaktuBatal = await requestUrl(
                config.updatewaktu.url,
                updatePushAntren
            );
            if (updatewaktuBatal === "ERROR") {
                return Response(
                    res,
                    "Internal Server Error",
                    null,
                    201,
                    "[PUSH-UPDATE-WAKTU][ERROR]"
                );
            }
            if (updatewaktuBatal.metadata.code != 200) {
                return Response(
                    res,
                    updatewaktuBatal.metadata.message,
                    null,
                    201,
                    "[PUSH-UPDATE-WAKTU][FAILED]"
                );
            }
            logging.info(
                `[PUSH-UPDATE-WAKTU][SUCCESSFULLY] ${JSON.stringify(
                    updatewaktuBatal
                )}`
            );

            // update waktu ke local
            let dataUpdateAntrianDilayani = {
                status: "batal",
                taskid: 99,
                pasienbaru: 0,
                waktu_batal: moment().format("YYYY-MM-DD HH:mm:ss"),
                updatedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
            };
            let updateAntrianPoliklinikDilayani =
                await _updateAntrianPoliklinik(
                    getAntrian._id,
                    dataUpdateAntrianDilayani
                );
            if (updateAntrianPoliklinikDilayani == "ERROR") {
                return Response(
                    res,
                    "Internal Server Error",
                    null,
                    201,
                    "[UPDATE-ANTREAN-LOCAL][ERROR]"
                );
            }
            logging.info(
                `[UPDATE-ANTREAN-LOCAL][SUCCESSFULLY] ${JSON.stringify(
                    updateAntrianPoliklinikDilayani
                )}`
            );
        }
    }

    let body = {
        status: req.body.status,
        // status_display : req.body.status_display,
        updatedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
    };
    let updateAntrian = await updateAntrianTemp(req.params.id, body);
    if (updateAntrian === "ERROR") {
        return Response(
            res,
            "Internal Server Error",
            null,
            201,
            "[ANTREAN-UPDATE][ERROR]"
        );
    }

    logging.info(
        `[ANTREAN-UPDATE][SUCCESSFULLY] ${JSON.stringify(updateAntrian)}`
    );
    return Response(
        res,
        "Ok",
        updateAntrian,
        200,
        "[ANTREAN-UPDATE][SUCCESSFULLY]"
    );
};

exports.updateStatusMjkn = async (req, res) => {
    let config = iniParser.get();
    let today = moment().format("YYYY-MM-DD");
    let waktu = moment().format("YYYY-MM-DD HH:mm:ss");

    let getAntrian = await getAntrianPoliklinikByKodeBooking(
        req.body.kodebooking
    );
    if (getAntrian === "ERROR") {
        return Response(
            res,
            "Internal Server Error",
            null,
            201,
            "[GET-ANTRIAN][ANTRIAN-KOSONG][ERROR]"
        );
    }
    if (getAntrian == null) {
        return Response(
            res,
            "Antrean Tidak Ditemukan",
            null,
            201,
            "[GET-ANTRIAN][ANTRIAN-KOSONG][ERROR]"
        );
    }

    let jenisantrean = {};
    if (req.body.jenis !== "FARMASI") {
        jenisantrean = { $in: ["BPJS", "MJKN", "UMUM"] };
    } else {
        jenisantrean = { $in: ["FARMASI"] };
    }

    if (req.body.status === STATUS_DILAYANI) {
        let updateAllStatusDisplayToFalse =
            await _updateAllStatusDisplayToFalse(today, jenisantrean, {
                status_display: false,
            });
        if (updateAllStatusDisplayToFalse == "ERROR") {
            return Response(
                res,
                "Internal Server Error",
                null,
                201,
                "[ANTREAN][UPDATE][ERROR]"
            );
        }

        let jenisantreandipanggil = "";
        if (req.body.jenis !== "FARMASI") {
            jenisantreandipanggil = "ADMISI";
        } else {
            jenisantreandipanggil = "FARMASI";
        }
        let deleteAntrianDipanggil = await _deleteAntrianDipanggil(
            jenisantreandipanggil
        );
        if (deleteAntrianDipanggil == "ERROR") {
            return Response(
                res,
                "Internal Server Error",
                null,
                201,
                "[DELETE-ANTRIAN-DIPANGGIL][ERROR]"
            );
        }
        logging.info(
            `[DELETE-ANTRIAN-DIPANGGIL][SUCCESSFULLY] ${JSON.stringify(
                deleteAntrianDipanggil
            )}`
        );

        if (getAntrian.pasienbaru === 1) {
            // update waktu ke bpjs
            let updatePushJknCheckin = {
                kodebooking: req.body.kodebooking,
                taskid: 1,
                waktu: parseInt(moment(waktu).format("x")),
            };
            let updatewaktuCheckin = await requestUrl(
                config.updatewaktu.url,
                updatePushJknCheckin
            );
            if (updatewaktuCheckin === "ERROR") {
                return Response(
                    res,
                    "Internal Server Error",
                    null,
                    201,
                    "[PUSH-UPDATE-WAKTU][ERROR]"
                );
            }
            if (updatewaktuCheckin.metadata.code != 200) {
                return Response(
                    res,
                    updatewaktuCheckin.metadata.message,
                    null,
                    201,
                    "[PUSH-UPDATE-WAKTU][FAILED]"
                );
            }
            logging.info(
                `[PUSH-UPDATE-WAKTU][SUCCESSFULLY] ${JSON.stringify(
                    updatewaktuCheckin
                )}`
            );

            // update waktu ke bpjs
            let updatePushJknDilayani = {
                kodebooking: req.body.kodebooking,
                taskid: 2,
                waktu: parseInt(moment(waktu).format("x")),
            };
            let updatewaktuDilayani = await requestUrl(
                config.updatewaktu.url,
                updatePushJknDilayani
            );
            if (updatewaktuDilayani === "ERROR") {
                return Response(
                    res,
                    "Internal Server Error",
                    null,
                    201,
                    "[PUSH-UPDATE-WAKTU][ERROR]"
                );
            }
            if (updatewaktuDilayani.metadata.code != 200) {
                return Response(
                    res,
                    updatewaktuDilayani.metadata.message,
                    null,
                    201,
                    "[PUSH-UPDATE-WAKTU][FAILED]"
                );
            }
            logging.info(
                `[PUSH-UPDATE-WAKTU][SUCCESSFULLY] ${JSON.stringify(
                    updatewaktuDilayani
                )}`
            );

            // update waktu ke local
            let dataUpdateAntrianCheckin = {
                status: "checkin",
                taskid: 1,
                pasienbaru: 0,
                waktu_checkin: moment().format("YYYY-MM-DD HH:mm:ss"),
                waktu_dipanggil_admisi: moment().format("YYYY-MM-DD HH:mm:ss"),
                updatedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
            };
            let updateAntrianPoliklinikCheckin = await _updateAntrianPoliklinik(
                getAntrian._id,
                dataUpdateAntrianCheckin
            );
            if (updateAntrianPoliklinikCheckin == "ERROR") {
                return Response(
                    res,
                    "Internal Server Error",
                    null,
                    201,
                    "[UPDATE-ANTREAN-LOCAL][ERROR]"
                );
            }
            logging.info(
                `[UPDATE-ANTREAN-LOCAL][SUCCESSFULLY] ${JSON.stringify(
                    updateAntrianPoliklinikCheckin
                )}`
            );

            // update waktu ke local
            let dataUpdateAntrianDilayani = {
                status: "dilayani",
                taskid: 2,
                waktu_dilayani_admisi: moment().format("YYYY-MM-DD HH:mm:ss"),
                updatedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
            };
            let updateAntrianPoliklinikDilayani =
                await _updateAntrianPoliklinik(
                    getAntrian._id,
                    dataUpdateAntrianDilayani
                );
            if (updateAntrianPoliklinikDilayani == "ERROR") {
                return Response(
                    res,
                    "Internal Server Error",
                    null,
                    201,
                    "[UPDATE-ANTREAN-LOCAL][ERROR]"
                );
            }
            logging.info(
                `[UPDATE-ANTREAN-LOCAL][SUCCESSFULLY] ${JSON.stringify(
                    updateAntrianPoliklinikDilayani
                )}`
            );

            let getPasien = await getPasienByRM(getAntrian.norm);
            if (getPasien === "ERROR") {
                return Response(
                    res,
                    "Internal Server Error",
                    null,
                    201,
                    "[GET-PASIEN][ERROR]"
                );
            }

            let dataUpdatePasien = {
                pasienbaru: 0,
            };
            let _updatepasien = await updatePasien(
                getPasien._id,
                dataUpdatePasien
            );
            if (_updatepasien == "ERROR") {
                return Response(
                    res,
                    "Internal Server Error",
                    null,
                    201,
                    "[UPDATE-PASIEN-LOCAL][ERROR]"
                );
            }
            logging.info(
                `[UPDATE-PASIEN-LOCAL][SUCCESSFULLY] ${JSON.stringify(
                    _updatepasien
                )}`
            );
        }
    }

    if (req.body.status === STATUS_DIBATALKAN) {
        // update waktu ke bpjs
        let updatePushJkn = {
            kodebooking: req.body.kodebooking,
            taskid: 99,
            waktu: parseInt(moment(waktu).format("x")),
        };
        let updatewaktu = await requestUrl(
            config.updatewaktu.url,
            updatePushJkn
        );
        if (updatewaktu === "ERROR") {
            return Response(
                res,
                "Internal Server Error",
                null,
                201,
                "[PUSH-UPDATE-WAKTU][ERROR]"
            );
        }
        if (updatewaktu.metadata.code != 200) {
            return Response(
                res,
                updatewaktu.metadata.message,
                null,
                201,
                "[PUSH-UPDATE-WAKTU][FAILED]"
            );
        }
        logging.info(
            `[PUSH-UPDATE-WAKTU][SUCCESSFULLY] ${JSON.stringify(updatewaktu)}`
        );

        // update waktu ke local
        let dataUpdateAntrian = {
            status: "batal",
            taskid: 99,
            pasienbaru: 0,
            status_display: false,
            waktu_batal: moment().format("YYYY-MM-DD HH:mm:ss"),
            updatedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
        };
        let updateAntrianPoliklinik = await _updateAntrianPoliklinik(
            getAntrian._id,
            dataUpdateAntrian
        );
        if (updateAntrianPoliklinik == "ERROR") {
            return Response(
                res,
                "Internal Server Error",
                null,
                201,
                "[UPDATE-ANTREAN-LOCAL][ERROR]"
            );
        }
        logging.info(
            `[UPDATE-ANTREAN-LOCAL][SUCCESSFULLY] ${JSON.stringify(
                updateAntrianPoliklinik
            )}`
        );
    }

    if (req.body.status === STATUS_SELESAI) {
        // update ke bpjs
        let updatePushJkn = {
            kodebooking: req.body.kodebooking,
            taskid: 3,
            waktu: parseInt(moment(waktu).format("x")),
        };
        let updatewaktu = await requestUrl(
            config.updatewaktu.url,
            updatePushJkn
        );
        if (updatewaktu === "ERROR") {
            return Response(
                res,
                "Internal Server Error",
                null,
                201,
                "[PUSH-UPDATE-WAKTU][ERROR]"
            );
        }
        if (updatewaktu.metadata.code != 200) {
            return Response(
                res,
                updatewaktu.metadata.message,
                null,
                201,
                "[PUSH-UPDATE-WAKTU][FAILED]"
            );
        }
        logging.info(
            `[PUSH-UPDATE-WAKTU][SUCCESSFULLY] ${JSON.stringify(updatewaktu)}`
        );

        let dataUpdateAntrian = {
            status: "checkin",
            taskid: 3,
            waktu_checkin: moment().format("YYYY-MM-DD HH:mm:ss"),
            waktu_tunggu_poli: moment().format("YYYY-MM-DD HH:mm:ss"),
            updatedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
        };
        let updateAntrianPoliklinik = await _updateAntrianPoliklinik(
            getAntrian._id,
            dataUpdateAntrian
        );
        if (updateAntrianPoliklinik == "ERROR") {
            return Response(
                res,
                "Internal Server Error",
                null,
                201,
                "[UPDATE-ANTREAN-LOCAL][ERROR]"
            );
        }
        logging.info(
            `[UPDATE-ANTREAN-LOCAL][SUCCESSFULLY] ${JSON.stringify(
                updateAntrianPoliklinik
            )}`
        );

        // let antrean = await _getAllAntreanDipanggilDilayaniByLoket(today, jenisantrean);
        // const indexTrueDisplay = antrean.findIndex(object => {
        //     return object.status_display === true;
        // });

        // const nextIndexTrueDisplay = indexTrueDisplay + 1;
        // let elementNextTrueDisplay = null;
        // for (let i = 0; i < antrean.length; i++) {
        //     if (antrean[i] == nextIndexTrueDisplay) {
        //         elementNextTrueDisplay = antrean[nextIndexTrueDisplay];
        //     }
        // }

        // if (elementNextTrueDisplay === null ) {
        //     if (antrean.length !== 0) {
        //         let updateStatusDisplayNextElementToTrue = await _updateStatusDisplayNextElementToTrue(antrean[0]._id, {status_display : true});
        //         if (updateStatusDisplayNextElementToTrue == "ERROR") {
        //             return Response(res, "Internal Server Error", null, 201, "[ANTREAN][UPDATE][ERROR]");
        //         }
        //     }
        // } else {
        //     let updateStatusDisplayNextElementToTrue = await _updateStatusDisplayNextElementToTrue(elementNextTrueDisplay._id, {status_display : true});
        //     if (updateStatusDisplayNextElementToTrue == "ERROR") {
        //         return Response(res, "Internal Server Error", null, 201, "[ANTREAN][UPDATE][ERROR]");
        //     }
        // }
    }

    let body = {
        status: req.body.status,
        status_display: req.body.status_display,
        updatedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
    };
    let updateAntrian = await updateAntrianTemp(req.body.antrean_temp_id, body);
    if (updateAntrian === "ERROR") {
        return Response(
            res,
            "Internal Server Error",
            null,
            201,
            "[ANTREAN-UPDATE][ERROR]"
        );
    }
    logging.info(
        `[ANTREAN-UPDATE][SUCCESSFULLY] ${JSON.stringify(updateAntrian)}`
    );

    return Response(
        res,
        "Ok",
        updateAntrian,
        200,
        "[ANTREAN-UPDATE][SUCCESSFULLY]"
    );
};

exports.getAllAntreanDipanggilDilayani = async (req, res) => {
    let config = iniParser.get();
    let today = moment().format("YYYY-MM-DD");

    let jenisantrean = {};
    if (req.params.jenis == "BPJS") {
        jenisantrean = { $in: ["BPJS", "MJKN", "UMUM"] };
    } else {
        jenisantrean = { $in: ["FARMASI"] };
    }

    let antrean = await _getAllAntreanDipanggilDilayaniByLoket(
        today,
        jenisantrean
    );
    let result = antrean.reduce(function (r, a) {
        r[a.jenisantrean] = r[a.jenisantrean] || [];
        r[a.jenisantrean].push(a);
        return r;
    }, Object.create(null));

    return Response(
        res,
        "Ok",
        result,
        200,
        "[ANTREAN-ALL][DIPANGGIL-DILAYANI][SUCCESSFULLY]"
    );
};

exports.getAllAntreanDipanggilDilayaniDisplay = async (req, res) => {
    let today = moment().format("YYYY-MM-DD");

    let jenisantrean = {};
    if (req.params.jenis == "BPJS") {
        jenisantrean = { $in: ["BPJS", "MJKN", "UMUM"] };
    } else {
        jenisantrean = { $in: ["FARMASI"] };
    }

    let data = await _getAllAntreanDipanggilDilayaniDisplay(
        today,
        jenisantrean
    );

    if (data === "ERROR") {
        return Response(
            res,
            "Internal Server Error",
            null,
            201,
            "[ANTREAN-ALL][DIPANGGIL-DILAYANI][ERROR]"
        );
    }

    if (data === null) {
        return Response(
            res,
            "Not oke.",
            null,
            201,
            "[ANTREAN-ALL][DIPANGGIL-DILAYANI][ERROR]"
        );
    }

    let totalantrean = await _getTotalAntreanByJenisAntrean(
        today,
        data.jenisantrean
    );
    let sisaantrean = await _getSisaAntreanByJenisAntrean(
        today,
        data.jenisantrean
    );

    // console.log(totalantrean)

    // let farmasi_id = data.loket_farmasi_id._id;
    // console.log(farmasi_id)

    // if (req.params.jenis === "FARMASI") {
    //     let temptotal = [];
    //     // for (let t = 0; t < totalantrean.length; t++) {
    //     //     if (totalantrean[t].loket_farmasi_id === data.loket_farmasi_id._id ) {
    //     //         temptotal.push(totalantrean[t]);
    //     //     }
    //     //     console.log(totalantrean[t] );
    //     // }

    //     for (let f = 0; f < totalantrean.length; f++) {
    //         if (totalantrean[f].loket_farmasi_id == farmasi_id) {
    //             temptotal.push(totalantrean[f]);
    //         }
    //     }
    //     console.log(temptotal);

    //     let tempsisa = [];
    //     for (let s = 0; s < sisaantrean.length; s++) {
    //         if (data.loket_farmasi_id._id === sisaantrean[s].loket_farmasi_id) {
    //             tempsisa.push(sisaantrean[s]);
    //         }
    //     }

    //     data = {
    //         antrean : data,
    //         total_antrean : temptotal.length,
    //         sisa_antrean : temptotal.length - tempsisa.length,
    //     }

    // } else {
    //     data = {
    //         antrean : data,
    //         total_antrean : totalantrean.length,
    //         sisa_antrean : totalantrean.length - sisaantrean.length,
    //     }
    // }

    data = {
        antrean: data,
        total_antrean: totalantrean.length,
        sisa_antrean: totalantrean.length - sisaantrean.length,
    };
    return Response(
        res,
        "Ok",
        data,
        200,
        "[ANTREAN-ALL][DIPANGGIL-DILAYANI][SUCCESSFULLY]"
    );
};

exports.updatestatusAntreanTemp = async (req, res) => {
    let body = {
        status: STATUS_DIBATALKAN,
        updatedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
    };
    let updateAntrian = await updateAntrianTemp(req.params.id, body);
    if (updateAntrian === "ERROR") {
        return Response(
            res,
            "Internal Server Error",
            null,
            201,
            "[ANTREAN-UPDATE][ERROR]"
        );
    }

    logging.info(
        `[ANTREAN-UPDATE][SUCCESSFULLY] ${JSON.stringify(updateAntrian)}`
    );
    return Response(
        res,
        "Ok",
        updateAntrian,
        200,
        "[ANTREAN-UPDATE][SUCCESSFULLY]"
    );
};

function getAntrianTemp(_today, _jenisantrean) {
    return new Promise(function (resolve, reject) {
        AntrianTemp.find({
            tanggalantrean: _today,
            jenisantrean: _jenisantrean,
        })
            .then((data) => {
                resolve(data);
            })
            .catch((err) => {
                resolve("ERROR");
            });
    });
}

function getAntrianTempByKodeBooking(_today, _jenisantrean, _kodebooking) {
    return new Promise(function (resolve, reject) {
        AntrianTemp.findOne({
            tanggalantrean: _today,
            jenisantrean: _jenisantrean,
            kodebooking: _kodebooking,
        })
            .then((data) => {
                resolve(data);
            })
            .catch((err) => {
                resolve("ERROR");
            });
    });
}

function _getOneAntrianTemp(_id) {
    return new Promise(function (resolve, reject) {
        AntrianTemp.findOne({
            _id: _id,
        })
            .then((data) => {
                resolve(data);
            })
            .catch((err) => {
                resolve("ERROR");
            });
    });
}

function createAntrianTemp(_data) {
    return new Promise(function (resolve, reject) {
        const SaveData = new AntrianTemp(_data);
        SaveData.save()
            .then((data) => {
                resolve(data);
            })
            .catch((err) => {
                resolve("ERROR");
            });
    });
}

function updateAntrianTemp(_id, _data) {
    return new Promise(function (resolve, reject) {
        AntrianTemp.findByIdAndUpdate(_id, _data, {
            new: true,
        })
            .then((_data) => {
                resolve(_data);
            })
            .catch((err) => {
                resolve("ERROR");
            });
    });
}

function _createAntrianDipanggil(_data) {
    return new Promise(function (resolve, reject) {
        const SaveData = new AntrianDipanggil(_data);
        SaveData.save()
            .then((data) => {
                resolve(data);
            })
            .catch((err) => {
                resolve("ERROR");
            });
    });
}

function _getAntrianDipanggil(_jenisantrean, _tanggalantrean) {
    return new Promise(function (resolve, reject) {
        AntrianDipanggil.find({
            jenisantrean: _jenisantrean,
            tanggalantrean: _tanggalantrean,
        })
            .then((data) => {
                resolve(data);
            })
            .catch((err) => {
                resolve("ERROR");
            });
    });
}

function _deleteAntrianDipanggil(_jenisantrean) {
    return new Promise(function (resolve, reject) {
        AntrianDipanggil.deleteMany({
            jenisantrean: _jenisantrean,
        })
            .then((data) => {
                resolve(data);
            })
            .catch((err) => {
                resolve("ERROR");
            });
    });
}

function _getAntreanDipanggilDilayaniByLoket(_today, _loket_id, _jenisantrean) {
    return new Promise(function (resolve, reject) {
        AntrianTemp.findOne({
            tanggalantrean: _today,
            loket_id: _loket_id,
            jenisantrean: _jenisantrean,
            status: { $in: [STATUS_DIPANGGIL, STATUS_DILAYANI] },
        })
            .populate("loket_id")
            .then((data) => {
                resolve(data);
            })
            .catch((err) => {
                resolve("ERROR");
            });
    });
}

function _getAntreanDipanggilDilayaniByFarmasi(_today, farmasi_id) {
    return new Promise(function (resolve, reject) {
        AntrianTemp.findOne({
            tanggalantrean: _today,
            loket_farmasi_id: farmasi_id,
            status: { $in: [STATUS_DIPANGGIL, STATUS_DILAYANI] },
        })
            .populate("loket_farmasi_id")
            .then((data) => {
                resolve(data);
            })
            .catch((err) => {
                resolve("ERROR");
            });
    });
}

function _sisaAntrean(_today, _jenisantrean) {
    return new Promise(function (resolve, reject) {
        AntrianTemp.find({
            tanggalantrean: _today,
            jenisantrean: _jenisantrean,
            status: {
                $in: [STATUS_MENUNGGU, STATUS_DIPANGGIL, STATUS_DILAYANI],
            },
        })
            .then((data) => {
                resolve(data);
            })
            .catch((err) => {
                resolve("ERROR");
            });
    });
}

function _getAllAntreanDipanggilDilayaniByLoket(_today, _jenisantrean) {
    return new Promise(function (resolve, reject) {
        AntrianTemp.find({
            tanggalantrean: _today,
            jenisantrean: _jenisantrean,
            status: {
                $in: [
                    STATUS_DIPANGGIL,
                    STATUS_DILAYANI,
                    STATUS_SELESAI,
                    STATUS_DIBATALKAN,
                ],
            },
            // status : STATUS_DILAYANI,
        })
            .populate("loket_id")
            .populate("loket_farmasi_id")
            .then((data) => {
                resolve(data);
            })
            .catch((err) => {
                resolve("ERROR");
            });
    });
}

function _getAllAntreanDipanggilDilayaniDisplay(_today, _jenisantrean) {
    return new Promise(function (resolve, reject) {
        AntrianTemp.findOne({
            tanggalantrean: _today,
            jenisantrean: _jenisantrean,
            status_display: true,
        })
            .populate("loket_id")
            .populate("loket_farmasi_id")
            .then((data) => {
                resolve(data);
            })
            .catch((err) => {
                resolve("ERROR");
            });
    });
}

function _getTotalAntreanByJenisAntrean(_today, _jenisantrean) {
    return new Promise(function (resolve, reject) {
        AntrianTemp.find({
            tanggalantrean: _today,
            jenisantrean: _jenisantrean,
            status: {
                $in: [
                    STATUS_MENUNGGU,
                    STATUS_DIPANGGIL,
                    STATUS_DILAYANI,
                    STATUS_SELESAI,
                ],
            },
        })
            .then((data) => {
                resolve(data);
            })
            .catch((err) => {
                resolve("ERROR");
            });
    });
}

function _getSisaAntreanByJenisAntrean(_today, _jenisantrean) {
    return new Promise(function (resolve, reject) {
        AntrianTemp.find({
            tanggalantrean: _today,
            jenisantrean: _jenisantrean,
            status: { $in: [STATUS_SELESAI] },
        })
            .then((data) => {
                resolve(data);
            })
            .catch((err) => {
                resolve("ERROR");
            });
    });
}

function getLoket() {
    return new Promise(function (resolve, reject) {
        Loket.find({
            status: 0,
        })
            .then((data) => {
                resolve(data);
            })
            .catch((err) => {
                resolve("ERROR");
            });
    });
}

function _updateAllStatusDisplayToFalse(_today, _jenisantrean, _data) {
    return new Promise(function (resolve, reject) {
        AntrianTemp.updateMany(
            { tanggalantrean: _today, jenisantrean: _jenisantrean },
            _data,
            {
                new: true,
            }
        )
            .then((_data) => {
                resolve(_data);
            })
            .catch((err) => {
                resolve("ERROR");
            });
    });
}

function _updateStatusDisplayNextElementToTrue(_id, _data) {
    return new Promise(function (resolve, reject) {
        AntrianTemp.findByIdAndUpdate(_id, _data, {
            new: true,
        })
            .then((_data) => {
                resolve(_data);
            })
            .catch((err) => {
                resolve("ERROR");
            });
    });
}

function _updateAntrianPoliklinik(_id, _data) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.findByIdAndUpdate(_id, _data, {
            new: true,
        })
            .then((_data) => {
                resolve(_data);
            })
            .catch((err) => {
                resolve("ERROR");
            });
    });
}

function getAntrianPoliklinikByKodeBooking(_kodebooking) {
    return new Promise(function (resolve, reject) {
        AntrianPoliklinik.findOne({
            kodebooking: _kodebooking,
        })
            .then((data) => {
                resolve(data);
            })
            .catch((err) => {
                resolve("ERROR");
            });
    });
}

function getPasienByRM(_norm) {
    return new Promise(function (resolve, reject) {
        Pasien.findOne({
            no_rm: _norm,
        })
            .then((data) => {
                resolve(data);
            })
            .catch((err) => {
                resolve("ERROR");
            });
    });
}

function updatePasien(_id, _data) {
    return new Promise(function (resolve, reject) {
        Pasien.findByIdAndUpdate(_id, _data, {
            new: true,
        })
            .then((_data) => {
                resolve(_data);
            })
            .catch((err) => {
                resolve("ERROR");
            });
    });
}

function biggestNumberInArray(arr) {
    var largest = arr[0].angkaantrean || null;
    var number = null;
    for (var i = 0; i < arr.length; i++) {
        number = arr[i].angkaantrean;
        largest = Math.max(largest, number);
    }

    return largest;
}

function groupByKey(array, key) {
    return array.reduce((hash, obj) => {
        if (obj[key] === undefined) return hash;
        return Object.assign(hash, {
            [obj[key]]: (hash[obj[key]] || []).concat(obj),
        });
    }, {});
}

function requestUrl(_url, _body) {
    return new Promise(async function (resolve, reject) {
        let options = {
            timeout: 60000,
            json: true,
        };

        needle.post(_url, _body, options, function (err, resp) {
            if (err) {
                resolve("ERROR");
            } else {
                resolve(resp.body);
            }
        });
    });
}

function _getOneMsAntrianDiPanggil(_antrian_id) {
    return new Promise(function (resolve, reject) {
        AntrianDipanggil.findOne({
            antrian_id: _antrian_id,
        })
            .then((data) => {
                resolve(data);
            })
            .catch((err) => {
                resolve("ERROR");
            });
    });
}
