const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


const skillProfiles = {
  Python: {
    demand: 92,
    risk: 18,
    sustainability: 86,
    salaryRange: "$90k - $150k",
    salaryTrend: "Steady growth",
    recommendations: ["Machine Learning", "Data Engineering", "Automation"]
  },
  Java: {
    demand: 72,
    risk: 30,
    sustainability: 68,
    salaryRange: "$85k - $140k",
    salaryTrend: "Stable",
    recommendations: ["Kotlin", "Cloud Architecture", "Microservices"]
  },
  SQL: {
    demand: 80,
    risk: 22,
    sustainability: 78,
    salaryRange: "$75k - $125k",
    salaryTrend: "Positive",
    recommendations: ["Data Analysis", "Data Engineering", "BI Tools"]
  },
  React: {
    demand: 88,
    risk: 25,
    sustainability: 80,
    salaryRange: "$95k - $155k",
    salaryTrend: "Growing",
    recommendations: ["Next.js", "TypeScript", "Frontend Architecture"]
  },
  Angular: {
    demand: 70,
    risk: 42,
    sustainability: 60,
    salaryRange: "$85k - $135k",
    salaryTrend: "Moderate",
    recommendations: ["React", "Vue", "Web Components"]
  },
  PHP: {
    demand: 48,
    risk: 62,
    sustainability: 44,
    salaryRange: "$65k - $110k",
    salaryTrend: "Mild decline",
    recommendations: ["Laravel", "Backend APIs", "Cloud Migration"]
  },
  "Machine Learning": {
    demand: 94,
    risk: 12,
    sustainability: 90,
    salaryRange: "$110k - $180k",
    salaryTrend: "Rapid growth",
    recommendations: ["Deep Learning", "AI Ethics", "MLOps"]
  },
  "Data Analysis": {
    demand: 78,
    risk: 26,
    sustainability: 75,
    salaryRange: "$80k - $130k",
    salaryTrend: "Positive",
    recommendations: ["Python", "SQL", "Tableau"]
  },
  Cloud: {
    demand: 92,
    risk: 20,
    sustainability: 88,
    salaryRange: "$105k - $170k",
    salaryTrend: "Growing",
    recommendations: ["AWS", "Azure", "Terraform"]
  },
  AWS: {
    demand: 90,
    risk: 18,
    sustainability: 87,
    salaryRange: "$110k - $175k",
    salaryTrend: "Strong growth",
    recommendations: ["Cloud Security", "Kubernetes", "DevOps"]
  },
  Azure: {
    demand: 84,
    risk: 22,
    sustainability: 82,
    salaryRange: "$100k - $165k",
    salaryTrend: "Growing",
    recommendations: ["Azure DevOps", "Cloud Architecture", "Security"]
  },
  Automation: {
    demand: 76,
    risk: 28,
    sustainability: 72,
    salaryRange: "$90k - $145k",
    salaryTrend: "Positive",
    recommendations: ["RPA", "Python", "DevOps"]
  },
  Testing: {
    demand: 69,
    risk: 34,
    sustainability: 62,
    salaryRange: "$75k - $125k",
    salaryTrend: "Stable",
    recommendations: ["Automation", "SDET", "Quality Engineering"]
  },
  DevOps: {
    demand: 91,
    risk: 16,
    sustainability: 89,
    salaryRange: "$105k - $170k",
    salaryTrend: "Strong growth",
    recommendations: ["Kubernetes", "CI/CD", "Cloud"]
  },
  Cybersecurity: {
    demand: 93,
    risk: 14,
    sustainability: 90,
    salaryRange: "$110k - $180k",
    salaryTrend: "Rapid growth",
    recommendations: ["Cloud Security", "Identity Management", "Risk Assessment"]
  },
  "UI/UX Design": {
    demand: 72,
    risk: 34,
    sustainability: 66,
    salaryRange: "$75k - $130k",
    salaryTrend: "Positive",
    recommendations: ["Product Design", "Figma", "Accessibility"]
  },
  Blockchain: {
    demand: 55,
    risk: 50,
    sustainability: 52,
    salaryRange: "$90k - $150k",
    salaryTrend: "Volatile",
    recommendations: ["Smart Contracts", "Cryptography", "Web3"]
  },
  "Data Engineering": {
    demand: 89,
    risk: 18,
    sustainability: 86,
    salaryRange: "$105k - $170k",
    salaryTrend: "Growing",
    recommendations: ["ETL", "Big Data", "Cloud Data Platforms"]
  },
  AI: {
    demand: 95,
    risk: 10,
    sustainability: 92,
    salaryRange: "$120k - $190k",
    salaryTrend: "Very strong",
    recommendations: ["Machine Learning", "NLP", "MLOps"]
  },
  "Mobile Development": {
    demand: 68,
    risk: 40,
    sustainability: 62,
    salaryRange: "$85k - $140k",
    salaryTrend: "Stable",
    recommendations: ["React Native", "Flutter", "Cross-platform"]
  }
};

const skillHistory = require("./skill_history.json");

