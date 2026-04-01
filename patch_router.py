import json
import re

with open('workflow10_fixed.md', 'r', encoding='utf-8') as f:
    text = f.read()

data = json.loads(text)

# Remove the old Router
nodes = [n for n in data['nodes'] if n['name'] != 'Router']

# Add Router 1
nodes.append({
  "parameters": {
    "dataType": "string",
    "value1": "={{ $json.step }}",
    "rules": { "rules": [
        { "value2": "start", "output": 0 },
        { "value2": "ask_manual_or_chat", "output": 1 },
        { "value2": "ask_name", "output": 2 }
    ] },
    "fallbackOutput": 3
  },
  "name": "Router 1",
  "type": "n8n-nodes-base.switch",
  "typeVersion": 1,
  "position": [ 400, 300 ]
})

# Add Router 2
nodes.append({
  "parameters": {
    "dataType": "string",
    "value1": "={{ $json.step }}",
    "rules": { "rules": [
        { "value2": "ask_phone", "output": 0 },
        { "value2": "ask_email", "output": 1 },
        { "value2": "ask_password", "output": 2 }
    ] },
    "fallbackOutput": 3
  },
  "name": "Router 2",
  "type": "n8n-nodes-base.switch",
  "typeVersion": 1,
  "position": [ 400, 450 ]
})

# Add Router 3
nodes.append({
  "parameters": {
    "dataType": "string",
    "value1": "={{ $json.step }}",
    "rules": { "rules": [
        { "value2": "ask_terms", "output": 0 },
        { "value2": "ask_role", "output": 1 },
        { "value2": "biz_ask_name", "output": 2 }
    ] },
    "fallbackOutput": 3
  },
  "name": "Router 3",
  "type": "n8n-nodes-base.switch",
  "typeVersion": 1,
  "position": [ 400, 600 ]
})

# Add Router 4
nodes.append({
  "parameters": {
    "dataType": "string",
    "value1": "={{ $json.step }}",
    "rules": { "rules": [
        { "value2": "preview", "output": 0 }
    ] },
    "fallbackOutput": 1
  },
  "name": "Router 4",
  "type": "n8n-nodes-base.switch",
  "typeVersion": 1,
  "position": [ 400, 750 ]
})

data['nodes'] = nodes

# Fix connections
conns = data['connections']
if 'Router' in conns:
    del conns['Router']

conns["Session Manager"] = { "main": [ [ { "node": "Router 1", "type": "main", "index": 0 } ] ] }
conns["Router 1"] = {
  "main": [
    [ { "node": "Set ask_manual_or_chat", "type": "main", "index": 0 } ],
    [ { "node": "Manual or Chat?", "type": "main", "index": 0 } ],
    [ { "node": "Save Name", "type": "main", "index": 0 } ],
    [ { "node": "Router 2", "type": "main", "index": 0 } ]
  ]
}
conns["Router 2"] = {
  "main": [
    [ { "node": "Save Phone", "type": "main", "index": 0 } ],
    [ { "node": "Save Email", "type": "main", "index": 0 } ],
    [ { "node": "Save Pass", "type": "main", "index": 0 } ],
    [ { "node": "Router 3", "type": "main", "index": 0 } ]
  ]
}
conns["Router 3"] = {
  "main": [
    [ { "node": "Save Terms", "type": "main", "index": 0 } ],
    [ { "node": "Save Role", "type": "main", "index": 0 } ],
    [ { "node": "Save Biz Name", "type": "main", "index": 0 } ],
    [ { "node": "Router 4", "type": "main", "index": 0 } ]
  ]
}
conns["Router 4"] = {
  "main": [
    [ { "node": "Is Submit", "type": "main", "index": 0 } ],
    []
  ]
}

data['name'] = "BizNepal Telegram Signup (Router Limits Fixed)"

with open('workflow11_router_fixed.md', 'w', encoding='utf-8') as f:
    f.write('```json\n' + json.dumps(data, indent=2) + '\n```\n')
print("Successfully generated workflow11_router_fixed.md")
