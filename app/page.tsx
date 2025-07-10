"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Theme, Text, ScrollArea, Flex, Box, Container } from "@radix-ui/themes"
import {
  PaperPlaneIcon,
  StopIcon,
  ChatBubbleIcon,
  FileTextIcon,
  UploadIcon,
  Cross2Icon,
  CopyIcon,
  CheckIcon,
} from "@radix-ui/react-icons"
import { useChat } from "ai/react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"

// Custom microphone icon component
const MicrophoneIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M7.5 1C6.67157 1 6 1.67157 6 2.5V7.5C6 8.32843 6.67157 9 7.5 9C8.32843 9 9 8.32843 9 7.5V2.5C9 1.67157 8.32843 1 7.5 1ZM5 2.5C5 1.11929 6.11929 0 7.5 0C8.88071 0 10 1.11929 10 2.5V7.5C10 8.88071 8.88071 10 7.5 10C6.11929 10 5 8.88071 5 7.5V2.5ZM3.5 6.5C3.77614 6.5 4 6.72386 4 7V7.5C4 9.433 5.567 11 7.5 11C9.433 11 11 9.433 11 7.5V7C11 6.72386 11.2239 6.5 11.5 6.5C11.7761 6.5 12 6.72386 12 7V7.5C12 9.98528 9.98528 12 7.5 12C5.01472 12 3 9.98528 3 7.5V7C3 6.72386 3.22386 6.5 3.5 6.5ZM7 12.5C7 12.2239 7.22386 12 7.5 12C7.77614 12 8 12.2239 8 12.5V14H9.5C9.77614 14 10 14.2239 10 14.5C10 14.7761 9.77614 15 9.5 15H5.5C5.22386 15 5 14.7761 5 14.5C5 14.2239 5.22386 14 5.5 14H7V12.5Z"
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
    />
  </svg>
)

