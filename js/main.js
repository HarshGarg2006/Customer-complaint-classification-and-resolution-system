/*
============================================================
 ResolveAI
 Customer Complaint Classification & Resolution Assistant
============================================================

Frontend:
    HTML + Bootstrap + JavaScript

Backend:
    Flask API - http://127.0.0.1:5000

AI:
    TF-IDF + Logistic Regression
    TextBlob Sentiment
    Rule-Based Priority
    Intent -> Resolution Mapping

Database:
    SQLite
============================================================
*/


// ============================================================
// GLOBAL APPLICATION STATE
// ============================================================

const AppState = {

    backendUrl: "http://127.0.0.1:5000",

    mode: "auto",

    isBackendOnline: false,

    currentResult: null,

    tickets: [],

    charts: {
        category: null,
        trend: null,
        priority: null
    }
};


// ============================================================
// SAMPLE COMPLAINTS
// ============================================================

const SAMPLE_PRESETS = {

    billing: {
        customer: "Sarah Jenkins",
        text:
            "I was charged twice $189.50 on my credit card statement for order #INV-88421. I need an immediate reversal and confirmation."
    },

    delivery: {
        customer: "Michael Torres",
        text:
            "My package has not arrived yet and the delivery was supposed to arrive several days ago. Please tell me where my order is."
    },

    security: {
        customer: "David Chen",
        text:
            "My account has been hacked and I see an unauthorized transaction. Please secure my account immediately."
    },

    product: {
        customer: "Emily Watson",
        text:
            "The product I received is defective and does not work properly. I want a replacement or refund."
    },

    tech: {
        customer: "Rahul Sharma",
        text:
            "The payment page gives an error and I cannot complete my payment."
    },

    service: {
        customer: "Amanda Miller",
        text:
            "I want to speak with customer service because my problem has not been resolved."
    }
};


// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {

    console.log("ResolveAI frontend starting...");

    initCharCounter();

    initCharts();

    await checkBackendHealth();

    if (AppState.isBackendOnline) {

        await loadTicketsFromBackend();

    } else {

        loadTicketsFromStorage();

        renderTicketsTable();
    }

});


// ============================================================
// CHARACTER COUNTER
// ============================================================

function initCharCounter() {

    const textarea =
        document.getElementById("complaintText");

    const counter =
        document.getElementById("charCount");

    if (!textarea || !counter) {
        return;
    }

    textarea.addEventListener("input", () => {

        counter.innerText =
            `${textarea.value.length} characters`;

    });
}


// ============================================================
// LOAD SAMPLE PRESET
// ============================================================

function loadSamplePreset(name) {

    const preset =
        SAMPLE_PRESETS[name];

    if (!preset) {
        return;
    }

    const customer =
        document.getElementById("customerName");

    const complaint =
        document.getElementById("complaintText");

    const counter =
        document.getElementById("charCount");

    if (customer) {
        customer.value =
            preset.customer;
    }

    if (complaint) {

        complaint.value =
            preset.text;

        complaint.focus();
    }

    if (counter) {

        counter.innerText =
            `${preset.text.length} characters`;
    }
}


// ============================================================
// RESET FORM
// ============================================================

function resetForm() {

    const customer =
        document.getElementById("customerName");

    const complaint =
        document.getElementById("complaintText");

    const counter =
        document.getElementById("charCount");

    const emptyState =
        document.getElementById("emptyResultState");

    const results =
        document.getElementById("resultsContent");

    if (customer) {
        customer.value = "";
    }

    if (complaint) {
        complaint.value = "";
    }

    if (counter) {
        counter.innerText =
            "0 characters";
    }

    if (emptyState) {
        emptyState.classList.remove("d-none");
    }

    if (results) {
        results.classList.add("d-none");
    }

    AppState.currentResult = null;
}


// ============================================================
// BACKEND HEALTH
// ============================================================

async function checkBackendHealth() {

    const statusDot =
        document.getElementById("statusDot");

    const statusText =
        document.getElementById("statusText");

    const pingStatus =
        document.getElementById("pingStatus");

    if (AppState.mode === "browser") {

        AppState.isBackendOnline = false;

        if (statusDot) {
            statusDot.className =
                "status-dot online";
        }

        if (statusText) {
            statusText.innerText =
                "Mode: Browser Simulation";
        }

        return;
    }

    try {

        const controller =
            new AbortController();

        const timeout =
            setTimeout(() => {
                controller.abort();
            }, 4000);

        const response =
            await fetch(
                `${AppState.backendUrl}/api/health`,
                {
                    method: "GET",
                    signal: controller.signal
                }
            );

        clearTimeout(timeout);

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }

        const data =
            await response.json();

        if (data.status !== "online") {
            throw new Error(
                "Backend is not online"
            );
        }

        AppState.isBackendOnline = true;

        if (statusDot) {
            statusDot.className =
                "status-dot online";
        }

        if (statusText) {
            statusText.innerText =
                "Mode: Live Python Backend (Flask)";
        }

        if (pingStatus) {
            pingStatus.innerText =
                "Status: Connected";
        }

        console.log(
            "Backend connected:",
            data
        );

    } catch (error) {

        AppState.isBackendOnline = false;

        if (statusDot) {
            statusDot.className =
                "status-dot offline";
        }

        if (statusText) {
            statusText.innerText =
                "Mode: Offline / Browser Fallback";
        }

        if (pingStatus) {
            pingStatus.innerText =
                "Status: Backend Offline";
        }

        console.warn(
            "Backend connection failed:",
            error.message
        );
    }
}


// ============================================================
// BACKEND SETTINGS
// ============================================================

function testBackendConnection() {

    const input =
        document.getElementById("configApiUrl");

    if (input && input.value.trim()) {

        AppState.backendUrl =
            input.value.trim();
    }

    checkBackendHealth();
}


function updateBackendMode() {

    const select =
        document.getElementById("configBackendMode");

    if (!select) {
        return;
    }

    AppState.mode =
        select.value;

    checkBackendHealth();
}


// ============================================================
// MAIN AI PROCESSING
// ============================================================

