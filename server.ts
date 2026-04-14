import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabaseUrl = process.env.SUPABASE_URL || "https://pxjnagfudscsqgzxwfti.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseServiceKey) {
  console.error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing from environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(express.json());

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Diagnostic: Check Database Tables
app.get("/api/debug/db", async (req, res) => {
  const tables = ["User", "Test", "Question", "Submission"];
  const results: Record<string, any> = {};

  for (const table of tables) {
    const { error } = await supabase.from(table).select("count", { count: "exact", head: true });
    results[table] = error ? { status: "error", ...error } : { status: "ok" };
  }

  res.json(results);
});

// User Management
app.get("/api/me", async (req, res) => {
  const email = req.query.email as string;
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    const { data: user, error } = await supabase
      .from("User")
      .select("*")
      .eq("email", email)
      .single();

    if (error) throw error;
    res.json(user);
  } catch (error: any) {
    res.status(404).json({ error: "User not found" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, name, role } = req.body;
  try {
    let { data: user, error } = await supabase
      .from("User")
      .select("*")
      .eq("email", email)
      .single();

    if (error && error.code === "PGRST116") { // Not found
      const { data: newUser, error: createError } = await supabase
        .from("User")
        .insert([{ email, name, role }])
        .select()
        .single();
      
      if (createError) throw createError;
      user = newUser;
    } else if (error) {
      throw error;
    }

    res.json(user);
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed", details: error.message || error });
  }
});

// Recruiter: Create Test
app.post("/api/tests", async (req, res) => {
  const { title, description, duration, creatorId, questions, category } = req.body;
  
  if (!creatorId) {
    return res.status(400).json({ error: "Missing creatorId. Are you logged in?" });
  }

  try {
    const { data: test, error: testError } = await supabase
      .from("Test")
      .insert([{ title, description, duration, creatorId, category }])
      .select()
      .single();

    if (testError) {
      console.error("Supabase Test Insert Error:", JSON.stringify(testError, null, 2));
      throw testError;
    }

    if (!questions || !Array.isArray(questions)) {
      return res.json(test); // Return test even if no questions provided
    }

    const questionsToInsert = questions.map((q: any) => ({
      testId: test.id,
      text: q.text,
      options: JSON.stringify(q.options),
      correctAnswer: q.correctAnswer,
    }));

    const { error: questionsError } = await supabase
      .from("Question")
      .insert(questionsToInsert);

    if (questionsError) {
      console.error("Supabase Questions Insert Error:", JSON.stringify(questionsError, null, 2));
      throw questionsError;
    }

    res.json(test);
  } catch (error: any) {
    console.error("Create test error:", error);
    res.status(500).json({ 
      error: "Failed to create test", 
      details: error,
      hint: "Check if your Supabase tables match the Prisma schema (capitalized table names and camelCase fields). Ensure Foreign Keys are set up."
    });
  }
});

// Recruiter: Delete Test
app.delete("/api/tests/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Submissions and questions should be deleted by cascade if configured, 
    // but let's be explicit if not.
    await supabase.from("Question").delete().eq("testId", id);
    await supabase.from("Submission").delete().eq("testId", id);
    
    const { error } = await supabase
      .from("Test")
      .delete()
      .eq("id", id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    console.error("Delete test error:", error);
    res.status(500).json({ error: "Failed to delete test", details: error.message || error });
  }
});

