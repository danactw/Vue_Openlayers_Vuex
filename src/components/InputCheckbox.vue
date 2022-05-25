<template>
  <li>
    <input :id="item.title" type="checkbox" v-model="item.checked" />
    <label :for="item.title"> {{ item.title }} </label>
  </li>
</template>

<script>
export default {
  props: {
    item: Object
  }
}
</script>

<style>
li {
  list-style: none;
  margin-top: 10px;
}
</style>