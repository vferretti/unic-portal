import type { Meta, StoryObj } from "@storybook/react-vite";
import { Search, Inbox, FileX } from "lucide-react";
import { Empty } from "@/components/ui/empty";

const meta: Meta<typeof Empty> = {
  title: "Components/Empty",
  component: Empty,
  argTypes: {
    icon: {
      control: false,
    },
  },
};

export default meta;

type Story = StoryObj<typeof Empty>;

export const Default: Story = {
  args: {
    title: "No results found",
    description: "Try adjusting your search or filters.",
  },
};

export const WithCustomIcon: Story = {
  args: {
    title: "No data available",
    description: "There is no data to display at this time.",
    icon: Inbox,
  },
};

export const TitleOnly: Story = {
  args: {
    title: "No results found",
  },
};

export const FileNotFound: Story = {
  args: {
    title: "File not found",
    description: "The requested file could not be located.",
    icon: FileX,
  },
};
