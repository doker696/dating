<template>

</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { Store } from 'vuex';
import { readUserProfile } from '@/store/main/getters';
import { dispatchUserLogOut } from '@/store/main/actions';

@Component
export default class Dashboard extends Vue {

}
</script>

<style scoped>

</style>