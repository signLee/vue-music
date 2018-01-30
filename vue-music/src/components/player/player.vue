<template>
  <div class="player" v-show="playlist.length>0">
    <transition name="normal"
                @enter="enter"
                @after-enter="afterEnter"
                @leave="leave"
                @after-leave="afterLeave"
    >
      <div class="normal-player" v-show="fullScreen">
        <div class="background">
          <img width="100%" height="100%" :src='currentSong.image'>
        </div>
        <div class="top">
          <div class="back" @click="back">
            <i class="icon-back"></i>
          </div>
          <h1 class="title" v-html="currentSong.name"></h1>
          <h2 class="subtitle" v-html="currentSong.singer"></h2>
        </div>
        <div class="middle"
             @touchstart.prevent="middleTouchStart"
             @touchmove.prevent="middleTouchMove"
             @touchend.prevent="middleTouchEnd"
        >
          <div class="middle-l" ref="middleL">
            <div class="cd-wrapper" ref="cdWrapper">
              <div class="cd" :class="cdCla">
                <img class="image" :src='currentSong.image'>
              </div>
            </div>
            <div class="playing-lyric-wrapper">
              <div class="playing-lyric">{{playingLyric}}</div>
            </div>
          </div>
          <scroll class="middle-r" ref="lyricList" :data="currentLyric&&currentLyric.lines">
            <div class="lyric-wrapper">
              <div v-if="currentLyric">
                <p ref="lyricLine"
                   :class="{'current':currentLineNum===index}"
                   class="text" v-for="(line,index) in currentLyric.lines">{{line.txt}}</p>
              </div>
            </div>
          </scroll>
        </div>
        <div class="bottom">
          <div class="dot-wrapper">
            <span class="dot" :class="{'active':currentShow=='CD'}"></span>
            <span class="dot" :class="{'active':currentShow=='lyric'}"></span>
          </div>
          <div class="progress-wrapper">
            <span class="time time-l">{{format(currentTime)}}</span>
            <div class="progress-bar-wrapper">
              <progress-bar :percent="percent" :percentChange="onProgressChange"></progress-bar>
            </div>
            <span class="time time-r">{{format(currentSong.duration)}}</span>
          </div>
          <div class="operators">
            <div class="icon i-left" :class="disableCls">
              <i :class="iconMode" @click="changeMode"></i>
            </div>
            <div class="icon i-left" :class="disableCls">
              <i class="icon-prev" @click="prev"></i>
            </div>
            <div class="icon i-center">
              <i @click="togglePlaying" :class="playIcon"></i>
            </div>
            <div class="icon i-right" :class="disableCls">
              <i class="icon-next" @click="next"></i>
            </div>
            <div class="icon i-right">
              <i class="icon" @click="toggleFavorite(currentSong)" :class="getFavoriteIcon(currentSong)"></i>
            </div>
          </div>
        </div>
      </div>
    </transition>
    <transition name="mini">
      <div class="mini-player" v-show="!fullScreen" @click="open">
        <div class="icon">
          <img width="40" :class="cdCla" height="40" :src='currentSong.image'>
        </div>
        <div class="text">
          <h2 class="name" v-html="currentSong.name"></h2>
          <p class="desc" v-html="currentSong.singer"></p>
        </div>
        <div class="control">
          <progress-circle :radius="radius" :percent="percent">
            <i :class="miniIcon" class="icon-mini" @click.stop="togglePlaying"></i>
          </progress-circle>
        </div>
        <div class="control" @click.stop="showPlaylist">
          <i class="icon-playlist"></i>
        </div>
      </div>
    </transition>
    <play-list ref="playlist"></play-list>
    <audio @ended="end" @play="ready" @error="error" @timeupdate="updateTime" :src="currentSong.url" ref="audio"></audio>
  </div>
</template>

