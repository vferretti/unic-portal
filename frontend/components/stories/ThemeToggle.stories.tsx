import type { Meta, StoryObj } from "@storybook/react-vite";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const meta: Meta<typeof ThemeToggle> = {
  title: "Components/ThemeToggle",
  component: ThemeToggle,
};

export default meta;

type Story = StoryObj<typeof ThemeToggle>;

export const Default: Story = {};
