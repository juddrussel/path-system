const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const r2Client = require("../config/r2");
const { v4: uuidv4 } = require("uuid"); // npm install uuid

const uploadToR2 = async (file) => {
  const key = `uploads/${uuidv4()}-${file.originalname}`;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  const url = `${process.env.R2_PUBLIC_URL}/${key}`;
  return { key, url };
};

const deleteFromR2 = async (key) => {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    })
  );
};

module.exports = { uploadToR2, deleteFromR2 };