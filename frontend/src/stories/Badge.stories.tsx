import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "@/components/ui/badge";

const meta: Meta<typeof Badge> = {
  title: "Components/Badge",
  component: Badge,
};

export default meta;

type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: { children: "Badge" },
};

export const Secondary: Story = {
  args: { variant: "secondary", children: "Secondary" },
};

export const Destructive: Story = {
  args: { variant: "destructive", children: "Destructive" },
};

export const Outline: Story = {
  args: { variant: "outline", children: "Outline" },
};

export const Green: Story = {
  args: { variant: "green", children: "Active" },
};

export const Blue: Story = {
  args: { variant: "blue", children: "Info" },
};

export const Amber: Story = {
  args: { variant: "amber", children: "Warning" },
};

export const WithCount: Story = {
  args: { variant: "blue", children: "Items", count: 5 },
};

export const WithClose: Story = {
  args: { variant: "secondary", children: "Closeable" },
  render: (args) => <Badge {...args} onClose={() => {}} />,
};
