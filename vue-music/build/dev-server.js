require('./check-versions')()

var config = require('../config')
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = JSON.parse(config.dev.env.NODE_ENV)
}

var opn = require('opn')
var path = require('path')
var express = require('express')
var webpack = require('webpack')
var proxyMiddleware = require('http-proxy-middleware')
var webpackConfig = require('./webpack.dev.conf')

var axios = require('axios')

// default port where dev server listens for incoming traffic
var port = process.env.PORT || config.dev.port
// automatically open browser, if not set will be false
var autoOpenBrowser = !!config.dev.autoOpenBrowser
// Define HTTP proxies to your custom API backend
// https://github.com/chimurai/http-proxy-middleware
var proxyTable = config.dev.proxyTable

var app = express()

//设置代理请求
var apiRoutes = express.Router()

//热门歌单推荐列表
apiRoutes.get('/getDiscList',function(req,res){ //这里代理给'/getDiscList'请求，解决jsonp跨域不能获取到数据

  var url = 'https://c.y.qq.com/splcloud/fcgi-bin/fcg_get_diss_by_tag.fcg'

  //qq音乐代理请求
  axios.get(url,{
    headers:{ //设置请求头，jsonp跨域时请求头里面有referer和host检测，这里代理请求伪装成qq音乐请求头保持一致
      referer: 'https://c.y.qq.com/',
      host: 'c.y.qq.com'
    },
    params: req.query  //参数
  }).then((response) => { //response是axios请求成功返回的数据
    res.json(response.data) //把得到的数据返回给前端，res是apiRoutes请求的响应
  }).catch((e) => {
    console.log(e)
  })
})


//热门歌单推荐列表歌单列表
apiRoutes.get('/getSongList',function(req,res){ //这里代理给'/getDiscList'请求，解决jsonp跨域不能获取到数据

  var url = 'https://c.y.qq.com/qzone/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg'

  axios.get(url,{
    headers:{
      referer: 'https://y.qq.com/n/yqq/playlist/1780353465.html',
      host: 'c.y.qq.com'
    },
    params: req.query  //参数
  }).then((response) => { //response是axios请求成功返回的数据
    res.json(response.data) //把得到的数据返回给前端，res是apiRoutes请求的响应
  }).catch((e) => {
    console.log(e)
  })

});


//歌词
apiRoutes.get('/lyric',function(req,res){ //这里代理给'/lyric'请求，解决jsonp跨域不能获取到数据,获取歌曲歌词

  var url = 'https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg'

  //qq音乐代理请求
  axios.get(url,{
    headers:{ //设置请求头，jsonp跨域时请求头里面有referer和host检测，这里代理请求伪装成qq音乐请求头保持一致
      referer: 'https://c.y.qq.com/',
      host: 'c.y.qq.com'
    },
    params: req.query  //参数
  }).then((response) => { //response是axios请求成功返回的数据
    //qq音乐返回的是一个callBack回调函数的字符串，格式为："MusicJsonCallback({}),这里需要处理,我们只需要{}对象
    let ret = response.data;
    if(typeof ret === 'string'){
      let reg = /^\w+\(({[^()]+})\)$/; //匹配MusicJsonCallback({})里面的{}
      let matches = ret.match(reg); //返回的是一个数组['MusicJsonCallback(','{}',')']

      if(matches){
        ret = JSON.parse(matches[1]);
      }
    }
    res.json(ret) //把得到的数据返回给前端，res是apiRoutes请求的响应
  }).catch((e) => {
    console.log(e)
  })
});

app.use('/api',apiRoutes);


var compiler = webpack(webpackConfig)

var devMiddleware = require('webpack-dev-middleware')(compiler, {
  publicPath: webpackConfig.output.publicPath,
  quiet: true
})

var hotMiddleware = require('webpack-hot-middleware')(compiler, {
  log: () => {},
  heartbeat: 2000
})
// force page reload when html-webpack-plugin template changes
compiler.plugin('compilation', function (compilation) {
  compilation.plugin('html-webpack-plugin-after-emit', function (data, cb) {
    hotMiddleware.publish({ action: 'reload' })
    cb()
  })
})

// proxy api requests
Object.keys(proxyTable).forEach(function (context) {
  var options = proxyTable[context]
  if (typeof options === 'string') {
    options = { target: options }
  }
  app.use(proxyMiddleware(options.filter || context, options))
})

// handle fallback for HTML5 history API
app.use(require('connect-history-api-fallback')())

// serve webpack bundle output
app.use(devMiddleware)

// enable hot-reload and state-preserving
// compilation error display
app.use(hotMiddleware)

// serve pure static assets
var staticPath = path.posix.join(config.dev.assetsPublicPath, config.dev.assetsSubDirectory)
app.use(staticPath, express.static('./static'))

var uri = 'http://localhost:' + port

var _resolve
var readyPromise = new Promise(resolve => {
  _resolve = resolve
})

console.log('> Starting dev server...')
devMiddleware.waitUntilValid(() => {
  console.log('> Listening at ' + uri + '\n')
  // when env is testing, don't need open it
  if (autoOpenBrowser && process.env.NODE_ENV !== 'testing') {
    opn(uri)
  }
  _resolve()
})

var server = app.listen(port)

module.exports = {
  ready: readyPromise,
  close: () => {
    server.close()
  }
}
