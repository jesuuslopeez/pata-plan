const reportService = require('../services/report.service');
const { generateReport, buildFilename } = require('../services/pdfGenerator.service');

const getAnimalReport = async (req, res, next) => {
  try {
    const animalId = parseInt(req.params.id, 10);
    const data = await reportService.gatherReportData(req.user.id, animalId);

    const filename = buildFilename(data.animal.name);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    const doc = generateReport(data);
    doc.on('error', next);
    doc.pipe(res);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAnimalReport };
