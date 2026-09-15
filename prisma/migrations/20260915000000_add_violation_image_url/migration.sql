-- The application stores an optional private Vercel Blob URL for a challan photo.
ALTER TABLE "challans"
ADD COLUMN IF NOT EXISTS "violation_image_url" TEXT;
