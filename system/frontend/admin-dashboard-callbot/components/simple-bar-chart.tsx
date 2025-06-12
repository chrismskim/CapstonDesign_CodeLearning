import type React from "react"

interface BarChartDataItem {
  label: string
  value: number
  color?: string // e.g., 'bg-blue-500'
}

interface SimpleBarChartProps {
  data: BarChartDataItem[]
  title?: string
  maxValue?: number
  barHeight?: string // e.g., 'h-4' or 'h-6'
}

const SimpleBarChart: React.FC<SimpleBarChartProps> = ({
  data,
  title,
  maxValue,
  barHeight = "h-5", // Default bar height
}) => {
  const maxVal = maxValue || Math.max(...data.map((item) => item.value), 0)

  if (data.length === 0) {
    return (
      <div className="py-4">
        {title && <h4 className="text-sm font-semibold mb-2 text-muted-foreground">{title}</h4>}
        <p className="text-sm text-muted-foreground">표시할 데이터가 없습니다.</p>
      </div>
    )
  }

  return (
    <div>
      {title && <h4 className="text-sm font-semibold mb-3">{title}</h4>}
      <div className="space-y-2.5">
        {data.map((item, index) => (
          <div key={index} className="flex items-center group">
            <div
              className="w-28 text-xs truncate pr-2 text-muted-foreground group-hover:font-medium"
              title={item.label}
            >
              {item.label}
            </div>
            <div className={`flex-1 bg-muted rounded-sm ${barHeight} overflow-hidden`}>
              <div
                style={{ width: maxVal > 0 ? `${(item.value / maxVal) * 100}%` : "0%" }}
                className={`h-full ${
                  item.color || "bg-primary"
                } transition-all duration-300 ease-out flex items-center justify-end pr-1.5`}
              >
                <span className="text-white text-[10px] font-medium leading-none opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.value}
                </span>
              </div>
            </div>
            <div className="w-8 text-right text-xs pl-2 font-medium text-muted-foreground group-hover:text-primary">
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SimpleBarChart
