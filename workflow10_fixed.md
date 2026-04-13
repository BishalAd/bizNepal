{
  "name": "Biznity Chatbot Signup (Logic Fixed)",
  "nodes": [
    {
      "parameters": {
        "updates": [ "message", "callback_query" ],
        "additionalFields": {}
      },
      "name": "Telegram Trigger",
      "type": "n8n-nodes-base.telegramTrigger",
      "typeVersion": 1,
      "position": [ 0, 300 ],
      "id": "node-telegram-trigger",
      "credentials": { "telegramApi": { "id": "Biznity Bot", "name": "Telegram API" } }
    },
    {
      "parameters": {
        "jsCode": "const staticData = $getWorkflowStaticData('global');\nstaticData.sessions = staticData.sessions || {};\n\nlet userId = null;\nlet text = '';\nif ($json.callback_query) {\n  userId = $json.callback_query.from.id;\n  text = $json.callback_query.data;\n} else if ($json.message) {\n  userId = $json.message.from.id;\n  text = $json.message.text || '';\n} else {\n  userId = $json.from?.id || $json.chat?.id;\n  text = $json.text || $json.data || '';\n}\n\nif (!userId) { return { json: { error: 'No userId' } }; }\n\nif (text === '/start' || text === '/restart' || !staticData.sessions[userId]) {\n  staticData.sessions[userId] = { step: 'start', data: {} };\n}\n\nreturn {\n  json: { userId: userId, step: staticData.sessions[userId].step, text: text, sessionData: staticData.sessions[userId].data }\n};"
      },
      "name": "Session Manager",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [ 200, 300 ],
      "id": "node-session"
    },
    {
      "parameters": {
        "dataType": "string",
        "value1": "={{ $json.step }}",
        "rules": {
          "rules": [
            { "value2": "start", "output": 0 },
            { "value2": "ask_manual_or_chat", "output": 1 },
            { "value2": "ask_name", "output": 2 },
            { "value2": "ask_phone", "output": 3 },
            { "value2": "ask_email", "output": 4 },
            { "value2": "ask_password", "output": 5 },
            { "value2": "ask_terms", "output": 6 },
            { "value2": "ask_role", "output": 7 },
            { "value2": "biz_ask_name", "output": 8 },
            { "value2": "preview", "output": 9 }
          ]
        },
        "fallbackOutput": 9
      },
      "name": "Router",
      "type": "n8n-nodes-base.switch",
      "typeVersion": 1,
      "position": [ 400, 300 ],
      "id": "node-router"
    },
    {
      "parameters": {
        "jsCode": "const staticData = $getWorkflowStaticData('global');\nstaticData.sessions[$json.userId].step = 'ask_manual_or_chat';\nreturn $input.all();"
      },
      "name": "Set ask_manual_or_chat",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [ 600, -100 ],
      "id": "node-set1"
    },
    {
      "parameters": {
        "chatId": "={{ $json.userId }}",
        "text": "Welcome to Biznity 🚀\nHow would you like to sign up?",
        "replyMarkup": "inlineKeyboard",
        "inlineKeyboard": {
          "rows": [
            { "row": { "buttons": [ { "text": "Manual Signup", "additionalFields": { "callback_data": "manual" } }, { "text": "Chat Signup", "additionalFields": { "callback_data": "chat" } } ] } }
          ]
        },
        "additionalFields": {}
      },
      "name": "Send Welcome",
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1,
      "position": [ 800, -100 ],
      "id": "node-welcome",
      "credentials": { "telegramApi": { "id": "Biznity Bot", "name": "Telegram API" } }
    },
    {
      "parameters": {
        "conditions": { "string": [ { "value1": "={{ $json.text }}", "value2": "manual" } ] }
      },
      "name": "Manual or Chat?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [ 600, 100 ],
      "id": "node-if-chat"
    },
    {
      "parameters": {
        "jsCode": "const staticData = $getWorkflowStaticData('global');\ndelete staticData.sessions[$json.userId];\nreturn $input.all();"
      },
      "name": "Clear Session (Manual)",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [ 800, 0 ],
      "id": "node-clear1"
    },
    {
      "parameters": {
        "chatId": "={{ $json.userId }}",
        "text": "Sign up on our site: https://biznity.vercel.app/register\n(Type /start anytime to restart)",
        "additionalFields": {}
      },
      "name": "Send Manual Link",
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1,
      "position": [ 1000, 0 ],
      "id": "node-manual-link",
      "credentials": { "telegramApi": { "id": "Biznity Bot", "name": "Telegram API" } }
    },
    {
      "parameters": {
        "jsCode": "const staticData = $getWorkflowStaticData('global');\nstaticData.sessions[$json.userId].step = 'ask_name';\nreturn $input.all();"
      },
      "name": "Set ask_name",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [ 800, 200 ],
      "id": "node-set-name"
    },
    {
      "parameters": {
        "chatId": "={{ $json.userId }}",
        "text": "Let's get started. Please enter your Full Name:",
        "additionalFields": {}
      },
      "name": "Ask Name",
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1,
      "position": [ 1000, 200 ],
      "id": "node-ask-name",
      "credentials": { "telegramApi": { "id": "Biznity Bot", "name": "Telegram API" } }
    },
    {
      "parameters": {
        "jsCode": "const staticData = $getWorkflowStaticData('global');\nif(!$json.text || $json.text.length < 2) {\n  $json.valid = false; \n  return $input.all();\n}\nstaticData.sessions[$json.userId].data.fullname = $json.text;\nstaticData.sessions[$json.userId].step = 'ask_phone';\n$json.valid = true;\nreturn $input.all();"
      },
      "name": "Save Name",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [ 600, 350 ],
      "id": "node-save-name"
    },
    {
      "parameters": {
        "chatId": "={{ $json.userId }}",
        "text": "Please enter your Phone Number:",
        "additionalFields": {}
      },
      "name": "Ask Phone",
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1,
      "position": [ 800, 350 ],
      "id": "node-ask-phone",
      "credentials": { "telegramApi": { "id": "Biznity Bot", "name": "Telegram API" } }
    },
    {
      "parameters": {
        "jsCode": "const staticData = $getWorkflowStaticData('global');\nstaticData.sessions[$json.userId].data.phone = $json.text;\nstaticData.sessions[$json.userId].step = 'ask_email';\n$json.valid = true;\nreturn $input.all();"
      },
      "name": "Save Phone",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [ 600, 500 ],
      "id": "node-save-phone"
    },
    {
      "parameters": {
        "chatId": "={{ $json.userId }}",
        "text": "Please enter your Email Address:",
        "additionalFields": {}
      },
      "name": "Ask Email",
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1,
      "position": [ 800, 500 ],
      "id": "node-ask-email",
      "credentials": { "telegramApi": { "id": "Biznity Bot", "name": "Telegram API" } }
    },
    {
      "parameters": {
        "jsCode": "const staticData = $getWorkflowStaticData('global');\nstaticData.sessions[$json.userId].data.email = $json.text;\nstaticData.sessions[$json.userId].step = 'ask_password';\n$json.valid = true;\nreturn $input.all();"
      },
      "name": "Save Email",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [ 600, 650 ],
      "id": "node-save-email"
    },
    {
      "parameters": {
        "chatId": "={{ $json.userId }}",
        "text": "Please enter your Password (min 6 chars):",
        "additionalFields": {}
      },
      "name": "Ask Password",
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1,
      "position": [ 800, 650 ],
      "id": "node-ask-pass",
      "credentials": { "telegramApi": { "id": "Biznity Bot", "name": "Telegram API" } }
    },
    {
      "parameters": {
        "jsCode": "const staticData = $getWorkflowStaticData('global');\nstaticData.sessions[$json.userId].data.password = $json.text;\nstaticData.sessions[$json.userId].step = 'ask_terms';\n$json.valid = true;\nreturn $input.all();"
      },
      "name": "Save Pass",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [ 600, 800 ],
      "id": "node-save-pass"
    },
    {
      "parameters": {
        "chatId": "={{ $json.userId }}",
        "text": "Do you accept the Terms of Service?",
        "replyMarkup": "inlineKeyboard",
        "inlineKeyboard": {
          "rows": [
            { "row": { "buttons": [ { "text": "Yes", "additionalFields": { "callback_data": "Yes" } }, { "text": "No", "additionalFields": { "callback_data": "No" } } ] } }
          ]
        },
        "additionalFields": {}
      },
      "name": "Ask Terms",
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1,
      "position": [ 800, 800 ],
      "id": "node-ask-terms",
      "credentials": { "telegramApi": { "id": "Biznity Bot", "name": "Telegram API" } }
    },
    {
      "parameters": {
        "jsCode": "const staticData = $getWorkflowStaticData('global');\nif($json.text !== 'Yes') { $json.valid = false; return $input.all(); }\nstaticData.sessions[$json.userId].step = 'ask_role';\n$json.valid = true;\nreturn $input.all();"
      },
      "name": "Save Terms",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [ 600, 950 ],
      "id": "node-save-terms"
    },
    {
      "parameters": {
        "chatId": "={{ $json.userId }}",
        "text": "Are you a User or Business Owner?",
        "replyMarkup": "inlineKeyboard",
        "inlineKeyboard": {
          "rows": [
            { "row": { "buttons": [ { "text": "User", "additionalFields": { "callback_data": "user" } }, { "text": "Business Owner", "additionalFields": { "callback_data": "business" } } ] } }
          ]
        },
        "additionalFields": {}
      },
      "name": "Ask Role",
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1,
      "position": [ 800, 950 ],
      "id": "node-ask-role",
      "credentials": { "telegramApi": { "id": "Biznity Bot", "name": "Telegram API" } }
    },
    {
      "parameters": {
        "jsCode": "const staticData = $getWorkflowStaticData('global');\nstaticData.sessions[$json.userId].data.role = $json.text;\nif($json.text === 'business') {\n  staticData.sessions[$json.userId].step = 'biz_ask_name';\n} else {\n  staticData.sessions[$json.userId].step = 'preview';\n}\n$json.role = $json.text;\nreturn $input.all();"
      },
      "name": "Save Role",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [ 600, 1100 ],
      "id": "node-save-role"
    },
    {
      "parameters": {
        "conditions": { "string": [ { "value1": "={{ $json.role }}", "value2": "business" } ] }
      },
      "name": "Is Business?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [ 800, 1100 ],
      "id": "node-if-biz"
    },
    {
      "parameters": {
        "chatId": "={{ $json.userId }}",
        "text": "Please enter your Business Name:",
        "additionalFields": {}
      },
      "name": "Ask Biz Name",
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1,
      "position": [ 1000, 1050 ],
      "id": "node-ask-biz",
      "credentials": { "telegramApi": { "id": "Biznity Bot", "name": "Telegram API" } }
    },
    {
      "parameters": {
        "jsCode": "const staticData = $getWorkflowStaticData('global');\nstaticData.sessions[$json.userId].data.bizName = $json.text;\nstaticData.sessions[$json.userId].step = 'preview';\n$json.valid = true;\nreturn $input.all();"
      },
      "name": "Save Biz Name",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [ 600, 1250 ],
      "id": "node-save-biz-name"
    },
    {
      "parameters": {
        "chatId": "={{ $json.userId }}",
        "text": "=📋 *Preview your Profile*\n\n*Name:* {{$json.sessionData.fullname}}\n*Role:* {{$json.sessionData.role === 'business' ? 'Business Owner' : 'User' }}\n\n*Is this correct?*",
        "replyMarkup": "inlineKeyboard",
        "inlineKeyboard": {
          "rows": [
            { "row": { "buttons": [ { "text": "Yes, Submit", "additionalFields": { "callback_data": "submit" } }, { "text": "Edit", "additionalFields": { "callback_data": "/start" } } ] } }
          ]
        },
        "additionalFields": { "parse_mode": "Markdown" }
      },
      "name": "Send Preview",
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1,
      "position": [ 800, 1250 ],
      "id": "node-send-preview",
      "credentials": { "telegramApi": { "id": "Biznity Bot", "name": "Telegram API" } }
    },
    {
      "parameters": {
        "conditions": { "string": [ { "value1": "={{ $json.text }}", "value2": "submit" } ] }
      },
      "name": "Is Submit",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [ 600, 1400 ],
      "id": "node-if-submit"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.SUPABASE_URL }}/auth/v1/signup",
        "sendHeaders": true,
        "headerParameters": { "parameters": [ { "name": "apikey", "value": "={{ $env.SUPABASE_ANON_KEY }}" }, { "name": "Content-Type", "value": "application/json" } ] },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"email\": \"{{$json.sessionData.email}}\",\n  \"password\": \"{{$json.sessionData.password}}\",\n  \"data\": { \"full_name\": \"{{$json.sessionData.fullname}}\", \"phone\": \"{{$json.sessionData.phone}}\" }\n}",
        "options": {}
      },
      "name": "Supabase SignUp Auth",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [ 800, 1400 ],
      "id": "node-auth-signup"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/users",
        "sendHeaders": true,
        "headerParameters": { "parameters": [ { "name": "apikey", "value": "={{ $env.SUPABASE_ANON_KEY }}" }, { "name": "Authorization", "value": "=Bearer {{ $env.SUPABASE_ANON_KEY }}" }, { "name": "Content-Type", "value": "application/json" } ] },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"id\": \"{{$json.user.id}}\",\n  \"email\": \"{{$node[\"Session Manager\"].json.sessionData.email}}\",\n  \"full_name\": \"{{$node[\"Session Manager\"].json.sessionData.fullname}}\",\n  \"role\": \"{{$node[\"Session Manager\"].json.sessionData.role === 'business' ? 'business_owner' : 'user'}}\",\n  \"phone\": \"{{$node[\"Session Manager\"].json.sessionData.phone}}\"\n}",
        "options": {}
      },
      "name": "Supabase Insert DB User",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [ 1000, 1400 ],
      "id": "node-profile"
    },
    {
      "parameters": {
        "conditions": { "string": [ { "value1": "={{ $node[\"Session Manager\"].json.sessionData.role }}", "value2": "business" } ] }
      },
      "name": "Check Business Submit",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [ 1200, 1400 ],
      "id": "node-biz-submit-check"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/businesses",
        "sendHeaders": true,
        "headerParameters": { "parameters": [ { "name": "apikey", "value": "={{ $env.SUPABASE_ANON_KEY }}" }, { "name": "Authorization", "value": "=Bearer {{ $env.SUPABASE_ANON_KEY }}" }, { "name": "Content-Type", "value": "application/json" }, { "name": "Prefer", "value": "return=minimal" } ] },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"name\": \"{{$node[\"Session Manager\"].json.sessionData.bizName}}\",\n  \"slug\": \"{{$node[\"Session Manager\"].json.sessionData.bizName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 10000)}}\",\n  \"address\": \"Pending Update\",\n  \"city\": \"Unknown\",\n  \"owner_id\": \"{{$node[\"Supabase SignUp Auth\"].json.user.id}}\"\n}",
        "options": {}
      },
      "name": "Supabase Insert Business",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [ 1400, 1350 ],
      "id": "node-insert-biz"
    },
    {
      "parameters": {
        "chatId": "={{ $node[\"Session Manager\"].json.userId }}",
        "text": "🎉 Success! Your account is perfectly created via Telegram.\nVisit https://biznity.vercel.app/login to login securely.",
        "additionalFields": {}
      },
      "name": "Send Success",
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1,
      "position": [ 1600, 1400 ],
      "id": "node-success"
    },
    {
      "parameters": {
        "jsCode": "const staticData = $getWorkflowStaticData('global');\ndelete staticData.sessions[$node[\"Session Manager\"].json.userId];\nreturn $input.all();"
      },
      "name": "Clear Session Done",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [ 1800, 1400 ],
      "id": "node-final"
    }
  ],
  "connections": {
    "Telegram Trigger": { "main": [ [ { "node": "Session Manager", "type": "main", "index": 0 } ] ] },
    "Session Manager": { "main": [ [ { "node": "Router", "type": "main", "index": 0 } ] ] },
    "Router": {
      "main": [
        [ { "node": "Set ask_manual_or_chat", "type": "main", "index": 0 } ],
        [ { "node": "Manual or Chat?", "type": "main", "index": 0 } ],
        [ { "node": "Save Name", "type": "main", "index": 0 } ],
        [ { "node": "Save Phone", "type": "main", "index": 0 } ],
        [ { "node": "Save Email", "type": "main", "index": 0 } ],
        [ { "node": "Save Pass", "type": "main", "index": 0 } ],
        [ { "node": "Save Terms", "type": "main", "index": 0 } ],
        [ { "node": "Save Role", "type": "main", "index": 0 } ],
        [ { "node": "Save Biz Name", "type": "main", "index": 0 } ],
        [ { "node": "Is Submit", "type": "main", "index": 0 } ]
      ]
    },
    "Set ask_manual_or_chat": { "main": [ [ { "node": "Send Welcome", "type": "main", "index": 0 } ] ] },
    "Manual or Chat?": { "main": [ [ { "node": "Clear Session (Manual)", "type": "main", "index": 0 } ], [ { "node": "Set ask_name", "type": "main", "index": 0 } ] ] },
    "Clear Session (Manual)": { "main": [ [ { "node": "Send Manual Link", "type": "main", "index": 0 } ] ] },
    "Set ask_name": { "main": [ [ { "node": "Ask Name", "type": "main", "index": 0 } ] ] },
    "Save Name": { "main": [ [ { "node": "Ask Phone", "type": "main", "index": 0 } ] ] },
    "Save Phone": { "main": [ [ { "node": "Ask Email", "type": "main", "index": 0 } ] ] },
    "Save Email": { "main": [ [ { "node": "Ask Password", "type": "main", "index": 0 } ] ] },
    "Save Pass": { "main": [ [ { "node": "Ask Terms", "type": "main", "index": 0 } ] ] },
    "Save Terms": { "main": [ [ { "node": "Ask Role", "type": "main", "index": 0 } ] ] },
    "Save Role": { "main": [ [ { "node": "Is Business?", "type": "main", "index": 0 } ] ] },
    "Is Business?": { "main": [ [ { "node": "Ask Biz Name", "type": "main", "index": 0 } ], [ { "node": "Send Preview", "type": "main", "index": 0 } ] ] },
    "Save Biz Name": { "main": [ [ { "node": "Send Preview", "type": "main", "index": 0 } ] ] },
    "Is Submit": { "main": [ [ { "node": "Supabase SignUp Auth", "type": "main", "index": 0 } ] ] },
    "Supabase SignUp Auth": { "main": [ [ { "node": "Supabase Insert DB User", "type": "main", "index": 0 } ] ] },
    "Supabase Insert DB User": { "main": [ [ { "node": "Check Business Submit", "type": "main", "index": 0 } ] ] },
    "Check Business Submit": { "main": [ [ { "node": "Supabase Insert Business", "type": "main", "index": 0 } ], [ { "node": "Send Success", "type": "main", "index": 0 } ] ] },
    "Supabase Insert Business": { "main": [ [ { "node": "Send Success", "type": "main", "index": 0 } ] ] },
    "Send Success": { "main": [ [ { "node": "Clear Session Done", "type": "main", "index": 0 } ] ] }
  }
}