async function processComplaint() {

    const complaintElement =
        document.getElementById("complaintText");

    const customerElement =
        document.getElementById("customerName");

    const complaint =
        complaintElement
            ? complaintElement.value.trim()
            : "";

    const customer =
        customerElement &&
        customerElement.value.trim()
            ? customerElement.value.trim()
            : "Anonymous Customer";


    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!complaint) {

        alert(
            "Please enter a customer complaint."
        );

        if (complaintElement) {
            complaintElement.focus();
        }

        return;
    }


    // --------------------------------------------------------
    // BUTTON LOADING
    // --------------------------------------------------------

    const button =
        document.getElementById("btnAnalyze");

    const spinner =
        document.getElementById("analyzeSpinner");

    const icon =
        document.getElementById("analyzeIcon");

    if (button) {
        button.disabled = true;
    }

    if (spinner) {
        spinner.classList.remove("d-none");
    }

    if (icon) {
        icon.classList.add("d-none");
    }


    const startTime =
        performance.now();


    try {

        // ====================================================
        // REAL FLASK BACKEND
        // ====================================================

        if (
            AppState.mode === "auto" ||
            AppState.mode === "live"
        ) {

            if (!AppState.isBackendOnline) {

                await checkBackendHealth();
            }


            if (AppState.isBackendOnline) {

                console.log(
                    "Sending complaint to Flask..."
                );


                const response =
                    await fetch(
                        `${AppState.backendUrl}/api/classify`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                text: complaint,
                                customer: customer
                            })
                        }
                    );


                const result =
                    await response.json();


                if (
                    !response.ok ||
                    !result.success
                ) {

                    throw new Error(
                        result.error ||
                        "AI classification failed"
                    );
                }


                const duration =
                    Math.round(
                        performance.now() -
                        startTime
                    );


                AppState.currentResult =
                    result;


                displayAnalysisResults(
                    result,
                    duration
                );


                await loadTicketsFromBackend();


                console.log(
                    "REAL AI RESULT:",
                    result
                );


                return;
            }


            if (AppState.mode === "live") {

                throw new Error(
                    "Flask backend is offline. Start python app.py first."
                );
            }
        }


        // ====================================================
        // BROWSER FALLBACK
        // ====================================================

        await new Promise(resolve => {

            setTimeout(
                resolve,
                500
            );

        });


        const result =
            simulateBrowserInference(
                complaint,
                customer
            );


        const duration =
            Math.round(
                performance.now() -
                startTime
            );


        AppState.currentResult =
            result;


        displayAnalysisResults(
            result,
            duration
        );


    } catch (error) {

        console.error(
            "Complaint processing error:",
            error
        );

        alert(
            "Unable to analyze complaint.\n\n" +
            error.message
        );

    } finally {

        if (button) {
            button.disabled = false;
        }

        if (spinner) {
            spinner.classList.add("d-none");
        }

        if (icon) {
            icon.classList.remove("d-none");
        }
    }
}


// ============================================================
// LOAD REAL TICKETS FROM SQLITE
// ============================================================

async function loadTicketsFromBackend() {

    try {

        const response =
            await fetch(
                `${AppState.backendUrl}/api/tickets`
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );
        }


        const data =
            await response.json();


        if (!data.success) {

            throw new Error(
                data.error ||
                "Unable to load tickets"
            );
        }


        AppState.tickets =
            (data.tickets || []).map(ticket => {

                const intentConfidence =
                    Number(
                        ticket.intent_confidence || 0
                    );

                const categoryConfidence =
                    Number(
                        ticket.category_confidence || 0
                    );


                return {

                    id:
                        ticket.ticket_id,

                    customer:
                        ticket.customer ||
                        "Customer",

                    category:
                        ticket.category ||
                        "Unknown",

                    intent:
                        ticket.intent ||
                        "Unknown",

                    complaint:
                        ticket.complaint ||
                        "",

                    confidence:
                        intentConfidence / 100,

                    categoryConfidence:
                        categoryConfidence,

                    intentConfidence:
                        intentConfidence,

                    priority:
                        ticket.priority ||
                        "Low",

                    urgency:
                        ticket.priority ||
                        "Low",

                    sentiment:
                        ticket.sentiment ||
                        "Neutral",

                    polarity:
                        Number(
                            ticket.polarity || 0
                        ),

                    subjectivity:
                        Number(
                            ticket.subjectivity || 0
                        ),

                    resolution:
                        ticket.resolution ||
                        "",

                    humanReview:
                        Boolean(
                            ticket.human_review
                        ),

                    reviewReason:
                        ticket.review_reason ||
                        null,

                    status:
                        ticket.status ||
                        "Open",

                    timestamp:
                        ticket.created_at ||
                        ""
                };
            });


        renderTicketsTable();

        updateChartMetrics();


        console.log(
            `Loaded ${AppState.tickets.length} tickets from SQLite`
        );


    } catch (error) {

        console.error(
            "Could not load tickets:",
            error
        );
    }
}


// ============================================================
// DISPLAY AI RESULT
// ============================================================

