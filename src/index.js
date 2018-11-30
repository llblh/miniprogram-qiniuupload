import upload from './utils/upload'

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    info: {
      type: Object,
      value: {},
      observer: '_infoChange',
    },
    isUpload: {
      type: Boolean,
      value: false,
      observer: '_isUploadChange'
    },
    space: {
      type: Number,
      value: 12,
    },
    list: {
      type: Array,
      value: [],
      observer: '_listChange',
    },
  },
  /**
   * 组件的初始数据
   */
  data: {
    qiniuInfo: {},
    uploadBtn: false,
    imageArray: [],
    proportion: [],
    proportionClass: [
      'img-grid_single_wh',
      'img-grid_single_ww',
      'img-grid_single_hw',
      ''
    ],
    canvasWidth: 200,
    canvasHeight: 300,
    uploadError: [],
  },
  /**
   * 组件的方法列表
   */
  methods: {
    _infoChange(newVal) {
      this.setData({
        qiniuInfo: newVal,
      })
    },
    _isUploadChange(newVal) {
      this.setData({
        uploadBtn: newVal,
      })
    },
    _listChange(newVal) {
      const length = newVal.length
      const isDual = length === 2 || length === 4
      const isSingle = length === 1
      this.setData({
        isDual,
        isSingle,
        imageArray: newVal,
      })
    },
    // 图片加载完成
    imageLoad(e) {
      if (!this.data.isEdit && this.data.list) {
        const w = e.detail.width
        const h = e.detail.height
        let proportion = 3
        if (w > h) {
          proportion = 0
        } else if (w === h) {
          proportion = 1
        } else if (w < h) {
          proportion = 2
        }
        this.setData({
          proportion
        })
      }
    },
    /**
     * 检测配置信息
     */
    configQiniu() {
      const {qiniuInfo} = this.data
      const {
        region, regionUrl, token, tokenUrl, domain
      } = qiniuInfo

      if (region === '' && regionUrl === '') {
        console.error('七牛存储区域或上传地址不能为空')
        return false
      }

      if (token === '' && tokenUrl === '') {
        console.error('七牛授权token不能为空')
        return false
      }

      if (domain === '') {
        console.error('七牛域名不能为空')
        return false
      }
      return qiniuInfo
    },
    /**
     * 选择图片并且上传到七牛
     */
    selectImage() {
      const configs = this.configQiniu()
      const {imageArray} = this.data
      const limitNumber = configs.uploadNumber
      const imageLength = imageArray.length
      wx.chooseImage({
        count: (limitNumber - imageLength), // 默认9
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const {tempFilePaths} = res
          wx.showLoading({
            title: '上传中...',
          })
          this.uploadBatch(0, configs, tempFilePaths)
        }
      })
    },
    uploadBatch(index, configs, filePaths, editIndex = -1) {
      const position = filePaths.length - 1
      const item = filePaths[index]
      if (item) {
        upload(this, configs, item, res => {
          console.log('upload results：', res)
          if (res.error === undefined) {
            const imageArray = this.data.imageArray
            if (editIndex === -1) {
              imageArray.push(res.imageURL)
            } else {
              imageArray[editIndex] = res.imageURL
            }
            this.setData({
              imageArray
            })
            this.triggerEvent('success', imageArray)
          } else {
            // 上传失败
            this.data.uploadError.push(res)
            console.error('上传失败:', res)
          }
          if (position === index) {
            wx.hideLoading()
            if (this.data.uploadError.length) {
              this.triggerEvent('error', this.data.uploadError)
              this.data.uploadError = []
            }
            this.checkUploadBtnShow()
          } else {
            this.uploadBatch(index + 1, configs, filePaths)
          }
        }, (err) => {
          console.error('上传失败:', err)
          this.data.uploadError.push(err)
          if (position === index) {
            wx.hideLoading()
            if (this.data.uploadError.length) {
              this.triggerEvent('error', this.data.uploadError)
              this.data.uploadError = []
            }
            this.checkUploadBtnShow()
          } else {
            this.uploadBatch(index + 1, configs, filePaths)
          }
        })
      } else {
        wx.hideLoading()
      }
    },
    // 判断是否显示上传按钮
    checkUploadBtnShow() {
      const {imageArray, qiniuInfo} = this.data
      const imageLength = imageArray.length
      const uploadBtn = imageLength < qiniuInfo.uploadNumber
      this.setData({uploadBtn})
    },
    // 图片点击事件
    actionClick(e) {
      const {item, index} = e.currentTarget.dataset
      if (this.data.isUpload) {
        wx.showActionSheet({
          itemList: ['预览', '编辑', '删除'],
          success: res => {
            const tapIndex = res.tapIndex
            switch (tapIndex) {
              case 0:
                this.previewImage(item)
                break
              case 1:
                // 编辑
                this.editImg(index)
                break
              case 2:
                // 删除
                this.deleteImg(index)
                break
              default:
                break
            }
          }
        })
      } else {
        this.previewImage(item)
      }
    },
    // 预览图片
    previewImage(url) {
      wx.previewImage({
        current: url,
        urls: this.data.imageArray
      })
    },
    // 编辑图片
    editImg(index) {
      console.log('编辑图片', index)
      wx.chooseImage({
        count: 1, // 默认9
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const {tempFilePaths} = res
          const configs = this.configQiniu()
          this.uploadBatch(0, configs, tempFilePaths, index)
        }
      })
    },
    // 删除
    deleteImg(index) {
      const {imageArray, uploadBtn, qiniuInfo} = this.data
      const newArray = imageArray.filter((item, i) => index !== i)
      let btn = uploadBtn
      if (newArray.length < qiniuInfo.uploadNumber && this.properties.isUpload) {
        btn = true
      }
      this.setData({
        imageArray: newArray,
        uploadBtn: btn,
      })
      this.triggerEvent('delete', newArray)
    },
    // 清除
    clearImageArray() {
      this.setData({
        imageArray: [],
        uploadBtn: true,
        uploadError: [],
      })
    }
  },
})
