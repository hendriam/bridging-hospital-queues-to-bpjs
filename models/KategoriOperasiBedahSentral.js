const mongoose  = require('mongoose');
const iniParser = require('../libs/iniParser');
var config      = iniParser.get();

const kategoriOperasiBedahSentralSchema = mongoose.Schema({
    name            : String,
    description     : String,
    createdAt       : String,
    updatedAt       : String
}, {
    timestamps: false
});

module.exports = mongoose.model(config.mongodb.db_kategori_operasi_bedah_sentral, kategoriOperasiBedahSentralSchema, config.mongodb.db_kategori_operasi_bedah_sentral);