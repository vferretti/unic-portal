import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/base/ui/tooltip";
import "./app.css";
import "@/lib/i18n";
import Root from "./root";
import Resources from "./routes/resources";
import Catalog from "./routes/catalog";
import CatalogExploration from "./routes/catalog-exploration";
import Cart from "./routes/cart";
import Home from "./routes/home";
import { LandingPage } from "@/components/feature/landing-page";
import { CartProvider } from "@/contexts/cart-context";

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
  {
    path: "/cart",
    element: <Root />,
    children: [
      {
        index: true,
        element: <Cart />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="light">
      <TooltipProvider>
        <CartProvider>
          <RouterProvider router={router} />
        </CartProvider>
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>,
);
