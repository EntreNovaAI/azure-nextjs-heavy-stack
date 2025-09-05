export async function chat(messages: { role: string; content: string }[]) {
  if (process.env.AI_PROVIDER === "azure") {
    const url = `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=2024-08-01-preview`
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": process.env.AZURE_OPENAI_API_KEY! },
      body: JSON.stringify({ messages, temperature: 0.2 })
    })
    const j = await r.json()
    return j.choices?.[0]?.message?.content ?? ""
  } else {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: "gpt-4o-mini", messages, temperature: 0.2 })
    })
    const j = await r.json()
    return j.choices?.[0]?.message?.content ?? ""
  }
}
