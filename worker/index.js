/**
 * Arcade Edition — Cloudflare Worker
 * For You, Always. (v1.0)
 */

export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // ── POST /upload ────────────────────────────────────────
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

        // URL langsung ke file (butuh setup R2 custom domain/public access)
        const publicUrl = `https://arcade-storage.for-you-always.my.id/${filename}`;

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

    return new Response("Arcade Edition API Running", {
      headers: { ...corsHeaders, "Content-Type": "text/plain" }
    });
  }
};
