<template>
  <div class="gridContainer">
    <div class="grid1">
      <div class="sidebar">
        <h2>Base Layer</h2>
        <BaseLayers />
      </div>
    </div>
    <div class="grid2">
      <div id="map" class="map" ref="mapContainer"></div>
    </div>
  </div>
</template>

<script>
import { shallowRef, onMounted, markRaw, ref, watchEffect, watch } from 'vue';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import LayerGroup from 'ol/layer/Group';
import { Tile as TileLayer } from 'ol/layer';
import { OSM, XYZ, Stamen } from 'ol/source';
import { useStore } from 'vuex';
import BaseLayers from '../components/BaseLayers.vue';

export default {
  name: 'HomeView',
  components: {
    BaseLayers
  },
  setup () {
    const store = useStore()
    const mapContainer = shallowRef(null);
    const map = shallowRef(null);
    // Base Layers
    const OSMStandard = new TileLayer({
      source: new OSM(),
      visible: true,
      opacity: 1,
      zIndex: 0,
      title: "OSM Standard"
    });
    const OSMHumanitarian = new TileLayer({
      source: new OSM({
          url: "https://{a-c}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
      }),
      visible: false,
      opacity: 0,
      zIndex: 0,
      title: "OSM Humanitarian"
    });
    const CartoDBBase = new TileLayer({
      source: new XYZ({
        url: "https://{1-4}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}.png",
        attributions: "@ CARTO"
      }),
      visible: false,
      opacity: 0,
      zIndex: 0,
      title: "CartoDB Base"
    });
    const StamenWater = new TileLayer({
      source: new Stamen({
          layer: "watercolor"
      }),
      visible: false,
      opacity: 0,
      zIndex: 0,
      title: "Stamen Water"
    });
    const baseLayers = ref([OSMStandard, OSMHumanitarian, CartoDBBase, StamenWater ]);
    const baseLayerGroup = new LayerGroup({
        layers: baseLayers.value
    });

    store.dispatch('getBaseLayersTitle', baseLayers.value)

    watch(()=>store.state.baseLayersVisibility, ()=>{
      store.state.baseLayersOpacity = 1
    })

    watchEffect(() => {
      baseLayerGroup.getLayers().forEach(layer => {
        const layerTitle = layer.get("title");
        const opacity = parseFloat(store.state.baseLayersOpacity)
        if (layerTitle === store.state.baseLayersVisibility) {
          layer.setVisible(true)
          layer.setOpacity(opacity)
        } else {
          layer.setVisible(false)
        }
      })
    })

    onMounted(() => {
      map.value = markRaw(new Map({
        layers: [ baseLayerGroup ],
        target: 'map',
        view: new View({
          center: [0, 0],
          zoom: 2,
        }),
      }))
    })

    return { map, mapContainer }
  }
}
</script>

<style>
.gridContainer {
  display: grid;
  grid-template-columns: 20vw 75vw 5vw;
  grid-template-rows: 100vh;
}

.sidebar {
  padding-left: 30px;
  height: 80%;
  overflow: scroll;
}

.sidebar h2:hover{
  transform: translateY(1px);
  cursor: pointer;
}

ul {
  list-style: none;
  padding: 0;
}

.map {
  width: 95%;
  height: 80%;
  margin: auto;
}
</style>
