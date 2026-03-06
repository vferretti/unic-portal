import type { Meta, StoryObj } from "@storybook/react-vite";
import { HighlightText } from "@/components/base/highlight-text";

const meta: Meta<typeof HighlightText> = {
  title: "Components/HighlightText",
  component: HighlightText,
};

export default meta;

type Story = StoryObj<typeof HighlightText>;

export const Default: Story = {
  args: { text: "Hello World", highlight: "World" },
};

export const NoMatch: Story = {
  args: { text: "Hello World", highlight: "xyz" },
};

export const MultipleMatches: Story = {
  args: { text: "the quick brown fox jumps over the lazy dog", highlight: "the" },
};

export const CaseInsensitive: Story = {
  args: { text: "React TypeScript", highlight: "react" },
};
