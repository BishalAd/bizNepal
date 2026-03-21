# BizNepal n8n Workflow Instructions

Here are the complete JSON configurations for the 7 requested n8n workflows.

**How to use:**
1. Open your n8n instance.
2. Create a new workflow.
3. Click on the ⚙️ gear icon (or "More" options) on the canvas and select **Import from File / Paste JSON**.
4. Paste the JSON block for the corresponding workflow directly into the editor.
5. Update your credentials (e.g., WhatsApp API, Email SMTP, Google Sheets OAuth) inside each node after importing.

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
        "url": "https://api.twilio.com/2010-04-01/Accounts/AC_XXXXXXXXXXXXXXXX/Messages.json",
        "authentication": "basicAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "Content-Type", "value": "application/x-www-form-urlencoded" }
          ]
        },
        "sendBody": true,
        "specifyBody": "keypair",
        "bodyParameters": {
          "parameters": [
            { "name": "To", "value": "whatsapp:+{{$json.body.businessWhatsapp}}" },
            { "name": "From", "value": "whatsapp:+14155238886" },
            { "name": "Body", "value": "🛍️ New COD Order!\nProduct: {{$json.body.items[0].title}}\nAmount: ₨ {{$json.body.total}}\nCustomer: {{$json.body.customerName}} {{$json.body.customerPhone}}\nDeliver to: {{$json.body.customerAddress.address}}" }
          ]
        },
        "options": {}
      },
      "id": "3a-whatsapp-cod",
      "name": "WhatsApp (COD)",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [700, 200]
    },
    {
      "parameters": {
        "url": "https://api.twilio.com/2010-04-01/Accounts/AC_XXXXXXXXXXXXXXXX/Messages.json",
        "authentication": "basicAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "Content-Type", "value": "application/x-www-form-urlencoded" }
          ]
        },
        "sendBody": true,
        "specifyBody": "keypair",
        "bodyParameters": {
          "parameters": [
            { "name": "To", "value": "whatsapp:+{{$json.body.businessWhatsapp}}" },
            { "name": "From", "value": "whatsapp:+14155238886" },
            { "name": "Body", "value": "✅ New Paid Order!\nProduct: {{$json.body.items[0].title}}\nAmount: ₨ {{$json.body.total}} (paid via {{$json.body.paymentMethod}})\nCustomer: {{$json.body.customerName}} {{$json.body.customerPhone}}" }
          ]
        },
        "options": {}
      },
      "id": "3b-whatsapp-paid",
      "name": "WhatsApp (Paid)",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [700, 400]
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
            "node": "WhatsApp (COD)",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "WhatsApp (Paid)",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "WhatsApp (COD)": {
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
    "WhatsApp (Paid)": {
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
      "position": [180, 240]
    },
    {
      "parameters": {
        "url": "http://localhost:3000/api/mock/get-subscribed-businesses",
        "options": {}
      },
      "id": "2-get-businesses",
      "name": "Fetch Businesses",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [400, 240]
    },
    {
      "parameters": {},
      "id": "3-loop",
      "name": "Loop Over Businesses",
      "type": "n8n-nodes-base.loop",
      "typeVersion": 1,
      "position": [620, 240]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "http://localhost:3000/api/activity-summary",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"businessId\": \"{{$json.id}}\",\n  \"period\": \"2h\"\n}",
        "options": {}
      },
      "id": "4-get-summary",
      "name": "Fetch Summary Data",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [840, 240]
    },
    {
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{$json.orders > 0 || $json.applications > 0}}",
              "value2": true
            }
          ]
        }
      },
      "id": "5-if-activity",
      "name": "Has Activity?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [1060, 240]
    },
    {
      "parameters": {
        "url": "https://api.twilio.com/2010-04-01/Accounts/AC_XXXXXXXXXXXXXXXX/Messages.json",
        "authentication": "basicAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            { "name": "Content-Type", "value": "application/x-www-form-urlencoded" }
          ]
        },
        "sendBody": true,
        "specifyBody": "keypair",
        "bodyParameters": {
          "parameters": [
            { "name": "To", "value": "whatsapp:+{{$node[\"Loop Over Businesses\"].json.whatsapp_number}}" },
            { "name": "From", "value": "whatsapp:+14155238886" },
            { "name": "Body", "value": "📊 BizNepal Summary (Last 2 hours)\n💰 Orders: {{$json.orders}} (₨ {{$json.revenue}})\n👔 New Applications: {{$json.applications}}\n🎟️ Event Bookings: {{$json.bookings}}\n⭐ New Reviews: {{$json.reviews}}" }
          ]
        },
        "options": {}
      },
      "id": "6a-whatsapp-summary",
      "name": "WhatsApp Summary",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [1300, 160]
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
            "node": "Loop Over Businesses",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Loop Over Businesses": {
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
            "node": "WhatsApp Summary",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Loop Over Businesses",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "WhatsApp Summary": {
      "main": [
        [
          {
            "node": "Loop Over Businesses",
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
        "url": "https://api.twilio.com/2010-04-01/Accounts/-/Messages.json",
        "sendBody": true,
        "specifyBody": "keypair",
        "bodyParameters": {
          "parameters": [
            { "name": "To", "value": "whatsapp:+{{$json.body.businessWhatsapp}}" },
            { "name": "From", "value": "whatsapp:+14155238886" },
            { "name": "Body", "value": "👔 New Job Application!\nPosition: {{$json.body.jobTitle}}\nApplicant: {{$json.body.applicantName}}\nPhone: {{$json.body.applicantPhone}}\nCV: {{$json.body.cvUrl}}" }
          ]
        },
        "options": {}
      },
      "id": "2-whatsapp-biz",
      "name": "WA: Notify Business",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [440, 200]
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
        "url": "https://api.twilio.com/2010-04-01/Accounts/-/Messages.json",
        "sendBody": true,
        "specifyBody": "keypair",
        "bodyParameters": {
          "parameters": [
            { "name": "To", "value": "whatsapp:+{{$json.body.applicantPhone}}" },
            { "name": "From", "value": "whatsapp:+14155238886" },
            { "name": "Body", "value": "✅ Application Received!\nYou applied for: {{$json.body.jobTitle}} at {{$json.body.businessName}}. We'll review your application within 5-7 business days." }
          ]
        },
        "options": {}
      },
      "id": "4-whatsapp-applicant",
      "name": "WA: Notify Applicant",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [880, 200]
    }
  ],
  "connections": {
    "Webhook Trigger": {
      "main": [
        [
          {
            "node": "WA: Notify Business",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "WA: Notify Business": {
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
            "node": "WA: Notify Applicant",
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
        "url": "https://api.twilio.com/2010-04-01/Accounts/-/Messages.json",
        "sendBody": true,
        "specifyBody": "keypair",
        "bodyParameters": {
          "parameters": [
            { "name": "To", "value": "whatsapp:+{{$node[\"Webhook Trigger\"].json.body.attendeePhone}}" },
            { "name": "From", "value": "whatsapp:+14155238886" },
            { "name": "Body", "value": "🎟️ Booking Confirmed!\nEvent: {{$node[\"Webhook Trigger\"].json.body.eventTitle}}\nSeats: {{$node[\"Webhook Trigger\"].json.body.seats}}\nTicket Code: {{$node[\"Webhook Trigger\"].json.body.ticketCode}}\nShow this code at entry." }
          ]
        },
        "options": {}
      },
      "id": "3-whatsapp-attendee",
      "name": "WA: Notify Attendee",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [640, 260]
    },
    {
      "parameters": {
        "url": "https://api.twilio.com/2010-04-01/Accounts/-/Messages.json",
        "sendBody": true,
        "specifyBody": "keypair",
        "bodyParameters": {
          "parameters": [
            { "name": "To", "value": "whatsapp:+{{$node[\"Webhook Trigger\"].json.body.organizerWhatsapp}}" },
            { "name": "From", "value": "whatsapp:+14155238886" },
            { "name": "Body", "value": "✅ New Booking for {{$node[\"Webhook Trigger\"].json.body.eventTitle}}\nAttendee: {{$node[\"Webhook Trigger\"].json.body.attendeeName}} ({{$node[\"Webhook Trigger\"].json.body.seats}} seats)" }
          ]
        },
        "options": {}
      },
      "id": "4-whatsapp-organizer",
      "name": "WA: Notify Organizer",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [860, 260]
    }
  ],
  "connections": {
    "Webhook Trigger": {
      "main": [ [ { "node": "Generate QR Link", "type": "main", "index": 0 } ] ]
    },
    "Generate QR Link": {
      "main": [ [ { "node": "WA: Notify Attendee", "type": "main", "index": 0 } ] ]
    },
    "WA: Notify Attendee": {
      "main": [ [ { "node": "WA: Notify Organizer", "type": "main", "index": 0 } ] ]
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
        "url": "http://localhost:3000/api/mock/supabase/offers-expiring",
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
        "url": "https://api.twilio.com/2010-04-01/Accounts/-/Messages.json",
        "sendBody": true,
        "specifyBody": "keypair",
        "bodyParameters": {
          "parameters": [
            { "name": "To", "value": "whatsapp:+{{$json.businessWhatsapp}}" },
            { "name": "From", "value": "whatsapp:+14155238886" },
            { "name": "Body", "value": "⏰ Offer Expiring Soon!\nYour offer '{{$json.offerTitle}}' expires in exactly 2 hours.\n{{$json.grabbed}} customers have grabbed it.\nExtend it from your dashboard!" }
          ]
        },
        "options": {}
      },
      "id": "4-whatsapp-biz",
      "name": "WA: Notify Owner",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [860, 300]
    }
  ],
  "connections": {
    "Every 30 mins": { "main": [ [ { "node": "Fetch Expiring Offers", "type": "main", "index": 0 } ] ] },
    "Fetch Expiring Offers": { "main": [ [ { "node": "Loop Over Offers", "type": "main", "index": 0 } ] ] },
    "Loop Over Offers": { "main": [ [ { "node": "WA: Notify Owner", "type": "main", "index": 0 } ] ] },
    "WA: Notify Owner": { "main": [ [ { "node": "Loop Over Offers", "type": "main", "index": 0 } ] ] }
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
        "url": "https://api.twilio.com/2010-04-01/Accounts/-/Messages.json",
        "sendBody": true,
        "specifyBody": "keypair",
        "bodyParameters": {
          "parameters": [
            { "name": "To", "value": "whatsapp:+{{$node[\"Webhook Trigger\"].json.body.businessWhatsapp}}" },
            { "name": "From", "value": "whatsapp:+14155238886" },
            { "name": "Body", "value": "⚠️ New Low-Rating Review!\n{{$node[\"Webhook Trigger\"].json.body.reviewerName}} gave you {{$node[\"Webhook Trigger\"].json.body.rating}}⭐\n'{{$node[\"Webhook Trigger\"].json.body.content}}'\nRespond promptly to handle customer resolution." }
          ]
        },
        "options": {}
      },
      "id": "3a-whatsapp-bad",
      "name": "WA: Urgent Alert",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [640, 200]
    },
    {
      "parameters": {
        "url": "https://api.twilio.com/2010-04-01/Accounts/-/Messages.json",
        "sendBody": true,
        "specifyBody": "keypair",
        "bodyParameters": {
          "parameters": [
            { "name": "To", "value": "whatsapp:+{{$node[\"Webhook Trigger\"].json.body.businessWhatsapp}}" },
            { "name": "From", "value": "whatsapp:+14155238886" },
            { "name": "Body", "value": "🌟 New Positive Review!\n{{$node[\"Webhook Trigger\"].json.body.reviewerName}} gave you {{$node[\"Webhook Trigger\"].json.body.rating}}⭐\n'{{$node[\"Webhook Trigger\"].json.body.content}}'" }
          ]
        },
        "options": {}
      },
      "id": "3b-whatsapp-good",
      "name": "WA: Positive Alert",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [640, 400]
    }
  ],
  "connections": {
    "Webhook Trigger": { "main": [ [ { "node": "Is Critical? (≤2)", "type": "main", "index": 0 } ] ] },
    "Is Critical? (≤2)": {
      "main": [
        [ { "node": "WA: Urgent Alert", "type": "main", "index": 0 } ],
        [ { "node": "WA: Positive Alert", "type": "main", "index": 0 } ]
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
        "url": "https://api.twilio.com/2010-04-01/Accounts/-/Messages.json",
        "sendBody": true,
        "specifyBody": "keypair",
        "bodyParameters": {
          "parameters": [
            { "name": "To", "value": "whatsapp:+{{$node[\"Webhook Trigger\"].json.body.userPhone}}" },
            { "name": "From", "value": "whatsapp:+14155238886" },
            { "name": "Body", "value": "👋 Welcome to BizNepal!\nStart by completing your business profile to attract customers to your dashboard.\nNeed help? WhatsApp us back on this number: +977-9876543210" }
          ]
        },
        "options": {}
      },
      "id": "4-whatsapp-welcome",
      "name": "WA: Send Welcome msg",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [880, 280]
    }
  ],
  "connections": {
    "Webhook Trigger": { "main": [ [ { "node": "Is Business Account?", "type": "main", "index": 0 } ] ] },
    "Is Business Account?": { "main": [ [ { "node": "Wait 10 Minutes", "type": "main", "index": 0 } ] ] },
    "Wait 10 Minutes": { "main": [ [ { "node": "WA: Send Welcome msg", "type": "main", "index": 0 } ] ] }
  }
}
```
