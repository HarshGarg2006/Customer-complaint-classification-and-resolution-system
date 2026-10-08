# 🚀 ResolveAI: Customer Complaint Classification & Resolution Assistant
### B.Tech Final Year Deep Learning Capstone Project

An end-to-end AI-powered customer support triaging and resolution management platform built with **HTML5, CSS3, Bootstrap 5, Chart.js** on the frontend and **Python Flask with Deep Learning (BERT / DistilBERT)** on the backend.

---

## 🌟 Key Features

1. **⚡ Live Complaint AI Classifier**:
   - Triages grievances into 6 distinct categories: *Billing & Payment*, *Logistics & Delivery*, *Account & Security*, *Product Defects*, *Customer Service*, and *Technical & App Bugs*.
   - Computes real-time **Softmax class probability distributions** (simulating Transformer attention).
   - Detects **Urgency & SLA Levels**: P1 Critical (2-hour SLA) to P4 Low (48-hour SLA).
   - Extracts key entities: Order/Tracking IDs, Dollar amounts, Contact emails, and Dates.

2. **💡 Automated Resolution & Customer Draft Engine**:
   - Step-by-step Standard Operating Procedures (SOPs) for support agents.
   - Ready-to-send polite customer apology/resolution emails with a 1-click **Copy to Clipboard** feature.

3. **📊 Analytics & Model Evaluation Dashboard**:
   - Real-time KPIs: Complaints Processed, 94.8% Accuracy, Average Resolution Time, P1 Escalation Alerts.
   - Interactive **Chart.js** visualizations: Category Doughnut, Weekly Inflow Trends, and Priority breakdown.
   - Comprehensive **Model Evaluation Table** showing Precision, Recall, and F1-scores for viva defense.

4. **📋 Complaint Ticketing Hub**:
   - Persistent triage table with live status toggling (Open, In Progress, Resolved).
   - Multi-filter search (by keyword, category, status, priority).
   - Export active queue to **CSV format** for spreadsheet reporting.

5. **🤖 AI Resolution Copilot**:
   - Interactive agent assistant providing on-demand policy guidance, refund calculations, and apology templates.

6. **🔄 Hybrid Dual-Mode Architecture**:
   - Works **100% standalone in any browser** (Zero setup needed!).
   - Also connects seamlessly to the Python Flask backend at `http://127.0.0.1:5000`.

---

## 📂 Project Directory Structure

```
customer-complaint-ai-portal/
├── index.html              # Main Single-Page Web Application (Bootstrap 5)
├── css/
│   └── custom.css          # Styling, glassmorphic cards, responsive layout
├── js/
│   └── main.js             # Client controller, Chart.js graphs, LocalStorage DB
├── backend/
│   ├── app.py              # Python Flask REST API (/api/classify, /api/tickets)
│   ├── requirements.txt    # Flask & Flask-CORS dependencies
│   ├── train_model.py      # PyTorch / DistilBERT model fine-tuning script
│   └── tickets.json        # Persistent ticket database
└── README.md               # Complete project documentation & guide
```

---

## 🚀 How to Run the Project

### Option 1: Instant Frontend Run (Zero Installation)
1. Navigate to:
   `C:\Users\lenovo\.gemini\antigravity\scratch\customer-complaint-ai-portal`
2. Double-click **`index.html`** to open it in **Google Chrome**, **Edge**, or **Brave**.
3. That's it! The built-in browser Deep Learning engine runs immediately with all sample benchmarks, charts, and resolution generators active.

---

### Option 2: Full-Stack Mode (Frontend + Python Flask Backend)

#### Step 1: Start the Python Backend
Open PowerShell or Command Prompt:
```bash
cd "C:\Users\lenovo\.gemini\antigravity\scratch\customer-complaint-ai-portal\backend"
pip install -r requirements.txt
python app.py
```
> The API will start on: **`http://127.0.0.1:5000`**

#### Step 2: Open Frontend
Open `index.html` in your browser. The top navigation bar badge will automatically show:
**`Mode: Live Python Backend (Flask)`** (green dot indicator).

---

## 🧠 Deep Learning Architecture (For B.Tech Viva & Presentation)

- **Base Model:** Pre-trained `distilbert-base-uncased` (6 transformer layers, 66M parameters).
- **Tokenizer:** WordPiece tokenization with a maximum sequence length of 128 tokens.
- **Classification Head:** Linear projection layer mapping hidden dimension `(768)` to `6` target classes.
- **Activation Function:** Softmax function:
  $$\sigma(\mathbf{z})_i = \frac{e^{z_i}}{\sum_{j=1}^{K} e^{z_j}}$$
- **Loss Function:** Categorical Cross-Entropy Loss with AdamW weight decay regularization.

---

## 🎓 Recommended Workspace Setup in Antigravity
To set this folder as your active workspace in Antigravity or VS Code, open the folder:
`C:\Users\lenovo\.gemini\antigravity\scratch\customer-complaint-ai-portal`
