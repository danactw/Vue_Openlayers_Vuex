<template>
  <div id="map" class="drawmap" ref="mapContainer"></div>
  <div class="interaction">
    <SelectOption :selection="interactionType" itemRef="interactionType"/>
    <SelectOption :selection="drawType" itemRef="drawType"/>
  </div>
</template>

<script>
import { shallowRef, onMounted, markRaw, watchEffect } from 'vue';
import SelectOption from '@/components/SelectOption.vue';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
// import GeoJSON from 'ol/format/GeoJSON';
import { Draw } from 'ol/interaction';
// import { Draw, Modify, Select, Translate } from 'ol/interaction';
import { Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style';
import { useStore } from 'vuex';

export default {
  components: { SelectOption },
  setup() {
    const store = useStore()
    const mapContainer = shallowRef(null);
    const map = shallowRef(null);
    const interactionType = ['Draw', 'Select', 'Translate', 'Modify']
    const drawType = ['Point', 'LineString', 'Circle', 'Polygon']

    const vectorStyle = {
      'Point': new Style({
        image: new CircleStyle({
          radius: 5,
          fill: new Fill({
            color: '#ffcc33',
          }),
        })
      }),
      'LineString': new Style({
        stroke: new Stroke({
          color: 'blue',
          width: 2
        })
      }),
      'Polygon': new Style({
        fill: new Fill({
          color: 'rgba(0, 153, 0, 0.3)'
        }),
        stroke: new Stroke({
          color: 'rgba(0, 153, 0,1)',
          width: 2
        }),
      }),
      'Circle': new Style({
        fill: new Fill({
          color: 'rgba(255, 128, 128,0.5)'
        }),
        stroke: new Stroke({
          color: 'rgba(255, 128, 128,1)',
          width: 2
        }),
      }),
    }

    const styleFunction = function (feature) {
      return vectorStyle[feature.getGeometry().getType()];
    };

    const newFeature = new VectorLayer({
      source: new VectorSource(),
      style: styleFunction,
    })

    const draws = []
    for (let i = 0; i < drawType.length ; i++ ) {
      draws.push(
        new Draw({
        type: drawType[i],
        source: newFeature.getSource()
      })
      )
    }

    watchEffect(() => {
      const currentDrawType = store.state.selectOptions['drawType']
      const currentDrawTypeIndex = drawType.indexOf(currentDrawType)
      for (let i = 0; i < drawType.length ; i++ ) {
        if (i===currentDrawTypeIndex) {
          draws[i].setActive(true)
        } else draws[i].setActive(false)
      }
    })

    onMounted(() => {
      map.value = markRaw(new Map({
        layers: [
          new TileLayer({
            source: new OSM(),
          }),
          newFeature
        ],
        target: 'map',
        view: new View({
          center: [0, 0],
          zoom: 2,
        }),
      }))
      draws.forEach(draw=> {
        if (map.value) map.value.addInteraction(draw)
      })
    })

    return { map, mapContainer, interactionType, drawType }
  }
}
</script>

<style>
.drawmap {
  width: 95vw;
  height: 80vh;
  margin: 10px auto 5px;
}

.interaction {
  margin-left: 30px;
}
</style>