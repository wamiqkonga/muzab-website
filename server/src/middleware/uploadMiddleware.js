const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) { cb(null, true); }
  else { cb(new Error('Only image files are allowed'), false); }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

const uploadSingle = upload.single('image');
const uploadMultiple = upload.array('images', 5);

module.exports = { uploadSingle, uploadMultiple };
