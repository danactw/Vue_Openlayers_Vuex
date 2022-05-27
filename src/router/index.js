import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import InteractionsMap from '../views/InteractionsMap.vue'
import SwipeMap from '../views/SwipeMap.vue'
import ClusterMap from '../views/ClusterMap.vue'
import DrawMap from '../views/DrawMap.vue'
import VectorMap from '../views/VectorMap.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView
  },
  {
    path: '/interactions',
    name: 'InteractionsMap',
    component: InteractionsMap
  },
  {
    path: '/swipe',
    name: 'SwipeMap',
    component: SwipeMap
  },
  {
    path: '/cluster',
    name: 'ClusterMap',
    component: ClusterMap
  },
  {
    path: '/draw',
    name: 'DrawMap',
    component: DrawMap
  },
  {
    path: '/vector',
    name: 'VectorMap',
    component: VectorMap
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
