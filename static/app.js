// Jev Answer Verifier Frontend Logic

let questions = [];
let currentQuestion = null;

const questionPillsContainer = document.getElementById("question-pills");
const currentCategory = document.getElementById("current-category");
const currentQuestionText = document.getElementById("current-question-text");
const expectedAnswerBox = document.getElementById("expected-answer-box");
const expectedAnswerText = document.getElementById("expected-answer-text");
const btnToggleAnswer = document.getElementById("btn-toggle-answer");
const customFields = document.getElementById("custom-fields");
const customQInput = document.getElementById("custom-q-input");
const customAInput = document.getElementById("custom-a-input");
const userAnswerInput = document.getElementById("user-answer-input");
const btnSubmit = document.getElementById("btn-submit");
const statLatency = document.getElementById("stat-latency");
const latencyTag = document.getElementById("latency-tag");

// Verdict & Primitives DOM
const verdictBanner = document.getElementById("verdict-banner");
const verdictTitle = document.getElementById("verdict-title");
const verdictDesc = document.getElementById("verdict-desc");
const noulVal = document.getElementById("noul-val");
const noulDecision = document.getElementById("noul-decision");
const noulRaw = document.getElementById("noul-raw");
const choiceBars = document.getElementById("choice-bars");
const scoreVal = document.getElementById("score-val");
const scorePin = document.getElementById("score-pin");

// 1. Load Questions on Boot
async function loadQuestions() {
  try {
    const res = await fetch("/api/questions");
    questions = await res.json();

    // Render Pills
    questionPillsContainer.innerHTML = "";
    questions.forEach((q, idx) => {
      const btn = document.createElement("button");
      btn.className = `pill-btn ${idx === 0 ? "active" : ""}`;
      btn.textContent = `${q.category}`;
      btn.addEventListener("click", () => selectQuestion(q, btn));
      questionPillsContainer.appendChild(btn);
    });

    // Add "Custom" Pill
    const customBtn = document.createElement("button");
    customBtn.className = "pill-btn";
    customBtn.textContent = "✏️ Custom";
    customBtn.addEventListener("click", () => selectCustom(customBtn));
    questionPillsContainer.appendChild(customBtn);

    if (questions.length > 0) {
      selectQuestion(questions[0], questionPillsContainer.firstChild);
    }
  } catch (err) {
    console.error("Failed to load questions:", err);
  }
}

// 2. Select Question
function selectQuestion(q, activeBtn) {
  currentQuestion = q;
  customFields.classList.add("hidden");
  expectedAnswerBox.classList.add("hidden");
  btnToggleAnswer.textContent = "Show Expected Answer 👁️";

  document.querySelectorAll(".pill-btn").forEach((b) => b.classList.remove("active"));
  if (activeBtn) activeBtn.classList.add("active");

  currentCategory.textContent = q.category;
  currentQuestionText.textContent = q.question;
  expectedAnswerText.textContent = q.expected;
  userAnswerInput.value = "";
  userAnswerInput.placeholder = `Type your answer for: ${q.question}`;

  resetVerdict();
}

function selectCustom(activeBtn) {
  currentQuestion = null;
  customFields.classList.remove("hidden");
  expectedAnswerBox.classList.add("hidden");

  document.querySelectorAll(".pill-btn").forEach((b) => b.classList.remove("active"));
  activeBtn.classList.add("active");

  currentCategory.textContent = "Custom Q&A";
  currentQuestionText.textContent = "Ask Your Own Question:";
  userAnswerInput.value = "";
  resetVerdict();
}

// 3. Reset Verdict
function resetVerdict() {
  verdictBanner.className = "verdict-banner idle";
  verdictBanner.querySelector(".verdict-icon").textContent = "❓";
  verdictTitle.textContent = "Waiting for your answer...";
  verdictDesc.textContent = 'Type your answer and click "Verify Answer with Jev" to see the decision.';

  noulVal.textContent = "--%";
  noulVal.style.color = "var(--text-main)";
  noulDecision.textContent = "--";
  noulRaw.textContent = "p = 0.0000";

  choiceBars.innerHTML = `<div class="dim-placeholder">Submit to see probability breakdown</div>`;
  scoreVal.textContent = "--";
  scorePin.style.left = "0%";
}

// 4. Submit & Verify Answer
async function verifyAnswer() {
  let qText = "";
  let expText = "";
  const userAns = userAnswerInput.value.trim();

  if (!userAns) {
    alert("Please type your answer first!");
    userAnswerInput.focus();
    return;
  }

  if (currentQuestion) {
    qText = currentQuestion.question;
    expText = currentQuestion.expected;
  } else {
    qText = customQInput.value.trim();
    expText = customAInput.value.trim();
    if (!qText || !expText) {
      alert("Please provide both a Custom Question and Expected Target Answer.");
      return;
    }
  }

  btnSubmit.disabled = true;
  btnSubmit.textContent = "⚡ Evaluating...";

  try {
    const res = await fetch("/api/check_answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: qText,
        expected_answer: expText,
        user_answer: userAns,
      }),
    });

    if (!res.ok) throw new Error("Evaluation error");
    const data = await res.json();
    renderVerdict(data);
  } catch (err) {
    alert("Error: " + err.message);
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = `<span>⚡ Verify Answer with Jev</span><span class="shortcut">Enter</span>`;
  }
}