function displayAnalysisResults(
    result,
    durationMs
) {

    AppState.currentResult =
        result;


    // --------------------------------------------------------
    // SHOW RESULTS
    // --------------------------------------------------------

    const emptyState =
        document.getElementById(
            "emptyResultState"
        );

    const results =
        document.getElementById(
            "resultsContent"
        );


    if (emptyState) {
        emptyState.classList.add(
            "d-none"
        );
    }


    if (results) {
        results.classList.remove(
            "d-none"
        );
    }


    // --------------------------------------------------------
    // INFERENCE TIME
    // --------------------------------------------------------

    const inference =
        document.getElementById(
            "modelInferenceTime"
        );


    if (inference) {

        inference.innerText =
            `Real AI Inference: ${durationMs}ms | Flask + TF-IDF + Logistic Regression`;
    }


    // --------------------------------------------------------
    // CATEGORY
    // --------------------------------------------------------

    const category =
        document.getElementById(
            "resCategory"
        );


    if (category) {

        category.innerText =
            result.category ||
            "Unknown";
    }


    const categoryConfidence =
        document.getElementById(
            "resCategoryConfidence"
        );


    if (categoryConfidence) {

        categoryConfidence.innerText =
            `Confidence: ${Number(
                result.categoryConfidence || 0
            ).toFixed(1)}%`;
    }


    // --------------------------------------------------------
    // PRIORITY
    // --------------------------------------------------------

    const priority =
        result.priority ||
        result.urgency ||
        "Low";


    const urgency =
        document.getElementById(
            "resUrgency"
        );


    const urgencyCard =
        document.getElementById(
            "urgencyCard"
        );


    const priorityText =
        document.getElementById(
            "resSlaTime"
        );


    if (urgency) {

        urgency.innerText =
            priority;
    }


    if (priorityText) {

        priorityText.innerHTML =
            `<i class="bi bi-flag me-1"></i>
             Priority: ${escapeHtml(priority)}`;
    }


    if (
        urgencyCard &&
        urgency
    ) {

        if (priority === "Critical") {

            urgencyCard.className =
                "result-metric-card p-3 rounded-3 bg-danger bg-opacity-10 border border-danger border-opacity-25";

            urgency.className =
                "fs-5 fw-bold text-danger mt-1";


        } else if (priority === "High") {

            urgencyCard.className =
                "result-metric-card p-3 rounded-3 bg-danger bg-opacity-10 border border-danger border-opacity-25";

            urgency.className =
                "fs-5 fw-bold text-danger mt-1";


        } else if (priority === "Medium") {

            urgencyCard.className =
                "result-metric-card p-3 rounded-3 bg-warning bg-opacity-10 border border-warning border-opacity-25";

            urgency.className =
                "fs-5 fw-bold text-warning-emphasis mt-1";


        } else {

            urgencyCard.className =
                "result-metric-card p-3 rounded-3 bg-info bg-opacity-10 border border-info border-opacity-25";

            urgency.className =
                "fs-5 fw-bold text-info mt-1";
        }
    }


    // --------------------------------------------------------
    // SENTIMENT
    // --------------------------------------------------------

    const sentiment =
        document.getElementById(
            "resSentiment"
        );


    if (sentiment) {

        sentiment.innerText =
            result.sentiment ||
            "Neutral";
    }


    // --------------------------------------------------------
    // INTENT
    // --------------------------------------------------------

    const intent =
        document.getElementById(
            "resIntent"
        );


    if (intent) {

        intent.innerText =
            result.intent ||
            "Unknown";
    }


    // --------------------------------------------------------
    // INTENT CONFIDENCE
    // --------------------------------------------------------

    const intentConfidence =
        document.getElementById(
            "resIntentConfidence"
        );


    if (intentConfidence) {

        const value =
            Number(
                result.intentConfidence || 0
            );


        intentConfidence.innerText =
            `Confidence: ${value.toFixed(1)}%`;
    }


    // --------------------------------------------------------
    // RESOLUTION
    // --------------------------------------------------------

    const resolution =
        result.resolution ||
        "No automated resolution available.";


    const resolutionElement =
        document.getElementById(
            "resResolution"
        );


    if (resolutionElement) {

        resolutionElement.innerText =
            resolution;
    }


    const emailDraft =
        document.getElementById(
            "resEmailDraft"
        );


    if (emailDraft) {

        emailDraft.innerText =
            resolution;
    }


    // --------------------------------------------------------
    // HUMAN REVIEW
    // --------------------------------------------------------

    const needsReview =
        result.humanReview === true ||
        result.humanReview === 1;


    const reviewElement =
        document.getElementById(
            "humanReviewStatus"
        );


    if (reviewElement) {

        if (needsReview) {

            reviewElement.innerText =
                "Human Review Required";

            reviewElement.className =
                "badge bg-warning text-dark";


        } else {

            reviewElement.innerText =
                "AI Resolution Ready";

            reviewElement.className =
                "badge bg-success";
        }
    }


    // --------------------------------------------------------
    // TICKET ID
    // --------------------------------------------------------

    const ticketId =
        document.getElementById(
            "resultTicketId"
        );


    if (ticketId) {

        ticketId.innerText =
            result.ticket_id ||
            result.id ||
            "N/A";
    }


    // --------------------------------------------------------
    // CONFIDENCE BARS
    // --------------------------------------------------------

    const probabilityBars =
        document.getElementById(
            "probabilityBars"
        );


    if (probabilityBars) {

        probabilityBars.innerHTML = "";


        const categoryValue =
            Math.max(
                0,
                Math.min(
                    100,
                    Number(
                        result.categoryConfidence || 0
                    )
                )
            );


        const intentValue =
            Math.max(
                0,
                Math.min(
                    100,
                    Number(
                        result.intentConfidence || 0
                    )
                )
            );


        probabilityBars.innerHTML = `

            <div class="prob-bar-container mb-3">

                <div class="prob-label small">

                    Category:
                    ${escapeHtml(
                        result.category || "Unknown"
                    )}

                </div>


                <div class="prob-bar-wrapper">

                    <div
                        class="prob-bar-fill bg-primary"
                        style="width:${categoryValue}%">
                    </div>

                </div>


                <div class="prob-value small">

                    ${categoryValue.toFixed(1)}%

                </div>

            </div>


            <div class="prob-bar-container">

                <div class="prob-label small">

                    Intent:
                    ${escapeHtml(
                        result.intent || "Unknown"
                    )}

                </div>


                <div class="prob-bar-wrapper">

                    <div
                        class="prob-bar-fill bg-success"
                        style="width:${intentValue}%">
                    </div>

                </div>


                <div class="prob-value small">

                    ${intentValue.toFixed(1)}%

                </div>

            </div>
        `;
    }


    // --------------------------------------------------------
    // METADATA
    // --------------------------------------------------------

    const metadata =
        document.getElementById(
            "extractedEntities"
        );


    if (metadata) {

        metadata.innerHTML = `

            <span class="entity-pill">

                <strong>Intent:</strong>

                ${escapeHtml(
                    result.intent || "Unknown"
                )}

            </span>


            <span class="entity-pill">

                <strong>Sentiment:</strong>

                ${escapeHtml(
                    result.sentiment || "Neutral"
                )}

            </span>


            <span class="entity-pill">

                <strong>Priority:</strong>

                ${escapeHtml(
                    priority
                )}

            </span>

        `;
    }


    // --------------------------------------------------------
    // ACTION STEPS
    // --------------------------------------------------------

    const actionSteps =
        document.getElementById(
            "resActionSteps"
        );


    if (actionSteps) {

        actionSteps.innerHTML = "";


        const li =
            document.createElement("li");


        li.innerText =
            resolution;


        actionSteps.appendChild(li);
    }


    // --------------------------------------------------------
    // SCROLL TO RESULTS
    // --------------------------------------------------------

    if (results) {

        results.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });
    }


    console.log(
        "Displayed AI result:",
        result
    );
}


