const assignmentService = require('../services/assignment.service');

const assignProtocol = async (req, res, next) => {
  try {
    const animalId = parseInt(req.params.id, 10);
    const assignment = await assignmentService.assignProtocol(req.user.id, animalId, req.body);
    res.status(201).json({ assignment });
  } catch (err) {
    next(err);
  }
};

const getAssignments = async (req, res, next) => {
  try {
    const animalId = parseInt(req.params.id, 10);
    const assignments = await assignmentService.getAssignments(req.user.id, animalId);
    res.json({ assignments });
  } catch (err) {
    next(err);
  }
};

const cancelAssignment = async (req, res, next) => {
  try {
    const assignmentId = parseInt(req.params.id, 10);
    const assignment = await assignmentService.cancelAssignment(req.user.id, assignmentId);
    res.json({ assignment });
  } catch (err) {
    next(err);
  }
};

module.exports = { assignProtocol, getAssignments, cancelAssignment };
