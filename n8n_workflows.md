# BizNepal n8n Workflow Instructions

Here are the complete JSON configurations for the 7 requested n8n workflows.

**How to use:**
1. Open your n8n instance.
2. Create a new workflow.
3. Click on the ⚙️ gear icon (or "More" options) on the canvas and select **Import from File / Paste JSON**.
4. Paste the JSON block for the corresponding workflow directly into the editor.
5. Update your credentials (e.g., WhatsApp API, Email SMTP, Google Sheets OAuth) inside each node after importing.

## Setup & API Troubleshooting

The workflows below depend on internal API endpoints. If you encounter issues (e.g., 404 errors), please verify the following:

### 1. Project Structure & API Paths
All API routes are located in the `biznepal/src/app/api/` directory. When deploying to Vercel, ensure the `biznepal` folder is the root of your deployment for the URLs below to work.

- **Businesses Route:** `/api/bot/get-subscribed-businesses`
  - *Internal Path:* `src/app/api/bot/get-subscribed-businesses/route.ts`
  - *Method:* `GET` (No query parameters required)
- **Activity Summary:** `/api/activity-summary`
  - *Internal Path:* `src/app/api/activity-summary/route.ts`
  - *Method:* `POST` (Requires JSON body: `{ "businessId": "UUID", "period": "2h|6h|daily" }`)

### 2. Required Parameters & Authentication
- **Headers:** All requests to these endpoints require the `x-webhook-secret` header, which should match your `WEBHOOK_SECRET` environment variable.
- **Business Fetching (Supabase Filters):** If you are manually fetching businesses, these are the core filters used in the system:
  - `search`: String (partial name match)
  - `category`: UUID
  - `district`: UUID
  - `verifiedOnly`: Boolean
  - `rating`: Number (returns results ≥ this value)

---

### Workflow 1: New Order Notification

This workflow listens for new checkout transactions. If it's a Cash on Delivery (COD), it notifies the owner that cash must be collected. If it's prepaid via Khalti/eSewa, it alerts that order is securely paid. It also emails the customer and logs everything to a Google Sheet.

