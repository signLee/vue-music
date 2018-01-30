<template>
  <scroll class="suggest"
          :data="result"
          ref="suggest"
          :pullup="pullup"
          :beforeScroll="beforeScroll"
          @beforeScroll="listScroll"
          @scrollToEnd="searchMore">
    <ul class="suggest-list">
      <li class="suggest-item" v-for="item in result" @click="selectItem(item)">
        <div class="icon">
          <i :class="getIconCls(item)"></i>
        </div>
        <div class="name">
          <p class="text" v-html="getDisplayNmae(item)"></p>
        </div>
      </li>
      <loading v-show="hasMore" title=""></loading>
    </ul>
    <div v-show="!hasMore&&!result.length" class="no-result-wrapper">
      <no-result title="抱歉，暂无搜索结果"></no-result>
    </div>
  </scroll>
</template>

<script type="text/ecmascript-6">
  import {search} from 'api/search'
  import {ERR_OK} from 'api/config'
  import {createSong} from 'common/js/song'
  import Scroll from 'base/scroll/scroll'
  import Loading from 'base/loading/loading'
  import Singer from 'common/js/singer'
  import {mapMutations, mapActions} from 'vuex'
  import NoResult from 'base/no-result/no-result'

  const TYPE_SINGER = 'singer'
  const perpage = 20;//每页的数据条数
  export default{
    props: {
      query: {
        type: String,
        default: ''
      },
      showSinger: {
        type: Boolean,
        default: true
      }
    },
    data(){
      return {
        page: 1,
        result: [],
        pullup: true,//是否支持上拉加载更多
        hasMore: true,//是否还有更多数据
        beforeScroll: true,//监听开始滚动事件
      }
    },
    methods: {
      //获取搜索数据
      _search(){
        this.page = 1;
        this.hasMore = true;
        this.$refs.suggest.scrollTo(0, 0);//搜索数据发生改变的时候让列表滚动到顶部
        search(this.query, this.page, this.showSinger, perpage).then((res) => {
          if (res.code === ERR_OK) {
            this.result = this._getResult(res.data);
          }
          this._checkMore(res.data);
        })
      },
      //判断是否还有更多数据
      _checkMore(data){
        const song = data.song;
        if (!song.list.length || (song.curnum + song.curpage * perpage) > song.totalnum) {
          this.hasMore = false;
        }
      },
      //数据格式处理
      _getResult(data){
        let ret = [];
        if (data.zhida && data.zhida.singerid) {
          ret.push({...data.zhida, ...{type: TYPE_SINGER}});
        }
        if (data.song) {
          ret = ret.concat(this._normalizeSongs(data.song.list));
        }
        return ret;
      },
      getIconCls(item){
        if (item.tyle === TYPE_SINGER) {
          return 'icon-mine'
        } else {
          return 'icon-music'
        }
      },
      getDisplayNmae(item){
        if (item.type === TYPE_SINGER) {
          return item.singername;
        } else {
          return `${item.name}-${item.singer}`
        }
      },
      _normalizeSongs(list){
        let ret = [];
        list.forEach((musicData) => {
          if (musicData.songid && musicData.albumid) {
            ret.push(createSong(musicData));
          }
        });
        return ret;
      },
      //上拉加载更多
      searchMore(){
        if (!this.hasMore) {
          return;
        }
        this.page += 1;
        search(this.query, this.page, this.showSinger, perpage).then((res) => {
          if (res.code === ERR_OK) {
            this.result = this.result.concat(this._getResult(res.data));
          }
          this._checkMore(res.data);
        });
      },
      //点击搜索结果事件
      selectItem(item){
        if (item.type === TYPE_SINGER) {
          const singer = new Singer({
            id: item.singermid,
            name: item.singername
          })
          this.$router.push({
            path: `/search/${singer.id}`
          })
          this.setSinger(singer);
        } else {
          this.insertSong(item);
        }
        this.$emit('select');//用于存储历史数据
      },
      ...mapMutations({
        setSinger: 'SET_SINGER',
      }),
      ...mapActions(['insertSong']),
      listScroll(){
          this.$emit('listScroll');
      },
      refresh(){
          this.$refs.suggest.refresh();
      }
    },
    watch: {
      query(){
        this._search();
      }
    },
    components: {
      Scroll, Loading, NoResult
    }
  }
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
  @import "~common/stylus/variable"
  @import "~common/stylus/mixin"

  .suggest
    height: 100%
    overflow: hidden
    .suggest-list
      padding: 0 30px
      .suggest-item
        display: flex
        align-items: center
        padding-bottom: 20px
      .icon
        flex: 0 0 30px
        width: 30px
        [class^="icon-"]
          font-size: 14px
          color: $color-text-d
      .name
        flex: 1
        font-size: $font-size-medium
        color: $color-text-d
        overflow: hidden
        .text
          no-wrap()
    .no-result-wrapper
      position: absolute
      width: 100%
      top: 50%
      transform: translateY(-50%)
</style>
