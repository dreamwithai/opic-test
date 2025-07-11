import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import dayjs from 'dayjs'

export async function GET(request: NextRequest) {
  try {
    console.log('Dashboard stats API called')
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'members' | 'tests' | 'levels' | 'topics'
    const metric = searchParams.get('metric') // 'sessions' | 'users' (테스트용)
    const period = searchParams.get('period') || 'week' // 'week' | 'month', 기본값은 'week'

    console.log('Request parameters:', { type, metric, period })

    if (!type) {
      return NextResponse.json({ error: 'Type parameter is required' }, { status: 400 })
    }

    const today = dayjs().startOf('day'); // 오늘 0시
    const weekAgo = today.subtract(7, 'day')
    const twoWeeksAgo = today.subtract(14, 'day')
    const monthAgo = today.subtract(1, 'month')
    const twoMonthsAgo = today.subtract(2, 'month')
    
    // 기간 설정
    const isMonth = period === 'month'
    const startDate = isMonth ? monthAgo : weekAgo
    const compareStartDate = isMonth ? twoMonthsAgo : twoWeeksAgo

    console.log('Date ranges:', {
      startDate: startDate.toISOString(),
      compareStartDate: compareStartDate.toISOString(),
      today: today.toISOString()
    })

    if (type === 'members') {
      console.log('Fetching members data...')
      // 회원가입 추이 데이터
      const { data: currentWeekData, error: currentError } = await supabase
        .from('members')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .lt('created_at', today.toISOString())

      if (currentError) {
        console.error('Error fetching current week members:', currentError)
        return NextResponse.json({ error: 'Database error: ' + currentError.message }, { status: 500 })
      }

      const { data: previousWeekData, error: previousError } = await supabase
        .from('members')
        .select('created_at')
        .gte('created_at', compareStartDate.toISOString())
        .lt('created_at', startDate.toISOString())

      if (previousError) {
        console.error('Error fetching previous week members:', previousError)
        return NextResponse.json({ error: 'Database error: ' + previousError.message }, { status: 500 })
      }

      console.log('Members data fetched:', {
        currentWeekCount: currentWeekData?.length || 0,
        previousWeekCount: previousWeekData?.length || 0
      })

      // 일별 데이터로 그룹화
      const currentWeekGrouped = groupByDate(currentWeekData || [], 'created_at')
      const previousWeekGrouped = groupByDate(previousWeekData || [], 'created_at')

      console.log('Grouped data:', {
        currentWeekGrouped,
        previousWeekGrouped
      })

      // 최근 7일 또는 30일 데이터 생성
      const days = isMonth ? 30 : 7;
      const chartData = [];
      for (let i = 0; i < days; i++) {
        // 이번 주 날짜: 6일 전(토)부터 오늘(금)까지
        const currentDate = today.subtract(days - 1 - i, 'day');
        const currentDateStr = currentDate.format('YYYY-MM-DD');
        const dayName = isMonth ? currentDate.format('MM.DD') : currentDate.format('ddd');

        // 지난주 날짜: 이번주 날짜에서 7일 빼기
        const previousDate = currentDate.subtract(7, 'day');
        const previousDateStr = previousDate.format('YYYY-MM-DD');

        const currentValue = currentWeekGrouped[currentDateStr] || 0;
        const previousValue = previousWeekGrouped[previousDateStr] || 0;

        chartData.push({
          date: currentDateStr,      // 이번주 날짜
          label: dayName,            // 요일
          prevDate: previousDateStr, // 지난주 날짜
          current: currentValue,
          previous: previousValue
        });

        console.log(`Current: ${currentDateStr} (${dayName}), Value: ${currentValue} | Previous: ${previousDateStr}, Value: ${previousValue}`);
      }

      console.log('Members chart data generated:', chartData.length, 'entries');
      console.log('Final chart data:', chartData);
      return NextResponse.json({ data: chartData });
    }

    if (type === 'tests') {
      console.log('Fetching tests data...')
      // 테스트 응시 추이 데이터
      const isUserMetric = metric === 'users'

      if (isUserMetric) {
        // 응시자 수 (unique member_id)
        const { data: currentWeekData, error: currentError } = await supabase
          .from('test_session')
          .select('member_id, started_at')
          .gte('started_at', startDate.toISOString())
          .lt('started_at', today.toISOString())

        if (currentError) {
          console.error('Error fetching current week test sessions:', currentError)
          return NextResponse.json({ error: 'Database error: ' + currentError.message }, { status: 500 })
        }

        const { data: previousWeekData, error: previousError } = await supabase
          .from('test_session')
          .select('member_id, started_at')
          .gte('started_at', compareStartDate.toISOString())
          .lt('started_at', startDate.toISOString())

        if (previousError) {
          console.error('Error fetching previous week test sessions:', previousError)
          return NextResponse.json({ error: 'Database error: ' + previousError.message }, { status: 500 })
        }

        console.log('Test sessions data fetched:', {
          currentWeekCount: currentWeekData?.length || 0,
          previousWeekCount: previousWeekData?.length || 0
        })

        // 일별 unique 사용자 수 계산
        const currentWeekGrouped = groupUniqueUsersByDate(currentWeekData || [])
        const previousWeekGrouped = groupUniqueUsersByDate(previousWeekData || [])

        const chartData = [];
        const days = isMonth ? 30 : 7;
        for (let i = 0; i < days; i++) {
          const currentDate = today.subtract(days - 1 - i, 'day');
          const currentDateStr = currentDate.format('YYYY-MM-DD');
          const dayName = isMonth ? currentDate.format('MM.DD') : currentDate.format('ddd');
          const previousDate = currentDate.subtract(7, 'day');
          const previousDateStr = previousDate.format('YYYY-MM-DD');
          const currentValue = currentWeekGrouped[currentDateStr] || 0;
          const previousValue = previousWeekGrouped[previousDateStr] || 0;
          chartData.push({
            date: currentDateStr,
            label: dayName,
            prevDate: previousDateStr,
            current: currentValue,
            previous: previousValue
          });
        }
        console.log('Test users chart data generated:', chartData.length, 'entries');
        return NextResponse.json({ data: chartData });
      } else {
        // 응시 수 (전체 세션)
        const { data: currentWeekData, error: currentError } = await supabase
          .from('test_session')
          .select('started_at')
          .gte('started_at', startDate.toISOString())
          .lt('started_at', today.toISOString())

        if (currentError) {
          console.error('Error fetching current week test sessions:', currentError)
          return NextResponse.json({ error: 'Database error: ' + currentError.message }, { status: 500 })
        }

        const { data: previousWeekData, error: previousError } = await supabase
          .from('test_session')
          .select('started_at')
          .gte('started_at', compareStartDate.toISOString())
          .lt('started_at', startDate.toISOString())

        if (previousError) {
          console.error('Error fetching previous week test sessions:', previousError)
          return NextResponse.json({ error: 'Database error: ' + previousError.message }, { status: 500 })
        }

        console.log('Test sessions data fetched:', {
          currentWeekCount: currentWeekData?.length || 0,
          previousWeekCount: previousWeekData?.length || 0
        })

        const currentWeekGrouped = groupByDate(currentWeekData || [], 'started_at')
        const previousWeekGrouped = groupByDate(previousWeekData || [], 'started_at')

        const chartData = [];
        const days = isMonth ? 30 : 7;
        for (let i = 0; i < days; i++) {
          const currentDate = today.subtract(days - 1 - i, 'day');
          const currentDateStr = currentDate.format('YYYY-MM-DD');
          const dayName = isMonth ? currentDate.format('MM.DD') : currentDate.format('ddd');
          const previousDate = currentDate.subtract(7, 'day');
          const previousDateStr = previousDate.format('YYYY-MM-DD');
          const currentValue = currentWeekGrouped[currentDateStr] || 0;
          const previousValue = previousWeekGrouped[previousDateStr] || 0;
          chartData.push({
            date: currentDateStr,
            label: dayName,
            prevDate: previousDateStr,
            current: currentValue,
            previous: previousValue
          });
        }
        console.log('Test sessions chart data generated:', chartData.length, 'entries');
        return NextResponse.json({ data: chartData });
      }
    }

    // 레벨별 분포
    if (type === 'levels') {
      console.log('Fetching levels data...')
      const { data, error } = await supabase
        .from('test_session')
        .select('level')
        .gte('started_at', startDate.toISOString())
        .lt('started_at', today.toISOString())

      if (error) {
        console.error('Error fetching levels data:', error)
        return NextResponse.json({ error: 'Database error: ' + error.message }, { status: 500 })
      }

      console.log('Levels data fetched:', data?.length || 0, 'records')
      if (data && data.length > 0) {
        console.log('Sample levels data:', data.slice(0, 5))
      }

      // 레벨별 카운트 계산
      const levelCounts: { [key: string]: number } = {}
      
      // 기본 레벨 초기화
      const defaultLevels = ['IM2', 'IH', 'AL']
      defaultLevels.forEach(level => {
        levelCounts[level] = 0
      })
      
      // 데이터에서 레벨별 카운트
      if (data) {
        data.forEach((row: any) => {
          const level = row.level
          if (level) {
            levelCounts[level] = (levelCounts[level] || 0) + 1
          }
        })
      }
      
      const chartData = Object.entries(levelCounts).map(([level, count]) => ({ 
        label: level, 
        value: count 
      }))
      
      console.log('Levels chart data generated:', chartData.length, 'entries')
      return NextResponse.json({ data: chartData })
    }

    // 문항별 분포
    if (type === 'topics') {
      console.log('Fetching topics data...')
      const { data, error } = await supabase
        .from('test_session')
        .select('type')
        .gte('started_at', startDate.toISOString())
        .lt('started_at', today.toISOString())

      if (error) {
        console.error('Error fetching topics data:', error)
        return NextResponse.json({ error: 'Database error: ' + error.message }, { status: 500 })
      }

      console.log('Topics data fetched:', data?.length || 0, 'records')
      if (data && data.length > 0) {
        console.log('Sample topics data:', data.slice(0, 5))
      }

      // 주제별 카운트 계산
      const topicCounts: { [key: string]: number } = {}
      
      // 기본 주제 초기화
      const defaultTopics = ['선택주제', '롤플레이', '돌발주제', '모의고사']
      defaultTopics.forEach(topic => {
        topicCounts[topic] = 0
      })
      
      // 데이터에서 주제별 카운트
      if (data) {
        data.forEach((row: any) => {
          const topic = row.type
          if (topic) {
            topicCounts[topic] = (topicCounts[topic] || 0) + 1
          }
        })
      }
      
      const chartData = Object.entries(topicCounts).map(([topic, count]) => ({ 
        label: topic, 
        value: count 
      }))
      
      console.log('Topics chart data generated:', chartData.length, 'entries')
      return NextResponse.json({ data: chartData })
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') }, { status: 500 })
  }
}

// 날짜별로 그룹화하는 헬퍼 함수
function groupByDate(data: any[], dateField: string) {
  const grouped: { [key: string]: number } = {}
  
  data.forEach(item => {
    const date = dayjs(item[dateField]).format('YYYY-MM-DD')
    grouped[date] = (grouped[date] || 0) + 1
  })
  
  return grouped
}

// 날짜별로 unique 사용자 수를 그룹화하는 헬퍼 함수
function groupUniqueUsersByDate(data: any[]) {
  const grouped: { [key: string]: Set<string> } = {}
  
  data.forEach(item => {
    const date = dayjs(item.started_at).format('YYYY-MM-DD')
    if (!grouped[date]) {
      grouped[date] = new Set()
    }
    grouped[date].add(item.member_id)
  })
  
  // Set을 개수로 변환
  const result: { [key: string]: number } = {}
  Object.keys(grouped).forEach(date => {
    result[date] = grouped[date].size
  })
  
  return result
} 