// 5. Render Results
function renderVerdict(data) {
  const v = data.verdict;
  const prims = data.primitives;
  const noul = prims.noul;
  const choice = prims.choice;
  const score = prims.score;

  statLatency.textContent = `Latency: ${data.latency_ms}ms`;
  latencyTag.textContent = `⚡ ~${data.latency_ms}ms System 1`;

  // Verdict Banner State
  const icon = verdictBanner.querySelector(".verdict-icon");
  if (choice.winner === "correct") {
    verdictBanner.className = "verdict-banner correct";
    icon.textContent = "✅";
    verdictTitle.textContent = `CORRECT! (${v.confidence_percent}% Certainty)`;
    verdictDesc.textContent = `Jev evaluated your answer as factually accurate and matching the expected criteria.`;
  } else if (choice.winner === "partially_correct") {
    verdictBanner.className = "verdict-banner partial";
    icon.textContent = "⚠️";
    verdictTitle.textContent = `PARTIALLY CORRECT (${v.confidence_percent}% Match)`;
    verdictDesc.textContent = `Jev detected related keywords, but parts of the expected target are missing or incomplete.`;
  } else {
    verdictBanner.className = "verdict-banner incorrect";
    icon.textContent = "❌";
    verdictTitle.textContent = `INCORRECT (${v.confidence_percent}% Confidence)`;
    verdictDesc.textContent = `Jev calculated that your answer contradicts or misses the expected target.`;
  }

  // 1. Render Noul
  const noulPct = (noul.probability * 100).toFixed(1);
  noulVal.textContent = `${noulPct}%`;
  noulVal.style.color = noul.decision ? "var(--accent-green)" : "var(--accent-rose)";
  noulDecision.textContent = noul.decision ? "POSITIVE (Correct Answer)" : "NEGATIVE (Incorrect Answer)";
  noulDecision.style.color = noul.decision ? "var(--accent-green)" : "var(--accent-rose)";
  noulRaw.textContent = `Calibrated Probability: ${noul.probability.toFixed(4)}`;

  // 2. Render Choice Bars
  const cp = choice.probabilities;
  choiceBars.innerHTML = `
    <div class="c-row">
      <div class="c-meta">
        <span>${choice.winner === "correct" ? "🏆 " : ""}Accurate</span>
        <span>${(cp.correct * 100).toFixed(1)}%</span>
      </div>
      <div class="c-bar-bg">
        <div class="c-bar-fill ${choice.winner === "correct" ? "winner" : ""}" style="width: ${(cp.correct * 100).toFixed(1)}%"></div>
      </div>
    </div>
    <div class="c-row">
      <div class="c-meta">
        <span>${choice.winner === "partially_correct" ? "🏆 " : ""}Partially Correct</span>
        <span>${(cp.partially_correct * 100).toFixed(1)}%</span>
      </div>
      <div class="c-bar-bg">
        <div class="c-bar-fill" style="width: ${(cp.partially_correct * 100).toFixed(1)}%"></div>
      </div>
    </div>
    <div class="c-row">
      <div class="c-meta">
        <span>${choice.winner === "incorrect" ? "🏆 " : ""}Incorrect</span>
        <span>${(cp.incorrect * 100).toFixed(1)}%</span>
      </div>
      <div class="c-bar-bg">
        <div class="c-bar-fill" style="width: ${(cp.incorrect * 100).toFixed(1)}%; background: var(--accent-rose)"></div>
      </div>
    </div>
  `;

  // 3. Render Score
  scoreVal.textContent = score.score.toFixed(2);
  const pinLeft = Math.min(100, Math.max(0, (score.score / score.max_score) * 100));
  scorePin.style.left = `${pinLeft}%`;
}

// Listeners
btnToggleAnswer.addEventListener("click", () => {
  const isHidden = expectedAnswerBox.classList.contains("hidden");
  if (isHidden) {
    expectedAnswerBox.classList.remove("hidden");
    btnToggleAnswer.textContent = "Hide Expected Answer 🙈";
  } else {
    expectedAnswerBox.classList.add("hidden");
    btnToggleAnswer.textContent = "Show Expected Answer 👁️";
  }
});

btnSubmit.addEventListener("click", verifyAnswer);

userAnswerInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    verifyAnswer();
  }
});

// Boot
loadQuestions();
