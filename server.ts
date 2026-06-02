import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser
  app.use(express.json({ limit: '20mb' }));

  // Create backups directory if not exists
  const backupsDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  // Load Firebase API Key from firebase-applet-config.json safely
  const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
  const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
  const FIREBASE_API_KEY = firebaseConfig.apiKey;

  // Middleware to verify Firebase Auth ID Token (Google Auth JWT)
  async function verifyFirebaseToken(req: any, res: any, next: any) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized. Missing authentication token." });
    }

    const token = authHeader.split(" ")[1];
    try {
      const googleVerifyUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`;
      const verifyRes = await fetch(googleVerifyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
      });

      if (!verifyRes.ok) {
        return res.status(403).json({ error: "Invalid or expired token." });
      }

      const data: any = await verifyRes.json();
      if (!data.users || data.users.length === 0) {
        return res.status(403).json({ error: "User profile not found in verification." });
      }

      // Attach verified Google/Firebase user to the request
      req.user = data.users[0];
      next();
    } catch (error) {
      console.error("Firebase ID Token verification error:", error);
      return res.status(500).json({ error: "Authentication system failure. Could not contact Google Identity service." });
    }
  }

  // Auto-download PWA/Apple icons on server startup from github to guarantee offline availability on iOS/iPhone
  const publicDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const iconsToCache = [
    { filename: "Icon-512x512.png", url: "https://raw.githubusercontent.com/caioloures/flashcards/main/Icon-512x512.png" },
    { filename: "apple-touch-icon.png", url: "https://raw.githubusercontent.com/caioloures/flashcards/main/Icon-512x512.png" }
  ];

  for (const icon of iconsToCache) {
    const iconPath = path.join(publicDir, icon.filename);
    if (!fs.existsSync(iconPath)) {
      try {
        console.log(`Downloading PWA logo asset (${icon.filename}) for relative origin serving...`);
        const res = await fetch(icon.url);
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          fs.writeFileSync(iconPath, Buffer.from(buffer));
          console.log(`PWA logo cached locally under public/${icon.filename}`);
        } else {
          console.error(`PWA logo fetch failed: ${res.statusText}`);
        }
      } catch (err) {
        console.error(`Could not automatic cache PWA logo ${icon.filename}:`, err);
      }
    }
  }

  // ==========================================
  // API ENDPOINTS
  // ==========================================

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Secure TTS proxy endpoint with cache (Merriam-Webster key hidden backend-side)
  const MERRIAM_WEBSTER_API_KEY = '52abf684-e43d-4e13-944f-33d32cd5bcd3';

  app.get("/api/tts", async (req: any, res: any) => {
    const { word } = req.query;
    if (!word || typeof word !== "string") {
      return res.status(400).json({ error: "Missing required query parameter: word" });
    }

    const cleanWord = word.trim().replace(/^to\s+/i, '').replace(/[^a-zA-Z\s\-]/g, '').split(',')[0].trim().toLowerCase();
    if (!cleanWord) {
      return res.status(400).json({ error: "Invalid word structure" });
    }

    const ttsCacheDir = path.join(process.cwd(), "cache", "tts");
    if (!fs.existsSync(ttsCacheDir)) {
      fs.mkdirSync(ttsCacheDir, { recursive: true });
    }

    const cacheFilePath = path.join(ttsCacheDir, `${cleanWord}.mp3`);

    // Serve from cache if already downloaded
    if (fs.existsSync(cacheFilePath)) {
      res.setHeader("Content-Type", "audio/mpeg");
      return res.sendFile(cacheFilePath);
    }

    try {
      // 1. Try Merriam Webster Collegiate reference
      const collegiateUrl = `https://www.dictionaryapi.com/api/v3/references/collegiate/json/${encodeURIComponent(cleanWord)}?key=${MERRIAM_WEBSTER_API_KEY}`;
      const response = await fetch(collegiateUrl);
      if (!response.ok) throw new Error('Collegiate failed');
      const data: any = await response.json();
      
      let audioFileName = '';
      if (Array.isArray(data) && data.length > 0) {
        for (const entry of data) {
          if (entry.hwi && entry.hwi.prs && Array.isArray(entry.hwi.prs)) {
            for (const pr of entry.hwi.prs) {
              if (pr.sound && pr.sound.audio) { audioFileName = pr.sound.audio; break; }
            }
          }
          if (audioFileName) break;
        }
      }

      // 2. Try Learners reference if collegiate fails
      if (!audioFileName) {
        const learnersUrl = `https://www.dictionaryapi.com/api/v3/references/learners/json/${encodeURIComponent(cleanWord)}?key=${MERRIAM_WEBSTER_API_KEY}`;
        const learnersRes = await fetch(learnersUrl);
        if (learnersRes.ok) {
          const learnersData: any = await learnersRes.json();
          if (Array.isArray(learnersData) && learnersData.length > 0) {
            for (const entry of learnersData) {
              if (entry.hwi && entry.hwi.prs && Array.isArray(entry.hwi.prs)) {
                for (const pr of entry.hwi.prs) {
                  if (pr.sound && pr.sound.audio) { audioFileName = pr.sound.audio; break; }
                }
              }
              if (audioFileName) break;
            }
          }
        }
      }

      // Download audio if file name found
      if (audioFileName) {
        let subdir = 'number';
        if (audioFileName.startsWith('bix')) subdir = 'bix';
        else if (audioFileName.startsWith('gg')) subdir = 'gg';
        else if (/^[a-zA-Z]/.test(audioFileName)) subdir = audioFileName.charAt(0).toLowerCase();
        
        const audioUrl = `https://media.merriam-webster.com/audio/prons/en/us/mp3/${subdir}/${audioFileName}.mp3`;
        const audioRes = await fetch(audioUrl);
        if (audioRes.ok) {
          const arrayBuffer = await audioRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          fs.writeFileSync(cacheFilePath, buffer);
          
          res.setHeader("Content-Type", "audio/mpeg");
          return res.send(buffer);
        }
      }

      return res.status(404).json({ error: "Pronunciation audio not found" });
    } catch (err) {
      console.error("TTS Proxy API error:", err);
      return res.status(500).json({ error: "Failed to resolve word pronunciation" });
    }
  });

  // Get backup by username (Securely validates that requested username matches the verified Google Account ID Token)
  app.get("/api/backup/:username", verifyFirebaseToken, (req: any, res: any) => {
    const username = req.params.username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!username) {
      return res.status(400).json({ error: "Invalid username" });
    }

    const tokenEmail = req.user.email || "";
    const expectedUsername = tokenEmail.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");

    // Critical Security Lock: Ensure token owner matches requested resource path
    if (username !== expectedUsername) {
      return res.status(403).json({ error: "Access Denied. You are not authorized to view this backup." });
    }

    const filePath = path.join(backupsDir, `${username}.json`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "No backup found for this username" });
    }

    try {
      const data = fs.readFileSync(filePath, "utf-8");
      return res.json(JSON.parse(data));
    } catch (error) {
      console.error("Error reading backup:", error);
      return res.status(500).json({ error: "Failed to read backup file" });
    }
  });

  // Save/overwrite backup by username (Securely validates Google ID Token match)
  app.post("/api/backup/:username", verifyFirebaseToken, (req: any, res: any) => {
    const username = req.params.username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!username) {
      return res.status(400).json({ error: "Invalid username" });
    }

    const tokenEmail = req.user.email || "";
    const expectedUsername = tokenEmail.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");

    // Critical Security Lock: Ensure token owner matches requested resource path
    if (username !== expectedUsername) {
      return res.status(403).json({ error: "Access Denied. You cannot save backup data for another account." });
    }

    const filePath = path.join(backupsDir, `${username}.json`);
    try {
      const payload = req.body;
      const enrichedPayload = {
        ...payload,
        lastSavedAt: new Date().toISOString(),
        username: username
      };

      fs.writeFileSync(filePath, JSON.stringify(enrichedPayload, null, 2), "utf-8");
      return res.json({ 
        success: true, 
        message: `Backup saved successfully as ${username}.json`,
        lastSavedAt: enrichedPayload.lastSavedAt
      });
    } catch (error) {
      console.error("Error writing backup:", error);
      return res.status(500).json({ error: "Failed to write backup file" });
    }
  });

  // List all backup files in backups dir (Secured: returns user's own backup details or admin-scoped lookups)
  app.get("/api/backups", verifyFirebaseToken, (req: any, res: any) => {
    const tokenEmail = req.user.email || "";
    const expectedUsername = tokenEmail.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");

    try {
      const files = fs.readdirSync(backupsDir);
      const backups = files
        .filter(file => file.endsWith(".json"))
        // Safety filter: standard users can ONLY see their own backup stats
        .filter(file => file.replace(".json", "") === expectedUsername)
        .map(file => {
          const stats = fs.statSync(path.join(backupsDir, file));
          return {
            username: file.replace(".json", ""),
            filename: file,
            sizeBytes: stats.size,
            lastModified: stats.mtime.toISOString()
          };
        });
      return res.json(backups);
    } catch (error) {
      return res.status(500).json({ error: "Failed to list backups" });
    }
  });

  // ==========================================
  // VITE SERVICE / STATIC APP FILES
  // ==========================================

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    const publicPath = path.join(process.cwd(), 'public');
    
    // Serve Vite build output statically
    app.use(express.static(distPath));
    
    // Fallback static files serving from public directory (insulates icons offline downloads)
    app.use(express.static(publicPath));
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
