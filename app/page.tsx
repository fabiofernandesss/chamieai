"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"

// Custom Microphone Icon Component
const MicrophoneIcon = ({ className = "", ...props }) => (
  <svg
    className={className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" x2="12" y1="19" y2="22" />
    <line x1="8" x2="16" y1="22" y2="22" />
  </svg>
)

// Copy Icon Component
const CopyIcon = ({ className = "", ...props }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
)

// Check Icon Component
const CheckIcon = ({ className = "", ...props }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

// Send Icon Component
const SendIcon = ({ className = "", ...props }) => (
  <svg
    className={className}
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
    <path d="m21.854 2.147-10.94 10.939" />
  </svg>
)

// Stop Icon Component
const StopIcon = ({ className = "", ...props }) => (
  <svg
    className={className}
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
  </svg>
)

// Upload Icon Component
const UploadIcon = ({ className = "", ...props }) => (
  <svg
    className={className}
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17,8 12,3 7,8" />
    <line x1="12" x2="12" y1="3" y2="15" />
  </svg>
)

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isStreaming?: boolean
}

interface FileContext {
  name: string
  content: string
  type: string
}

// Code Block Component with Copy Button
const CodeBlock = ({ children, language = "" }) => {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(children)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  return (
    <div className="relative group">
      <div className="absolute top-2 right-2 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={copyToClipboard}
          className="h-8 w-8 p-0 bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 hover:text-white border border-gray-600/50"
        >
          {copied ? (
            <>
              <CheckIcon className="h-4 w-4 text-green-400" />
              <span className="sr-only">Copiado!</span>
            </>
          ) : (
            <>
              <CopyIcon className="h-4 w-4" />
              <span className="sr-only">Copiar código</span>
            </>
          )}
        </Button>
        {copied && (
          <div className="absolute top-10 right-0 bg-green-600 text-white text-xs px-2 py-1 rounded shadow-lg">
            Copiado!
          </div>
        )}
      </div>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto max-h-[500px] overflow-y-auto border border-gray-700">
        <code className={`language-${language}`}>{children}</code>
      </pre>
    </div>
  )
}

// Function to detect if response might be truncated
const detectTruncation = (content: string): boolean => {
  // Check for unclosed code blocks
  const codeBlockMatches = content.match(/```/g)
  if (codeBlockMatches && codeBlockMatches.length % 2 !== 0) {
    return true
  }

  // Check for abrupt endings
  const abruptEndings = [
    /\.\.\.$/, // Ends with ...
    /[^.!?]\s*$/, // Doesn't end with proper punctuation
    /```\s*$/, // Ends with opening code block
    /\*\*[^*]*$/, // Unclosed bold
    /\*[^*]*$/, // Unclosed italic
  ]

  return abruptEndings.some((pattern) => pattern.test(content.trim()))
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [fileContext, setFileContext] = useState<FileContext | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [showTruncationWarning, setShowTruncationWarning] = useState<string | null>(null)
  const [isContinuing, setIsContinuing] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const recognitionRef = useRef<any>(null)

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = "pt-BR"

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
        setIsListening(false)
      }

      recognitionRef.current.onerror = () => {
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }
  }, [])

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true)
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== "text/plain") {
      alert("Por favor, selecione apenas arquivos .txt")
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const reader = new FileReader()
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100
          setUploadProgress(progress)
        }
      }

      reader.onload = (e) => {
        const content = e.target?.result as string
        const markdownContent = content
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
          .map((line) => `> ${line}`)
          .join("\n\n")

        setFileContext({
          name: file.name,
          content: markdownContent,
          type: file.type,
        })

        setUploadProgress(100)
        setTimeout(() => {
          setIsUploading(false)
          setUploadProgress(0)
        }, 500)
      }

      reader.readAsText(file)
    } catch (error) {
      console.error("Erro ao processar arquivo:", error)
      setIsUploading(false)
      setUploadProgress(0)
    }

    event.target.value = ""
  }

  const removeFileContext = () => {
    setFileContext(null)
  }

  const continueResponse = async (messageId: string) => {
    if (!fileContext) {
      alert("É necessário ter um arquivo carregado para continuar a resposta.")
      return
    }

    setIsContinuing(true)
    setShowTruncationWarning(null)

    const continuePrompt =
      "Continue a resposta anterior de onde parou, mantendo o contexto e completando o conteúdo que foi interrompido."

    try {
      abortControllerRef.current = new AbortController()

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: continuePrompt,
          fileContext: fileContext.content,
          fileName: fileContext.name,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error("Falha na requisição")
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("Não foi possível ler a resposta")
      }

      let accumulatedResponse = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") {
              break
            }
            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                accumulatedResponse += parsed.content
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === messageId ? { ...msg, content: msg.content + parsed.content, isStreaming: true } : msg,
                  ),
                )
              }
            } catch (e) {
              console.error("Erro ao parsear JSON:", e)
            }
          }
        }
      }

      setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, isStreaming: false } : msg)))

      // Check for truncation again
      const updatedMessage = messages.find((msg) => msg.id === messageId)
      if (updatedMessage && detectTruncation(updatedMessage.content + accumulatedResponse)) {
        setShowTruncationWarning(messageId)
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Erro ao continuar resposta:", error)
      }
    } finally {
      setIsContinuing(false)
      abortControllerRef.current = null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    if (!fileContext) {
      alert("Por favor, carregue um arquivo .txt antes de fazer perguntas.")
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    }

    setMessages((prev) => [...prev, userMessage, assistantMessage])
    setInput("")
    setIsLoading(true)
    setShowTruncationWarning(null)

    // Scroll to bottom after sending message
    scrollToBottom()

    try {
      abortControllerRef.current = new AbortController()

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input.trim(),
          fileContext: fileContext.content,
          fileName: fileContext.name,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error("Falha na requisição")
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("Não foi possível ler a resposta")
      }

      let accumulatedResponse = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") {
              break
            }
            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                accumulatedResponse += parsed.content
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessage.id ? { ...msg, content: msg.content + parsed.content } : msg,
                  ),
                )
              }
            } catch (e) {
              console.error("Erro ao parsear JSON:", e)
            }
          }
        }
      }

      setMessages((prev) => prev.map((msg) => (msg.id === assistantMessage.id ? { ...msg, isStreaming: false } : msg)))

      // Check for truncation
      if (detectTruncation(accumulatedResponse)) {
        setShowTruncationWarning(assistantMessage.id)
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Erro na requisição:", error)
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id
              ? { ...msg, content: "Erro ao processar sua solicitação. Tente novamente.", isStreaming: false }
              : msg,
          ),
        )
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsLoading(false)
      setMessages((prev) => prev.map((msg) => (msg.isStreaming ? { ...msg, isStreaming: false } : msg)))
    }
  }

  const renderMessageContent = (content: string) => {
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: content.slice(lastIndex, match.index),
        })
      }

      parts.push({
        type: "code",
        language: match[1] || "",
        content: match[2].trim(),
      })

      lastIndex = match.index + match[0].length
    }

    if (lastIndex < content.length) {
      parts.push({
        type: "text",
        content: content.slice(lastIndex),
      })
    }

    return parts.map((part, index) => {
      if (part.type === "code") {
        return (
          <CodeBlock key={index} language={part.language}>
            {part.content}
          </CodeBlock>
        )
      } else {
        return (
          <div key={index} className="whitespace-pre-wrap">
            {part.content}
          </div>
        )
      }
    })
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg">
              <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center">
                <div className="w-3 h-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-sm animate-pulse"></div>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Vini AI
              </h1>
              <p className="text-sm text-gray-400">Assistente Inteligente</p>
            </div>
          </div>

          {fileContext && (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-blue-900/50 text-blue-300 border-blue-700">
                📄 {fileContext.name}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFileContext}
                className="text-gray-400 hover:text-white h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="max-w-4xl mx-auto p-4 space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Olá! Eu sou a Vini AI
                </h2>
                <p className="text-gray-400 mb-6">Carregue um arquivo .txt e faça perguntas sobre seu conteúdo</p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
                >
                  <UploadIcon className="mr-2 h-4 w-4" />
                  Carregar Arquivo
                </Button>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id}>
                <Card
                  className={`${
                    message.role === "user"
                      ? "bg-blue-900/20 border-blue-800/50 ml-12"
                      : "bg-gray-900/50 border-gray-800/50 mr-12"
                  } border rounded-lg`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.role === "user" ? "bg-blue-600" : "bg-gradient-to-br from-purple-500 to-pink-500"
                        }`}
                      >
                        {message.role === "user" ? (
                          <span className="text-sm font-medium">U</span>
                        ) : (
                          <span className="text-sm font-medium">AI</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="prose prose-invert max-w-none">{renderMessageContent(message.content)}</div>
                        {message.isStreaming && (
                          <div className="flex items-center mt-2 text-gray-400">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></div>
                            <span className="text-sm">Digitando...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Truncation Warning */}
                {showTruncationWarning === message.id && (
                  <div className="mt-2 mr-12">
                    <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                        <span className="text-yellow-300 text-sm">Resposta pode estar incompleta</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => continueResponse(message.id)}
                        disabled={isContinuing}
                        className="border-yellow-700 text-yellow-300 hover:bg-yellow-900/20"
                      >
                        {isContinuing ? "Continuando..." : "Continuar Resposta"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="max-w-4xl mx-auto px-4 pb-2">
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">Processando arquivo...</span>
              <span className="text-sm text-gray-400">{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-800 p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex items-end space-x-2">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".txt" className="hidden" />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 h-[50px] px-3"
              disabled={isUploading}
            >
              <UploadIcon className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={isListening ? stopListening : startListening}
              className={`border-gray-700 h-[50px] px-3 ${
                isListening ? "bg-red-900/20 border-red-700 text-red-300" : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <MicrophoneIcon className="h-4 w-4" />
            </Button>

            <div className="flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  fileContext ? "Faça uma pergunta sobre o arquivo..." : "Carregue um arquivo .txt primeiro..."
                }
                disabled={isLoading || !fileContext}
                className="w-full h-[50px] px-4 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {isLoading ? (
              <Button
                type="button"
                onClick={stopGeneration}
                className="bg-red-600 hover:bg-red-700 text-white h-[50px] px-4"
              >
                <StopIcon className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={!input.trim() || !fileContext}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 h-[50px] px-4"
              >
                <SendIcon className="h-4 w-4" />
              </Button>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
