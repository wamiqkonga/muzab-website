const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file buffer to Cloudinary and return the secure URL.
 * @param {Buffer} buffer
 * @param {object} [options]
 * @returns {Promise<string>} secure_url
 */
function uploadImage(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadOptions = { folder: 'muzab-products', resource_type: 'image', ...options };
    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) return reject(error);
      resolve(result.secure_url);
    });
    stream.end(buffer);
  });
}

module.exports = { uploadImage };
