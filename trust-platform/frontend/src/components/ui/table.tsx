import React from "react";

interface TableHeaderCellProps {
  children: React.ReactNode;
  className?: string;
}

interface TableRowCellProps {
  children: React.ReactNode;
  className?: string;
}

export const Table = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <table className={className}>{children}</table>;
};

Table.displayName = "Table";

export const TableHeader = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <thead>{children}</thead>;
};

TableHeader.displayName = "TableHeader";

export const TableRow = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <tr>{children}</tr>;
};

TableRow.displayName = "TableRow";

export const TableCell = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <td>{children}</td>;
};

TableCell.displayName = "TableCell";

export const TableBody = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <tbody>{children}</tbody>;
};

TableBody.displayName = "TableBody";