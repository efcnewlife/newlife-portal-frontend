import { ReactNode } from "react";

// Props for Table
interface TableProps {
  children: ReactNode; // Table content (thead, tbody, etc.)
  className?: string; // Optional className for styling
}

// Props for TableHeader
interface TableHeaderProps {
  children: ReactNode; // Header row(s)
  className?: string; // Optional className for styling
}

// Props for TableBody
interface TableBodyProps {
  children: ReactNode; // Body row(s)
  className?: string; // Optional className for styling
}

// Props for TableRow
interface TableRowProps {
  children: ReactNode; // Cells (th or td)
  className?: string; // Optional className for styling
  onContextMenu?: (e: React.MouseEvent<HTMLTableRowElement>) => void; // Optional context menu handler
}

// Props for TableCell
interface TableCellProps {
  children: ReactNode; // Cell content
  isHeader?: boolean; // If true, renders as <th>, otherwise <td>
  className?: string; // Optional className for styling
  style?: React.CSSProperties; // Optional inline styles
  colSpan?: number; // Optional colspan attribute
}

// Table Component
const Table: React.FC<TableProps> = ({ children, className }) => {
  className = className ? `min-w-full ${className}` : "min-w-full";
  return <table className={className}>{children}</table>;
};

// TableHeader Component
const TableHeader: React.FC<TableHeaderProps> = ({ children, className }) => {
  className = className ? `min-w-full ${className}` : "min-w-full";
  return <thead className={className}>{children}</thead>;
};

// TableBody Component
const TableBody: React.FC<TableBodyProps> = ({ children, className }) => {
  className = className ? `min-w-full ${className}` : "min-w-full";
  return <tbody className={className}>{children}</tbody>;
};

// TableRow Component
const TableRow: React.FC<TableRowProps> = ({ children, className, onContextMenu }) => {
  return (
    <tr className={className} onContextMenu={onContextMenu}>
      {children}
    </tr>
  );
};

// TableCell Component
const TableCell: React.FC<TableCellProps> = ({ children, isHeader = false, className, style, colSpan }) => {
  const CellTag = isHeader ? "th" : "td";
  return (
    <CellTag className={` ${className}`} style={style} colSpan={colSpan}>
      {children}
    </CellTag>
  );
};

export { Table, TableBody, TableCell, TableHeader, TableRow };
