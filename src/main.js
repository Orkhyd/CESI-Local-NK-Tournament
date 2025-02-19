import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import { createVuestic } from "vuestic-ui";
import "vuestic-ui/css";
import 'material-design-icons-iconfont/dist/material-design-icons.css';

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(createVuestic({ icons: { defaultSet: "mdi", aliases: [], sets: ["mdi"] } }));

app.mount('#app')
