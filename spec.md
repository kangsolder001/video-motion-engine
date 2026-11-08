# Technology Explained — Master System Specification

**Document:** `spec.md`  
**Project:** Technology Explained AI Content Production Platform  
**Version:** 1.0.0  
**Status:** Initial Specification  
**Language:** Bahasa Indonesia  
**Primary Platform:** YouTube Shorts

---

# 1. Project Overview

## 1.1 Project Description

Technology Explained AI Content Production Platform adalah sebuah sistem otomatis berbasis Artificial Intelligence yang bertujuan memproduksi konten video edukasi teknologi untuk YouTube Shorts.

Sistem menggunakan beberapa AI agent yang bekerja secara terkoordinasi untuk menjalankan seluruh proses produksi konten, mulai dari menerima topik, melakukan riset, menyusun script, membuat storyboard, menghasilkan visual, membuat voice-over, melakukan video editing, hingga menghasilkan video final.

Sistem dirancang sebagai platform yang dapat dikembangkan secara bertahap dan mendukung berbagai AI provider.

## 1.2 Project Vision

Membangun sistem produksi konten video yang sebagian besar berjalan secara otomatis menggunakan AI, dengan intervensi manusia seminimal mungkin tanpa mengorbankan kualitas informasi dan visual.

## 1.3 Primary Objectives

1. Mengotomatisasi proses produksi video edukasi teknologi.
2. Menghasilkan video dengan kualitas visual 3D cinematic motion graphics.
3. Memastikan informasi teknis akurat dan dapat dipertanggungjawabkan.
4. Menjaga konsistensi branding dan identitas visual.
5. Mendukung penggunaan berbagai AI provider.
6. Mengoptimalkan biaya produksi per video.
7. Mendukung produksi konten dalam jumlah besar.
8. Menyediakan sistem evaluasi kualitas dan performa konten.

## 1.4 Core Principles

- Automation First
- AI Agent Orchestration
- Modular Architecture
- Provider Agnostic
- Human-in-the-loop
- Quality over Quantity
- Reproducible Production
- Cost Awareness
- Observability

---

# 2. Content Channel Specification

## 2.1 Channel Identity

| Attribute | Specification |
|---|---|
| Channel Name | Technology Explained |
| Tagline | Teknologi di Balik Segala Hal |
| English Tagline | Understand the Technology Behind Everything |
| Platform | YouTube Shorts |
| Content Type | Technology Education |
| Primary Language | Bahasa Indonesia |
| Visual Style | 3D Cinematic Motion Graphics |
| Target Duration | 45–55 seconds |
| Video Format | Vertical 9:16 |

## 2.2 Target Audience

- General audience interested in technology.
- Students and university learners.
- Technology enthusiasts.
- Beginner developers.
- IT professionals who want concise explanations.

## 2.3 Content Categories

| Category | Target Allocation |
|---|---:|
| Backend & Infrastructure | 20% |
| Artificial Intelligence | 20% |
| Networking & Internet | 20% |
| IoT & Automation | 15% |
| Computer Science & Hardware | 15% |
| Future Technology | 10% |

These percentages are initial editorial targets, not strict production limits.

## 2.4 Content Format

Each video should:

- Explain one primary concept.
- Use accessible language.
- Avoid unnecessary technical jargon.
- Have a strong opening hook.
- Use visual storytelling.
- Include a clear conclusion.
- Fit within the target duration.

---

# 3. Overall System Scope

The platform must support the following production lifecycle:

1. Topic Management
2. Content Research
3. Fact Checking
4. Script Generation
5. Storyboard Generation
6. Prompt Engineering
7. Image Generation
8. Video Generation
9. Voice-over Generation
10. Sound Design
11. Video Composition
12. Video Rendering
13. Quality Control
14. Human Approval
15. YouTube Publishing
16. Performance Analytics
17. Content Optimization

All capabilities will be developed incrementally through defined development phases.

---

# 4. High-Level System Architecture

## 4.1 Architecture Overview

The platform uses a modular hybrid architecture consisting of:

- Backend application as the core system.
- AI orchestration layer.
- Specialized AI agents.
- External AI provider integrations.
- Workflow automation engine.
- Media processing engine.
- Persistent storage.
- Management dashboard.

## 4.2 Logical Architecture

