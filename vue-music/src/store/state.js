/**
 * Created by Administrator on 2018/1/5.
 */
import {playMode} from 'common/js/config'
import {loadSearch,loadPlay,loadFavorite} from 'common/js/cache'
const state = {
  singer: {},
  playing: false,
  fullScreen: false,
  playlist: [],//默认的歌单列表
  sequenceList: [],//播放模式下的歌单列表
  mode: playMode.sequence,
  currentIndex: -1,
  disc: {},
  topList:[],
  searchHistory:loadSearch(),//搜索历史
  playHistory:loadPlay(),//播放历史 从local里取
  favoriteList:loadFavorite()//收藏列表
}
export default state
