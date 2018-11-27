class QiniuUpload {
  constructor() {
    this.config = {
      region: '',
      imageURLPrefix: '',
      uploadToken: '',
      uploadKey: '',
      uploadTokenURL: '',
      uploadTokenFunction: null,
      fileName: false
    }
    /**
     * 获取上传url
     * @param {String} code
     * @returns
     * @memberof qiniuUpload
     */
    this.uploadURLFromRegionCode = (code) => {
      let uploadURL = null
      switch (code) {
        case 'ECN':
          uploadURL = 'https://up.qbox.me'
          break
        case 'NCN':
          uploadURL = 'https://up-z1.qbox.me'
          break
        case 'SCN':
          uploadURL = 'https://up-z2.qbox.me'
          break
        case 'NA':
          uploadURL = 'https://up-na0.qbox.me'
          break
        default:
          if (code) {
            uploadURL = code
          } else {
            console.error('请设置上传区域或者上传地址')
          }
          break
      }
      return uploadURL
    }
  }

  /**
   * 初始化
   * @param {Object} options
   */
  init(options) {
    this.config = {
      region: '',
      imageURLPrefix: '',
      uploadToken: '',
      uploadKey: '',
      uploadTokenURL: '',
      uploadTokenFunction: null,
      fileName: false
    }
    this.updateConfigWithOptions(options)
  }

  /**
   * 更新配置
   * @param {Object} options
   * @memberof qiniuUpload
   */
  updateConfigWithOptions(options) {
    if (options.region) {
      this.config.region = options.region
    }
    if (options.uptoken) {
      this.config.uploadToken = options.uptoken
    } else if (options.uptokenURL && options.uptokenFunc) {
      this.config.uploadTokenURL = options.uptokenURL
      this.config.uploadTokenFunction = options.uptokenFunc
    }
    if (options.uploadKey) {
      this.config.uploadKey = options.key
    }
    if (options.domain) {
      this.config.imageURLPrefix = options.domain
    }
    this.config.fileName = options.fileName
  }

  /**
   * 获取 token
   * @param {Function} callback
   */
  getQiniuToken(callback) {
    const {config} = this
    if (!config.uploadTokenURL) {
      console.error('tokenURL不能为空')
      return
    }
    wx.request({
      url: config.uploadTokenURL,
      success: (res) => {
        const {token, key, domain} = config.uploadTokenFunction(res.data)
        this.config.uploadToken = token
        this.config.uploadKey = key || ''
        this.config.imageURLPrefix = domain || ''
        if (callback) {
          callback()
        }
      }
    })
  }

  /**
   * 开始上传
   * @param {String} filePath
   * @param {Function} success
   * @param {Function} fail
   * @memberof qiniuUpload
   */
  doUpload(filePath, success, fail) {
    console.log(filePath)
    const {config} = this

    if (config.uploadToken === null && config.uploadToken.length > 0) {
      console.error('七牛上传凭证token为空')
      return
    }
    const url = this.uploadURLFromRegionCode(config.region)
    const filePathData = filePath.split('.')
    let fileName = filePathData[1] + filePathData[2]
    if (config && config.uploadKey) {
      fileName = config.uploadKey
    }
    const formData = {
      token: config.uploadToken
    }
    if (!config.fileName) {
      formData.key = fileName
    }
    console.info('uploadFile formData:', formData)
    wx.uploadFile({
      url,
      filePath,
      name: 'file',
      formData,
      success: (res) => {
        const dataString = res.data
        try {
          const dataObject = JSON.parse(dataString)
          const imageUrl = config.imageURLPrefix + '/' + dataObject.key
          dataObject.imageURL = imageUrl
          if (success) {
            success(dataObject)
          }
        } catch (e) {
          console.error('解析JSON失败，原始字符串是:' + dataString)
          if (fail) {
            fail(e)
          }
        }
      },
      fail: (error) => {
        console.error(error)
        if (fail) {
          fail(error)
        }
      }
    })
  }

  /**
   * 上传
   * @param {String} filePath
   * @param {Function} success
   * @param {Function} fail
   * @memberof qiniuUpload
   */
  upload(filePath, success, fail, options) {
    if (filePath === null) {
      console.error('上传文件路径为空')
      return
    }
    if (options) {
      this.updateConfigWithOptions(options)
    }

    const {config} = this
    if (config.uploadToken) {
      this.doUpload(filePath, success, fail, options)
    } else if (config.uploadTokenURL && config.uploadTokenFunction) {
      this.getQiniuToken(() => {
        this.doUpload(filePath, success, fail, options)
      })
    } else {
      console.error('缺少上传token')
    }
  }
}

export default new QiniuUpload()