```text
                         USER
                          |
                          v
                  MANAGEMENT DASHBOARD
                          |
                          v
                  BACKEND APPLICATION
                          |
             +------------+------------+
             |                         |
             v                         v
      PROJECT MANAGEMENT         JOB MANAGEMENT
             |                         |
             +------------+------------+
                          |
                          v
                   AI ORCHESTRATOR
                          |
       +------------------+------------------+
       |                  |                  |
       v                  v                  v
  RESEARCH AGENT     SCRIPT AGENT      STORYBOARD AGENT
       |                  |                  |
       +------------------+------------------+
                          |
                          v
                  VISUAL PRODUCTION
                          |
             +------------+------------+
             |                         |
             v                         v
       IMAGE GENERATION          VIDEO GENERATION
             |                         |
             +------------+------------+
                          |
                          v
                   AUDIO PRODUCTION
                          |
                          v
                    VIDEO EDITING
                          |
                          v
                    QUALITY CONTROL
                          |
                          v
                    HUMAN APPROVAL
                          |
                          v
                    VIDEO PUBLISHING
                          |
                          v
                      ANALYTICS
```

The architecture is logical and does not mandate a specific deployment topology.

## 4.3 Architectural Requirements

- Each major subsystem must have a clear responsibility.
- Agents must communicate through structured inputs and outputs.
- The orchestrator must control execution order and dependencies.
- Long-running tasks must execute asynchronously.
- Production jobs must be recoverable after failures.
- External provider integrations must be replaceable.
- Every production operation must be traceable.
- The system must support retries and failure handling.
- Generated assets must be associated with their episode and scene.

---

# 5. AI Agent Architecture

The system uses specialized agents rather than one general-purpose agent performing every task.

## 5.1 Agent Responsibilities

### A. Research Agent

Responsibilities:

- Understand the requested topic.
- Search for reliable information.
- Collect relevant technical references.
- Identify important concepts.
- Prepare structured research documents.

Output:

- Research summary.
- Key technical concepts.
- Reference sources.
- Important terminology.
- Potential misinformation risks.

### B. Script Agent

Responsibilities:

- Convert research into an educational narrative.
- Create an opening hook.
- Write voice-over narration.
- Control script length and pacing.
- Ensure the narrative is understandable.

Output:

- Video title.
- Hook.
- Voice-over script.
- Scene narration breakdown.
- Estimated duration.

### C. Fact-Check Agent

Responsibilities:

- Verify technical claims.
- Identify unsupported statements.
- Check consistency with research references.
- Flag misleading simplifications.
- Request corrections when necessary.

Output:

- Fact-check report.
- Verified claims.
- Unsupported claims.
- Required revisions.
- Verification status.

### D. Storyboard Agent

Responsibilities:

- Convert the script into visual scenes.
- Define the primary visual subject.
- Determine scene transitions.
- Define camera movement.
- Maintain visual continuity.

Output:

- Scene list.
- Scene descriptions.
- Camera directions.
- Lighting directions.
- Transition instructions.

### E. Prompt Engineering Agent

Responsibilities:

- Convert storyboard descriptions into provider-compatible prompts.
- Apply global visual identity.
- Maintain consistency between scenes.
- Generate negative prompts when supported.
- Adapt prompts to provider capabilities.

Output:

- Image prompts.
- Video prompts.
- Reference image instructions.
- Generation parameters.

### F. Visual Agent

Responsibilities:

- Generate visual assets.
- Generate video clips.
- Manage asset variations.
- Handle generation failures.
- Validate generated outputs.

Output:

- Images.
- Video clips.
- Asset metadata.
- Generation history.

### G. Audio Agent

Responsibilities:

- Generate voice-over.
- Generate or select sound effects.
- Generate background audio where appropriate.
- Synchronize audio with scene timing.

Output:

- Voice-over files.
- Sound effects.
- Audio metadata.
- Timing information.

### H. Editing Agent

Responsibilities:

- Assemble video scenes.
- Synchronize voice-over and visuals.
- Add transitions.
- Add subtitles and text overlays.
- Apply branding.
- Render the final video.

Output:

- Rendered video.
- Render metadata.
- Editing manifest.

### I. Quality Control Agent

Responsibilities:

- Evaluate technical quality.
- Evaluate content consistency.
- Evaluate audio quality.
- Evaluate visual continuity.
- Check output specifications.
- Identify scenes that need regeneration.

Output:

- QC report.
- Pass/fail status.
- Detected issues.
- Suggested corrections.

