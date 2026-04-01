import type { Meta, StoryObj } from "@storybook/react-vite";
import { Navbar } from "@/components/layout/navbar";

const meta: Meta<typeof Navbar> = {
  title: "Components/Navbar",
  component: Navbar,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

type Story = StoryObj<typeof Navbar>;

export const Default: Story = {};
