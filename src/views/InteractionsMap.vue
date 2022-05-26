<template> 
  <div class="gridContainer">
    <div class="grid1">
      <div class="sidebar">
        <h2>Interactions</h2>
        <InputRadio :items="interactionType" itemRef="interactionType"/>
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
import GeoJSON from 'ol/format/GeoJSON';
import { Draw, Modify, Select, Translate, Snap } from 'ol/interaction';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import { useStore } from 'vuex';
import { Point, MultiPoint } from 'ol/geom';
import {never, platformModifierKeyOnly, primaryAction } from 'ol/events/condition';

export default {
  components: { SelectOption, InputRadio, InputCheckbox },
  setup() {
    const store = useStore()
    const mapContainer = shallowRef(null);
    const map = shallowRef(null);
    const interactionType = ['Draw', 'Translate', 'Modify', 'Scale and Rotate']

    const drawStyle = new Style({
      fill: new Fill({
        color: 'rgba(255, 255, 255, 0.2)',
      }),
      stroke: new Stroke({
        color: '#ffcc33',
        width: 2,
      }),
      image: new CircleStyle({
        radius: 7,
        fill: new Fill({
          color: '#ffcc33',
        }),
      }),
    });

    const modifyStyle = new Style({
      geometry: function (feature) {
        const modifyGeometry = feature.get('modifyGeometry');
        return modifyGeometry ? modifyGeometry.geometry : feature.getGeometry();
      },
      fill: new Fill({
        color: 'rgba(255, 100, 100, 0.2)',
      }),
      stroke: new Stroke({
        color: 'rgba(255, 100, 100, 0.5)',
        width: 2,
      }),
    });

    const centerStyle = new Style({
      image: new CircleStyle({
        radius: 4,
        fill: new Fill({
          color: 'rgba(255, 100, 100, 1)',
        }),
      }),
    })

    const pointStyle = new Style({
      image: new CircleStyle({
        radius: 4,
        fill: new Fill({
          color: 'rgba(50, 255, 255, 0.8)',
        }),
      }),
    })

    const styleFunction = (feature) => {
      const geometry = feature.getGeometry()
      const style = [modifyStyle]
      const { center, coordinates, minRadius, sqDistances } = calculateCenter(geometry)
      centerStyle.setGeometry(new Point(center))
      style.push(centerStyle)
      const points = coordinates.filter(function (coordinate, index) {
        return sqDistances[index] > minRadius*minRadius;
      });
      pointStyle.setGeometry(new MultiPoint(points))
      style.push(pointStyle)
      return style
    }

    const geojsonObject = {
      'type': 'FeatureCollection',
      'crs': {
        'type': 'name',
        'properties': {
          'name': 'EPSG:3857',
        },
      },
      'features': [
        {
          'type': 'Feature',
          'geometry': {
            'type': 'Polygon',
            'coordinates': [
              [
                [-5e6, 6e6],
                [-5e6, 8e6],
                [-3e6, 8e6],
                [-3e6, 6e6],
                [-5e6, 6e6],
              ],
            ],
          },
        },
        {
          'type': 'Feature',
          'geometry': {
            'type': 'Polygon',
            'coordinates': [
              [
                [-2e6, 6e6],
                [-2e6, 8e6],
                [0, 8e6],
                [0, 6e6],
                [-2e6, 6e6],
              ],
            ],
          },
        },
        {
          'type': 'Feature',
          'geometry': {
            'type': 'Polygon',
            'coordinates': [
              [
                [1e6, 6e6],
                [1e6, 8e6],
                [3e6, 8e6],
                [3e6, 6e6],
                [1e6, 6e6],
              ],
            ],
          },
        },
        {
          'type': 'Feature',
          'geometry': {
            'type': 'Polygon',
            'coordinates': [
              [
                [-2e6, -1e6],
                [-1e6, 1e6],
                [0, -1e6],
                [-2e6, -1e6],
              ],
            ],
          },
        },
      ],
    };

    const source = new VectorSource({
      features: new GeoJSON().readFeatures(geojsonObject),
    });

    const USLayer = new VectorLayer({
      source: new VectorSource({
        url: 'https://openlayers.org/data/vector/us-states.json',
        format: new GeoJSON(),
        wrapX: false,
      })
    });

    const newFeature = new VectorLayer({
      source: source,
      style: drawStyle,
    })

    function calculateCenter(geometry) {
      let center, coordinates, minRadius;
      const type = geometry.getType();
      if (type === 'Polygon') {
        let x = 0;
        let y = 0;
        let i = 0;
        coordinates = geometry.getCoordinates()[0].slice(1);
        coordinates.forEach(function (coordinate) {
          x += coordinate[0];
          y += coordinate[1];
          i++;
        });
        center = [x / i, y / i];
      } else if (type === 'LineString') {
        center = geometry.getCoordinateAt(0.5);
        coordinates = geometry.getCoordinates();
      } else {
        center = getCenter(geometry.getExtent());
      }
      let sqDistances;
      if (coordinates) {
        sqDistances = coordinates.map(function (coordinate) {
          const dx = coordinate[0] - center[0];
          const dy = coordinate[1] - center[1];
          return dx * dx + dy * dy;
        });
        minRadius = Math.sqrt(Math.max.apply(Math, sqDistances)) / 3;
      } else {
        minRadius =
          Math.max(
            getWidth(geometry.getExtent()),
            getHeight(geometry.getExtent())
          ) / 3;
      }
      return { center, coordinates, minRadius, sqDistances };
    }

    watchEffect(() => {
      if (store.state.inputRadio['interactionType'] === 'Scale and Rotate') {
        newFeature.setStyle(styleFunction)
        if (map.value) map.value.addInteraction(scaleAndRotate)
      } else {
        newFeature.setStyle(drawStyle)
        if (map.value) map.value.removeInteraction(scaleAndRotate)
      }
    })

    const defaultStyle = new Modify({source: source})
      .getOverlay()
      .getStyleFunction();

    const scaleAndRotate = new Modify({
      source: source,
      condition: function (event) {
        return primaryAction(event) && !platformModifierKeyOnly(event);
      },
      deleteCondition: never,
      insertVertexCondition: never,
      style: function (feature) {
        feature.get('features').forEach(function (modifyFeature) {
          const modifyGeometry = modifyFeature.get('modifyGeometry');
          if (modifyGeometry) {
            const point = feature.getGeometry().getCoordinates();
            let modifyPoint = modifyGeometry.point;
            if (!modifyPoint) {
              // save the initial geometry and vertex position
              modifyPoint = point;
              modifyGeometry.point = modifyPoint;
              modifyGeometry.geometry0 = modifyGeometry.geometry;
              // get anchor and minimum radius of vertices to be used
              const result = calculateCenter(modifyGeometry.geometry0);
              modifyGeometry.center = result.center;
              modifyGeometry.minRadius = result.minRadius;
            }

            const center = modifyGeometry.center;
            const minRadius = modifyGeometry.minRadius;
            let dx, dy;
            dx = modifyPoint[0] - center[0];
            dy = modifyPoint[1] - center[1];
            const initialRadius = Math.sqrt(dx * dx + dy * dy);
            if (initialRadius > minRadius) {
              const initialAngle = Math.atan2(dy, dx);
              dx = point[0] - center[0];
              dy = point[1] - center[1];
              const currentRadius = Math.sqrt(dx * dx + dy * dy);
              if (currentRadius > 0) {
                const currentAngle = Math.atan2(dy, dx);
                const geometry = modifyGeometry.geometry0.clone();
                geometry.scale(currentRadius / initialRadius, undefined, center);
                geometry.rotate(currentAngle - initialAngle, center);
                modifyGeometry.geometry = geometry;
              }
            }
          }
        });
        return defaultStyle(feature);
      },
    });

    scaleAndRotate.on('modifystart',function (event) {
      event.features.forEach(function (feature) {
        feature.set(
          'modifyGeometry',
          {geometry: feature.getGeometry().clone()},
          true
        );
      });
    });

    scaleAndRotate.on('modifyend', function (event) {
      event.features.forEach(function (feature) {
        const modifyGeometry = feature.get('modifyGeometry');
        if (modifyGeometry) {
          feature.setGeometry(modifyGeometry.geometry);
          feature.unset('modifyGeometry', true);
        }
      });
    });

    let draw
    function addInteractions() {
      draw = new Draw({
        source: newFeature.getSource(),
        type: 'Polygon',
      });
      if (map.value) map.value.addInteraction(draw);
    }
    addInteractions()

    const select = new Select({
      wrapX: false,
    });
    const translate = new Translate({
      features: select.getFeatures(),
    })
    const modify = new Modify({
      features: select.getFeatures(),
    });
    const snap = new Snap({
      source: newFeature.getSource(),
      pixelTolerance: 15
    })

    function clearAllInteractions () {
      if (map.value) map.value.removeInteraction(draw)
      modify.setActive(false)
      translate.setActive(false)
      scaleAndRotate.setActive(false)
    }

    watchEffect(() => {
      clearAllInteractions()
      switch (store.state.inputRadio['interactionType']) {
        case 'Draw':
          addInteractions()
          break;
        case 'Modify':
          modify.setActive(true)
          break;
        case 'Translate':
          translate.setActive(true)
          break;
        case 'Scale and Rotate':
          scaleAndRotate.setActive(true)
          break;
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
          center: [-11036062.99394863, 4759762.370261724],
          zoom: 2,
        }),
      }))
      map.value.addInteraction(select)
      map.value.addInteraction(scaleAndRotate)
      map.value.addInteraction(modify)
      map.value.addInteraction(translate)
      map.value.addInteraction(snap)
    })

    return { map, mapContainer, interactionType }
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