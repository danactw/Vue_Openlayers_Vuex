<template>
  <div class="gridContainer">
    <div class="grid1">
      <div class="sidebar">
        <slot name="grid1-1"></slot>
      </div>
        <slot name="grid2-1"></slot>
    </div>
    <div class="grid2">
      <div id="map" class="map" ref="mapContainer"></div>
      <slot name="grid2-2"></slot>
    </div>
  </div>
</template>