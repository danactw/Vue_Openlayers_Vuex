<template>
  <v-app>
    <v-app-bar app>
      <v-toolbar-title>Openlayers</v-toolbar-title>
      <v-btn v-for="link in routerLinks" :key="link" :to="{ name: link.pathName }" rounded> {{ link.title }} </v-btn>
    </v-app-bar>
    <v-main>
      <router-view/>
    </v-main>
  </v-app>
</template>

<script>
export default ({
  setup() {
    const routerLinks = [
      {pathName: 'Home', title: 'Main Map'},
      {pathName: 'DrawMap', title: 'Draw Map'},
      {pathName: 'InteractionsMap', title: 'Interactions Map'},
      {pathName: 'SwipeMap', title: 'Swipe Map'},
      {pathName: 'ClusterMap', title: 'Cluster Map'},
      {pathName: 'VectorMap', title: 'Vector Map'},
    ]

    return { routerLinks }
  },
})
</script>
