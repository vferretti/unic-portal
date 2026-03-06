import type { Meta, StoryObj } from "@storybook/react-vite";
import { PageHeader } from "@/components/base/page/page-header";

const meta: Meta<typeof PageHeader> = {
  title: "Components/PageHeader",
  component: PageHeader,
};

export default meta;

type Story = StoryObj<typeof PageHeader>;

export const Default: Story = {
  args: { title: "Page Title" },
};

export const WithDescription: Story = {
  args: { title: "Page Title", description: "A short description of this page." },
};
