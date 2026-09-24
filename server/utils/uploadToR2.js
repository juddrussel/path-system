const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const r2Client = require("../config/r2");
const { v4: uuidv4 } = require("uuid"); // npm install uuid

const uploadToR2 = async (file) => {
  if (!file) {
    throw new Error("No file provided to uploadToR2");
  }

  if (!process.env.R2_BUCKET_NAME) {
    throw new Error("R2_BUCKET_NAME environment variable not set");
  }

  if (!process.env.R2_PUBLIC_URL) {
    throw new Error("R2_PUBLIC_URL environment variable not set");
  }

  const key = `uploads/${uuidv4()}-${file.originalname}`;

  try {
    console.log(`[R2] Uploading file: ${file.originalname} (${file.size} bytes)`);
    
    await r2Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    const url = `${process.env.R2_PUBLIC_URL}/${key}`;
    console.log(`[R2] Upload successful: ${url}`);
    return { key, url };
  } catch (err) {
    console.error(`[R2] Upload failed for ${file.originalname}:`, {
      message: err.message,
      code: err.Code,
      statusCode: err.$metadata?.httpStatusCode,
    });
    throw new Error(`Failed to upload ${file.originalname} to R2: ${err.message}`);
  }
};

const deleteFromR2 = async (key) => {
  if (!key) {
    throw new Error("No key provided to deleteFromR2");
  }

  if (!process.env.R2_BUCKET_NAME) {
    throw new Error("R2_BUCKET_NAME environment variable not set");
  }

  try {
    console.log(`[R2] Deleting object: ${key}`);
    
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
      })
    );

    console.log(`[R2] Delete successful: ${key}`);
  } catch (err) {
    console.error(`[R2] Delete failed for ${key}:`, {
      message: err.message,
      code: err.Code,
      statusCode: err.$metadata?.httpStatusCode,
    });
    throw new Error(`Failed to delete ${key} from R2: ${err.message}`);
  }
};

module.exports = { uploadToR2, deleteFromR2 };