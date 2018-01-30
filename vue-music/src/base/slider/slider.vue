<template>
  <div class="slider" ref="slider">
    <div class="slider-group" ref="sliderGroup">
      <slot>
      </slot>
    </div>
    <div class="dots">
      <span class="dot" :class="{active: currentPageIndex === index }" v-for="(item, index) in dots"></span>
    </div>
  </div>
</template>

<script type="text/ecmascript-6">
  import BScroll from 'better-scroll'
  import {addClass} from 'common/js/dom'
  export default {
    name: 'slider',
    props: {
      loop: {
        type: Boolean,
        default: true
      },
      autoPlay: {
        type: Boolean,
        default: true
      },
      interval: {
        type: Number,
        default: 400
      }
    },
    data(){
      return {
        dots: [],
        currentPageIndex: 0
      }
    },
    mounted(){
      //一般浏览器刷新在17ms之后 也可以使用this.$nextnick推荐使用setTimeout
      setTimeout(() => {
        //设置轮播的宽度
        this._setSliderWidth();
        //设置轮播的小点 必须要在初始化silder之前
        this._initDots();
        //初始化bscroll 使用BScroll后DOM会被复制两份
        this._initSlider();
        //自动播放
        if (this.autoPlay) {
          this._play();
        }
      }, 20)
      window.addEventListener('resize',()=>{
        if (!this.slider) {
          return
        }
        this._setSliderWidth(true)
        this.slider.refresh()//让slider重新计算
      })
    },
    activated() {
      if (this.autoPlay) {
        this._play()
      }
    },
    deactivated() {
      clearTimeout(this.timer)
    },
    beforeDestroy() {
      clearTimeout(this.timer)
    },
    methods: {
      //轮播
      _setSliderWidth(isResize) {
        this.children = this.$refs.sliderGroup.children

        let width = 0
        let sliderWidth = this.$refs.slider.clientWidth
        for (let i = 0; i < this.children.length; i++) {
          let child = this.children[i]
          addClass(child, 'slider-item')

          child.style.width = sliderWidth + 'px'//每个元素的宽度在slider里设置降低组件的耦合性
          width += sliderWidth
        }
        //解决窗口大小改变width被多次累加了的问题
        if (this.loop && !isResize) {
          width += 2 * sliderWidth
        }
        this.$refs.sliderGroup.style.width = width + 'px'
      },
      //轮播的小点
      _initDots(){
        this.dots = new Array(this.children.length)
      },
      //初始化bscroll
      _initSlider(){
        this.slider = new BScroll(this.$refs.slider, {
          scrollX: true,//可以横向滚动
          scrollY: false,//不允许纵向滚动
          momentum: false,//惯性
          snap: true,//
          snapLoop: this.loop,//循环与否
          snapThreshold: 0.3,
          snapSpeed: 400
        })
        //bscroll提供 滚动结束回调   获取当前的pageIndex
        this.slider.on('scrollEnd', () => {
          let pageIndex = this.slider.getCurrentPage().pageX;//当前的pageIndex
          if (this.loop) {
            pageIndex -= 1;//slider初始化后元素前后都被复制了一份
          }
          this.currentPageIndex = pageIndex

          if (this.autoPlay) {
            this._play()
          }
        })
        //开始拖动的时候清除定时器
        this.slider.on('beforeScrollStart', () => {
          if (this.autoPlay) {
            clearTimeout(this.timer)
          }
        })

      },
      //自动轮播
      _play(){
        //跳到下一张
        let pageIndex = this.currentPageIndex + 1;
        //循环有一个副本
        if (this.loop) {
          pageIndex += 1;
        }
        this.timer = setTimeout(() => {
          //bscroll提供goToPage方法  0代表y方向
          this.slider.goToPage(pageIndex, 0, 400);
        }, this.interval)
      }
    },
    destroyed(){
        clearTimeout(this.timer);
    }
  }
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
  @import "~common/stylus/variable"

  .slider
    min-height: 1px
    .slider-group
      position: relative
      overflow: hidden
      white-space: nowrap
      .slider-item
        float: left
        box-sizing: border-box
        overflow: hidden
        text-align: center
        a
          display: block
          width: 100%
          overflow: hidden
          text-decoration: none
        img
          display: block
          width: 100%
    .dots
      position: absolute
      right: 0
      left: 0
      bottom: 12px
      text-align: center
      font-size: 0
      .dot
        display: inline-block
        margin: 0 4px
        width: 8px
        height: 8px
        border-radius: 50%
        background: $color-text-l
        &.active
          width: 20px
          border-radius: 5px
          background: $color-text-ll
</style>
