const iniParser     = require('../libs/iniParser');
const logging       = require('../libs/logging');
const jsowebtoken   = require('jsonwebtoken');
const Response      = require('../helpers/response');
var config          = iniParser.get();

exports.Authentication = async (req, res) => {
    return new Promise(async function (resolve, reject) {
        let config = iniParser.get();

        if (!req.headers['x-token']) {
            return Response(res, "Token is not valid.", null, 201, "[VALIDATION][JWT] Token is not valid");
        }

        try {
            await jsowebtoken.verify(req.headers['x-token'], config.jwt.secretKey, (err, decode) => {
                if (err) {
                    if (err.name == 'TokenExpiredError'){
                        return Response(res, "Token Expired.", null, 201, "[VALIDATION][JWT] Token Expired");
                    }

                    return Response(res, "Unauthorized.", null, 201, "[VALIDATION][JWT] Unauthorized");
                }

                if (decode.username != req.headers['x-username']) {
                    return Response(res, "Username is not valid.", null, 201, "[VALIDATION][JWT][USERNAME] Username is not valid");
                }
                // if (!decode.hasOwnProperty("exp")) {
                //     if (decode.username != req.headers['x-username']) {
                //         return Response(res, "Username is not valid.", null, 201, "[VALIDATION][JWT][USERNAM] Username is not valid");
                //     }
                // }
                resolve(decode);
            });
        } catch (e) {
            return Response(res, "Internal server error.", null, 201, `[VALIDATION][JWT] ${e.message}`);
        }
    });
};