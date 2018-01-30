<template>
  <div class="music-list">
    <div class="back" @click="back">
      <i class="icon-back"></i>
    </div>
    <h1 class="title" v-html="title"></h1>
    <div class="bg-image" :style="bgStyle" ref="bgImage">
      <div class="play-wrapper">
        <div class="play" ref="playBtn" @click="random" v-show="songs.length>0">
          <i class="icon-play"></i>
          <span class="text">随机播放全部</span>
        </div>
      </div>
      <div class="filter" ref="filter"></div>
    </div>
    <div class="bg-layer" ref="layer"></div>
    <scroll @scroll="scroll" :probe-type="probeType" :listen-scroll="listenScroll" :data="songs" class="list" ref="list">
      <div class="song-list-wrapper">
        <song-list @select="selectItem" :rank="rank" :songs="songs"></song-list>
      </div>
      <div class="loading-container" v-show="!songs.length">
        <loading></loading>
      </div>
    </scroll>
  </div>
</template>

<script type="text/ecmascript-6">
  import Scroll from 'base/scroll/scroll'
  import SongList from 'base/song-list/song-list'
  import Loading from 'base/loading/loading'
  import {prefixStyle} from 'common/js/dom.js'
  import {mapActions} from 'vuex'
  import {playlistMixin} from 'common/js/mixin'

  const RESERVED_HEIGHT = 40
  const transform = prefixStyle('transform');
  const backdrop = prefixStyle('backdrop-filter')
  export default{
    mixins: [playlistMixin],//定义所有组件都会调用的方法
    props: {
      bgImage: {
        type: String,
        default: ''
      },
      songs: {
        type: Array,
        default: []
      },
      title: {
        type: String,
        default: ''
      },
      rank: {
        type: Boolean,
        default: false
      }
    },
    data(){
      return {
        scrollY: 0
      }
    },
    computed: {
      bgStyle(){
        console.log(this.bgImage);
        return `background-image:url(${this.bgImage})`
      }
    },
    components: {
      Scroll, SongList, Loading
    },
    mounted(){
      this.imageHeight = this.$refs.bgImage.clientHeight//记录bgImage的高度 方便layer层滚动的时候做限制用
      this.minTransalteY = -this.imageHeight + RESERVED_HEIGHT//layer层的最小滚动距离
      this.$refs.list.$el.style.top = `${this.$refs.bgImage.clientHeight}px`
    },
    created(){
      this.probeType = 3;
      this.listenScroll = true;
    },
    methods: {
      //如果播放列表有数据的情况下修改List的bottom值
      handlePlaylist(playlist){
        const bottom = playlist.length > 0 ? '60px' : '';
        this.$refs.list.$el.style.bottom = bottom;
        this.$refs.list.refresh();
      },
      scroll(pos){
        this.scrollY = pos.y
      },
      //返回上一层
      back(){
        this.$router.back();
      },
      //选择歌曲事件
      selectItem(item, index){
        this.selectPlay({
          list: this.songs,
          index: index
        });
      },
      ...mapActions(['selectPlay', 'randomPlay']),
      //随机播放歌曲
      random(){
        this.randomPlay({
          list: this.songs
        });
      }
    },
    watch: {
      scrollY(newY){
        let translateY = Math.max(this.minTransalteY, newY);//上移过程中移动距离小于头部图片高度减去顶部高度时取到的是移动距离 反之取minTransalteY
        let zIndex = 0;//当newY移动距离小于头部图片高度减去顶部高度时提升头部层级  改变padding和height，反之维持原样 这样就确保了顶部的返回栏不会被文字遮挡
        let scale = 1;//歌单列表往下拉时将顶部图片放大
        const percent = Math.abs(newY / this.imageHeight);
        let blur = 0;//往上时模糊效果针对IOS优化 安卓无效果
        //往下拉
        if (newY > 0) {
          scale += percent;//图片放大比例
          zIndex = 10
        } else {
          blur = Math.min(20, percent * 20)
        }
        this.$refs.layer.style[transform] = `translate3d(0,${translateY}px,0)`
        this.$refs.filter.style[backdrop] = `blur(${blur}px)`

        if (newY < this.minTransalteY) {
          zIndex = 10;
          this.$refs.bgImage.style.paddingTop = 0;
          this.$refs.bgImage.style.height = `${RESERVED_HEIGHT}px`;
          this.$refs.playBtn.style.display = 'none';
        } else {
          this.$refs.bgImage.style.paddingTop = '70%';
          this.$refs.bgImage.style.height = 0;
          this.$refs.playBtn.style.display = 'block';
        }
        this.$refs.bgImage.style[transform] = `scale(${scale})`;//下拉时图片放大
        this.$refs.bgImage.style.zIndex = zIndex
      }
    },
  }
</script>


<style scoped lang="stylus" rel="stylesheet/stylus">
  @import "~common/stylus/variable"
  @import "~common/stylus/mixin"

  .music-list
    position: fixed
    z-index: 100
    top: 0
    left: 0
    bottom: 0
    right: 0
    background: $color-background
    .back
      position absolute
      top: 0
      left: 6px
      z-index: 50
      .icon-back
        display: block
        padding: 10px
        font-size: $font-size-large-x
        color: $color-theme
    .title
      position: absolute
      top: 0
      left: 10%
      z-index: 40
      width: 80%
      no-wrap()
      text-align: center
      line-height: 40px
      font-size: $font-size-large
      color: $color-text
    .bg-image
      position: relative
      width: 100%
      height: 0
      padding-top: 70%
      transform-origin: top
      background-size: cover
      .play-wrapper
        position: absolute
        bottom: 20px
        z-index: 50
        width: 100%
        .play
          box-sizing: border-box
          width: 135px
          padding: 7px 0
          margin: 0 auto
          text-align: center
          border: 1px solid $color-theme
          color: $color-theme
          border-radius: 100px
          font-size: 0
          .icon-play
            display: inline-block
            vertical-align: middle
            margin-right: 6px
            font-size: $font-size-medium-x
          .text
            display: inline-block
            vertical-align: middle
            font-size: $font-size-small
      .filter
        position: absolute
        top: 0
        left: 0
        width: 100%
        height: 100%
        background: rgba(7, 17, 27, 0.4)
    .bg-layer
      position: relative
      height: 100%
      background: $color-background
    .list
      position: fixed
      top: 0
      bottom: 0
      width: 100%
      background: $color-background
      .song-list-wrapper
        padding: 20px 30px
      .loading-container
        position: absolute
        width: 100%
        top: 50%
        transform: translateY(-50%)
</style>
