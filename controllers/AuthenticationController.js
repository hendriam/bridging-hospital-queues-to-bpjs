const fs            = require('fs');
const iniParser     = require('../libs/iniParser');
const logging       = require('../libs/logging');
const jsowebtoken   = require('jsonwebtoken');
const passwordHash  = require('password-hash');
const moment        = require('moment');
const Response      = require('../helpers/response');
const UserBpjs      = require('../models/UserBpjs.js');

const validateLogin     = fs.readFileSync('./data/login.json', 'utf-8');
const validateRegister  = fs.readFileSync('./data/register.json', 'utf-8');

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

exports.createRegister = async (req, res) => {
    logging.info(`[HTTP][REQUEST][HEADER] ${JSON.stringify(req.headers)}`);
    logging.info(`[HTTP][REQUEST][BODY] ${JSON.stringify(req.body)}`);
    logging.info(`[HTTP][REQUEST][PARAMS] ${JSON.stringify(req.params)}`);

    validateData = ajv.compile(JSON.parse(validateRegister));

    let dataRegister  = {
        username    : req.body.username,
        password    : req.body.password,
        last_login  : moment().format("YYYY-MM-DD HH:mm:ss"),
        createdAt   : moment().format("YYYY-MM-DD HH:mm:ss"),
        updatedAt   : moment().format("YYYY-MM-DD HH:mm:ss"),
    };

    dataValidate(dataRegister)
    .then(async function () {
        UserBpjs.find({
            'username': dataRegister.username
        }).exec(async function (err, docs) {
            if (docs.length) {
                let data = {
                    errors: [
                        {
                            type    : "username",
                            message : "Username Telah di Gunakan"
                        }
                    ]
                };

                return Response(res, "Validation Form Error", data, 422, "[REGISTER][CREATE][VALIDATION][FORM][ERROR][USERNAME]");
            } else {
                const userBpjs = new UserBpjs({
                    username    : dataRegister.username,
                    password    : passwordHash.generate(dataRegister.password),
                    last_login  : dataRegister.last_login,
                    createdAt   : dataRegister.createdAt,
                    updatedAt   : dataRegister.updatedAt,
                });

                userBpjs.save()
                .then(_data => {
                    return Response(res, "Register Berhasil", _data, 200, "[REGISTER][CREATE][SUCCESSFULLY]");
                }).catch(err => {
                    return Response(res, err.message, null, 500, "[REGISTER][CREATE][FAILED]");
                });
            }
        });
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

        return Response(res, "Validation Form Error", data, 422, "[REGISTER][CREATE][VALIDATION][FORM][ERROR]");
    });
};

exports.updateRegister = async (req, res) => {
    logging.info(`[HTTP][REQUEST][HEADER] ${JSON.stringify(req.headers)}`);
    logging.info(`[HTTP][REQUEST][BODY] ${JSON.stringify(req.body)}`);
    logging.info(`[HTTP][REQUEST][PARAMS] ${JSON.stringify(req.params)}`);

    validateData = ajv.compile(JSON.parse(validateRegister));

    let dataRegister  = {
        username    : req.body.username,
        password    : passwordHash.generate(req.body.password),
        last_login  : moment().format("YYYY-MM-DD HH:mm:ss"),
        createdAt   : moment().format("YYYY-MM-DD HH:mm:ss"),
        updatedAt   : moment().format("YYYY-MM-DD HH:mm:ss"),
    };

    dataValidate(dataRegister)
    .then(async function () {
        UserBpjs.find({
            'username': dataRegister.username
        }).exec(function (err, docs) {
            if (docs.length && docs[0]._id != req.params.Id) {
                let data = {
                    errors: [
                        {
                            type    : "username",
                            message : "Username Telah di Gunakan"
                        }
                    ]
                };

                return Response(res, "Validation Form Error", data, 422, "[REGISTER][UPDATE][VALIDATION][FORM][ERROR][USERNAME]");
            } else {
                UserBpjs.findByIdAndUpdate(req.params.Id, dataRegister,{ new: true })
                .then(async _data => {
                    if (!_data) {
                        return Response(res, "Update", _data, 200, "[REGISTER][UPDATE][SUCCESSFULLY]");
                    }

                    return Response(res, "Update Berhasil", _data, 200, "[REGISTER][UPDATE][SUCCESSFULLY]");
                })
                .catch(err => {
                    if (err.kind === 'ObjectId') {
                        return Response(res, "Data Tidak Ditemukan", null, 404, "[REGISTER][UPDATE][NOT-FOUND]");
                    }

                    return Response(res, "Internal Server Error.", null, 500, "[REGISTER][UPDATE][FAILED]");
                });
            }
        });
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

        return Response(res, "Validation Form Error", data, 422, "[REGISTER][UPDATE][VALIDATION][FORM][ERROR]");
    });
};

