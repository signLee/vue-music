<template>
  <div class="singer" ref="singer">
    <list-view :data="singers" @select="selectSinger" ref="list"></list-view>
    <router-view></router-view>
  </div>
</template>

<script type="text/ecmascript-6">
  import {getSingerList} from 'api/singer'//引用接口调用
  import {ERR_OK} from 'api/config'
  import singer from 'common/js/singer.js'//引入singer类
  import ListView from 'base/listview/listview'
  import {mapMutations} from 'vuex'
  import {playlistMixin} from 'common/js/mixin'

  const HOT_NAME = '热门';
  const HOT_SINGER_LEN = 10;
  export default{
    mixins: [playlistMixin],
    data(){
      return {
        singers: []
      }
    },
    created(){
      this._getSingerList()
    },
    methods: {
      //底部迷你播放器在播放的时候给底部加上60的bottom
      handlePlaylist(playlist){
        const bottom = playlist.length > 0 ? '60px' : '';
        this.$refs.singer.style.bottom = bottom;
        this.$refs.list.refresh();
      },
      //选择歌手事件
      selectSinger(singer){
        this.$router.push({
          path: `/singer/${singer.id}`
        });
        this.setSinger(singer)
      },
      _getSingerList(){
        getSingerList().then((res) => {
          if (res.code === ERR_OK) {
            this.singers = this._normalizeSinger(res.data.list);
          }
        })
      },
      //数据格式处理
      _normalizeSinger(list){
        let map = {
          hot: {
            title: HOT_NAME,
            items: []
          }
        }
        list.forEach((item, index) => {
          //热门数据截取前10条
          if (index < HOT_SINGER_LEN) {
            map.hot.items.push(new singer(
              {
                id: item.Fsinger_mid,
                name: item.Fsinger_name
              }
            ))
          }
          const key = item.Findex;//排序的字母
          if (!map[key]) {
            map[key] = {
              title: key,
              items: []
            }
          }
          //a-z的数据
          map[key].items.push(new singer(
            {
              id: item.Fsinger_mid,
              name: item.Fsinger_name
            }
          ));
        });
        let hot = [];
        let ret = [];
        for (let key in map) {
          let val = map[key]
          if (val.title.match(/[a-zA-Z]/)) {
            //所有a-z的放在一起
            ret.push(val)
          } else if (val.title === HOT_NAME) {
            //热门数据放一起
            hot.push(val)
          }
        }
        //排序
        ret.sort((a, b) => {
          return a.title.charCodeAt(0) - b.title.charCodeAt(0)
        });
        return hot.concat(ret);
      },
      ...mapMutations({
        setSinger: 'SET_SINGER'
      })
    },
    components: {
      ListView
    }
  }
</script>


<style scoped lang="stylus" rel="stylesheet/stylus">
  .singer
    position: fixed
    top: 88px
    bottom: 0
    width: 100%
</style>
