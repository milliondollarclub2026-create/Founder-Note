import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { transcription } = await request.json()
    
    if (!transcription) {
      return NextResponse.json({ error: 'No transcription provided' }, { status: 400 })
    }

    // For now, just return a cleaned up version of the transcription
    // In the future, this could call GPT to rewrite the text
    const smartified = transcription
      .replace(/\s+/g, ' ')
      .replace(/\.\s+/g, '.\n\n')
      .trim()

    return NextResponse.json({ smartified })
  } catch (error) {
    console.error('Smartify error:', error)
    return NextResponse.json({ error: 'Failed to smartify text' }, { status: 500 })
  }
}