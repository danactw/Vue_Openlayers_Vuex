import { createStore } from 'vuex'

export default createStore({
  state: {
    projectionsTitle: [],
    inputRadio: {
      currentProjection: 'EPSG:4326',
      interactionType: 'Draw'
    },
    centerOptions: [],
    selectOptions: {
      currentCenter: 'world',
      bingMapStyle: 'RoadOnDemand',
      interactionType: 'Draw',
      drawType: 'Point'
    },
    baseLayersTitle: [],
    baseLayersVisibility: 'OSM Standard',
    baseLayersOpacity: 1,
    optionalLayers: [],
    mapControls: [],
    addOptionToDraw: [
      {title: 'Measure', checked: true},
      {title: 'Measure Segment Length', checked: false},
      {title: 'Clear Previous Feature', checked: false},
    ]
  },
  mutations: {
    ADD_ProjectionsTitle(state, title) {
      state.projectionsTitle.push(title)
    },
    ADD_CenterOptions(state, title) {
      state.centerOptions.push(title)
    },
    ADD_BaseLayersTitle(state, title) {
      if (!state.baseLayersTitle.includes(title))
      state.baseLayersTitle.push(title)
    },
    ADD_OptionalLayers(state, layer) {
      state.optionalLayers.push(layer)
    },
    ADD_MapControls(state, control) {
      state.mapControls.push(control)
    },
  },
  actions: {
    getProjectionsTitle({ commit }, views) {
      views.forEach(view => {
        commit('ADD_ProjectionsTitle', view.getProjection().getCode())
      })
    },
    getCenterOptions({ commit }, views) {
      views.forEach(view => {
        commit('ADD_CenterOptions', view.get('title'))
      })
    },
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
    getMapControls({ commit }, mapControls) {
      mapControls.forEach(control => {
        const controlItem = {title: control.constructor.name, checked: true }
        commit('ADD_MapControls', controlItem)
      })
    },
  },
  modules: {
  }
})
