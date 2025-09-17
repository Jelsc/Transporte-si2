import * as React from "react";

export const Table = ({ children }: { children: React.ReactNode }) => (
  <table className="w-full border-collapse">{children}</table>
);

export const TableHeader = ({ children }: { children: React.ReactNode }) => (
  <thead className="bg-gray-100">{children}</thead>
);

export const TableBody = ({ children }: { children: React.ReactNode }) => (
  <tbody>{children}</tbody>
);

export const TableRow = ({ children }: { children: React.ReactNode }) => (
  <tr className="border-b last:border-none hover:bg-gray-50">{children}</tr>
);

export const TableCell = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <td className={`p-3 text-left text-sm text-gray-700 ${className || ''}`}>{children}</td>
);

export const TableHead = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <th className={`p-3 text-left text-sm font-medium text-gray-900 bg-gray-50 ${className || ''}`}>{children}</th>
);