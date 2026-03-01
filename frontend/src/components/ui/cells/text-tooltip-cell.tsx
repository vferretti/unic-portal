import EmptyCell from "./empty-cell";

interface TextTooltipCellProps {
  children?: React.ReactNode;
  tooltipText?: string;
}

function TextTooltipCell({ children, tooltipText }: TextTooltipCellProps) {
  if (!children) return <EmptyCell />;
  if (!tooltipText) return <span>{children}</span>;

  return (
    <span title={tooltipText} className="cursor-help underline decoration-dotted underline-offset-4">
      {children}
    </span>
  );
}

export default TextTooltipCell;
