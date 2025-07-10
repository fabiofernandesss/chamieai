import { GoogleGenerativeAI } from "@google/generative-ai"
import { GoogleGenerativeAIStream, StreamingTextResponse } from "ai"

// Usar variável de ambiente ou fallback
const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY

if (!apiKey) {
  throw new Error("GEMINI_API_KEY não encontrada nas variáveis de ambiente")
}

const genAI = new GoogleGenerativeAI(apiKey)

export async function POST(req: Request) {
  try {
    const { messages, fileContext, requireFileContext } = await req.json()

    // Se há contexto de arquivo obrigatório mas não foi fornecido
    if (requireFileContext && !fileContext) {
      return new Response(
        JSON.stringify({
          error: "Por favor, faça upload de um arquivo .txt primeiro para fazer perguntas sobre seu conteúdo.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Configurar o modelo
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        maxOutputTokens: 4096,
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
      },
    })

    // Preparar o prompt do sistema
    let systemPrompt = `Você é Vini AI, um assistente inteligente e prestativo. Responda de forma clara, precisa e útil.

INSTRUÇÕES IMPORTANTES:
- Sempre responda em português brasileiro
- Seja conciso mas completo
- Use formatação markdown quando apropriado
- Para código, sempre use blocos de código com a linguagem especificada
- Seja amigável e profissional
- Se não souber algo, admita honestamente`

    // Adicionar contexto do arquivo se disponível
    if (fileContext) {
      systemPrompt += `

CONTEXTO DO ARQUIVO:
O usuário fez upload de um arquivo com o seguinte conteúdo:
---
${fileContext}
---

Use este contexto para responder às perguntas do usuário sobre o arquivo.`
    }

    // Preparar mensagens para o Gemini
    const geminiMessages = messages.map((message: any) => ({
      role: message.role === "user" ? "user" : "model",
      parts: [{ text: message.content }],
    }))

    // Adicionar prompt do sistema como primeira mensagem
    const fullMessages = [
      {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
      {
        role: "model",
        parts: [{ text: "Entendido! Estou pronto para ajudar como Vini AI. Como posso te ajudar hoje?" }],
      },
      ...geminiMessages,
    ]

    // Gerar resposta
    const result = await model.generateContentStream({
      contents: fullMessages,
    })

    // Converter para stream compatível com AI SDK
    const stream = GoogleGenerativeAIStream(result)

    return new StreamingTextResponse(stream, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    })
  } catch (error) {
    console.error("Erro na API:", error)
    return new Response(
      JSON.stringify({
        error: "Erro interno do servidor. Tente novamente.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
