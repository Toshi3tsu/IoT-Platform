import React from "react"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input(props: InputProps) {
  return (
    <input
      {...props}
      className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
    />
  )
}