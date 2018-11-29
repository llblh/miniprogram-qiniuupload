Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 上传组件配置
    uploadInfo: {
      uploadNumber: 9, // 可以上传图片的数量限制,默认是九张
      region: 'ECN', // ECN, SCN, NCN, NA，您的七牛存储区域
      token: '', // 七牛上传token凭证
      tokenUrl: '',
      tokenFunc: res => ({token: res.data.uptoken}),
      domain: 'http://xxx.xxx.xxx', // 您配置的七牛CDN域名
      fileName: false,
      imgSecCheck: false,
    },
    list: []
  },
  /**
   * 上传成功后的回调, 返回全新的图片数组
   */
  onUpImgSuccess(event) {
    console.log(`上传后获得的图片数组：${event.detail}`)
  },

  /**
   * 删除图片的回调，返回全新图片数组
   */
  onDeleteImgSuccess(event) {
    console.log(`删除后剩余的照片数组：${event.detail}`)
  },

  /**
   * 上传图片出错的回调
   */
  onUpImgError(event) {
    console.error('错误：', event.detail)
  },

  /**
   * 清除图片
   */
  onClearUpload() {
    this.selectComponent('#upload').clearImageArray()
  }
})
