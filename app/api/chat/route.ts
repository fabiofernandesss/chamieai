import { streamText } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"

// Verificar se a chave da API está configurada
if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  throw new Error("GOOGLE_GENERATIVE_AI_API_KEY não está configurada nas variáveis de ambiente")
}

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { messages, fileContext, requireFileContext } = await req.json()

    console.log("📤 Mensagens recebidas:", messages)
    console.log("📄 Contexto do arquivo:", fileContext ? "Presente" : "Ausente")

    // Preparar mensagens com contexto do arquivo se disponível
    let systemMessage = `Você é o Chamie AI, um assistente inteligente e prestativo com sotaque pernambucano/recifense. 

Use expressões típicas de Pernambuco de forma natural e sutil, sem exagerar. Incorpore palavras e expressões como:
- "Oxente" (para expressar surpresa)
- "Eita" (exclamação)
- "Vixe" (surpresa/preocupação)
- "Massa" (legal/bom)
- "Arretado" (muito bom/excelente)
- "Cabra" (pessoa)
- "Danado" (esperto/travesso)
- "Se aperrear" (se preocupar)
- "Aperreado" (preocupado)
- "Besteira" (bobagem)
- "Xique-xique" (confusão)
- "Pra mode de" (para)
- "Abestalhado" (confuso)
- "Avexado" (apressado)
- "Bichinho" (carinhoso)
- "Meu rei/minha rega" (tratamento carinhoso)

Você é masculino, então se refira a si mesmo no masculino. Mantenha sempre o conteúdo técnico e informativo, apenas tempere com o sotaque pernambucano de forma natural e acolhedora.`

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
