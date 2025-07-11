const CACHE_NAME = "vini-ai-v1.2.0"
const urlsToCache = [
  "/",
  "/favicon.png",
  "/metatag.png",
  "/manifest.json",
]

// Debug logs
console.log("🔧 Service Worker: Iniciando v1.2.0...")

self.addEventListener("install", (event) => {
  console.log("🔧 Service Worker: Instalando...")
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log("✅ Cache aberto:", CACHE_NAME)
        
        // Cachear arquivos um por um para melhor debug
        const cachePromises = urlsToCache.map(url => {
          return cache.add(url)
            .then(() => console.log("✅ Cacheado:", url))
            .catch(error => {
              console.error("❌ Erro ao cachear:", url, error)
              // Não falhar completamente se um arquivo não puder ser cacheado
              return Promise.resolve()
            })
        })
        
        return Promise.all(cachePromises)
      })
      .then(() => {
        console.log("✅ Service Worker instalado com sucesso!")
        return self.skipWaiting() // Força ativação imediata
      })
      .catch((error) => {
        console.error("❌ Erro na instalação do SW:", error)
      })
  )
})

self.addEventListener("fetch", (event) => {
  // Ignorar requisições não-HTTP e de extensões
  if (!event.request.url.startsWith('http') || 
      event.request.url.includes('chrome-extension') ||
      event.request.url.includes('moz-extension')) {
    return
  }

  // Estratégia cache-first para recursos estáticos
  if (event.request.url.includes('.png') || 
      event.request.url.includes('.jpg') || 
      event.request.url.includes('.svg') ||
      event.request.url.includes('.ico') ||
      event.request.url.includes('manifest.json')) {
    
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            console.log("📦 Cache hit:", event.request.url)
            return response
          }
          
          console.log("🌐 Fetching:", event.request.url)
          return fetch(event.request)
            .then((response) => {
              if (response && response.status === 200) {
                const responseToCache = response.clone()
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, responseToCache)
                    console.log("💾 Cached:", event.request.url)
                  })
              }
              return response
            })
            .catch(error => {
              console.error("❌ Fetch failed:", event.request.url, error)
              return new Response('Offline', { status: 503 })
            })
        })
    )
    return
  }

  // Estratégia network-first para HTML e API
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cachear apenas respostas válidas
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone()
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache)
            })
        }
        return response
      })
      .catch(() => {
        // Fallback para cache se network falhar
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              console.log("📦 Fallback cache:", event.request.url)
              return response
            }
            // Se for uma navegação, retornar página principal
            if (event.request.destination === 'document') {
              return caches.match('/')
            }
            return new Response('Offline', { status: 503 })
          })
      })
  )
})

self.addEventListener("activate", (event) => {
  console.log("🔧 Service Worker: Ativando...")
  event.waitUntil(
    Promise.all([
      // Limpar caches antigos
      caches.keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              if (cacheName !== CACHE_NAME) {
                console.log("🗑️ Removendo cache antigo:", cacheName)
                return caches.delete(cacheName)
              }
            })
          )
        }),
      // Tomar controle imediato
      self.clients.claim()
    ])
    .then(() => {
      console.log("✅ Service Worker ativado!")
    })
  )
})

// Listener para mensagens do cliente
self.addEventListener('message', (event) => {
  console.log("📨 Mensagem recebida:", event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log("⏩ Pulando waiting...")
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME })
  }
})

// Notificar sobre atualizações
self.addEventListener('controllerchange', () => {
  console.log("🔄 Controller mudou - nova versão ativa!")
})

console.log("✅ Service Worker v1.2.0: Configurado com sucesso!")
