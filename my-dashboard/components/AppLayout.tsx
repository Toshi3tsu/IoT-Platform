"use client"

import { useState, useEffect, useCallback } from "react"
import { ReactNode } from "react"
import Sidebar from "./Sidebar"
import Dashboard from "./Dashboard"
import Chat from "./Chat"
import EdgeDevices from "./EdgeDevice"  // 修正

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AppLayoutProps {
  children?: ReactNode; // childrenを受け取るプロパティを追加
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [activeView, setActiveView] = useState<'dashboard' | 'chat' | 'edge'>('dashboard')
  
  // Chatのメッセージと入力内容をAppLayoutで管理
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')

  // 2つのEdgeDeviceの状態と経過時間を管理
  const [deviceStatuses, setDeviceStatuses] = useState<("vacant" | "working" | "idling")[]>(["vacant", "vacant"]);
  const [elapsedTimes, setElapsedTimes] = useState([0, 0])
  const [timersActive, setTimersActive] = useState([false, false])

  // デバイスの状態に基づいて各タイマーを更新
  const updateTimers = useCallback(() => {
    const timers: NodeJS.Timeout[] = [];
    deviceStatuses.forEach((_, index) => {
      if (timersActive[index]) {
        timers[index] = setInterval(() => {
          setElapsedTimes((prevTimes) => {
            const newTimes = [...prevTimes];
            newTimes[index] += 1;
            return newTimes;
          });
        }, 1000);
      } else {
        setElapsedTimes((prevTimes) => {
          const newTimes = [...prevTimes];
          newTimes[index] = 0;
          return newTimes;
        });
      }
    });
    return timers;
  }, [deviceStatuses, timersActive]);
  
  useEffect(() => {
    const timers = updateTimers();
    return () => timers.forEach((timer) => clearInterval(timer));
  }, [updateTimers]);

  // 2つのデバイスの状態を10秒ごとにバックエンドから取得
  useEffect(() => {
    const fetchDeviceStatus = async () => {
      try {
        const response = await fetch('http://localhost:5000/device_status')
        const data = await response.json()

        const isValidStatus = (status: string): status is "vacant" | "working" | "idling" =>
          ["vacant", "working", "idling"].includes(status);

        const newStatuses: ("vacant" | "working" | "idling")[] = [
          isValidStatus(data.status_1) ? data.status_1 : "vacant",
          isValidStatus(data.status_2) ? data.status_2 : "vacant",
        ];

        const newTimersActive = newStatuses.map((status) => status !== "vacant");

        console.log("Fetched device statuses:", newStatuses)  // 状態の確認用ログ
        setDeviceStatuses(newStatuses)
        setTimersActive(newTimersActive)
      } catch (error) {
        console.error("Failed to fetch device status:", error)
      }
    }

    fetchDeviceStatus()
    const interval = setInterval(fetchDeviceStatus, 10000) // 10秒ごとに信号を取得
    return () => clearInterval(interval)
  }, [])

  const handleSendMessage = async () => {
    if (input.trim() === '') return

    const newMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, newMessage])
    setInput('')

    try {
      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      })
      const data = await response.json()
      const assistantMessage: Message = { role: 'assistant', content: data.response }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error("Failed to get chat response:", error)
      const errorMessage: Message = { role: 'assistant', content: 'エラーが発生しました。サーバーの状態を確認してください。' }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* SidebarにactiveViewとsetActiveViewを渡す */}
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      
      {/* Active viewに応じたコンポーネントの表示 */}
      <div className="flex-1 flex flex-col">
        {activeView === 'dashboard' && <Dashboard />}
        {activeView === 'chat' && (
          <Chat 
            messages={messages}
            input={input}
            setInput={setInput}
            handleSendMessage={handleSendMessage}
          />
        )}
        {activeView === 'edge' && (
          <EdgeDevices  // EdgeDevicesに変更
            deviceStatuses={deviceStatuses}
            elapsedTimes={elapsedTimes}
          />
        )}
      </div>
      {/* 子要素はサイドバー以外の配置場所にレンダリングする */}
      <div className="hidden">{children}</div>
    </div>
  )
}
