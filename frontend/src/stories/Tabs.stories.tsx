import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

function TabsDemo() {
  return (
    <div className="max-w-lg p-8">
      <Tabs defaultValue="resources">
        <TabsList>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="tables">Tables</TabsTrigger>
          <TabsTrigger value="variables">Variables</TabsTrigger>
        </TabsList>
        <TabsContent value="resources">
          <p className="p-4 text-sm text-muted-foreground">
            Resource list will go here.
          </p>
        </TabsContent>
        <TabsContent value="tables">
          <p className="p-4 text-sm text-muted-foreground">
            Table list will go here.
          </p>
        </TabsContent>
        <TabsContent value="variables">
          <p className="p-4 text-sm text-muted-foreground">
            Variable list will go here.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

const meta: Meta<typeof TabsDemo> = {
  title: "Components/Tabs",
  component: TabsDemo,
};

export default meta;
type Story = StoryObj<typeof TabsDemo>;

export const Default: Story = {};
