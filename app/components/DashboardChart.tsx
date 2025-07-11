'use client'

import { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface ChartData {
  date: string
  label: string // 요일
  prevDate: string // 지난주 날짜
  current: number
  previous: number
}

interface DashboardChartProps {
  title: string
  type: 'members' | 'tests'
  metric?: 'sessions' | 'users'
  onMetricChange?: (metric: 'sessions' | 'users') => void
}

export default function DashboardChart({ title, type, metric = 'sessions', onMetricChange }: DashboardChartProps) {
  const [data, setData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dateRange, setDateRange] = useState('')
  const [currentWeekRange, setCurrentWeekRange] = useState('')
  const [previousWeekRange, setPreviousWeekRange] = useState('')

  useEffect(() => {
    fetchChartData()
  }, [type, metric])

  const fetchChartData = async () => {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams({
        type,
        ...(type === 'tests' && { metric })
      })

      const response = await fetch(`/api/dashboard-stats?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch chart data')
      }

      const result = await response.json()
      setData(result.data || [])
      
      // 날짜 범위 계산
      if (result.data && result.data.length > 0) {
        const today = new Date()
        // 오늘 포함 최근 7일 (이번주)
        const endCurrent = new Date(today)
        const startCurrent = new Date(today)
        startCurrent.setDate(endCurrent.getDate() - 6)
        // 그 전 7일 (지난주)
        const endPrev = new Date(startCurrent)
        endPrev.setDate(startCurrent.getDate() - 1)
        const startPrev = new Date(endPrev)
        startPrev.setDate(endPrev.getDate() - 6)

        const formatDate = (date: Date) => {
          return date.toLocaleDateString('ko-KR', { 
            month: '2-digit', 
            day: '2-digit' 
          }).replace(/\./g, '.').replace(/\s/g, '')
        }

        const currentRange = `${formatDate(startCurrent)}~${formatDate(endCurrent)}`
        const previousRange = `${formatDate(startPrev)}~${formatDate(endPrev)}`
        setCurrentWeekRange(currentRange)
        setPreviousWeekRange(previousRange)
        setDateRange(`이번주(${currentRange}) vs 지난주(${previousRange})`)
      }
    } catch (err) {
      console.error('Error fetching chart data:', err)
      setError('데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const chartData = {
    labels: data.map(item => item.label),
    datasets: [
      {
        label: `이번주 (${currentWeekRange})`,
        data: data.map(item => item.current),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        tension: 0.1,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointStyle: 'circle', // 추가
      },
      {
        label: `지난주 (${previousWeekRange})`,
        data: data.map(item => item.previous),
        borderColor: 'rgb(156, 163, 175)',
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        borderWidth: 2,
        borderDash: [5, 5],
        tension: 0.1,
        pointBackgroundColor: 'rgb(156, 163, 175)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointStyle: 'circle', // 추가
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      point: {
        pointStyle: 'circle',
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          generateLabels: (chart: any) => {
            const datasets = chart.data.datasets
            return datasets.map((ds: any, i: number) => ({
              text: ds.label,
              fillStyle: ds.borderColor,
              strokeStyle: ds.borderColor,
              fontColor: ds.borderColor, // 여기서 색상 지정
              hidden: !chart.isDatasetVisible(i),
              lineCap: ds.borderCapStyle,
              lineDash: ds.borderDash,
              lineDashOffset: ds.borderDashOffset,
              lineJoin: ds.borderJoinStyle,
              lineWidth: ds.borderWidth,
              strokeStyleLegend: ds.borderColor,
              pointStyle: ds.pointStyle,
              datasetIndex: i,
            }))
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: (context: any) => '',
          label: (context: any) => {
            const d = data[context.dataIndex];
            if (context.datasetIndex === 0) {
              return `${d.date} : ${d.current}명`;
            } else {
              return `${d.prevDate} : ${d.previous}명`;
            }
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6b7280',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#f3f4f6',
        },
        ticks: {
          color: '#6b7280',
          stepSize: 1,
          precision: 0,
          callback: function(value: any) {
            return Number.isInteger(value) ? value : ''
          }
        },
      },
    },
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          {type === 'tests' && onMetricChange && (
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => onMetricChange('sessions')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  metric === 'sessions' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                응시 수
              </button>
              <button
                onClick={() => onMetricChange('users')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  metric === 'users' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                응시자 수
              </button>
            </div>
          )}
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        {type === 'tests' && onMetricChange && (
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => onMetricChange('sessions')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                metric === 'sessions' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              응시 수
            </button>
            <button
              onClick={() => onMetricChange('users')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                metric === 'users' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              응시자 수
            </button>
          </div>
        )}
      </div>
      
      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>
    </div>
  )
} 