// ============================================================
// BROWSER FALLBACK
// ============================================================

function simulateBrowserInference(
    text,
    customer
) {

    const lower =
        text.toLowerCase();


    let category =
        "CONTACT";

    let intent =
        "complaint";

    let confidence =
        50;


    // --------------------------------------------------------
    // CATEGORY
    // --------------------------------------------------------

    if (
        lower.includes("payment") ||
        lower.includes("charged") ||
        lower.includes("charge") ||
        lower.includes("card")
    ) {

        category =
            "PAYMENT";

        confidence =
            90;
    }


    else if (
        lower.includes("refund")
    ) {

        category =
            "REFUND";

        intent =
            "get_refund";

        confidence =
            90;
    }


    else if (
        lower.includes("delivery") ||
        lower.includes("package") ||
        lower.includes("shipping") ||
        lower.includes("tracking") ||
        lower.includes("late")
    ) {

        category =
            "DELIVERY";

        confidence =
            88;
    }


    else if (
        lower.includes("password") ||
        lower.includes("login") ||
        lower.includes("account") ||
        lower.includes("hacked")
    ) {

        category =
            "ACCOUNT";

        confidence =
            90;
    }


    else if (
        lower.includes("cancel")
    ) {

        category =
            "CANCEL";

        intent =
            "cancel_order";

        confidence =
            85;
    }


    // --------------------------------------------------------
    // INTENT
    // --------------------------------------------------------

    if (
        lower.includes("charged twice") ||
        lower.includes("charged multiple times")
    ) {

        intent =
            "payment_issue";
    }


    else if (
        lower.includes("track my order") ||
        lower.includes("track my package") ||
        lower.includes("where is my order")
    ) {

        intent =
            "track_order";
    }


    else if (
        lower.includes("forgot my password") ||
        lower.includes("forgot password") ||
        lower.includes("cannot login") ||
        lower.includes("cannot log in")
    ) {

        intent =
            "recover_password";
    }


    else if (
        lower.includes("change my delivery address") ||
        lower.includes("change delivery address")
    ) {

        intent =
            "change_shipping_address";
    }


    else if (
        lower.includes("cancel my order")
    ) {

        intent =
            "cancel_order";
    }


    // --------------------------------------------------------
    // SENTIMENT
    // --------------------------------------------------------

    let sentiment =
        "Neutral";


    if (
        lower.includes("angry") ||
        lower.includes("frustrated") ||
        lower.includes("worst") ||
        lower.includes("unacceptable") ||
        lower.includes("terrible")
    ) {

        sentiment =
            "Negative";
    }


    else if (
        lower.includes("thank") ||
        lower.includes("happy") ||
        lower.includes("excellent") ||
        lower.includes("good")
    ) {

        sentiment =
            "Positive";
    }


    // --------------------------------------------------------
    // PRIORITY
    // --------------------------------------------------------

    let priority =
        "Low";


    if (
        lower.includes("hacked") ||
        lower.includes("fraud") ||
        lower.includes("stolen") ||
        lower.includes("unauthorized") ||
        lower.includes("identity theft")
    ) {

        priority =
            "Critical";
    }


    else if (
        lower.includes("charged twice") ||
        lower.includes("charged multiple times") ||
        lower.includes("payment failed") ||
        lower.includes("refund not received") ||
        lower.includes("urgent")
    ) {

        priority =
            "High";
    }


    else if (
        lower.includes("late") ||
        lower.includes("delayed") ||
        lower.includes("problem") ||
        lower.includes("issue") ||
        lower.includes("error") ||
        lower.includes("forgot password")
    ) {

        priority =
            "Medium";
    }


    const ticketId =
        generateLocalTicketId();


    return {

        success: true,

        id:
            ticketId,

        ticket_id:
            ticketId,

        customer:
            customer,

        complaint:
            text,

        category:
            category,

        intent:
            intent,

        categoryConfidence:
            confidence,

        intentConfidence:
            confidence,

        confidence:
            confidence / 100,

        sentiment:
            sentiment,

        polarity:
            0,

        subjectivity:
            0,

        priority:
            priority,

        urgency:
            priority,

        humanReview:
            confidence < 55,

        reviewReason:
            confidence < 55
                ? "Low browser classification confidence"
                : null,

        resolution:
            "Please review the complaint and provide the customer with the appropriate resolution.",

        status:
            "Open",

        ruleDetected:
            null,

        timestamp:
            new Date().toISOString()
    };
}


// ============================================================
// LOCAL TICKET ID
// ============================================================

function generateLocalTicketId() {

    return (
        "TKT-" +
        Date.now()
    );
}


// ============================================================
// SAVE CURRENT TICKET
// ============================================================

async function saveAsTicket() {

    if (!AppState.currentResult) {

        alert(
            "Please analyze a complaint first."
        );

        return;
    }


    // The real backend creates the ticket
    // automatically during /api/classify.

    if (AppState.isBackendOnline) {

        await loadTicketsFromBackend();

        alert(
            `Ticket ${
                AppState.currentResult.ticket_id ||
                AppState.currentResult.id
            } is already saved in SQLite.`
        );

    } else {

        const ticket =
            AppState.currentResult;


        const existingIndex =
            AppState.tickets.findIndex(
                item =>
                    item.id ===
                    ticket.ticket_id
            );


        if (existingIndex === -1) {

            AppState.tickets.unshift(
                ticket
            );

            saveTicketsToStorage();
        }


        renderTicketsTable();

        alert(
            "Ticket saved locally."
        );
    }
}


// ============================================================
// LOCAL STORAGE
// ============================================================

function saveTicketsToStorage() {

    try {

        localStorage.setItem(
            "resolveai_tickets",
            JSON.stringify(
                AppState.tickets
            )
        );

    } catch (error) {

        console.error(
            "Local storage error:",
            error
        );
    }
}


