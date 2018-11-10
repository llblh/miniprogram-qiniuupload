import qiniuUploader from './qiniuUpload'

const initQiniu = (data) => {
  const options = {
    region: data.region || 'ECN',
    uptoken: data.token,
    uptokenURL: data.tokenUrl || null,
    uptokenFunc: data.tokenFunc || null,
    domain: data.domain,
    fileName: false
  }
  qiniuUploader.init(options)
}

const uploadImage = (configs, image, successcallback = null, failcallback = null, options) => {
  initQiniu(configs)
  const filePath = image
  qiniuUploader.upload(filePath, (res) => successcallback(res), (err) => failcallback(err), options)
}

export default uploadImage
