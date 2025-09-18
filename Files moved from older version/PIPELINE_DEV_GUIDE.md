# Pipeline Development Monitor - Usage Guide

## Overview

The Pipeline Development Monitor is a comprehensive dev-only tool for monitoring, debugging, and managing AI pipeline executions. It provides real-time monitoring, step management, and detailed analysis of pipeline runs.

## 🚀 Quick Start

### 1. Access the Dev Tool
```
http://localhost:3000/dev/pipeline
```

### 2. Setup Database (if not done)
Ensure PostgreSQL schema and seed data are loaded:
```bash
# In server directory
cd server/
psql -U postgres -d event_marketplace -f ../database/schema.sql
psql -U postgres -d event_marketplace -f ../database/seed.sql
```

### 3. Start Both Servers
```bash
# Terminal 1: Start React client
cd client/
npm start

# Terminal 2: Start Node.js server  
cd server/
npm run dev  # or node server.js
```

## 🎯 Features

### Left Panel - Pipeline Controls

**Event Selection**
- Dropdown lists all available events from database
- Shows event title, type, and status
- Auto-selects seed event if available

**Pipeline Controls**  
- **Run Pipeline**: Execute full 7-step pipeline
- **Rerun Step**: Re-execute only the selected step
- **Rerun From Here**: Execute from selected step to end
- **Download Logs**: Export full run data as JSON

**Pipeline Status**
- Live run status (pending/running/completed/failed)
- Real-time duration tracking
- Step completion counters  
- Polling indicator when active

**Steps List**
- Visual step status with color-coded chips:
  - 🔵 Pending/Running (blue)
  - 🟢 Completed (green) 
  - 🔴 Failed (red)
  - ⚫ Not started (gray)
- Step execution times
- Click to select and view details

### Right Panel - JSON Viewer

**Step Details**
- **Input Data**: What was passed to the step
- **Output Data**: What the step produced
- **Error Details**: Error messages if step failed
- **Metadata**: Timestamps, duration, step order

## 🔄 Workflow Examples

### Basic Pipeline Execution
1. Select "Sharma Family Wedding Celebration" from dropdown
2. Click "Run Pipeline"
3. Watch real-time step execution (1-15 seconds)
4. Click on completed steps to inspect data
5. Download logs for analysis

### Step-by-Step Debugging
1. Run full pipeline first
2. If step fails, click on failed step
3. Inspect error details in right panel
4. Click "Rerun Step" to retry just that step
5. Or click "Rerun From Here" to restart from that point

### Partial Pipeline Execution
1. Select event and run full pipeline
2. Click on any completed step (e.g., "vision")
3. Click "Rerun From Here" 
4. Only steps from "vision" onwards will execute
5. Previous step outputs are automatically loaded

## 🔧 Technical Details

### Real-time Updates
- Polls `/api/pipeline-runs/:run_id` every 1 second
- Stops polling when status is 'completed' or 'failed'
- Updates step status and data in real-time
- Auto-selects first step when run starts

### API Integration  
- **GET /api/events** - Load events dropdown
- **POST /api/events/:id/run-pipeline** - Start pipeline
- **POST /api/events/:id/run-pipeline?from=step_name** - Partial execution
- **GET /api/pipeline-runs/:run_id** - Get run details with steps

### Step Management
- **Rerun Step**: Executes single step with same inputs
- **Rerun From Here**: Loads previous outputs, executes from selected step onwards
- Previous step outputs retrieved from most recent successful run

### Data Export
- Downloads complete run data as formatted JSON
- Includes all steps, inputs, outputs, errors, and metadata
- Filename format: `pipeline-logs-{run_id}.json`

## 🐛 Debugging Tips

### Pipeline Failures
1. Check step error messages in JSON viewer
2. Look for timeout errors (steps have 10s limit)  
3. Verify database connection for data loading issues
4. Check browser console for API errors

### Performance Issues
1. Use "Download Logs" to analyze step durations
2. Look for steps consistently taking >5 seconds
3. Check database connection pooling if many failures
4. Monitor browser memory with large datasets

### Data Issues  
1. Inspect step inputs/outputs for data flow problems
2. Use "Rerun Step" to retry with same inputs
3. Check accumulated_data structure between steps
4. Verify previous outputs loaded correctly for partial runs

## 🚨 Development Notes

### Environment Requirements
- React development server on :3000
- Node.js API server on :5000  
- PostgreSQL database with schema loaded
- CORS enabled between client/server

### Mock Data Fallbacks
- Events API returns seed data if database fails
- Pipeline uses mock AI responses (no external API calls)
- Vision analysis returns realistic fake data
- Image search uses predefined Unsplash URLs

### Security Considerations
- **Dev-only**: Remove /dev routes in production
- No authentication required for dev tool
- Database queries use parameterized statements
- File downloads are client-side only (safe)

## 📊 Pipeline Steps Reference

1. **chat** - Extract/normalize keywords from event text
2. **checklist** - Derive required services from analysis  
3. **image_prompt** - Build AI generation search queries
4. **image_search** - Select relevant mock images (3-5)
5. **vision** - Mock Google Vision API analysis  
6. **leonardo_prompt** - Compose detailed AI generation prompt
7. **render** - Generate placeholder render URL

## 🔗 Related Files

**Frontend:**
- `/client/src/pages/dev/PipelineMonitor.jsx` - Main component
- `/client/src/App.js` - Route configuration

**Backend:**  
- `/server/routes/pipelineAPI.js` - API endpoints
- `/server/src/pipeline/runPipeline.ts` - Main orchestrator
- `/server/src/database/pipelineDB.ts` - Database operations

**Database:**
- `/database/schema.sql` - PostgreSQL schema
- `/database/seed.sql` - Sample data

## 🎮 Keyboard Shortcuts

- `Ctrl+R` - Refresh page to reset state
- `Ctrl+S` - Downloads logs (when focused on download button)
- `Arrow Keys` - Navigate step list (when focused)
- `Enter` - Select step (when focused on step)

---

**Pro Tip**: Keep browser developer tools open to monitor network requests and see detailed pipeline execution logs in the console.