exports.registerFindAll = async (req, res) => {
    logging.info(`[HTTP][REQUEST][HEADER] ${JSON.stringify(req.headers)}`);
    logging.info(`[HTTP][REQUEST][BODY] ${JSON.stringify(req.body)}`);
    logging.info(`[HTTP][REQUEST][PARAMS] ${JSON.stringify(req.params)}`);

    let dataTable = {
        search: req.body.search == null ? "" : req.body.search,
        start: parseInt(req.body.start),
        length: parseInt(req.body.length),
        draw: parseInt(req.body.draw),
        order: req.body.order,
        dir: req.body.dir,
    };

    let total = await getTotal(dataTable.search);
    if (total == "ERROR") {
        return Response(res, "Internal Server Error.", null, 500, "[REGISTER][FIND-ALL][TOTAL][FAILED]");
    }

    let data = await getData(dataTable.search, dataTable.start, dataTable.length, dataTable.order, dataTable.dir);
    if (data == "ERROR") {
        return Response(res, "Internal Server Error.", null, 500, "[REGISTER][FIND-ALL][DATA][FAILED]");
    }

    let response = {
        data: data,
        draw: dataTable.draw,
        recordsTotal: total,
        recordsFiltered: total
    };

    return Response(res, "Find All", response, 200, "[REGISTER][FIND-ALL][SUCCESSFULLY]");
};

function getTotal(search) {
    return new Promise(async function (resolve, reject) {
        try {
            await UserBpjs.find({
                $or: [
                    {
                        username: new RegExp(search, 'i')
                    }
                ]
            })
            .count()
            .then(_data => {
                resolve(_data);
            })
            .catch(err => {
                if (err.kind === 'ObjectId') {
                    resolve(null);
                }
            });
        } catch (err) {
            if (err) resolve("ERROR");
        }
    });
}

function getData(search, start, limit, key, value) {
    return new Promise(async function (resolve, reject) {
        try {
            await UserBpjs.find({
                $or: [
                    {
                        username: new RegExp(search, 'i')
                    }
                ]
            })
            .sort({
                [key]: value
            })
            .limit(limit).skip(start)
            .then(async _data => {
                resolve(_data);
            })
            .catch(err => {
                if (err.kind === 'ObjectId') {
                    resolve(null);
                }
            });
        } catch (err) {
            if (err) resolve("ERROR");
        }
    });
}

exports.registerFindOne = (req, res) => {
    logging.info(`[HTTP][REQUEST][HEADER] ${JSON.stringify(req.headers)}`);
    logging.info(`[HTTP][REQUEST][BODY] ${JSON.stringify(req.body)}`);
    logging.info(`[HTTP][REQUEST][PARAMS] ${JSON.stringify(req.params)}`);

    UserBpjs.findById(req.params.Id)
    .then(async _data => {
        if (!_data) {
            return Response(res, "Data Tidak Ditemukan", null, 404, "[REGISTER][FIND-ONE][NOT-FOUND]");
        }

        return Response(res, "Find One", _data, 200, "[REGISTER][FIND-ONE][SUCCESSFULLY]");
    })
    .catch(err => {
        if (err.kind === 'ObjectId') {
            return Response(res, "Data Tidak Ditemukan", null, 404, "[REGISTER][FIND-ONE][NOT-FOUND]");
        }

        return Response(res, "Internal Server Error.", null, 500, "[REGISTER][FIND-ONE][FAILED]");
    });
};

