import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import './assets/styles/main.css';
import i18n from './i18n';

// Bootstrap CSS (keep only one)
import 'bootstrap/dist/css/bootstrap.min.css';

// Bootstrap JS — this is the correct, official way for Vite + Vue 3
import * as bootstrap from 'bootstrap';

// Expose to window (required for data-bs-toggle to work)
window.bootstrap = bootstrap;

// Bootstrap Icons
import 'bootstrap-icons/font/bootstrap-icons.css';

// FontAwesome
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faSearch, faSort } from '@fortawesome/free-solid-svg-icons';

library.add(faSearch, faSort);

createApp(App)
  .use(router)
  .use(store)
  .use(i18n)
  .component('font-awesome-icon', FontAwesomeIcon)  // if you use <font-awesome-icon>
  .mount('#app');