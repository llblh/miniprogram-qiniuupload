class QiniuUpload {
  constructor() {
    this.config = {
      region: '',
      imageURLPrefix: '',
      uploadToken: '',
      uploadKey: '',
      uploadTokenURL: '',
      uploadTokenFunction: null,
      fileName: false,
      imgSecCheck: false,
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
      fileName: false,
      imgSecCheck: false,
    }
    this.error = {}
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
      this.config.uploadKey = options.uploadKey
    }
    if (options.domain) {
      this.config.imageURLPrefix = options.domain
    }
    this.config.imgSecCheck = options.imgSecCheck
    this.config.fileName = options.fileName
  }

  /**
   * 获取 token 后回调
   * @param {*} res
   */
  requestCallback(data) {
    const {config} = this
    const {token, key, domain} = config.uploadTokenFunction(data)
    console.log(token, key, domain)
    if (token) {
      this.config.uploadToken = token
    }
    if (key) {
      this.config.uploadKey = key
    }
    if (domain) {
      this.config.imageURLPrefix = domain
    }
  }

  /**
   * 获取 token
   * @param {String} filePath
   * @param {Function} callback
   */
  getQiniuToken(that, filePath, callback) {
    const {config} = this
    if (!config.uploadTokenURL) {
      console.error('tokenURL不能为空')
      return
    }
    if (!config.imgSecCheck) {
      wx.request({
        url: config.uploadTokenURL,
        success: (res) => {
          console.log(res)
          this.requestCallback(res.data)
          if (callback) {
            callback()
          }
        }
      })
    } else {
      this.compressImg(that, filePath, callback)
    }
  }

  /**
   * 鉴黄请求
   * @param {String} filePath
   */
  imgSecCheck(filePath, callback) {
    console.log('请求鉴黄接口')
    const {config} = this
    wx.uploadFile({
      url: config.uploadTokenURL,
      filePath,
      name: 'thumb',
      success: (res) => {
        const data = JSON.parse(res.data)
        if (data.err_code === 0) {
          this.requestCallback(data)
        } else {
          this.error = data
        }
        if (callback) {
          callback()
        }
      },
      fail: (error) => {
        console.error('鉴黄接口：', error)
      }
    })
  }

  /**
   * 压缩图片
   * @param {Object} that
   * @param {String} filePath
   * @param {Function} callback
   */
  compressImg(that, filePath, callback) {
    console.log('开始压缩图片')
    wx.getImageInfo({
      src: filePath,
      success: (res) => {
        console.log('获取压缩图片信息：', res)
        let canvasWidth = res.width
        let canvasHeight = res.height
        const ratio = Math.floor((res.height / res.width) * 100) / 100
        // h/w = 0.6
        if (canvasWidth > canvasHeight) {
          canvasHeight = 100
          canvasWidth = canvasHeight / ratio
        } else {
          canvasWidth = 100
          canvasHeight = canvasWidth * ratio
        }
        that.data.canvasWidth = canvasWidth
        that.data.canvasHeight = canvasHeight
        const ctx = wx.createCanvasContext('compressCanvas')
        ctx.drawImage(res.path, 0, 0, canvasWidth, canvasHeight)
        ctx.save()
        ctx.draw(true, () => {
          setTimeout(() => {
            wx.canvasToTempFilePath({
              x: 0,
              y: 0,
              width: canvasWidth,
              height: canvasHeight,
              destWidth: canvasWidth,
              destHeight: canvasHeight,
              canvasId: 'compressCanvas',
              success: (res) => {
                console.log('压缩成功')
                this.imgSecCheck(res.tempFilePath, callback)
              },
              fail: (error) => {
                console.error('canvasToTempFilePath 失败：', error)
              }
            })
          }, 200)
        })
      },
      fail: (error) => {
        console.error('压缩图片，获取图片信息失败：', error)
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
    console.log(config)
    if (!config.uploadToken) {
      console.error('七牛上传凭证token为空')
      fail(this.error)
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
   * @param {Object} 组件对象
   * @param {String} filePath
   * @param {Function} success
   * @param {Function} fail
   * @memberof qiniuUpload
   */
  upload(that, filePath, success, fail, options) {
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
      this.getQiniuToken(that, filePath, () => {
        this.doUpload(filePath, success, fail, options)
      })
    } else {
      console.error('缺少上传token')
    }
  }
}

export default new QiniuUpload()
