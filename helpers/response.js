const logging = require('../libs/logging');

const sendResponds = (res, message = null, response = null, code = 200, loggin = "[RESULT]") => {
    let dataResponse = null;
    if (response == null) {
        dataResponse = {
            metadata : {
                code : code,
                message : message,
            }
        };
    } else {
        dataResponse = {
            metadata : {
                code : code,
                message : message,
            },
            response,
        };
    }

    logging.info(`${loggin} >>> ${JSON.stringify(dataResponse)}`);
    return res.status(code).json(dataResponse);
};

module.exports = sendResponds;
