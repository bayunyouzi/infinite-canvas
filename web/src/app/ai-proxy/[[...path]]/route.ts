import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AI_PROXY_TIMEOUT_MS = 120000;

export async function GET(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
    const target = request.headers.get("x-ai-target");
    if (!target) {
        return new Response(JSON.stringify({ ok: true, timestamp: new Date().toISOString(), mode: "ai-proxy" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    }
    return proxyRequest(request, "GET", target, (await params).path);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
    const target = request.headers.get("x-ai-target") || "";
    return proxyRequest(request, "POST", target, (await params).path);
}

async function proxyRequest(request: NextRequest, method: string, target: string, pathSegments?: string[]) {
    if (!target) {
        return new Response(JSON.stringify({ error: "Missing x-ai-target header" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    let targetUrl: URL;
    try {
        targetUrl = new URL(target);
    } catch {
        return new Response(JSON.stringify({ error: "Invalid x-ai-target header" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    if (targetUrl.protocol !== "http:" && targetUrl.protocol !== "https:") {
        return new Response(JSON.stringify({ error: "Unsupported AI target protocol" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const suffix = pathSegments && pathSegments.length > 0 ? `/${pathSegments.join("/")}` : "";
    targetUrl.pathname = targetUrl.pathname.replace(/\/+$/, "") + suffix;
    targetUrl.search = request.nextUrl.search;

    const headers = new Headers();
    const auth = request.headers.get("x-ai-authorization");
    if (auth) headers.set("Authorization", auth);
    const contentType = request.headers.get("content-type");
    if (contentType) headers.set("Content-Type", contentType);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AI_PROXY_TIMEOUT_MS);
    try {
        const body = method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();
        console.log(`[ai-proxy] ${method} ${targetUrl.href}`);
        const response = await fetch(targetUrl, { method, headers, body, signal: controller.signal });
        console.log(`[ai-proxy] ${method} ${targetUrl.href} -> ${response.status}`);
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders(response.headers),
        });
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            return new Response(JSON.stringify({ error: "AI proxy timeout" }), { status: 504, headers: { "Content-Type": "application/json" } });
        }
        const message = error instanceof Error ? error.message : "AI proxy error";
        return new Response(JSON.stringify({ error: message }), { status: 502, headers: { "Content-Type": "application/json" } });
    } finally {
        clearTimeout(timer);
    }
}

function responseHeaders(headers: Headers) {
    const result = new Headers();
    ["content-type", "cache-control", "x-request-id"].forEach((key) => {
        const value = headers.get(key);
        if (value) result.set(key, value);
    });
    return result;
}
