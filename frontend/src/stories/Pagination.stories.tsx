import type { Meta, StoryObj } from "@storybook/react-vite";
import { action } from "storybook/actions";
import { PaginationBar } from "@/components/ui/pagination";

const meta: Meta<typeof PaginationBar> = {
  title: "Components/PaginationBar",
  component: PaginationBar,
};

export default meta;

type Story = StoryObj<typeof PaginationBar>;

export const Default: Story = {
  args: {
    page: 1,
    totalPages: 10,
    totalResults: 100,
    pageSize: 10,
    onPageChange: action("change"),
    onPageSizeChange: action("change"),
  },
};

export const ManyPages: Story = {
  args: {
    page: 5,
    totalPages: 50,
    totalResults: 500,
    pageSize: 10,
    onPageChange: action("change"),
    onPageSizeChange: action("change"),
  },
};

export const LastPage: Story = {
  args: {
    page: 10,
    totalPages: 10,
    totalResults: 100,
    pageSize: 10,
    onPageChange: action("change"),
    onPageSizeChange: action("change"),
  },
};
