import type { Meta, StoryObj } from "@storybook/react-vite";
import { action } from "storybook/actions";
import { SortableHeader } from "@/components/ui/sortable-header";

const meta: Meta<typeof SortableHeader> = {
  title: "Components/SortableHeader",
  component: SortableHeader,
};

export default meta;

type Story = StoryObj<typeof SortableHeader>;

export const Unsorted: Story = {
  args: { children: "Name", sortDirection: null, onSort: action("sort") },
};

export const Ascending: Story = {
  args: { children: "Name", sortDirection: "asc", onSort: action("sort") },
};

export const Descending: Story = {
  args: { children: "Name", sortDirection: "desc", onSort: action("sort") },
};
