<template>
  <li>
    <input :id="item.title" type="checkbox" v-model="item.checked" />
    <label :for="item.title" class="checkboxItem"> {{ item.title }} </label>
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
  margin: 15px 5px;
}

.checkboxItem {
  margin-left: 5px;
}
</style>