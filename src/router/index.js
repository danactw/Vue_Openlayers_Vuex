import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import DrawMap from '../views/DrawMap.vue'
import SwipeMap from '../views/SwipeMap.vue'
import ClusterMap from '../views/ClusterMap.vue'
import TestingMap from '../views/TestingMap.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView
  },
  {
    path: '/draw',
    name: 'DrawMap',
    component: DrawMap
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
    path: '/testing',
    name: 'TestingMap',
    component: TestingMap
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
