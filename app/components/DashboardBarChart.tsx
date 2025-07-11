'use client'

import { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import dayjs from 'dayjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface BarData {
  label: string
  value: number
}

interface DashboardBarChartProps {
  title: string
  type: 'levels' | 'topics'
}

export default function DashboardBarChart({ title, type }: DashboardBarChartProps) {
  const [data, setData] = useState<BarData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [period, setPeriod] = useState<'week' | 'month'>('week')

  useEffect(() => {
    fetchBarData()
  }, [type, period])

  const fetchBarData = async () => {
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams({
        type,
        period
      })
      const response = await fetch(`/api/dashboard-stats?${params}`)
      if (!response.ok) throw new Error('Failed to fetch bar chart data')
      const result = await response.json()
      setData(result.data || [])
    } catch (err) {
      setError('데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const chartData = {
    labels: data.map(d => d.label),
    datasets: [
      {
        label: title,
        data: data.map(d => d.value),
        backgroundColor: type === 'levels' ? 'rgba(59, 130, 246, 0.7)' : 'rgba(16, 185, 129, 0.7)',
        borderColor: type === 'levels' ? 'rgb(59, 130, 246)' : 'rgb(16, 185, 129)',
        borderWidth: 2,
        borderRadius: 6,
        maxBarThickness: 40,
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#1f2937',
        bodyColor: '#374151',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (context: any) => '',
          label: (context: any) => `${context.label} : ${context.parsed.y}명`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#6b7280', font: { size: 14, weight: 'bold' as const } }
      },
      y: {
        beginAtZero: true,
        grid: { color: '#f3f4f6' },
        ticks: {
          color: '#6b7280',
          stepSize: 1,
          precision: 0,
          callback: function(value: any) {
            return Number.isInteger(value) ? value : ''
          }
        }
      }
    }
  }

  // 날짜 범위 계산
  let rangeText = ''
  if (period === 'week') {
    const end = dayjs().startOf('day')
    const start = end.subtract(6, 'day')
    rangeText = `${start.format('MM.DD')}~${end.format('MM.DD')}`
  } else {
    const end = dayjs().startOf('day')
    const start = end.startOf('month')
    rangeText = `${start.format('MM.DD')}~${end.format('MM.DD')}`
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center">
          <span className="text-xs text-gray-500 mr-2">{rangeText}</span>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setPeriod('week')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${period === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              최근 1주일
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${period === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              이번 달
            </button>
          </div>
        </div>
      </div>
      <div className="h-64 flex items-center justify-center">
        {loading ? (
          <div className="text-gray-500">로딩 중...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <Bar data={chartData} options={options} />
        )}
      </div>
    </div>
  )
} 