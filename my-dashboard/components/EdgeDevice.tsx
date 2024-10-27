"use client"

import { FC, useState, useEffect } from "react"

interface EdgeDeviceProps {
  roomName: string
  deviceStatus: 'vacant' | 'working' | 'idling'
  elapsedTime: number
}

const EdgeDevice: FC<EdgeDeviceProps> = ({ roomName, deviceStatus, elapsedTime }) => {
  // 現在の人物名の状態を追加
  const [currentPerson, setCurrentPerson] = useState<string | null>(null)

  // 画像パスを状態に基づいて選択
  const statusImages = {
    vacant: "/images/vacant.png",
    working: "/images/working.png",
    idling: "/images/idling.png"
  }

  // 経過時間を分と秒の形式に変換
  const formatElapsedTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = time % 60
    return `${minutes}分 ${seconds}秒`
  }

  // 人物名をバックエンドから取得
  useEffect(() => {
    const fetchPersonData = async () => {
      try {
        const response = await fetch(`http://localhost:5000/person_data`)
        const data = await response.json()
        // 部屋ごとに人物名を取得
        if (roomName === "Room 1") {
          setCurrentPerson(data.room1.person)
        } else if (roomName === "Room 2") {
          setCurrentPerson(data.room2.person)
        }
      } catch (error) {
        console.error("Failed to fetch person data:", error)
      }
    }

    fetchPersonData()
    const interval = setInterval(fetchPersonData, 5000) // 5秒ごとに人物情報を更新
    return () => clearInterval(interval)
  }, [roomName])

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8 border border-gray-200 rounded-lg">
      {/* 部屋名と人物名表示エリア */}
      <h1 className="text-xl font-bold mb-4">{roomName}</h1>
      <h3 className="text-lg font-semibold mb-2">人物: {currentPerson || "読み込み中..."}</h3>

      {/* 画像と状態名の横並びエリア */}
      <div className="flex flex-row items-center space-x-4">
        <img src={statusImages[deviceStatus]} alt={deviceStatus} className="w-32 h-32" />
        <h2 className="text-2xl font-bold">
          {deviceStatus.charAt(0).toUpperCase() + deviceStatus.slice(1)}
        </h2>
      </div>

      {/* 経過時間表示エリア */}
      <div className="flex flex-col items-center">
        <h3 className="text-lg font-semibold mb-2">経過時間</h3>
        <div className="text-3xl font-bold">
          {deviceStatus === 'vacant' ? "0分 0秒" : formatElapsedTime(elapsedTime)}
        </div>
      </div>
    </div>
  )
}

interface EdgeDevicesProps {
  deviceStatuses?: ('vacant' | 'working' | 'idling')[]
  elapsedTimes?: number[]
}

const EdgeDevices: FC<EdgeDevicesProps> = ({ deviceStatuses = [], elapsedTimes = [] }) => {
  const roomNames = ["Room 1", "Room 2"]

  return (
    <div className="flex flex-row items-start justify-center w-full space-x-8">
      {deviceStatuses.length > 0 && elapsedTimes.length > 0 ? (
        deviceStatuses.map((status, index) => (
          <EdgeDevice
            key={index}
            roomName={roomNames[index]}
            deviceStatus={status}
            elapsedTime={elapsedTimes[index]}
          />
        ))
      ) : (
        <p>デバイス情報の読み込み中...</p> // データがない場合の代替表示
      )}
    </div>
  )
}

export default EdgeDevices
