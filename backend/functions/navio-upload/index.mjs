import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { randomUUID } from "crypto"

const s3 = new S3Client({ region: process.env.S3_REGION })
const BUCKET = process.env.S3_BUCKET

const CORS = {
  "Access-Control-Allow-Origin":  "http://localhost:5173",
  "Access-Control-Allow-Headers": "content-type,authorization",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
}

const res = (code, body) => ({
  statusCode: code,
  headers: { "Content-Type": "application/json", ...CORS },
  body: JSON.stringify(body),
})

export const handler = async (event) => {
  const { filename, contentType } = JSON.parse(event.body || "{}")

  if (!filename || !contentType) {
    return res(400, { message: "filename and contentType are required" })
  }

  if (!contentType.startsWith("image/")) {
    return res(400, { message: "Only image uploads are allowed" })
  }

  const ext = filename.split(".").pop().toLowerCase()
  const key = `profile-images/${randomUUID()}.${ext}`

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
    })

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 })
    const fileUrl = `https://${BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`

    return res(200, { uploadUrl, fileUrl })
  } catch (err) {
    console.error(err)
    return res(500, { message: "Failed to generate upload URL" })
  }
}
