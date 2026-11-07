import dns from 'node:dns/promises';
import { URL } from 'node:url';

export interface ExtractedUrlResult {
  url: string;
  title: string;
  content: string;
}

export class UrlExtractorService {
  private isPrivateIp(ip: string): boolean {
    // IPv4 private ranges & loopback
    if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;
    if (ip.startsWith('10.') || ip.startsWith('192.168.')) return true;
    if (ip.startsWith('172.')) {
      const parts = ip.split('.');
      const second = Number.parseInt(parts[1], 10);
      if (second >= 16 && second <= 31) return true;
    }
    // Link local / Cloud metadata 169.254.x.x
    if (ip.startsWith('169.254.')) return true;
    // 0.0.0.0
    if (ip === '0.0.0.0') return true;
    return false;
  }

  async validateUrl(urlString: string): Promise<URL> {
    let parsed: URL;
    try {
      parsed = new URL(urlString);
    } catch {
      throw new Error('Invalid URL format');
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('Only HTTP and HTTPS protocols are allowed');
    }

    const hostname = parsed.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
      throw new Error('Access to local network destinations is blocked');
    }

    // SSRF DNS lookup check
    try {
      const addresses = await dns.lookup(hostname, { all: true });
      for (const addr of addresses) {
        if (this.isPrivateIp(addr.address)) {
          throw new Error('Target resolves to a restricted internal or private IP address');
        }
      }
    } catch (err: any) {
      if (err.message && err.message.includes('restricted internal')) {
        throw err;
      }
      throw new Error(`DNS resolution failed for host: ${hostname}`);
    }

    return parsed;
  }

  async extractContent(urlString: string): Promise<ExtractedUrlResult> {
    const validUrl = await this.validateUrl(urlString);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    let response: Response;
    try {
      response = await fetch(validUrl.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Evolyn-Governance-Bot/1.0',
          Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9',
        },
        redirect: 'follow',
      });
    } catch (fetchErr: any) {
      throw new Error(`Failed to fetch URL: ${fetchErr.message || 'Request failed'}`);
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: HTTP ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      throw new Error('Unsupported content type. URL must return HTML or plain text');
    }

    const rawHtml = await response.text();

    // Extract title
    const titleMatch = rawHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : validUrl.hostname;

    // Strip script, style, head, noscript, svg, etc.
    let text = rawHtml
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();

    if (!text || text.length < 20) {
      throw new Error('Could not extract meaningful text from the provided URL');
    }

    // Limit extracted text to first 10,000 characters to prevent overflow
    if (text.length > 10000) {
      text = text.substring(0, 10000) + '...';
    }

    return {
      url: validUrl.toString(),
      title,
      content: text,
    };
  }
}

export const urlExtractorService = new UrlExtractorService();