function loadTicketsFromStorage() {

    try {

        const stored =
            localStorage.getItem(
                "resolveai_tickets"
            );


        if (stored) {

            AppState.tickets =
                JSON.parse(stored);

        } else {

            AppState.tickets = [];

        }

    } catch (error) {

        console.error(
            "Could not load local tickets:",
            error
        );

        AppState.tickets = [];
    }
}


// ============================================================
// RENDER TICKETS
// ============================================================

function renderTicketsTable(
    filteredTickets = null
) {

    const tbody =
        document.getElementById(
            "ticketsTableBody"
        );


    const emptyMessage =
        document.getElementById(
            "noTicketsMessage"
        );


    if (!tbody) {
        return;
    }


    const tickets =
        filteredTickets ||
        AppState.tickets;


    tbody.innerHTML = "";


    if (tickets.length === 0) {

        if (emptyMessage) {

            emptyMessage.classList.remove(
                "d-none"
            );
        }

        return;
    }


    if (emptyMessage) {

        emptyMessage.classList.add(
            "d-none"
        );
    }


    tickets.forEach(ticket => {

        const row =
            document.createElement("tr");


        const priority =
            ticket.priority ||
            ticket.urgency ||
            "Low";


        const status =
            ticket.status ||
            "Open";


        let priorityClass =
            "bg-info text-dark";


        if (priority === "Critical") {

            priorityClass =
                "bg-danger";

        } else if (priority === "High") {

            priorityClass =
                "bg-danger";

        } else if (priority === "Medium") {

            priorityClass =
                "bg-warning text-dark";
        }


        let statusClass =
            "bg-primary";


        if (status === "Resolved") {

            statusClass =
                "bg-success";

        } else if (status === "In Progress") {

            statusClass =
                "bg-warning text-dark";

        } else if (status === "Closed") {

            statusClass =
                "bg-secondary";
        }


        const confidence =
            Number(
                ticket.intentConfidence ??
                (Number(ticket.confidence || 0) * 100)
            );


        row.innerHTML = `

            <td>

                <span
                    class="font-monospace fw-bold text-primary">

                    ${escapeHtml(
                        ticket.id || "N/A"
                    )}

                </span>

            </td>


            <td>

                <strong>

                    ${escapeHtml(
                        ticket.customer ||
                        "Customer"
                    )}

                </strong>


                <br>


                <small class="text-muted">

                    ${escapeHtml(
                        ticket.timestamp || ""
                    )}

                </small>

            </td>


            <td>

                <span
                    class="badge bg-light text-dark border">

                    ${escapeHtml(
                        ticket.category ||
                        "Unknown"
                    )}

                </span>

            </td>


            <td
                style="max-width:300px;">

                <div
                    class="text-truncate"
                    title="${escapeHtml(
                        ticket.complaint || ""
                    )}">

                    ${escapeHtml(
                        ticket.complaint || ""
                    )}

                </div>

            </td>


            <td>

                <span class="small">

                    ${confidence.toFixed(1)}%

                </span>

            </td>


            <td>

                <span
                    class="badge ${priorityClass}">

                    ${escapeHtml(priority)}

                </span>

            </td>


            <td>

                <span
                    class="badge ${statusClass}">

                    ${escapeHtml(status)}

                </span>

            </td>


            <td class="text-end">

                <button
                    class="btn btn-sm btn-outline-primary rounded-pill me-1"
                    onclick="viewTicketModal('${escapeJs(
                        ticket.id
                    )}')">

                    <i class="bi bi-eye"></i>

                    Details

                </button>


                <button
                    class="btn btn-sm ${
                        status === "Resolved"
                            ? "btn-outline-warning"
                            : "btn-outline-success"
                    } rounded-pill"
                    onclick="toggleTicketStatus('${escapeJs(
                        ticket.id
                    )}')">

                    ${
                        status === "Resolved"
                            ? "Reopen"
                            : "Resolve"
                    }

                </button>

            </td>

        `;


        tbody.appendChild(row);

    });
}


// ============================================================
// FILTER TICKETS
// ============================================================

function filterTickets() {

    const searchElement =
        document.getElementById(
            "ticketSearchInput"
        );


    const categoryElement =
        document.getElementById(
            "filterCategory"
        );


    const statusElement =
        document.getElementById(
            "filterStatus"
        );


    const priorityElement =
        document.getElementById(
            "filterUrgency"
        );


    const search =
        searchElement
            ? searchElement.value.toLowerCase().trim()
            : "";


    const category =
        categoryElement
            ? categoryElement.value
            : "ALL";


    const status =
        statusElement
            ? statusElement.value
            : "ALL";


    const priority =
        priorityElement
            ? priorityElement.value
            : "ALL";


    const filtered =
        AppState.tickets.filter(ticket => {

            const text =
                `${ticket.id || ""} ${
                    ticket.customer || ""
                } ${
                    ticket.complaint || ""
                }`.toLowerCase();


            const ticketPriority =
                ticket.priority ||
                ticket.urgency ||
                "Low";


            return (

                text.includes(search) &&

                (
                    category === "ALL" ||
                    ticket.category === category
                ) &&

                (
                    status === "ALL" ||
                    ticket.status === status
                ) &&

                (
                    priority === "ALL" ||
                    ticketPriority === priority
                )

            );
        });


    renderTicketsTable(filtered);
}


// ============================================================
// UPDATE TICKET STATUS
// ============================================================

async function toggleTicketStatus(
    ticketId
) {

    const ticket =
        AppState.tickets.find(
            item =>
                item.id === ticketId
        );


    if (!ticket) {

        alert(
            "Ticket not found."
        );

        return;
    }


    const newStatus =
        ticket.status === "Resolved"
            ? "In Progress"
            : "Resolved";


    try {

        if (AppState.isBackendOnline) {

            const response =
                await fetch(
                    `${AppState.backendUrl}/api/tickets/${encodeURIComponent(
                        ticketId
                    )}`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            status: newStatus
                        })
                    }
                );


            const data =
                await response.json();


            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.error ||
                    "Status update failed"
                );
            }


            await loadTicketsFromBackend();


        } else {

            ticket.status =
                newStatus;


            saveTicketsToStorage();

            renderTicketsTable();
        }


        updateChartMetrics();


    } catch (error) {

        console.error(
            "Status update error:",
            error
        );


        alert(
            "Unable to update ticket status.\n\n" +
            error.message
        );
    }
}


