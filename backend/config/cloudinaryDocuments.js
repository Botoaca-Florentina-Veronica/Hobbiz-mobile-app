const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinary");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "hobbiz-documents",
    resource_type: "auto", // Important: allow PDF and other non-image files
    // Accept images and documents (PDF, Word, etc.)
    allowed_formats: [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "webp",
      "pdf",
      "doc",
      "docx",
      "txt",
    ],
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size for documents
  },
});

module.exports = upload;
