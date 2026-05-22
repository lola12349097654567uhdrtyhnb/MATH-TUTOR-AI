import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { topic, difficulty, question_text, correct_answer } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY environment variable is not set. Falling back to local explanation.');
      return NextResponse.json({ explanation: generateLocalExplanation(topic, difficulty, question_text, correct_answer) });
    }

    const prompt = `You are a warm, encouraging, and elite AI Math Tutor.
A student is struggling with ${difficulty}-level questions on the topic of "${topic}".
They are currently stuck on this specific question:
"${question_text}"
The correct answer to this question is: "${correct_answer}"

Please generate a highly interactive, beautifully structured, and friendly step-by-step exam-style walkthrough teaching them how to solve this exact question.
Follow these rules strictly:
1. Start with a warm, encouraging introduction (e.g., "Let's work through this together step-by-step! You've got this! 🌟")
2. YOU MUST SHOW THE EXACT MATHEMATICAL WORKING OUT step-by-step, showing each operation clearly (e.g. moving variables to one side, subtracting or dividing from both sides, aligning denominators, simplifying terms, etc.) just like an exam paper's model working-out section.
3. Break the explanation down into 3-4 logical, sequential steps. Use bold text for math equations and intermediate values.
4. Keep the tone suitable for a middle-school or high-school student. Use emojis to keep it engaging.
5. Conclude with a warm summary reminding them to try to apply this exact working-out logic next time.

Keep the output concise so they don't get overwhelmed (under 300 words). Do not use Markdown headings like # or ##. Use normal text and bold styling instead.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800
          }
        })
      });

      if (!response.ok) {
        console.error('Gemini API returned non-200. Falling back to local explanation.');
        return NextResponse.json({ explanation: generateLocalExplanation(topic, difficulty, question_text, correct_answer) });
      }

      const data = await response.json();
      const explanation = data.candidates?.[0]?.content?.parts?.[0]?.text || generateLocalExplanation(topic, difficulty, question_text, correct_answer);

      return NextResponse.json({ explanation });
    } catch (apiError) {
      console.error('Gemini API call failed. Falling back to local explanation:', apiError);
      return NextResponse.json({ explanation: generateLocalExplanation(topic, difficulty, question_text, correct_answer) });
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function generateLocalExplanation(topic, difficulty, question_text, correct_answer) {
  let stepsText = '';
  
  // Try to parse linear equations like "4x + 3 = 47" or "2x - 5 = 15"
  const cleanQ = (question_text || '').replace(/\s+/g, '');
  const matchPlus = cleanQ.match(/(\d+)x\+(\d+)=(\d+)/);
  const matchMinus = cleanQ.match(/(\d+)x-(\d+)=(\d+)/);
  
  if (matchPlus) {
    const a = parseInt(matchPlus[1]);
    const b = parseInt(matchPlus[2]);
    const c = parseInt(matchPlus[3]);
    const sub = c - b;
    const ans = sub / a;
    
    stepsText = `Step 1: Write down the initial algebraic equation:
  **${a}x + ${b} = ${c}**

Step 2: Isolate the variable term by subtracting **${b}** from both sides of the equation:
  ${a}x = ${c} - ${b}
  **${a}x = ${sub}**

Step 3: Solve for **x** by dividing both sides by **${a}**:
  x = ${sub} / ${a}
  **x = ${ans}** (which matches the correct answer **${correct_answer}**!)`;
  } else if (matchMinus) {
    const a = parseInt(matchMinus[1]);
    const b = parseInt(matchMinus[2]);
    const c = parseInt(matchMinus[3]);
    const add = c + b;
    const ans = add / a;
    
    stepsText = `Step 1: Write down the initial algebraic equation:
  **${a}x - ${b} = ${c}**

Step 2: Isolate the variable term by adding **${b}** to both sides of the equation:
  ${a}x = ${c} + ${b}
  **${a}x = ${add}**

Step 3: Solve for **x** by dividing both sides by **${a}**:
  x = ${add} / ${a}
  **x = ${ans}** (which matches the correct answer **${correct_answer}**!)`;
  } else {
    // General high-quality step-by-step
    stepsText = `Step 1: Write down the math problem and identify the core operation:
  **${question_text}**

Step 2: To solve this problem, we need to carefully apply the relevant mathematical rules for ${topic}. 
  If it is an equation, isolate the variables. If it is a fraction problem, align denominators.

Step 3: Apply the operations step-by-step:
  Perform the arithmetic, check the signs, and simplify your terms. This leads us to the correct answer: **${correct_answer}**.`;
  }

  return `Let's work through this together step-by-step! You've got this! 🌟

${stepsText}

Step 4: Awesome job reviewing this! Keep this working-out logic in mind for your next practice question. Let's do this! 💪`;
}