<script type="text/ecmascript-6">
  import {mapGetters, mapMutations, mapActions} from 'vuex'
  import animations from "create-keyframe-animation"
  import {prefixStyle} from 'common/js/dom'
  import progressBar from 'base/progress-bar/progress-bar'
  import progressCircle from 'base/progress-circle/progress-circle'
  import {playMode} from 'common/js/config'
  import Lyric from 'lyric-parser'
  import Scroll from 'base/scroll/scroll'
  import PlayList from 'components/playlist/playlist'
  import {playerMixin} from 'common/js/mixin'

  const transform = prefixStyle('transform')
  const transitionDuration = prefixStyle('transitionDuration');
  export default{
    mixins: [playerMixin],
    data(){
      return {
        songReady: false,//当前曲是否加载完毕
        currentTime: 0,//当前歌曲的播放时间
        radius: 32,//迷你播放器的圆环尺寸
        currentLyric: null,//歌词
        currentLineNum: 0,//当前歌词播放到哪一行
        currentShow: 'CD',
        playingLyric: '',//当前播放到的歌词
      }
    },
    computed: {
      //控制CD旋转类名
      cdCla(){
        return this.playing ? 'play' : 'play-pause'
      },
      //播放器的播放暂停的样式
      playIcon(){
        return this.playing ? 'icon-play' : 'icon-pause'
      },
      //迷你播放器的播放暂停的样式
      miniIcon(){
        return this.playing ? 'icon-play-mini' : 'icon-pause-mini'
      },
      //左右不可切换状态样式
      disableCls(){
        return this.songReady ? '' : 'disable'
      },
      ...mapGetters([
        'fullScreen',
        'playing',
        'currentIndex'
      ]),
      //播放比例
      percent(){
        return this.currentTime / this.currentSong.duration;
      }
    },
    methods: {
      //返回的时候取消全屏
      back(){
        this.setFullScreen(false);
      },
      //点击迷你播放器的时候打开全屏
      open(){
        this.setFullScreen(true);
      },
      //获取vuex里的全屏状态和播放状态
      ...mapMutations({
        setFullScreen: 'SET_FULL_SCREEN'
      }),
      ...mapActions(['savePlayHistory']),
      enter(el, done){
        const {x, y, scale} = this._getPosAndScale();
        let animation = {
          0: {
            transform: `translate3d(${x}px,${y}px,0) scale(${scale})`
          },
          60: {
            transform: `translate3d(0,0,0) scale(1.1)`
          },
          100: {
            transform: `translate3d(0,0,0) scale(1)`
          }
        }
        //注册动画
        animations.registerAnimation({
          name: 'move',
          animation,
          presets: {
            duration: 400,
            easing: 'linear'
          }
        })
        animations.runAnimation(this.$refs.cdWrapper, 'move', done)//启动动画 启动后钩子会跳到afterEnter钩子
      },
      afterEnter(){
        //注销动画
        animations.unregisterAnimation('move');
        this.$refs.cdWrapper.style.animation = '';
      },
      leave(el, done){
        this.$refs.cdWrapper.style.transition = 'all 0.4s'
        const {x, y, scale} = this._getPosAndScale()
        this.$refs.cdWrapper.style[transform] = `translate3d(${x}px,${y}px,0) scale(${scale})`;
        this.$refs.cdWrapper.addEventListener('transitionend', done);//动画执行完成后跳到afterLeave
      },
      afterLeave(){
        this.$refs.cdWrapper.style.transition = '';
        this.$refs.cdWrapper.style[transform] = '';
      },
      _getPosAndScale(){
        const targetWidth = 40;//迷你播放器的宽度
        const paddingLeft = 40;//迷你播放器图片中心点离左边的值
        const paddingBottom = 30;//迷你播放器图片中心点离底部的值
        const paddingTop = 80;//正常播放器离上面的值
        const width = window.innerWidth * 0.8;//中间大图片的宽度为设备宽度的80%
        const scale = targetWidth / width;//要放大的倍数
        const x = -(window.innerWidth / 2 - paddingLeft);//x轴偏移量 大图片的中心点-小图片中心点的位置
        const y = window.innerHeight - paddingTop - width / 2 - paddingBottom;//y轴偏移量 屏幕高度-大图top值-大图高度/2-小图中心点离底部距离
        return {
          x, y, scale
        }
      },
      //播放暂停功能切换
      togglePlaying(){
        if (!this.songReady) {
          return
        }
        this.setPlayState(!this.playing);
        //暂停时停止歌词播放
        if (this.currentLyric) {
          this.currentLyric.togglePlay();
        }
      },
      //上一首
      prev(){
        //判断歌曲是否加载完成
        if (!this.songReady) {
          return;
        }
        //如果只有一首歌的情况的处理
        if (this.playlist.length === 1) {
          this.loop();
        } else {
          let index = this.currentIndex - 1;
          if (index === -1) {
            index = this.playlist.length - 1;
          }
          this.setCurrentIndex(index);
          if (!this.playing) {
            this.togglePlaying();
          }
        }
        this.songReady = false;//歌曲未加载完成时阻止点击
      },
      //下一首
      next(){
        //判断歌曲是否加载完成
        if (!this.songReady) {
          return;
        }
        //如果只有一首歌的情况的处理
        if (this.playlist.length === 1) {
          this.loop();
          return;
        } else {
          let index = this.currentIndex + 1;
          //到最后一首了
          if (index === this.playlist.length) {
            index = 0;
          }
          this.setCurrentIndex(index);
          if (!this.playing) {
            this.togglePlaying();
          }
        }
        this.songReady = false;//歌曲未加载完成时阻止点击
      },
      //歌曲开始加载到播放触发的时间 表示歌曲加载完成
      ready(){
        this.songReady = true;
        this.savePlayHistory(this.currentSong);
      },
      //歌曲发生错误的时候
      error(){
        this.songReady = false;
      },
      //获取当前歌曲的播放时间
      updateTime(e){
        this.currentTime = e.target.currentTime;
      },
      //时间格式整理
      format(interval){
        interval = interval | 0;
        const minute = interval / 60 | 0;// |相当于Math.floor()
        const second = this._pad(interval % 60);
        return `${minute}:${second}`
      },
      //补0  num要操作的数据  n数字的位数
      _pad(num, n = 2){
        let len = num.toString().length;
        while (len < n) {
          num += '0';
          len++;
        }
        return num;
      },
      //播放器进度条拖动事件
      onProgressChange(){
        let currentTime = this.currentSong.duration * percent
        this.$refs.audio.currentTime = currentTime;//duration歌曲总时长
        if (!this.playing) {
          this.togglePlaying();
        }
        //拖动进度条的时候修改歌词的播放进度
        if (this.currentLyric) {
          this.currentLyric.seek(currentTime * 1000);
        }
      },
      //改变播放模式的时候要保证当前在播放歌曲不会被改变
      resetCurrentIndex(list){
        let index = list.findIndex((item) => {
          return item.id === this.currentSong.id;
        });
        //存储当前歌曲的index然后通过playlist[index]即可获取到currentSong
        this.setCurrentIndex(index);
      },
      //歌曲播放结束事件
      end(){
        if (this.mode === playMode.loop) {
          this.loop();
        } else {
          this.next();
        }
      },
      //如果是单曲循环的时候播放结束直接将当前歌曲的播放时间置为0
      loop(){
        this.$refs.audio.currentTime = 0;
        this.$refs.audio.play();
        //单曲循环的时候播放结束将歌词的播放进度置为0
        if (this.currentLyric) {
          this.currentLyric.seek(0);
        }
      },
      //获取歌词
      getLyric(){
        this.currentSong.getLyric().then((lyric) => {
          if (this.currentSong.lyric !== lyric) {
            return;
          }
          this.currentLyric = new Lyric(lyric, this.handleLyric);
          //歌曲在播放的时候 歌词播放
          if (this.palying) {
            this.currentLyric.play();
          }
        }).catch(() => {
          //没有获取到歌词的处理
          this.currentLyric = null;
          this.palyingLyric = '';
          this.currentLineNum = 0;
        });
      },
      //歌词播放回调
      handleLyric({lineNum, txt}){
        this.currentLineNum = lineNum;
        //保持歌词在中间位置
        if (lineNum > 5) {
          let lineEl = this.$refs.lyricLine(lineNum - 5);
          this.$refs.lyricList.scrollToElement(lineEl, 1000)
        } else {
          this.$refs.lyricList.scrollToElement(0, 0, 1000)
        }
        this.playingLyric = txt;
      },
      middleTouchStart(e){
        this.touch.initalted = true;//记录touch初始化了
        const touch = e.touches[0];
        this.touch.startX = touch.pageX;//初始滑动时x位置
        this.touch.startY = touch.pageY;//初始滑动时Y位置
      },
      middleTouchMove(e){
        if (!this.touch.initalted) {
          return;
        }
        const touch = e.touches[0];
        const deltaX = touch.pageX - this.touch.startX;
        const deltaY = touch.pageY - this.touch.startY;
        //判断左右滑
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
          return;
        }
        const left = this.currentShow === 'CD' ? 0 : -window.innerWidth;//歌词的起始位置
        const offsetWidth = Math.min(0, Math.max(-window.innerWidth, left + deltaX));//如果当前为CD播放页面此时歌词页面的left为0，反之则为-window.innerWidth，  Math.max(-window.innerWidth,left+deltaX)左滑的时候deltaX为负这里的取值取钱为0- -window.innerWidth
        this.touch.percent = Math.abs(offsetWidth / window.innerWidth);//滑动的距离和屏幕宽度的比例
        this.$refs.lyricList.$el.style[transform] = `translate3d(${offsetWidth}px,0,0)`
        this.$refs.lyricList.$el.style[transitionDuration] = 0;
        this.$refs.middleL.style.opacity = (1 - this.touch.percent);
        this.$refs.middleL.style[transitionDuration] = 0;
      },
      middleTouchEnd(){
        let offsetWidth;
        let opacity;
        //左右滑动处理  超过一定距离直接滑到指定位置
        if (this.currentShow === 'CD') {
          //从右向左滑 滑动距离大于10%就直接翻页 之所以是从右往左滑的原因是offsetWidth在从左往右滑动的时候Math.max里这时的left值为0，deltaX大于0，然后取外层的Math.min()后offsetWidth的结果就一直是0就实现了在CD页面不能从左往右继续滑动的限制
          if (this.touch.percent > 0.1) {
            offsetWidth = -window.innerWidth;
            this.currentShow = 'lyric';
            opacity = 0;
          } else {
            offsetWidth = 0;
            opacity = 1;
          }
        } else {
          //从左向右滑 原理：在歌词页的时候此时的offsetWidth= Math.max()里 left为-window.innerWidth 如果是从右往左滑的话deltaX为负，Math.max的值就一直是-window.innerWidth，所以取的Math.min的值就一直是-window.innerWidth就实现了在歌词页面不能从右向左继续滑动的限制
          if (this.touch.percent < 0.9) {
            //之所以是0.9是因为这时的歌词页面已经滑过来了 percent已经为1只有滑动回去的时候才会变小
            offsetWidth = 0;
            this.currentShow = 'CD';
            opacity = 1;
          } else {
            offsetWidth = -window.innerWidth;
            opacity = 0;
          }
        }
        let time = 300;
        this.$refs.lyricList.$el.style[transform] = `translate3d(${offsetWidth}px,0,0)`;
        this.$refs.lyricList.$el.style[transitionDuration] = time;
        this.$refs.middleL.style.opacity = opacity;
        this.$refs.middleL.style[transitionDuration] = time;
      },
      //底部弹出的播放列表
      showPlaylist(){
        this.$refs.playlist.show();
      },
    },
    watch: {
      currentSong(newSong, oldSong){
        //播放列表被删完了的时候
        if (!newSong.id) {
          return;
        }
        //歌曲没有发生改变的时候不触发播放
        if (newSong === oldSong) {
          return;
        }
        //解决切换歌曲时歌词跳动问题
        if (this.currentLyric) {
          this.currentLyric.stop();
        }
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
          this.$refs.audio.play();
          this.getLyric();
        }, 1000)
      },
      //播放暂停音乐播放
      playing(newPlaying){
        this.$nextTick(() => {
          const audio = this.$refs.audio;
          newPlaying ? audio.play() : audio.pause();
        })
      }
    },
    components: {
      progressBar,
      progressCircle,
      Scroll,
      PlayList
    },
    created(){
      this.touch = {};//滑动要用的数据 不需要添加getter 和 setter
    }
  }
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
  @import "~common/stylus/variable"
  @import "~common/stylus/mixin"

  .player
    .normal-player
      position: fixed
      left: 0
      right: 0
      top: 0
      bottom: 0
      z-index: 150
      background: $color-background
      .background
        position: absolute
        left: 0
        top: 0
        width: 100%
        height: 100%
        z-index: -1
        opacity: 0.6
        filter: blur(20px)
      .top
        position: relative
        margin-bottom: 25px
        .back
          position absolute
          top: 0
          left: 6px
          z-index: 50
          .icon-back
            display: block
            padding: 9px
            font-size: $font-size-large-x
            color: $color-theme
            transform: rotate(-90deg)
        .title
          width: 70%
          margin: 0 auto
          line-height: 40px
          text-align: center
          no-wrap()
          font-size: $font-size-large
          color: $color-text
        .subtitle
          line-height: 20px
          text-align: center
          font-size: $font-size-medium
          color: $color-text
      .middle
        position: fixed
        width: 100%
        top: 80px
        bottom: 170px
        white-space: nowrap
        font-size: 0
        .middle-l
          display: inline-block
          vertical-align: top
          position: relative
          width: 100%
          height: 0
          padding-top: 80%
          .cd-wrapper
            position: absolute
            left: 10%
            top: 0
            width: 80%
            height: 100%
            .cd
              width: 100%
              height: 100%
              box-sizing: border-box
              border: 10px solid rgba(255, 255, 255, 0.1)
              border-radius: 50%
              &.play
                animation: rotate 20s linear infinite
              &.pause
                animation-play-state: paused
              .image
                position: absolute
                left: 0
                top: 0
                width: 100%
                height: 100%
                border-radius: 50%

          .playing-lyric-wrapper
            width: 80%
            margin: 30px auto 0 auto
            overflow: hidden
            text-align: center
            .playing-lyric
              height: 20px
              line-height: 20px
              font-size: $font-size-medium
              color: $color-text-l
        .middle-r
          display: inline-block
          vertical-align: top
          width: 100%
          height: 100%
          overflow: hidden
          .lyric-wrapper
            width: 80%
            margin: 0 auto
            overflow: hidden
            text-align: center
            .text
              line-height: 32px
              color: $color-text-l
              font-size: $font-size-medium
              &.current
                color: $color-text
      .bottom
        position: absolute
        bottom: 50px
        width: 100%
        .dot-wrapper
          text-align: center
          font-size: 0
          .dot
            display: inline-block
            vertical-align: middle
            margin: 0 4px
            width: 8px
            height: 8px
            border-radius: 50%
            background: $color-text-l
            &.active
              width: 20px
              border-radius: 5px
              background: $color-text-ll
        .progress-wrapper
          display: flex
          align-items: center
          width: 80%
          margin: 0px auto
          padding: 10px 0
          .time
            color: $color-text
            font-size: $font-size-small
            flex: 0 0 30px
            line-height: 30px
            width: 30px
            &.time-l
              text-align: left
            &.time-r
              text-align: right
          .progress-bar-wrapper
            flex: 1
        .operators
          display: flex
          align-items: center
          .icon
            flex: 1
            color: $color-theme
            &.disable
              color: $color-theme-d
            i
              font-size: 30px
          .i-left
            text-align: right
          .i-center
            padding: 0 20px
            text-align: center
            i
              font-size: 40px
          .i-right
            text-align: left
          .icon-favorite
            color: $color-sub-theme
      &.normal-enter-active, &.normal-leave-active
        transition: all 0.4s
        .top, .bottom
          transition: all 0.4s cubic-bezier(0.86, 0.18, 0.82, 1.32)
      &.normal-enter, &.normal-leave-to
        opacity: 0
        .top
          transform: translate3d(0, -100px, 0)
        .bottom
          transform: translate3d(0, 100px, 0)
    .mini-player
      display: flex
      align-items: center
      position: fixed
      left: 0
      bottom: 0
      z-index: 180
      width: 100%
      height: 60px
      background: $color-highlight-background
      &.mini-enter-active, &.mini-leave-active
        transition: all 0.4s
      &.mini-enter, &.mini-leave-to
        opacity: 0
      .icon
        flex: 0 0 40px
        width: 40px
        padding: 0 10px 0 20px
        img
          border-radius: 50%
          &.play
            animation: rotate 10s linear infinite
          &.pause
            animation-play-state: paused
      .text
        display: flex
        flex-direction: column
        justify-content: center
        flex: 1
        line-height: 20px
        overflow: hidden
        .name
          margin-bottom: 2px
          no-wrap()
          font-size: $font-size-medium
          color: $color-text
        .desc
          no-wrap()
          font-size: $font-size-small
          color: $color-text-d
      .control
        flex: 0 0 30px
        width: 30px
        padding: 0 10px
        .icon-play-mini, .icon-pause-mini, .icon-playlist
          font-size: 30px
          color: $color-theme-d
        .icon-mini
          font-size: 32px
          position: absolute
          left: 0
          top: 0

  @keyframes rotate
    0%
      transform: rotate(0)
    100%
      transform: rotate(360deg)
</style>
