import { api } from './api'

export async function uploadProfileImage(file) {
  const { uploadUrl, fileUrl } = await api.post('/upload-url', {
    filename: file.name,
    contentType: file.type,
  })

  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })

  if (!res.ok) throw new Error('Upload failed. Please try again.')

  return fileUrl
}