// ============================================================
// TICKET DETAIL MODAL
// ============================================================

let activeModalTicketId = null;


function viewTicketModal(ticketId) {

    const ticket =
        AppState.tickets.find(
            item =>
                item.id === ticketId
        );


    if (!ticket) {
        return;
    }


    activeModalTicketId =
        ticketId;


    const idElement =
        document.getElementById(
            "modalTicketId"
        );


    const titleElement =
        document.getElementById(
            "modalTicketTitle"
        );


    const bodyElement =
        document.getElementById(
            "modalTicketBody"
        );


    if (idElement) {

        idElement.innerText =
            ticket.id;
    }


    if (titleElement) {

        titleElement.innerText =
            ticket.category ||
            "Complaint Details";
    }


    if (bodyElement) {

        const confidence =
            Number(
                ticket.intentConfidence ??
                (Number(ticket.confidence || 0) * 100)
            );


        bodyElement.innerHTML = `

            <div class="mb-3">

                <div class="small text-muted fw-bold">
                    CUSTOMER
                </div>

                <div class="fw-semibold">

                    ${escapeHtml(
                        ticket.customer ||
                        "Customer"
                    )}

                </div>

            </div>


            <div class="mb-3">

                <div class="small text-muted fw-bold">
                    COMPLAINT
                </div>

                <div
                    class="p-3 bg-light rounded-3">

                    ${escapeHtml(
                        ticket.complaint ||
                        ""
                    )}

                </div>

            </div>


            <div class="row g-3 mb-3">

                <div class="col-md-4">

                    <div class="border rounded-3 p-3">

                        <small class="text-muted">
                            Category
                        </small>

                        <div class="fw-bold">
                            ${escapeHtml(
                                ticket.category ||
                                "Unknown"
                            )}
                        </div>

                    </div>

                </div>


                <div class="col-md-4">

                    <div class="border rounded-3 p-3">

                        <small class="text-muted">
                            Intent
                        </small>

                        <div class="fw-bold">
                            ${escapeHtml(
                                ticket.intent ||
                                "Unknown"
                            )}
                        </div>

                    </div>

                </div>


                <div class="col-md-4">

                    <div class="border rounded-3 p-3">

                        <small class="text-muted">
                            Confidence
                        </small>

                        <div class="fw-bold">
                            ${confidence.toFixed(1)}%
                        </div>

                    </div>

                </div>

            </div>


            <div class="row g-3 mb-3">

                <div class="col-md-4">

                    <div class="border rounded-3 p-3">

                        <small class="text-muted">
                            Priority
                        </small>

                        <div class="fw-bold">
                            ${escapeHtml(
                                ticket.priority ||
                                "Low"
                            )}
                        </div>

                    </div>

                </div>


                <div class="col-md-4">

                    <div class="border rounded-3 p-3">

                        <small class="text-muted">
                            Sentiment
                        </small>

                        <div class="fw-bold">
                            ${escapeHtml(
                                ticket.sentiment ||
                                "Neutral"
                            )}
                        </div>

                    </div>

                </div>


                <div class="col-md-4">

                    <div class="border rounded-3 p-3">

                        <small class="text-muted">
                            Status
                        </small>

                        <div class="fw-bold text-primary">
                            ${escapeHtml(
                                ticket.status ||
                                "Open"
                            )}
                        </div>

                    </div>

                </div>

            </div>


            <div class="mb-3">

                <div class="small text-muted fw-bold mb-2">
                    AI RESOLUTION
                </div>

                <div class="p-3 bg-light rounded-3">

                    ${escapeHtml(
                        ticket.resolution ||
                        "No resolution available."
                    )}

                </div>

            </div>

        `;
    }


    const resolveButton =
        document.getElementById(
            "btnModalResolve"
        );


    if (resolveButton) {

        if (ticket.status === "Resolved") {

            resolveButton.innerText =
                "Reopen Ticket";

            resolveButton.className =
                "btn btn-outline-warning rounded-pill";

        } else {

            resolveButton.innerText =
                "Mark as Resolved";

            resolveButton.className =
                "btn btn-success rounded-pill";
        }
    }


    const modalElement =
        document.getElementById(
            "ticketDetailModal"
        );


    if (
        modalElement &&
        typeof bootstrap !== "undefined"
    ) {

        const modal =
            bootstrap.Modal.getOrCreateInstance(
                modalElement
            );

        modal.show();
    }
}


// ============================================================
// MODAL STATUS UPDATE
// ============================================================

async function toggleModalTicketStatus() {

    if (!activeModalTicketId) {
        return;
    }


    await toggleTicketStatus(
        activeModalTicketId
    );


    const modalElement =
        document.getElementById(
            "ticketDetailModal"
        );


    if (
        modalElement &&
        typeof bootstrap !== "undefined"
    ) {

        const modal =
            bootstrap.Modal.getInstance(
                modalElement
            );


        if (modal) {
            modal.hide();
        }
    }
}


// ============================================================
// COPY RESOLUTION
// ============================================================

function copyResolutionDraft() {

    const element =
        document.getElementById(
            "resEmailDraft"
        );


    if (!element) {
        return;
    }


    const text =
        element.innerText;


    if (
        navigator.clipboard &&
        navigator.clipboard.writeText
    ) {

        navigator.clipboard
            .writeText(text)
            .then(() => {

                alert(
                    "Resolution copied to clipboard."
                );

            })
            .catch(() => {

                fallbackCopy(text);
            });

    } else {

        fallbackCopy(text);
    }
}


function fallbackCopy(text) {

    const textarea =
        document.createElement("textarea");

    textarea.value =
        text;

    document.body.appendChild(
        textarea
    );

    textarea.select();

    document.execCommand(
        "copy"
    );

    textarea.remove();

    alert(
        "Resolution copied to clipboard."
    );
}


// ============================================================
// EXPORT CSV
// ============================================================

