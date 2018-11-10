class QiniuUpload {
  constructor() {
    this.config = {
      region: '',
      imageURLPrefix: '',
      uploadToken: '',
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
            console.error('请设置上传区域 [ECN, SCN, NCN, NA]或者url')
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
      console.error('获取uploadTokenURL不能为空')
      return
    }
    wx.request({
      url: config.uploadTokenURL,
      success: (res) => {
        this.config.uploadToken = config.uploadTokenFunction(res.data)
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
   * @param {Object} options
   * @memberof qiniuUpload
   */
  doUpload(filePath, success, fail, options) {
    const {config} = this

    if (config.uploadToken === null && config.uploadToken.length > 0) {
      console.error('七牛上传凭证token为空')
      return
    }
    const url = this.uploadURLFromRegionCode(config.region)
    let fileName = filePath.split('//')[1]
    if (options && options.key) {
      fileName = options.key
    }
    const formData = {
      token: config.uploadToken
    }
    if (!config.qiniuShouldUseQiniuFileName) {
      formData.key = fileName
    }

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