### J. Publishing Agent

Responsibilities:

- Prepare YouTube metadata.
- Generate title and description.
- Prepare tags where applicable.
- Upload approved videos.
- Manage publishing schedules.
- Store publication information.

Output:

- Publishing metadata.
- YouTube video ID.
- Publishing status.
- Publication URL.

### K. Analytics Agent

Responsibilities:

- Retrieve video performance metrics.
- Analyze audience retention.
- Analyze viewer engagement.
- Identify successful content patterns.
- Provide recommendations for future videos.

Output:

- Performance report.
- Content insights.
- Recommendations.
- Historical comparisons.

---

# 6. AI Orchestration

## 6.1 Core Responsibilities

The orchestrator is responsible for coordinating the complete production process.

It must:

- Receive production requests.
- Create production jobs.
- Determine the next executable task.
- Invoke the appropriate agent.
- Validate agent outputs.
- Track dependencies.
- Handle retries.
- Handle failed jobs.
- Persist execution states.
- Trigger human approval when required.

## 6.2 Execution Model

The system should use a state-driven workflow.

Suggested episode states:

```text
DRAFT
  |
  v
RESEARCHING
  |
  v
RESEARCH_COMPLETED
  |
  v
SCRIPTING
  |
  v
SCRIPT_COMPLETED
  |
  v
FACT_CHECKING
  |
  v
FACT_CHECK_COMPLETED
  |
  v
STORYBOARDING
  |
  v
VISUAL_PRODUCTION
  |
  v
AUDIO_PRODUCTION
  |
  v
VIDEO_EDITING
  |
  v
QUALITY_CHECK
  |
  v
AWAITING_APPROVAL
  |
  v
APPROVED
  |
  v
PUBLISHING
  |
  v
PUBLISHED
```

The workflow must also support:

- FAILED
- CANCELLED
- ON_HOLD
- REVISION_REQUIRED

An episode may return to an earlier state when a revision is required.

## 6.3 Workflow Rules

- Each task must have a unique identifier.
- Each task must have an execution status.
- Each task must record its input and output references.
- Each task must support retry policies.
- Retry limits must be configurable.
- Failed tasks must preserve diagnostic information.
- A completed task should not be rerun unnecessarily.
- Regeneration should target only affected assets when possible.

---

# 7. AI Provider Integration

## 7.1 Provider-Agnostic Design

The system must not depend exclusively on one AI provider.

Provider integrations should be abstracted through internal interfaces.

Required provider categories:

| Category | Capability |
|---|---|
| LLM | Research, reasoning, script, planning |
| Web Search | External information retrieval |
| Image Generation | Static visual generation |
| Video Generation | Motion and video generation |
| Text-to-Speech | Voice-over generation |
| Audio Generation | Sound and background audio |
| Embedding | Optional semantic search and retrieval |

## 7.2 Integration Requirements

- Each provider must have a dedicated adapter.
- API credentials must be stored securely.
- Provider configuration must be externalized.
- Timeouts must be configurable.
- Rate limits must be respected.
- Provider failures must be recoverable.
- Usage and cost must be tracked.
- Provider substitution must not require rewriting business logic.

## 7.3 Provider Selection

Provider selection should consider:

- Output quality.
- API availability.
- Pricing.
- Generation speed.
- Reliability.
- Commercial usage rights.
- Output resolution.
- Duration limits.
- Automation capabilities.

The system must allow different providers for different production tasks.

---

# 8. Visual Identity Specification

## 8.1 Visual Direction

**Futuristic Scientific Cinematic 3D Motion Graphics**

Visual characteristics:

- Cinematic 3D environments.
- Realistic PBR materials.
- Volumetric lighting.
- Electric cyan highlights.
- Dark technical environments.
- Controlled bloom.
- Subtle reflections.
- Clean technical compositions.
- Clear visual hierarchy.

## 8.2 Color Palette

| Color | Hex |
|---|---|
| Deep Navy | #07111F |
| Dark Blue | #102A43 |
| Electric Cyan | #00C8FF |
| Tech Blue | #3D83FF |
| Ice White | #EAF4FF |

## 8.3 Typography

| Purpose | Font |
|---|---|
| Headings | Space Grotesk Bold |
| Body | Inter |
| Technical Labels | JetBrains Mono |

## 8.4 Motion Direction

Animation should use:

- Smooth easing.
- Anticipation.
- Follow-through.
- Controlled acceleration.
- Natural camera movement.
- Consistent spatial direction.
- Clear subject staging.

Avoid excessive motion that distracts from educational content.

## 8.5 Camera Language

Supported movements:

- Dolly.
- Pan.
- Tilt.
- Tracking.
- Orbit.
- Static.
- Push-in.
- Pull-out.

Camera movement must support the narrative rather than exist only for decoration.

---

# 9. Video Output Specification

## 9.1 Standard Format

| Attribute | Specification |
|---|---|
| Aspect Ratio | 9:16 |
| Resolution | 1080 × 1920 |
| Frame Rate | 30 FPS |
| Video Codec | H.264 |
| Container | MP4 |
| Audio Codec | AAC |
| Audio Sample Rate | 48 kHz |
| Duration | 30–60 seconds |
| Primary Target | 45–55 seconds |

## 9.2 Episode Structure

| Segment | Duration |
|---|---:|
| Hook | 0–4 seconds |
| Context | 4–10 seconds |
| Explanation | 10–30 seconds |
| Visual Reveal | 30–43 seconds |
| Closing | 43–55 seconds |

The structure may be adjusted depending on the topic.

## 9.3 Scene Guidelines

- Target 4–6 scenes per episode.
- Each scene should have one primary visual action.
- Every scene must support a narration segment.
- Visual transitions must feel coherent.
- Avoid unnecessary scene repetition.
- Important technical concepts should be visually represented.

---

# 10. Media Asset Management

## 10.1 Asset Categories

The system must manage:

- Research references.
- Scripts.
- Storyboards.
- Prompt documents.
- Generated images.
- Generated video clips.
- Voice-over.
- Sound effects.
- Background audio.
- Subtitles.
- Rendered videos.
- QC reports.

## 10.2 Asset Metadata

Each asset should include:

- Asset ID.
- Episode ID.
- Scene ID, when applicable.
- Asset type.
- Provider.
- Generation model.
- Prompt version.
- Creation timestamp.
- Storage location.
- File format.
- Duration or dimensions, when applicable.
- Generation status.

## 10.3 Storage Strategy

Media files should be stored separately from relational database records.

The database stores asset metadata and references, while object storage stores the actual files.

---

# 11. Video Editing and Rendering

## 11.1 Rendering Engine

The platform should support automated video composition and rendering.

Candidate technologies:

- FFmpeg.
- Remotion.
- Blender.

The rendering engine should be selected according to the complexity of the intended motion graphics and automation requirements.

## 11.2 Editing Requirements

- Scene sequencing.
- Video trimming.
- Transition management.
- Audio synchronization.
- Subtitle composition.
- Text overlays.
- Branding elements.
- Final encoding.

## 11.3 Reproducibility

Every rendered video must have an associated editing manifest.

The manifest should record:

- Source assets.
- Scene order.
- Timeline information.
- Audio tracks.
- Subtitle configuration.
- Render configuration.
- Software or template version.

This allows the system to reproduce or revise previous outputs.

---

# 12. Quality Control

## 12.1 Content Quality

Check:

- Technical accuracy.
- Narrative clarity.
- Appropriate simplification.
- Consistency between narration and visuals.
- Source traceability.

## 12.2 Visual Quality

Check:

- Visual consistency.
- Scene continuity.
- Correct aspect ratio.
- No unintended artifacts.
- Readable text.
- Appropriate branding.

## 12.3 Audio Quality

Check:

- Voice clarity.
- Audio synchronization.
- No clipping.
- Appropriate volume.
- No unintended silence.
- Background audio does not overpower narration.

## 12.4 Technical Quality

Check:

- Correct resolution.
- Correct frame rate.
- Valid MP4 output.
- Valid audio stream.
- Correct duration.
- Successful decoding.

## 12.5 Quality Decision

QC results:

- PASS
- PASS_WITH_WARNINGS
- FAIL

A failed result must include actionable feedback.

The system should support targeted regeneration and revalidation.

---

# 13. Human-in-the-Loop

## 13.1 Approval Policy

The default publishing policy is human approval.

AI may complete all production stages, but publishing must wait for explicit approval.

## 13.2 Approval Checkpoints

The system should support configurable checkpoints for:

- Research.
- Script.
- Storyboard.
- Final video.
- Publishing.

Not every checkpoint needs to require manual approval.

