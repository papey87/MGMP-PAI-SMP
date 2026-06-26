import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve the uploads directory statically
app.use("/uploads", express.static(uploadDir));

// Endpoint to retrieve APK download metadata (independent of Firebase)
const apkSettingsPath = path.join(uploadDir, "apk-settings.json");

app.get("/api/apk-settings", (req, res) => {
  try {
    if (fs.existsSync(apkSettingsPath)) {
      const data = fs.readFileSync(apkSettingsPath, "utf-8");
      return res.json(JSON.parse(data));
    }
  } catch (err) {
    console.error("Error reading apk-settings.json:", err);
  }
  // Return default fallbacks if no file exists yet
  res.json({
    version: "v1.2.0",
    build: "Build 2026/06",
    filename: "mgmp-pai-subang-v12.apk",
    size: "24.8 MB",
    downloadUrl: "/uploads/mgmp-app.apk"
  });
});

app.post("/api/apk-settings", (req, res) => {
  try {
    const { version, build, filename, size, downloadUrl } = req.body;
    const settings = { version, build, filename, size, downloadUrl };
    fs.writeFileSync(apkSettingsPath, JSON.stringify(settings, null, 2), "utf-8");
    res.json({ success: true, settings });
  } catch (err: any) {
    console.error("Error writing apk-settings.json:", err);
    res.status(500).json({ error: "Gagal menyimpan metadata APK lokal: " + err.message });
  }
});

// Route to handle APK file uploads as a memory-efficient stream with a 100MB limit
app.post(
  "/api/upload-apk",
  (req, res) => {
    console.log("Incoming APK upload request received...");
    try {
      const filename = (req.headers["x-filename"] as string) || "mgmp-app.apk";
      // Sanitize the filename to prevent directory traversal
      const safeFilename = path.basename(filename);
      const targetPath = path.join(uploadDir, safeFilename);

      console.log(`Streaming uploaded file to: ${targetPath}`);
      const writeStream = fs.createWriteStream(targetPath);
      
      let bytesUploaded = 0;
      const limit = 100 * 1024 * 1024; // 100 MB limit
      let aborted = false;

      req.on("data", (chunk) => {
        bytesUploaded += chunk.length;
        if (bytesUploaded > limit && !aborted) {
          aborted = true;
          writeStream.destroy();
          fs.unlink(targetPath, () => {
            console.log("Cleaned up partial file exceeding 100MB limit.");
          });
          res.status(413).json({ error: "Ukuran berkas APK melebihi batas maksimal 100 MB." });
          req.destroy();
        }
      });

      req.pipe(writeStream);

      writeStream.on("finish", () => {
        if (!aborted) {
          console.log(`Successfully streamed and saved APK to ${targetPath}`);
          const downloadUrl = `/uploads/${safeFilename}`;
          res.json({ success: true, downloadUrl, filename: safeFilename });
        }
      });

      writeStream.on("error", (error) => {
        if (!aborted) {
          console.error("Stream error writing APK file:", error);
          res.status(500).json({ error: "Gagal menulis file APK di server." });
        }
      });
    } catch (error: any) {
      console.error("Error setting up stream:", error);
      res.status(500).json({ error: error.message || "Gagal menyimpan berkas APK di server." });
    }
  }
);

// Initialize Gemini API
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API endpoint for AI Sobat Guru PAI
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Pesan tidak boleh kosong" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: "Kunci API Gemini tidak ditemukan di server. Pastikan Anda telah mengonfigurasinya di Secrets." 
      });
    }

    const systemInstruction = 
      "Anda adalah AI Sobat Guru PAI, asisten AI khusus untuk guru Pendidikan Agama Islam (PAI) tingkat SMP (Sekolah Menengah Pertama) di Indonesia. " +
      "Tugas Anda adalah membantu guru merancang modul ajar, rencana pelaksanaan pembelajaran (RPP) Kurikulum Merdeka atau Kurikulum 2013, " +
      "membuat butir soal ujian/kuis interaktif, memberikan ide metode pembelajaran inovatif yang menyenangkan (seperti gamifikasi, diskusi kelompok, atau kisah teladan), " +
      "serta menjelaskan konsep-konsep materi PAI SMP (Al-Qur'an Hadis, Aqidah, Akhlak, Fiqih, Sejarah Peradaban Islam/SPI) secara mendalam namun mudah dipahami anak usia SMP. " +
      "Jawablah selalu dalam bahasa Indonesia yang ramah, profesional, solutif, praktis, dan penuh rasa hormat kepada para guru pejuang pendidikan. " +
      "Berikan contoh-contoh praktis, tabel, atau pemformatan Markdown yang rapi agar guru dapat langsung meng-copy bagian yang mereka butuhkan.";

    // Format chat history for contents
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      });
    }
    
    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error?.message || "Terjadi kesalahan pada sistem kecerdasan buatan." });
  }
});

// Configure Vite middleware or Static files service
async function configureApp() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server komunitas running on port ${PORT}`);
  });
}

configureApp();
