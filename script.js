// 
// BACKEND API CONFIG

const apiBase = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://localhost:3000" : "";

// 
// GLOBAL CHART INSTANCES
// 
let trendChartInstance = null;
let sustainabilityChartInstance = null;
let compareChartInstance = null;

const FAVORITE_STORAGE_KEY = "projexaFavoriteSkills";
const RECENT_STORAGE_KEY = "projexaRecentSkills";

//   
// TAB NAVIGATION
//   
function showAnalyzeTab() {
  const mainSection = document.getElementById("mainSection");
  const compareSection = document.getElementById("compareSection");

  mainSection.classList.remove("hidden");
  compareSection.classList.add("hidden");

  document.getElementById("navAnalyze").classList.add("active");
  document.getElementById("navCompare").classList.remove("active");
}

function showCompareTab() {
  const mainSection = document.getElementById("mainSection");
  const compareSection = document.getElementById("compareSection");

  mainSection.classList.add("hidden");
  compareSection.classList.remove("hidden");

  document.getElementById("navCompare").classList.add("active");
  document.getElementById("navAnalyze").classList.remove("active");
}

//   
// MAIN SKILL ANALYSIS
//   
async function analyzeSkill() {
  const skill = getSelectedSkill();
  const experience = document.getElementById("experience").value;
  const industry = document.getElementById("industry").value;
  const spinner = document.getElementById("loadingSpinner");
  const analyzeBtn = document.getElementById("analyzeButton");
  const copyBtn = document.getElementById("copySummaryBtn");
  const favoriteBtn = document.getElementById("favoriteBtn");

  if (!skill) {
    alert("Please select or type a skill to analyze.");
    return;
  }

  spinner.classList.remove("hidden");
  analyzeBtn.disabled = true;
  copyBtn.disabled = true;
  favoriteBtn.disabled = true;

  try {
    const data = await fetchAnalysis(skill, experience, industry);

    if (data.error) {
      alert(data.error);
      return;
    }

    let html = `
      <p><strong>Skill:</strong> ${data.skill}</p>
      <p><strong>Industry Focus:</strong> ${industry}</p>
      <p><strong>Experience Level:</strong> ${experience}</p>
      <p><strong>Job Growth:</strong> ${data.job_growth}</p>

      <p>
        <strong class="tooltip" title="Current job market demand trend">
          Demand Level:
        </strong>
        <span class="badge ${String(data.demand_level).replace(/\s+/g, "-").toLowerCase()}">
          ${data.demand_level}
        </span>
      </p>

      <p><strong>Obsolescence Risk:</strong> ${data.risk}</p>

      <p>
        <strong class="tooltip" title="Likelihood of skill becoming obsolete">
          Risk Level:
        </strong>
        <span class="badge ${String(data.risk_level).replace(/\s+/g, "-").toLowerCase()}">
          ${data.risk_level}
        </span>
      </p>

      <p><strong>Status:</strong> ${data.status}</p>

      <p>
        <strong>Career Sustainability Score:</strong>
        <span id="sustainabilityCounter">0</span> / 100
      </p>
    `;

    if (Array.isArray(data.recommendations) && data.recommendations.length) {
      html += `<h4>🚀 Recommended Future Skills</h4><ul>`;
      data.recommendations.forEach(recommendation => {
        html += `<li>${recommendation}</li>`;
      });
      html += `</ul>`;
    }

    document.getElementById("textResults").innerHTML = html;
    document.getElementById("resultBox").style.display = "block";

    animateCounter("sustainabilityCounter", Number(data.sustainability_score) || 0);
    drawTrendChart(data.skill, Array.isArray(data.trend) ? data.trend : [25, 45, 60, 80]);
    drawSustainabilityChart(Number(data.sustainability_score) || 0);
    updateInfoCards(data, industry, experience);
    saveRecentSkill(data.skill);

    copyBtn.disabled = false;
    favoriteBtn.disabled = false;
  } catch (error) {
    alert(`❌ Unable to analyze skill: ${error.message}`);
  } finally {
    spinner.classList.add("hidden");
    analyzeBtn.disabled = false;
  }
}

//   
// ANIMATED COUNTER
//   
function animateCounter(elementId, target) {
  const el = document.getElementById(elementId);
  if (!el) return;

  let current = 0;
  const value = Number(target) || 0;
  const step = Math.max(1, Math.floor(value / 25));

  const interval = setInterval(() => {
    current += step;
    if (current >= value) {
      current = value;
      clearInterval(interval);
    }
    el.innerText = current;
  }, 25);
}

//   
// CHARTS
//   
function drawTrendChart(skill, trendData) {
  const ctx = document.getElementById("trendChart").getContext("2d");
  if (trendChartInstance) trendChartInstance.destroy();

  trendChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: ["Q1", "Q2", "Q3", "Q4"],
      datasets: [{
        label: `${skill} Demand Trend`,
        data: trendData,
        tension: 0.4,
        borderWidth: 2,
        borderColor: "#ec4899",
        backgroundColor: "rgba(236,72,153,0.2)",
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true }
      }
    }
  });
}

