import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Smartification prompt - creates structured, scannable notes
const SMARTIFY_SYSTEM_PROMPT = `You are an expert editor that transforms raw voice transcriptions into well-structured, scannable notes.

Your output must follow this exact format:
- Use **HEADINGS** (2-4 words, all caps) to organize major topics
- Use **Subheadings** (Title Case, bold with **) for sub-topics under each heading
- Use bullet points (•) for key information under subheadings
- Bullets must be concise (1-2 sentences max), scannable, not paragraphs

Rules:
- Remove all filler words (um, uh, like, you know, basically, so, actually, etc.)
- Fix grammar and punctuation
- Organize content logically by topic
- Keep the speaker's ideas and meaning intact
- DO NOT add information not in the original
- DO NOT use markdown code blocks
- Use plain text with the following formatting:
  - HEADINGS in ALL CAPS on their own line
  - Subheadings in Title Case with ** around them
  - Bullets starting with •

Example output format:

PRODUCT IDEAS

**Feature Concepts**
• Users want a simpler onboarding flow with fewer steps
• Mobile app should sync automatically with desktop

**Technical Considerations**
• Need to evaluate cloud storage options for scalability
• Consider implementing offline mode for mobile

NEXT STEPS

**Immediate Actions**
• Schedule follow-up meeting with the dev team
• Draft initial wireframes for the new onboarding flow

The goal is maximum readability when skimming - a user should grasp the full meaning in seconds.
Strike the right balance between clarity and completeness - not too wordy, but don't lose important context.`;