exports.deleteRegister = (req, res) => {
    logging.info(`[HTTP][REQUEST][HEADER] ${JSON.stringify(req.headers)}`);
    logging.info(`[HTTP][REQUEST][BODY] ${JSON.stringify(req.body)}`);
    logging.info(`[HTTP][REQUEST][PARAMS] ${JSON.stringify(req.params)}`);

    UserBpjs.findByIdAndRemove(req.params.Id)
    .then(_data => {
        if (!_data) {
            return Response(res, "Data Tidak Ditemukan", null, 404, "[REGISTER][DELETE][NOT-FOUND]");
        }
        return Response(res, "Delete", _data, 200, "[REGISTER][DELETE][SUCCESSFULLY]");

    })
    .catch(err => {
        if (err.kind === 'ObjectId') {
            return Response(res, "Data Tidak Ditemukan", null, 404, "[REGISTER][DEELTE][NOT-FOUND]");
        }

        return Response(res, "Internal Server Error.", null, 500, "[REGISTER][DEELTE][FAILED]");
    });
};

exports.login = async (req, res) => {
    logging.info(`[HTTP][REQUEST][HEADER] ${JSON.stringify(req.headers)}`);
    logging.info(`[HTTP][REQUEST][BODY] ${JSON.stringify(req.body)}`);
    logging.info(`[HTTP][REQUEST][PARAMS] ${JSON.stringify(req.params)}`);

    validateData = ajv.compile(JSON.parse(validateLogin));

    let {
        username,
        password
    } = req.body;

    let dataLogin  = {
        username    : req.headers['x-username'],
        password    : req.headers['x-password'],
        last_login  : moment().format("YYYY-MM-DD HH:mm:ss"),
        updatedAt   : moment().format("YYYY-MM-DD HH:mm:ss"),
    };

    dataValidate(dataLogin)
    .then(async function () {
        let dataUserBpjs = await getUserBpjs(dataLogin.username);
        if (dataUserBpjs === "ERROR") {
            logging.debug(`[BRIDGING_ANTRIAN_RS] Login Failed => ${JSON.stringify(dataUserBpjs)}`);
            return Response(res, "Login Gagal, Terjadi beberapa kesalahan, mohon dicoba beberapa saat lagi.", null, 201, "[LOGIN][ERROR][GET-USER-BPJS]");
        } else if(dataUserBpjs === null){
            return Response(res, "Username atau Password Tidak Sesuai", null, 201, "[LOGIN][NOT-FOUND][GET-USER-BPJS]");
        }

        let checkPassword = passwordHash.verify(dataLogin.password, dataUserBpjs.password);
        if (!checkPassword) {
            return Response(res, "Username atau Password Tidak Sesuai", null, 201, "[LOGIN][FAILED]");
        }

        let token = await createToken(dataUserBpjs);
        logging.debug(`[BRIDGING_ANTRIAN_RS] Token => ${JSON.stringify(token)}`);

        if (token == "ERROR") {
            return Response(res, "Token Error", null, 500, "[LOGIN][ERROR][GET-TOKEN]");
        }

        let data = {
            token : token
        };

        return Response(res, "Ok", data, 200, "[LOGIN][SUCCESSFULLY]");

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

        return Response(res, "Validation Form Error", data, 422, "[LOGIN][VALIDATION][FORM][ERROR]");
    });
};

function getUserBpjs(_username) {
    return new Promise(async function (resolve, reject) {
        await UserBpjs.findOne({
            username : _username
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve("ERROR");
        })
    });
}

async function createToken(_data){
    let config = iniParser.get();
    let optionsJwt = {
        algorithm: 'HS256',
        expiresIn: config.jwt.expired
    };

    let dataUser = {
        _id         : _data._id,
        username    : _data.username,
    };

    try {
        var token = await jsowebtoken.sign(dataUser, config.jwt.secretKey, optionsJwt);
    } catch (e) {
        return "ERROR";
    } finally {
        return token;
    }
}