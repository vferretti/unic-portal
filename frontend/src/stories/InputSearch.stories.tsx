import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { InputSearch } from "@/components/ui/input-search";
import { HighlightText } from "@/components/ui/highlight-text";

function InputSearchDemo() {
  const [search, setSearch] = useState("");

  const items: string[] = [];

  const filtered = items.filter((item) =>
    item.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="max-w-2xl space-y-4 p-8">
      <h1 className="text-2xl font-bold">InputSearch</h1>
      <InputSearch
        value={search}
        onChange={setSearch}
        placeholder="Name, Investigator, Description"
      />
      <ul className="space-y-2 rounded-lg border p-4">
        {filtered.length === 0 && (
          <li className="text-muted-foreground">No results</li>
        )}
        {filtered.map((item) => (
          <li key={item} className="text-sm">
            <HighlightText text={item} highlight={search} />
          </li>
        ))}
      </ul>
    </div>
  );
}

const meta: Meta = {
  title: "Components/InputSearch",
  component: InputSearchDemo,
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