function drawSustainabilityChart(score) {
  const ctx = document.getElementById("sustainabilityChart").getContext("2d");
  if (sustainabilityChartInstance) sustainabilityChartInstance.destroy();

  const value = Number(score) || 0;
  let color = "#ef4444";
  let label = "Low Sustainability";

  if (value >= 70) {
    color = "#22c55e";
    label = "High Sustainability";
  } else if (value >= 40) {
    color = "#eab308";
    label = "Medium Sustainability";
  }

  sustainabilityChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: [label],
      datasets: [
        { label: "Score", data: [value], backgroundColor: color }
      ]
    },
    options: {
      indexAxis: "y",
      scales: {
        x: { beginAtZero: true, max: 100 },
        y: { beginAtZero: true }
      }
    }
  });
}

//   
// COMPARE SKILLS
//   
async function compareSkills() {
  const skill1 = document.getElementById("skill1").value;
  const skill2 = document.getElementById("skill2").value;
  const metric = document.getElementById("compareMetric").value;
  const experience1 = document.getElementById("experience1").value;
  const industry1 = document.getElementById("industry1").value;
  const experience2 = document.getElementById("experience2").value;
  const industry2 = document.getElementById("industry2").value;

  if (!skill1 || !skill2 || skill1 === skill2) {
    alert("Please select two different skills to compare.");
    return;
  }

  try {
    const data = await fetchCompare(skill1, skill2, metric, experience1, industry1, experience2, industry2);

    drawCompareChart(data.skill1, data.skill2, metric);
    fillCompareTable(data.skill1, data.skill2);
    updateCompareInsights(data.skill1, data.skill2, metric);
  } catch (error) {
    if (error.message.includes("404")) {
      const [analysis1, analysis2] = await Promise.all([
        fetchAnalysis(skill1, experience1, industry1),
        fetchAnalysis(skill2, experience2, industry2)
      ]);

      drawCompareChart(analysis1, analysis2, metric);
      fillCompareTable(analysis1, analysis2);
      updateCompareInsights(analysis1, analysis2, metric);
    } else {
      alert(`❌ Compare failed: ${error.message}`);
    }
  }
}

function fetchCompare(skill1, skill2, metric, experience1 = "Mid", industry1 = "Technology", experience2 = "Mid", industry2 = "Technology") {
  const url = `${apiBase}/compare?skill1=${encodeURIComponent(skill1)}&skill2=${encodeURIComponent(skill2)}&metric=${encodeURIComponent(metric)}&experience1=${encodeURIComponent(experience1)}&industry1=${encodeURIComponent(industry1)}&experience2=${encodeURIComponent(experience2)}&industry2=${encodeURIComponent(industry2)}`;
  return fetch(url)
    .then(response => {
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      return response.json();
    });
}

function drawCompareChart(d1, d2, metric) {
  const ctx = document.getElementById("compareChart").getContext("2d");
  if (compareChartInstance) compareChartInstance.destroy();

  const metricLabel = {
    sustainability: "Sustainability Score",
    demand: "Demand Level",
    risk: "Risk Level"
  }[metric];

  const values = [
    metric === "sustainability" ? Number(d1.sustainability_score) : metricToScore(d1[`${metric}_level`] || d1[metric]),
    metric === "sustainability" ? Number(d2.sustainability_score) : metricToScore(d2[`${metric}_level`] || d2[metric])
  ];

  compareChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: [d1.skill, d2.skill],
      datasets: [{
        label: metricLabel,
        data: values,
        backgroundColor: ["#a855f7", "#ec4899"],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, max: 100, ticks: { stepSize: 10 } }
      }
    }
  });
}

function metricToScore(value) {
  if (typeof value === "number") return value;
  const normalized = String(value).trim().toLowerCase();
  if (normalized.includes("high")) return 90;
  if (normalized.includes("medium") || normalized.includes("mid")) return 60;
  if (normalized.includes("low")) return 30;
  return 50;
}

function fillCompareTable(d1, d2) {
  document.getElementById("skillAName").innerText = d1.skill;
  document.getElementById("skillBName").innerText = d2.skill;

  document.getElementById("skillAScore").innerText = d1.sustainability_score;
  document.getElementById("skillBScore").innerText = d2.sustainability_score;
  document.getElementById("skillARisk").innerText = d1.risk_level;
  document.getElementById("skillBRisk").innerText = d2.risk_level;
  document.getElementById("skillADemand").innerText = d1.demand_level;
  document.getElementById("skillBDemand").innerText = d2.demand_level;

  document.getElementById("winnerText").innerText =
    Number(d1.sustainability_score) > Number(d2.sustainability_score)
      ? `🏆 Better Career Choice: ${d1.skill}`
      : Number(d2.sustainability_score) > Number(d1.sustainability_score)
      ? `🏆 Better Career Choice: ${d2.skill}`
      : "🤝 Both skills are equally sustainable";
}