function exportTicketsCSV() {

    if (
        !AppState.tickets ||
        AppState.tickets.length === 0
    ) {

        alert(
            "No tickets available."
        );

        return;
    }


    const headers = [

        "Ticket ID",
        "Customer",
        "Category",
        "Intent",
        "Category Confidence",
        "Intent Confidence",
        "Priority",
        "Sentiment",
        "Status",
        "Created At",
        "Complaint",
        "Resolution"
    ];


    const rows =
        AppState.tickets.map(ticket => {

            return [

                ticket.id || "",

                ticket.customer || "",

                ticket.category || "",

                ticket.intent || "",

                `${Number(
                    ticket.categoryConfidence || 0
                ).toFixed(2)}%`,

                `${Number(
                    ticket.intentConfidence || 0
                ).toFixed(2)}%`,

                ticket.priority || "",

                ticket.sentiment || "",

                ticket.status || "",

                ticket.timestamp || "",

                ticket.complaint || "",

                ticket.resolution || ""

            ];
        });


    const csv = [

        headers,

        ...rows

    ]

    .map(row => {

        return row
            .map(value =>
                `"${String(value)
                    .replace(/"/g, '""')}"`
            )
            .join(",");

    })
    .join("\n");


    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement("a");


    link.href =
        url;


    link.download =
        `resolveai_tickets_${Date.now()}.csv`;


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
        url
    );
}


// ============================================================
// CLEAR LOCAL QUEUE
// ============================================================

function clearAllTickets() {

    if (
        !confirm(
            "This clears only browser-local tickets. SQLite tickets are not deleted.\n\nContinue?"
        )
    ) {

        return;
    }


    AppState.tickets = [];


    saveTicketsToStorage();


    renderTicketsTable();


    updateChartMetrics();
}


// ============================================================
// COPILOT
// ============================================================

function sendToCopilot() {

    if (!AppState.currentResult) {

        alert(
            "Analyze a complaint first."
        );

        return;
    }


    const complaint =
        AppState.currentResult.complaint ||
        "";


    const query =
        `How should I respond to this customer complaint: ${complaint}`;


    sendCopilotPreset(
        query
    );


    const section =
        document.getElementById(
            "copilot-section"
        );


    if (section) {

        section.scrollIntoView({
            behavior: "smooth"
        });
    }
}


function sendCopilotPreset(
    query
) {

    const input =
        document.getElementById(
            "copilotInput"
        );


    if (!input) {
        return;
    }


    input.value =
        query;


    handleCopilotSubmit(
        new Event("submit")
    );
}


function handleCopilotSubmit(event) {

    event.preventDefault();


    const input =
        document.getElementById(
            "copilotInput"
        );


    const chat =
        document.getElementById(
            "copilotChatBox"
        );


    if (!input || !chat) {
        return;
    }


    const query =
        input.value.trim();


    if (!query) {
        return;
    }


    const userMessage =
        document.createElement("div");


    userMessage.className =
        "d-flex justify-content-end mb-3";


    userMessage.innerHTML = `

        <div class="chat-bubble-user">

            ${escapeHtml(query)}

        </div>

    `;


    chat.appendChild(
        userMessage
    );


    input.value = "";


    chat.scrollTop =
        chat.scrollHeight;


    setTimeout(() => {

        const answer =
            generateCopilotAnswer(
                query
            );


        const botMessage =
            document.createElement("div");


        botMessage.className =
            "d-flex gap-2 mb-3";


        botMessage.innerHTML = `

            <div
                class="bg-primary text-white rounded-circle p-2 align-self-start"
                style="
                    width:34px;
                    height:34px;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                ">

                <i class="bi bi-robot"></i>

            </div>


            <div class="chat-bubble-bot">

                <div
                    class="fw-bold small text-primary mb-1">

                    ResolveAI Copilot

                </div>


                <div class="small">

                    ${answer}

                </div>

            </div>

        `;


        chat.appendChild(
            botMessage
        );


        chat.scrollTop =
            chat.scrollHeight;

    }, 400);
}


function generateCopilotAnswer(
    prompt
) {

    const text =
        prompt.toLowerCase();


    if (
        text.includes("billing") ||
        text.includes("charge") ||
        text.includes("charged")
    ) {

        return `
            <strong>Billing Response:</strong><br>
            Verify the transaction history and confirm whether the customer was charged more than once. If duplicate charging is confirmed, process the appropriate correction or refund according to company policy.
        `;
    }


    if (
        text.includes("delivery") ||
        text.includes("late") ||
        text.includes("package")
    ) {

        return `
            <strong>Delivery Response:</strong><br>
            Check the shipment tracking information, identify the cause of the delay, and provide the customer with the latest delivery information and appropriate resolution.
        `;
    }


    if (
        text.includes("security") ||
        text.includes("fraud") ||
        text.includes("hacked")
    ) {

        return `
            <strong>Security Response:</strong><br>
            Secure the customer's account, verify suspicious activity, and escalate unauthorized transactions to the appropriate security team.
        `;
    }


    return `
        <strong>Recommended Support Action:</strong><br>
        Review the complaint category, intent, sentiment and priority before sending the final response to the customer.
    `;
}


// ============================================================
// CHART INITIALIZATION
// ============================================================

