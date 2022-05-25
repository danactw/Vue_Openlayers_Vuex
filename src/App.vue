<template>
  <nav>
    <router-link :to="{ name: 'Home' }">Main Map</router-link> |
    <router-link :to="{ name: 'DrawMap' }">Draw Map</router-link> |
    <router-link :to="{ name: 'SwipeMap' }">Swipe Map</router-link> |
  </nav>
  <router-view />
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

nav {
  background-color: #eee;
  padding: 5px;
}

nav a {
  display: inline-block;
  font-weight: bold;
  text-decoration: none;
  color: #999;
  margin-left: 10px;
}

nav a:hover {
  transform: translateY(1px);
}

nav a.router-link-exact-active {
  color: black;
}
</style>
