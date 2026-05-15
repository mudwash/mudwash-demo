import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { term, category } = await request.json();
    console.log("API Request term:", term, "category:", category);
    
    if (!term || term.length < 1) {
      return NextResponse.json([]);
    }

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer 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`
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-nano-30b-a3b",
        messages: [
          { 
            role: "system", 
            content: `You are a car database. Return ONLY a valid JSON array of strings containing up to 5 vehicle models that match or are similar to the user's search term. CRITICAL: You MUST include the brand name in each string (e.g., return "Nissan Altima" instead of just "Altima", or "Toyota Prado" instead of just "Prado"). The user has selected the vehicle category "${category || 'Car'}". Try to prioritize vehicles that belong to this category. However, if no vehicles of this category match the search term, return matching vehicles from other categories as well so the user gets results. Do not include markdown formatting, backticks, or any text other than the JSON array.` 
          },
          { role: "user", content: term }
        ],
        temperature: 0.1,
        max_tokens: 500
      })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    console.log("AI Response Content:", content);
    
    if (content) {
      try {
        const match = content.match(/\[[\s\S]*\]/);
        if (match) {
          const models = JSON.parse(match[0]);
          if (Array.isArray(models)) {
            return NextResponse.json(models);
          }
        }
      } catch (e) {
        console.error("Failed to parse AI response as JSON:", content);
      }
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error("Error in car-suggestions API:", error);
    return NextResponse.json({ error: "Failed to fetch suggestions" }, { status: 500 });
  }
}
