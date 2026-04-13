# Biznity Telegram Bot — FINAL WORKFLOW (Import This)

## How to Import
1. Open n8n → **New Workflow** 
2. Click **⋯ menu** → **Import from JSON**
3. Paste the entire JSON block below
4. Set your credentials on the Telegram nodes (select your "Biznity Bot" API key)
5. Activate the workflow

## All 3 Bugs Fixed
| Bug | Fix |
|---|---|
| Email step loops forever | All routing logic lives in ONE Dispatcher Code node — no cross-node data loss |
| Manual signup users stuck at /start | Added `/link email password` command |
| No way to confirm account after web signup | `/link` verifies against Supabase Auth, stores `telegram_chat_id`, sends dashboard link |

## Bot Commands
| Command | What it does |
|---|---|
| `/start` | Shows welcome screen with Manual/Chat Signup buttons |
| `/link email@x.com Password123` | Links a web-registered account to Telegram |
| `/restart` | Resets the session and starts over |

## Architecture (Why it now works)
```
Telegram Trigger
     ↓
[Dispatcher Code Node]  ← ALL step logic here, 0 cross-node data dependency
     ↓
[Action Router]  ← Simple 3-way switch: send | signup | link_account
     ├─ send        → Telegram Send Message
     ├─ signup      → Supabase Auth → Insert User → Insert Business? → Success DM
     └─ link_account → Supabase Login → PATCH telegram_chat_id → Confirmation DM
```

---

