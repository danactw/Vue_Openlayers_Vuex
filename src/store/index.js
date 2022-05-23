import { createStore } from 'vuex'

export default createStore({
  state: {
    baseLayersTitle: [],
    baseLayersVisibility: 'OSM Standard',
    baseLayersOpacity: 1,
    optionalLayers: []
  },
  getters: {
  },
  mutations: {
    ADD_BaseLayersTitle(state, title) {
      state.baseLayersTitle.push(title)
    },
    ADD_OptionalLayers(state, layer) {
      state.optionalLayers.push(layer)
    },

  },
  actions: {
    getBaseLayersTitle({ commit }, baseLayers) {
      baseLayers.forEach(layer => {
        commit('ADD_BaseLayersTitle', layer.get('title'))
      })
    },
    getOptionalLayers({ commit }, optionalLayers) {
      optionalLayers.forEach(layer => {
        const layerItem = {title: layer.get('title'), visibility: false, opacity: 1}
        commit('ADD_OptionalLayers', layerItem)
      })
    },
  },
  modules: {
  }
})
