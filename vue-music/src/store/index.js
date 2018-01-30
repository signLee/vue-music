/**
 * Created by Administrator on 2018/1/5.
 */
import Vue from 'vue'
import Vuex from 'vuex'
import * as actions from './actions'
import * as getters from './getters'
import state from './state'
import mutations from './mutations'
import createLogger from 'vuex/dist/logger'

Vue.use(Vuex);
//调试工具 只在开发环境开启  开启会有性能损耗 build后变成生成环境了
const debug=process.env.NODE_ENV!=='production'

export  default new Vuex.Store({
  actions,
  getters,
  state,
  mutations,
  strict:debug,
  plugins:debug?[createLogger()]:[],//控制台插件
})
