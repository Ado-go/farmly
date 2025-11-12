import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { authenticateToken } from "../middleware/auth.ts";

const router = Router();

interface CloudinaryUploadedFile {
  path: string;
  filename: string;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const allowedMime = new Set(["image/jpeg", "image/png", "image/webp"]);

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    if (!allowedMime.has(file.mimetype)) {
      throw new Error("Unsupported file type");
    }
    return {
      folder: "farmly_uploads",
      resource_type: "image",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
    };
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

router.post(
  "/upload",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    try {
      const file = req.file as CloudinaryUploadedFile;
      if (!file?.path || !file?.filename) {
        return res.status(400).json({ message: "Upload failed" });
      }

      const url: string = file.path;
      const publicId: string = file.filename;

      const optimizedUrl = url.replace(
        "/image/upload/",
        "/image/upload/f_auto,q_auto/"
      );

      res.json({
        url,
        optimizedUrl,
        publicId,
        width: file.width,
        height: file.height,
        bytes: file.bytes,
        format: file.format,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Upload failed" });
    }
  }
);

router.delete("/images/:publicId", authenticateToken, async (req, res) => {
  try {
    const { publicId } = req.params;
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });
    res.json({ result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Delete failed" });
  }
});

export default router;
