import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { createSignalsMcpServer } from "@/mcp/server";

void createSignalsMcpServer().connect(new StdioServerTransport());