## 13.3 Revision Workflow

Users should be able to:

- Approve.
- Reject.
- Request revision.
- Add feedback.
- Regenerate selected scenes.
- Regenerate voice-over.
- Request complete rerender.

Feedback should be associated with the affected episode, scene, or asset.

---

# 14. YouTube Publishing

## 14.1 Publishing Integration

The platform should support YouTube Data API integration.

Capabilities:

- Upload video.
- Set title.
- Set description.
- Set metadata.
- Set privacy status.
- Schedule publishing when supported.
- Retrieve video information.

## 14.2 Publishing Rules

- Only approved videos may be published.
- Upload operations must be tracked.
- Duplicate uploads should be prevented.
- Upload failures must support retry.
- Publishing credentials must be secured.
- API quota must be monitored.

---

# 15. Analytics and Optimization

## 15.1 Metrics

The platform should collect available metrics such as:

- Views.
- Average view duration.
- Audience retention.
- Likes.
- Comments.
- Shares.
- Subscribers gained.
- Viewed versus swiped away, when available through supported reporting.

## 15.2 Analytics Agent

The Analytics Agent should identify:

- Strong and weak hooks.
- Topics with better engagement.
- Audience retention patterns.
- Effective video duration.
- Content categories with stronger performance.

## 15.3 Optimization Loop

Analytics should generate recommendations for future episodes.

The system must not automatically change core channel branding or editorial standards without user authorization.

---

# 16. Backend and Infrastructure

## 16.1 Architecture Direction

The backend should use a modular architecture.

The initial preferred implementation direction:

- Backend: Go.
- Frontend: Next.js.
- Database: PostgreSQL.
- Cache: Redis.
- Object Storage: S3-compatible storage.
- Workflow Orchestration: Custom backend with optional n8n integration.
- Media Processing: FFmpeg and/or Remotion.
- Deployment: Docker.

These are preferred candidates, not immutable decisions.

## 16.2 Backend Responsibilities

- User and project management.
- Episode management.
- Job orchestration.
- Agent execution.
- Provider integration.
- Asset management.
- Approval management.
- Publishing.
- Analytics.
- Usage and cost tracking.

## 16.3 Infrastructure Requirements

- Containerized deployment.
- Environment-based configuration.
- Secure secret management.
- Centralized logging.
- Job monitoring.
- Database backup.
- Object storage lifecycle management.
- Error tracking.
- Health checks.

## 16.4 Asynchronous Processing

Long-running AI and media generation tasks must not block normal API requests.

The system should support:

- Background workers.
- Job queues.
- Task status tracking.
- Retry handling.
- Timeouts.
- Concurrency limits.

---

# 17. Data Management

## 17.1 Core Entities

The data model should accommodate:

- User.
- Project.
- Channel.
- Episode.
- Research Document.
- Script.
- Storyboard.
- Scene.
- Agent.
- Agent Execution.
- Production Job.
- Media Asset.
- Prompt Template.
- Provider.
- Provider Usage.
- QC Report.
- Approval.
- Publishing Record.
- Analytics Snapshot.

## 17.2 Data Integrity

- Every episode must belong to a project or channel.
- Every scene must belong to an episode.
- Every asset must have an ownership reference.
- Agent executions must be traceable.
- Production history must be preserved.
- Important revisions must be versioned.

---

# 18. Security and Reliability

## 18.1 Security

- API keys must never be committed to source control.
- Secrets must be managed securely.
- External provider access must be controlled.
- User access must be authenticated.
- Sensitive operations must be authorized.
- Uploaded files must be validated.
- Logs must avoid exposing secrets.

## 18.2 Reliability

- Failed jobs must be observable.
- Retry policies must prevent infinite loops.
- External API failures must be handled.
- Long-running tasks must support recovery.
- Duplicate execution must be controlled.
- Database and media backup strategies must exist.

## 18.3 Idempotency

Operations such as uploading, rendering, and publishing should support idempotency where possible to prevent duplicate work and duplicate outputs.

---

# 19. Cost Management

AI generation and video rendering may represent significant production costs.

The platform must track:

- LLM token consumption.
- Image generation costs.
- Video generation costs.
- Text-to-speech costs.
- Storage costs.
- Rendering resource consumption.
- Cost per episode.
- Cost per successfully published video.

## 19.1 Cost Optimization

