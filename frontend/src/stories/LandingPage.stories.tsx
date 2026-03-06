import type { Meta, StoryObj } from "@storybook/react-vite";
import { LandingPage } from "@/components/feature/landing-page";

const meta: Meta<typeof LandingPage> = {
  title: "Pages/Landing Page",
  component: LandingPage,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof LandingPage>;

export const Default: Story = {};
