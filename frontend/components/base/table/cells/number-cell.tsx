import { useTranslation } from "react-i18next";
import EmptyCell from "./empty-cell";

interface NumberCellProps {
  value?: number;
  fractionDigits?: number;
}

function NumberCell({ value, fractionDigits = 2 }: NumberCellProps) {
  const { i18n } = useTranslation();
  if (value === undefined) return <EmptyCell />;

  return (
    <span>
      {value.toLocaleString(i18n.language, {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      })}
    </span>
  );
}

export default NumberCell;
