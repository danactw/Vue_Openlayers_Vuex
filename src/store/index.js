import { createStore } from 'vuex'

export default createStore({
  state: {
    inputRadio: {
      currentProjection: 'EPSG:4326',
      interactionType: 'Scale and Rotate',
      vectorLayersVisibility: 'Countries',
    },
    selectOptions: {
      currentCenter: 'world',
      bingMapStyle: 'RoadOnDemand',
      drawType: 'Point',
      vectorSelectType: 'Single Select'
    },
    baseLayersTitle: [],
    baseLayersVisibility: 'OSM Standard',
    baseLayersOpacity: 1,
    optionalLayers: [],
    displayedMapControls: ['Attribution', 'FullScreen', 'OverviewMap', 'ScaleLine', 'ZoomSlider', 'ZoomToExtent'],
    selectedOptionToDraw: ['Measure'],
    vectorLayersTitle: [],
  },
  mutations: {
    ADD_BaseLayersTitle(state, title) {
      if (!state.baseLayersTitle.includes(title))
      state.baseLayersTitle.push(title)
    },
    ADD_OptionalLayers(state, layer) {
      state.optionalLayers.push(layer)
    },
    ADD_VectorLayersTitle(state, title) {
      if (!state.vectorLayersTitle.includes(title))
      state.vectorLayersTitle.push(title)
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
    getVectorLayersTitle({ commit }, vectorLayers) {
      vectorLayers.forEach(layer => {
        commit('ADD_VectorLayersTitle', layer.get('title'))
      })
    },
  },
  modules: {
  }
})
