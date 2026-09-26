import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { generateToken, hashPassword, verifyPassword, verifyToken } from "./auth";
import { dbQueries, deleteFileSafely, uploadsDir, type User } from "./db";

const PORT = Number(process.env.PORT) || 3001;

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

function errorResponse(message: string, status = 400) {
  return json({ error: message }, status);
}

function getAuthUser(req: Request): { userId: string; email: string } | null {
  const authHeader = req.headers.get("Authorization");
  let token = "";
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  } else {
    // Check URL query param (needed for direct file downloads and previews in iframes/images)
    const url = new URL(req.url);
    const paramToken = url.searchParams.get("token");
    if (paramToken) {
      token = paramToken;
    }
  }

  if (!token) return null;
  return verifyToken(token);
}

function getMimeType(fileName: string): string {
  const ext = extname(fileName).toLowerCase();
  switch (ext) {
    case ".pdf":
      return "application/pdf";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    case ".txt":
      return "text/plain; charset=utf-8";
    case ".doc":
      return "application/msword";
    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case ".ppt":
      return "application/vnd.ms-powerpoint";
    case ".pptx":
      return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    case ".xls":
      return "application/vnd.ms-excel";
    case ".xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case ".html":
      return "text/html; charset=utf-8";
    case ".js":
      return "application/javascript; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".json":
      return "application/json";
    case ".ico":
      return "image/x-icon";
    default:
      return "application/octet-stream";
  }
}

const ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".xls",
  ".xlsx",
  ".txt",
  ".jpg",
  ".jpeg",
  ".png",
]);

