// App router. Hash history so a refresh on /#/academy works under static
// serving with no server-side route config. The dashboard is the home route;
// the Academy is lazy-loaded so its 52 content files stay out of the main bundle.
import { createRouter, createWebHashHistory } from "vue-router";
import Dashboard from "../components/Dashboard.vue";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", name: "dashboard", component: Dashboard },
    {
      path: "/academy",
      name: "academy",
      component: () => import("../academy/components/AcademyPage.vue"),
    },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

export default router;
