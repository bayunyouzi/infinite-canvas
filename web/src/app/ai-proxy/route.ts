import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AI_PROXY_TIMEOUT_MS = 120000;

export async function GET(request: NextRequest) {
    return proxyRequest(request, "GET");
}

export async function POST(request: NextRequest) {
    return proxyRequest(request, "POST");
}

async function proxyRequest(request: NextRequest, method: string) {
    const target = request.headers.get("x-ai-target") || "";
    if (!target) return new Response("Missing x-ai-target", { status: 400 });

    let targetUrl: URL;
    try {
        targetUrl = new URL(target);
    } catch {
        return new Response("Invalid x-ai-target", { status: 400 });
    }
    if (targetUrl.protocol !== "http:" && targetUrl.protocol !== "https:") {
        return new Response("Unsupported AI target protocol", { status: 400 });
    }

    const path = request.nextUrl.pathname.replace(/^\/ai-proxy/, "");
    targetUrl.pathname = targetUrl.pathname.replace(/\/+$/, "") + path;
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
            return new Response("AI proxy timeout", { status: 504 });
        }
        return new Response(error instanceof Error ? error.message : "AI proxy error", { status: 502 });
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