const server = Bun.serve({
  port: PORT,
  maxRequestBodySize: 100 * 1024 * 1024, // 100MB
  async fetch(req) {
    const url = new URL(req.url);
    const method = req.method;
    const pathname = url.pathname;

    // Handle OPTIONS CORS preflight
    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    try {
      // -------------------------------------------------------------
      // STATIC FILES (SPA Production fallback)
      // -------------------------------------------------------------
      if (!pathname.startsWith("/api")) {
        const distDir = join(process.cwd(), "dist");
        if (existsSync(distDir)) {
          let reqPath = pathname === "/" ? "/index.html" : pathname;
          let filePath = join(distDir, reqPath);
          if (!existsSync(filePath)) {
            filePath = join(distDir, "index.html");
          }
          if (existsSync(filePath)) {
            const staticFile = Bun.file(filePath);
            return new Response(staticFile, {
              headers: {
                "Content-Type": getMimeType(filePath),
              },
            });
          }
        }
      }

      // -------------------------------------------------------------
      // 1. AUTHENTICATION ROUTES
      // -------------------------------------------------------------
      if (pathname === "/api/auth/register" && method === "POST") {
        const body = await req.json().catch(() => ({}));
        const { name, email, password, confirmPassword } = body;

        if (!name || typeof name !== "string" || !name.trim()) {
          return errorResponse("Full name is required.");
        }
        if (!email || typeof email !== "string" || !email.includes("@")) {
          return errorResponse("A valid email address is required.");
        }
        if (!password || typeof password !== "string" || password.length < 6) {
          return errorResponse("Password must be at least 6 characters.");
        }
        if (password !== confirmPassword) {
          return errorResponse("Passwords do not match.");
        }

        const normalizedEmail = email.trim().toLowerCase();
        const existing = dbQueries.findUserByEmail.get({ $email: normalizedEmail }) as User | undefined;
        if (existing) {
          return errorResponse("An account with this email already exists.", 409);
        }

        const userId = randomUUID();
        const { hash, salt } = hashPassword(password);
        const createdAt = new Date().toISOString();

        dbQueries.createUser.run({
          $id: userId,
          $name: name.trim(),
          $email: normalizedEmail,
          $password_hash: hash,
          $salt: salt,
          $created_at: createdAt,
        });

        const token = generateToken(userId, normalizedEmail);
        return json({
          token,
          user: {
            id: userId,
            name: name.trim(),
            email: normalizedEmail,
            created_at: createdAt,
          },
        }, 201);
      }

      if (pathname === "/api/auth/login" && method === "POST") {
        const body = await req.json().catch(() => ({}));
        const { email, password } = body;

        if (!email || !password) {
          return errorResponse("Email and password are required.");
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = dbQueries.findUserByEmail.get({ $email: normalizedEmail }) as User | undefined;
        if (!user) {
          return errorResponse("Invalid email or password.", 401);
        }

        const isValid = verifyPassword(password, user.password_hash, user.salt);
        if (!isValid) {
          return errorResponse("Invalid email or password.", 401);
        }

        const token = generateToken(user.id, user.email);
        return json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            created_at: user.created_at,
          },
        });
      }

      // -------------------------------------------------------------
      // PROTECTED ROUTES REQUIRE AUTH
      // -------------------------------------------------------------
      const auth = getAuthUser(req);
      if (!auth) {
        return errorResponse("Unauthorized: Please log in to continue.", 401);
      }
      const userId = auth.userId;

      // GET /api/auth/me
      if (pathname === "/api/auth/me" && method === "GET") {
        const user = dbQueries.findUserById.get({ $id: userId }) as any;
        if (!user) {
          return errorResponse("User not found.", 404);
        }
        const stats = dbQueries.getUserStats.get({ $user_id: userId }) as any;
        return json({
          user,
          stats: {
            total_subjects: stats?.total_subjects || 0,
            total_resources: stats?.total_resources || 0,
          },
        });
      }

      // PATCH /api/auth/profile
      if (pathname === "/api/auth/profile" && method === "PATCH") {
        const body = await req.json().catch(() => ({}));
        const { name } = body;
        if (!name || typeof name !== "string" || !name.trim()) {
          return errorResponse("Name cannot be empty.");
        }
        dbQueries.updateUserName.run({ $id: userId, $name: name.trim() });
        const user = dbQueries.findUserById.get({ $id: userId });
        return json({ user });
      }

      // -------------------------------------------------------------
      // 2. SUBJECTS
      // -------------------------------------------------------------
      // GET /api/subjects
      if (pathname === "/api/subjects" && method === "GET") {
        const subjects = dbQueries.getSubjectsByUser.all({ $user_id: userId });
        return json({ subjects });
      }

      // POST /api/subjects
      if (pathname === "/api/subjects" && method === "POST") {
        const body = await req.json().catch(() => ({}));
        const { name, description } = body;

        if (!name || typeof name !== "string" || !name.trim()) {
          return errorResponse("Subject name is required.");
        }

        const subjectId = randomUUID();
        const createdAt = new Date().toISOString();
        const cleanDesc = description && typeof description === "string" ? description.trim() : null;

        dbQueries.createSubject.run({
          $id: subjectId,
          $user_id: userId,
          $name: name.trim(),
          $description: cleanDesc,
          $created_at: createdAt,
        });

        const created = dbQueries.getSubjectByIdAndUser.get({ $id: subjectId, $user_id: userId });
        return json({ subject: { ...created, resource_count: 0 } }, 201);
      }

      // GET /api/subjects/:id
      const subjectMatch = pathname.match(/^\/api\/subjects\/([a-zA-Z0-9_-]+)$/);
      if (subjectMatch && method === "GET") {
        const subjectId = subjectMatch[1];
        const subject = dbQueries.getSubjectByIdAndUser.get({ $id: subjectId, $user_id: userId }) as any;
        if (!subject) {
          return errorResponse("Subject not found or access denied.", 404);
        }

        const resources = dbQueries.getResourcesBySubject.all({ $subject_id: subjectId, $user_id: userId });
        return json({ subject, resources });
      }

      // DELETE /api/subjects/:id
      if (subjectMatch && method === "DELETE") {
        const subjectId = subjectMatch[1];
        const subject = dbQueries.getSubjectByIdAndUser.get({ $id: subjectId, $user_id: userId });
        if (!subject) {
          return errorResponse("Subject not found or access denied.", 404);
        }

        // Clean up all physical files associated with this subject's resources
        const resources = dbQueries.getResourcesBySubjectId.all({ $subject_id: subjectId, $user_id: userId }) as any[];
        for (const res of resources) {
          if (res.storage_path) {
            deleteFileSafely(res.storage_path);
          }
        }

        dbQueries.deleteSubject.run({ $id: subjectId, $user_id: userId });
        return json({ success: true, message: "Subject and all associated resources deleted." });
      }

      // -------------------------------------------------------------
      // 3. RESOURCES & UPLOADS
      // -------------------------------------------------------------
      // POST /api/subjects/:id/resources (File Upload)
      const uploadMatch = pathname.match(/^\/api\/subjects\/([a-zA-Z0-9_-]+)\/resources$/);
      if (uploadMatch && method === "POST") {
        const subjectId = uploadMatch[1];
        const subject = dbQueries.getSubjectByIdAndUser.get({ $id: subjectId, $user_id: userId });
        if (!subject) {
          return errorResponse("Subject not found or access denied.", 404);
        }

        const formData = await req.formData().catch(() => null);
        if (!formData) {
          return errorResponse("Invalid form data submission.");
        }

        const file = formData.get("file");
        if (!file || !(file instanceof File)) {
          return errorResponse("No file provided for upload.");
        }

        const rawFileName = file.name || "unnamed_file";
        const fileExt = extname(rawFileName).toLowerCase();

        if (!ALLOWED_EXTENSIONS.has(fileExt)) {
          return errorResponse(
            `Unsupported file type (${fileExt || "unknown"}). Allowed formats: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, JPG, PNG.`
          );
        }

        const maxSizeBytes = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSizeBytes) {
          return errorResponse("File is too large. Maximum file size is 50MB.");
        }

        const resourceId = randomUUID();
        const safeBaseName = basename(rawFileName, fileExt).replace(/[^a-zA-Z0-9_-]/g, "_");
        const storedFileName = `${resourceId}_${safeBaseName}${fileExt}`;
        const storagePath = join(uploadsDir, storedFileName);

        const arrayBuffer = await file.arrayBuffer();
        await Bun.write(storagePath, arrayBuffer);

        const createdAt = new Date().toISOString();
        const fileType = fileExt.replace(".", "").toUpperCase();

        dbQueries.createResource.run({
          $id: resourceId,
          $subject_id: subjectId,
          $user_id: userId,
          $file_name: rawFileName,
          $file_type: fileType,
          $file_size: file.size,
          $storage_path: storagePath,
          $created_at: createdAt,
        });

        const createdResource = dbQueries.getResourceByIdAndUser.get({ $id: resourceId, $user_id: userId });
        return json({ resource: createdResource }, 201);
      }

      // GET /api/resources/recent
      if (pathname === "/api/resources/recent" && method === "GET") {
        const limit = Number(url.searchParams.get("limit")) || 6;
        const resources = dbQueries.getRecentResourcesByUser.all({ $user_id: userId, $limit: limit });
        return json({ resources });
      }

      // DELETE /api/resources/:id
      const resourceDeleteMatch = pathname.match(/^\/api\/resources\/([a-zA-Z0-9_-]+)$/);
      if (resourceDeleteMatch && method === "DELETE") {
        const resourceId = resourceDeleteMatch[1];
        const resource = dbQueries.getResourceByIdAndUser.get({ $id: resourceId, $user_id: userId }) as any;
        if (!resource) {
          return errorResponse("Resource not found or access denied.", 404);
        }

        deleteFileSafely(resource.storage_path);
        dbQueries.deleteResource.run({ $id: resourceId, $user_id: userId });
        return json({ success: true, message: "Resource deleted successfully." });
      }

      // GET /api/resources/:id/download
      const resourceDownloadMatch = pathname.match(/^\/api\/resources\/([a-zA-Z0-9_-]+)\/download$/);
      if (resourceDownloadMatch && method === "GET") {
        const resourceId = resourceDownloadMatch[1];
        const resource = dbQueries.getResourceByIdAndUser.get({ $id: resourceId, $user_id: userId }) as any;
        if (!resource) {
          return errorResponse("Resource not found or access denied.", 404);
        }

        if (!existsSync(resource.storage_path)) {
          return errorResponse("File is missing on storage disk.", 404);
        }

        const file = Bun.file(resource.storage_path);
        const encodedFilename = encodeURIComponent(resource.file_name);

        return new Response(file, {
          headers: {
            "Content-Type": getMimeType(resource.file_name),
            "Content-Disposition": `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
            "Content-Length": String(resource.file_size),
          },
        });
      }

      // GET /api/resources/:id/view
      const resourceViewMatch = pathname.match(/^\/api\/resources\/([a-zA-Z0-9_-]+)\/view$/);
      if (resourceViewMatch && method === "GET") {
        const resourceId = resourceViewMatch[1];
        const resource = dbQueries.getResourceByIdAndUser.get({ $id: resourceId, $user_id: userId }) as any;
        if (!resource) {
          return errorResponse("Resource not found or access denied.", 404);
        }

        if (!existsSync(resource.storage_path)) {
          return errorResponse("File is missing on storage disk.", 404);
        }

        const file = Bun.file(resource.storage_path);
        const mimeType = getMimeType(resource.file_name);

        return new Response(file, {
          headers: {
            "Content-Type": mimeType,
            "Content-Disposition": `inline; filename="${encodeURIComponent(resource.file_name)}"`,
            "Content-Length": String(resource.file_size),
          },
        });
      }

      // -------------------------------------------------------------
      // 4. GLOBAL SEARCH
      // -------------------------------------------------------------
      if (pathname === "/api/search" && method === "GET") {
        const q = url.searchParams.get("q") || "";
        if (!q.trim()) {
          return json({ subjects: [], resources: [] });
        }

        const searchPattern = `%${q.trim()}%`;
        const subjects = dbQueries.searchSubjects.all({ $user_id: userId, $query: searchPattern });
        const resources = dbQueries.searchResources.all({ $user_id: userId, $query: searchPattern });

        return json({ subjects, resources });
      }

      return errorResponse("Endpoint not found.", 404);
    } catch (err: any) {
      console.error("API Server Error:", err);
      return errorResponse(err?.message || "Internal server error", 500);
    }
  },
});

console.log(`Academic Notes API Server running at http://localhost:${PORT}`);
