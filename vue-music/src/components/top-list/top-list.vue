<template>
  <transition name="slide">
    <musicList :title="title" :rank="rank" :bgImage="bgImage" :songs="songs"></musicList>
  </transition>
</template>

<script type="text/ecmascript-6">
  import MusicList from 'components/music-list/music-list'
  import {mapGetters} from 'vuex'
  import {ERR_OK} from 'api/config'
  import {getMusicList} from 'api/rank'
  import {createSong} from 'common/js/song'

  export default{
    data(){
      return {
        songs: [],
        rank: true
      }
    },
    components: {
      MusicList
    },
    computed: {
      ...mapGetters(['topList']),
      title(){
        return this.topList.topTitle;
      },
      bgImage(){
        if (this.songs.length) {
          //返回第一首歌的图片
          return this.songs[0].image;
        }
        return "";
      }
    },
    methods: {
      _getMusicList(){
        if (!this.topList.id) {
          this.$router.push('/rank');
          return
        }
        getMusicList(this.topList.id).then((res) => {
          if (res.code === ERR_OK) {
            this.songs = this._normalizeSongs(res.songlist);
          }
        });
      },
      //数据格式处理
      _normalizeSongs(list){
        let ret = []
        list.forEach((item) => {
          const musicData = item.data
          if (musicData.songid && musicData.albummid) {
            ret.push(createSong(musicData))
          }
        })
        return ret;
      }
    },
    created(){
      this._getMusicList();
    }
  }
</script>

<style scoped lang="stylus" rel="stylesheet/stylus">
  .slide-enter-active, .slide-leave-active
    transition: all 0.3s ease

  .slide-enter, .slide-leave-to
    transform: translate3d(100%, 0, 0)
</style>
