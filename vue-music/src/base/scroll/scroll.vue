<template>
  <!--滚动组件-->
  <div class="" ref="wrapper">
    <slot></slot>
  </div>
</template>

<script type="text/ecmascript-6">
  import BScroll from 'better-scroll'
  export default{
    props: {
      probeType: {
        type: Number,
        default: 1
      },
      click: {
        type: Boolean,
        default: true
      },
      data: {
        type: Array,
        default: null
      },
      //是否监听滚动事件
      listenScroll: {
        type: Boolean,
        default: false
      },
      //上拉刷新
      pullup: {
        type: Boolean,
        default: false
      },
      //是否要开始滚动事件
      beforeScroll: {
        type: Boolean,
        default: false
      },
      //重新刷新的默认时间
      refreshDelay: {
        type: Number,
        default: 20
      }
    },
    mounted(){
      setTimeout(() => {
        this._initScroll()
      }, 20)
    },
    methods: {
      _initScroll(){
        if (!this.$refs.wrapper) {
          return
        }
        this.scroll = new BScroll(this.$refs.wrapper, {
          probeType: this.probeType,
          click: this.click
        })

        if (this.listenScroll) {
          let me = this;
          this.scroll.on('scroll', (pos) => {
            //对外输出scroll 事件  pos 当前位置信息
            me.$emit('scroll', pos);
          });
        }
        if (this.pullup) {
          //判断是否滚动到底部  50 离底部的距离
          this.scroll.on('scrollEnd', () => {
            if (this.scroll.y <= this.scroll.maxScrollY + 50) {
              this.$emit('scrollToEnd')
            }
          });
        }
        if (this.beforeScroll) {
          this.scroll.on('beforeScrollStar', () => {
            this.$emit('beforeScroll')
          });
        }
      },
      enable(){
        this.scroll && this.scroll.enable();
      },
      disable(){
        this.scroll && this.scroll.disable();
      },
      refresh(){
        this.scroll && this.scroll.refresh();
      },
      //仿联系人排序滚动用到
      scrollTo(){
        /*scrollTo(x, y, time, easing)
         滚动到某个位置，x,y 代表坐标，time 表示动画时间，easing 表示缓动函数*/
        this.scroll && this.scroll.scrollTo.apply(this.scroll, arguments);
      },
      //仿联系人排序滚动用到
      scrollToElement(){
//        scrollToElement(el, time, offsetX, offsetY, easing)
        this.scroll && this.scroll.scrollToElement.apply(this.scroll, arguments)
      }

    },
    watch: {
      data(){
        setTimeout(() => {
          this.refresh();
        }, this.refreshDelay)
      }
    }
  }
</script>

<style scoped>

</style>
