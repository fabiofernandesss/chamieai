"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
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

// Simple code highlighter component
const CodeBlock = ({
  language,
  code,
  onCopy,
  isCopied,
}: {
  language: string
  code: string
  onCopy: () => void
  isCopied: boolean
}) => {
  return (
    <Box className="space-y-2">
      <Flex align="center" justify="between" className="mb-2">
        <span className="chat-badge text-xs px-2 py-1 bg-blue-600/20 text-blue-300 border border-blue-600/30">
          {language.toUpperCase()}
        </span>
        <button
          onClick={onCopy}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white rounded transition-colors"
        >
          {isCopied ? (
            <>
              <CheckIcon className="w-3 h-3" />
              Copiado, massa!
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
        <pre className="code-block">
          <code className={`language-${language}`}>{code}</code>
        </pre>
      </div>
    </Box>
  )
}

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
  const [accumulatedText, setAccumulatedText] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const recognitionRef = useRef<any>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
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

      // Tocar som de resposta recebida
      playSound('receive')

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

  // Função para redimensionar o textarea
  const resizeTextarea = () => {
    if (textareaRef.current) {
      // Reset para altura mínima
      textareaRef.current.style.height = "50px"

      // Se há conteúdo, calcular nova altura
      if (textareaRef.current.value.trim()) {
        const newHeight = Math.max(50, Math.min(textareaRef.current.scrollHeight, 150))
        textareaRef.current.style.height = newHeight + "px"
      }
    }
  }

  // useEffect para redimensionar o textarea quando o input mudar
  useEffect(() => {
    resizeTextarea()
  }, [input])

  // useEffect para debug do favicon e PWA
  useEffect(() => {
    // Debug do favicon
    console.log("🔍 Verificando favicon...")
    const faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement
    if (faviconLink) {
      console.log("✅ Favicon encontrado:", faviconLink.href)

      // Testar se o favicon carrega
      const img = new Image()
      img.onload = () => console.log("✅ Favicon carregou com sucesso!")
      img.onerror = () => console.error("❌ Erro ao carregar favicon!")
      img.src = faviconLink.href
    } else {
      console.error("❌ Favicon não encontrado no DOM!")
    }

    // Debug do PWA - MELHORADO
    console.log("🔍 Verificando PWA...")

    // Verificar suporte a Service Worker
    if ('serviceWorker' in navigator) {
      console.log("✅ Service Worker suportado")

      navigator.serviceWorker.getRegistrations().then(registrations => {
        console.log("📱 Service Workers registrados:", registrations.length)
        registrations.forEach((registration, index) => {
          console.log(`SW ${index + 1}:`, {
            scope: registration.scope,
            state: registration.active?.state,
            installing: !!registration.installing,
            waiting: !!registration.waiting,
            hasUpdateFound: !!registration.onupdatefound
          })
        })

        if (registrations.length === 0) {
          console.warn("⚠️ Nenhum Service Worker registrado ainda")
        }
      }).catch(error => {
        console.error("❌ Erro ao buscar registrations:", error)
      })

      // Escutar eventos do Service Worker
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log("🔄 Service Worker controller mudou!")
      })

      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log("📨 Mensagem do SW:", event.data)
      })

    } else {
      console.warn("⚠️ Service Worker não suportado neste navegador")
    }

    // Verificar manifest - MELHORADO
    const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement
    if (manifestLink) {
      console.log("✅ Manifest encontrado:", manifestLink.href)

      // Testar se o manifest carrega
      fetch(manifestLink.href)
        .then(response => {
          console.log("📱 Manifest response status:", response.status)
          if (response.ok) {
            console.log("✅ Manifest carregou com sucesso!")
            return response.json()
          } else {
            throw new Error(`HTTP ${response.status}`)
          }
        })
        .then(manifest => {
          console.log("📱 Manifest content:", manifest)

          // Verificar campos obrigatórios
          const requiredFields = ['name', 'start_url', 'display', 'icons']
          const missingFields = requiredFields.filter(field => !manifest[field])

          if (missingFields.length > 0) {
            console.warn("⚠️ Campos obrigatórios ausentes no manifest:", missingFields)
          } else {
            console.log("✅ Manifest válido!")
          }

          // Verificar ícones
          if (manifest.icons && manifest.icons.length > 0) {
            console.log("🖼️ Ícones no manifest:", manifest.icons.length)
            manifest.icons.forEach((icon: any, index: number) => {
              console.log(`Ícone ${index + 1}:`, icon)
            })
          } else {
            console.warn("⚠️ Nenhum ícone encontrado no manifest")
          }
        })
        .catch(error => {
          console.error("❌ Erro ao carregar manifest:", error)
        })
    } else {
      console.error("❌ Manifest não encontrado no DOM!")
    }

    // Verificar se é PWA instalável - MELHORADO
    let deferredPrompt: any = null

    const handleBeforeInstallPrompt = (e: any) => {
      console.log("📱 PWA é instalável!")
      e.preventDefault()
      deferredPrompt = e
      console.log("💾 Prompt de instalação salvo")
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log("📱 PWA já está instalado e rodando em modo standalone!")
    } else {
      console.log("🌐 PWA rodando no navegador")
    }

    // Verificar se está sendo servido via HTTPS
    if (location.protocol === 'https:' || location.hostname === 'localhost') {
      console.log("🔒 HTTPS ativo - PWA pode funcionar")
    } else {
      console.warn("⚠️ PWA requer HTTPS para funcionar completamente")
    }

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  // Função para tocar sons de feedback
  const playSound = (type: 'send' | 'receive') => {
    try {
      // Criar contexto de áudio se não existir
      if (typeof window !== 'undefined' && 'AudioContext' in window) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

        // Configurações dos sons
        const soundConfig = {
          send: { frequency: 800, duration: 150, volume: 0.1 },
          receive: { frequency: 600, duration: 200, volume: 0.1 }
        }

        const config = soundConfig[type]

        // Criar oscilador
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        // Conectar nós
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        // Configurar som
        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(config.frequency, audioContext.currentTime)

        // Envelope de volume (fade in/out)
        gainNode.gain.setValueAtTime(0, audioContext.currentTime)
        gainNode.gain.linearRampToValueAtTime(config.volume, audioContext.currentTime + 0.01)
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + config.duration / 1000)

        // Tocar som
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + config.duration / 1000)

        console.log(`🔊 Som ${type} tocado`)
      }
    } catch (error) {
      console.log("🔇 Não foi possível tocar som:", error)
    }
  }

  // Função para gerenciar foco no mobile
  const handleInputFocus = () => {
    if (window.innerWidth <= 480) {
      document.body.classList.add('input-focused')
      // Scroll para o input após um pequeno delay
      setTimeout(() => {
        textareaRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }, 300)
    }
  }

  const handleInputBlur = () => {
    if (window.innerWidth <= 480) {
      document.body.classList.remove('input-focused')
    }
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

        recognition.continuous = false
        recognition.interimResults = false
        recognition.lang = "pt-BR"
        recognition.maxAlternatives = 1

        recognition.onstart = () => {
          setIsRecording(true)
          setRecordingTime(0)
          console.log("🎤 Gravação iniciada")
          recordingIntervalRef.current = setInterval(() => {
            setRecordingTime((prev) => prev + 1)
          }, 1000)

          // Timer de 3 segundos
          silenceTimerRef.current = setTimeout(() => {
            if (isRecording) {
              console.log("🎤 Parando por tempo limite")
              stopRecording()
            }
          }, 3000)
        }

        recognition.onresult = (event: any) => {
          // Limpar timer
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current)
            silenceTimerRef.current = null
          }

          // Pegar apenas o resultado final (sem interim)
          const transcript = event.results[0][0].transcript
          
          // Adicionar ao input existente
          const currentText = input.trim()
          const separator = currentText ? " " : ""
          const newText = currentText + separator + transcript.trim()
          
          setInput(newText)
          console.log("🎤 Texto reconhecido:", transcript)
        }

        recognition.onerror = (event: any) => {
          console.error("Erro no reconhecimento de voz:", event.error)
          stopRecording()
          alert("❌ Eita, deu erro no reconhecimento de voz. Tente de novo, meu rei!")
        }

        recognition.onend = () => {
          stopRecording()
        }

        recognitionRef.current = recognition
        recognition.start()
      } else {
        alert("❌ Oxente, seu navegador não suporta reconhecimento de voz não, bichinho.")
      }
    } catch (error) {
      console.error("Erro ao iniciar gravação:", error)
      alert("❌ Vixe, erro ao acessar o microfone. Dê uma olhada nas permissões aí, meu rei!")
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
      recordingIntervalRef.current = null
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    setIsRecording(false)
    setRecordingTime(0)
    console.log("🎤 Gravação finalizada. Texto final:", input)
    // Limpar accumulated text para próxima gravação
    setTimeout(() => {
      setAccumulatedText("")
    }, 100)
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
      alert("❌ Oxente, só aceito arquivos .txt, viu!")
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
      alert("❌ Eita, deu erro ao processar o arquivo!")
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
        content: "Oxente, continue a resposta anterior aí, por favor!",
      })
    }
    setContinuingMessage(null)
  }

  // Função para renderizar markdown em JSX
  const renderMarkdownText = (text: string) => {
    const lines = text.split('\n')
    const elements: React.ReactNode[] = []

    lines.forEach((line, lineIndex) => {
      if (line.trim() === '') {
        return // Remove linhas vazias
      }

      // Processar linha por linha
      let processedLine: React.ReactNode[] = []
      let currentText = line
      let elementIndex = 0

      // Detectar listas
      const listMatch = currentText.match(/^(\s*)[*+-]\s+(.*)$/)
      if (listMatch) {
        const indent = listMatch[1].length
        const content = listMatch[2]
        const processedContent = processInlineFormatting(content, `${lineIndex}-list`)

        elements.push(
          <div key={`list-${lineIndex}`} className={`flex items-start gap-2 ${indent > 0 ? 'ml-4' : ''}`}>
            <span className="text-blue-400 mt-1 text-sm">•</span>
            <span className="flex-1">{processedContent}</span>
          </div>
        )
        return
      }

      // Detectar títulos
      const headerMatch = currentText.match(/^(#{1,6})\s+(.*)$/)
      if (headerMatch) {
        const level = headerMatch[1].length
        const content = headerMatch[2]
        const processedContent = processInlineFormatting(content, `${lineIndex}-header`)

        const headerClass = level === 1 ? 'text-xl font-bold text-white' :
          level === 2 ? 'text-lg font-bold text-gray-200' :
            'text-base font-semibold text-gray-300'

        elements.push(
          <div key={`header-${lineIndex}`} className={headerClass}>
            {processedContent}
          </div>
        )
        return
      }

      // Linha normal com formatação inline
      const processedContent = processInlineFormatting(currentText, lineIndex.toString())
      elements.push(
        <div key={`line-${lineIndex}`} className="leading-tight">
          {processedContent}
        </div>
      )
    })

    return <div>{elements}</div>
  }

  // Função para processar formatação inline (negrito, itálico)
  const processInlineFormatting = (text: string, baseKey: string) => {
    const elements: React.ReactNode[] = []
    let currentIndex = 0
    let elementKey = 0

    // Regex para detectar **negrito**, *itálico*, `código inline`
    const formatRegex = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g
    let match

    while ((match = formatRegex.exec(text)) !== null) {
      // Adicionar texto antes da formatação
      if (match.index > currentIndex) {
        const beforeText = text.slice(currentIndex, match.index)
        if (beforeText) {
          elements.push(
            <span key={`${baseKey}-text-${elementKey++}`}>{beforeText}</span>
          )
        }
      }

      // Adicionar elemento formatado
      if (match[2]) {
        // **negrito**
        elements.push(
          <strong key={`${baseKey}-bold-${elementKey++}`} className="font-bold text-white">
            {match[2]}
          </strong>
        )
      } else if (match[3]) {
        // *itálico*
        elements.push(
          <em key={`${baseKey}-italic-${elementKey++}`} className="italic text-gray-200">
            {match[3]}
          </em>
        )
      } else if (match[4]) {
        // `código inline`
        elements.push(
          <code key={`${baseKey}-code-${elementKey++}`} className="bg-gray-800 text-blue-300 px-1 py-0.5 rounded text-sm font-mono">
            {match[4]}
          </code>
        )
      }

      currentIndex = match.index + match[0].length
    }

    // Adicionar texto restante
    if (currentIndex < text.length) {
      const remainingText = text.slice(currentIndex)
      if (remainingText) {
        elements.push(
          <span key={`${baseKey}-text-${elementKey++}`}>{remainingText}</span>
        )
      }
    }

    return elements.length > 0 ? elements : text
  }

  const renderMessage = (content: string) => {
    const isLikelyTruncated = (text: string) => {
      const hasUnclosedCode = (text.match(/```/g) || []).length % 2 !== 0
      const endsAbruptly = !text.trim().match(/[.!?}>`\n]$/)
      return hasUnclosedCode || (text.includes("```") && endsAbruptly)
    }

    // Detecta blocos de código em tempo real
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g
    const parts: Array<{ type: "text" | "code", content: string, key: string, language?: string }> = []
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
      const rawLanguage = match[1]
      const language = rawLanguage && rawLanguage.trim() ? rawLanguage.trim() : "text"
      const code = match[2] || ""
      parts.push({
        type: "code",
        language: language as string,
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

    // Se não há código, retorna texto com formatação markdown
    if (parts.length === 0) {
      return (
        <div className="leading-tight font-modern text-gray-200">
          {renderMarkdownText(content.trim())}
        </div>
      )
    }

    return (
      <div className="message-content space-y-2">
        {parts.map((part, index) => {
          if (part.type === "code") {
            return (
              <CodeBlock
                key={part.key}
                language={part.language || "text"}
                code={part.content}
                onCopy={() => copyToClipboard(part.content, part.key)}
                isCopied={copiedCode === part.key}
              />
            )
          } else {
            return (
              <div key={part.key} className="leading-tight font-modern text-gray-200">
                {renderMarkdownText(part.content.trim())}
              </div>
            )
          }
        })}
      </div>
    )
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    if (uploadedFile && !input.trim()) {
      alert("💡 Oxente, faça uma pergunta sobre o arquivo carregado, meu rei!")
      return
    }

    // Tocar som de envio
    playSound('send')

    handleSubmit(e)
    setAccumulatedText("") // Limpar texto acumulado após enviar
    // Scroll para baixo após enviar
    setTimeout(() => {
      scrollToBottom()
    }, 100)
  }

  return (
    <Theme appearance="dark" className="min-h-screen bg-black font-modern">
      <Box className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="chat-container">
          {/* Header */}
          <Box className="header-container">
            <Container size="3" className="p-4 md:p-6">
              <Flex align="center" justify="between">
                {/* Left Side - Logo and Title */}
                <Flex align="center" gap="3" className="md:gap-4">
                  {/* macOS Traffic Lights - Smaller on mobile, centered */}
                  <Flex gap="1.5" className="md:gap-2 md:mr-1">
                    <Box className="traffic-light traffic-light-red"></Box>
                    <Box className="traffic-light traffic-light-yellow"></Box>
                    <Box className="traffic-light traffic-light-green"></Box>
                  </Flex>

                  <Flex align="center" gap="3">
                    <div className="chamie-logo">
                      <ChatBubbleIcon className="chamie-logo-icon w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <Box>
                      <Text size="4" className="md:text-xl font-bold text-white font-modern">
                        Chamie AI
                      </Text>
                      <Text size="1" className="text-gray-400 hidden md:block font-modern md:text-sm">
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
                    <span className="hidden md:inline">Arquivo</span>
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
            </Container>
          </Box>

          {/* File Upload Progress */}
          {isProcessing && (
            <Box className="file-processing-card p-4">
              <Flex align="center" gap="3">
                <FileTextIcon className="w-5 h-5 text-blue-400" />
                <Box className="flex-1">
                  <Text size="2" className="text-gray-300 mb-2 font-modern">
                    Eita, processando o arquivo aqui... {uploadProgress}%
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

          {/* Audio Recording Indicator + Uploaded File Info - Container Combinado */}
          {(isRecording || uploadedFile) && (
            <div className="combined-info-container">
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

              {/* Uploaded File Info */}
              {uploadedFile && (
                <Box className="file-upload-card p-4">
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
            </div>
          )}

          {/* Hidden File Input */}
          <input ref={fileInputRef} type="file" accept=".txt" onChange={handleFileUpload} className="hidden" />

          {/* Chat Messages */}
          <div className="chat-messages">
            <ScrollArea ref={scrollAreaRef} className="h-full messages-scroll">
              <Container size="3" className="p-4 md:p-6">
                {messages.length === 0 ? (
                  <div className="welcome-section">
                    <div className="welcome-content">
                      {/* Logo animado */}
                      <div className="welcome-logo">
                        <div className="logo-glow"></div>
                        <ChatBubbleIcon className="logo-icon" />
                      </div>

                      {/* Texto principal */}
                      <div className="welcome-text">
                        <h1 className="welcome-title">
                          Eita! Eu sou o <span className="gradient-text">Chamie AI</span>
                        </h1>
                        <p className="welcome-subtitle">
                          Arretado pra responder perguntas, gerar códigos HTML e resolver qualquer parada!
                        </p>
                        {!uploadedFile && (
                          <div className="welcome-tip">
                            <span className="tip-icon">💡</span>
                            <span className="tip-text">
                              Eita, faça upload de um arquivo .txt ou pdf pra fazer perguntas sobre o conteúdo!
                            </span>
                          </div>
                        )}
                      </div>



                      {/* Call to action */}
                      <div className="welcome-cta">
                        <div className="cta-text">Comece digitando sua pergunta abaixo</div>
                        <div className="cta-arrow">↓</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Box className="space-y-4">
                    {messages.map((message) => (
                      <Flex key={message.id} className={message.role === "user" ? "justify-end" : "justify-start"}>
                        <Box className={`max-w-[85%] md:max-w-[75%]`}>
                          <div className={`p-3 ${message.role === "user" ? "message-card-user" : "message-card-ai"}`}>
                            {message.role === "user" ? (
                              <Text className="whitespace-pre-wrap leading-relaxed font-modern">{message.content}</Text>
                            ) : (
                              renderMessage(message.content)
                            )}
                          </div>
                          {message.role === "assistant" && truncatedMessages.has(message.id) && (
                            <Box className="mt-2">
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
                                    Continuar aí
                                  </>
                                )}
                              </button>
                            </Box>
                          )}
                          <Box className={`mt-1 px-2 ${message.role === "user" ? "text-right" : "text-left"}`}>
                            <Text size="1" className="text-gray-500 font-modern">
                              {message.role === "user" ? "Você" : "Chamie AI"}
                            </Text>
                          </Box>
                        </Box>
                      </Flex>
                    ))}

                    {isLoading && (
                      <Flex justify="start">
                        <Box className="max-w-[85%] md:max-w-[75%]">
                          <div className="message-card-ai p-3">
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
                                Chamie AI tá pensando aqui, viu...
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
                              ❌ Vixe, deu erro: {error.message}
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
                <div className="chat-input-wrapper">
                  <textarea
                    ref={textareaRef}
                    placeholder="Digite sua mensagem"
                    value={input}
                    onChange={handleInputChange}
                    disabled={isLoading || isRecording}
                    className="chat-input"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleFormSubmit(e)
                      }
                    }}
                    onInput={resizeTextarea}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                  />

                  <div className="chat-buttons">
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
                  </div>
                </div>
              </form>
            </Container>
          </div>
        </div>
      </Box>
    </Theme>
  )
}
