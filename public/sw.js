const CACHE_NAME = "vini-ai-v1.1.0"
const urlsToCache = [
  "/",
  "/favicon.png",
  "/metatag.png",
  "/manifest.json",
  "/globals.css",
]

// Debug logs
console.log("🔧 Service Worker: Iniciando...")

self.addEventListener("install", (event) => {
  console.log("🔧 Service Worker: Instalando...")
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log("✅ Cache aberto:", CACHE_NAME)
        return cache.addAll(urlsToCache)
      })
      .then(() => {
        console.log("✅ Arquivos cacheados com sucesso!")
        return self.skipWaiting() // Força ativação imediata
      })
      .catch((error) => {
        console.error("❌ Erro ao cachear arquivos:", error)
      })
  )
})

self.addEventListener("fetch", (event) => {
  // Ignorar requisições não-HTTP
  if (!event.request.url.startsWith('http')) {
    return
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          console.log("📦 Servindo do cache:", event.request.url)
          return response
        }
        
        console.log("🌐 Buscando na rede:", event.request.url)
        return fetch(event.request)
          .then((response) => {
            // Verificar se a resposta é válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }

            // Clonar a resposta
            const responseToCache = response.clone()

            // Adicionar ao cache se for um recurso estático
            if (event.request.url.includes('.css') || 
                event.request.url.includes('.js') || 
                event.request.url.includes('.png') || 
                event.request.url.includes('.jpg') ||
                event.request.url.includes('.svg')) {
              
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache)
                })
            }

            return response
          })
          .catch((error) => {
            console.error("❌ Erro na requisição:", error)
            // Retornar página offline se disponível
            if (event.request.destination === 'document') {
              return caches.match('/')
            }
          })
      })
  )
})

self.addEventListener("activate", (event) => {
  console.log("🔧 Service Worker: Ativando...")
  event.waitUntil(
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
      })
      .then(() => {
        console.log("✅ Service Worker ativado!")
        return self.clients.claim() // Tomar controle imediato
      })
  )
})

// Listener para mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

console.log("✅ Service Worker: Configurado com sucesso!")
