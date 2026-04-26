import express from "express";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabaseUrl = process.env.SUPABASE_URL || "https://pxjnagfudscsqgzxwfti.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const app = express();
app.use(express.json());

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", env: process.env.NODE_ENV });
});

// User Management
app.get("/api/me", async (req, res) => {
  const email = req.query.email as string;
  if (!email) return res.status(400).json({ error: "Email required" });
  try {
    const { data: user, error } = await supabase.from("User").select("*, company:Company(*)").eq("email", email).single();
    if (error) throw error;
    res.json(user);
  } catch (error: any) {
    res.status(404).json({ error: "User not found" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, name, role } = req.body;
  try {
    let { data: user, error } = await supabase.from("User").select("*").eq("email", email).single();
    if (error && error.code === "PGRST116") {
      const { data: newUser, error: createError } = await supabase.from("User").insert([{ email, name, role }]).select().single();
      if (createError) throw createError;
      user = newUser;
    } else if (error) throw error;
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: "Login failed", details: error.message });
  }
});

// Job Management
app.get("/api/jobs", async (req, res) => {
  try {
    const { data: jobs, error } = await supabase.from("Job").select("*, creator:User(*), company:Company(*), fields:JobField(*)").order("createdAt", { ascending: false });
    if (error) throw error;
    res.json(jobs);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

app.post("/api/jobs", async (req, res) => {
  const { title, description, requirements, location, type, salaryRange, creatorId, fields, companyId } = req.body;
  try {
    let finalCompanyId = companyId;
    if (!finalCompanyId) {
      const { data: user } = await supabase.from("User").select("companyId").eq("id", creatorId).single();
      finalCompanyId = user?.companyId;
    }
    const { data: job, error: jobError } = await supabase.from("Job").insert([{ title, description, requirements, location, type, salaryRange, creatorId, companyId: finalCompanyId }]).select().single();
    if (jobError) throw jobError;
    if (fields && Array.isArray(fields)) {
      const fieldsToInsert = fields.map((f: any) => ({
        jobId: job.id, label: f.label, type: f.type || 'text', isRequired: f.isRequired ?? true, options: f.options ? JSON.stringify(f.options) : null
      }));
      await supabase.from("JobField").insert(fieldsToInsert);
    }
    res.json(job);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to create job", details: error });
  }
});

// Companies
app.get("/api/companies/user/:userId", async (req, res) => {
  try {
    const { data: user } = await supabase.from("User").select("companyId").eq("id", req.params.userId).single();
    if (!user?.companyId) return res.json(null);
    const { data, error } = await supabase.from("Company").select("*").eq("id", user.companyId).single();
    if (error) throw error;
    res.json(data);
  } catch (error) { res.json(null); }
});

app.post("/api/companies", async (req, res) => {
  const { id, name, description, website, logo, industry, location, adminId } = req.body;
  try {
    const { data: company, error } = await supabase.from("Company").upsert({ id, name, description, website, logo, industry, location, adminId }).select().single();
    if (error) throw error;
    if (adminId) await supabase.from("User").update({ companyId: company.id }).eq("id", adminId);
    res.json(company);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to save company", details: error });
  }
});

// Profiles
app.get("/api/profiles/:userId", async (req, res) => {
  try {
    const { data, error } = await supabase.from("UserProfile").select("*").eq("userId", req.params.userId).single();
    if (error && error.code === "PGRST116") return res.json({ skills: "[]", education: "[]", experience: "[]" });
    if (error) throw error;
    res.json(data);
  } catch (err) { res.json({ skills: "[]", education: "[]", experience: "[]" }); }
});

app.post("/api/profiles", async (req, res) => {
  const { userId, bio, skills, education, experience, resumeUrl, resumeText } = req.body;
  try {
    const { data, error } = await supabase.from("UserProfile").upsert({ 
      userId, bio, 
      skills: Array.isArray(skills) ? JSON.stringify(skills) : skills, 
      education: Array.isArray(education) ? JSON.stringify(education) : education, 
      experience: Array.isArray(experience) ? JSON.stringify(experience) : experience, 
      resumeUrl, resumeText, updatedAt: new Date().toISOString()
    }).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error: any) { res.status(500).json({ error: "Failed to save profile", details: error }); }
});

// Talent Pool
app.get("/api/talents", async (req, res) => {
  try {
    const { data, error } = await supabase.from("User").select("*, profile:UserProfile(*)").eq("role", "STUDENT");
    if (error) throw error;
    res.json(data);
  } catch (error: any) { res.status(500).json({ error: "Failed to fetch talent pool" }); }
});

// Applications
app.get("/api/applications/user/:userId", async (req, res) => {
  try {
    const { data, error } = await supabase.from("Application").select("*, job:Job(*)").eq("userId", req.params.userId);
    if (error) throw error;
    res.json(data);
  } catch (error: any) { res.status(500).json({ error: "Failed to fetch applications" }); }
});

app.get("/api/jobs/:id/applications", async (req, res) => {
  try {
    const { data, error } = await supabase.from("Application").select("*, user:User(*, profile:UserProfile(*))").eq("jobId", req.params.id);
    if (error) throw error;
    res.json(data);
  } catch (error: any) { res.status(500).json({ error: "Failed to fetch job applications" }); }
});

app.post("/api/jobs/:id/apply", async (req, res) => {
  const { userId, answers, aiScore } = req.body;
  try {
    const { data, error } = await supabase.from("Application").insert([{ jobId: req.params.id, userId, answers: JSON.stringify(answers), aiScore }]).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error: any) { res.status(500).json({ error: "Failed to submit application" }); }
});

app.patch("/api/applications/:id/status", async (req, res) => {
  const { status, recruiterNotes } = req.body;
  try {
    const { data, error } = await supabase.from("Application").update({ status, recruiterNotes }).eq("id", req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error: any) { res.status(500).json({ error: "Failed to update application" }); }
});

// Tests
app.get("/api/tests", async (req, res) => {
  try {
    const { data, error } = await supabase.from("Test").select("*, questions:Question(*)");
    if (error) throw error;
    res.json(data || []);
  } catch (error: any) { res.status(500).json({ error: "Failed to fetch tests" }); }
});

app.post("/api/tests", async (req, res) => {
  const { title, description, duration, creatorId, questions, category } = req.body;
  try {
    const { data: test, error: testError } = await supabase.from("Test").insert([{ title, description, duration, creatorId, category }]).select().single();
    if (testError) throw testError;
    if (questions && Array.isArray(questions)) {
      const qToInsert = questions.map((q: any) => ({
        testId: test.id, text: q.text, options: JSON.stringify(q.options), correctAnswer: q.correctAnswer,
      }));
      await supabase.from("Question").insert(qToInsert);
    }
    res.json(test);
  } catch (error: any) { res.status(500).json({ error: "Failed to create test" }); }
});

app.get("/api/tests/:id/results", async (req, res) => {
  try {
    const { data, error } = await supabase.from("Submission").select("*, user:User(*), test:Test(*, questions:Question(*))").eq("testId", req.params.id);
    if (error) throw error;
    res.json(data || []);
  } catch (error: any) { res.status(500).json({ error: "Failed to fetch results" }); }
});

app.post("/api/submissions/start", async (req, res) => {
  const { userId, testId } = req.body;
  try {
    const { data, error } = await supabase.from("Submission").insert([{
      userId, testId, status: "IN_PROGRESS", answers: JSON.stringify({}), score: 0, startedAt: new Date().toISOString()
    }]).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error: any) { res.status(500).json({ error: "Failed to start test" }); }
});

app.post("/api/submissions/submit", async (req, res) => {
  const { submissionId, answers, score } = req.body;
  try {
    const { data, error } = await supabase.from("Submission").update({
      status: "COMPLETED", score, answers: JSON.stringify(answers), completedAt: new Date().toISOString()
    }).eq("id", submissionId).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error: any) { res.status(500).json({ error: "Failed to submit test" }); }
});

app.get("/api/submissions/user/:userId", async (req, res) => {
  try {
    const { data, error } = await supabase.from("Submission").select("*, test:Test(*)").eq("userId", req.params.userId).order("startedAt", { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (error: any) { res.status(500).json({ error: "Failed to fetch submissions" }); }
});

export default app;