- Configure provider selection by task.
- Reuse approved assets when appropriate.
- Avoid unnecessary regeneration.
- Cache reusable results.
- Set generation limits.
- Support configurable budget limits.
- Provide cost estimates before expensive operations where possible.

---

# 20. Observability and Monitoring

The platform should provide:

- Episode production status.
- Agent execution status.
- Job queue status.
- Provider response status.
- Generation duration.
- Failure history.
- Retry counts.
- Token consumption.
- Cost per operation.
- Cost per episode.

Each production execution should have a traceable correlation identifier.

---

# 21. Development Roadmap

The system will be developed incrementally.

## Phase 0 — System Specification and Architecture

Objectives:

- Finalize master specification.
- Define system architecture.
- Define agent architecture.
- Define data model.
- Define technology stack.
- Define integration strategy.

Deliverables:

- Master specification.
- System architecture document.
- Agent specifications.
- Workflow specification.
- Initial data model.

## Phase 1 — Automated Content Generation

Objectives:

- Accept a content topic.
- Perform research.
- Generate script.
- Perform fact-checking.
- Generate storyboard.
- Generate structured prompts.

Deliverables:

- Topic management.
- Research Agent.
- Script Agent.
- Fact-Check Agent.
- Storyboard Agent.
- Prompt Engineering Agent.
- Structured episode output.

Phase 1 does not require automated video generation or rendering.

## Phase 2 — Automated Visual and Audio Production

Objectives:

- Generate images.
- Generate video clips.
- Generate voice-over.
- Manage scene assets.

## Phase 3 — Automated Editing and Rendering

Objectives:

- Assemble scenes.
- Synchronize audio.
- Generate subtitles.
- Render final videos.

## Phase 4 — Quality Control and Approval

Objectives:

- Automated QC.
- Targeted regeneration.
- Human approval dashboard.
- Revision management.

## Phase 5 — Publishing Automation

Objectives:

- YouTube integration.
- Automated metadata.
- Video uploads.
- Publishing schedules.

## Phase 6 — Analytics and Optimization

Objectives:

- Collect performance metrics.
- Analyze content performance.
- Generate recommendations.
- Improve future content strategies.

---

# 22. Non-Functional Requirements

The platform should be designed with the following characteristics:

| Attribute | Requirement |
|---|---|
| Modularity | Components can evolve independently |
| Extensibility | New AI providers and agents can be added |
| Maintainability | Clear boundaries and documentation |
| Reliability | Recoverable production workflows |
| Scalability | Support concurrent episode production |
| Observability | Traceable execution and costs |
| Security | Protected credentials and controlled access |
| Reproducibility | Versioned prompts, assets, and renders |
| Cost Efficiency | Track and optimize production costs |

Specific performance and availability targets will be established during architecture design.

---

# 23. Definition of Done — Overall Platform

The overall platform can be considered operational when:

1. A user can submit a content topic.
2. The system can manage the complete episode lifecycle.
3. AI agents can execute their assigned responsibilities.
4. The system can produce structured content documents.
5. The system can generate and manage visual assets.
6. The system can produce voice-over.
7. The system can render a complete video.
8. The system can evaluate output quality.
9. The user can review and approve content.
10. Approved content can be published.
11. Performance metrics can be collected.
12. Production costs and execution history can be monitored.

---

# 24. Specification Governance

This document is the master reference for the entire platform.

Rules:

- Phase specifications must follow this document.
- Technical implementation details belong in dedicated architecture or phase documents.
- Changes to core architecture must be reflected here.
- Provider-specific configuration must not be hardcoded into the master specification.
- Every major requirement should have a corresponding acceptance criterion in its implementation phase.
- Scope changes must be documented.
- The master specification should evolve through versioned updates.

---

# 25. Current Project Direction

Initial architectural direction:

| Decision | Direction |
|---|---|
| System Type | AI-powered content production platform |
| Architecture | Modular hybrid |
| Backend | Go (preferred) |
| Frontend | Next.js (preferred) |
| Database | PostgreSQL |
| Cache | Redis |
| Storage | S3-compatible |
| Workflow | Custom orchestration + optional n8n |
| AI Strategy | Multi-provider |
| Agent Strategy | Specialized agents |
| Video Processing | FFmpeg / Remotion |
| Deployment | Docker |
| Publishing Policy | Human approval required |

All technology choices remain subject to validation during Phase 0 architecture design.

**End of Master Specification.**