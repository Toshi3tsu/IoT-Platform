import { create } from 'zustand'

interface OperationDataPoint {
  rate: number
  timestamp: Date
}

interface OperationStore {
  operationData: OperationDataPoint[]
  totalOperationRate: number
  addOperationRate: (rate: number) => void
}

export const useOperationStore = create<OperationStore>((set) => ({
  operationData: [],
  totalOperationRate: 0,
  addOperationRate: (rate: number) => set((state) => {
    const newDataPoint = { rate, timestamp: new Date() }
    const newData = [...state.operationData, newDataPoint].slice(-100)
    const total = newData.reduce((sum, d) => sum + d.rate, 0) / newData.length
    return {
      operationData: newData,
      totalOperationRate: total
    }
  })
}))