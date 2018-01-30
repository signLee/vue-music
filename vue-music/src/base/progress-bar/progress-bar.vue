<template>
  <div class="progress-bar" ref="progressBar" @click="progressClick">
    <div class="bar-inner">
      <div class="progress" ref="progress"></div>
      <div class="progress-btn-wrapper" ref="progressBtn"
           @touchstart.prevent="progressTouchStart"
           @touchmove.prevent="progressTouchMove"
           @touchend.prevent="progressTouchEnd"
      >
        <div class="progress-btn"></div>
      </div>
    </div>
  </div>
</template>

<script type="text/ecmascript-6">
  import {prefixStyle} from 'common/js/dom'

  const progressBtnWidth = 16
  const transform = prefixStyle('transform')

  export default {
    props: {
      percent: {
        type: Number,
        default: 0
      }
    },
    created() {
      this.touch = {};
    },
    methods: {
      progressTouchStart(e){
        this.touch.initiated = true;//表示初始化完毕
        this.touch.startX = e.touches[0].pageX;//触摸的时候记录初始的X轴的位置
        this.touch.left = this.$refs.progress.clientWidth;//触摸的时候进度条的宽度
      },
      progressTouchMove(e){
        if (!this.touch.initial) {
          return;
        }
        const deltaX = e.touches[0].pageX - this.touch.startX;//X轴移动距离
        const offsetWidth = Math.min(this.$refs.progressBar.clientWidth - progressBtnWidth, Math.max(0, this.touch.left + deltaX));//移动限定  大于初始位置小于最大位置
        this._offset(offsetWidth);
      },
      progressTouchEnd(e){
        this.touch.initiated = false;//拖动结束
        this._triggerPercent();
      },
      //touch共用方法
      _offset(offsetWidth){
        this.$refs.progress.style.width = `${offsetWidth}px`//进度条的长度
        this.$refs.progressBtn.style[transform] = `translate3d(${offsetWidth}px,0,0)`//进度条小球的移动距离
      },
      //拖动结束时对外输出当前的百分比
      _triggerPercent(){
        const barWidth = this.$refs.progressBar.clientWidth - progressBtnWidth;//整个进度条的长度
        const percent = this.$refs.progress.clientWidth / barWidth;//当前进度条运动的长度/整个进度条的长度
        this.$emit('percentChange', percent);
      },
      //进度条的点击事件
      progressClick(e){
        //点击progressBtn的时候e.offsetX取值不对
        const rect = this.$refs.progressBar.getBoundingClientRect();
        const offsetWidth = e.pageX - rect.left;//点击的时候X轴坐标到屏幕左边的距离-progressBtn的left值
        this._offset(offsetWidth);
        this._triggerPercent();
      }
    },
    watch: {
      percent(newPercent){
        //没有在拖动的时候才改变进度条的长度 避免播放时进度条的改变和拖动时进度条改变冲突
        if (newPercent >= 0 && !this.touch.initiated) {
          const barWidth = this.$refs.progressBar.clientWidth - progressBtnWidth;//整个进度条的长度
          const offsetWidth = newPercent * barWidth;//进度条已播放的长度
          this._offset(offsetWidth);
        }
      }
    }
  }
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
  @import "~common/stylus/variable"

  .progress-bar
    height: 30px
    .bar-inner
      position: relative
      top: 13px
      height: 4px
      background: rgba(0, 0, 0, 0.3)
      .progress
        position: absolute
        height: 100%
        background: $color-theme
      .progress-btn-wrapper
        position: absolute
        left: -8px
        top: -13px
        width: 30px
        height: 30px
        .progress-btn
          position: relative
          top: 7px
          left: 7px
          box-sizing: border-box
          width: 16px
          height: 16px
          border: 3px solid $color-text
          border-radius: 50%
          background: $color-theme
</style>