// Handle GET requests
export async function GET(request, { params }) {
  const path = params?.path?.join('/') || '';
  
  try {
    // Health check
    if (path === '' || path === 'health') {
      return NextResponse.json({ 
        status: 'ok', 
        message: 'FounderNotes API is running',
        timestamp: new Date().toISOString()
      });
    }
    
    // Get single note by ID
    if (path.startsWith('notes/') && path.split('/').length === 2) {
      const noteId = path.split('/')[1];
      
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .single();
      
      if (error) {
        console.error('Note fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({ note: data });
    }
    
    // Get notes for a user
    if (path === 'notes') {
      const { searchParams } = new URL(request.url);
      const userId = searchParams.get('userId');
      const search = searchParams.get('search') || '';
      const tag = searchParams.get('tag') || '';
      
      if (!userId) {
        return NextResponse.json({ error: 'userId required' }, { status: 400 });
      }
      
      const supabase = createServerClient();
      
      let query = supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (search) {
        query = query.or(`title.ilike.%${search}%,transcription.ilike.%${search}%`);
      }
      
      if (tag) {
        query = query.contains('tags', [tag]);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Notes fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({ notes: data || [] });
    }
    
    // Get todos for a user
    if (path === 'todos') {
      const { searchParams } = new URL(request.url);
      const userId = searchParams.get('userId');
      const completed = searchParams.get('completed');
      
      if (!userId) {
        return NextResponse.json({ error: 'userId required' }, { status: 400 });
      }
      
      const supabase = createServerClient();
      
      let query = supabase
        .from('todos')
        .select('*, notes(title)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (completed !== null && completed !== undefined) {
        query = query.eq('completed', completed === 'true');
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Todos fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({ todos: data || [] });
    }
    
    // Get all unique tags for a user
    if (path === 'tags') {
      const { searchParams } = new URL(request.url);
      const userId = searchParams.get('userId');
      
      if (!userId) {
        return NextResponse.json({ error: 'userId required' }, { status: 400 });
      }
      
      const supabase = createServerClient();
      
      const { data, error } = await supabase
        .from('notes')
        .select('tags')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Tags fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      // Flatten and dedupe tags
      const allTags = data?.flatMap(n => n.tags || []) || [];
      const uniqueTags = [...new Set(allTags)];
      
      return NextResponse.json({ tags: uniqueTags });
    }
    
    // Get user's stored intents (Remy's memory)
    if (path === 'intents') {
      const { searchParams } = new URL(request.url);
      const userId = searchParams.get('userId');
      const status = searchParams.get('status') || 'active';
      const limit = parseInt(searchParams.get('limit') || '50', 10);
      
      if (!userId) {
        return NextResponse.json({ error: 'userId required' }, { status: 400 });
      }
      
      const supabase = createServerClient();
      
      let query = supabase
        .from('intents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (status !== 'all') {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Intents fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({ 
        intents: data || [],
        count: data?.length || 0
      });
    }
    
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle POST requests
export async function POST(request, { params }) {
  const path = params?.path?.join('/') || '';
  
  try {
    // Transcribe audio with Deepgram
    if (path === 'transcribe') {
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
    }
    
    // Extract insights using OpenAI
    if (path === 'extract') {
      const { transcription, userId } = await request.json();
      
      if (!transcription) {
        return NextResponse.json({ error: 'No transcription provided' }, { status: 400 });
      }
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant that extracts structured information from voice note transcriptions. 
Extract and return a JSON object with:
- title: A short, descriptive title (max 50 chars)
- summary: 2-3 sentence summary of the key content
- key_points: Array of bullet points (main ideas/insights, 3-7 points)
- action_items: Array of actionable tasks mentioned (if any)
- tags: Array of 2-5 relevant tags/categories

Return ONLY valid JSON, no markdown or explanation.`
          },
          {
            role: 'user',
            content: `Extract information from this voice note transcription:\n\n"${transcription}"`
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });
      
      let extracted;
      try {
        extracted = JSON.parse(completion.choices[0].message.content);
      } catch (e) {
        console.error('JSON parse error:', e);
        extracted = {
          title: 'Voice Note',
          summary: transcription.substring(0, 200),
          key_points: [],
          action_items: [],
          tags: ['voice-note']
        };
      }
      
      return NextResponse.json({
        success: true,
        extracted
      });
    }
    
    // Smartify transcription - clean up raw text using GPT with structured formatting
    // This is called ONE TIME at note creation
    if (path === 'smartify') {
      const { transcription } = await request.json();
      
      if (!transcription) {
        return NextResponse.json({ error: 'No transcription provided' }, { status: 400 });
      }
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: SMARTIFY_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: `Transform this voice transcription into a structured, scannable note:\n\n"${transcription}"`
          }
        ],
        temperature: 0.3,
      });
      
      return NextResponse.json({
        success: true,
        smartified: completion.choices[0].message.content
      });
    }
    
    // Regenerate AI Summary and Key Points from transcript (after user edits)
    if (path === 'regenerate-ai') {
      const { noteId, transcription, userId } = await request.json();
      
      if (!noteId || !transcription) {
        return NextResponse.json({ error: 'noteId and transcription required' }, { status: 400 });
      }
      
      // Generate new summary and key points
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant that extracts structured information from voice note transcriptions. 
Extract and return a JSON object with:
- summary: 2-3 sentence summary of the key content
- key_points: Array of bullet points (main ideas/insights, 3-7 points)

Return ONLY valid JSON, no markdown or explanation.`
          },
          {
            role: 'user',
            content: `Extract summary and key points from this transcription:\n\n"${transcription}"`
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });
      
      let extracted;
      try {
        extracted = JSON.parse(completion.choices[0].message.content);
      } catch (e) {
        console.error('JSON parse error:', e);
        return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
      }
      
      // Update the note in Supabase
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from('notes')
        .update({
          summary: extracted.summary || '',
          key_points: extracted.key_points || [],
          updated_at: new Date().toISOString()
        })
        .eq('id', noteId)
        .select()
        .single();
      
      if (error) {
        console.error('Note update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        note: data,
        summary: extracted.summary,
        key_points: extracted.key_points
      });
    }
    
    // Save note to Supabase - includes one-time smartification
    if (path === 'notes') {
      const { userId, title, transcription, summary, keyPoints, actionItems, tags, audioUrl, smartifiedText } = await request.json();
      
      if (!userId || !transcription) {
        return NextResponse.json({ error: 'userId and transcription required' }, { status: 400 });
      }
      
      const supabase = createServerClient();
      const noteId = uuidv4();
      
      // Insert the note with smartified_text
      const { data: note, error: noteError } = await supabase
        .from('notes')
        .insert({
          id: noteId,
          user_id: userId,
          title: title || 'Untitled Note',
          transcription,
          smartified_text: smartifiedText || null,
          summary: summary || '',
          key_points: keyPoints || [],
          tags: tags || [],
          audio_url: audioUrl || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (noteError) {
        console.error('Note insert error:', noteError);
        return NextResponse.json({ error: noteError.message }, { status: 500 });
      }
      
      // Insert action items as todos if present
      if (actionItems && actionItems.length > 0) {
        const todosToInsert = actionItems.map(item => ({
          id: uuidv4(),
          user_id: userId,
          note_id: noteId,
          title: typeof item === 'string' ? item : item.task || item.title || item,
          completed: false,
          created_at: new Date().toISOString()
        }));
        
        const { error: todosError } = await supabase
          .from('todos')
          .insert(todosToInsert);
        
        if (todosError) {
          console.error('Todos insert error:', todosError);
        }
      }
      
      return NextResponse.json({ success: true, note });
    }
    
    // ============================================================
    // REMY - Named AI Assistant with Intent Flow Support
    // ============================================================
    
    // Remy's personality layer - consistent across all chat surfaces
    const REMY_PERSONALITY = `You are Remy, a thoughtful AI assistant embedded in Founder Note. You help founders capture, organize, and reflect on their thoughts.

PERSONALITY TRAITS:
- Calm, precise, and intentional in your responses
- You speak with warmth but without unnecessary filler
- You're a reliable memory companion, not just a Q&A bot
- When users explicitly ask you to remember something, you acknowledge it clearly but minimally

IMPORTANT FLOW: INTENT CAPTURE
When users explicitly address you with phrases like "Hey Remy", "Remy, remember this", "Remy, don't forget", or similar direct constructs, they are invoking the INTENT FLOW. This means they want you to remember something important. When this happens:
1. Acknowledge the intent has been captured
2. Confirm what you understood they want remembered
3. Be brief - don't over-explain or create clutter

If the phrasing is ambiguous (they might be asking you to remember something OR just chatting), ask for clarification: "Would you like me to save this as an important thought to remember?"

You NEVER autonomously decide to store intents - only when explicitly triggered.`;

    // Intent flow trigger detection patterns
    const INTENT_TRIGGERS = [
      /^hey\s+remy[,:]?\s*/i,
      /^remy[,:]?\s+remember/i,
      /^remy[,:]?\s+don'?t\s+forget/i,
      /^remy[,:]?\s+save\s+this/i,
      /^remy[,:]?\s+note\s+this/i,
      /^remy[,:]?\s+keep\s+in\s+mind/i,
      /^@remy\s*/i,
    ];
    
    // Function to detect intent flow trigger
    const detectIntentTrigger = (message) => {
      const normalizedMessage = message.trim().toLowerCase();
      for (const pattern of INTENT_TRIGGERS) {
        if (pattern.test(message.trim())) {
          return true;
        }
      }
      return false;
    };
    
    // Function to extract intent content from message
    const extractIntentContent = (message) => {
      let content = message.trim();
      // Remove trigger phrases to get the actual intent
      content = content.replace(/^hey\s+remy[,:]?\s*/i, '');
      content = content.replace(/^remy[,:]?\s+remember\s*(that|this|:)?\s*/i, '');
      content = content.replace(/^remy[,:]?\s+don'?t\s+forget\s*(that|this|:)?\s*/i, '');
      content = content.replace(/^remy[,:]?\s+save\s+this[,:]?\s*/i, '');
      content = content.replace(/^remy[,:]?\s+note\s+this[,:]?\s*/i, '');
      content = content.replace(/^remy[,:]?\s+keep\s+in\s+mind[,:]?\s*/i, '');
      content = content.replace(/^@remy\s*/i, '');
      return content.trim();
    };
    
    // Context-aware chat with strict scope boundaries
    if (path === 'chat') {
      const { messages, userId, contextScope } = await request.json();
      
      if (!messages || !userId) {
        return NextResponse.json({ error: 'messages and userId required' }, { status: 400 });
      }
      
      if (!contextScope || !contextScope.type) {
        return NextResponse.json({ error: 'contextScope with type required' }, { status: 400 });
      }
      
      const supabase = createServerClient();
      let notes = [];
      let systemPrompt = '';
      let scopeDescription = '';
      
      // Check if the latest user message triggers an intent flow
      const latestUserMessage = messages.filter(m => m.role === 'user').pop();
      let intentFlowTriggered = false;
      let capturedIntent = null;
      
      if (latestUserMessage && detectIntentTrigger(latestUserMessage.content)) {
        intentFlowTriggered = true;
        const intentContent = extractIntentContent(latestUserMessage.content);
        
        if (intentContent.length > 5) {
          // Store the intent
          try {
            const { data: intent, error: intentError } = await supabase
              .from('intents')
              .insert({
                user_id: userId,
                raw_text: latestUserMessage.content,
                normalized_intent: intentContent,
                intent_type: 'remember',
                source_type: contextScope.type === 'note' ? 'note' : 'chat',
                source_id: contextScope.noteId || null,
                source_title: contextScope.noteTitle || null,
                context_scope: contextScope.type,
                context_value: contextScope.folder || contextScope.tag || null,
                folder: contextScope.folder || null,
                tags: contextScope.tag ? [contextScope.tag] : [],
                status: 'active'
              })
              .select()
              .single();
            
            if (!intentError && intent) {
              capturedIntent = {
                id: intent.id,
                content: intentContent,
                timestamp: intent.created_at
              };
            } else {
              console.error('Intent storage error:', intentError);
            }
          } catch (err) {
            console.error('Intent capture error:', err);
          }
        }
      }
      
      // SCOPE: Single Note - bound to one specific note only
      if (contextScope.type === 'note' && contextScope.noteId) {
        const { data: note, error } = await supabase
          .from('notes')
          .select('*')
          .eq('id', contextScope.noteId)
          .single();
        
        if (error || !note) {
          return NextResponse.json({ error: 'Note not found' }, { status: 404 });
        }
        
        notes = [note];
        scopeDescription = `the note titled "${note.title}"`;
        
        // Build comprehensive single-note context
        const noteContext = `
=== CURRENT NOTE CONTEXT ===
Title: ${note.title}
Created: ${new Date(note.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
Folder: ${note.folder || 'None'}
Tags: ${note.tags?.join(', ') || 'None'}

AI Summary:
${note.summary || 'No summary available'}

Key Points:
${note.key_points?.map((p, i) => `${i + 1}. ${p}`).join('\n') || 'No key points'}

Smartified Transcript:
${note.smartified_text || 'No smartified version'}

Raw Transcript:
${note.transcription || 'No transcript'}
=== END NOTE CONTEXT ===`;
        
        systemPrompt = `${REMY_PERSONALITY}

CURRENT CONTEXT: You are viewing a SINGLE NOTE. Your knowledge is strictly limited to this note only.

${noteContext}

STRICT RULES:
1. Answer ONLY using information from this note. This is your entire knowledge base.
2. Never reference, compare to, or mention other notes - you cannot see them in this view.
3. If the user asks about something not in this note, clearly state: "That information isn't in this note. I can only see the content of '${note.title}' right now."
4. If the user wants to search across all notes, suggest: "To search across all your notes, return to the dashboard where I have global access."
5. Be direct, helpful, and precise. Reference specific parts of the note when answering.
6. If asked "what note is this" or similar, describe the note naturally using its title, date, and content.

You are scoped to: ${scopeDescription}`;
      }
      
      // SCOPE: Folder - only notes within a specific folder
      else if (contextScope.type === 'folder' && contextScope.folder) {
        const { data: folderNotes, error } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', userId)
          .eq('folder', contextScope.folder)
          .order('created_at', { ascending: false });
        
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        
        notes = folderNotes || [];
        scopeDescription = `the "${contextScope.folder}" folder (${notes.length} note${notes.length !== 1 ? 's' : ''})`;
        
        const folderContext = notes.length > 0 
          ? notes.map((n, i) => `
--- Note ${i + 1}: "${n.title}" ---
Created: ${new Date(n.created_at).toLocaleDateString()}
Tags: ${n.tags?.join(', ') || 'None'}
Summary: ${n.summary || 'No summary'}
Content: ${(n.smartified_text || n.transcription || '').substring(0, 800)}
---`).join('\n')
          : 'This folder is empty.';
        
        systemPrompt = `${REMY_PERSONALITY}

CURRENT CONTEXT: You are viewing the FOLDER "${contextScope.folder}". Your knowledge is strictly limited to notes in this folder.

=== FOLDER: ${contextScope.folder} ===
Total Notes: ${notes.length}
${folderContext}
=== END FOLDER CONTEXT ===

STRICT RULES:
1. Answer ONLY using information from notes in this folder. You cannot see notes in other folders.
2. When referencing content, always specify which note it comes from by title.
3. If the user asks about something not in this folder, clearly state: "I don't see that in the '${contextScope.folder}' folder. I can only access notes within this folder right now."
4. If the user wants to search outside this folder, suggest: "To search all notes, return to 'All Notes' on the dashboard."
5. You can compare notes within this folder, find patterns, summarize folder contents, etc.
6. If the folder is empty, acknowledge it and suggest creating notes in this folder.

You are scoped to: ${scopeDescription}`;
      }
      
      // SCOPE: Tag - only notes with a specific tag
      else if (contextScope.type === 'tag' && contextScope.tag) {
        const { data: taggedNotes, error } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', userId)
          .contains('tags', [contextScope.tag])
          .order('created_at', { ascending: false });
        
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        
        notes = taggedNotes || [];
        scopeDescription = `notes tagged with "${contextScope.tag}" (${notes.length} note${notes.length !== 1 ? 's' : ''})`;
        
        const tagContext = notes.length > 0
          ? notes.map((n, i) => `
--- Note ${i + 1}: "${n.title}" ---
Created: ${new Date(n.created_at).toLocaleDateString()}
Folder: ${n.folder || 'None'}
All Tags: ${n.tags?.join(', ') || 'None'}
Summary: ${n.summary || 'No summary'}
Content: ${(n.smartified_text || n.transcription || '').substring(0, 800)}
---`).join('\n')
          : 'No notes have this tag.';
        
        systemPrompt = `${REMY_PERSONALITY}

CURRENT CONTEXT: You are viewing notes tagged with "${contextScope.tag}". Your knowledge is strictly limited to notes with this tag.

=== TAG: #${contextScope.tag} ===
Total Notes: ${notes.length}
${tagContext}
=== END TAG CONTEXT ===

STRICT RULES:
1. Answer ONLY using information from notes with the "${contextScope.tag}" tag. You cannot see untagged notes or notes with different tags.
2. When referencing content, always specify which note it comes from by title.
3. If the user asks about something not in these tagged notes, clearly state: "I don't see that in notes tagged '${contextScope.tag}'. I can only access notes with this tag right now."
4. If the user wants to search beyond this tag, suggest: "To search all notes, return to 'All Notes' on the dashboard."
5. You can compare notes with this tag, find patterns, summarize themes, etc.
6. If no notes have this tag, acknowledge it and suggest adding this tag to relevant notes.

You are scoped to: ${scopeDescription}`;
      }
      
      // SCOPE: Global/Dashboard - access to all notes
      else {
        const { data: allNotes, error } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        
        notes = allNotes || [];
        scopeDescription = `all notes (${notes.length} total)`;
        
        // Group by folder for better organization
        const folderGroups = {};
        const unorganized = [];
        notes.forEach(n => {
          if (n.folder) {
            if (!folderGroups[n.folder]) folderGroups[n.folder] = [];
            folderGroups[n.folder].push(n);
          } else {
            unorganized.push(n);
          }
        });
        
        let globalContext = '=== ALL NOTES OVERVIEW ===\n';
        globalContext += `Total Notes: ${notes.length}\n`;
        globalContext += `Folders: ${Object.keys(folderGroups).join(', ') || 'None'}\n`;
        globalContext += `All Tags: ${[...new Set(notes.flatMap(n => n.tags || []))].join(', ') || 'None'}\n\n`;
        
        // Add folder summaries
        for (const [folder, folderNotes] of Object.entries(folderGroups)) {
          globalContext += `\n--- FOLDER: ${folder} (${folderNotes.length} notes) ---\n`;
          folderNotes.slice(0, 5).forEach((n, i) => {
            globalContext += `${i + 1}. "${n.title}" - ${n.summary || n.transcription?.substring(0, 100) || 'No content'}\n`;
          });
        }
        
        // Add unorganized notes
        if (unorganized.length > 0) {
          globalContext += `\n--- UNFILED NOTES (${unorganized.length}) ---\n`;
          unorganized.slice(0, 5).forEach((n, i) => {
            globalContext += `${i + 1}. "${n.title}" - ${n.summary || n.transcription?.substring(0, 100) || 'No content'}\n`;
          });
        }
        
        // Add detailed note content for the most recent notes
        globalContext += '\n\n=== DETAILED RECENT NOTES ===\n';
        notes.slice(0, 10).forEach((n, i) => {
          globalContext += `
--- Note ${i + 1}: "${n.title}" ---
Created: ${new Date(n.created_at).toLocaleDateString()}
Folder: ${n.folder || 'Unfiled'}
Tags: ${n.tags?.join(', ') || 'None'}
Summary: ${n.summary || 'No summary'}
Content Preview: ${(n.smartified_text || n.transcription || '').substring(0, 500)}
---\n`;
        });
        
        systemPrompt = `${REMY_PERSONALITY}

CURRENT CONTEXT: You are on the DASHBOARD with GLOBAL ACCESS to all notes.

${globalContext}

CAPABILITIES IN GLOBAL MODE:
1. Search and reference ANY note the user has created
2. Compare notes across different folders and tags
3. Find patterns, themes, and connections across all content
4. Summarize recent activity, specific folders, or tags
5. Help the user find specific information they captured
6. Disambiguate when multiple notes match a query (ask which one they mean or show options)

RESPONSE GUIDELINES:
- When referencing content, always cite the note title
- If a query matches multiple notes, present the most relevant options
- Be proactive about suggesting related notes the user might want to review
- If asked about something not in any notes, clearly state it wasn't found

You are scoped to: ${scopeDescription}`;
      }
      
      // If intent was captured, add context to messages for Remy to acknowledge
      let messagesForAI = [...messages];
      if (intentFlowTriggered && capturedIntent) {
        messagesForAI = [...messages];
        // Add system context about the captured intent
        const intentSystemNote = `[SYSTEM: The user just triggered an intent flow. You successfully captured and stored their intent: "${capturedIntent.content}". Acknowledge this briefly and warmly, confirming what you'll remember. Keep it to 1-2 sentences.]`;
        messagesForAI.push({ role: 'system', content: intentSystemNote });
      }
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messagesForAI
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });
      
      return NextResponse.json({
        success: true,
        message: completion.choices[0].message.content,
        scope: {
          type: contextScope.type,
          description: scopeDescription,
          noteCount: notes.length
        },
        sources: notes.slice(0, 5).map(n => ({ 
          id: n.id,
          title: n.title, 
          date: n.created_at,
          folder: n.folder,
          tags: n.tags
        })),
        intentCaptured: capturedIntent ? {
          id: capturedIntent.id,
          content: capturedIntent.content
        } : null
      });
    }
    
    // Brain Dump Synthesis - Extract mental fragments from notes WITH CACHING
    if (path === 'brain-dump') {
      const { userId, contextScope, forceRefresh } = await request.json();
      
      if (!userId) {
        return NextResponse.json({ error: 'userId required' }, { status: 400 });
      }
      
      const supabase = createServerClient();
      
      // Determine scope type and value for caching
      const scopeType = contextScope?.type || 'global';
      const scopeValue = scopeType === 'folder' ? contextScope.folder : 
                         scopeType === 'tag' ? contextScope.tag : null;
      
      let notes = [];
      let scopeDescription = '';
      
      // Fetch notes based on context scope
      if (scopeType === 'folder' && scopeValue) {
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', userId)
          .eq('folder', scopeValue)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        notes = data || [];
        scopeDescription = `the "${scopeValue}" folder`;
      } else if (scopeType === 'tag' && scopeValue) {
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', userId)
          .contains('tags', [scopeValue])
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        notes = data || [];
        scopeDescription = `notes tagged "${scopeValue}"`;
      } else {
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(30);
        
        if (error) throw error;
        notes = data || [];
        scopeDescription = 'all your notes';
      }
      
      // Return empty synthesis if no notes
      if (notes.length === 0) {
        return NextResponse.json({
          success: true,
          synthesis: {
            openThoughts: [],
            decisions: [],
            questions: [],
            blockers: [],
            ideas: [],
            themes: []
          },
          scope: scopeDescription,
          noteCount: 0,
          cached: false
        });
      }
      
      // Generate content hash based on note IDs + updated timestamps
      // This hash changes when notes are added, edited, or removed
      const contentSignature = notes
        .map(n => `${n.id}:${n.updated_at || n.created_at}`)
        .sort()
        .join('|');
      const contentHash = Buffer.from(contentSignature).toString('base64').substring(0, 64);
      
      // Check for existing cached synthesis (unless force refresh)
      if (!forceRefresh) {
        try {
          const { data: cached } = await supabase
            .from('brain_dump_cache')
            .select('*')
            .eq('user_id', userId)
            .eq('scope_type', scopeType)
            .eq('scope_value', scopeValue || '')
            .single();
          
          // If cache exists and hash matches, return cached result
          if (cached && cached.content_hash === contentHash) {
            console.log('Brain Dump: Returning cached synthesis');
            return NextResponse.json({
              success: true,
              synthesis: cached.synthesis,
              scope: scopeDescription,
              noteCount: notes.length,
              cached: true,
              cachedAt: cached.updated_at
            });
          }
        } catch (cacheError) {
          // Cache miss or table doesn't exist, proceed with generation
          console.log('Brain Dump: Cache miss, generating new synthesis');
        }
      } else {
        console.log('Brain Dump: Force refresh requested');
      }
      
      // Build content for analysis (no cache hit, need to generate)
      const notesContent = notes.map(n => {
        const content = n.smartified_text || n.transcription || '';
        return `[Note: "${n.title}" - ${new Date(n.created_at).toLocaleDateString()}]
Summary: ${n.summary || 'No summary'}
Key Points: ${n.key_points?.join('; ') || 'None'}
Content: ${content.substring(0, 1000)}`;
      }).join('\n\n---\n\n');
      
      const synthesisPrompt = `You are analyzing a user's voice notes to extract their current mental state - what's on their mind, what they're thinking about, what remains unresolved.

Analyze these notes and extract mental fragments into these categories:

1. **Open Thoughts** - Incomplete ideas, things being mulled over, work in progress thinking
2. **Decisions** - Choices that were mentioned, made, or are pending
3. **Questions** - Unresolved questions, things they're wondering about
4. **Blockers** - Concerns, obstacles, things holding them back
5. **Ideas** - Creative concepts, possibilities, things worth exploring
6. **Themes** - Recurring topics or patterns across multiple notes

For each item:
- Keep it SHORT (1 sentence max, ideally a fragment)
- Use the user's own words when possible
- Include the source note title in parentheses
- Focus on what's mentally present, not tasks to do

Return JSON in this exact format:
{
  "openThoughts": [{"text": "...", "noteTitle": "...", "noteId": "..."}],
  "decisions": [{"text": "...", "noteTitle": "...", "noteId": "..."}],
  "questions": [{"text": "...", "noteTitle": "...", "noteId": "..."}],
  "blockers": [{"text": "...", "noteTitle": "...", "noteId": "..."}],
  "ideas": [{"text": "...", "noteTitle": "...", "noteId": "..."}],
  "themes": [{"text": "...", "noteCount": 2}]
}

Keep each category to 5 items max. If a category has nothing, return empty array.

NOTES TO ANALYZE:
${notesContent}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You extract mental fragments from notes. Return only valid JSON, no markdown.' },
          { role: 'user', content: synthesisPrompt }
        ],
        temperature: 0.5,
        response_format: { type: 'json_object' }
      });
      
      let synthesis;
      try {
        synthesis = JSON.parse(completion.choices[0].message.content);
      } catch (e) {
        synthesis = {
          openThoughts: [],
          decisions: [],
          questions: [],
          blockers: [],
          ideas: [],
          themes: []
        };
      }
      
      // Map note titles to actual note IDs for navigation
      const noteMap = {};
      notes.forEach(n => { noteMap[n.title] = n.id; });
      
      const mapNoteIds = (items) => {
        return (items || []).map(item => ({
          ...item,
          noteId: noteMap[item.noteTitle] || item.noteId || null
        }));
      };
      
      synthesis.openThoughts = mapNoteIds(synthesis.openThoughts);
      synthesis.decisions = mapNoteIds(synthesis.decisions);
      synthesis.questions = mapNoteIds(synthesis.questions);
      synthesis.blockers = mapNoteIds(synthesis.blockers);
      synthesis.ideas = mapNoteIds(synthesis.ideas);
      
      // Store in cache (upsert)
      try {
        await supabase
          .from('brain_dump_cache')
          .upsert({
            user_id: userId,
            scope_type: scopeType,
            scope_value: scopeValue || '',
            content_hash: contentHash,
            synthesis: synthesis,
            note_count: notes.length,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,scope_type,scope_value'
          });
        console.log('Brain Dump: Cached new synthesis');
      } catch (cacheError) {
        // Cache write failed, log but don't fail the request
        console.error('Failed to cache brain dump:', cacheError);
      }
      
      return NextResponse.json({
        success: true,
        synthesis,
        scope: scopeDescription,
        noteCount: notes.length,
        cached: false,
        notes: notes.map(n => ({ id: n.id, title: n.title }))
      });
    }
    
    // Lemon Squeezy Checkout - Create checkout session
    if (path === 'checkout') {
      const { userId, email } = await request.json();
      
      if (!userId || !email) {
        return NextResponse.json({ error: 'userId and email required' }, { status: 400 });
      }
      
      const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
      const variantId = process.env.LEMON_SQUEEZY_VARIANT_ID;
      const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
      
      if (!storeId || !variantId || !apiKey) {
        console.error('Missing Lemon Squeezy configuration');
        return NextResponse.json({ error: 'Payment configuration error' }, { status: 500 });
      }
      
      try {
        // Create checkout using Lemon Squeezy API
        const checkoutResponse = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/vnd.api+json',
            'Accept': 'application/vnd.api+json',
          },
          body: JSON.stringify({
            data: {
              type: 'checkouts',
              attributes: {
                checkout_data: {
                  email: email,
                  custom: {
                    user_id: userId
                  }
                },
                checkout_options: {
                  embed: false,
                  media: false,
                  button_color: '#90353D'
                },
                product_options: {
                  redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/subscribe?success=true`,
                }
              },
              relationships: {
                store: {
                  data: {
                    type: 'stores',
                    id: storeId
                  }
                },
                variant: {
                  data: {
                    type: 'variants',
                    id: variantId
                  }
                }
              }
            }
          })
        });
        
        if (!checkoutResponse.ok) {
          const errorData = await checkoutResponse.text();
          console.error('Lemon Squeezy checkout error:', errorData);
          return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
        }
        
        const checkoutData = await checkoutResponse.json();
        const checkoutUrl = checkoutData.data?.attributes?.url;
        
        if (!checkoutUrl) {
          console.error('No checkout URL in response:', checkoutData);
          return NextResponse.json({ error: 'Invalid checkout response' }, { status: 500 });
        }
        
        return NextResponse.json({ checkoutUrl });
      } catch (error) {
        console.error('Checkout creation error:', error);
        return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
      }
    }
    
    // Lemon Squeezy Webhook - Handle subscription events
    if (path === 'webhooks/lemonsqueezy') {
      const rawBody = await request.text();
      const signature = request.headers.get('x-signature');
      const eventName = request.headers.get('x-event-name');
      
      // Verify webhook signature
      const webhookSecret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
      
      if (webhookSecret && signature) {
        const crypto = await import('crypto');
        const expectedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(rawBody)
          .digest('hex');
        
        if (signature !== expectedSignature) {
          console.error('Invalid webhook signature');
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }
      }
      
      try {
        const body = JSON.parse(rawBody);
        console.log('Lemon Squeezy webhook received:', eventName);
        
        // Handle subscription events
        if (eventName === 'subscription_created' || eventName === 'subscription_updated') {
          const subscriptionData = body.data;
          const customData = body.meta?.custom_data;
          
          if (!customData?.user_id) {
            console.error('No user_id in webhook custom data');
            return NextResponse.json({ error: 'No user_id in custom data' }, { status: 400 });
          }
          
          const supabase = createServerClient();
          
          // Update user subscription status
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({
              subscription_status: subscriptionData.attributes?.status === 'active' ? 'active' : subscriptionData.attributes?.status,
              subscription_id: subscriptionData.id,
              lemon_squeezy_customer_id: subscriptionData.attributes?.customer_id?.toString(),
              subscription_created_at: subscriptionData.attributes?.created_at,
              subscription_renews_at: subscriptionData.attributes?.renews_at,
              subscription_ends_at: subscriptionData.attributes?.ends_at,
              subscription_variant_id: subscriptionData.attributes?.variant_id?.toString(),
            })
            .eq('user_id', customData.user_id);
          
          if (updateError) {
            console.error('Failed to update subscription status:', updateError);
            return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
          }
          
          console.log('Subscription activated for user:', customData.user_id);
        }
        
        // Handle subscription cancellation/expiration
        if (eventName === 'subscription_cancelled' || eventName === 'subscription_expired') {
          const subscriptionData = body.data;
          const customData = body.meta?.custom_data;
          
          if (customData?.user_id) {
            const supabase = createServerClient();
            
            await supabase
              .from('user_profiles')
              .update({
                subscription_status: 'cancelled',
                subscription_ends_at: subscriptionData.attributes?.ends_at,
              })
              .eq('user_id', customData.user_id);
            
            console.log('Subscription cancelled for user:', customData.user_id);
          }
        }
        
        // Always return 200 to acknowledge receipt
        return NextResponse.json({ received: true });
      } catch (error) {
        console.error('Webhook processing error:', error);
        // Still return 200 to prevent retries
        return NextResponse.json({ received: true, error: error.message });
      }
    }
    
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// Handle PUT requests (update notes and todos)
export async function PUT(request, { params }) {
  const path = params?.path?.join('/') || '';
  
  try {
    // Update note transcript (raw or smartified)
    if (path.startsWith('notes/') && path.split('/').length === 2) {
      const noteId = path.split('/')[1];
      const body = await request.json();
      const { transcription, smartified_text, folder, starred, tags } = body;
      
      const supabase = createServerClient();
      
      // Build update object with only provided fields
      const updateData = {
        updated_at: new Date().toISOString()
      };
      
      if (transcription !== undefined) updateData.transcription = transcription;
      if (smartified_text !== undefined) updateData.smartified_text = smartified_text;
      if (folder !== undefined) updateData.folder = folder;
      if (starred !== undefined) updateData.starred = starred;
      if (tags !== undefined) updateData.tags = tags;
      
      const { data, error } = await supabase
        .from('notes')
        .update(updateData)
        .eq('id', noteId)
        .select()
        .single();
      
      if (error) {
        console.error('Note update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({ success: true, note: data });
    }
    
    // Update todo status
    if (path.startsWith('todos/')) {
      const todoId = path.split('/')[1];
      const { completed } = await request.json();
      
      const supabase = createServerClient();
      
      const { data, error } = await supabase
        .from('todos')
        .update({ completed })
        .eq('id', todoId)
        .select()
        .single();
      
      if (error) {
        console.error('Todo update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({ success: true, todo: data });
    }
    
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// Handle DELETE requests
export async function DELETE(request, { params }) {
  const path = params?.path?.join('/') || '';
  
  try {
    if (path.startsWith('notes/')) {
      const noteId = path.split('/')[1];
      
      const supabase = createServerClient();
      
      // Delete associated todos first
      await supabase
        .from('todos')
        .delete()
        .eq('note_id', noteId);
      
      // Delete the note
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);
      
      if (error) {
        console.error('Note delete error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({ success: true });
    }
    
    // Clear All Data - Delete all user content while keeping account
    if (path === 'user/clear-all-data') {
      const { userId } = await request.json();
      
      if (!userId) {
        return NextResponse.json({ error: 'userId required' }, { status: 400 });
      }
      
      const supabase = createServerClient();
      
      try {
        // 1. Delete all todos for user's notes first (foreign key constraint)
        const { data: userNotes } = await supabase
          .from('notes')
          .select('id')
          .eq('user_id', userId);
        
        if (userNotes && userNotes.length > 0) {
          const noteIds = userNotes.map(n => n.id);
          await supabase
            .from('todos')
            .delete()
            .in('note_id', noteIds);
        }
        
        // 2. Delete all notes (this deletes transcriptions, smartified text, summaries, key points, tags, folders)
        const { error: notesError } = await supabase
          .from('notes')
          .delete()
          .eq('user_id', userId);
        
        if (notesError) {
          console.error('Error deleting notes:', notesError);
          throw notesError;
        }
        
        // 3. Delete any orphan todos directly associated with user
        await supabase
          .from('todos')
          .delete()
          .eq('user_id', userId);
        
        // 4. Reset onboarding preferences in user_profiles (keep account, clear preferences)
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({
            usage_preferences: [],
            ai_style_preferences: [],
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
        
        if (profileError) {
          console.error('Error updating profile:', profileError);
          // Non-fatal, continue
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'All data cleared successfully',
          cleared: {
            notes: userNotes?.length || 0,
            todos: true,
            preferences: true
          }
        });
      } catch (error) {
        console.error('Clear all data error:', error);
        return NextResponse.json({ error: error.message || 'Failed to clear data' }, { status: 500 });
      }
    }
    
    // Delete Account - Full account deletion including auth identity
    if (path === 'user/delete-account') {
      const { userId } = await request.json();
      
      if (!userId) {
        return NextResponse.json({ error: 'userId required' }, { status: 400 });
      }
      
      const supabase = createServerClient();
      
      try {
        // 1. First, clear all user data (same as clear-all-data)
        const { data: userNotes } = await supabase
          .from('notes')
          .select('id')
          .eq('user_id', userId);
        
        if (userNotes && userNotes.length > 0) {
          const noteIds = userNotes.map(n => n.id);
          await supabase
            .from('todos')
            .delete()
            .in('note_id', noteIds);
        }
        
        await supabase
          .from('notes')
          .delete()
          .eq('user_id', userId);
        
        await supabase
          .from('todos')
          .delete()
          .eq('user_id', userId);
        
        // 2. Delete user profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .delete()
          .eq('user_id', userId);
        
        if (profileError) {
          console.error('Error deleting profile:', profileError);
          // Continue anyway - the auth deletion is most important
        }
        
        // 3. Delete auth user using admin API (requires service role)
        // Using the Supabase admin auth API
        const { error: authError } = await supabase.auth.admin.deleteUser(userId);
        
        if (authError) {
          console.error('Error deleting auth user:', authError);
          return NextResponse.json({ 
            error: 'Failed to delete authentication record. Please contact support.',
            details: authError.message 
          }, { status: 500 });
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'Account deleted successfully'
        });
      } catch (error) {
        console.error('Delete account error:', error);
        return NextResponse.json({ 
          error: error.message || 'Failed to delete account',
          details: 'If the problem persists, please contact support.'
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
