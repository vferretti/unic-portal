import type { Meta, StoryObj } from "@storybook/react-vite";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/base/table/table";
import {
  TextCell,
  EmptyCell,
  DateCell,
  NumberCell,
  AnchorLinkCell,
  BadgeCell,
  TextTooltipCell,
} from "@/components/base/table/cells";

function CellShowcase() {
  return (
    <div className="max-w-2xl p-8 space-y-8">
      <h1 className="text-2xl font-bold">Data Table Cells</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cell Type</TableHead>
            <TableHead>With Value</TableHead>
            <TableHead>Empty</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">TextCell</TableCell>
            <TableCell>
              <TextCell>Hello world</TextCell>
            </TableCell>
            <TableCell>
              <TextCell>{undefined}</TextCell>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">EmptyCell</TableCell>
            <TableCell>
              <EmptyCell />
            </TableCell>
            <TableCell>
              <EmptyCell />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">DateCell</TableCell>
            <TableCell>
              <DateCell date="2025-06-15T10:30:00" />
            </TableCell>
            <TableCell>
              <DateCell date={null} />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">NumberCell</TableCell>
            <TableCell>
              <NumberCell value={1234.5} />
            </TableCell>
            <TableCell>
              <NumberCell value={undefined} />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">AnchorLinkCell</TableCell>
            <TableCell>
              <AnchorLinkCell href="https://example.com">Example</AnchorLinkCell>
            </TableCell>
            <TableCell>
              <AnchorLinkCell />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">BadgeCell</TableCell>
            <TableCell>
              <BadgeCell>Active</BadgeCell>
            </TableCell>
            <TableCell>
              <BadgeCell>{undefined}</BadgeCell>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">TextTooltipCell</TableCell>
            <TableCell>
              <TextTooltipCell tooltipText="Extra info">Hover me</TextTooltipCell>
            </TableCell>
            <TableCell>
              <TextTooltipCell>{undefined}</TextTooltipCell>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

const meta: Meta<typeof CellShowcase> = {
  title: "Tables/Data Table Cells",
  component: CellShowcase,
};

export default meta;
type Story = StoryObj<typeof CellShowcase>;

export const BaseCell: Story = {};
