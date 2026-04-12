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
All API routes are located in the `biznepal/src/app/api/` directory. When deploying to Vercel, ensure the `biznepal` folder is the root of your deployment for the URLs below to work

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
  "name": "BizNepal: New Order Alerts (Complete)",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "new-order",
        "responseMode": "responseNode"
      },
      "id": "1-webhook",
      "name": "Webhook: New Order",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [200, 300],
      "webhookId": "new-order-listener"
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{$json.body.paymentMethod}}",
              "operation": "equals",
              "value2": "cod"
            }
          ]
        }
      },
      "id": "2-if-cod",
      "name": "Check if COD",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [420, 300]
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{$json.body.businessTelegramChatId}}",
              "operation": "notEmpty"
            }
          ]
        }
      },
      "id": "3-check-telegram",
      "name": "Check Telegram ID",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [620, 300]
    },
    {
      "parameters": {
        "chatId": "={{$json.body.businessTelegramChatId}}",
        "text": "=🛍️ *New COD Order!*\n\n*Order ID:* {{$json.body.orderId}}\n*Product:* {{$json.body.items[0].title}}\n*Amount:* ₨ {{$json.body.total}}\n\n👤 *Customer:* {{$json.body.customerName}}\n📞 {{$json.body.customerPhone}}\n📍 {{$json.body.customerAddress.address}}\n\n⚠️ Payment: Cash on Delivery",
        "additionalFields": {
          "parse_mode": "Markdown"
        }
      },
      "id": "4-telegram-cod",
      "name": "Telegram COD",
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1,
      "position": [850, 180],
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
        "text": "=✅ *New Paid Order!*\n\n*Order ID:* {{$json.body.orderId}}\n*Product:* {{$json.body.items[0].title}}\n*Amount:* ₨ {{$json.body.total}}\n💳 {{$json.body.paymentMethod}}\n\n👤 *Customer:* {{$json.body.customerName}}\n📞 {{$json.body.customerPhone}}",
        "additionalFields": {
          "parse_mode": "Markdown"
        }
      },
      "id": "5-telegram-paid",
      "name": "Telegram Paid",
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1,
      "position": [850, 420],
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
        "text": "Hello {{$json.body.customerName}},\n\nYour order has been successfully placed.\n\n🧾 Order ID: {{$json.body.orderId}}\n💰 Total: Rs {{$json.body.total}}\n\nWe will contact you soon.\n\nThank you for using BizNepal!"
      },
      "id": "6-email",
      "name": "Send Email",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 2,
      "position": [1050, 300]
    },
    {
      "parameters": {
        "operation": "append",
        "documentId": "ENTER_YOUR_SHEET_ID_HERE",
        "sheetName": "Sheet1",
        "columns": {
          "mappingMode": "define",
          "value": {
            "Order ID": "={{$json.body.orderId}}",
            "Business ID": "={{$json.body.businessId}}",
            "Total": "={{$json.body.total}}",
            "Payment Method": "={{$json.body.paymentMethod}}",
            "Customer": "={{$json.body.customerName}}",
            "Phone": "={{$json.body.customerPhone}}",
            "Status": "New",
            "Date": "={{new Date().toISOString()}}"
          }
        }
      },
      "id": "7-sheets",
      "name": "Log to Google Sheets",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4,
      "position": [1250, 300]
    },
    {
      "parameters": {
        "responseBody": "{ \"status\": \"success\", \"message\": \"Order processed\" }"
      },
      "id": "8-response",
      "name": "Webhook Response",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [1450, 300]
    }
  ],
  "connections": {
    "Webhook: New Order": {
      "main": [[{ "node": "Check if COD", "type": "main", "index": 0 }]]
    },
    "Check if COD": {
      "main": [
        [{ "node": "Check Telegram ID", "type": "main", "index": 0 }],
        [{ "node": "Check Telegram ID", "type": "main", "index": 0 }]
      ]
    },
    "Check Telegram ID": {
      "main": [
        [
          { "node": "Telegram COD", "type": "main", "index": 0 },
          { "node": "Telegram Paid", "type": "main", "index": 0 }
        ],
        [{ "node": "Send Email", "type": "main", "index": 0 }]
      ]
    },
    "Telegram COD": {
      "main": [[{ "node": "Send Email", "type": "main", "index": 0 }]]
    },
    "Telegram Paid": {
      "main": [[{ "node": "Send Email", "type": "main", "index": 0 }]]
    },
    "Send Email": {
      "main": [[{ "node": "Log to Google Sheets", "type": "main", "index": 0 }]]
    },
    "Log to Google Sheets": {
      "main": [[{ "node": "Webhook Response", "type": "main", "index": 0 }]]
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



---









### Workflow 9: Telegram Chatbot Signup (Final — Dispatcher Architecture)

> **IMPORTANT**: This is the final, production-ready version. Delete all previous versions of this workflow in n8n and import only this JSON.

#### Architecture
- **One Dispatcher Code Node** handles ALL step logic internally — no more fragile Switch Router chains
- **Action Router** is a simple 3-way switch: send | signup | link_account  
- Supports /link email password command to connect manually registered web accounts to Telegram

#### How Manual Signup Users Link Their Account
1. User clicks Manual Signup → bot sends registration link
2. User registers on website
3. User comes back to Telegram and types: /link their@email.com TheirPassword
4. Bot verifies against Supabase, stores their 	elegram_chat_id, sends confirmation

`json
{
  "name": "BizNepal Telegram Signup (Dispatcher Architecture)",
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
      "credentials": { "telegramApi": { "id": "BizNepal Bot", "name": "Telegram API" } }
    },
    {
      "parameters": {
        "jsCode": "// ─── DISPATCHER: Single source of truth for all routing ───\nconst staticData = $getWorkflowStaticData('global');\nstaticData.sessions = staticData.sessions || {};\n\n// ── 1. Extract userId and user input reliably ──\nlet userId, text, firstName;\nif ($json.callback_query) {\n  userId = String($json.callback_query.from.id);\n  text = $json.callback_query.data || '';\n  firstName = $json.callback_query.from.first_name || 'there';\n} else if ($json.message) {\n  userId = String($json.message.from.id);\n  text = $json.message.text || '';\n  firstName = $json.message.from.first_name || 'there';\n} else {\n  return { json: { action: 'noop' } };\n}\n\nif (!userId) return { json: { action: 'noop' } };\n\n// ── 2. Session init / reset ──\nconst isReset = (text === '/start' || text === '/restart' || !staticData.sessions[userId]);\nif (isReset) {\n  staticData.sessions[userId] = { step: 'start', data: {} };\n}\n\nconst session = staticData.sessions[userId];\nconst step = session.step;\nconst data = session.data;\n\n// ── Helper: build inline keyboard ──\nfunction kbd(rows) {\n  return { inline_keyboard: rows };\n}\n\n// ─────────────────────────────────────────────\n// STEP MACHINE\n// ─────────────────────────────────────────────\n\n// /link command: link manually-registered account to Telegram\nif (text.startsWith('/link')) {\n  const parts = text.trim().split(/\\s+/);\n  if (parts.length < 3) {\n    return { json: {\n      action: 'send',\n      userId,\n      msg: '🔗 To link your account type:\\n/link your@email.com YourPassword'\n    }};\n  }\n  const linkEmail = parts[1];\n  const linkPass = parts[2];\n  return { json: {\n    action: 'link_account',\n    userId,\n    linkEmail,\n    linkPass,\n    msg: '🔄 Checking your account...'\n  }};\n}\n\n// START step\nif (step === 'start') {\n  session.step = 'ask_manual_or_chat';\n  return { json: {\n    action: 'send',\n    userId,\n    msg: `👋 Welcome to BizNepal, ${firstName}! 🚀\\nHow would you like to sign up?`,\n    buttons: kbd([[{ text: '📋 Manual Signup', callback_data: 'manual' }, { text: '💬 Chat Signup', callback_data: 'chat' }]])\n  }};\n}\n\n// CHOICE: manual or chat\nif (step === 'ask_manual_or_chat') {\n  if (text === 'manual') {\n    session.step = 'ask_link_or_done';\n    return { json: {\n      action: 'send',\n      userId,\n      msg: '🌐 Register at: https://biz-nepal.vercel.app/register\\n\\nOnce done, type:\\n/link your@email.com YourPassword\\n\\nThis will connect your account to this Telegram.',\n    }};\n  }\n  if (text === 'chat') {\n    session.step = 'ask_name';\n    return { json: {\n      action: 'send',\n      userId,\n      msg: '✍️ Please enter your *Full Name*:',\n      parseMode: 'Markdown'\n    }};\n  }\n  // Any other input while waiting for choice\n  return { json: {\n    action: 'send',\n    userId,\n    msg: 'Please tap a button above 👆',\n    buttons: kbd([[{ text: '📋 Manual Signup', callback_data: 'manual' }, { text: '💬 Chat Signup', callback_data: 'chat' }]])\n  }};\n}\n\n// ASK NAME\nif (step === 'ask_name') {\n  if (text.length < 2 || text.startsWith('/')) {\n    return { json: { action: 'send', userId, msg: '❌ Please enter a valid full name (at least 2 characters).' }};\n  }\n  data.fullname = text;\n  session.step = 'ask_phone';\n  return { json: { action: 'send', userId, msg: '📱 Please enter your *Phone Number*:', parseMode: 'Markdown' }};\n}\n\n// ASK PHONE\nif (step === 'ask_phone') {\n  if (text.length < 7) {\n    return { json: { action: 'send', userId, msg: '❌ Please enter a valid phone number.' }};\n  }\n  data.phone = text;\n  session.step = 'ask_email';\n  return { json: { action: 'send', userId, msg: '📧 Please enter your *Email Address*:', parseMode: 'Markdown' }};\n}\n\n// ASK EMAIL\nif (step === 'ask_email') {\n  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;\n  if (!emailRegex.test(text)) {\n    return { json: { action: 'send', userId, msg: '❌ That doesn\\'t look like a valid email. Please try again:' }};\n  }\n  data.email = text;\n  session.step = 'ask_password';\n  return { json: { action: 'send', userId, msg: '🔒 Please enter your *Password* (min 6 characters):', parseMode: 'Markdown' }};\n}\n\n// ASK PASSWORD\nif (step === 'ask_password') {\n  if (text.length < 6) {\n    return { json: { action: 'send', userId, msg: '❌ Password must be at least 6 characters. Try again:' }};\n  }\n  data.password = text;\n  session.step = 'ask_terms';\n  return { json: {\n    action: 'send',\n    userId,\n    msg: '📜 Do you accept our *Terms of Service*?\\nhttps://biz-nepal.vercel.app/terms',\n    parseMode: 'Markdown',\n    buttons: kbd([[{ text: '✅ Yes, I Accept', callback_data: 'Yes' }, { text: '❌ No', callback_data: 'No' }]])\n  }};\n}\n\n// ASK TERMS\nif (step === 'ask_terms') {\n  if (text === 'No') {\n    delete staticData.sessions[userId];\n    return { json: { action: 'send', userId, msg: '👋 No problem! Type /start anytime to try again.' }};\n  }\n  if (text !== 'Yes') {\n    return { json: {\n      action: 'send',\n      userId,\n      msg: 'Please use the buttons below to accept or decline:',\n      buttons: kbd([[{ text: '✅ Yes, I Accept', callback_data: 'Yes' }, { text: '❌ No', callback_data: 'No' }]])\n    }};\n  }\n  session.step = 'ask_role';\n  return { json: {\n    action: 'send',\n    userId,\n    msg: '👤 Are you signing up as a *User* or a *Business Owner*?',\n    parseMode: 'Markdown',\n    buttons: kbd([[{ text: '🙋 User', callback_data: 'user' }, { text: '🏢 Business Owner', callback_data: 'business' }]])\n  }};\n}\n\n// ASK ROLE\nif (step === 'ask_role') {\n  if (text !== 'user' && text !== 'business') {\n    return { json: {\n      action: 'send',\n      userId,\n      msg: 'Please tap a button to choose your role:',\n      buttons: kbd([[{ text: '🙋 User', callback_data: 'user' }, { text: '🏢 Business Owner', callback_data: 'business' }]])\n    }};\n  }\n  data.role = text;\n  if (text === 'business') {\n    session.step = 'ask_biz_name';\n    return { json: { action: 'send', userId, msg: '🏪 Please enter your *Business Name*:', parseMode: 'Markdown' }};\n  } else {\n    session.step = 'preview';\n    return { json: {\n      action: 'send',\n      userId,\n      msg: `📋 *Review your details:*\\n\\n👤 Name: ${data.fullname}\\n📧 Email: ${data.email}\\n📱 Phone: ${data.phone}\\n🎭 Role: User\\n\\nLooks good?`,\n      parseMode: 'Markdown',\n      buttons: kbd([[{ text: '✅ Submit', callback_data: 'submit' }, { text: '✏️ Start Over', callback_data: '/start' }]])\n    }};\n  }\n}\n\n// ASK BIZ NAME\nif (step === 'ask_biz_name') {\n  if (text.length < 2) {\n    return { json: { action: 'send', userId, msg: '❌ Please enter a valid business name.' }};\n  }\n  data.bizName = text;\n  session.step = 'preview';\n  return { json: {\n    action: 'send',\n    userId,\n    msg: `📋 *Review your details:*\\n\\n👤 Name: ${data.fullname}\\n📧 Email: ${data.email}\\n📱 Phone: ${data.phone}\\n🎭 Role: Business Owner\\n🏪 Business: ${data.bizName}\\n\\nLooks good?`,\n    parseMode: 'Markdown',\n    buttons: kbd([[{ text: '✅ Submit', callback_data: 'submit' }, { text: '✏️ Start Over', callback_data: '/start' }]])\n  }};\n}\n\n// PREVIEW / SUBMIT\nif (step === 'preview') {\n  if (text !== 'submit') {\n    const isBiz = data.role === 'business';\n    return { json: {\n      action: 'send',\n      userId,\n      msg: `📋 *Review your details:*\\n\\n👤 Name: ${data.fullname}\\n📧 Email: ${data.email}\\n📱 Phone: ${data.phone}\\n🎭 Role: ${isBiz ? 'Business Owner' : 'User'}${isBiz ? `\\n🏪 Business: ${data.bizName}` : ''}\\n\\nLooks good?`,\n      parseMode: 'Markdown',\n      buttons: kbd([[{ text: '✅ Submit', callback_data: 'submit' }, { text: '✏️ Start Over', callback_data: '/start' }]])\n    }};\n  }\n  // Submit! Hand off to Supabase nodes\n  session.step = 'submitting';\n  return { json: {\n    action: 'signup',\n    userId,\n    signupData: { ...data, telegramChatId: userId }\n  }};\n}\n\n// FALLBACK\nreturn { json: {\n  action: 'send',\n  userId,\n  msg: 'Type /start to begin or /link email password to connect an existing account.'\n}};"
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
        "fallbackOutput": 3
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
        "inlineKeyboard": "={{ $json.buttons }}",
        "additionalFields": {
          "parse_mode": "={{ $json.parseMode || '' }}"
        }
      },
      "name": "Send Telegram Message",
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1,
      "position": [700, 150],
      "id": "tg-send",
      "credentials": { "telegramApi": { "id": "BizNepal Bot", "name": "Telegram API" } }
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
        "jsonBody": "={\n  \"email\": \"{{ $json.signupData.email }}\",\n  \"password\": \"{{ $json.signupData.password }}\",\n  \"data\": {\n    \"full_name\": \"{{ $json.signupData.fullname }}\",\n    \"phone\": \"{{ $json.signupData.phone }}\"\n  }\n}",
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
            { "name": "Prefer", "value": "return=representation" }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"id\": \"{{ $node[\"Supabase Auth Signup\"].json.user.id }}\",\n  \"email\": \"{{ $node[\"Dispatcher\"].json.signupData.email }}\",\n  \"full_name\": \"{{ $node[\"Dispatcher\"].json.signupData.fullname }}\",\n  \"role\": \"{{ $node[\"Dispatcher\"].json.signupData.role === 'business' ? 'business_owner' : 'user' }}\",\n  \"phone\": \"{{ $node[\"Dispatcher\"].json.signupData.phone }}\",\n  \"telegram_chat_id\": {{ $node[\"Dispatcher\"].json.signupData.telegramChatId }}\n}",
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
              "value1": "={{ $node[\"Dispatcher\"].json.signupData.role }}",
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
        "jsonBody": "={\n  \"name\": \"{{ $node[\"Dispatcher\"].json.signupData.bizName }}\",\n  \"slug\": \"{{ $node[\"Dispatcher\"].json.signupData.bizName.toLowerCase().replace(/[^a-z0-9]+/g, '-') }}-{{ Math.floor(Math.random()*9000)+1000 }}\",\n  \"owner_id\": \"{{ $node[\"Supabase Auth Signup\"].json.user.id }}\",\n  \"address\": \"Pending - Please Update\",\n  \"city\": \"Unknown\"\n}",
        "options": {}
      },
      "name": "Insert Business to DB",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [1450, 300],
      "id": "insert-biz"
    },
    {
      "parameters": {
        "chatId": "={{ $node[\"Dispatcher\"].json.signupData.telegramChatId }}",
        "text": "=🎉 *Account Created Successfully!*\n\nWelcome to BizNepal, {{ $node[\"Dispatcher\"].json.signupData.fullname }}!\n\n✅ Email: {{ $node[\"Dispatcher\"].json.signupData.email }}\n✅ Role: {{ $node[\"Dispatcher\"].json.signupData.role === 'business' ? 'Business Owner' : 'User' }}\n\n👉 [Login to your dashboard](https://biz-nepal.vercel.app/login)\n\n_Your Telegram is now linked to your BizNepal account!_",
        "additionalFields": {
          "parse_mode": "Markdown"
        }
      },
      "name": "Send Signup Success",
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1,
      "position": [1700, 350],
      "id": "signup-success",
      "credentials": { "telegramApi": { "id": "BizNepal Bot", "name": "Telegram API" } }
    },
    {
      "parameters": {
        "jsCode": "// Clear session after successful signup\nconst staticData = $getWorkflowStaticData('global');\nconst userId = $node['Dispatcher'].json.signupData.telegramChatId;\nif (staticData.sessions && staticData.sessions[userId]) {\n  delete staticData.sessions[userId];\n}\nreturn $input.all();"
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
      "name": "Supabase Login (Link)",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [700, 500],
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
        "jsonBody": "={\n  \"telegram_chat_id\": {{ $node['Dispatcher'].json.userId }}\n}",
        "options": {}
      },
      "name": "Link Telegram to Account",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [950, 500],
      "id": "link-telegram"
    },
    {
      "parameters": {
        "chatId": "={{ $node['Dispatcher'].json.userId }}",
        "text": "=✅ *Account Linked!*\n\nWelcome back, {{ $node['Supabase Login (Link)'].json.user.user_metadata.full_name || $node['Supabase Login (Link)'].json.user.email }}!\n\nYour Telegram is now connected to your BizNepal account.\n\n👉 [Go to Dashboard](https://biz-nepal.vercel.app/dashboard)\n\nType /start anytime to manage your account.",
        "additionalFields": {
          "parse_mode": "Markdown"
        }
      },
      "name": "Send Link Success",
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1,
      "position": [1200, 500],
      "id": "link-success",
      "credentials": { "telegramApi": { "id": "BizNepal Bot", "name": "Telegram API" } }
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
        [{ "node": "Supabase Login (Link)", "type": "main", "index": 0 }]
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
    "Supabase Login (Link)": {
      "main": [[{ "node": "Link Telegram to Account", "type": "main", "index": 0 }]]
    },
    "Link Telegram to Account": {
      "main": [[{ "node": "Send Link Success", "type": "main", "index": 0 }]]
    }
  }
}

`

---

### Workflow 10: Interactive Posting Bot (Content Publisher via Telegram Chat)

> **Bot:** `@BizNepalPostBot` (Bot 2 — POSTING_BOT_TOKEN)
> **Purpose:** Allow verified business owners to post Jobs, Events, Products, and Offers directly through a step-by-step Telegram conversation, including optional image upload to Supabase Storage.
>
> **Architecture Notes:**
> - Conversation state is stored in the `telegram_bot_states` Supabase table (not n8n static memory), making it durable across n8n restarts.
> - The `Dispatcher Code` node is the single source of truth for all routing logic.
> - Image uploads are handled by POSTing a base64-encoded image to `/api/bot/upload-telegram-image`.
> - Content is finalized via POST to `/api/bot/post-content`.
>
> **Required credentials in n8n:**
> - `Telegram API` → Add the `POSTING_BOT_TOKEN` as a separate credential named `BizNepal Posting Bot`
> - `Header Auth` → Same `WEBHOOK_SECRET` header auth used in other workflows

```json
{
  "name": "BizNepal: Interactive Posting Bot",
  "nodes": [
    {
      "parameters": {
        "updates": ["message", "callback_query"],
        "additionalFields": {}
      },
      "name": "Telegram Trigger (Posting Bot)",
      "type": "n8n-nodes-base.telegramTrigger",
      "typeVersion": 1,
      "position": [0, 300],
      "id": "tg-trigger",
      "credentials": { "telegramApi": { "id": "BizNepal Posting Bot", "name": "Telegram API" } }
    },
    {
      "parameters": {
        "jsCode": "// ═══════════════════════════════════════════════\n// BIZNEPAL POSTING BOT — DISPATCHER v1.0\n// ═══════════════════════════════════════════════\n// All step logic lives here. Reads/writes to Supabase\n// telegram_bot_states for durable session management.\n\n// ── 1. Extract incoming message data ──────────\nlet userId, text, messageType, fileId, mimeType;\nif ($json.callback_query) {\n  userId = String($json.callback_query.from.id);\n  text = $json.callback_query.data || '';\n  messageType = 'button';\n  fileId = null;\n} else if ($json.message) {\n  userId = String($json.message.from.id);\n  text = $json.message.text || '';\n  messageType = 'text';\n  // Check for photo\n  if ($json.message.photo && $json.message.photo.length > 0) {\n    const photos = $json.message.photo;\n    fileId = photos[photos.length - 1].file_id; // Get largest photo\n    mimeType = 'image/jpeg';\n    messageType = 'photo';\n  } else if ($json.message.document && $json.message.document.mime_type?.startsWith('image/')) {\n    fileId = $json.message.document.file_id;\n    mimeType = $json.message.document.mime_type;\n    messageType = 'photo';\n  }\n} else {\n  return { json: { action: 'noop' } };\n}\n\nif (!userId) return { json: { action: 'noop' } };\n\n// ── 2. Check for global commands ────────────────\nconst isRestart = text === '/start' || text === '/restart' || text === '/cancel';\n\n// ── Helper: Build inline keyboard ───────────────\nfunction kbd(rows) {\n  return JSON.stringify({ inline_keyboard: rows });\n}\n\n// Pass to next node for state fetch + step processing\nreturn { json: {\n  action: 'fetch_state',\n  userId,\n  text,\n  messageType,\n  fileId: fileId || null,\n  mimeType: mimeType || null,\n  isRestart,\n}};"
      },
      "name": "Dispatcher — Extract Input",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [250, 300],
      "id": "dispatcher-extract"
    },
    {
      "parameters": {
        "method": "GET",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/telegram_bot_states?telegram_user_id=eq.{{ $json.userId }}&select=state,context",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "apikey", "value": "={{ $env.SUPABASE_SERVICE_ROLE_KEY }}" },
            { "name": "Authorization", "value": "=Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}" },
            { "name": "Accept", "value": "application/json" }
          ]
        },
        "options": {}
      },
      "name": "Fetch State from Supabase",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [500, 300],
      "id": "fetch-state"
    },
    {
      "parameters": {
        "jsCode": "// ═══════════════════════════════════════════════\n// STEP MACHINE — Processes current state and returns next action\n// ═══════════════════════════════════════════════\nconst prev = $node['Dispatcher — Extract Input'].json;\nconst userId = prev.userId;\nconst text = prev.text;\nconst msgType = prev.messageType;\nconst fileId = prev.fileId;\nconst mimeType = prev.mimeType;\nconst isRestart = prev.isRestart;\n\n// Get state from Supabase response\nconst stateRows = $input.all()[0]?.json;\nconst stateRow = Array.isArray(stateRows) ? stateRows[0] : null;\nlet state = isRestart ? 'IDLE' : (stateRow?.state || 'IDLE');\nlet ctx = isRestart ? {} : (stateRow?.context || {});\n\nfunction kbd(rows) {\n  return JSON.stringify({ inline_keyboard: rows });\n}\n\nfunction send(msg, buttons) {\n  return {\n    action: 'send_message',\n    userId,\n    msg,\n    buttons: buttons || null,\n    newState: null,\n    newContext: null,\n  };\n}\n\nfunction sendAndTransition(msg, newState, newContext, buttons) {\n  return {\n    action: 'send_and_save',\n    userId,\n    msg,\n    buttons: buttons || null,\n    newState,\n    newContext: newContext || ctx,\n  };\n}\n\n// ── IDLE / START ──────────────────────────────\nif (state === 'IDLE') {\n  return { json: sendAndTransition(\n    '👋 *Welcome to BizNepal Post Bot!*\\n\\nWhat would you like to post today?',\n    'CHOOSING_TYPE',\n    {},\n    kbd([\n      [{ text: '📋 Post a Job', callback_data: 'type_job' }],\n      [{ text: '🎉 Post an Event', callback_data: 'type_event' }],\n      [{ text: '📦 Post a Product', callback_data: 'type_product' }],\n      [{ text: '🔥 Post an Offer', callback_data: 'type_offer' }]\n    ])\n  ) };\n}\n\n// ── CHOOSING TYPE ─────────────────────────────\nif (state === 'CHOOSING_TYPE') {\n  const typeMap = { type_job: 'job', type_event: 'event', type_product: 'product', type_offer: 'offer' };\n  const chosen = typeMap[text];\n  if (!chosen) return { json: send('Please tap one of the buttons above 👆') };\n  ctx = { type: chosen };\n  return { json: sendAndTransition(`Great! Let\\'s post a *${chosen}*.\\n\\n✏️ Enter the *Title*:`, `ASK_${chosen.toUpperCase()}_TITLE`, ctx) };\n}\n\n// ── JOB FLOW ─────────────────────────────────\nif (state === 'ASK_JOB_TITLE') {\n  if (text.length < 3) return { json: send('❌ Title too short. Please enter at least 3 characters.') };\n  ctx.title = text;\n  return { json: sendAndTransition('📂 Enter the *Job Category* (e.g., IT, Healthcare, Finance):', 'ASK_JOB_CATEGORY', ctx) };\n}\nif (state === 'ASK_JOB_CATEGORY') {\n  ctx.category = text;\n  return { json: sendAndTransition('📝 Enter a *Job Description*:', 'ASK_JOB_DESCRIPTION', ctx) };\n}\nif (state === 'ASK_JOB_DESCRIPTION') {\n  if (text.length < 10) return { json: send('❌ Description is too short. Please add more detail.') };\n  ctx.description = text;\n  return { json: sendAndTransition('💰 Enter the *Salary* (e.g., 50000 or \\'Negotiable\\'):', 'ASK_JOB_SALARY', ctx) };\n}\nif (state === 'ASK_JOB_SALARY') {\n  ctx.salary = text;\n  return { json: sendAndTransition('📅 Enter the *Application Deadline* (YYYY-MM-DD) or type \\'Open\\':', 'ASK_JOB_DEADLINE', ctx) };\n}\nif (state === 'ASK_JOB_DEADLINE') {\n  ctx.deadline = text === 'Open' ? null : text;\n  return { json: sendAndTransition('📍 Enter the *Location* (e.g., Kathmandu, Remote):', 'ASK_JOB_LOCATION', ctx) };\n}\nif (state === 'ASK_JOB_LOCATION') {\n  ctx.location = text;\n  return { json: sendAndTransition('🖼️ Send an *image* for this job listing (or type \\'skip\\' to skip):', 'ASK_JOB_IMAGE', ctx) };\n}\nif (state === 'ASK_JOB_IMAGE') {\n  if (msgType === 'photo') {\n    ctx.pendingFileId = fileId;\n    ctx.pendingMime = mimeType;\n  }\n  const preview = `📋 *Review Job Details:*\\n\\n*Title:* ${ctx.title}\\n*Category:* ${ctx.category}\\n*Salary:* ${ctx.salary}\\n*Deadline:* ${ctx.deadline || 'Open'}\\n*Location:* ${ctx.location}\\n*Image:* ${ctx.pendingFileId ? 'Attached ✅' : 'None'}\\n\\nLooks good?`;\n  return { json: sendAndTransition(preview, 'CONFIRM_JOB', ctx, kbd([[{ text: '✅ Post Now', callback_data: 'confirm_post' }, { text: '🔄 Start Over', callback_data: '/start' }]])) };\n}\nif (state === 'CONFIRM_JOB') {\n  if (text !== 'confirm_post') return { json: send('Please tap a button 👆') };\n  return { json: { action: 'submit_content', userId, contentType: 'job', ctx } };\n}\n\n// ── EVENT FLOW ────────────────────────────────\nif (state === 'ASK_EVENT_TITLE') {\n  if (text.length < 3) return { json: send('❌ Title too short.') };\n  ctx.title = text;\n  return { json: sendAndTransition('📂 Enter the *Event Category* (e.g., Concert, Sports, Workshop):', 'ASK_EVENT_CATEGORY', ctx) };\n}\nif (state === 'ASK_EVENT_CATEGORY') {\n  ctx.category = text;\n  return { json: sendAndTransition('📝 Enter the *Event Description*:', 'ASK_EVENT_DESCRIPTION', ctx) };\n}\nif (state === 'ASK_EVENT_DESCRIPTION') {\n  ctx.description = text;\n  return { json: sendAndTransition('📅 Enter the *Event Date & Time* (YYYY-MM-DD HH:MM):', 'ASK_EVENT_DATE', ctx) };\n}\nif (state === 'ASK_EVENT_DATE') {\n  ctx.event_date = text;\n  return { json: sendAndTransition('📍 Enter the *Venue Name*:', 'ASK_EVENT_VENUE', ctx) };\n}\nif (state === 'ASK_EVENT_VENUE') {\n  ctx.venue = text;\n  return { json: sendAndTransition('🎟️ Enter *Ticket Price* (0 for free):', 'ASK_EVENT_PRICE', ctx) };\n}\nif (state === 'ASK_EVENT_PRICE') {\n  ctx.ticket_price = text;\n  return { json: sendAndTransition('💺 Enter *Total Seats Available*:', 'ASK_EVENT_SEATS', ctx) };\n}\nif (state === 'ASK_EVENT_SEATS') {\n  ctx.total_seats = text;\n  return { json: sendAndTransition('🖼️ Send an *image* (or type \\'skip\\'):', 'ASK_EVENT_IMAGE', ctx) };\n}\nif (state === 'ASK_EVENT_IMAGE') {\n  if (msgType === 'photo') { ctx.pendingFileId = fileId; ctx.pendingMime = mimeType; }\n  const preview = `📋 *Review Event Details:*\\n\\n*Title:* ${ctx.title}\\n*Date:* ${ctx.event_date}\\n*Venue:* ${ctx.venue}\\n*Ticket:* ₨${ctx.ticket_price}\\n*Seats:* ${ctx.total_seats}\\n*Image:* ${ctx.pendingFileId ? 'Attached ✅' : 'None'}`;\n  return { json: sendAndTransition(preview, 'CONFIRM_EVENT', ctx, kbd([[{ text: '✅ Post Now', callback_data: 'confirm_post' }, { text: '🔄 Start Over', callback_data: '/start' }]])) };\n}\nif (state === 'CONFIRM_EVENT') {\n  if (text !== 'confirm_post') return { json: send('Please tap a button 👆') };\n  return { json: { action: 'submit_content', userId, contentType: 'event', ctx } };\n}\n\n// ── PRODUCT FLOW ──────────────────────────────\nif (state === 'ASK_PRODUCT_TITLE') {\n  if (text.length < 2) return { json: send('❌ Name too short.') };\n  ctx.title = text;\n  return { json: sendAndTransition('📝 Enter a *Product Description*:', 'ASK_PRODUCT_DESCRIPTION', ctx) };\n}\nif (state === 'ASK_PRODUCT_DESCRIPTION') {\n  ctx.description = text;\n  return { json: sendAndTransition('💰 Enter the *Price* (e.g., 1500):', 'ASK_PRODUCT_PRICE', ctx) };\n}\nif (state === 'ASK_PRODUCT_PRICE') {\n  ctx.price = text;\n  return { json: sendAndTransition('📦 Enter the *Stock Quantity*:', 'ASK_PRODUCT_STOCK', ctx) };\n}\nif (state === 'ASK_PRODUCT_STOCK') {\n  ctx.stock = text;\n  return { json: sendAndTransition('🖼️ Send an *image* (or type \\'skip\\'):', 'ASK_PRODUCT_IMAGE', ctx) };\n}\nif (state === 'ASK_PRODUCT_IMAGE') {\n  if (msgType === 'photo') { ctx.pendingFileId = fileId; ctx.pendingMime = mimeType; }\n  const preview = `📋 *Review Product:*\\n\\n*Name:* ${ctx.title}\\n*Price:* ₨${ctx.price}\\n*Stock:* ${ctx.stock}\\n*Image:* ${ctx.pendingFileId ? 'Attached ✅' : 'None'}`;\n  return { json: sendAndTransition(preview, 'CONFIRM_PRODUCT', ctx, kbd([[{ text: '✅ Post Now', callback_data: 'confirm_post' }, { text: '🔄 Start Over', callback_data: '/start' }]])) };\n}\nif (state === 'CONFIRM_PRODUCT') {\n  if (text !== 'confirm_post') return { json: send('Please tap a button 👆') };\n  return { json: { action: 'submit_content', userId, contentType: 'product', ctx } };\n}\n\n// ── OFFER FLOW ────────────────────────────────\nif (state === 'ASK_OFFER_TITLE') {\n  if (text.length < 3) return { json: send('❌ Title too short.') };\n  ctx.title = text;\n  return { json: sendAndTransition('📝 Describe this *Offer*:', 'ASK_OFFER_DESCRIPTION', ctx) };\n}\nif (state === 'ASK_OFFER_DESCRIPTION') {\n  ctx.description = text;\n  return { json: sendAndTransition('🏷️ What is the *Original Price* (₨)?', 'ASK_OFFER_ORIGINAL_PRICE', ctx) };\n}\nif (state === 'ASK_OFFER_ORIGINAL_PRICE') {\n  ctx.original_price = text;\n  return { json: sendAndTransition('🔖 What is the *Discount %* (e.g., 20)?', 'ASK_OFFER_DISCOUNT', ctx) };\n}\nif (state === 'ASK_OFFER_DISCOUNT') {\n  ctx.discount_percentage = text;\n  return { json: sendAndTransition('📅 When does this offer *expire*? (YYYY-MM-DD):', 'ASK_OFFER_EXPIRY', ctx) };\n}\nif (state === 'ASK_OFFER_EXPIRY') {\n  ctx.expires_at = text;\n  return { json: sendAndTransition('🖼️ Send an *image* (or type \\'skip\\'):', 'ASK_OFFER_IMAGE', ctx) };\n}\nif (state === 'ASK_OFFER_IMAGE') {\n  if (msgType === 'photo') { ctx.pendingFileId = fileId; ctx.pendingMime = mimeType; }\n  const discountedPrice = (parseFloat(ctx.original_price) * (1 - parseFloat(ctx.discount_percentage) / 100)).toFixed(0);\n  const preview = `📋 *Review Offer:*\\n\\n*Title:* ${ctx.title}\\n*Original Price:* ₨${ctx.original_price}\\n*Discount:* ${ctx.discount_percentage}% → ₨${discountedPrice}\\n*Expires:* ${ctx.expires_at}\\n*Image:* ${ctx.pendingFileId ? 'Attached ✅' : 'None'}`;\n  return { json: sendAndTransition(preview, 'CONFIRM_OFFER', ctx, kbd([[{ text: '✅ Post Now', callback_data: 'confirm_post' }, { text: '🔄 Start Over', callback_data: '/start' }]])) };\n}\nif (state === 'CONFIRM_OFFER') {\n  if (text !== 'confirm_post') return { json: send('Please tap a button 👆') };\n  return { json: { action: 'submit_content', userId, contentType: 'offer', ctx } };\n}\n\n// ── FALLBACK ──────────────────────────────────\nreturn { json: send('Type /start to begin posting content to your BizNepal business 🚀') };"
      },
      "name": "Step Machine — Process State",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [750, 300],
      "id": "step-machine"
    },
    {
      "parameters": {
        "dataType": "string",
        "value1": "={{ $json.action }}",
        "rules": {
          "rules": [
            { "value2": "send_message", "output": 0 },
            { "value2": "send_and_save", "output": 1 },
            { "value2": "submit_content", "output": 2 },
            { "value2": "noop", "output": 3 }
          ]
        },
        "fallbackOutput": 3
      },
      "name": "Action Router",
      "type": "n8n-nodes-base.switch",
      "typeVersion": 1,
      "position": [1000, 300],
      "id": "action-router"
    },
    {
      "parameters": {
        "chatId": "={{ $json.userId }}",
        "text": "={{ $json.msg }}",
        "replyMarkup": "={{ $json.buttons ? 'inlineKeyboard' : 'none' }}",
        "inlineKeyboard": "={{ $json.buttons ? JSON.parse($json.buttons) : {} }}",
        "additionalFields": { "parse_mode": "Markdown" }
      },
      "name": "Send Telegram Message",
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1,
      "position": [1250, 100],
      "id": "tg-send-only",
      "credentials": { "telegramApi": { "id": "BizNepal Posting Bot", "name": "Telegram API" } }
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/telegram_bot_states",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "apikey", "value": "={{ $env.SUPABASE_SERVICE_ROLE_KEY }}" },
            { "name": "Authorization", "value": "=Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}" },
            { "name": "Content-Type", "value": "application/json" },
            { "name": "Prefer", "value": "resolution=merge-duplicates" }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\"telegram_user_id\": \"{{ $json.userId }}\", \"state\": \"{{ $json.newState }}\", \"context\": {{ JSON.stringify($json.newContext) }}, \"updated_at\": \"{{ new Date().toISOString() }}\"}",
        "options": {}
      },
      "name": "Save State to Supabase",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [1250, 300],
      "id": "save-state"
    },
    {
      "parameters": {
        "chatId": "={{ $node['Step Machine — Process State'].json.userId }}",
        "text": "={{ $node['Step Machine — Process State'].json.msg }}",
        "replyMarkup": "={{ $node['Step Machine — Process State'].json.buttons ? 'inlineKeyboard' : 'none' }}",
        "inlineKeyboard": "={{ $node['Step Machine — Process State'].json.buttons ? JSON.parse($node['Step Machine — Process State'].json.buttons) : {} }}",
        "additionalFields": { "parse_mode": "Markdown" }
      },
      "name": "Send Message After Save",
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1,
      "position": [1500, 300],
      "id": "tg-send-after-save",
      "credentials": { "telegramApi": { "id": "BizNepal Posting Bot", "name": "Telegram API" } }
    },
    {
      "parameters": {
        "jsCode": "// Prepare image upload if user sent a photo\nconst ctx = $json.ctx;\nconst userId = $json.userId;\nconst contentType = $json.contentType;\n\nif (ctx.pendingFileId) {\n  // Pass to image download node\n  return { json: { action: 'has_image', userId, contentType, ctx, fileId: ctx.pendingFileId, mimeType: ctx.pendingMime || 'image/jpeg' } };\n} else {\n  return { json: { action: 'no_image', userId, contentType, ctx, imageUrl: null } };\n}"
      },
      "name": "Check For Image",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [1250, 500],
      "id": "check-image"
    },
    {
      "parameters": {
        "dataType": "string",
        "value1": "={{ $json.action }}",
        "rules": {
          "rules": [
            { "value2": "has_image", "output": 0 },
            { "value2": "no_image", "output": 1 }
          ]
        },
        "fallbackOutput": 1
      },
      "name": "Has Image?",
      "type": "n8n-nodes-base.switch",
      "typeVersion": 1,
      "position": [1500, 500],
      "id": "has-image-switch"
    },
    {
      "parameters": {
        "url": "=https://api.telegram.org/bot{{ $env.POSTING_BOT_TOKEN }}/getFile?file_id={{ $json.fileId }}",
        "options": {}
      },
      "name": "Get Telegram File Path",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [1750, 400],
      "id": "get-file-path"
    },
    {
      "parameters": {
        "url": "=https://api.telegram.org/file/bot{{ $env.POSTING_BOT_TOKEN }}/{{ $json.result.file_path }}",
        "options": {
          "response": { "response": { "responseFormat": "file" } }
        }
      },
      "name": "Download Telegram File",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [2000, 400],
      "id": "download-file"
    },
    {
      "parameters": {
        "jsCode": "// Convert binary to base64 and prepare for upload API\nconst binaryData = $binary.data;\nconst base64 = binaryData ? binaryData.toString('base64') : null;\nconst parentData = $node['Check For Image'].json;\n\nreturn { json: {\n  file_base64: base64,\n  mime_type: parentData.mimeType || 'image/jpeg',\n  content_type: parentData.contentType,\n  telegram_user_id: parentData.userId,\n  // Pass through original data\n  userId: parentData.userId,\n  contentType: parentData.contentType,\n  ctx: parentData.ctx,\n} };"
      },
      "name": "Prepare Base64 Upload",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [2250, 400],
      "id": "prepare-base64"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.NEXT_PUBLIC_APP_URL }}/api/bot/upload-telegram-image",
        "authentication": "headerAuth",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ JSON.stringify({ file_base64: $json.file_base64, mime_type: $json.mime_type, content_type: $json.content_type, telegram_user_id: $json.telegram_user_id }) }}",
        "options": {}
      },
      "name": "Upload Image to Supabase",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [2500, 400],
      "id": "upload-image",
      "credentials": { "httpHeaderAuth": { "id": "WEBHOOK_SECRET", "name": "Header Auth" } }
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $env.NEXT_PUBLIC_APP_URL }}/api/bot/post-content",
        "authentication": "headerAuth",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\"telegram_user_id\": \"{{ $json.userId || $node['Check For Image'].json.userId }}\", \"content_type\": \"{{ $json.contentType || $node['Check For Image'].json.contentType }}\", \"data\": {{ JSON.stringify($json.ctx || $node['Check For Image'].json.ctx) }}, \"image_url\": {{ JSON.stringify($json.url || null) }}}",
        "options": {}
      },
      "name": "Submit Content to BizNepal",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [2750, 450],
      "id": "submit-content",
      "credentials": { "httpHeaderAuth": { "id": "WEBHOOK_SECRET", "name": "Header Auth" } }
    },
    {
      "parameters": {
        "jsCode": "// Send final success/failure message\nconst result = $json;\nconst userId = $node['Check For Image'].json.userId || $node['Step Machine — Process State'].json.userId;\nconst contentType = result.content_type || 'content';\nconst id = result.id;\nconst appUrl = $env.NEXT_PUBLIC_APP_URL || 'https://biz-nepal.vercel.app';\n\nconst typeToPath = { job: 'jobs', event: 'events', product: 'products', offer: 'offers' };\nconst path = typeToPath[contentType] || contentType + 's';\n\nif (result.success) {\n  return { json: {\n    action: 'send_success',\n    userId,\n    msg: `✅ *${contentType.charAt(0).toUpperCase() + contentType.slice(1)} Posted Successfully!*\\n\\nYour listing is now live on BizNepal.\\n\\n👉 [View in Dashboard](${appUrl}/dashboard/${path})`,\n    clearState: true,\n  } };\n} else {\n  return { json: {\n    action: 'send_error',\n    userId,\n    msg: `❌ *Failed to post:* ${result.error || 'Unknown error'}\\n\\nPlease try again or contact support.`,\n    clearState: false,\n  } };\n}"
      },
      "name": "Build Confirmation Message",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [3000, 450],
      "id": "build-confirm"
    },
    {
      "parameters": {
        "chatId": "={{ $json.userId }}",
        "text": "={{ $json.msg }}",
        "additionalFields": { "parse_mode": "Markdown" }
      },
      "name": "Send Final Confirmation",
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1,
      "position": [3250, 350],
      "id": "tg-confirm",
      "credentials": { "telegramApi": { "id": "BizNepal Posting Bot", "name": "Telegram API" } }
    },
    {
      "parameters": {
        "method": "DELETE",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/telegram_bot_states?telegram_user_id=eq.{{ $json.userId }}",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "apikey", "value": "={{ $env.SUPABASE_SERVICE_ROLE_KEY }}" },
            { "name": "Authorization", "value": "=Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}" }
          ]
        },
        "options": {}
      },
      "name": "Clear Session State",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [3250, 550],
      "id": "clear-state"
    }
  ],
  "connections": {
    "Telegram Trigger (Posting Bot)": { "main": [[{ "node": "Dispatcher — Extract Input", "type": "main", "index": 0 }]] },
    "Dispatcher — Extract Input": { "main": [[{ "node": "Fetch State from Supabase", "type": "main", "index": 0 }]] },
    "Fetch State from Supabase": { "main": [[{ "node": "Step Machine — Process State", "type": "main", "index": 0 }]] },
    "Step Machine — Process State": { "main": [[{ "node": "Action Router", "type": "main", "index": 0 }]] },
    "Action Router": {
      "main": [
        [{ "node": "Send Telegram Message", "type": "main", "index": 0 }],
        [{ "node": "Save State to Supabase", "type": "main", "index": 0 }],
        [{ "node": "Check For Image", "type": "main", "index": 0 }]
      ]
    },
    "Save State to Supabase": { "main": [[{ "node": "Send Message After Save", "type": "main", "index": 0 }]] },
    "Check For Image": { "main": [[{ "node": "Has Image?", "type": "main", "index": 0 }]] },
    "Has Image?": {
      "main": [
        [{ "node": "Get Telegram File Path", "type": "main", "index": 0 }],
        [{ "node": "Submit Content to BizNepal", "type": "main", "index": 0 }]
      ]
    },
    "Get Telegram File Path": { "main": [[{ "node": "Download Telegram File", "type": "main", "index": 0 }]] },
    "Download Telegram File": { "main": [[{ "node": "Prepare Base64 Upload", "type": "main", "index": 0 }]] },
    "Prepare Base64 Upload": { "main": [[{ "node": "Upload Image to Supabase", "type": "main", "index": 0 }]] },
    "Upload Image to Supabase": { "main": [[{ "node": "Submit Content to BizNepal", "type": "main", "index": 0 }]] },
    "Submit Content to BizNepal": { "main": [[{ "node": "Build Confirmation Message", "type": "main", "index": 0 }]] },
    "Build Confirmation Message": {
      "main": [[
        { "node": "Send Final Confirmation", "type": "main", "index": 0 },
        { "node": "Clear Session State", "type": "main", "index": 0 }
      ]]
    }
  }
}
```
