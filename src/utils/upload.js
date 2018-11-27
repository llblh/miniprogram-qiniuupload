import qiniuUploader from './qiniuUpload'

const initQiniu = (data) => {
  const options = {
    region: data.region || 'ECN',
    uptoken: data.token,
    uploadKey: data.fileKey,
    uptokenURL: data.tokenUrl || null,
    uptokenFunc: data.tokenFunc || null,
    domain: data.domain,
    fileName: data.fileName,
  }
  qiniuUploader.init(options)
}

const uploadImage = (
  configs, image, successcallback, failcallback
) => {
  initQiniu(configs)
  const filePath = image
  qiniuUploader.upload(filePath, successcallback, failcallback)
}

export default uploadImage