function updateInfoCards(data, industry, experience) {
  const snapshot = document.getElementById("industrySnapshot");
  const salary = document.getElementById("salaryOutlook");

  snapshot.innerHTML = `Top demand for <strong>${data.skill}</strong> in ${industry} at ${experience} level. Current hiring growth: <strong>${data.job_growth}</strong>.`;
  salary.innerHTML = `Estimated salary band: <strong>${data.salary_range || "$60k - $120k"}</strong>. Outlook: <strong>${data.salary_trend || "Stable"}</strong>.`;
}

function updateCompareInsights(d1, d2, metric) {
  const insights = document.getElementById("compareInsights");
  const better = Number(d1.sustainability_score) > Number(d2.sustainability_score) ? d1.skill : d2.skill;
  insights.innerHTML = `Comparing <strong>${d1.skill}</strong> and <strong>${d2.skill}</strong> using <strong>${metric}</strong>. ${better} shows stronger sustainability performance.`;
}

function fetchAnalysis(skill, experience = "Mid", industry = "Technology") {
  return fetch(`${apiBase}/analyze/${encodeURIComponent(skill)}?experience=${encodeURIComponent(experience)}&industry=${encodeURIComponent(industry)}`)
    .then(response => {
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      return response.json();
    });
}


function swapCompareSkills() {
  const skill1 = document.getElementById("skill1");
  const skill2 = document.getElementById("skill2");
  const experience1 = document.getElementById("experience1");
  const experience2 = document.getElementById("experience2");
  const industry1 = document.getElementById("industry1");
  const industry2 = document.getElementById("industry2");

  const skillTemp = skill1.value;
  const expTemp = experience1.value;
  const indTemp = industry1.value;

  skill1.value = skill2.value;
  experience1.value = experience2.value;
  industry1.value = industry2.value;

  skill2.value = skillTemp;
  experience2.value = expTemp;
  industry2.value = indTemp;

  compareSkills();
}

//   
// TEXT AND STORAGE FEATURES
//   
function selectQuickSkill(skill) {
  document.getElementById("skill").value = skill;
  document.getElementById("customSkill").value = "";
}

function copyResultSummary() {
  const text = document.getElementById("textResults").innerText.trim();
  if (!text) {
    alert("No summary available to copy.");
    return;
  }

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => alert("Summary copied to clipboard!"));
  } else {
    window.prompt("Copy the summary below:", text);
  }
}

function saveFavoriteSkill() {
  const skill = getSelectedSkill();
  if (!skill) {
    alert("Select or enter a skill before saving.");
    return;
  }

  const favorites = JSON.parse(localStorage.getItem(FAVORITE_STORAGE_KEY) || "[]");
  if (!favorites.includes(skill)) {
    favorites.unshift(skill);
    if (favorites.length > 12) favorites.pop();
    localStorage.setItem(FAVORITE_STORAGE_KEY, JSON.stringify(favorites));
    updateFavoriteSkillsUI();
    alert(`Saved "${skill}" to favorites.`);
  } else {
    alert(`"${skill}" is already in favorites.`);
  }
}

function saveRecentSkill(skill) {
  const recent = JSON.parse(localStorage.getItem(RECENT_STORAGE_KEY) || "[]");
  const updated = [skill, ...recent.filter(item => item !== skill)];
  if (updated.length > 12) updated.pop();
  localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(updated));
  updateRecentSkillsUI();
}

function getSelectedSkill() {
  const customSkill = document.getElementById("customSkill").value.trim();
  return customSkill || document.getElementById("skill").value;
}

function updateFavoriteSkillsUI() {
  const favorites = JSON.parse(localStorage.getItem(FAVORITE_STORAGE_KEY) || "[]");
  const container = document.getElementById("favoriteSkillsList");

  container.innerHTML = favorites.length
    ? favorites.map(skill => `<button type="button" class="quick-skill-btn" onclick="selectQuickSkill('${skill.replace(/'/g, "\\'")}')">${skill}</button>`).join("")
    : `<span class="text-muted">No favorites saved yet.</span>`;
}

function updateRecentSkillsUI() {
  const recent = JSON.parse(localStorage.getItem(RECENT_STORAGE_KEY) || "[]");
  const container = document.getElementById("recentSkillsList");

  container.innerHTML = recent.length
    ? recent.map(skill => `<button type="button" class="quick-skill-btn" onclick="selectQuickSkill('${skill.replace(/'/g, "\\'")}')">${skill}</button>`).join("")
    : `<span class="text-muted">No recent analyses yet.</span>`;
}

//   
// THEME TOGGLE
//   
function toggleTheme() {
  document.body.classList.toggle("light");
}

//   
// INITIAL LOAD
//   
function initPage() {
  showAnalyzeTab();
  updateFavoriteSkillsUI();
  updateRecentSkillsUI();
}

window.addEventListener("load", initPage);

