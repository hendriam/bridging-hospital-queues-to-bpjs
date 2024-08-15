const fs                = require('fs');
const logging           = require('../libs/logging');
const iniParser         = require('../libs/iniParser');
const needle            = require('needle');
const Response          = require('../helpers/response');

exports.sendToAdmisi = async (req, res) => {
    let config   = iniParser.get();
    let dataSendToAdmisi = {
        hurufantrean    : req.body.hurufantrean,
        nomorantrean    : req.body.nomorantrean,
        angkaantrean    : req.body.angkaantrean,
        status          : req.body.status,
        tanggalantrean  : req.body.tanggalantrean,
        jenisantrean    : req.body.jenisantrean,
        status_display  : req.body.status_display,
    }
    let resSendDataToAdmisi = await requestUrl(config.send_to_admisi.url, dataSendToAdmisi);
    if (resSendDataToAdmisi === "ERROR") {
        return Response(res, "Internal Server Error", null, 201, "[PUSH-UPDATE-WAKTU][ERROR]");
    }
    if (resSendDataToAdmisi.metadata.code != 200) {
        return Response(res, resSendDataToAdmisi.metadata.message, null, 201, "[PUSH-UPDATE-WAKTU][FAILED]");
    }
    return Response(res, "Ok", resSendDataToAdmisi.response, 200, "[ANTREAN-UPDATE][SUCCESSFULLY]");
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