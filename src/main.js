import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { createVuestic } from "vuestic-ui";
import "vuestic-ui/css";
import "material-design-icons-iconfont/dist/material-design-icons.css";
import replicache from "./replicache/replicache";

const app = createApp(App);

app.use(router);
app.use(
  createVuestic({
    icons: { defaultSet: "mdi", aliases: [], sets: ["mdi"] },
  })
);

// verif si on est bien dans un environnement Electron
if (window && window.electron) {
  app.config.globalProperties.$electron = window.electron;
}
app.use(replicache);

app.mount("#app");