// Recruiter: Update Test
app.put("/api/tests/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description, duration, questions, category } = req.body;
  try {
    // Update test details
    const { error: testError } = await supabase
      .from("Test")
      .update({ title, description, duration, category })
      .eq("id", id);

    if (testError) {
      console.error("Supabase Test Update Error:", testError);
      throw testError;
    }

    // Replace questions: delete old ones and insert new ones
    await supabase.from("Question").delete().eq("testId", id);

    if (questions && Array.isArray(questions)) {
      const questionsToInsert = questions.map((q: any) => ({
        testId: id,
        text: q.text,
        options: JSON.stringify(q.options),
        correctAnswer: q.correctAnswer,
      }));

      const { error: questionsError } = await supabase
        .from("Question")
        .insert(questionsToInsert);

      if (questionsError) {
        console.error("Supabase Questions Insert Error:", questionsError);
        throw questionsError;
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("Update test error:", error);
    res.status(500).json({ 
      error: "Failed to update test", 
      details: error.message || error,
      hint: "Check if your Supabase tables match the Prisma schema (capitalized table names and camelCase fields)."
    });
  }
});

// Recruiter: Get Results
app.get("/api/tests/:id/results", async (req, res) => {
  const { id } = req.params;
  try {
    const { data: submissions, error } = await supabase
      .from("Submission")
      .select("*, user:User(*), test:Test(*, questions:Question(*))")
      .eq("testId", id);

    if (error) throw error;
    res.json(submissions || []);
  } catch (error: any) {
    console.error("Fetch results error:", JSON.stringify(error, null, 2));
    res.status(500).json({ error: "Failed to fetch results", details: error.message || error });
  }
});

// Recruiter: Update Recruitment Status
app.patch("/api/submissions/:id/status", async (req, res) => {
  const { id } = req.params;
  const { recruitmentStatus, interviewLink, recruiterNotes } = req.body;
  
  try {
    const { data: updated, error } = await supabase
      .from("Submission")
      .update({ 
        recruitmentStatus, 
        interviewLink, 
        recruiterNotes 
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    
    // Notify recruiter/client via socket if needed
    io.emit("submission_status_updated", { submissionId: id, status: recruitmentStatus });
    
    res.json(updated);
  } catch (error: any) {
    console.error("Update recruitment status error:", error);
    res.status(500).json({ error: "Failed to update status", details: error.message || error });
  }
});

// Student: Get Available Tests
app.get("/api/tests", async (req, res) => {
  try {
    const { data: tests, error } = await supabase
      .from("Test")
      .select("*, questions:Question(*)");

    if (error) {
      console.error("Supabase Fetch Tests Error:", JSON.stringify(error, null, 2));
      throw error;
    }
    res.json(tests || []);
  } catch (error: any) {
    console.error("Fetch tests error:", error);
    res.status(500).json({ 
      error: "Failed to fetch tests", 
      details: error,
      hint: "Check if your Supabase tables match the Prisma schema (capitalized table names and camelCase fields). Ensure Foreign Keys are set up."
    });
  }
});

// Student: Start Test
app.post("/api/submissions/start", async (req, res) => {
  const { userId, testId } = req.body;
  try {
    let { data: submission, error } = await supabase
      .from("Submission")
      .select("*")
      .eq("userId", userId)
      .eq("testId", testId)
      .eq("status", "IN_PROGRESS")
      .single();

    if (error && error.code === "PGRST116") {
      const { data: newSubmission, error: createError } = await supabase
        .from("Submission")
        .insert([{
          userId,
          testId,
          status: "IN_PROGRESS",
          answers: JSON.stringify({}),
          score: 0,
          startedAt: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (createError) throw createError;
      submission = newSubmission;
    } else if (error) {
      throw error;
    }

    res.json(submission);
  } catch (error: any) {
    console.error("Start test error:", error);
    res.status(500).json({ error: "Failed to start test", details: error.message || error });
  }
});

// Student: Save Answer
app.post("/api/submissions/save", async (req, res) => {
  const { submissionId, questionId, selectedOption } = req.body;
  try {
    const { data: submission, error: fetchError } = await supabase
      .from("Submission")
      .select("*")
      .eq("id", submissionId)
      .single();

    if (fetchError || !submission || submission.status !== "IN_PROGRESS") {
      return res.status(400).json({ error: "Invalid submission" });
    }

    const answers = JSON.parse(submission.answers);
    answers[questionId] = selectedOption;

    const { data: updated, error: updateError } = await supabase
      .from("Submission")
      .update({ answers: JSON.stringify(answers) })
      .eq("id", submissionId)
      .select()
      .single();

    if (updateError) throw updateError;
    res.json(updated);
  } catch (error: any) {
    console.error("Save answer error:", error);
    res.status(500).json({ error: "Failed to save answer", details: error.message || error });
  }
});

// Student: Submit Test
app.post("/api/submissions/submit", async (req, res) => {
  const { submissionId } = req.body;
  try {
    const { data: submission, error: fetchError } = await supabase
      .from("Submission")
      .select("*, test:Test(*, questions:Question(*))")
      .eq("id", submissionId)
      .single();

    if (fetchError || !submission || submission.status !== "IN_PROGRESS") {
      return res.status(400).json({ error: "Invalid submission" });
    }

    const now = new Date();
    const startTime = new Date(submission.startedAt);
    const durationMs = submission.test.duration * 60 * 1000;
    const bufferMs = 30000;

    if (now.getTime() > startTime.getTime() + durationMs + bufferMs) {
      console.log("Auto-submitting expired test");
    }

    const userAnswers = JSON.parse(submission.answers);
    const questions = submission.test.questions;
    let correctCount = 0;

    if (questions.length > 0) {
      questions.forEach((q: any) => {
        if (userAnswers[q.id] === q.correctAnswer) {
          correctCount++;
        }
      });
    }

    const score = questions.length > 0 ? (correctCount / questions.length) * 100 : 0;

    const { data: updated, error: updateError } = await supabase
      .from("Submission")
      .update({
        status: "COMPLETED",
        score,
        completedAt: new Date().toISOString(),
      })
      .eq("id", submissionId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Notify recruiter via Socket.io
    io.emit("new_submission", { testId: submission.testId });

    res.json(updated);
  } catch (error: any) {
    console.error("Submit test error:", error);
    res.status(500).json({ error: "Failed to submit test", details: error.message || error });
  }
});

// Student: Get User Submissions
app.get("/api/submissions/user/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const { data: submissions, error } = await supabase
      .from("Submission")
      .select("*, test:Test(*)")
      .eq("userId", userId)
      .order("startedAt", { ascending: false });

    if (error) throw error;
    res.json(submissions || []);
  } catch (error: any) {
    console.error("Fetch user submissions error:", error);
    res.status(500).json({ error: "Failed to fetch submissions", details: error.message || error });
  }
});

// Vite Setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  socket.on("join-test", (testId) => socket.join(testId));
  socket.on("disconnect", () => console.log("User disconnected:", socket.id));
});
