import { proxyRequest } from "../../api/proxy";
export const GET = (request: Request) => proxyRequest(request);
export const POST = (request: Request) => proxyRequest(request);
