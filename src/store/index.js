import { createStore } from 'vuex'

export default createStore({
  state: {
    baseLayersTitle: [],
    baseLayersVisibility: 'OSM Standard',
    baseLayersOpacity: 1,
  },
  getters: {
  },
  mutations: {
    ADD_BaseLayersTitle(state, title) {
      state.baseLayersTitle.push(title)
    }
  },
  actions: {
    getBaseLayersTitle({ commit }, baseLayers) {
      baseLayers.forEach(layer => {
        commit('ADD_BaseLayersTitle', layer.get('title'))
      })
    }
  },
  modules: {
  }
})
