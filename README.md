# miniprogram-qiniuupload

小程序自定义组件 - 七牛上传组件

> 使用此组件需要依赖小程序基础库 2.3.2 以上版本，同时依赖开发者工具的 npm 构建。具体详情可查阅[官方 npm 文档](https://developers.weixin.qq.com/miniprogram/dev/devtools/npm.html)。
> 项目参考[@oubingbing](https://github.com/oubingbing/qiniu-upload)七牛传图插件并结合自身项目改为了自定义第三方组件

![miniprogram-qiniuupload](http://stor.llblh.com/miniprogram-qiniuupload.png)

## 使用方法

1. 安装 miniprogram-qiniuupload
```
npm install --save @carpenter/miniprogram-qiniuupload
```

2. 在需要使用 miniprogram-qiniuupload 的页面 page.json 中添加 miniprogram-qiniuupload 自定义组件配置
``` json
{
  "usingComponents": {
    "upload": "@carpenter/miniprogram-qiniuupload",
    // "imggrid": "@carpenter/miniprogram-qiniuupload"
  }
}
```
3. WXML 文件中引用 miniprogram-qiniuupload

``` xml
  <!-- 目前暂不支持自定义样式 -->
  <upload
    info="{{ uploadInfo }}"
    isUpload="{{ true }}"
    bindsuccess="onUpImgSuccess"
    binddelete="onDeleteImgSuccess"
    binderror="onUpImgError"
  />
  <!-- <imggrid list="{{ list }}" /> -->
```
#### miniprogram-qiniuupload 参数

| 属性名        | 类型          | 默认值        | 是否必须      | 说明                        |
|--------------|--------------|--------------|--------------|----------------------------|
| info         | Object       |              | 上传 ？是 ：否 | 七牛配置信息                 |
| isUpload     | Boolean      | false        | 上传 ？是 ：否 | 是否开启上传                 |
| list         | Array        | []           | 否           | 纯展示情况下需传入            |
| space        | Number       | 12           | 否           | 图片间距，单位rpx             |


#### info参数

| 属性名        | 类型          | 默认值        | 说明         |
|--------------|--------------|--------------|--------------|
| uploadNumber | int          | 9            | 一次性选择图片的最大限制 |
| region       | String       | ECN          | ECN, SCN, NCN, NA，您的七牛存储区域，或者区域地址 |
| token        | String       |              | 七牛上传认证token，需要您再后台服务器请求七牛服务器活动，并且维护token的有效期 |
| tokenURL     | String       |              | 获取token的api地址
| tokenFunc    | Function     |              | 处理wx.request返回数据 return token
| domain       | String       |              | 在七牛配置CDN域名，七牛测试域名有限制，所以需要您在七牛后台配置一个备案域名 |


``` js
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
      // tokenUrl: 'https://xxx.xxx.xxx',
      // tokenFunc: res => res.data.token,
      domain: 'https://xxx.xxx.xxx', // 您配置的七牛CDN域名
      shouldUseQiniuFileName: true,
    },
    list: [
      'https://xxx.xxx.xxx',
    ]
  },
  /**
   * 上传成功后的回调, 返回全新的图片数组
   */
  onUpImgSuccess(event) {
    console.log(`上传后获得的图片数组：${event.detail}`)
  },
  // 上传后获得的图片数组：['http(s)://xxx.xxx.xxx']

  /**
   * 删除图片的回调，返回全新图片数组
   */
  onDeleteImgSuccess(event) {
    console.log(`删除后剩余的照片数组：${event.detail}`)
  },
  // 删除后剩余的照片数组：['http(s)://xxx.xxx.xxx']
  /**
   * 上传图片出错的回调
   */
  onUpImgError(event) {
    console.error(`错误：${event.detail}`)
  }
})
```

### 绑定域名

微信小程序需要在微信管理后台绑定相应的域名，否则会被拦截，根据自己七牛存储区域绑定对应的域名，存储区域与域名的对应如下所示

```
ECN : https://up.qbox.me
NCN : https://up-z1.qbox.me
SCN : https://up-z2.qbox.me
NA  : https://up-na0.qbox.me
```
