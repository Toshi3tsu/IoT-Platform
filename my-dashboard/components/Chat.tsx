import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send } from "lucide-react"

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatProps {
  messages: Message[]
  input: string
  setInput: React.Dispatch<React.SetStateAction<string>>
  handleSendMessage: () => void
}

export default function Chat({ messages, input, setInput, handleSendMessage }: ChatProps) {
  return (
    <div className="flex-1 flex flex-col p-4">
      <ScrollArea className="flex-1 pr-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
          >
            <div
              className={`inline-block p-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
      </ScrollArea>
      <div className="mt-4 flex">
        <Input
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          className="flex-1 mr-2"
        />
        <Button onClick={handleSendMessage}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}