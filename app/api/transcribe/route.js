import { NextResponse } from 'next/server';

const TRANSCRIPTION_LIMIT_SECONDS = 6000; // 100 minutes

export async function POST(request) {
  try {
    const { getAuthenticatedUser } = await import('@/lib/supabase-server');
    const { user, supabase } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check transcription limit before processing
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('transcription_seconds_used')
      .eq('user_id', user.id)
      .single();

    const secondsUsed = profile?.transcription_seconds_used || 0;
    if (secondsUsed >= TRANSCRIPTION_LIMIT_SECONDS) {
      return NextResponse.json(
        { error: 'Transcription limit reached. Your beta plan allows 100 minutes.', code: 'TRANSCRIPTION_LIMIT' },
        { status: 403 }
      );
    }

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
    const duration = result?.metadata?.duration || 0;

    // Increment transcription seconds used
    if (duration > 0) {
      const newTotal = secondsUsed + Math.ceil(duration);
      await supabase
        .from('user_profiles')
        .update({ transcription_seconds_used: newTotal })
        .eq('user_id', user.id);
    }

    return NextResponse.json({
      success: true,
      transcription: transcript,
      confidence: result?.results?.channels?.[0]?.alternatives?.[0]?.confidence,
      duration,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
