import EmptyCell from "./empty-cell";

interface NumberCellProps {
  value?: number;
  fractionDigits?: number;
}

function NumberCell({ value, fractionDigits = 2 }: NumberCellProps) {
  if (value === undefined) return <EmptyCell />;

  return (
    <span>
      {value.toLocaleString(undefined, {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      })}
    </span>
  );
}

export default NumberCell;