const industryModifiers = {
  Technology: 0,
  Finance: -2,
  Healthcare: 2,
  Consulting: -1,
  Education: -3,
  Retail: -4,
  Manufacturing: -3
};

const experienceModifiers = {
  Entry: -6,
  Mid: 0,
  Senior: 5,
  Executive: 8
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function scoreToLevel(score) {
  if (score >= 80) return "High";
  if (score >= 50) return "Medium";
  return "Low";
}

function buildTrendArray(baseDemand) {
  const trend = [
    clamp(baseDemand - 6, 10, 100),
    clamp(baseDemand + 4, 10, 100),
    clamp(baseDemand + 10, 10, 100),
    clamp(baseDemand + 16, 10, 100)
  ];
  return trend;
}

function getSkillHistory(skill) {
  const canonical = getCanonicalSkill(skill);
  return skillHistory[canonical] || [];
}

function getCanonicalSkill(skill) {
  const normalized = skill.trim().toLowerCase();
  const exact = Object.keys(skillProfiles).find(key => key.toLowerCase() === normalized);
  return exact || skill.trim();
}

function createSkillAnalysis(skill, experience, industry) {
  const canonicalSkill = getCanonicalSkill(skill);
  const profile = skillProfiles[canonicalSkill] || {
    demand: 68,
    risk: 32,
    sustainability: 64,
    salaryRange: "$70k - $120k",
    salaryTrend: "Moderate",
    recommendations: ["Upskill with adjacent technologies", "Focus on automation", "Learn cloud fundamentals"]
  };

  const industryAdjustment = industryModifiers[industry] ?? 0;
  const experienceAdjustment = experienceModifiers[experience] ?? 0;

  const demandScore = clamp(profile.demand + industryAdjustment + Math.round(experienceAdjustment / 2), 10, 100);
  const riskScore = clamp(profile.risk - Math.round(experienceAdjustment / 3) - Math.sign(industryAdjustment) * 1, 5, 95);
  const sustainabilityScore = clamp(profile.sustainability + Math.round(experienceAdjustment / 2) + (industryAdjustment > 0 ? 2 : 0), 10, 100);

  const demandLevel = scoreToLevel(demandScore);
  const riskLevel = scoreToLevel(100 - riskScore);

  const status = sustainabilityScore >= 80 ? "Future-proof" : sustainabilityScore >= 55 ? "Stable" : "Needs attention";
  const jobGrowth = demandScore >= 85 ? "Strong" : demandScore >= 65 ? "Moderate" : "Mild";
  const history = getSkillHistory(canonicalSkill);

  return {
    skill: canonicalSkill,
    experience,
    industry,
    demand_level: demandLevel,
    risk_level: riskLevel,
    job_growth: `${jobGrowth} growth`,
    status,
    sustainability_score: sustainabilityScore,
    salary_range: profile.salaryRange,
    salary_trend: profile.salaryTrend,
    recommendations: profile.recommendations,
    trend: history.length >= 4 ? history.slice(-4).map(item => item.demand) : buildTrendArray(demandScore),
    history,
    risk: `${riskScore}%`,
    error: null
  };
}

app.get("/analyze/:skill", (req, res) => {
  const skill = req.params.skill || "Unknown";
  const experience = req.query.experience || "Mid";
  const industry = req.query.industry || "Technology";

  if (!skill.trim()) {
    return res.status(400).json({ error: "Skill name is required." });
  }

  try {
    const analysis = createSkillAnalysis(skill, experience, industry);
    res.json(analysis);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to generate skill analysis." });
  }
});

app.get("/compare", (req, res) => {
  const skill1 = req.query.skill1 || "";
  const skill2 = req.query.skill2 || "";
  const experience1 = req.query.experience1 || req.query.experience || "Mid";
  const industry1 = req.query.industry1 || req.query.industry || "Technology";
  const experience2 = req.query.experience2 || req.query.experience || "Mid";
  const industry2 = req.query.industry2 || req.query.industry || "Technology";
  const metric = req.query.metric || "sustainability";

  if (!skill1.trim() || !skill2.trim()) {
    return res.status(400).json({ error: "Both skill1 and skill2 are required." });
  }

  if (skill1.trim().toLowerCase() === skill2.trim().toLowerCase()) {
    return res.status(400).json({ error: "Please compare two different skills." });
  }

  try {
    const analysis1 = createSkillAnalysis(skill1, experience1, industry1);
    const analysis2 = createSkillAnalysis(skill2, experience2, industry2);

    const winner = Number(analysis1.sustainability_score) > Number(analysis2.sustainability_score)
      ? analysis1.skill
      : Number(analysis2.sustainability_score) > Number(analysis1.sustainability_score)
      ? analysis2.skill
      : "Tie";

    res.json({ skill1: analysis1, skill2: analysis2, metric, winner });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to compare skills." });
  }
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, '/')));

// Serve index.html on the root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(`Skill analyzer backend listening on http://localhost:${port}`);
});

// Export the app for Vercel serverless deployment
module.exports = app;