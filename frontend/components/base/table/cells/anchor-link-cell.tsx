import EmptyCell from "./empty-cell";

interface AnchorLinkCellProps {
  href?: string;
  children?: React.ReactNode;
}

function AnchorLinkCell({ href, children }: AnchorLinkCellProps) {
  if (!children && !href) return <EmptyCell />;

  return (
    <a
      href={href}
      className="text-sm text-primary underline-offset-4 hover:underline"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children ?? href}
    </a>
  );
}

export default AnchorLinkCell;
