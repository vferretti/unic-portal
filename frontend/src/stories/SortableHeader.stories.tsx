import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "@storybook/test";
import { SortableHeader } from "@/components/ui/sortable-header";

const meta: Meta<typeof SortableHeader> = {
  title: "Components/SortableHeader",
  component: SortableHeader,
};

export default meta;

type Story = StoryObj<typeof SortableHeader>;

export const Unsorted: Story = {
  args: { children: "Name", sortDirection: null, onSort: fn() },
};

export const Ascending: Story = {
  args: { children: "Name", sortDirection: "asc", onSort: fn() },
};

export const Descending: Story = {
  args: { children: "Name", sortDirection: "desc", onSort: fn() },
};
