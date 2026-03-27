import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { google } from "googleapis";
import z from "zod";
import dotenv from "dotenv";

dotenv.config();

// Create MCP Server Instance
const server = new McpServer({
  name: "calender-mcp",
  version: "1.0.0",
  description: "Calendar MCP Server",
});

// Tool function
async function getCalenderDataByDate(date: string) {
  const calender = google.calendar({
    version: "v3",
    auth: process.env.GOOGLE_API_KEY,
  });

  // Calculate the start and end of the given date (UTC)
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  try {
    const response = await calender.events.list({
      calendarId: process.env.CALENDER_ID,
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = response.data.items || [];

    const mettings = events.map((event) => {
      const start = event.start?.dateTime || event.start?.date;
      return `${event.summary} at ${start}`;
    });

    if (mettings.length === 0) {
      return {
        mettings: [],
      };
    }

    return {
      mettings,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Register the tools
server.registerTool(
  "getCalenderDataByDate",
  {
    description: "Get all calender data by date",
    inputSchema: {
      date: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format, Please provide a valid date string.",
      }),
    },
  },
  async ({ date }) => {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(await getCalenderDataByDate(date)),
        },
      ],
    };
  },
);

// set transfort
async function init() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// call the initialization
init();
