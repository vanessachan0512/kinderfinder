import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import './assets/styles/main.css';
import i18n from './i18n';
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

import 'bootstrap/dist/css/bootstrap.min.css'
import * as bootstrap from 'bootstrap'
window.bootstrap = bootstrap

// Bootstrap Icons
import 'bootstrap-icons/font/bootstrap-icons.css';

// FontAwesome
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faSearch, faSort } from '@fortawesome/free-solid-svg-icons';

library.add(faSearch, faSort);

createApp(App)
  .use(pinia) 
  .use(router)
  .use(store)
  .use(i18n)
  .component('font-awesome-icon', FontAwesomeIcon)  // if you use <font-awesome-icon>
  .mount('#app');