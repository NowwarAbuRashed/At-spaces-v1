import { apiRequest } from '@/api/client'
import type { UploadImageApiResponse } from '@/types/api'

export async function uploadImageRequest(options: {
  accessToken: string
  file: File
}) {
  const formData = new FormData()
  formData.append('file', options.file)

  return apiRequest<UploadImageApiResponse>('/uploads/image', {
    method: 'POST',
    accessToken: options.accessToken,
    body: formData,
  })
}
