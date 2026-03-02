import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { ThemeProvider } from "next-themes";
import "./index.css";
import "./lib/i18n";
import Root from "./routes/root";
import Resources from "./routes/resources";
import Catalog from "./routes/catalog";
import CatalogExploration from "./routes/catalog-exploration";
import Home from "./routes/home";
import { LandingPage } from "./components/ui/landing-page";

const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/home",
    element: <Root />,
    children: [
      {
        index: true,
        element: <Home />,
      },
    ],
  },
  {
    path: "/projects",
    element: <Root />,
    children: [
      {
        index: true,
        element: <Resources />,
      },
    ],
  },
  {
    path: "/catalog",
    element: <Root />,
    children: [
      {
        index: true,
        element: <Catalog />,
      },
    ],
  },
  {
    path: "/catalog/:type",
    element: <Root />,
    children: [
      {
        index: true,
        element: <CatalogExploration />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="light">
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>
);
