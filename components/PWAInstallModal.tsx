"use client"

import { useState, useEffect } from "react"
import { Box, Text, Flex } from "@radix-ui/themes"
import { Cross2Icon, DownloadIcon } from "@radix-ui/react-icons"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallModal() {
  const [showModal, setShowModal] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Detectar se é Android
    const isAndroid = /Android/i.test(navigator.userAgent)
    
    // Detectar se já está instalado como PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://')

    // Verificar se já foi dispensado antes (localStorage)
    const wasDismissed = localStorage.getItem('pwa-install-dismissed') === 'true'

    if (!isAndroid || isStandalone || wasDismissed) {
      return
    }

    // Escutar evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const promptEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(promptEvent)
      
      // Mostrar modal após 2 segundos
      setTimeout(() => {
        setShowModal(true)
      }, 2000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      console.log(`PWA install prompt: ${outcome}`)
      
      setShowModal(false)
      setDeferredPrompt(null)
      
      // Salvar que o usuário interagiu
      localStorage.setItem('pwa-install-dismissed', 'true')
    } catch (error) {
      console.error('Erro ao instalar PWA:', error)
    }
  }

  const handleDismiss = () => {
    setShowModal(false)
    // Salvar que foi dispensado (não mostrar novamente)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  if (!showModal) return null

  return (
    <>
      {/* Overlay */}
      <div className="pwa-modal-overlay" onClick={handleDismiss}>
        <div className="pwa-modal-container" onClick={(e) => e.stopPropagation()}>
          {/* Botão fechar */}
          <button className="pwa-modal-close" onClick={handleDismiss}>
            <Cross2Icon className="w-4 h-4" />
          </button>

          {/* Conteúdo */}
          <div className="pwa-modal-content">
            {/* Imagem */}
            <div className="pwa-modal-image">
              <img 
                src="/Metatag.png" 
                alt="Chamie AI" 
                className="pwa-modal-img"
              />
            </div>

            {/* Texto */}
            <div className="pwa-modal-text">
              <Text size="4" weight="bold" className="text-white font-modern mb-2">
                Instalar Chamie AI
              </Text>
              <Text size="2" className="text-gray-300 font-modern mb-4">
                 Que tal instalar o app pra ter acesso mais rápido, iai boy?
              </Text>
            </div>

            {/* Botões */}
            <div className="pwa-modal-buttons">
              <button className="pwa-modal-btn-secondary" onClick={handleDismiss}>
                Agora não
              </button>
              <button className="pwa-modal-btn-primary" onClick={handleInstall}>
                <DownloadIcon className="w-4 h-4 mr-2" />
                Instalar App
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}