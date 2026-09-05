// We attach this to the global window object so app.js can access it
window.PORTFOLIO_DATA = {
    name: "Aryus Kumar Samal",
    role: "AI Engineer — ML Systems",
    tagline: "I architect scalable AI systems, specializing in production-grade LLM implementations, autonomous agents, and robust evaluation pipelines.",
    bio: [
      "Building AI systems that go beyond API calls to solve real operational problems with strict guardrails and high observability.",
      "Specializing in multi-agent orchestration, hybrid RAG pipelines, fine-tuning, and deterministic evaluations for non-deterministic models.",
      "Driven by the philosophy that deploying an AI feature is only 10% of the work; the other 90% is making sure it behaves predictably in production."
    ],
    stats: [
      {label:"Projects Shipped", value:"15"},
      {label:"Core Competency", value:"AI Ops"},
      {label:"Go-to Stack", value:"LangGraph"},
      {label:"Focus", value:"Reliability"}
    ],
    skills: [
      {name:"Python", level:95},
      {name:"RAG & VectorDBs", level:92},
      {name:"Multi-Agent (LangGraph)", level:88},
      {name:"LLMOps / CI/CD", level:85},
      {name:"Fine-Tuning (LoRA)", level:82},
      {name:"Systems Design", level:85}
    ],
    projects: [
      { id:"p1", name:"Regression Detection",
        blurb:"A CI/CD-style pipeline that continuously tests any LLM-powered feature against a golden dataset.",
        details:[
          "Every AI team ships prompt changes blind. This project proves you think about what happens after deployment.",
          "It acts as a CI/CD-style pipeline that continuously tests any LLM-powered feature against a golden dataset whenever a prompt or model changes.",
          "It detects quality regressions and alerts your team via Slack before bad outputs reach users."
        ],
        tags:["Python","GitHub Actions","Docker"], link:"#" },
      { id:"p2", name:"LLM Cost Autopilot",
        blurb:"An intelligent routing layer that routes LLM requests to the cheapest model capable of handling it.",
        details:[
          "Every company running LLMs at scale is bleeding money on over-provisioned model calls.",
          "This system sits in front of multiple LLM providers, analyzes each incoming request’s complexity, and routes it to the cheapest model capable of handling it at acceptable quality.",
          "It includes a complexity classifier and continuously validates that routing decisions are correct via an async quality verification loop."
        ],
        tags:["FastAPI","Scikit-learn","OpenAI"], link:"#" },
      { id:"p3", name:"Failure Forensics",
        blurb:"An observability layer for multi-step AI pipelines that traces every intermediate step to find root causes.",
        details:[
          "When a multi-step AI pipeline produces garbage, most teams have no idea which step broke.",
          "This tool traces every intermediate step and identifies exactly where failures originate when the final output is bad.",
          "Flagged failures are then automatically fed back into a growing evaluation dataset."
        ],
        tags:["LangChain","OpenTelemetry","SQLite"], link:"#" },
      { id:"p4", name:"Self-Healing Docs",
        blurb:"A GitHub Action that monitors codebases and auto-generates PRs to fix inaccurate documentation.",
        details:[
          "This project solves a universal engineering pain point that every interviewer has personally experienced.",
          "It monitors a codebase, detects when code changes make documentation inaccurate, and identifies the specific stale sections.",
          "The system then either auto-generates a PR with corrected docs or flags the discrepancies for human review."
        ],
        tags:["ChromaDB","GPT-4o","PyGithub"], link:"#" },
      { id:"p5", name:"Output Arbitration",
        blurb:"A multi-agent pipeline routing outputs to critic models that evaluate accuracy and synthesize critiques.",
        details:[
          "Instead of building yet another system that generates answers, you’re building one that catches bad answers.",
          "It takes any LLM-generated output, routes it to multiple competing critic models that independently evaluate it for accuracy, consistency, and completeness.",
          "These independent findings are synthesized into a single confidence-scored verdict with actionable callouts."
        ],
        tags:["LangGraph","Pydantic","FastAPI"], link:"#" },
      { id:"p6", name:"Hybrid RAG Pipeline",
        blurb:"A RAG system indexing internal documentation with dense vector and sparse keyword search.",
        details:[
          "This is a production-grade Retrieval-Augmented Generation system that ingests a company’s internal documentation.",
          "It indexes data with both dense vector and sparse keyword search, retrieves the most relevant context, and generates grounded answers.",
          "Every response features inline source citations and verification to eliminate hallucinations."
        ],
        tags:["ChromaDB","BM25","LangChain"], link:"#" },
      { id:"p7", name:"Semantic API Cache",
        blurb:"A middleware caching service serving cached responses for semantically similar requests.",
        details:[
          "Every company running LLMs at scale has the same problem: redundant API calls burning money and adding latency.",
          "This middleware service sits between your application and any LLM provider to detect semantically similar requests that have already been answered.",
          "It serves cached responses instantly, cutting latency to near-zero and reducing API costs by 30–60% on typical workloads."
        ],
        tags:["RedisVL","Prometheus","Grafana"], link:"#" },
      { id:"p8", name:"Text-to-SQL Guardrails",
        blurb:"A natural language interface translating questions into safe, validated SQL queries.",
        details:[
          "Text-to-SQL is one of the highest-value applications of LLMs in enterprise settings.",
          "This system translates plain English questions into SQL queries against a real database, but adds strict safety features.",
          "It executes queries safely with guardrails preventing destructive operations and validates that the generated SQL actually answers the question asked."
        ],
        tags:["PostgreSQL","SQLAlchemy","DuckDB"], link:"#" },
      { id:"p9", name:"Prompt A/B Testing",
        blurb:"A platform for versioning prompts, deploying multiple variants, and splitting traffic.",
        details:[
          "This platform treats prompts as versioned artifacts (like code).",
          "It lets teams deploy multiple prompt variants simultaneously and splits traffic between them to test efficacy.",
          "It measures performance across custom metrics and declares statistically significant winners, bringing the rigor of feature flagging to LLMs."
        ],
        tags:["PostgreSQL","scipy.stats","React"], link:"#" },
      { id:"p10", name:"LoRA Fine-Tuning",
        blurb:"An end-to-end pipeline applying LoRA fine-tuning on domain-specific datasets.",
        details:[
          "This pipeline takes a domain-specific dataset and applies LoRA (Low-Rank Adaptation) fine-tuning to an open-source base model.",
          "It evaluates the fine-tuned model against the base model on task-specific benchmarks.",
          "The system packages the final result for deployment, complete with full experiment tracking and reproducibility."
        ],
        tags:["PEFT","Unsloth","vLLM"], link:"#" },
      { id:"p11", name:"LLM Gateway",
        blurb:"An API gateway enforcing rate limits and falling back to alternative providers during outages.",
        details:[
          "This is a production API gateway that sits in front of all your organization’s LLM calls.",
          "It enforces per-team rate limits and budgets, and automatically falls back to alternative providers when a primary provider has an outage or rate-limits you.",
          "The gateway also provides unified observability across every single LLM interaction."
        ],
        tags:["Redis","OpenTelemetry","Go/Python"], link:"#" },
      { id:"p12", name:"AI Feature Flags",
        blurb:"A feature flag platform supporting gradual rollouts and automatic quality monitoring.",
        details:[
          "A feature flag platform specifically designed for AI-powered features where 'working' isn't binary—it's a quality gradient.",
          "It supports gradual percentage-based rollouts and automatically monitors quality metrics during rollout.",
          "If the AI feature’s output quality degrades below a configurable threshold, the system triggers an automatic rollback."
        ],
        tags:["PostgreSQL","Celery","Slack"], link:"#" },
      { id:"p13", name:"Auto-Eval Generator",
        blurb:"A system converting production LLM logs into labeled evaluation test cases.",
        details:[
          "The hardest part of AI evaluation isn’t building the eval harness — it’s building the dataset.",
          "This system continuously mines production LLM logs and identifies interesting, edge-case, and failure-mode interactions.",
          "It automatically converts them into labeled evaluation test cases, building an ever-growing, production-representative eval dataset without manual curation."
        ],
        tags:["HDBSCAN","ClickHouse","scikit-learn"], link:"#" },
      { id:"p14", name:"Document Processor",
        blurb:"A pipeline utilizing OCR and LLMs to extract structured data and validate business rules.",
        details:[
          "An end-to-end document processing pipeline that accepts any document format (PDF, image, scan).",
          "It performs dual-engine OCR to extract raw text, and uses LLMs to extract structured data from the text.",
          "Every extraction is validated against configurable business rules, complete with a human-in-the-loop review interface for low-confidence results."
        ],
        tags:["Tesseract","EasyOCR","GPT-4o Vision"], link:"#" },
      { id:"p15", name:"Agent Orchestration",
        blurb:"A multi-agent platform where a supervisor decomposes tasks and delegates to tool-using specialists.",
        details:[
          "A multi-agent orchestration platform where a supervisor agent decomposes complex tasks and delegates subtasks to specialized tool-using agents.",
          "It maintains persistent memory across interactions.",
          "The system automatically escalates to a human operator when confidence is low or the task requires approval, offering full observability into every agent decision."
        ],
        tags:["LangGraph","ChromaDB","MCP"], link:"#" }
    ],
    contact: {
      email: "aryuskumar1122@gmail.com",
      github: "https://github.com/aryuskumar1122",
      linkedin: "https://www.linkedin.com/in/aryuskumarsamal/"
    }
  };