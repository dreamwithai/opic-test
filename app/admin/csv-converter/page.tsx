'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import Link from 'next/link'
import { ArrowLeft, Upload, Download, Eye, CheckCircle } from 'lucide-react'

interface CSVRow {
  [key: string]: string
}

interface ColumnMapping {
  csvColumn: string
  jsonField: string
}

const JSON_FIELDS = [
  'category',
  'theme',
  'q_theme', 
  'q_id',
  'q_seq',
  'listen',
  'type',
  'question',
  'question_kr',
  'difficulty',
  'estimated_time',
  'tags'
]

const CATEGORY_OPTIONS = [
  { value: 'S', label: 'S (선택주제)' },
  { value: 'RP', label: 'RP (롤플레이)' },
  { value: 'C', label: 'C (돌발주제)' }
]

export default function CSVConverterPage() {
  const [csvData, setCsvData] = useState<CSVRow[]>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('C')
  const [questionType, setQuestionType] = useState<string>('돌발주제')
  const [description, setDescription] = useState<string>('돌발주제 문제입니다.')
  const [previewData, setPreviewData] = useState<any>(null)
  const [fileName, setFileName] = useState<string>('')
  const [parseError, setParseError] = useState<string>('')

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setFileName(file.name)
      setParseError('')
      const reader = new FileReader()
      reader.onload = (e) => {
        const csv = e.target?.result as string
        parseCSV(csv)
      }
      reader.readAsText(file, 'UTF-8')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    multiple: false
  })

  const parseCSV = (csv: string) => {
    try {
      const result = Papa.parse<CSVRow>(csv, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        transform: (value) => value.trim(),
        complete: (results) => {
          if (results.errors && results.errors.length > 0) {
            setParseError(`CSV 파싱 오류: ${results.errors[0].message}`)
            return
          }

          if (!results.data || results.data.length === 0) {
            setParseError('CSV 파일이 비어있거나 형식이 올바르지 않습니다.')
            return
          }

          const headers = Object.keys(results.data[0])
          const rows = results.data

          setCsvHeaders(headers)
          setCsvData(rows)
          
          // 자동 매핑 시도 (더 정확한 매핑)
          const autoMappings: ColumnMapping[] = []
          headers.forEach(header => {
            const lowerHeader = header.toLowerCase()
            let matchedField = ''

            // 정확한 매칭 우선
            if (lowerHeader === 'category') matchedField = 'category'
            else if (lowerHeader === 'theme') matchedField = 'theme'
            else if (lowerHeader === 'q_theme') matchedField = 'q_theme'
            else if (lowerHeader === 'q_id') matchedField = 'q_id'
            else if (lowerHeader === 'q_seq') matchedField = 'q_seq'
            else if (lowerHeader === 'listen') matchedField = 'listen'
            else if (lowerHeader === 'type') matchedField = 'type'
            else if (lowerHeader === 'question') matchedField = 'question'
            else if (lowerHeader === 'question_kr') matchedField = 'question_kr'
            else if (lowerHeader === 'difficulty') matchedField = 'difficulty'
            else if (lowerHeader === 'estimated_time') matchedField = 'estimated_time'
            else if (lowerHeader === 'tags') matchedField = 'tags'
            // 부분 매칭
            else if (lowerHeader.includes('category')) matchedField = 'category'
            else if (lowerHeader.includes('theme') && !lowerHeader.includes('q_')) matchedField = 'theme'
            else if (lowerHeader.includes('q_theme')) matchedField = 'q_theme'
            else if (lowerHeader.includes('q_id')) matchedField = 'q_id'
            else if (lowerHeader.includes('q_seq')) matchedField = 'q_seq'
            else if (lowerHeader.includes('listen')) matchedField = 'listen'
            else if (lowerHeader.includes('type')) matchedField = 'type'
            else if (lowerHeader.includes('question') && !lowerHeader.includes('kr')) matchedField = 'question'
            else if (lowerHeader.includes('question_kr') || lowerHeader.includes('korean')) matchedField = 'question_kr'
            
            if (matchedField) {
              autoMappings.push({ csvColumn: header, jsonField: matchedField })
            }
          })
          setColumnMappings(autoMappings)
        }
      })
      
    } catch (error) {
      setParseError(`파일 읽기 오류: ${error}`)
    }
  }

  const updateMapping = (csvColumn: string, jsonField: string) => {
    setColumnMappings(prev => {
      const existing = prev.find(m => m.csvColumn === csvColumn)
      if (existing) {
        return prev.map(m => m.csvColumn === csvColumn ? { ...m, jsonField } : m)
      } else {
        return [...prev, { csvColumn, jsonField }]
      }
    })
  }

  const generatePreview = () => {
    if (csvData.length === 0 || columnMappings.length === 0) return

    // 테마별로 그룹화
    const themes: { [key: string]: any[] } = {}
    
    csvData.forEach(row => {
      const question: any = { category: selectedCategory }
      
      columnMappings.forEach(mapping => {
        const value = row[mapping.csvColumn] || ''
        
        if (mapping.jsonField === 'category') {
          // Category 매핑 시 자동으로 선택된 카테고리 사용
          question[mapping.jsonField] = selectedCategory
        } else if (mapping.jsonField === 'q_id' || mapping.jsonField === 'q_seq' || mapping.jsonField === 'difficulty' || mapping.jsonField === 'estimated_time') {
          question[mapping.jsonField] = parseInt(value) || 0
        } else if (mapping.jsonField === 'tags') {
          question[mapping.jsonField] = value ? value.split(',').map(tag => tag.trim()) : []
        } else {
          question[mapping.jsonField] = value
        }
      })

      const theme = question.theme || 'Unknown'
      if (!themes[theme]) {
        themes[theme] = []
      }
      themes[theme].push(question)
    })

    const result = {
      questionType,
      description,
      themes
    }

    setPreviewData(result)
  }

  const downloadJSON = () => {
    if (!previewData) return

    const blob = new Blob([JSON.stringify(previewData, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${questionType.toLowerCase().replace(/\s+/g, '_')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link href="/admin" className="mr-4">
              <button className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5 mr-2" />
                어드민으로 돌아가기
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">CSV → JSON 변환기 (개선판)</h1>
              <p className="text-gray-600 mt-1">RFC 4180 표준 지원으로 쉼표가 포함된 텍스트도 정확하게 파싱</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Upload & Mapping */}
          <div className="space-y-6">
            {/* File Upload */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">1. CSV 파일 업로드</h2>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {fileName || 'CSV 파일을 드래그하거나 클릭하여 선택'}
                </p>
                <p className="text-gray-500">
                  {isDragActive ? '파일을 놓으세요' : '.csv 파일만 지원됩니다'}
                </p>
              </div>
              
              {parseError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800 text-sm">{parseError}</p>
                </div>
              )}
              
              {csvData.length > 0 && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-green-800 text-sm">
                    ✅ {csvData.length}개 행이 성공적으로 파싱되었습니다!
                  </p>
                </div>
              )}
            </div>

            {/* Basic Settings */}
            {csvData.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">2. 기본 설정</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">카테고리</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      {CATEGORY_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">문제 유형</label>
                    <input
                      type="text"
                      value={questionType}
                      onChange={(e) => setQuestionType(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="예: 돌발주제"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">설명</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      rows={3}
                      placeholder="문제 유형에 대한 설명을 입력하세요"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Column Mapping */}
            {csvHeaders.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">3. 컬럼 매핑</h2>
                <div className="space-y-3">
                  {csvHeaders.map(header => (
                    <div key={header} className="flex items-center space-x-4">
                      <div className="w-1/2">
                        <span className="text-sm font-medium">{header}</span>
                      </div>
                      <div className="w-1/2">
                        <select
                          value={columnMappings.find(m => m.csvColumn === header)?.jsonField || ''}
                          onChange={(e) => updateMapping(header, e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                        >
                          <option value="">선택 안함</option>
                          {JSON_FIELDS.map(field => (
                            <option key={field} value={field}>{field}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={generatePreview}
                  className="w-full mt-6 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center justify-center"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  미리보기 생성
                </button>
              </div>
            )}
          </div>

          {/* Right Column - Preview & Download */}
          <div className="space-y-6">
            {/* Preview */}
            {previewData && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  미리보기
                </h2>
                <div className="bg-gray-50 rounded p-4 max-h-96 overflow-y-auto">
                  <pre className="text-sm">
                    {JSON.stringify(previewData, null, 2)}
                  </pre>
                </div>
                <button
                  onClick={downloadJSON}
                  className="w-full mt-4 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 flex items-center justify-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  JSON 파일 다운로드
                </button>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">🔧 개선사항</h2>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                <li>RFC 4180 표준 지원으로 따옴표 내 쉼표 처리</li>
                <li>UTF-8 인코딩 자동 감지</li>
                <li>더 정확한 자동 컬럼 매핑</li>
                <li>파싱 오류 상세 표시</li>
                <li>빈 줄 자동 제거</li>
              </ul>
            </div>

            {/* CSV Format Guide */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">CSV 형식 가이드</h2>
              <div className="text-sm text-gray-700 space-y-2">
                <p><strong>✅ 지원되는 형식:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>쉼표로 구분된 값 (RFC 4180)</li>
                  <li>따옴표로 감싼 텍스트</li>
                  <li>텍스트 내부의 쉼표, 줄바꿈</li>
                  <li>UTF-8 인코딩</li>
                </ul>
                <p className="mt-3"><strong>💡 팁:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>첫 번째 행은 헤더로 사용됩니다</li>
                  <li>빈 줄은 자동으로 무시됩니다</li>
                  <li>컬럼명이 비슷하면 자동 매핑됩니다</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 