import type { Meta, StoryObj } from "@storybook/react-vite";
import { LangSwitcher } from "@/components/layout/lang-switcher";

const meta: Meta<typeof LangSwitcher> = {
  title: "Components/LangSwitcher",
  component: LangSwitcher,
};

export default meta;

type Story = StoryObj<typeof LangSwitcher>;

export const Default: Story = {};
