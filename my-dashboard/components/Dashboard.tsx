"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Thermometer, Droplets } from "lucide-react"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js'
import { useOperationStore } from '@/store/operationStore'
import 'chartjs-adapter-date-fns'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
)

interface SensorData {
  sensor: string
  value: number
  timestamp: string
}

interface RoomData {
  temperature: SensorData[]
  humidity: SensorData[]
}

interface TimeData {
  運転時間: number
  荷役時間: number
  休憩時間: number
}

export default function Dashboard() {
  const [selectedRoom, setSelectedRoom] = useState<string>("room1")
  const [roomsData, setRoomsData] = useState<{ [key: string]: RoomData }>({
    room1: { temperature: [], humidity: [] },
    room2: { temperature: [], humidity: [] },
    room3: { temperature: [], humidity: [] }
  })
  const [allPersonData, setAllPersonData] = useState<{ [name: string]: TimeData }>({})
  const [currentPersons, setCurrentPersons] = useState<{ room1: string | null, room2: string | null }>({
    room1: null,
    room2: null
  })
  const [deviceStatuses, setDeviceStatuses] = useState<{ status1: string, status2: string }>({
    status1: "vacant",
    status2: "vacant"
  })
  const { operationData, totalOperationRate, addOperationRate } = useOperationStore()

  // センサーデータを取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:5000/data')
        const data = await response.json()
        setRoomsData({
          room1: {
            temperature: data.room1_temperature,
            humidity: data.room1_humidity,
          },
          room2: {
            temperature: data.room2_temperature,
            humidity: data.room2_humidity,
          },
          room3: {
            temperature: data.room3_temperature,
            humidity: data.room3_humidity,
          }
        })
      } catch (error) {
        console.error("Failed to fetch sensor data:", error)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  // 全人物データを取得
  useEffect(() => {
    const fetchAllPersonData = async () => {
      try {
        const response = await fetch('http://localhost:5000/all_person_data')
        const data = await response.json()
        setAllPersonData(data)
      } catch (error) {
        console.error("Failed to fetch all person data:", error)
      }
    }

    fetchAllPersonData()
    const interval = setInterval(fetchAllPersonData, 5000)
    return () => clearInterval(interval)
  }, [])

  // 各部屋の現在の人物データを取得
  useEffect(() => {
    const fetchCurrentPersons = async () => {
      try {
        const response = await fetch('http://localhost:5000/person_data')
        const data = await response.json()
        setCurrentPersons({
          room1: data.room1.person,
          room2: data.room2.person
        })
      } catch (error) {
        console.error("Failed to fetch current person data:", error)
      }
    }

    fetchCurrentPersons()
    const interval = setInterval(fetchCurrentPersons, 5000)
    return () => clearInterval(interval)
  }, [])

  // デバイスステータスを取得
  useEffect(() => {
    const fetchDeviceStatuses = async () => {
      try {
        const response = await fetch('http://localhost:5000/device_status')
        const data = await response.json()
        setDeviceStatuses({
          status1: data.status_1,
          status2: data.status_2
        })
      } catch (error) {
        console.error("Failed to fetch device statuses:", error)
      }
    }

    fetchDeviceStatuses()
    const interval = setInterval(fetchDeviceStatuses, 5000)
    return () => clearInterval(interval)
  }, [])

  // 稼働率データを取得・計算
  useEffect(() => {
    const calculateOperationRate = () => {
      const isRoom1Operating = deviceStatuses.status1 === "working" || deviceStatuses.status1 === "idling"
      const isRoom2Operating = deviceStatuses.status2 === "working" || deviceStatuses.status2 === "idling"
      const currentRate = ((isRoom1Operating ? 1 : 0) + (isRoom2Operating ? 1 : 0)) * 50
  
      addOperationRate(currentRate)
    }
  
    calculateOperationRate()
    const interval = setInterval(calculateOperationRate, 10000)
    return () => clearInterval(interval)
  }, [deviceStatuses, addOperationRate])

  const formatChartData = (data: SensorData[]) => ({
    labels: data.map(item => new Date(item.timestamp).toLocaleTimeString()),
    datasets: [{
      label: 'Value',
      data: data.map(item => item.value),
      fill: false,
      borderColor: 'rgba(75,192,192,1)',
      tension: 0.1
    }]
  })

  // 各人物の現在のステータスを取得
  const getPersonStatus = (name: string): string => {
    if (currentPersons.room1 === name) {
      return deviceStatuses.status1 === "working"
        ? "荷役中"
        : deviceStatuses.status1 === "vacant"
        ? "運転中"
        : "休憩中"
    } else if (currentPersons.room2 === name) {
      return deviceStatuses.status2 === "working"
        ? "荷役中"
        : deviceStatuses.status2 === "vacant"
        ? "運転中"
        : "休憩中"
    } else {
      return "未割当"
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* 左側エリア - ビルと部屋のレイアウト */}
      <div className="flex-grow overflow-y-auto p-8 border-r border-gray-300">
        <h2 className="text-2xl font-bold mb-4">Building Layout</h2>
        <div className="relative w-full h-64 bg-white border-2 border-gray-400 mb-8">
          {/* Building 1 - Contains Room 1 and Room 2 */}
          <div className="absolute w-1/2 h-full border-r border-gray-300">
            <h3 className="text-center font-bold">Building 1</h3>
            <div className="flex h-4/5">
              <div
                className={`w-1/2 h-full flex items-center justify-center border cursor-pointer transition-colors ${
                  selectedRoom === "room1" ? 'bg-blue-200' : 'hover:bg-gray-100'
                }`}
                onClick={() => setSelectedRoom("room1")}
              >
                Room 1
              </div>
              <div
                className={`w-1/2 h-full flex items-center justify-center border cursor-pointer transition-colors ${
                  selectedRoom === "room2" ? 'bg-blue-200' : 'hover:bg-gray-100'
                }`}
                onClick={() => setSelectedRoom("room2")}
              >
                Room 2
              </div>
            </div>
          </div>

          {/* Building 2 - Contains Room 3 */}
          <div className="absolute left-1/2 w-1/2 h-full">
            <h3 className="text-center font-bold">Building 2</h3>
            <div className="flex h-4/5">
              <div
                className={`w-full h-full flex items-center justify-center border cursor-pointer transition-colors ${
                  selectedRoom === "room3" ? 'bg-blue-200' : 'hover:bg-gray-100'
                }`}
                onClick={() => setSelectedRoom("room3")}
              >
                Room 3
              </div>
            </div>
          </div>
        </div>

        {/* Person Layout Table - 全人物の時間を表示 */}
        <h2 className="text-2xl font-bold mb-4">Person Layout</h2>
        <table className="w-full bg-white border border-gray-300 text-left text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border-b border-gray-200">人物名</th>
              <th className="p-2 border-b border-gray-200">運転時間</th>
              <th className="p-2 border-b border-gray-200">荷役時間</th>
              <th className="p-2 border-b border-gray-200">休憩時間</th>
              <th className="p-2 border-b border-gray-200">ステータス</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(allPersonData).map(([name, time]) => {
              const status = getPersonStatus(name)
              const isAssignedToSelectedRoom = 
                (selectedRoom === "room1" && currentPersons.room1 === name) ||
                (selectedRoom === "room2" && currentPersons.room2 === name)

              return (
                <tr
                  key={name}
                  className={
                    isAssignedToSelectedRoom ? "bg-blue-100" : ""
                  }
                >
                  <td className="p-2 border-b border-gray-200">{name}</td>
                  <td className="p-2 border-b border-gray-200">{time.運転時間} 秒</td>
                  <td className="p-2 border-b border-gray-200">{time.荷役時間} 秒</td>
                  <td className="p-2 border-b border-gray-200">{time.休憩時間} 秒</td>
                  <td className={`p-2 border-b border-gray-200`}>
                    {status === "荷役中" ? (
                      <span className="text-green-600 font-bold">荷役中</span>
                    ) : status === "運転中" ? (
                      <span className="text-yellow-600 font-bold">運転中</span>
                    ) : status === "休憩中" ? (
                      <span className="text-blue-600 font-bold">休憩中</span>
                    ) : (
                      <span className="text-gray-600">未割当</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 右側エリア - センサーデータ */}
      <div className="w-1/2 overflow-y-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Operation Rate Dashboard</h1>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Total Operation Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-center">
              {totalOperationRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Current Operation Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl font-bold">
                {operationData[operationData.length - 1]?.rate}%
              </span>
            </div>
            <div className="h-[200px]">
              <Line
                data={{
                  labels: operationData.map(d => d.timestamp), // Dateオブジェクトをそのまま使用
                  datasets: [{
                    label: 'Operation Rate',
                    data: operationData.map(d => d.rate),
                    fill: false,
                    borderColor: 'rgba(75,192,192,1)',
                    tension: 0.1
                  }]
                }}
                options={{
                  scales: {
                    x: {
                      type: 'time', // 'time'スケールに設定
                      time: {
                        unit: 'second', // 秒単位で表示
                        displayFormats: {
                          second: 'HH:mm:ss' // 10:23:22 形式で表示
                        }
                      },
                      title: {
                        display: true,
                        text: 'Time'
                      }
                    },
                    y: {
                      beginAtZero: true,
                      max: 100,
                      title: {
                        display: true,
                        text: 'Operation Rate (%)'
                      }
                    }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>
        <h1 className="text-3xl font-bold mb-8">IoT Sensor Dashboard</h1>
        <div className="grid grid-cols-1 gap-8">
          {["temperature", "humidity"].map((sensorType) => (
            <Card key={sensorType} className={selectedRoom === "room1" ? "border-blue-500 border-2" : ""}>
              <CardHeader>
                <CardTitle>{`${selectedRoom.charAt(0).toUpperCase() + selectedRoom.slice(1)} ${sensorType.charAt(0).toUpperCase() + sensorType.slice(1)}`}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  {sensorType === "temperature" ? (
                    <Thermometer className="w-8 h-8 text-red-500" />
                  ) : (
                    <Droplets className="w-8 h-8 text-blue-500" />
                  )}
                  <span className="text-2xl font-bold">
                    {roomsData[selectedRoom][sensorType as keyof RoomData][roomsData[selectedRoom][sensorType as keyof RoomData].length - 1]?.value.toFixed(1)}
                    {sensorType === "temperature" ? "°C" : "%"}
                  </span>
                </div>
                <div className="h-[200px]">
                  <Line data={formatChartData(roomsData[selectedRoom][sensorType as keyof RoomData])} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
