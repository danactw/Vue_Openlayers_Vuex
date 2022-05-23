<template>
  <div v-for="item in items" :key="item" class="groupContainer">
    <input :id="item" type="radio" :value="item"  v-model="$store.state.currentProjection">
    <label :for="item"> {{ item }} </label><br>
  </div>
</template>

<script>
export default {
  props: {
    items: Array
  }
}
</script>

<style>
.groupContainer {
  margin: 15px 5px;
}
</style>