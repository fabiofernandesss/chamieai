import { streamText } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || "AIzaSyDH3jq7MVIsdU0jm5QTtWPKRvxvlChuEM8",
})

export async function POST(req: Request) {
  try {
    const { messages, fileContext, requireFileContext } = await req.json()

    console.log("📤 Mensagens recebidas:", messages)
    console.log("📄 Contexto do arquivo:", fileContext ? "Presente" : "Ausente")

    // Preparar mensagens com contexto do arquivo se disponível
    let systemMessage = "Você é a Vini AI, um assistente inteligente e prestativo."

    if (fileContext) {
      systemMessage += `\n\nIMPORTANTE: O usuário carregou um arquivo com o seguinte conteúdo em Markdown:\n\n${fileContext}\n\nVocê DEVE usar este conteúdo para responder às perguntas do usuário. Seja preciso e cite partes específicas do arquivo quando relevante. Não responda perguntas que não estejam relacionadas ao conteúdo do arquivo.`
    } else if (requireFileContext) {
      return new Response(
        JSON.stringify({
          error: "Por favor, faça uma pergunta relacionada ao arquivo carregado.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const result = await streamText({
      model: google("gemini-2.0-flash"),
      system: systemMessage,
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: 0.7,
      maxTokens: 4096,
    })

    return result.toDataStreamResponse({
      headers: {
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("💥 Erro na API de chat:", error)

    return new Response(
      JSON.stringify({
        error: "Erro ao processar sua solicitação. Tente novamente.",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
