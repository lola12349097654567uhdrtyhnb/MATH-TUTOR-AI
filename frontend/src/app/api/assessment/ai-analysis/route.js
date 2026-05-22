import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(req) {
  try {
    const { pre_score, post_score, target_topics, type } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        analysis: `You've completed your ${type === 'pre' ? 'Pre-Assessment' : 'Post-Assessment'}. Focus on mastering key operations in ${target_topics.join(' and ')} by drawing visual diagrams on your scratchpad and isolating variables step-by-step!` 
      });
    }

    const prompt = `You are a warm, encouraging, and elite AI Math Tutor.
A student just completed their math assessment. Here are their details:
- Assessment Type: ${type === 'pre' ? 'Diagnostic Pre-Assessment' : 'Final Post-Assessment'}
- Target Topics: ${target_topics.join(', ')}
- Score Details: ${JSON.stringify(pre_score || {})}

Please write a highly personalized, valuable, and detailed mathematical evaluation of their performance.
Rules:
1. Explain what their score means (e.g. if they got 2/5 in fractions, explain that they might have struggled with common denominators or fraction addition).
2. Give concrete, valuable advice on what specific type of questions they should focus on (e.g. isolating x, simplifying exponents, solving geometric areas).
3. Do not just say "practice more". Explain the "why" and "how" behind the math concepts.
4. Keep the tone warm, friendly, and suitable for a middle-school or high-school student. Use helpful emojis.
5. Keep it structured and under 220 words. Do not use Markdown headings like # or ##. Use normal text and bold styling instead.`;

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
            maxOutputTokens: 500
          }
        })
      });

      if (!response.ok) {
        throw new Error('Gemini API call failed');
      }

      const data = await response.json();
      const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || "Excellent job completing your assessment! Focus on isolating your algebraic terms and simplifying exponents step-by-step.";
      return NextResponse.json({ analysis });
    } catch (e) {
      return NextResponse.json({ 
        analysis: `Outstanding effort completing your ${type === 'pre' ? 'Pre-Assessment' : 'Post-Assessment'}! Focus on practicing standard isolation of terms, finding common denominators in fractions, and validating algebraic formulas step-by-step.` 
      });
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