```json
{
  "name": "BizNepal: New Order Alerts",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "new-order",
        "options": {}
      },
      "id": "1-webhook",
      "name": "Webhook: New Order",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [240, 300],
      "webhookId": "new-order-listener"
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{$json.body.paymentMethod}}",
              "value2": "cod"
            }
          ]
        }
      },
      "id": "2-if-cod",
      "name": "Check if COD",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [460, 300]
    },
    {
      "parameters": {
        "chatId": "={{$json.body.businessTelegramChatId}}",
        "text": "=🛍️ *New COD Order!*\n*Product:* {{$json.body.items[0].title}}\n*Amount:* ₨ {{$json.body.total}}\n*Customer:* {{$json.body.customerName}} {{$json.body.customerPhone}}\n*Deliver to:* {{$json.body.customerAddress.address}}",
        "additionalFields": {
          "parse_mode": "Markdown"
        }
      },
      "id": "3a-telegram-cod",
      "name": "Telegram (COD)",
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1,
      "position": [700, 200],
      "credentials": {
        "telegramApi": {
          "id": "BizNepal Bot",
          "name": "Telegram API"
        }
      }
    },
    {
      "parameters": {
        "chatId": "={{$json.body.businessTelegramChatId}}",
        "text": "=✅ *New Paid Order!*\n*Product:* {{$json.body.items[0].title}}\n*Amount:* ₨ {{$json.body.total}} (paid via {{$json.body.paymentMethod}})\n*Customer:* {{$json.body.customerName}} {{$json.body.customerPhone}}",
        "additionalFields": {
          "parse_mode": "Markdown"
        }
      },
      "id": "3b-telegram-paid",
      "name": "Telegram (Paid)",
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1,
      "position": [700, 400],
      "credentials": {
        "telegramApi": {
          "id": "BizNepal Bot",
          "name": "Telegram API"
        }
      }
    },
    {
      "parameters": {
        "fromEmail": "orders@biznepal.com",
        "toEmail": "={{$json.body.customerEmail}}",
        "subject": "Order Confirmed - BizNepal",
        "text": "Hello {{$json.body.customerName}},\n\nYour order has been placed successfully!\nTotal: Rs {{$json.body.total}}.\n\nThank you for shopping on BizNepal.",
        "options": {}
      },
      "id": "4-email-customer",
      "name": "Email Customer",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 2,
      "position": [940, 300]
    },
    {
      "parameters": {
        "operation": "append",
        "documentId": {
          "__rl": true,
          "value": "ENTER_YOUR_SHEET_ID_HERE",
          "mode": "id"
        },
        "sheetName": {
          "__rl": true,
          "value": "Sheet1",
          "mode": "name"
        },
        "dataMode": "define",
        "columns": {
          "mappingMode": "define",
          "value": {
            "Order ID": "={{$node[\"Webhook: New Order\"].json.body.orderId}}",
            "Business ID": "={{$node[\"Webhook: New Order\"].json.body.businessId}}",
            "Total": "={{$node[\"Webhook: New Order\"].json.body.total}}",
            "Method": "={{$node[\"Webhook: New Order\"].json.body.paymentMethod}}"
          }
        },
        "options": {}
      },
      "id": "5-google-sheets",
      "name": "Log to Sheets",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4.1,
      "position": [1160, 300]
    }
  ],
  "connections": {
    "Webhook: New Order": {
      "main": [
        [
          {
            "node": "Check if COD",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Check if COD": {
      "main": [
        [
          {
            "node": "3a-telegram-cod",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "3b-telegram-paid",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "3a-telegram-cod": {
      "main": [
        [
          {
            "node": "Email Customer",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "3b-telegram-paid": {
      "main": [
        [
          {
            "node": "Email Customer",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Email Customer": {
      "main": [
        [
          {
            "node": "Log to Sheets",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

---

### Workflow 2: Business Activity Summary (Cron Scheduler)

Runs every 2 hours, fetching businesses via an HTTP array request, mapping through them using a loop, checking the Supabase proxy API endpoint, and passing a WhatsApp summary *only* if `orders > 0 || applications > 0`.

```json
{
  "name": "BizNepal: Bi-Hourly Activity Summary",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "hours",
              "hoursInterval": 2
            }
          ]
        }
      },
      "id": "1-schedule",
      "name": "Every 2 Hours",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.1,
      "position": [200, 300]
    },
    {
      "parameters": {
        "url": "https://biz-nepal.vercel.app/api/bot/get-subscribed-businesses",
        "authentication": "headerAuth",
        "options": {}
      },
      "id": "2-get-businesses",
      "name": "Fetch Businesses",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [420, 300],
      "credentials": {
        "httpHeaderAuth": {
          "id": "WEBHOOK_SECRET",
          "name": "Header Auth"
        }
      }
    },
    {
      "parameters": {
        "batchSize": 1
      },
      "id": "3-split-batches",
      "name": "Split In Batches",
      "type": "n8n-nodes-base.splitInBatches",
      "typeVersion": 1,
      "position": [640, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://biz-nepal.vercel.app/api/activity-summary",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"businessId\": \"{{ $json.id }}\",\n  \"period\": \"2h\"\n}",
        "options": {}
      },
      "id": "4-get-summary",
      "name": "Fetch Summary Data",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [860, 300],
      "credentials": {
        "httpHeaderAuth": {
          "id": "WEBHOOK_SECRET",
          "name": "Header Auth"
        }
      }
    },
    {
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{ $json.orders > 0 || $json.applications > 0 || $json.bookings > 0 || $json.reviews > 0 }}",
              "operation": "equal",
              "value2": true
            }
          ]
        }
      },
      "id": "5-if-activity",
      "name": "Has Activity?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [1080, 300]
    },
    {
      "parameters": {
        "chatId": "={{ $node[\"Split In Batches\"].json[\"telegram_chat_id\"] }}",
        "text": "=📊 *BizNepal Summary (Last 2 hours)*\n\n💰 *Orders:* {{ $json.orders || 0 }} (₨ {{ $json.revenue || 0 }})\n👔 *Applications:* {{ $json.applications || 0 }}\n🎟 *Bookings:* {{ $json.bookings || 0 }}\n⭐️ *Reviews:* {{ $json.reviews || 0 }}",
        "additionalFields": {
          "parse_mode": "Markdown"
        }
      },
      "id": "6-telegram-summary",
      "name": "Telegram Summary",
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1,
      "position": [1300, 200],
      "credentials": {
        "telegramApi": {
          "id": "BizNepal Bot",
          "name": "Telegram API"
        }
      }
    }
  ],
  "connections": {
    "Every 2 Hours": {
      "main": [
        [
          {
            "node": "Fetch Businesses",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Fetch Businesses": {
      "main": [
        [
          {
            "node": "Split In Batches",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Split In Batches": {
      "main": [
        [
          {
            "node": "Fetch Summary Data",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Fetch Summary Data": {
      "main": [
        [
          {
            "node": "Has Activity?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Has Activity?": {
      "main": [
        [
          {
            "node": "Telegram Summary",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Split In Batches",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Telegram Summary": {
      "main": [
        [
          {
            "node": "Split In Batches",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

---

### Workflow 3: Job Application Alerts

```json
{
  "name": "BizNepal: Job Application",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "job-application",
        "options": {}
      },
      "id": "1-webhook",
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [200, 200]
    },
    {
      "parameters": {
        "chatId": "={{$json.body.businessTelegramChatId}}",
        "text": "=👔 *New Job Application!*\n*Position:* {{$json.body.jobTitle}}\n*Applicant:* {{$json.body.applicantName}}\n*Phone:* {{$json.body.applicantPhone}}\n*CV:* {{$json.body.cvUrl}}",
        "additionalFields": {
          "parse_mode": "Markdown"
        }
      },
      "id": "2-telegram-biz",
      "name": "Telegram: Notify Business",
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1,
      "position": [440, 200],
      "credentials": {
        "telegramApi": {
          "id": "BizNepal Bot",
          "name": "Telegram API"
        }
      }
    },
    {
      "parameters": {
        "fromEmail": "jobs@biznepal.com",
        "toEmail": "={{$json.body.businessEmail}}",
        "subject": "New Applicant: {{$json.body.applicantName}}",
        "text": "A new applicant has applied to {{$json.body.jobTitle}}. View their CV here: {{$json.body.cvUrl}}",
        "options": {}
      },
      "id": "3-email-biz",
      "name": "Email: Send CV",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 2,
      "position": [660, 200]
    },
    {
      "parameters": {
        "chatId": "={{$json.body.applicantTelegramChatId}}",
        "text": "=✅ *Application Received!*\nYou applied for: *{{$json.body.jobTitle}}* at *{{$json.body.businessName}}*. We'll review your application within 5-7 business days.",
        "additionalFields": {
          "parse_mode": "Markdown"
        }
      },
      "id": "4-telegram-applicant",
      "name": "Telegram: Notify Applicant",
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1,
      "position": [880, 200],
      "credentials": {
        "telegramApi": {
          "id": "BizNepal Bot",
          "name": "Telegram API"
        }
      }
    }
  ],
  "connections": {
    "Webhook Trigger": {
      "main": [
        [
          {
            "node": "Telegram: Notify Business",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Telegram: Notify Business": {
      "main": [
        [
          {
            "node": "Email: Send CV",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Email: Send CV": {
      "main": [
        [
          {
            "node": "Telegram: Notify Applicant",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

---

### Workflow 4: Event Booking Confirmation

```json
{
  "name": "BizNepal: Event Booking",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "event-booking",
        "options": {}
      },
      "id": "1-webhook",
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [200, 260]
    },
    {
      "parameters": {
        "url": "=https://api.qrserver.com/v1/create-qr-code/?size=500x500&data={{$json.body.ticketCode}}",
        "options": {}
      },
      "id": "2-generate-qr",
      "name": "Generate QR Link",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [420, 260]
    },
    {
      "parameters": {
        "chatId": "={{$node[\"Webhook Trigger\"].json.body.attendeeTelegramChatId}}",
        "text": "=🎟️ *Booking Confirmed!*\n*Event:* {{$node[\"Webhook Trigger\"].json.body.eventTitle}}\n*Seats:* {{$node[\"Webhook Trigger\"].json.body.seats}}\n*Ticket Code:* {{$node[\"Webhook Trigger\"].json.body.ticketCode}}\nShow this code at entry.",
        "additionalFields": {
          "parse_mode": "Markdown"
        }
      },
      "id": "3-telegram-attendee",
      "name": "Telegram: Notify Attendee",
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1,
      "position": [640, 260],
      "credentials": {
        "telegramApi": {
          "id": "BizNepal Bot",
          "name": "Telegram API"
        }
      }
    },
    {
      "parameters": {
        "chatId": "={{$node[\"Webhook Trigger\"].json.body.organizerTelegramChatId}}",
        "text": "=✅ *New Booking for {{$node[\"Webhook Trigger\"].json.body.eventTitle}}*\n*Attendee:* {{$node[\"Webhook Trigger\"].json.body.attendeeName}} ({{$node[\"Webhook Trigger\"].json.body.seats}} seats)",
        "additionalFields": {
          "parse_mode": "Markdown"
        }
      },
      "id": "4-telegram-organizer",
      "name": "Telegram: Notify Organizer",
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1,
      "position": [860, 260],
      "credentials": {
        "telegramApi": {
          "id": "BizNepal Bot",
          "name": "Telegram API"
        }
      }
    }
  ],
  "connections": {
    "Webhook Trigger": {
      "main": [ [ { "node": "Generate QR Link", "type": "main", "index": 0 } ] ]
    },
    "Generate QR Link": {
      "main": [ [ { "node": "Telegram: Notify Attendee", "type": "main", "index": 0 } ] ]
    },
    "Telegram: Notify Attendee": {
      "main": [ [ { "node": "Telegram: Notify Organizer", "type": "main", "index": 0 } ] ]
    }
  }
}
```

---

### Workflow 5: Offer Expiry

```json
{
  "name": "BizNepal: Offer Expiry Warning",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [ { "field": "minutes", "minutesInterval": 30 } ]
        }
      },
      "id": "1-schedule",
      "name": "Every 30 mins",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.1,
      "position": [200, 300]
    },
    {
      "parameters": {
        "url": "https://biz-nepal.vercel.app/api/webhooks/offer-expiry",
        "method": "POST",
        "options": {}
      },
      "id": "2-get-offers",
      "name": "Fetch Expiring Offers",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [420, 300]
    },
    {
      "parameters": {},
      "id": "3-loop",
      "name": "Loop Over Offers",
      "type": "n8n-nodes-base.loop",
      "typeVersion": 1,
      "position": [640, 300]
    },
    {
      "parameters": {
        "chatId": "={{$json.businessTelegramChatId}}",
        "text": "=⏰ *Offer Expiring Soon!*\nYour offer '*{{$json.offerTitle}}*' expires in exactly 2 hours.\n*{{$json.grabbed}}* customers have grabbed it. Extend it from your dashboard!",
        "additionalFields": {
          "parse_mode": "Markdown"
        }
      },
      "id": "4-telegram-biz",
      "name": "Telegram: Notify Owner",
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1,
      "position": [860, 300],
      "credentials": {
        "telegramApi": {
          "id": "BizNepal Bot",
          "name": "Telegram API"
        }
      }
    }
  ],
  "connections": {
    "Every 30 mins": { "main": [ [ { "node": "Fetch Expiring Offers", "type": "main", "index": 0 } ] ] },
    "Fetch Expiring Offers": { "main": [ [ { "node": "Loop Over Offers", "type": "main", "index": 0 } ] ] },
    "Loop Over Offers": { "main": [ [ { "node": "Telegram: Notify Owner", "type": "main", "index": 0 } ] ] },
    "Telegram: Notify Owner": { "main": [ [ { "node": "Loop Over Offers", "type": "main", "index": 0 } ] ] }
  }
}
```

---

### Workflow 6: New Review Alerts

```json
{
  "name": "BizNepal: New Review Logic",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "new-review",
        "options": {}
      },
      "id": "1-webhook",
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [200, 300]
    },
    {
      "parameters": {
        "conditions": {
          "number": [
            {
              "value1": "={{$json.body.rating}}",
              "operation": "smallerEqual",
              "value2": 2
            }
          ]
        }
      },
      "id": "2-if-negative",
      "name": "Is Critical? (≤2)",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [420, 300]
    },
    {
      "parameters": {
        "chatId": "={{$node[\"Webhook Trigger\"].json.body.businessTelegramChatId}}",
        "text": "=⚠️ *New Low-Rating Review!*\n{{$node[\"Webhook Trigger\"].json.body.reviewerName}} gave you *{{$node[\"Webhook Trigger\"].json.body.rating}}⭐*\n'{{$node[\"Webhook Trigger\"].json.body.content}}'\nRespond promptly to handle customer resolution.",
        "additionalFields": {
          "parse_mode": "Markdown"
        }
      },
      "id": "3a-telegram-bad",
      "name": "Telegram: Urgent Alert",
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1,
      "position": [640, 200],
      "credentials": {
        "telegramApi": {
          "id": "BizNepal Bot",
          "name": "Telegram API"
        }
      }
    },
    {
      "parameters": {
        "chatId": "={{$node[\"Webhook Trigger\"].json.body.businessTelegramChatId}}",
        "text": "=🌟 *New Positive Review!*\n{{$node[\"Webhook Trigger\"].json.body.reviewerName}} gave you *{{$node[\"Webhook Trigger\"].json.body.rating}}⭐*\n'{{$node[\"Webhook Trigger\"].json.body.content}}'",
        "additionalFields": {
          "parse_mode": "Markdown"
        }
      },
      "id": "3b-telegram-good",
      "name": "Telegram: Positive Alert",
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1,
      "position": [640, 400],
      "credentials": {
        "telegramApi": {
          "id": "BizNepal Bot",
          "name": "Telegram API"
        }
      }
    }
  ],
  "connections": {
    "Webhook Trigger": { "main": [ [ { "node": "Is Critical? (≤2)", "type": "main", "index": 0 } ] ] },
    "Is Critical? (≤2)": {
      "main": [
        [ { "node": "Telegram: Urgent Alert", "type": "main", "index": 0 } ],
        [ { "node": "Telegram: Positive Alert", "type": "main", "index": 0 } ]
      ]
    }
  }
}
```

---

### Workflow 7: Welcome New Businesses

```json
{
  "name": "BizNepal: Onboarding Sequence",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "new-signup",
        "options": {}
      },
      "id": "1-webhook",
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [200, 300]
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{$json.body.accountType}}",
              "value2": "business"
            }
          ]
        }
      },
      "id": "2-if-business",
      "name": "Is Business Account?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [420, 300]
    },
    {
      "parameters": {
        "amount": 10,
        "unit": "minutes"
      },
      "id": "3-wait",
      "name": "Wait 10 Minutes",
      "type": "n8n-nodes-base.wait",
      "typeVersion": 1,
      "position": [640, 280]
    },
    {
      "parameters": {
        "chatId": "={{$node[\"Webhook Trigger\"].json.body.telegramChatId}}",
        "text": "=👋 *Welcome to BizNepal!*\n\nStart by completing your business profile to attract customers to your dashboard. Need help? Message us right here!\n\n🔗 [Open Dashboard](https://biz-nepal.vercel.app/dashboard)",
        "additionalFields": {
          "parse_mode": "Markdown"
        }
      },
      "id": "4-telegram-welcome",
      "name": "Telegram: Send Welcome msg",
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1,
      "position": [880, 280],
      "credentials": {
        "telegramApi": {
          "id": "BizNepal Bot",
          "name": "Telegram API"
        }
      }
    }
  ],
  "connections": {
    "Webhook Trigger": { "main": [ [ { "node": "Is Business Account?", "type": "main", "index": 0 } ] ] },
    "Is Business Account?": { "main": [ [ { "node": "Wait 10 Minutes", "type": "main", "index": 0 } ] ] },
    "Wait 10 Minutes": { "main": [ [ { "node": "Telegram: Send Welcome msg", "type": "main", "index": 0 } ] ] }
  }
}
```

---

### Workflow 8: Telegram /start Handler

This workflow handles the `/start TOKEN` command from the bot. It extracts the token, calls the BizNepal API to link the chat ID, and sends a confirmation message.

```json
{
  "name": "BizNepal: Telegram /start Handler",
  "nodes": [
    {
      "parameters": {
        "updates": [
          "message"
        ],
        "additionalFields": {}
      },
      "id": "1-webhook",
      "name": "Telegram Trigger",
      "type": "n8n-nodes-base.telegramTrigger",
      "typeVersion": 1,
      "position": [200, 300],
      "credentials": {
        "telegramApi": {
          "id": "BizNepal Bot",
          "name": "Telegram API"
        }
      }
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{$json.message.text}}",
              "operation": "startsWith",
              "value2": "/start"
            }
          ]
        }
      },
      "id": "2-if-start",
      "name": "Is /start?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [420, 300]
    },
    {
      "parameters": {
        "values": {
          "string": [
            {
              "name": "token",
              "value": "={{$json.message.text.split(' ')[1]}}"
            },
            {
              "name": "chatId",
              "value": "={{$json.message.chat.id}}"
            }
          ]
        },
        "options": {}
      },
      "id": "3-extract-data",
      "name": "Extract Token & ChatId",
      "type": "n8n-nodes-base.set",
      "typeVersion": 1,
      "position": [640, 200]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://biz-nepal.vercel.app/api/bot/link-telegram",
        "authentication": "headerAuth",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"token\": \"{{$json.token}}\",\n  \"chatId\": {{$json.chatId}}\n}",
        "options": {}
      },
      "id": "4-api-link",
      "name": "Link Telegram API",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [860, 200],
      "credentials": {
        "httpHeaderAuth": {
          "id": "WEBHOOK_SECRET",
          "name": "Header Auth"
        }
      }
    },
    {
      "parameters": {
        "chatId": "={{$node[\"Telegram Trigger\"].json.message.chat.id}}",
        "text": "=✅ *Connection Successful!*\n\nYour Telegram account is now linked to *{{$json.businessName}}* on BizNepal. You will receive real-time notifications for orders, jobs, and reviews right here.",
        "additionalFields": {
          "parse_mode": "Markdown"
        }
      },
      "id": "5-success-msg",
      "name": "Success Message",
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1,
      "position": [1080, 200]
    },
    {
      "parameters": {
        "chatId": "={{$json.message.chat.id}}",
        "text": "👋 *Welcome to BizNepal Notifications!*\n\nTo connect your business account, please visit your dashboard and click **'Connect Telegram'**.\n\n🔗 [Open Dashboard](https://biz-nepal.vercel.app/dashboard/notification-settings)",
        "additionalFields": {
          "parse_mode": "Markdown"
        }
      },
      "id": "6-guide-msg",
      "name": "Guide Message",
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1,
      "position": [640, 400]
    }
  ],
  "connections": {
    "Telegram Trigger": {
      "main": [
        [
          {
            "node": "Is /start?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Is /start?": {
      "main": [
        [
          {
            "node": "Extract Token & ChatId",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Guide Message",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Extract Token & ChatId": {
      "main": [
        [
          {
            "node": "Link Telegram API",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Link Telegram API": {
      "main": [
        [
          {
            "node": "Success Message",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

