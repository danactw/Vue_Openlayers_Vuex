<template> 
  <div class="gridContainer">
    <div class="grid1">
      <div class="sidebar">
        <h2>Interactions</h2>
        <InputRadio :items="interactionType" itemRef="interactionType"/>
        <h2>Draw Type</h2>
        <SelectOption :selection="drawType" itemRef="drawType"/>
        <h2>Additional</h2>
        <span>
          <button @click="clearLastFeature" class="btn">Undo</button>
          <button @click="clearAllFeatures" class="btn">Clear All</button>
        </span>
        <InputCheckbox v-for="option in addOptionToDraw" :key="option" :item="option" />
      </div>
    </div>
    <div class="grid2">
      <div id="map" class="map" ref="mapContainer"></div>
    </div>
  </div>
</template>

<script>
import { shallowRef, onMounted, markRaw, watchEffect } from 'vue';
import SelectOption from '@/components/SelectOption.vue';
import InputRadio from '@/components/InputRadio.vue';
import InputCheckbox from '@/components/InputCheckbox.vue';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
// import GeoJSON from 'ol/format/GeoJSON';
import { Draw, Modify, Select, Translate } from 'ol/interaction';
import { Circle as CircleStyle, Fill, Stroke, Style} from 'ol/style';
import { useStore } from 'vuex';

export default {
  components: { SelectOption, InputRadio, InputCheckbox },
  setup() {
    const store = useStore()
    const mapContainer = shallowRef(null);
    const map = shallowRef(null);
    const interactionType = ['Draw', 'Select', 'Translate', 'Modify']
    const drawType = ['Point', 'LineString', 'Circle', 'Polygon']
    const addOptionToDraw = [
      {title: 'Measure', checked: true},
      {title: 'Measure Segment Length', checked: false},
      {title: 'Clear Previous Feature', checked: false},
    ]

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

    const select = new Select({
      wrapX: false,
    });

    const translate = new Translate({
      features: select.getFeatures() 
    })

    const modify = new Modify({
      features: select.getFeatures(),
    });

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

    return { map, mapContainer, interactionType, drawType, addOptionToDraw }
  }
}
</script>

<style>
.btn {
  padding: 5px;
  margin-right: 15px;
  cursor: pointer;
  display: inline-block;
  border: none;
  height: 40px;
  font-size: 18px;
}

.btn:hover {
  transform: translateY(1px);
}
</style>