# 🤖 Chamie AI

Seu assistente inteligente com sotaque pernambucano, arretado pra resolver qualquer parada!

## 🚀 Deploy na Vercel

### 1. Preparação
```bash
# Clone o repositório
git clone <seu-repositorio>
cd chamie-ai

# Instale as dependências
npm install
```

### 2. Configuração das Variáveis de Ambiente

#### Localmente:
1. Copie o arquivo de exemplo:
```bash
cp .env.example .env.local
```

2. Edite `.env.local` e adicione sua chave do Google Gemini:
```env
GOOGLE_GENERATIVE_AI_API_KEY=sua_chave_aqui
```

#### Na Vercel:
1. Acesse [vercel.com](https://vercel.com)
2. Faça login com GitHub
3. Importe seu repositório
4. Nas configurações do projeto, adicione a variável de ambiente:
   - **Name**: `GOOGLE_GENERATIVE_AI_API_KEY`
   - **Value**: Sua chave do Google Gemini

### 3. Obtendo a Chave do Google Gemini
1. Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada

### 4. Deploy
```bash
# Conecte com a Vercel
npx vercel login

# Deploy
npx vercel --prod
```

## 🛠️ Tecnologias

- **Next.js 15** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Radix UI** - Componentes
- **Google Gemini** - IA Generativa
- **Web Speech API** - Reconhecimento de voz

## 🎨 Características

- ✅ Interface dark profissional
- ✅ Sotaque pernambucano autêntico
- ✅ Reconhecimento de voz
- ✅ Upload de arquivos
- ✅ PWA completo
- ✅ Responsivo

## 🔐 Segurança

- Chaves de API protegidas por variáveis de ambiente
- Não há hardcoding de credenciais
- `.env.local` ignorado pelo Git

---

Desenvolvido com ❤️ e muito ☕ em Pernambuco!