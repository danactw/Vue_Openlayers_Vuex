<template>
  <div class="gridContainer">
    <div class="grid1">
      <div class="sidebar">
        <h2>Projection</h2>
        <InputRadio :items="$store.state.projectionsTitle" />
        <div class="centerOption" v-show="$store.state.currentProjection==='EPSG:4326'">
          <h2>Center Options</h2>
          <SelectOption :selection="$store.state.centerOptions" itemRef="currentCenter" />
        </div>
        <h2>Base Layer</h2>
        <BaseLayers />
        <SelectOption :selection="BingMapstyles" itemRef="bingMapStyle" v-show="$store.state.baseLayersVisibility==='Bing Map'" />
        <div class="optionalLayers" v-show="$store.state.currentProjection==='EPSG:4326'">
          <h2>Optional Layers</h2>
          <OptionalLayers v-for="layer in $store.state.optionalLayers" :key="layer" :item="layer" />
        </div>
      </div>
    </div>
    <div class="grid2">
      <div id="map" class="map" ref="mapContainer"></div>
    </div>
  </div>
</template>

<script>
import { shallowRef, onMounted, markRaw, ref, watchEffect, watch } from 'vue';
import BaseLayers from '../components/BaseLayers.vue';
import InputRadio from '../components/InputRadio.vue';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import LayerGroup from 'ol/layer/Group';
import { Tile as TileLayer, Graticule } from 'ol/layer';
import { OSM, XYZ, BingMaps, Stamen, TileDebug, TileArcGISRest } from 'ol/source';
import { useStore } from 'vuex';
import { Stroke } from 'ol/style';
import OptionalLayers from '@/components/OptionalLayers.vue';
import {register} from 'ol/proj/proj4';
import SelectOption from '@/components/SelectOption.vue';

export default {
  name: 'HomeView',
  components: { BaseLayers, OptionalLayers, InputRadio, SelectOption },
  setup () {
    const store = useStore()
    const mapContainer = shallowRef(null);
    const map = shallowRef(null);

    // Projections
    proj4.defs("EPSG:3825","+proj=tmerc +lat_0=0 +lon_0=119 +k=0.9999 +x_0=250000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
    proj4.defs("EPSG:3828","+proj=tmerc +lat_0=0 +lon_0=121 +k=0.9999 +x_0=250000 +y_0=0 +ellps=aust_SA +units=m +no_defs");
    register(proj4)

    const view4326 = new View({
      center: [0,0],
      zoom: 2,
      projection: 'EPSG:4326',
      title: 'world'
    })

    const view3825 = new View({
      center: [449777.06920345523, 2627333.8306399807],
      zoom: 8,
      projection: 'EPSG:3825',
      extent: [-2999133.104097694, 964675.7340995013, 3315454.588596386, 4723103.034050384]
    })

    const view3828 = new View({
      center: [248543.19482292834, 2627444.4109558077],
      zoom: 8,
      projection: 'EPSG:3828',
      extent: [-2204326.3713591076, 1600739.6787269707, 2284692.1803829246, 4323813.554926154]
    })

    const views = [view4326, view3825, view3828]

    store.dispatch('getProjectionsTitle', views)

    watchEffect(() => {
      views.forEach(view => {
        const epsg = view.getProjection().getCode()
        if (store.state.currentProjection === epsg && map.value) map.value.setView(view)
      })
    })

    //Center & Extent
    const world = view4326
    const EU = new View({
      center: [13.485321538601092, 52.45287376584504],
      zoom: 6,
      projection: 'EPSG:4326',
      extent: [-20.29271371580824, 26.54340080769108, 53.84996605236901, 74.19590677224758],
      title: 'EU'
    })
    const US = new View({
      center: [-100.92362186261362, 38.13459946835709],
      zoom: 5,
      projection: 'EPSG:4326',
      extent: [-161.3272028668083, -8.82588222486288, -26.021063763766108, 77.91309264537576],
      title: 'US'
    })
    const China = new View({
      center: [106.5275015413533, 29.54261117376565],
      zoom: 5,
      projection: 'EPSG:4326',
      extent: [61.78506214514829, 6.01902547010458, 142.69036471860034, 57.383376800420855],
      title: 'China'
    })

    const centers = [world, EU, US, China]

    store.dispatch('getCenterOptions', centers)

    watchEffect(()=>{
      centers.forEach(center => {
        if (store.state.selectOptions['currentCenter']===center.get('title') && map.value) map.value.setView(center)
      })
    })

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
    const BingMapstyles = [
      'RoadOnDemand',
      'AerialWithLabelsOnDemand',
      'CanvasDark'
    ];
    const BingMap = []
    for (let i = 0; i < BingMapstyles.length ; i++ ) {
      BingMap.push(
        new TileLayer({
          source: new BingMaps({
            key: "Ak6hRbflYvuARcql-hA_RTu20jkC6UQGDi4PLkJ1vOHrD30DD-1et3-N3DSohoPA",
            imagerySet: BingMapstyles[i]
          }),
          visible: false,
          opacity: 0,
          zIndex: 0,
          title: "Bing Map"
        })
      )
    }
    watchEffect(()=>{
      if (store.state.baseLayersVisibility==='Bing Map') {
        BingMap.forEach(style => style.setVisible(style.getSource().getImagerySet()===store.state.selectOptions['bingMapStyle']))
      }
    })
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
    const baseLayers = ref([OSMStandard, OSMHumanitarian, CartoDBBase, StamenWater, ...BingMap ]);
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
          if (store.state.baseLayersVisibility==='Bing Map') {
            console.log('here');
            BingMap.map(style=>style.setOpacity(opacity))
          } else {
            layer.setVisible(true)
            layer.setOpacity(opacity)
          }
        } else {
          layer.setVisible(false)
        }
      })
    })

    // Optional Layers
    const tileDebug = new TileLayer({
      source: new TileDebug(),
      visible: false,
      opacity: 0,
      zIndex: 0,
      title: "Tile Debug"
    });
    const tileArcGIS = new TileLayer({
      source: new TileArcGISRest({
        url: "https://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Demographics/ESRI_Population_World/MapServer"
      }),
      visible: false,
      opacity: 0,
      zIndex: 0,
      title: "Tile ArcGIS"
    });
    const graticule = new Graticule({
      // the style to use for the lines, optional.
      strokeStyle: new Stroke({
        color: 'rgba(255,120,0,0.9)',
        width: 2,
        lineDash: [0.5, 4],
      }),
      visible: true,
      opacity: 0,
      zIndex: 0,
      showLabels: true,
      wrapX: false,
      title: 'Graticule'
    })

    const optionalLayers = ref([tileDebug, tileArcGIS, graticule ]);
    const optionalLayerGroup = new LayerGroup({
        layers: optionalLayers.value
    });

    store.dispatch('getOptionalLayers', optionalLayers.value)

    watchEffect(() => {
      if (store.state.currentProjection!=='EPSG:4326') store.state.optionalLayers.map(layer=>layer.visibility=false)
    })

    watchEffect(() => {
      optionalLayerGroup.getLayers().forEach(layer => {
        store.state.optionalLayers.forEach(stateLayer => {
          const layerTitle = layer.get("title")
          const opacity = parseFloat(stateLayer.opacity)
          if (stateLayer.title === layerTitle) {
            layer.setVisible(stateLayer.visibility)
            layer.setOpacity(opacity)
          }
        })
      })
    })

    onMounted(() => {
      map.value = markRaw(new Map({
        layers: [ baseLayerGroup, optionalLayerGroup ],
        target: 'map',
        view: view4326
      }))
    })

    return { map, mapContainer, BingMapstyles }
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
