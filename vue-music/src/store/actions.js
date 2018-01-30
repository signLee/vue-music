/**
 * Created by Administrator on 2018/1/5.
 */
import * as types from './mutation-types'
import {playMode} from 'common/js/config'
import {shuffle} from 'common/js/util'
import {saveSearch, deleteSearch, clearSearch, savePlay, saveFavorite, deleteFavorite} from 'common/js/cache'

function findIndex(list, song) {
  return list.findIndex((item) => {
    return item.id == song.id;
  })
}

//选择播放
export const selectPlay = function ({commit, state}, {list, index}) {
  commit(types.SET_SEQUENCE_LIST, list);
  //随机播放
  if (state.mode === playMode.random) {
    let randomlist = shuffle(list);
    commit(types.SET_PLAYLIST, randomlist);
    index = findIndex(randomlist, list[index])
  } else {
    commit(types.SET_PLAYLIST, list);
  }
  commit(types.SET_CURRENCY_INDEX, index);
  commit(types.SET_FULL_SCREEN, true);
  commit(types.SET_PLAYING_STATE, true);
}

//随机播放
export const randomPlay = function ({commit}, {list}) {
  commit(types.SET_PLAY_MODE, playMode.random);//播放模式
  commit(types.SET_SEQUENCE_LIST, list);
  let randomlist = shuffle(list);
  commit(types.SET_PLAYLIST, randomlist);
  commit(types.SET_CURRENCY_INDEX, 0);
  commit(types.SET_FULL_SCREEN, true);
  commit(types.SET_PLAYING_STATE, true);
}
//插入一首歌
export const insertSong = function ({commit, state}, song) {
  let playlist = state.playlist.slice();
  let sequenceList = state.sequenceList.slice();
  let currentIndex = state.currentIndex;
  let currentSong = playlist[currentIndex];//当前播放的歌曲
  let fpIndex = findIndex(playlist, song);//查找在搜索页点击的歌曲是否在当前播放列表
  currentIndex++;//插入到当前播放歌曲的下一首
  playlist.splice(currentIndex, 0, song);
  //如果插入之前已经包含了这首歌
  if (fpIndex > -1) {
    //如果当前歌曲在找到的歌曲的之后
    if (currentIndex > fpIndex) {
      playlist.splice(fpIndex, 1);//删除已有的歌曲
      currentIndex--;
    } else {
      //如果当前歌曲在找到的歌曲之前
      playlist.splice(fpIndex + 1, 1);//删除已有的歌曲  由于之前已经插入了搜索到的歌曲 index已经加1了所以删除的时候也需要fpIndex+1
    }
  }
  let currentSIndex = findIndex(sequenceList, currentSong) + 1;//当前播放列表要插入的歌曲的位置 当前播放歌曲的下一首
  let fsIndex = findIndex(sequenceList, song);//在播放列表查找搜索到的歌曲
  sequenceList.splice(currentSIndex, 0, song)//在当前播放列表插入查找到的歌曲
  if (fsIndex > -1) {
    //当前播放列表有搜索到的歌曲
    if (currentSIndex > fsIndex) {
      //插入的歌曲在之前歌曲的后面
      sequenceList.splice(fsIndex, 1);//删除已有歌曲
    } else {
      sequenceList.splice(fsIndex + 1, 1)//由于上面已插入查找的的歌曲
    }
  }
  commit(types.SET_PLAYLIST, playlist);
  commit(types.SET_SEQUENCE_LIST, sequenceList);
  commit(types.SET_CURRENCY_INDEX, currentSIndex);
  commit(types.SET_FULL_SCREEN, true);
  commit(types.SET_PLAYING_STATE, true);
}
//提交mutations的时候存储localstorage
export const saveSearchHistory = function ({commit}, query) {
  commit(types.SET_SEARCH_HISTORY, saveSearch(query))
}
//删除一条搜索结果
export const deleteSearchHistory = function ({commit}, query) {
  commit(types.SET_SEARCH_HISTORY, deleteSearch(query))
}
//删除所有搜索数据
export const clearSearchHistory = function ({commit}) {
  commit(types.SET_SEARCH_HISTORY, clearSearch())
}

export const deleteSong = function ({commit, state}, song) {
  let playlist = state.playlist.slice();
  let sequenceList = state.sequenceList.slice();
  let currentIndex = state.currentIndex;
  let pIndex = findIndex(playlist, song);//被删除的歌曲
  playlist.splice(pIndex, 1);
  let sIndex = findIndex(sequenceList, song);
  sequenceList.splice(sIndex, 1);

  if (currentIndex > pIndex || currentIndex === playlist.length) {
    currentIndex--;
  }

  commit(types.SET_PLAYLIST, playlist);
  commit(types.SET_SEQUENCE_LIST, sequenceList);
  commit(types.SET_CURRENCY_INDEX, currentIndex);

  //如果删除歌曲后歌曲列表为空  停止播放
  const playingState = playlist.length > 0;
  commit(types.SET_PLAYING_STATE, playingState);
}
export const deleteSongList = function ({commit}) {
  commit(types.SET_PLAYLIST, []);
  commit(types.SET_SEQUENCE_LIST, []);
  commit(types.SET_CURRENCY_INDEX, -1);
  commit(types.SET_PLAYING_STATE, false);
}
export const savePlayHistory = function ({commit}, song) {
  commit(types.SET_PLAY_HISTORY, savePlay(song));
}

//点击收藏功能
export const saveFavoriteList = function ({commit}, song) {
  commit(types.SET_FAVORITE_LIST, saveFavorite(song));
}

//取消收藏功能
export const deleteFavoriteList = function ({commit}, song) {
  commit(types.SET_FAVORITE_LIST, deleteFavorite(song));
}

