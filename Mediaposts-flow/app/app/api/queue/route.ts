// ponytail: flat JSON file queue — swap for DB if volume grows
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const QUEUE_FILE = path.join(process.cwd(), "data", "picks-queue.json");

type Job = {
  jobId: string;
  pick: string;
  author: string;
  attachments: { name: string; url: string }[];
  discordMessageId: string;
  queuedAt: string;
  status: "queued" | "claimed" | "done";
};

function readQueue(): Job[] {
  try {
    fs.mkdirSync(path.dirname(QUEUE_FILE), { recursive: true });
    return JSON.parse(fs.readFileSync(QUEUE_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeQueue(jobs: Job[]) {
  fs.mkdirSync(path.dirname(QUEUE_FILE), { recursive: true });
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(jobs, null, 2));
}

// GET /api/queue — list all jobs
export async function GET() {
  return NextResponse.json(readQueue());
}

// POST /api/queue — add a new job from Discord intake
export async function POST(req: Request) {
  const body = await req.json();
  const jobs = readQueue();
  const jobId = String(jobs.length + 1);
  const job: Job = { jobId, status: "queued", ...body };
  jobs.push(job);
  writeQueue(jobs);
  return NextResponse.json({ jobId });
}

// PATCH /api/queue — update job status (claim / done)
export async function PATCH(req: Request) {
  const { jobId, status } = await req.json();
  const jobs = readQueue();
  const job = jobs.find((j) => j.jobId === jobId);
  if (!job) return NextResponse.json({ error: "not found" }, { status: 404 });
  job.status = status;
  writeQueue(jobs);
  return NextResponse.json(job);
}
