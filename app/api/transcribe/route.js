import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { getAuthenticatedUser } = await import('@/lib/supabase-server');
    const { user } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const audioFile = formData.get('audio');

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const audioData = Buffer.from(arrayBuffer);

    // Call Deepgram API
    const deepgramResponse = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
        'Content-Type': audioFile.type || 'audio/webm',
      },
      body: audioData,
    });

    if (!deepgramResponse.ok) {
      const errorText = await deepgramResponse.text();
      console.error('Deepgram error:', errorText);
      return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
    }

    const result = await deepgramResponse.json();
    const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';

    return NextResponse.json({
      success: true,
      transcription: transcript,
      confidence: result?.results?.channels?.[0]?.alternatives?.[0]?.confidence,
      duration: result?.metadata?.duration,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