function initCharts() {

    if (
        typeof Chart === "undefined"
    ) {

        console.warn(
            "Chart.js not loaded."
        );

        return;
    }


    // --------------------------------------------------------
    // CATEGORY CHART
    // --------------------------------------------------------

    const categoryCanvas =
        document.getElementById(
            "categoryChart"
        );


    if (categoryCanvas) {

        const ctx =
            categoryCanvas.getContext(
                "2d"
            );


        AppState.charts.category =
            new Chart(
                ctx,
                {

                    type: "doughnut",

                    data: {

                        labels: [
                            "ACCOUNT",
                            "ORDER",
                            "REFUND",
                            "PAYMENT",
                            "DELIVERY",
                            "OTHER"
                        ],

                        datasets: [{

                            data: [
                                0,
                                0,
                                0,
                                0,
                                0,
                                0
                            ],

                            backgroundColor: [
                                "#dc2626",
                                "#2563eb",
                                "#16a34a",
                                "#ea580c",
                                "#06b6d4",
                                "#64748b"
                            ],

                            borderWidth: 2,

                            borderColor:
                                "#ffffff"
                        }]
                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio:
                            false,

                        plugins: {

                            legend: {

                                position:
                                    "bottom"
                            }
                        }
                    }
                }
            );
    }


    // --------------------------------------------------------
    // TREND CHART
    // --------------------------------------------------------

    const trendCanvas =
        document.getElementById(
            "trendChart"
        );


    if (trendCanvas) {

        const ctx =
            trendCanvas.getContext(
                "2d"
            );


        AppState.charts.trend =
            new Chart(
                ctx,
                {

                    type: "line",

                    data: {

                        labels: [
                            "Mon",
                            "Tue",
                            "Wed",
                            "Thu",
                            "Fri",
                            "Sat",
                            "Sun"
                        ],

                        datasets: [{

                            label:
                                "Tickets",

                            data: [
                                0,
                                0,
                                0,
                                0,
                                0,
                                0,
                                0
                            ],

                            borderColor:
                                "#3b82f6",

                            backgroundColor:
                                "rgba(59,130,246,0.1)",

                            fill: true,

                            tension: 0.3
                        }]
                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio:
                            false,

                        scales: {

                            y: {

                                beginAtZero:
                                    true
                            }
                        }
                    }
                }
            );
    }


    // --------------------------------------------------------
    // PRIORITY CHART
    // --------------------------------------------------------

    const priorityCanvas =
        document.getElementById(
            "priorityChart"
        );


    if (priorityCanvas) {

        const ctx =
            priorityCanvas.getContext(
                "2d"
            );


        AppState.charts.priority =
            new Chart(
                ctx,
                {

                    type: "bar",

                    data: {

                        labels: [
                            "Critical",
                            "High",
                            "Medium",
                            "Low"
                        ],

                        datasets: [{

                            label:
                                "Tickets",

                            data: [
                                0,
                                0,
                                0,
                                0
                            ],

                            backgroundColor: [
                                "#dc2626",
                                "#ea580c",
                                "#eab308",
                                "#0284c7"
                            ],

                            borderRadius:
                                6
                        }]
                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio:
                            false,

                        plugins: {

                            legend: {
                                display:
                                    false
                            }
                        },

                        scales: {

                            y: {

                                beginAtZero:
                                    true
                            }
                        }
                    }
                }
            );
    }


    updateChartMetrics();
}


// ============================================================
// UPDATE CHART METRICS
// ============================================================

function updateChartMetrics() {

    const tickets =
        AppState.tickets || [];


    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;


    const categoryCounts = {

        ACCOUNT: 0,
        ORDER: 0,
        REFUND: 0,
        PAYMENT: 0,
        DELIVERY: 0,
        OTHER: 0
    };


    tickets.forEach(ticket => {

        const priority =
            ticket.priority ||
            ticket.urgency ||
            "Low";


        if (priority === "Critical") {

            critical++;

        } else if (priority === "High") {

            high++;

        } else if (priority === "Medium") {

            medium++;

        } else {

            low++;
        }


        const category =
            ticket.category;


        if (
            Object.prototype.hasOwnProperty.call(
                categoryCounts,
                category
            )
        ) {

            categoryCounts[category]++;

        } else {

            categoryCounts.OTHER++;
        }
    });


    // --------------------------------------------------------
    // KPI TOTAL
    // --------------------------------------------------------

    const total =
        document.getElementById(
            "kpiTotal"
        );


    if (total) {

        total.innerText =
            tickets.length.toLocaleString();
    }


    // --------------------------------------------------------
    // KPI CRITICAL
    // --------------------------------------------------------

    const criticalElement =
        document.getElementById(
            "kpiCritical"
        );


    if (criticalElement) {

        criticalElement.innerText =
            critical.toLocaleString();
    }


    // --------------------------------------------------------
    // PRIORITY CHART
    // --------------------------------------------------------

    if (
        AppState.charts.priority
    ) {

        AppState.charts.priority
            .data
            .datasets[0]
            .data = [

                critical,
                high,
                medium,
                low
            ];


        AppState.charts.priority.update();
    }


    // --------------------------------------------------------
    // CATEGORY CHART
    // --------------------------------------------------------

    if (
        AppState.charts.category
    ) {

        AppState.charts.category
            .data
            .datasets[0]
            .data = [

                categoryCounts.ACCOUNT,

                categoryCounts.ORDER,

                categoryCounts.REFUND,

                categoryCounts.PAYMENT,

                categoryCounts.DELIVERY,

                categoryCounts.OTHER
            ];


        AppState.charts.category.update();
    }
}


// ============================================================
// REAL DASHBOARD METRICS
// ============================================================

async function refreshDashboardMetrics() {

    if (!AppState.isBackendOnline) {

        updateChartMetrics();

        alert(
            "Backend is offline. Local dashboard data updated."
        );

        return;
    }


    try {

        const response =
            await fetch(
                `${AppState.backendUrl}/api/metrics`
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.error ||
                "Unable to load metrics"
            );
        }


        const total =
            document.getElementById(
                "kpiTotal"
            );


        const critical =
            document.getElementById(
                "kpiCritical"
            );


        if (total) {

            total.innerText =
                Number(
                    data.total || 0
                ).toLocaleString();
        }


        if (critical) {

            critical.innerText =
                Number(
                    data.priority?.critical ||
                    0
                ).toLocaleString();
        }


        if (
            AppState.charts.priority &&
            data.priority
        ) {

            AppState.charts.priority
                .data
                .datasets[0]
                .data = [

                    Number(
                        data.priority.critical ||
                        0
                    ),

                    Number(
                        data.priority.high ||
                        0
                    ),

                    Number(
                        data.priority.medium ||
                        0
                    ),

                    Number(
                        data.priority.low ||
                        0
                    )
                ];


            AppState.charts.priority.update();
        }


        alert(
            "Dashboard metrics updated successfully."
        );


    } catch (error) {

        console.error(
            "Metrics error:",
            error
        );


        alert(
            "Could not load dashboard metrics."
        );
    }
}


// ============================================================
// SECURITY / HTML ESCAPING
// ============================================================

function escapeHtml(value) {

    return String(value ?? "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


function escapeJs(value) {

    return String(value ?? "")
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /'/g,
            "\\'"
        );
}


// ============================================================
// END OF MAIN.JS
// ============================================================