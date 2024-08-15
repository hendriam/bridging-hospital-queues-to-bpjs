module.exports = (app) => {
    const authtentication = require('../controllers/AuthenticationController.js');
    const antrian = require('../controllers/AntrianPoliklinikController.js');
    const operasi = require('../controllers/AntrianOperasiController.js');
    const refrensi = require('../controllers/ReferensiController.js');
    const loket = require('../controllers/LoketController');
    const farmasi = require('../controllers/FarmasiController');
    const poli = require('../controllers/PoliController');
    const antreanTemp = require('../controllers/AntreanTempController');
    const socketController = require('../controllers/SocketController');

    const PREFIX_URL = "/api"

    app.post(PREFIX_URL + '/register/findAll', authtentication.registerFindAll);

    app.get(PREFIX_URL + '/register/findOne/:Id', authtentication.registerFindOne);

    app.post(PREFIX_URL + '/register/create', authtentication.createRegister);
    
    app.put(PREFIX_URL + '/register/update/:Id', authtentication.updateRegister);

    app.delete(PREFIX_URL + '/register/delete/:Id', authtentication.deleteRegister);

    app.get(PREFIX_URL + '/login', authtentication.login);

    app.get(PREFIX_URL, antrian.home);

    app.post(PREFIX_URL + '/antrean/ambilantrean', antrian.getAntrian);

    app.post(PREFIX_URL + '/antrean/ambilantreanumum', antrian.getAntrianUmum);

    app.post(PREFIX_URL + '/antrean/ambilantreanonsite', antrian.getAntrianOnSite);

    app.post(PREFIX_URL + '/antrean/ambilantreanonsitepasienlama', antrian.getAntrianOnSitePasienLama);

    app.post(PREFIX_URL + '/antrean/ambilantreanumumonsite', antrian.getAntrianUmumOnSite);
    app.post(PREFIX_URL + '/antrean/ambilantreanumumonsitepasienlama', antrian.getAntrianUmumOnSitePasienLama);
    

    app.post(PREFIX_URL + '/antrean/pasienbaru', antrian.newPatient);

    app.post(PREFIX_URL + '/antrean/ambilantreanpasienbaru', antrian.newPatientAndGetAntrean);
    app.post(PREFIX_URL + '/antrean/ambilantreanpasienbarunonbpjs', antrian.newPatientNonBpjsAndGetAntrean);

    app.post(PREFIX_URL + '/antrean/pasienbarunonpjs', antrian.newPatientNonBpjs);

    app.post(PREFIX_URL + '/antrean/status', antrian.statusAntrian);

    app.post(PREFIX_URL + '/antrean/sisapeserta', antrian.sisaAntrian);

    app.post(PREFIX_URL + '/antrean/batal', antrian.batalAntrian);

    app.post(PREFIX_URL + '/antrean/batalonsite', antrian.batalAntrianOnSite);

    app.post(PREFIX_URL + '/antrean/checkin', antrian.checkinAntrian);

    app.post(PREFIX_URL + '/antrean/checkinonsite', antrian.checkinAntrianOnsite);

    app.post(PREFIX_URL + '/operasi/kodebooking', operasi.getListOperasiKodeBooking);

    app.post(PREFIX_URL + '/operasi/jadwal', operasi.getListJadwalOperasi);

    // referensi bpjs
    app.get(PREFIX_URL + '/antrean/poli', refrensi.getPoli);
    app.get(PREFIX_URL + '/antrean/dokter', refrensi.getDokter);
    app.get(PREFIX_URL + '/antrean/jadwal-dokter/kodepoli/:kodepoli/tanggal/:tanggal', refrensi.getJadwalDokter);
    app.post(PREFIX_URL + '/antrean/getlisttask', refrensi.getListTaskID);
    app.post(PREFIX_URL + '/antrean/updatewaktu', refrensi.updateWaktu);
    app.post(PREFIX_URL + '/antrean/updatejadwaldokter', refrensi.updateJadwalDokter);
    app.get(PREFIX_URL + '/antrean/rujukan/:nokartu', refrensi.findRujukanByNoKartu);
    app.get(PREFIX_URL + '/antrean/rujukan/rs/:nokartu', refrensi.findRujukanRsByNoKartu);

    app.get(PREFIX_URL + '/dashboard/waktutunggu/tanggal/:tanggal/waktu/:waktu', refrensi.DashboardPerTanggal);
    app.get(PREFIX_URL + '/dashboard/waktutunggu/bulan/:bulan/tahun/:tahun/waktu/:waktu', refrensi.DashboardPerBulan);
    
    app.get(PREFIX_URL + '/loket/list', loket.getLoket);
    app.get(PREFIX_URL + '/loket/getone/:Id', loket.findOneLoket);
    app.post(PREFIX_URL + '/loket/update', loket.updateLoket);
    app.post(PREFIX_URL + '/loket/panggilantrean', loket.callAntrean);
    app.get(PREFIX_URL + '/loket/totalantrean', loket.totalAntrean);
    app.get(PREFIX_URL + '/loket/sisaantrean', loket.sisaAntrean);
    app.get(PREFIX_URL + '/loket/getantreandipanggildilayani/loketid/:loketid', loket.getAntreanDipanggilDilayaniByLoket);
    app.post(PREFIX_URL + '/loket/updatewaktu', loket.updateWaktu);
    app.get(PREFIX_URL + '/loket/getantreandipanggildilayani', loket.getAntreanDipanggilDilayani);

    app.get(PREFIX_URL + '/poli/list', poli.getPoli);
    app.get(PREFIX_URL + '/poli/getone/:Id', poli.getOnePoli);
    app.get(PREFIX_URL + '/poli/listantreanpoli/:poliid', poli.getListAntreanByPoliId);
    app.post(PREFIX_URL + '/poli/panggilantrean', poli.callAntrean);
    app.get(PREFIX_URL + '/poli/batalPemanggilan/:id/:lorong', poli.batalPemanggilan);
    app.get(PREFIX_URL + '/poli/selesaiPemanggilan/:id/:lorong', poli.selesaiPemanggilan);
    app.get(PREFIX_URL + '/poli/totalantrean/poliid/:poliid', poli.totalAntrean);
    app.get(PREFIX_URL + '/poli/sisaantrean/poliid/:poliid/dokter/:dokter', poli.sisaAntrean);
    app.get(PREFIX_URL + '/poli/getantreandipanggildilayani/poliid/:poliid/dokter/:dokter', poli.getAntreanDipanggilDilayaniByPoli);
    app.post(PREFIX_URL + '/poli/updatewaktu', poli.updateWaktu);
    app.get(PREFIX_URL + '/poli/getantreandipanggildilayani/all', poli.getAntreanDipanggilDilayaniAll);
    app.get(PREFIX_URL + '/poli/getantreandipanggildilayani/display', poli.getAntreanDipanggilDilayaniDisplayTrue);
    app.get(PREFIX_URL + '/poli/getantreandipanggildilayani/display/:hallway', poli.getAntreanDipanggilDilayaniDisplayTrueHallway);
    app.get(PREFIX_URL + '/poli/eksperimen', poli.eksperimen);

    app.get(PREFIX_URL + '/farmasi/list', farmasi.getFarmasi);
    app.get(PREFIX_URL + '/farmasi/getone/:Id', farmasi.findOneFarmasi);
    // app.post(PREFIX_URL + '/farmasi/update', farmasi.updateFarmasi);
    app.post(PREFIX_URL + '/farmasi/panggilantrean', farmasi.callAntrean);
    app.get(PREFIX_URL + '/farmasi/totalantrean', farmasi.totalAntrean);
    app.get(PREFIX_URL + '/farmasi/sisaantrean', farmasi.sisaAntrean);
    app.get(PREFIX_URL + '/farmasi/getantreandipanggildilayani/farmasiid/:farmasiid', farmasi.getAntreanDipanggilDilayaniByFarmasi);
    app.post(PREFIX_URL + '/farmasi/updatewaktu', farmasi.updateWaktu);
    app.get(PREFIX_URL + '/farmasi/getantreandipanggildilayani', farmasi.getAntreanDipanggilDilayani);

    app.get(PREFIX_URL + '/antreanTemp/antreanTempBpjs', antreanTemp.getAntrianTempBpjs);
    app.get(PREFIX_URL + '/antreanTemp/antreanTempMjkn', antreanTemp.getAntrianTempMjkn);
    app.get(PREFIX_URL + '/antreanTemp/antreanTempUmum', antreanTemp.getAntrianTempUmum);
    app.post(PREFIX_URL + '/antreanTemp/antreanTempFarmasi', antreanTemp.getAntrianTempFarmasi);
    app.get(PREFIX_URL + '/antreanTemp/getantreandipanggildilayani/loketid/:loketid/jenis/:jenis', antreanTemp.getAntreanDipanggilDilayaniByLoket);
    app.get(PREFIX_URL + '/antreanTemp/sisaantrean/jenis/:jenis', antreanTemp.sisaAntrean);
    app.post(PREFIX_URL + '/antreanTemp/panggilantrean/jenis/:jenis', antreanTemp.callAntrean);
    app.put(PREFIX_URL + '/antreanTemp/updatestatus/:id', antreanTemp.updateStatus);
    app.get(PREFIX_URL + '/antreanTemp/selesaiPemanggilan/:id', antreanTemp.selesaiPemanggilan);
    app.get(PREFIX_URL + '/antreanTemp/batalPemanggilan/:id', antreanTemp.batalPemanggilan);
    app.post(PREFIX_URL + '/antreanTemp/updatestatusmjkn', antreanTemp.updateStatusMjkn);
    app.get(PREFIX_URL + '/antreanTemp/getantreandipanggildilayani/jenis/:jenis', antreanTemp.getAllAntreanDipanggilDilayani);
    app.get(PREFIX_URL + '/antreanTemp/getantreandipanggildilayani/display/:jenis', antreanTemp.getAllAntreanDipanggilDilayaniDisplay);
    app.get(PREFIX_URL + '/antreanTemp/getantreandipanggildilayani/farmasiid/:farmasiid', antreanTemp.getAntreanDipanggilDilayaniByFarmasi);
    app.get(PREFIX_URL + '/antreanTemp/getmsantriandipanggil/:id', antreanTemp.getMsAntrianDiPanggil);
    app.delete(PREFIX_URL + '/antreanTemp/updatestatusAntreanTemp/:id', antreanTemp.updatestatusAntreanTemp);

    app.post(PREFIX_URL + '/socket/sendToAdmisi', socketController.sendToAdmisi);
    
    // app.post(PREFIX_URL + '/umum/nomorantrean', antrian.getAntrianUmum);

    // app.post(PREFIX_URL + '/rekapantrean', antrian.getRekapAntrian);
    
    // app.get(PREFIX_URL + '/antrean/status/:kodePoli/:tanggalPeriksa', antrian.statusAntrian);
    
    // app.get(PREFIX_URL + '/antrean/sisapeserta/:nomorKartuJkn/:kodePoli/:tanggalPeriksa', antrian.sisaAntrian);
    
    // app.put(PREFIX_URL + '/antrean/batal', antrian.batalAntrian);
    
    // app.post(PREFIX_URL + '/antrean/validasi', antrian.validasiAntrian);

    // app.post(PREFIX_URL + '/list/operasi/jadwal', operasi.getListJadwalOperasi);

    // app.post(PREFIX_URL + '/list/operasi/kode-booking', operasi.getListOperasiKodeBooking);
};