import multer from "multer";
import { cloudinary } from "../config/cloudinary.config";
import { ApiError } from "../utils/ApiError";
import type { Request, Response, NextFunction } from "express";

// File filter to accept only images
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new ApiError(400, "Only image files are allowed!"));
  }
};

// Use memory storage — avoids multer-storage-cloudinary signed/unsigned issues
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Upload a single buffer to Cloudinary via base64 data URI (compatible with Bun)
async function uploadBufferToCloudinary(
  buffer: Buffer,
  mimetype: string,
  folder: string,
): Promise<{ url: string; publicId: string }> {
  const base64 = buffer.toString("base64");
  const dataUri = `data:${mimetype};base64,${base64}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [
      { width: 1200, height: 1200, crop: "limit" },
      { quality: "auto" },
    ],
  });

  return { url: result.secure_url, publicId: result.public_id };
}

// Single image upload (field name: "image")
export const uploadSingle = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  upload.single("image")(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next();
    try {
      const { url, publicId } = await uploadBufferToCloudinary(
        req.file.buffer,
        req.file.mimetype,
        "noticeboard/posts",
      );
      req.file.path = url;
      req.file.filename = publicId;
      next();
    } catch (uploadErr) {
      next(uploadErr);
    }
  });
};

// Multiple images upload (field name: "images", max 5)
export const uploadMultiple = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  upload.array("images", 5)(req, res, async (err) => {
    if (err) return next(err);
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0)
      return next();
    try {
      await Promise.all(
        (req.files as Express.Multer.File[]).map(async (file) => {
          const { url, publicId } = await uploadBufferToCloudinary(
            file.buffer,
            file.mimetype,
            "noticeboard/posts",
          );
          file.path = url;
          file.filename = publicId;
        }),
      );
      next();
    } catch (uploadErr) {
      next(uploadErr);
    }
  });
};

// Registration images (fields: "profileImage", "coverImage")
export const uploadRegistrationImages = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ])(req, res, async (err) => {
    if (err) return next(err);
    if (!req.files || Array.isArray(req.files)) return next();
    try {
      const fields = req.files as {
        [fieldname: string]: Express.Multer.File[];
      };
      await Promise.all(
        Object.values(fields).flatMap((fileArr) =>
          fileArr.map(async (file) => {
            const { url, publicId } = await uploadBufferToCloudinary(
              file.buffer,
              file.mimetype,
              "noticeboard/profiles",
            );
            file.path = url;
            file.filename = publicId;
          }),
        ),
      );
      next();
    } catch (uploadErr) {
      next(uploadErr);
    }
  });
};

// Error handler for multer
export const handleMulterError = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: "File size is too large. Maximum size is 10MB.",
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        error: "Too many files. Maximum is 5 images.",
      });
    }
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }
  next(err);
};

export { upload };
