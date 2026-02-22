import { createBrowserRouter, RouterProvider as Provider } from "react-router";
import { routesConfig } from "@/app/pages/routes.tsx";

const router = createBrowserRouter(routesConfig);

export const RouterProvider = () => {
    return <Provider router={router} />;
};
