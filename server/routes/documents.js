const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');
const User = require('../models/User');
const VerificationDocument = require('../models/VerificationDocument');
const { protect, allowRoles } = require('../middleware/auth');

const router = express.Router();
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'application/pdf': '.pdf' };

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => cb(null, crypto.randomBytes(16).toString('hex') + EXT[file.mimetype])
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    EXT[file.mimetype] ? cb(null, true) : cb(new Error('Only JPG, PNG or PDF files are allowed'))
});

const removeFile = (name) => fs.unlink(path.join(UPLOAD_DIR, name), () => {});

const publicDoc = (d) => ({
  id: d._id,
  documentType: d.documentType,
  status: d.status,
  rejectionReason: d.rejectionReason,
  createdAt: d.createdAt
});

// Works out the user's overall status from their documents
async function recomputeStatus(userId) {
  const docs = await VerificationDocument.find({ userId });
  let status = 'not_uploaded';
  if (docs.some((d) => d.status === 'rejected')) status = 'rejected';
  else if (docs.length === 2 && docs.every((d) => d.status === 'approved')) status = 'verified';
  else if (docs.length > 0) status = 'pending';
  await User.findByIdAndUpdate(userId, { verificationStatus: status });
  return status;
}

// Customer or host uploads a document
router.post('/', protect, allowRoles('customer', 'host'), (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      const message = err.code === 'LIMIT_FILE_SIZE' ? 'File must be 5 MB or smaller' : err.message;
      return res.status(400).json({ message });
    }
    try {
      if (!req.file) return res.status(400).json({ message: 'Please choose a file' });
      const { documentType } = req.body;
      if (!['national_id', 'driving_licence'].includes(documentType)) {
        removeFile(req.file.filename);
        return res.status(400).json({ message: 'Document type must be national_id or driving_licence' });
      }
      const existing = await VerificationDocument.findOne({ userId: req.user.id, documentType });
      if (existing) {
        if (existing.status === 'approved') {
          removeFile(req.file.filename);
          return res.status(409).json({ message: 'This document is already approved' });
        }
        removeFile(existing.fileName);
        await existing.deleteOne();
      }
      const doc = await VerificationDocument.create({
        userId: req.user.id,
        documentType,
        fileName: req.file.filename
      });
      await recomputeStatus(req.user.id);
      res.status(201).json(publicDoc(doc));
    } catch (e) {
      res.status(500).json({ message: 'Server error', error: e.message });
    }
  });
});

// User sees their own documents and overall status
router.get('/mine', protect, async (req, res) => {
  const [user, docs] = await Promise.all([
    User.findById(req.user.id).select('verificationStatus'),
    VerificationDocument.find({ userId: req.user.id })
  ]);
  res.json({ verificationStatus: user.verificationStatus, documents: docs.map(publicDoc) });
});

// Admin sees documents waiting for review
router.get('/pending', protect, allowRoles('admin'), async (req, res) => {
  const docs = await VerificationDocument.find({ status: 'pending' })
    .populate('userId', 'fullName email phone role')
    .sort({ createdAt: 1 });
  res.json(docs.map((d) => ({ ...publicDoc(d), user: d.userId })));
});

// Only the owner or an Admin can open a file
router.get('/:id/file', protect, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ message: 'Invalid document id' });
  const doc = await VerificationDocument.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Document not found' });
  if (req.user.role !== 'admin' && String(doc.userId) !== req.user.id)
    return res.status(403).json({ message: 'Not allowed' });
  res.set('Cache-Control', 'private, no-store');
  res.sendFile(path.join(UPLOAD_DIR, doc.fileName));
});

// Admin approves or rejects
router.patch('/:id/review', protect, allowRoles('admin'), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ message: 'Invalid document id' });
    const { action, reason } = req.body;
    if (!['approve', 'reject'].includes(action))
      return res.status(400).json({ message: 'Action must be approve or reject' });
    if (action === 'reject' && !(reason || '').trim())
      return res.status(400).json({ message: 'A reason is required when rejecting' });

    const doc = await VerificationDocument.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    if (doc.status !== 'pending')
      return res.status(409).json({ message: `Document is already ${doc.status}` });

    doc.status = action === 'approve' ? 'approved' : 'rejected';
    doc.rejectionReason = action === 'reject' ? reason.trim() : '';
    doc.reviewedBy = req.user.id;
    doc.reviewedAt = new Date();
    await doc.save();

    const userVerificationStatus = await recomputeStatus(doc.userId);
    res.json({ document: publicDoc(doc), userVerificationStatus });
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
});

module.exports = router;