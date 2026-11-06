export async function uploadFilesToServer(filesMap){
  // filesMap: { profilePhoto?: File, documents?: File[] }
  const fd = new FormData()
  if(filesMap.profilePhoto) fd.append('profilePhoto', filesMap.profilePhoto, filesMap.profilePhoto.name)
  if(Array.isArray(filesMap.documents)) filesMap.documents.forEach((f)=>{ if(f) fd.append('documents', f, f.name) })

  // Try dedicated upload endpoint
  try{
    const resp = await fetch('/api/files/upload', { method: 'POST', body: fd })
    if(resp.ok){
      const json = await resp.json()
      // Expecting { profilePhotoUrl: string, documentUrls: [] } or { urls: [...] }
      return json
    }
    // if not found (404) or unsupported, return null to let caller fallback
    if(resp.status === 404) return null
    // For other errors, throw to surface
    const txt = await resp.text()
    throw new Error('Upload failed: ' + resp.status + ' ' + txt)
  }catch(e){
    // network or other error — return null to let caller fallback to multipart or other strategy
    console.warn('uploadFilesToServer failed, falling back', e.message)
    return null
  }
}

export default uploadFilesToServer
