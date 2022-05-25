<template>
  <span>Use the ↑ up and ↓ down arrow keys to adjust the spyglass size.</span>
  <input id="topSwipe" type="range" style="width: 100%" v-model="topSwipe">
  <div id="map" class="fullMap" ref="mapContainer"></div>
  <input id="bottomSwipe" type="range" style="width: 100%" v-model="bottomSwipe">
</template>

<script>
import { shallowRef, onMounted, markRaw, ref, watch } from 'vue';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import { OSM, BingMaps } from 'ol/source';
import { Tile as TileLayer } from 'ol/layer';
import { getRenderPixel } from 'ol/render';

export default {
  setup() {
    const mapContainer = shallowRef(null);
    const map = shallowRef(null);
    const topSwipe = ref(20)
    const bottomSwipe = ref(80)
    const mousePosition = ref(null)
    const spyRadius = ref(75)

    const BingMap = new TileLayer({
      source: new BingMaps({
        key: "Ak6hRbflYvuARcql-hA_RTu20jkC6UQGDi4PLkJ1vOHrD30DD-1et3-N3DSohoPA",
        imagerySet: "AerialWithLabelsOnDemand"
      })
    });

    const OSMHumanitarian = new TileLayer({
      source: new OSM({
        url: "https://{a-c}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
        maxZoom: 20,
      }),
    });

    OSMHumanitarian.on('prerender', function (event) {
      const ctx = event.context;
      const mapSize = map.value.getSize();
      const topWidth = mapSize[0] * (topSwipe.value / 100);
      const bottomWidth = mapSize[0] * (bottomSwipe.value / 100);
      const topLeft = getRenderPixel(event, [topWidth, 0]);
      const topRight = getRenderPixel(event, [mapSize[0], 0]);
      const bottomLeft = getRenderPixel(event, [bottomWidth, mapSize[1]]);
      const bottomRight = getRenderPixel(event, mapSize);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(topLeft[0], topLeft[1]);
      ctx.lineTo(bottomLeft[0], bottomLeft[1]);
      ctx.lineTo(bottomRight[0], bottomRight[1]);
      ctx.lineTo(topRight[0], topRight[1]);
      ctx.closePath();
      ctx.clip();
    });

    OSMHumanitarian.on('postrender', function (event) {
      const ctx = event.context;
      ctx.restore();
    });

    BingMap.on('prerender', function (event) {
      const ctx = event.context;
      ctx.save();
      ctx.beginPath();
      if (mousePosition.value) {
        // only show a circle around the mouse
        const pixel = getRenderPixel(event, mousePosition.value);
        const offset = getRenderPixel(event, [
          mousePosition.value[0] + spyRadius.value,
          mousePosition.value[1],
        ]);
        const canvasRadius = Math.sqrt(
          Math.pow(offset[0] - pixel[0], 2) + Math.pow(offset[1] - pixel[1], 2)
        );
        ctx.arc(pixel[0], pixel[1], canvasRadius, 0, 2 * Math.PI);
        ctx.lineWidth = (5 * canvasRadius) / spyRadius.value;
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.stroke();
      }
      ctx.clip();
    });

    BingMap.on('postrender', function (event) {
      const ctx = event.context;
      ctx.restore();
    });

    onMounted(() => {
      map.value = markRaw(new Map({
        layers: [
          new TileLayer({
            source: new OSM(),
          }),
          OSMHumanitarian,
          BingMap,
        ],
        target: 'map',
        view: new View({
          center: [0, 0],
          zoom: 2,
        }),
      }))

      document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp') {
          spyRadius.value = Math.min(spyRadius.value + 5, 150);
          map.value.render();
          e.preventDefault()
        } else if (e.key === 'ArrowDown') {
          spyRadius.value = Math.max(spyRadius.value - 5, 25);
          map.value.render();
          e.preventDefault()
        }
      })

      map.value.on('pointermove', (e) => {
        const XBorder = map.value.getSize()[0]-75
        const YBorder = map.value.getSize()[1]-75
        if (e.pixel[0] < 75 || e.pixel[0] > XBorder || e.pixel[1] < 75 || e.pixel[1] > YBorder) mousePosition.value = null
        else mousePosition.value = e.pixel
        map.value.render();
      })

      const listener = function () {
        map.value.render();
      };

      watch(() => topSwipe.value, listener)
      watch(() => bottomSwipe.value, listener)

    })


  return { map, mapContainer, topSwipe, bottomSwipe }
}
}
</script>

<style>
.fullMap {
  width: 95vw;
  height: 80vh;
  margin: 10px auto 5px;
}
</style>