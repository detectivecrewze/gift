/**
 * Arcade Edition — Cloudflare Worker (v2 — Direct Upload with CDN)
 * For You, Always.
 *
 * ARSITEKTUR UPLOAD BARU (v2):
 * Browser → POST /presign → Worker (Generate key & CDN URL, no file transfer)
 * Browser → PUT /upload-direct/:key  → Worker → R2 (Binary stream, no FormData parsing)
 * Kustomer → GET cdn.domain/{key}    → Cloudflare R2 CDN (Direct, super fast)
 */

export default {
  async fetch(request, env) {
    // CDN URL: Domain yang kamu sambungkan ke bucket R2 di Dashboard Cloudflare
    // Ganti ini setelah kamu connect custom domain ke R2.
    const CDN_URL = env.CDN_URL || 'https://arcade-edition.aldoramadhan16.workers.dev/files';

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, Cache-Control",
      "Access-Control-Expose-Headers": "Content-Length, Content-Range",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // ── POST /presign — Minta "tanda tangan" upload ke R2 ──
    // Worker tidak menerima file. Hanya membuat nama file unik & CDN URL.
    if (request.method === "POST" && url.pathname === "/presign") {
      try {
        const body = await request.json().catch(() => ({}));
        const filename = body.filename || 'upload';
        const contentType = body.contentType || 'application/octet-stream';

        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const ext = filename.split('.').pop().toLowerCase();
        const key = `${timestamp}-${randomStr}.${ext}`;

        return new Response(JSON.stringify({
          success: true,
          key,
          publicUrl: `${CDN_URL}/${key}`
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

      } catch (error) {
        return new Response(JSON.stringify({ error: error.message || 'Presign failed' }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // ── PUT /upload-direct/:key — Upload binary langsung ke R2 ──
    // Browser mengirim file mentah (bukan FormData).
    // Worker hanya "menerusin" stream ke R2 — tidak ada parsing memori besar.
    if (request.method === "PUT" && url.pathname.startsWith("/upload-direct/")) {
      try {
        const key = url.pathname.replace("/upload-direct/", "");
        if (!key || key.includes("..") || key.includes("/")) {
          return new Response(JSON.stringify({ error: "Invalid key" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const contentType = request.headers.get("Content-Type") || "application/octet-stream";

        await env.BUCKET.put(key, request.body, {
          httpMetadata: { contentType }
        });

        return new Response(JSON.stringify({
          success: true,
          url: `${CDN_URL}/${key}`
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

      } catch (error) {
        return new Response(JSON.stringify({ error: error.message || "Upload failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // ── POST /upload — (LAMA, sebagai fallback FormData) ────
    // Tetap ada untuk kompatibilitas. Setelah custom domain aktif, ini tidak akan dipakai.
    if (request.method === "POST" && url.pathname === "/upload") {
      try {
        const formData = await request.formData();
        const file = formData.get("file");

        if (!file) {
          return new Response(JSON.stringify({ error: "No file provided" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const ext = file.name.split(".").pop().toLowerCase();
        const filename = `${timestamp}-${randomStr}.${ext}`;

        await env.BUCKET.put(filename, file.stream(), {
          httpMetadata: {
            contentType: file.type || "application/octet-stream"
          }
        });

        const publicUrl = `${CDN_URL}/${filename}`;

        return new Response(JSON.stringify({
          success: true,
          url: publicUrl,
          filename
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

      } catch (error) {
        return new Response(JSON.stringify({ error: error.message || "Upload failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // ── GET /files/:filename — Proxy file dari R2 (fallback) ──
    // Digunakan selama Custom Domain belum dikonfigurasi di Cloudflare.
    // Setelah Custom Domain aktif, semua URL baru langsung mengarah ke CDN.
    if (request.method === "GET" && url.pathname.startsWith("/files/")) {
      const filename = url.pathname.replace("/files/", "");
      try {
        const object = await env.BUCKET.get(filename);
        if (!object) {
          return new Response(JSON.stringify({ error: "File not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const headers = new Headers(corsHeaders);
        object.writeHttpMetadata(headers);
        headers.set("etag", object.httpEtag);
        headers.set("Cache-Control", "public, max-age=31536000, immutable");

        return new Response(object.body, { headers });
      } catch (error) {
        return new Response(JSON.stringify({ error: "Error reading file" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // ── GET /get-config ─────────────────────────────────────
    if (request.method === "GET" && url.pathname === "/get-config") {
      const id = url.searchParams.get("id");
      if (!id) {
        return new Response(JSON.stringify({ error: "Missing 'id'" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      try {
        const data = await env.ARCADE_DATA.get(id);
        if (!data) {
          return new Response(JSON.stringify({ error: "Not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        return new Response(data, {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // ── POST /save-config ───────────────────────────────────
    if (request.method === "POST" && url.pathname === "/save-config") {
      try {
        const body = await request.json();
        const id = body.id || url.searchParams.get("id");

        if (!id) {
          return new Response(JSON.stringify({ error: "Missing 'id'" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        await env.ARCADE_DATA.put(id, JSON.stringify(body));

        return new Response(JSON.stringify({
          success: true,
          message: "Saved!",
          id
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // ── POST /submit-premium (VIP TELEGRAM) ─────────────────
    if (request.method === "POST" && url.pathname === "/submit-premium") {
      try {
        const body = await request.json();
        const id = body.id || url.searchParams.get("id");

        if (!id) {
          return new Response(JSON.stringify({ error: "Missing 'id'" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        // 1. Simpan ke KV Database
        body.submitted_at = new Date().toISOString();
        await env.ARCADE_DATA.put(id, JSON.stringify(body));

        // 2. Kirim ke Telegram Admin
        const botToken = env.TELEGRAM_BOT_TOKEN;
        const chatId = env.TELEGRAM_CHAT_ID;
        
        if (botToken && chatId) {
          const configString = JSON.stringify(body, null, 2);
          const fileContent = `window.STANDALONE_CONFIG = ${configString};`;
          
          const formData = new FormData();
          formData.append('chat_id', chatId);
          formData.append('caption', `🎁 <b>VIP Project Masuk!</b>\n\n<b>ID:</b> <code>${id}</code>\n<b>Nama Penerima:</b> ${body.recipientName || 'N/A'}\n\n<i>Silakan deploy config ini via Premium Kit.</i>`);
          formData.append('parse_mode', 'HTML');
          
          const blob = new Blob([fileContent], { type: 'application/javascript' });
          formData.append('document', blob, `config-${id}.js`);
          
          const tgUrl = `https://api.telegram.org/bot${botToken}/sendDocument`;
          const tgResponse = await fetch(tgUrl, { method: 'POST', body: formData });
          
          if (!tgResponse.ok) {
            console.error('[Telegram Error]', await tgResponse.text());
          }
        }

        return new Response(JSON.stringify({
          success: true,
          message: "VIP Order submitted and sent to Telegram!",
          id
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // ── POST /submit ────────────────────────────────────────
    if (request.method === "POST" && url.pathname === "/submit") {
      try {
        const body = await request.json();
        const id = body.id;

        if (!id) {
          return new Response(JSON.stringify({ error: "Missing 'id'" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        body.submitted_at = new Date().toISOString();
        await env.ARCADE_DATA.put(id, JSON.stringify(body));

        return new Response(JSON.stringify({
          success: true,
          message: "Order submitted!",
          id
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // ── POST /generate-ai — Proxy aman ke Google Gemini API ──
    // API Key TIDAK pernah terekspos ke browser: tersimpan di Cloudflare Secrets.
    if (request.method === "POST" && url.pathname === "/generate-ai") {
      try {
        const apiKey = env.GEMINI_API_KEY;
        if (!apiKey) {
          return new Response(JSON.stringify({ error: "GEMINI_API_KEY belum dikonfigurasi di Cloudflare Secrets." }), {
            status: 503,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const body = await request.json();
        const userPrompt = body.prompt;
        const requestedTone = body.tone || 'romantis';

        if (!userPrompt || typeof userPrompt !== "string" || userPrompt.trim().length === 0) {
          return new Response(JSON.stringify({ error: "Prompt tidak boleh kosong." }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        let toneInstruction = "";
        switch (requestedTone) {
          case 'lucu':
            toneInstruction = "Penulisan bergaya LUCU, SANTAI, dan BERCANDA. Gunakan bahasa gaul anak muda Indonesia, buat pembaca tersenyum atau tertawa kecil. Jangan terlalu serius atau baku.";
            break;
          case 'santai':
            toneInstruction = "Penulisan bergaya SANTAI dan BERSAHABAT. Gunakan kata ganti 'aku' dan 'kamu'. Mengalir natural seperti ngobrol santai dengan teman dekat atau pacar di cafe.";
            break;
          case 'tulus':
            toneInstruction = "Penulisan bergaya FORMAL TAPI TULUS. Gunakan bahasa Indonesia yang baik, sopan, namun tetap menyentuh hati dan sarat makna mendalam. Cocok untuk orang tua, guru, atau atasan.";
            break;
          case 'romantis':
          default:
            toneInstruction = "Penulisan bergaya ROMANTIS ANAK MUDA (usia SMA sampai 27 tahun). Gunakan bahasa gaul kasual sehari-hari tapi rapi (selalu gunakan 'Aku' dan 'Kamu'). Buat pesannya sangat manis, hangat, dan *green flag*, tapi JANGAN terlalu puitis, JANGAN kaku, dan JANGAN cringe/lebay. Bicara seperti pacar yang suportif.";
            break;
        }

        const systemInstruction = `Kamu adalah penulis pesan untuk kado digital "Arcade Edition — For You, Always".
Tugasmu: Tuliskan pesan dari hati yang menyesuaikan dengan gaya berikut: [${toneInstruction}]
ATURAN WAJIB:
1. Panjang pesan harus berkisar antara 60 hingga 80 kata (sekitar 400-500 karakter).
2. Tulis hanya dalam 1 PARAGRAF yang padat dan bermakna.
3. DILARANG KERAS memotong tulisan di tengah kalimat! Pastikan surat diakhiri dengan tanda titik.
4. Buang format markdown (tanpa asterisk, bold, atau pagar).
5. Langsung isi pesan tanpa ada ucapan pengantar.`;

        const combinedPrompt = `${systemInstruction}\n\n[INSTRUKSI/TEMA DARI PENGGUNA:]\n${userPrompt.trim()}`;

        const geminiPayload = {
          contents: [{
            role: "user",
            parts: [{ text: combinedPrompt }]
          }],
          generationConfig: {
            maxOutputTokens: 8192,
            temperature: 0.85,
            topP: 0.95
          }
        };

        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(geminiPayload)
          }
        );

        if (!geminiResponse.ok) {
          const errText = await geminiResponse.text();
          return new Response(JSON.stringify({ error: `Gemini API (Status ${geminiResponse.status}): ${errText.substring(0, 150)}` }), {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const geminiData = await geminiResponse.json();
        const generatedText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

        return new Response(JSON.stringify({ success: true, text: generatedText.trim() }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

      } catch (error) {
        return new Response(JSON.stringify({ error: error.message || "Gagal menghubungi AI." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // ── POST /generator-login ──────────────────────────────
    if (request.method === "POST" && url.pathname === "/generator-login") {
      try {
        const { password } = await request.json();
        const expected = env.GENERATOR_SECRET || "arcade2026";

        if (password === expected) {
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        } else {
          return new Response(JSON.stringify({ success: false, error: "Password salah" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // ── GET /debug ──────────────────────────────────────────
    if (url.pathname === "/debug") {
      return new Response(JSON.stringify({
        version: "v2-direct-upload",
        hasBucket: !!env.BUCKET,
        hasKV: !!env.ARCADE_DATA,
        cdnUrl: env.CDN_URL || '(not set — using worker proxy fallback)',
        url: request.url,
        method: request.method
      }, null, 2), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response("Arcade Edition API v2 Running", {
      headers: { ...corsHeaders, "Content-Type": "text/plain" }
    });
  }
};
