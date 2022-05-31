<template>
  <v-navigation-drawer>
    <v-list class="ma-4">
      <slot name="sidebar"></slot>
    </v-list>
  </v-navigation-drawer>
  <div id="map" class="map" ref="mapContainer"></div>
</template>