<template>
  <scroll class="listview" :data="data" ref="listview" :listenScroll="listenScroll" :probeType="prototype"
          @scroll="scroll">
    <ul>
      <li v-for="group in data" class="list-group" ref="listGroup">
        <h2 class="list-group-title">{{group.title}}</h2>
        <uL>
          <li v-for="item in group.items" class="list-group-item" @click="selectItem(item)">
            <img class="avatar" v-lazy="item.avatar">
            <span class="name">{{item.name}}</span>
          </li>
        </uL>
      </li>
    </ul>
    <div class="list-shortcut" @touchstart="onShortcutTouchStart" @touchmove.stop.prevent="onShortcutTouchMove">
      <ul>
        <li v-for="(item,index) in shortcutList"
            class="item"
            :data-index="index"
            :class="{'current':currentIndex===index}"
        >{{item}}


        </li>
      </ul>
    </div>
    <!--实现固定在顶部的导航标题的逻辑主要是判断当前滚动List的上限和当前滚动距离的差  如果这个差在0-titleHeight之间的话就把元素顶上去-->
    <div class="list-fixed" ref="fixed" v-show="fixedTitle">
      <div class="fixed-title">{{fixedTitle}} </div>
    </div>
    <div v-show="!data.length" class="loading-container">
      <loading></loading>
    </div>
  </scroll>
</template>

<script type="text/ecmascript-6">
  import Scroll from 'base/scroll/scroll'
  import Loading from 'base/loading/loading'
  import {getData} from 'common/js/dom'
  //右边每个字母的高度
  const ANCHOR_HEIGHT = 18
  const TITLE_HEIGHT = 30//固定的title高度
  export default{
    props: {
      data: {
        type: Array,
        default: []
      }
    },
    data(){
      return {
        scrollY: -1,
        currentIndex: 0,
        diff: -1,//当前滚动列表的上限和滚动距离的滚动差
      }
    },
    created(){
      //不需要检测值的变化不用写在data里
      this.touch = {};
      this.listenScroll = true;
      this.listHeight = [];//每个list的高度
      this.prototype = 3;//监听惯性滚动
    },
    components: {
      Scroll, Loading
    },
    computed: {

      shortcutList(){
        return this.data.map((group) => {
          return group.title.substr(0, 1);
        })
      },
      fixedTitle(){
        //在最顶部的时候不需要出现固定的title
        if (this.scrollY > 0) {
          return '';
        }
        return this.data[this.currentIndex] ? this.data[this.currentIndex].title : '';
      }
    },
    methods: {
      //选择歌手事件
      selectItem(item){
        this.$emit('select',item);
      },
      onShortcutTouchStart(e){
        let anchorIndex = getData(e.target, 'index');//取到的值为字符串
        let firstTouch = e.touches[0]
        this.touch.y1 = firstTouch.pageY
        this.touch.anchorIndex = anchorIndex
        this._scrollTo(anchorIndex);
      },
      onShortcutTouchMove(e){
        let firstTouch = e.touches[0];//起点位置
        this.touch.y2 = firstTouch.pageY
        let delta = (this.touch.y2 - this.touch.y1) / ANCHOR_HEIGHT | 0
        //this.touch.anchorIndex是从data-index上取的自定义属性数据类型为字符串  需要转成数字类型
        let anchorIndex = parseInt(this.touch.anchorIndex) + delta
        this._scrollTo(anchorIndex);
      },
      _scrollTo(index){
        //上下两端的空白位置的点击处理
        if (!index && index != 0) {
          return;
        }
        //滚动超出限制
        if (index < 0) {
          index = 0;
        } else if (index > this.listHeight.length - 2) {
          index = this.listHeight.length - 2
        }
        this.scrollY = -this.listHeight[index]
        this.$refs.listview.scrollToElement(this.$refs.listGroup[index], 1);
      },
      //scroll派发过来 记录左边当前滚动到了那个位置
      scroll(pos){
        this.scrollY = pos.y;
      },
      //计算每个List的高度
      _calculateHeight(){
        this.listHeight = [];
        const list = this.$refs.listGroup;
        let height = 0;//第一个元素的高度为0
        this.listHeight.push(height);
        for (let i = 0; i < list.length; i++) {
          let item = list[i];
          height += item.clientHeight;
          this.listHeight.push(height);
        }
      },
      //对外暴露刷新方法
      refresh(){
        this.$refs.listview.refresh();
      }
    },
    watch: {
      data(){
        setTimeout(() => {
          this._calculateHeight();
        }, 20)
      },
      //左侧滚动的距离 newY 滚动距离
      scrollY(newY){
        const listHeight = this.listHeight;
        //滚动到顶部newY>0
        if (newY > 0) {
          this.currentIndex = 0;
          return;
        }
        //中间部分
        for (let i = 0; i < listHeight.length - 1; i++) {
          let height1 = listHeight[i]
          let height2 = listHeight[i + 1]
          if (-newY >= height1 && -newY < height2) {
            this.currentIndex = i;
            this.diff = height2 + newY;
            return
          }
        }
        //当滚动到底部，且-newY大于最后一个元素的上限  -2的原因是listHeight多一个热的元素
        this.currentIndex = listHeight.length - 2;
      },
      //newVal  滚动列表的上限减去已滚动的距离
      diff(newVal){
        let fixedTop = (newVal > 0 && newVal < TITLE_HEIGHT) ? newVal - TITLE_HEIGHT : 0;//上限的距离在0-title的height之间 往上顶上去  当fixedtitle被顶上去后由于这个判断条件已经不满足 fixedTop重新为0 从视觉上就实现了衔接
        //性能优化 防止多次dom操作 此时是在没有接触到顶部的时候触发
        if (this.fixedTop === fixedTop) {
          return;
        }
        this.fixedTop = fixedTop;//无需检测数据变化  所以不用在data里定义
        this.$refs.fixed.style.transform = `translate3d(0,${fixedTop}px,0)`;
      }
    }
  }
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
  @import "~common/stylus/variable"

  .listview
    position: relative
    width: 100%
    height: 100%
    overflow: hidden
    background: $color-background
    .list-group
      padding-bottom: 30px
      .list-group-title
        height: 30px
        line-height: 30px
        padding-left: 20px
        font-size: $font-size-small
        color: $color-text-l
        background: $color-highlight-background
      .list-group-item
        display: flex
        align-items: center
        padding: 20px 0 0 30px
        .avatar
          width: 50px
          height: 50px
          border-radius: 50%
        .name
          margin-left: 20px
          color: $color-text-l
          font-size: $font-size-medium
    .list-shortcut
      position: absolute
      z-index: 30
      right: 0
      top: 50%
      transform: translateY(-50%)
      width: 20px
      padding: 20px 0
      border-radius: 10px
      text-align: center
      background: $color-background-d
      font-family: Helvetica
      .item
        padding: 3px
        line-height: 1
        color: $color-text-l
        font-size: $font-size-small
        &.current
          color: $color-theme
    .list-fixed
      position: absolute
      top: 0
      left: 0
      width: 100%
      .fixed-title
        height: 30px
        line-height: 30px
        padding-left: 20px
        font-size: $font-size-small
        color: $color-text-l
        background: $color-highlight-background
    .loading-container
      position: absolute
      width: 100%
      top: 50%
      transform: translateY(-50%)
</style>