export default function ChatApp() {
  const [isStreaming, setIsStreaming] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{
    name: string
    content: string
    markdown: string
  } | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const recognitionRef = useRef<any>(null)
  const [truncatedMessages, setTruncatedMessages] = useState<Set<string>>(new Set())
  const [continuingMessage, setContinuingMessage] = useState<string | null>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading, stop, error, setInput, append } = useChat({
    api: "/api/chat",
    body: {
      fileContext: uploadedFile?.markdown || null,
      requireFileContext: !!uploadedFile,
    },
    onResponse: () => {
      console.log("✅ Resposta iniciada")
      setIsStreaming(true)
    },
    onFinish: (message) => {
      console.log("✅ Resposta finalizada")
      setIsStreaming(false)

      // Detectar se a resposta pode ter sido truncada
      const content = message.content || ""
      const lastChar = content.trim().slice(-1)
      const hasCodeBlock = content.includes("```")
      const unclosedCodeBlock = (content.match(/```/g) || []).length % 2 !== 0

      // Se termina abruptamente ou tem bloco de código não fechado
      if (unclosedCodeBlock || (hasCodeBlock && !lastChar.match(/[.!?}`]$/))) {
        setTruncatedMessages((prev) => new Set([...prev, message.id]))
      }

      scrollToBottom()
    },
    onError: (error) => {
      console.error("❌ Erro no chat:", error)
      setIsStreaming(false)
    },
  })

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  const handleStop = () => {
    stop()
    setIsStreaming(false)
    scrollToBottom()
  }

  // Copy code function
  const copyToClipboard = async (code: string, key: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(key)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      console.error("Erro ao copiar:", err)
    }
  }

  // Função para iniciar gravação de áudio
  const startRecording = async () => {
    try {
      // Verificar se o navegador suporta Web Speech API
      if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        const recognition = new SpeechRecognition()

        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = "pt-BR"

        recognition.onstart = () => {
          setIsRecording(true)
          setRecordingTime(0)
          recordingIntervalRef.current = setInterval(() => {
            setRecordingTime((prev) => prev + 1)
          }, 1000)
        }

        recognition.onresult = (event: any) => {
          let finalTranscript = ""
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript
            }
          }
          if (finalTranscript) {
            setInput(finalTranscript.trim())
          }
        }

        recognition.onerror = (event: any) => {
          console.error("Erro no reconhecimento de voz:", event.error)
          stopRecording()
          alert("❌ Erro no reconhecimento de voz. Tente novamente.")
        }

        recognition.onend = () => {
          stopRecording()
        }

        recognitionRef.current = recognition
        recognition.start()
      } else {
        alert("❌ Seu navegador não suporta reconhecimento de voz.")
      }
    } catch (error) {
      console.error("Erro ao iniciar gravação:", error)
      alert("❌ Erro ao acessar o microfone. Verifique as permissões.")
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
    }
    setIsRecording(false)
    setRecordingTime(0)
  }

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Função para converter texto simples em Markdown
  const convertTextToMarkdown = (text: string): string => {
    let markdown = text

    // Converter linhas que começam com números em listas ordenadas
    markdown = markdown.replace(/^(\d+)\.\s+(.+)$/gm, "$1. $2")

    // Converter linhas que começam com - ou * em listas não ordenadas
    markdown = markdown.replace(/^[-*]\s+(.+)$/gm, "- $1")

    // Converter linhas em MAIÚSCULAS em títulos
    markdown = markdown.replace(/^([A-Z\s]{3,})$/gm, "# $1")

    // Converter linhas que terminam com : em subtítulos
    markdown = markdown.replace(/^(.+):$/gm, "## $1")

    // Converter texto entre aspas em código inline
    markdown = markdown.replace(/"([^"]+)"/g, "`$1`")

    // Converter URLs em links
    markdown = markdown.replace(/(https?:\/\/[^\s]+)/g, "[$1]($1)")

    // Adicionar quebras de linha duplas para parágrafos
    markdown = markdown.replace(/\n\n/g, "\n\n")

    // Converter seções separadas por linhas vazias em parágrafos
    markdown = markdown.replace(/\n{3,}/g, "\n\n")

    return markdown
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar formato
    if (!file.name.toLowerCase().endsWith(".txt")) {
      alert("❌ Apenas arquivos .txt são aceitos!")
      return
    }

    setIsProcessing(true)
    setUploadProgress(0)

    try {
      // Simular progresso de leitura
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 100)

      // Ler o arquivo
      const text = await file.text()

      // Converter para Markdown
      const markdown = convertTextToMarkdown(text)

      // Finalizar progresso
      setUploadProgress(100)

      setTimeout(() => {
        setUploadedFile({
          name: file.name,
          content: text,
          markdown: markdown,
        })
        setIsProcessing(false)
        setUploadProgress(0)
      }, 500)
    } catch (error) {
      console.error("Erro ao processar arquivo:", error)
      alert("❌ Erro ao processar o arquivo!")
      setIsProcessing(false)
      setUploadProgress(0)
    }

    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
  }

  const continueResponse = async (messageId: string) => {
    setContinuingMessage(messageId)
    const lastMessage = messages.find((m) => m.id === messageId)
    if (lastMessage) {
      await append({
        role: "user",
        content: "Continue a resposta anterior, por favor.",
      })
    }
    setContinuingMessage(null)
  }

  const renderMessage = (content: string) => {
    const isLikelyTruncated = (text: string) => {
      const hasUnclosedCode = (text.match(/```/g) || []).length % 2 !== 0
      const endsAbruptly = !text.trim().match(/[.!?}>`\n]$/)
      return hasUnclosedCode || (text.includes("```") && endsAbruptly)
    }
    // Detecta blocos de código em tempo real
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Adiciona texto antes do código
      if (match.index > lastIndex) {
        const textBefore = content.slice(lastIndex, match.index)
        if (textBefore.trim()) {
          parts.push({
            type: "text",
            content: textBefore,
            key: `text-${lastIndex}`,
          })
        }
      }

      // Adiciona o bloco de código
      const language = match[1] || "text"
      const code = match[2] || ""
      parts.push({
        type: "code",
        language,
        content: code,
        key: `code-${match.index}`,
      })

      lastIndex = match.index + match[0].length
    }

    // Adiciona texto restante
    if (lastIndex < content.length) {
      const remainingText = content.slice(lastIndex)
      if (remainingText.trim()) {
        parts.push({
          type: "text",
          content: remainingText,
          key: `text-${lastIndex}`,
        })
      }
    }

    // Se não há código, retorna texto simples
    if (parts.length === 0) {
      return <Text className="whitespace-pre-wrap leading-relaxed font-modern">{content}</Text>
    }

    return (
      <div className="message-content space-y-4">
        {parts.map((part, index) => {
          if (part.type === "code") {
            return (
              <Box key={part.key} className="space-y-2">
                <Flex align="center" justify="between" className="mb-2">
                  <span className="chat-badge text-xs px-2 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {part.language.toUpperCase()}
                  </span>
                  <button
                    onClick={() => copyToClipboard(part.content, part.key)}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white rounded transition-colors"
                  >
                    {copiedCode === part.key ? (
                      <>
                        <CheckIcon className="w-3 h-3" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <CopyIcon className="w-3 h-3" />
                        Copiar
                      </>
                    )}
                  </button>
                </Flex>
                <div className="code-container">
                  <SyntaxHighlighter
                    language={part.language}
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      padding: "1rem",
                      background: "rgba(17, 24, 39, 0.8)",
                      fontSize: "14px",
                      lineHeight: "1.5",
                      fontFamily: "SF Mono, Monaco, Inconsolata, Roboto Mono, Consolas, Courier New, monospace",
                      borderRadius: "5px",
                      maxWidth: "100%",
                      overflowX: "auto",
                      wordWrap: "normal",
                      whiteSpace: "pre",
                    }}
                    showLineNumbers={part.content.split("\n").length > 5}
                    wrapLines={false}
                    wrapLongLines={false}
                  >
                    {part.content}
                  </SyntaxHighlighter>
                </div>
              </Box>
            )
          } else {
            return (
              <Text key={part.key} className="whitespace-pre-wrap leading-relaxed font-modern">
                {part.content}
              </Text>
            )
          }
        })}
        {isLikelyTruncated(content) && (
          <div className="flex items-center gap-2 text-yellow-400 text-sm mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            Resposta pode estar incompleta
          </div>
        )}
      </div>
    )
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    if (uploadedFile && !input.trim()) {
      alert("💡 Faça uma pergunta sobre o arquivo carregado!")
      return
    }
    handleSubmit(e)
    // Scroll para baixo após enviar
    setTimeout(() => {
      scrollToBottom()
    }, 100)
  }

  return (
    <Theme appearance="dark" className="min-h-screen bg-black font-modern">
      <Box className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="chat-container">
          {/* Header */}
          <Box className="header-container">
            <Flex align="center" justify="between" className="p-4 md:p-6">
              {/* Left Side - Logo and Title */}
              <Flex align="center" gap="4">
                {/* macOS Traffic Lights - Hidden on mobile */}
                <Flex gap="2" className="hidden md:flex">
                  <Box className="traffic-light traffic-light-red"></Box>
                  <Box className="traffic-light traffic-light-yellow"></Box>
                  <Box className="traffic-light traffic-light-green"></Box>
                </Flex>

                <Flex align="center" gap="3">
                  <div className="vini-logo">
                    <ChatBubbleIcon className="vini-logo-icon w-6 h-6 text-white" />
                  </div>
                  <Box>
                    <Text size="5" weight="bold" className="text-white font-modern">
                      Vini AI
                    </Text>
                    <Text size="2" className="text-gray-400 hidden md:block font-modern">
                      Assistente Inteligente
                    </Text>
                  </Box>
                </Flex>
              </Flex>

              {/* Right Side - Actions */}
              <Flex align="center" gap="3">
                {/* Upload Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="chat-button chat-button-secondary"
                >
                  <UploadIcon className="w-4 h-4" />
                  <span className="hidden md:inline">Upload</span>
                </button>

                {/* Status Badge */}
                {isStreaming && (
                  <div className="chat-badge bg-green-500/20 text-green-300 border border-green-500/30 animate-pulse px-3 py-1">
                    <Flex align="center" gap="2">
                      <Box className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></Box>
                      <Text size="1" className="hidden md:inline font-modern">
                        Gerando...
                      </Text>
                    </Flex>
                  </div>
                )}
              </Flex>
            </Flex>
          </Box>

          {/* Audio Recording Indicator */}
          {isRecording && (
            <div className="audio-recording-indicator">
              <Flex align="center" justify="between">
                <Flex align="center" gap="3">
                  <div className="audio-waveform">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="audio-waveform-bar"></div>
                    ))}
                  </div>
                  <Text size="2" className="text-red-300 font-modern">
                    🎤 Gravando... {formatRecordingTime(recordingTime)}
                  </Text>
                </Flex>
                <button
                  onClick={stopRecording}
                  className="chat-button chat-button-danger"
                  style={{ height: "32px", padding: "0 12px" }}
                >
                  <StopIcon className="w-3 h-3" />
                  <span className="text-xs">Parar</span>
                </button>
              </Flex>
            </div>
          )}

          {/* File Upload Progress */}
          {isProcessing && (
            <Box className="file-processing-card p-4 m-4">
              <Flex align="center" gap="3">
                <FileTextIcon className="w-5 h-5 text-blue-400" />
                <Box className="flex-1">
                  <Text size="2" className="text-gray-300 mb-2 font-modern">
                    Processando arquivo... {uploadProgress}%
                  </Text>
                  <div className="progress-root h-2 w-full">
                    <div
                      className="progress-indicator h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </Box>
              </Flex>
            </Box>
          )}

          {/* Uploaded File Info */}
          {uploadedFile && (
            <Box className="file-upload-card p-4 m-4">
              <Flex align="center" justify="between" className="p-3">
                <Flex align="center" gap="3">
                  <FileTextIcon className="w-5 h-5 text-green-400" />
                  <Box>
                    <Text size="3" weight="bold" className="text-green-300 font-modern">
                      📄 {uploadedFile.name}
                    </Text>
                    <Text size="2" className="text-green-400 font-modern">
                      Arquivo carregado! Faça perguntas sobre o conteúdo.
                    </Text>
                  </Box>
                </Flex>
                <button
                  onClick={removeFile}
                  className="chat-button chat-button-danger"
                  style={{ height: "32px", padding: "0 8px" }}
                >
                  <Cross2Icon className="w-3 h-3" />
                </button>
              </Flex>
            </Box>
          )}

          {/* Hidden File Input */}
          <input ref={fileInputRef} type="file" accept=".txt" onChange={handleFileUpload} className="hidden" />

          {/* Chat Messages */}
          <div className="chat-messages">
            <ScrollArea ref={scrollAreaRef} className="h-full messages-scroll">
              <Container size="3" className="p-4 md:p-6">
                {messages.length === 0 ? (
                  <Flex direction="column" align="center" justify="center" className="h-full text-center" gap="6">
                    <div className="header-logo p-4">
                      <ChatBubbleIcon className="w-12 h-12 text-white" />
                    </div>
                    <Box>
                      <Text size="6" weight="bold" className="text-white font-modern">
                        Olá! Eu sou a Vini AI
                      </Text>
                      <Text size="3" className="text-gray-400 max-w-md mt-2 font-modern">
                        Seu assistente inteligente para responder perguntas, gerar código e ajudar com qualquer tarefa.
                        {!uploadedFile && (
                          <Text as="span" className="block mt-2 text-purple-400 font-modern">
                            💡 Faça upload de um arquivo .txt para fazer perguntas sobre seu conteúdo!
                          </Text>
                        )}
                      </Text>
                    </Box>
                  </Flex>
                ) : (
                  <Box className="space-y-6">
                    {messages.map((message) => (
                      <Flex key={message.id} className={message.role === "user" ? "justify-end" : "justify-start"}>
                        <Box className={`max-w-[85%] md:max-w-[75%]`}>
                          <div className={`p-4 ${message.role === "user" ? "message-card-user" : "message-card-ai"}`}>
                            {message.role === "user" ? (
                              <Text className="whitespace-pre-wrap leading-relaxed font-modern">{message.content}</Text>
                            ) : (
                              renderMessage(message.content)
                            )}
                          </div>
                          {message.role === "assistant" && truncatedMessages.has(message.id) && (
                            <Box className="mt-3">
                              <button
                                onClick={() => continueResponse(message.id)}
                                disabled={continuingMessage === message.id || isLoading}
                                className="chat-button chat-button-secondary text-sm"
                                style={{ height: "36px", padding: "0 12px" }}
                              >
                                {continuingMessage === message.id ? (
                                  <>
                                    <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                                    Continuando...
                                  </>
                                ) : (
                                  <>
                                    <PaperPlaneIcon className="w-3 h-3 mr-2" />
                                    Continuar resposta
                                  </>
                                )}
                              </button>
                            </Box>
                          )}
                          <Box className={`mt-2 px-2 ${message.role === "user" ? "text-right" : "text-left"}`}>
                            <Text size="1" className="text-gray-500 font-modern">
                              {message.role === "user" ? "Você" : "Vini AI"}
                            </Text>
                          </Box>
                        </Box>
                      </Flex>
                    ))}

                    {isLoading && (
                      <Flex justify="start">
                        <Box className="max-w-[85%] md:max-w-[75%]">
                          <div className="message-card-ai p-4">
                            <Flex align="center" gap="2">
                              <Flex gap="1">
                                {[0, 1, 2].map((i) => (
                                  <Box
                                    key={i}
                                    className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                                    style={{ animationDelay: `${i * 0.2}s` }}
                                  ></Box>
                                ))}
                              </Flex>
                              <Text size="2" className="text-gray-400 font-modern">
                                Vini AI está pensando...
                              </Text>
                            </Flex>
                          </div>
                        </Box>
                      </Flex>
                    )}

                    {error && (
                      <Flex justify="start">
                        <Box className="max-w-[85%] md:max-w-[75%]">
                          <div className="p-4 bg-red-800/40 border border-red-700/50 chat-card">
                            <Text size="2" className="text-red-300 font-modern">
                              ❌ Erro: {error.message}
                            </Text>
                          </div>
                        </Box>
                      </Flex>
                    )}
                    <div ref={messagesEndRef} />
                  </Box>
                )}
              </Container>
            </ScrollArea>
          </div>

          {/* Fixed Input Form at Bottom */}
          <div className="chat-input-container">
            <Container size="3" className="p-4 md:p-6">
              <form onSubmit={handleFormSubmit}>
                <Flex gap="3" align="center">
                  <Box className="flex-1">
                    <input
                      type="text"
                      placeholder={uploadedFile ? "Pergunte algo sobre o arquivo..." : "Digite sua mensagem aqui..."}
                      value={input}
                      onChange={handleInputChange}
                      disabled={isLoading || isRecording}
                      className="chat-input"
                    />
                  </Box>

                  {/* Audio Button */}
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isLoading}
                    className={`chat-button ${isRecording ? "chat-button-danger recording" : "chat-button-audio"}`}
                  >
                    <MicrophoneIcon className="w-4 h-4" />
                  </button>

                  {isStreaming ? (
                    <button type="button" onClick={handleStop} className="chat-button chat-button-danger">
                      <StopIcon className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isLoading || !input.trim() || isRecording}
                      className="chat-button chat-button-primary"
                    >
                      <PaperPlaneIcon className="w-4 h-4" />
                    </button>
                  )}
                </Flex>
              </form>
            </Container>
          </div>
        </div>
      </Box>
    </Theme>
  )
}
