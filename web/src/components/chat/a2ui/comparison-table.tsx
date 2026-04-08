'use client'

interface ComparisonData {
  title?: string
  headers: string[]
  rows: string[][]
}

interface ComparisonTableProps {
  data: unknown
}

export function ComparisonTable({ data }: ComparisonTableProps) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null

  const tableData = data as ComparisonData
  if (!tableData.headers || !tableData.rows) return null

  return (
    <div className="my-3 rounded-xl border border-[#eaeef2] bg-white overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 bg-[#f8f9fb] border-b border-[#eaeef2]">
        <span className="text-xs font-semibold text-[#586065] uppercase tracking-wide">
          {tableData.title ?? '비교'}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#eaeef2]">
              {tableData.headers.map((header, i) => (
                <th
                  key={i}
                  className="px-4 py-2.5 text-left text-xs font-semibold text-[#586065] whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eaeef2]">
            {tableData.rows.map((row, i) => (
              <tr key={i} className="hover:bg-[#f8f9fb] transition-colors">
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className={`px-4 py-2.5 text-xs leading-relaxed ${j === 0 ? 'font-medium text-[#2b3438] whitespace-nowrap' : 'text-[#586065]'}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
