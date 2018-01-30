<template>
  <transition-group name="slide">
    <div class="singer-detail" key="1"></div>
    <music-list :songs="songs" key="2" :title="title" :bg-image="bgImage"></music-list>
  </transition-group>
</template>

<script type="text/ecmascript-6">
  import {getSingerDetail} from 'api/singer'
  import {ERR_OK} from 'api/config'
  import {mapGetters} from 'vuex'
  import {createSong} from 'common/js/song'
  import MusicList from 'components/music-list/music-list'
  export default {
    computed: {
        title(){
          return this.singer.name
        },
      bgImage(){
        return this.singer.avatar
      },
      ...mapGetters([
        'singer'
      ])
    },
    data() {
      return {
        songs: []
      }
    },
    created() {
      this._getDetail();
//      console.log(createSong)
    },
    methods: {
      _getDetail(){
        //用户手动刷新页面时由于拿不到歌手信息 导致拿不到歌单列表 直接返回到上一页去
        if (!this.singer.id) {
          this.$router.push('/singer');
          return;
        }
        //获取歌单列表接口
        getSingerDetail(this.singer.id).then((res) => {
          if (res.code === ERR_OK) {
            this.songs = this._normalizeSongs(res.data.list)
          }
        });
      },
      _normalizeSongs(list){
        let ret = [];
        list.forEach((item) => {
          let {musicData} = item
          if (musicData.songid && musicData.albummid) {
            ret.push(createSong(musicData));
          }
        });
        return ret;
      }
    },
    components: {
     MusicList
     }
  }
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
  .singer-detail
    position: fixed
    z-index: 100
    top: 0
    left: 0
    right: 0
    bottom: 0
    background: #000

  .slide-enter-active, .slide-leave-active
    transition: all 0.3s

  .slide-enter, .slide-leave-to
    transform: translate3d(100%, 0, 0)
</style>
