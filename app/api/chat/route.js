import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import OpenAI from 'openai';
import { trackTokens } from '@/lib/track-tokens';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Remy's personality layer - consistent across all chat surfaces
const REMY_PERSONALITY = `You are Remy, a thoughtful AI assistant embedded in Founder Note. You help founders capture, organize, and reflect on their thoughts.

PERSONALITY TRAITS:
- Calm, precise, and intentional in your responses
- You speak with warmth but without unnecessary filler
- You're a reliable memory companion, not just a Q&A bot
- When users explicitly ask you to remember something, you acknowledge it clearly but minimally

FORMATTING RULES:
- NEVER use markdown formatting (no **bold**, no *italic*, no bullet lists with -, no numbered lists with 1.)
- Write in plain, flowing prose. Use short paragraphs separated by line breaks.
- If listing items, use natural language ("First, ... Second, ...") or simple line breaks, never markdown syntax.

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

// AI-normalize and split compound intents into clean individual items
const normalizeIntents = async (rawText, supabase, userId) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Extract distinct action items or things to remember from the user's text. For each item, produce a short, clean label (max 10 words). Capitalize properly. No trailing periods.
Classify each as: remember, todo, or follow-up.
Return JSON: { "items": [{ "text": "...", "type": "remember" }] }

Examples:
Input: "i have my door unlocked, and that i have to pick up my kids from school at 1 am"
Output: { "items": [{ "text": "Door is unlocked", "type": "remember" }, { "text": "Pick up kids from school at 1 AM", "type": "todo" }] }

Input: "follow up with sarah about the pitch deck next week"
Output: { "items": [{ "text": "Follow up with Sarah about pitch deck next week", "type": "follow-up" }] }

Input: "the meeting with investors is on friday at 3pm"
Output: { "items": [{ "text": "Investor meeting on Friday at 3 PM", "type": "remember" }] }`
        },
        { role: 'user', content: rawText }
      ],
      temperature: 0.2,
      max_tokens: 300,
      response_format: { type: 'json_object' }
    });

    // Track token usage for intent normalization
    if (response.usage?.total_tokens && supabase && userId) {
      await trackTokens(supabase, userId, response.usage.total_tokens);
    }

    const parsed = JSON.parse(response.choices[0].message.content);
    return parsed.items || [];
  } catch (error) {
    console.error('Intent normalization error:', error);
    // Fallback: return the raw text as a single item
    return [{ text: rawText, type: 'remember' }];
  }
};

export async function POST(request) {
  try {
    const { user, supabase } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { messages, contextScope } = await request.json();

    if (!messages) {
      return NextResponse.json({ error: 'messages required' }, { status: 400 });
    }

    if (!contextScope || !contextScope.type) {
      return NextResponse.json({ error: 'contextScope with type required' }, { status: 400 });
    }
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
        // AI-normalize and split compound intents into clean items
        const normalizedItems = await normalizeIntents(intentContent, supabase, user.id);
        const capturedIntents = [];

        for (const item of normalizedItems) {
          try {
            const { data: intent, error: intentError } = await supabase
              .from('intents')
              .insert({
                user_id: user.id,
                raw_text: latestUserMessage.content,
                normalized_intent: item.text,
                intent_type: item.type || 'remember',
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
              capturedIntents.push({
                id: intent.id,
                content: item.text,
                type: item.type,
                timestamp: intent.created_at
              });
            } else {
              console.error('Intent storage error:', intentError);
            }
          } catch (err) {
            console.error('Intent capture error:', err);
          }
        }

        if (capturedIntents.length > 0) {
          capturedIntent = capturedIntents;
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
        .eq('user_id', user.id)
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
        .eq('user_id', user.id)
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
        .eq('user_id', user.id)
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
    if (intentFlowTriggered && capturedIntent && capturedIntent.length > 0) {
      messagesForAI = [...messages];
      const intentList = capturedIntent.map(i => `"${i.content}"`).join(', ');
      const intentSystemNote = `[SYSTEM: The user just triggered an intent flow. You successfully captured and stored ${capturedIntent.length} item(s): ${intentList}. Acknowledge this briefly and warmly, confirming what you'll remember. Keep it to 1-2 sentences.]`;
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

    const aiResponse = completion.choices[0].message.content;

    // Track token usage for main chat completion
    if (completion.usage?.total_tokens) {
      await trackTokens(supabase, user.id, completion.usage.total_tokens);
    }

    // Only return sources that Remy actually cited in its response
    // For intent flow (just acknowledging a "remember"), no sources needed
    let relevantSources = [];
    if (!intentFlowTriggered && notes.length > 0) {
      if (contextScope.type === 'note') {
        // Single note scope — always relevant
        relevantSources = notes.map(n => ({
          id: n.id, title: n.title, date: n.created_at, folder: n.folder, tags: n.tags
        }));
      } else {
        // Multi-note scopes — only include notes whose titles appear in the AI response
        relevantSources = notes
          .filter(n => n.title && aiResponse.includes(n.title))
          .slice(0, 5)
          .map(n => ({
            id: n.id, title: n.title, date: n.created_at, folder: n.folder, tags: n.tags
          }));
      }
    }

    return NextResponse.json({
      success: true,
      message: aiResponse,
      scope: {
        type: contextScope.type,
        description: scopeDescription,
        noteCount: notes.length
      },
      sources: relevantSources,
      intentCaptured: capturedIntent && capturedIntent.length > 0 ? capturedIntent : null
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
