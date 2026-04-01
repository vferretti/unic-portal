import type { Preview } from "@storybook/react-vite";
import React from "react";
import { I18nextProvider } from "react-i18next";
import { ThemeProvider } from "next-themes";
import { MemoryRouter } from "react-router";
import i18n from "../components/lib/i18n";
import "../app/app.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },
  },

  decorators: [
    (Story) => (
      <I18nextProvider i18n={i18n}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <MemoryRouter>
            <Story />
          </MemoryRouter>
        </ThemeProvider>
      </I18nextProvider>
    ),
  ],
};

export default preview;