```json
{
  "name": "Biznity Telegram Signup (Final — Dispatcher Architecture)",
  "nodes": [
    {
      "parameters": {
        "updates": ["message", "callback_query"],
        "additionalFields": {}
      },
      "name": "Telegram Trigger",
      "type": "n8n-nodes-base.telegramTrigger",
      "typeVersion": 1,
      "position": [0, 300],
      "id": "trigger",
      "credentials": { "telegramApi": { "id": "Biznity Bot", "name": "Telegram API" } }
    },
    {
      "parameters": {
        "jsCode": "// ─── DISPATCHER: Single source of truth for all routing ───\nconst staticData = $getWorkflowStaticData('global');\nstaticData.sessions = staticData.sessions || {};\n\n// ── 1. Extract userId and user input reliably ──\nlet userId, text, firstName;\nif ($json.callback_query) {\n  userId = String($json.callback_query.from.id);\n  text = $json.callback_query.data || '';\n  firstName = $json.callback_query.from.first_name || 'there';\n} else if ($json.message) {\n  userId = String($json.message.from.id);\n  text = $json.message.text || '';\n  firstName = $json.message.from.first_name || 'there';\n} else {\n  return { json: { action: 'noop' } };\n}\n\nif (!userId) return { json: { action: 'noop' } };\n\n// ── 2. Session init / reset ──\nconst isReset = (text === '/start' || text === '/restart' || !staticData.sessions[userId]);\nif (isReset) {\n  staticData.sessions[userId] = { step: 'start', data: {} };\n}\n\nconst session = staticData.sessions[userId];\nconst step = session.step;\nconst data = session.data;\n\n// ── Helper: build inline keyboard ──\nfunction kbd(rows) {\n  return JSON.stringify({ inline_keyboard: rows });\n}\n\n// /link command: link manually-registered account to Telegram\nif (text.startsWith('/link')) {\n  const parts = text.trim().split(/\\s+/);\n  if (parts.length < 3) {\n    return { json: {\n      action: 'send',\n      userId,\n      msg: '\\u{1F517} To link your account type:\\n/link your@email.com YourPassword'\n    }};\n  }\n  return { json: {\n    action: 'link_account',\n    userId,\n    linkEmail: parts[1],\n    linkPass: parts[2]\n  }};\n}\n\n// ── STEP: start ──\nif (step === 'start') {\n  session.step = 'ask_manual_or_chat';\n  return { json: {\n    action: 'send',\n    userId,\n    msg: '\\u{1F44B} Welcome to Biznity, ' + firstName + '! \\u{1F680}\\nHow would you like to sign up?',\n    buttons: kbd([[{ text: '\\u{1F4CB} Manual Signup', callback_data: 'manual' }, { text: '\\u{1F4AC} Chat Signup', callback_data: 'chat' }]])\n  }};\n}\n\n// ── STEP: ask_manual_or_chat ──\nif (step === 'ask_manual_or_chat') {\n  if (text === 'manual') {\n    session.step = 'awaiting_link';\n    return { json: {\n      action: 'send',\n      userId,\n      msg: '\\u{1F310} Register on our website:\\nhttps://biznity.vercel.app/register\\n\\nOnce registered, come back and type:\\n/link your@email.com YourPassword\\n\\n_This links your account to Telegram._'\n    }};\n  }\n  if (text === 'chat') {\n    session.step = 'ask_name';\n    return { json: { action: 'send', userId, msg: '\\u270D Please enter your *Full Name*:' }};\n  }\n  return { json: {\n    action: 'send',\n    userId,\n    msg: 'Please tap one of the buttons above \\u261D',\n    buttons: kbd([[{ text: '\\u{1F4CB} Manual Signup', callback_data: 'manual' }, { text: '\\u{1F4AC} Chat Signup', callback_data: 'chat' }]])\n  }};\n}\n\n// ── STEP: awaiting_link (after manual signup) ──\nif (step === 'awaiting_link') {\n  if (text.startsWith('/link')) {\n    // handled above already, this won't be reached\n  }\n  return { json: {\n    action: 'send',\n    userId,\n    msg: '\\u23F3 Still waiting! After registering on the website, type:\\n/link your@email.com YourPassword'\n  }};\n}\n\n// ── STEP: ask_name ──\nif (step === 'ask_name') {\n  if (!text || text.length < 2 || text.startsWith('/')) {\n    return { json: { action: 'send', userId, msg: '\\u274C Please enter a valid full name (at least 2 letters).' }};\n  }\n  data.fullname = text;\n  session.step = 'ask_phone';\n  return { json: { action: 'send', userId, msg: '\\u{1F4F1} Please enter your *Phone Number*:' }};\n}\n\n// ── STEP: ask_phone ──\nif (step === 'ask_phone') {\n  if (!text || text.length < 7) {\n    return { json: { action: 'send', userId, msg: '\\u274C Please enter a valid phone number (min 7 digits).' }};\n  }\n  data.phone = text;\n  session.step = 'ask_email';\n  return { json: { action: 'send', userId, msg: '\\u{1F4E7} Please enter your *Email Address*:' }};\n}\n\n// ── STEP: ask_email ──\nif (step === 'ask_email') {\n  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;\n  if (!emailRegex.test(text)) {\n    return { json: { action: 'send', userId, msg: '\\u274C That email looks invalid. Please try again:' }};\n  }\n  data.email = text;\n  session.step = 'ask_password';\n  return { json: { action: 'send', userId, msg: '\\u{1F512} Please enter your *Password* (min 6 characters):' }};\n}\n\n// ── STEP: ask_password ──\nif (step === 'ask_password') {\n  if (!text || text.length < 6) {\n    return { json: { action: 'send', userId, msg: '\\u274C Password must be at least 6 characters. Try again:' }};\n  }\n  data.password = text;\n  session.step = 'ask_terms';\n  return { json: {\n    action: 'send',\n    userId,\n    msg: '\\u{1F4DC} Do you accept our *Terms of Service*?\\nhttps://biznity.vercel.app/terms',\n    buttons: kbd([[{ text: '\\u2705 Yes, I Accept', callback_data: 'Yes' }, { text: '\\u274C No', callback_data: 'No' }]])\n  }};\n}\n\n// ── STEP: ask_terms ──\nif (step === 'ask_terms') {\n  if (text === 'No') {\n    delete staticData.sessions[userId];\n    return { json: { action: 'send', userId, msg: '\\u{1F44B} No problem! Type /start anytime to try again.' }};\n  }\n  if (text !== 'Yes') {\n    return { json: {\n      action: 'send',\n      userId,\n      msg: 'Please use the buttons to accept or decline:',\n      buttons: kbd([[{ text: '\\u2705 Yes, I Accept', callback_data: 'Yes' }, { text: '\\u274C No', callback_data: 'No' }]])\n    }};\n  }\n  session.step = 'ask_role';\n  return { json: {\n    action: 'send',\n    userId,\n    msg: '\\u{1F464} Are you a *User* or a *Business Owner*?',\n    buttons: kbd([[{ text: '\\u{1F64B} User', callback_data: 'user' }, { text: '\\u{1F3E2} Business Owner', callback_data: 'business' }]])\n  }};\n}\n\n// ── STEP: ask_role ──\nif (step === 'ask_role') {\n  if (text !== 'user' && text !== 'business') {\n    return { json: {\n      action: 'send',\n      userId,\n      msg: 'Please tap a button to choose your role:',\n      buttons: kbd([[{ text: '\\u{1F64B} User', callback_data: 'user' }, { text: '\\u{1F3E2} Business Owner', callback_data: 'business' }]])\n    }};\n  }\n  data.role = text;\n  if (text === 'business') {\n    session.step = 'ask_biz_name';\n    return { json: { action: 'send', userId, msg: '\\u{1F3EA} Please enter your *Business Name*:' }};\n  }\n  session.step = 'preview';\n  return { json: {\n    action: 'send',\n    userId,\n    msg: '\\u{1F4CB} *Review your details:*\\n\\n\\u{1F464} Name: ' + data.fullname + '\\n\\u{1F4E7} Email: ' + data.email + '\\n\\u{1F4F1} Phone: ' + data.phone + '\\n\\u{1F3AD} Role: User\\n\\nConfirm and submit?',\n    buttons: kbd([[{ text: '\\u2705 Submit', callback_data: 'submit' }, { text: '\\u270F\\uFE0F Start Over', callback_data: '/start' }]])\n  }};\n}\n\n// ── STEP: ask_biz_name ──\nif (step === 'ask_biz_name') {\n  if (!text || text.length < 2) {\n    return { json: { action: 'send', userId, msg: '\\u274C Please enter a valid business name.' }};\n  }\n  data.bizName = text;\n  session.step = 'preview';\n  return { json: {\n    action: 'send',\n    userId,\n    msg: '\\u{1F4CB} *Review your details:*\\n\\n\\u{1F464} Name: ' + data.fullname + '\\n\\u{1F4E7} Email: ' + data.email + '\\n\\u{1F4F1} Phone: ' + data.phone + '\\n\\u{1F3AD} Role: Business Owner\\n\\u{1F3EA} Business: ' + data.bizName + '\\n\\nConfirm and submit?',\n    buttons: kbd([[{ text: '\\u2705 Submit', callback_data: 'submit' }, { text: '\\u270F\\uFE0F Start Over', callback_data: '/start' }]])\n  }};\n}\n\n// ── STEP: preview ──\nif (step === 'preview') {\n  if (text !== 'submit') {\n    const isBiz = data.role === 'business';\n    return { json: {\n      action: 'send',\n      userId,\n      msg: '\\u{1F4CB} *Review your details:*\\n\\n\\u{1F464} Name: ' + data.fullname + '\\n\\u{1F4E7} Email: ' + data.email + '\\n\\u{1F4F1} Phone: ' + data.phone + '\\n\\u{1F3AD} Role: ' + (isBiz ? 'Business Owner' : 'User') + (isBiz && data.bizName ? '\\n\\u{1F3EA} Business: ' + data.bizName : '') + '\\n\\nConfirm and submit?',\n      buttons: kbd([[{ text: '\\u2705 Submit', callback_data: 'submit' }, { text: '\\u270F\\uFE0F Start Over', callback_data: '/start' }]])\n    }};\n  }\n  session.step = 'submitting';\n  return { json: {\n    action: 'signup',\n    userId,\n    signupData: {\n      email: data.email,\n      password: data.password,\n      fullname: data.fullname,\n      phone: data.phone,\n      role: data.role,\n      bizName: data.bizName || null,\n      telegramChatId: userId\n    }\n  }};\n}\n\n// ── FALLBACK ──\nreturn { json: {\n  action: 'send',\n  userId,\n  msg: 'Type /start to begin or /link email password to connect an existing account.'\n}};"
      },
      "name": "Dispatcher",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [200, 300],
      "id": "dispatcher"
    },
    {
      "parameters": {
        "dataType": "string",
        "value1": "={{ $json.action }}",
        "rules": {
          "rules": [
            { "value2": "send", "output": 0 },
            { "value2": "signup", "output": 1 },
            { "value2": "link_account", "output": 2 }
          ]
        },
        "fallbackOutput": 0
      },
      "name": "Action Router",
      "type": "n8n-nodes-base.switch",
      "typeVersion": 1,
      "position": [450, 300],
      "id": "action-router"
    },
    {
      "parameters": {
        "chatId": "={{ $json.userId }}",
        "text": "={{ $json.msg }}",
        "replyMarkup": "={{ $json.buttons ? 'inlineKeyboard' : 'none' }}",
        "inlineKeyboard": "={{ $json.buttons || '{}' }}",
        "additionalFields": {}
      },
      "name": "Send Telegram Message",
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1,
      "position": [700, 100],
      "id": "tg-send",
      "credentials": { "telegramApi": { "id": "Biznity Bot", "name": "Telegram API" } }
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.SUPABASE_URL }}/auth/v1/signup",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "apikey", "value": "={{ $env.SUPABASE_ANON_KEY }}" },
            { "name": "Content-Type", "value": "application/json" }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"email\": \"{{ $node['Dispatcher'].json['signupData']['email'] }}\",\n  \"password\": \"{{ $node['Dispatcher'].json['signupData']['password'] }}\",\n  \"data\": {\n    \"full_name\": \"{{ $node['Dispatcher'].json['signupData']['fullname'] }}\",\n    \"phone\": \"{{ $node['Dispatcher'].json['signupData']['phone'] }}\"\n  }\n}",
        "options": {}
      },
      "name": "Supabase Auth Signup",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [700, 350],
      "id": "supabase-auth"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/users",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "apikey", "value": "={{ $env.SUPABASE_ANON_KEY }}" },
            { "name": "Authorization", "value": "=Bearer {{ $env.SUPABASE_ANON_KEY }}" },
            { "name": "Content-Type", "value": "application/json" },
            { "name": "Prefer", "value": "return=minimal" }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"id\": \"{{ $json.user.id }}\",\n  \"email\": \"{{ $node['Dispatcher'].json['signupData']['email'] }}\",\n  \"full_name\": \"{{ $node['Dispatcher'].json['signupData']['fullname'] }}\",\n  \"role\": \"{{ $node['Dispatcher'].json['signupData']['role'] === 'business' ? 'business_owner' : 'user' }}\",\n  \"phone\": \"{{ $node['Dispatcher'].json['signupData']['phone'] }}\",\n  \"telegram_chat_id\": {{ $node['Dispatcher'].json['signupData']['telegramChatId'] }}\n}",
        "options": {}
      },
      "name": "Insert User to DB",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [950, 350],
      "id": "insert-user"
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{ $node['Dispatcher'].json['signupData']['role'] }}",
              "value2": "business"
            }
          ]
        }
      },
      "name": "Is Business Role?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [1200, 350],
      "id": "is-business"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/businesses",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "apikey", "value": "={{ $env.SUPABASE_ANON_KEY }}" },
            { "name": "Authorization", "value": "=Bearer {{ $env.SUPABASE_ANON_KEY }}" },
            { "name": "Content-Type", "value": "application/json" },
            { "name": "Prefer", "value": "return=minimal" }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"name\": \"{{ $node['Dispatcher'].json['signupData']['bizName'] }}\",\n  \"slug\": \"biz-{{ $node['Supabase Auth Signup'].json['user']['id'].substring(0,8) }}\",\n  \"owner_id\": \"{{ $node['Supabase Auth Signup'].json['user']['id'] }}\",\n  \"address\": \"Pending Update\",\n  \"city\": \"Unknown\"\n}",
        "options": {}
      },
      "name": "Insert Business to DB",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [1450, 250],
      "id": "insert-biz"
    },
    {
      "parameters": {
        "chatId": "={{ $node['Dispatcher'].json['signupData']['telegramChatId'] }}",
        "text": "=\ud83c\udf89 *Account Created Successfully!*\n\nWelcome to Biznity, {{ $node['Dispatcher'].json['signupData']['fullname'] }}!\n\n\u2705 Email: {{ $node['Dispatcher'].json['signupData']['email'] }}\n\u2705 Role: {{ $node['Dispatcher'].json['signupData']['role'] === 'business' ? 'Business Owner \ud83c\udfe2' : 'User \ud83d\udc64' }}\n\n\ud83d\udc49 [Login to your dashboard](https://biznity.vercel.app/login)\n\n_Your Telegram is now linked to your Biznity account!_",
        "additionalFields": {
          "parse_mode": "Markdown"
        }
      },
      "name": "Send Signup Success",
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1,
      "position": [1700, 350],
      "id": "signup-success",
      "credentials": { "telegramApi": { "id": "Biznity Bot", "name": "Telegram API" } }
    },
    {
      "parameters": {
        "jsCode": "const staticData = $getWorkflowStaticData('global');\nconst userId = $node['Dispatcher'].json['signupData']['telegramChatId'];\nif (staticData.sessions && staticData.sessions[userId]) {\n  delete staticData.sessions[userId];\n}\nreturn $input.all();"
      },
      "name": "Clear Session After Signup",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [1950, 350],
      "id": "clear-session"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.SUPABASE_URL }}/auth/v1/token?grant_type=password",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "apikey", "value": "={{ $env.SUPABASE_ANON_KEY }}" },
            { "name": "Content-Type", "value": "application/json" }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"email\": \"{{ $json.linkEmail }}\",\n  \"password\": \"{{ $json.linkPass }}\"\n}",
        "options": {}
      },
      "name": "Supabase Login for Link",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [700, 550],
      "id": "supabase-login"
    },
    {
      "parameters": {
        "method": "PATCH",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/users?id=eq.{{ $json.user.id }}",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "apikey", "value": "={{ $env.SUPABASE_ANON_KEY }}" },
            { "name": "Authorization", "value": "=Bearer {{ $json.access_token }}" },
            { "name": "Content-Type", "value": "application/json" }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"telegram_chat_id\": {{ $node['Dispatcher'].json['userId'] }}\n}",
        "options": {}
      },
      "name": "Link Telegram Chat ID",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [950, 550],
      "id": "link-telegram"
    },
    {
      "parameters": {
        "chatId": "={{ $node['Dispatcher'].json['userId'] }}",
        "text": "=\u2705 *Account Linked!*\n\nWelcome back, {{ $node['Supabase Login for Link'].json['user']['user_metadata']['full_name'] || $node['Supabase Login for Link'].json['user']['email'] }}!\n\nYour Telegram is now connected to your Biznity account.\n\n\ud83d\udc49 [Go to your Dashboard](https://biznity.vercel.app/dashboard)\n\nType /start anytime to manage your account.",
        "additionalFields": {
          "parse_mode": "Markdown"
        }
      },
      "name": "Send Link Success",
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1,
      "position": [1200, 550],
      "id": "link-success",
      "credentials": { "telegramApi": { "id": "Biznity Bot", "name": "Telegram API" } }
    }
  ],
  "connections": {
    "Telegram Trigger": {
      "main": [[{ "node": "Dispatcher", "type": "main", "index": 0 }]]
    },
    "Dispatcher": {
      "main": [[{ "node": "Action Router", "type": "main", "index": 0 }]]
    },
    "Action Router": {
      "main": [
        [{ "node": "Send Telegram Message", "type": "main", "index": 0 }],
        [{ "node": "Supabase Auth Signup", "type": "main", "index": 0 }],
        [{ "node": "Supabase Login for Link", "type": "main", "index": 0 }]
      ]
    },
    "Supabase Auth Signup": {
      "main": [[{ "node": "Insert User to DB", "type": "main", "index": 0 }]]
    },
    "Insert User to DB": {
      "main": [[{ "node": "Is Business Role?", "type": "main", "index": 0 }]]
    },
    "Is Business Role?": {
      "main": [
        [{ "node": "Insert Business to DB", "type": "main", "index": 0 }],
        [{ "node": "Send Signup Success", "type": "main", "index": 0 }]
      ]
    },
    "Insert Business to DB": {
      "main": [[{ "node": "Send Signup Success", "type": "main", "index": 0 }]]
    },
    "Send Signup Success": {
      "main": [[{ "node": "Clear Session After Signup", "type": "main", "index": 0 }]]
    },
    "Supabase Login for Link": {
      "main": [[{ "node": "Link Telegram Chat ID", "type": "main", "index": 0 }]]
    },
    "Link Telegram Chat ID": {
      "main": [[{ "node": "Send Link Success", "type": "main", "index": 0 }]]
    }
  }
}
```
