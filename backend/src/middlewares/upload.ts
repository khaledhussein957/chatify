import multer from "multer";
import path from "path";
import fs from "fs";

// Define storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../uploads");
    // Ensure the upload directory exists
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const allowedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
  "video/webm",
]);

const allowedExtensions =
  /\.(pdf|docx|doc|png|jpg|jpeg|webp|gif|mp4|mov|avi|mkv|webm)$/i;

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const extValid = allowedExtensions.test(file.originalname);
  const mimeValid = allowedMimeTypes.has(file.mimetype);

  if (extValid && mimeValid) {
    return cb(null, true);
  }
  cb(new Error("Error: File type not supported!"));
};

// Initialize multer with defined storage and file filter
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // Limit file size to 50MB
});

export default upload;
