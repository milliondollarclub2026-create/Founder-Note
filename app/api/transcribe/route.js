import { NextResponse } from 'next/server';
import { getUserLimits } from '@/lib/plan-tiers';

export async function POST(request) {
  try {
    const { getAuthenticatedUser } = await import('@/lib/supabase-server');
    const { user, supabase } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get dynamic limits based on user's plan
    const limits = await getUserLimits(supabase, user.id);

    // Check transcription limit before processing
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('transcription_seconds_used')
      .eq('user_id', user.id)
      .single();

    const secondsUsed = profile?.transcription_seconds_used || 0;
    const remainingSeconds = Math.max(0, limits.transcription_seconds - secondsUsed);

    if (secondsUsed >= limits.transcription_seconds) {
      return NextResponse.json(
        {
          error: `Transcription limit reached. Your ${limits.display_name} plan allows ${limits.transcription_minutes} minutes.`,
          code: 'TRANSCRIPTION_LIMIT',
          remainingSeconds: 0,
        },
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

    // Edge case fix: Check if this recording would exceed the limit
    const newTotal = secondsUsed + Math.ceil(duration);
    if (newTotal > limits.transcription_seconds) {
      const overageSeconds = newTotal - limits.transcription_seconds;
      const overageMinutes = Math.ceil(overageSeconds / 60);
      return NextResponse.json(
        {
          error: `This recording (${Math.ceil(duration / 60)} min) exceeds your remaining time by ${overageMinutes} minute${overageMinutes > 1 ? 's' : ''}. Please record a shorter note.`,
          code: 'TRANSCRIPTION_EXCEEDED',
          remainingSeconds: remainingSeconds,
          recordingDuration: Math.ceil(duration),
        },
        { status: 403 }
      );
    }

    // Increment transcription seconds used
    if (duration > 0) {
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
      remainingSeconds: Math.max(0, limits.transcription_seconds - newTotal),
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
