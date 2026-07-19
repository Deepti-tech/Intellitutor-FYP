# IntelliTutor

IntelliTutor is a full-stack interview-preparation and hiring-support application. Candidates can practise recorded interviews, receive video, speech, and resume feedback, and explore matching roles. Recruiters can manage openings and review candidate interview data from a shared dashboard.

## Demo

[Watch the IntelliTutor demo](https://drive.google.com/drive/folders/1FDUMxrDoENc8xiK1vKwJYTJSrH78FPFf?usp=drive_link)

## Highlights

- Candidate and interviewer workflows with session-based authentication
- Practice interview recording with AI-generated role-specific questions
- Video-based facial-emotion analysis using an included FER-2013 VGG model
- Speech and transcript analysis for interview feedback
- Resume similarity scoring against job descriptions
- Job publishing, application tracking, dashboards, and interview scheduling

## Technology stack

- **Frontend:** React, React Router, Redux, Chart.js, browser media APIs, and responsive UI workflows
- **Backend:** Python, Flask, REST-style APIs, CORS, session-based authentication, and background job handling
- **Data:** MongoDB, PyMongo, document-oriented data modelling, and database initialization
- **Applied AI/ML:** TensorFlow/Keras, OpenCV, NLTK, Librosa, Parselmouth, facial-emotion analysis, speech analysis, and resume similarity scoring
- **Engineering practices:** Git, environment-based configuration, dependency management, API integration, and local full-stack development

## Architecture

```text
React client (frontend/)  ──HTTP──>  Flask API (backend/)  ──> MongoDB
       │                                   │
       └── Gemini question generation      ├── OpenCV / TensorFlow video analysis
                                           ├── Librosa / Parselmouth speech analysis
                                           └── Resume similarity analysis
```

## Repository layout

```text
backend/                 Flask API, analysis services, and model assets
  support/               Haar cascade, FER model, and FFmpeg executable
  uploads/               Runtime interview uploads (ignored by Git)
  .env.example           Backend configuration template
  requirements.txt       Python dependencies
frontend/                React single-page application
  src/pages/             Candidate and interviewer screens
  src/js/                HTTP client and shared utilities
  .env.example           Frontend configuration template
Archive-Version-1/       Earlier project version retained for reference
```

## Local setup

### Prerequisites

- Python 3.11
- Node.js and npm
- A MongoDB Atlas deployment or local MongoDB instance
- A Gemini API key for the practice-question feature

### 1. Configure the backend

From PowerShell:

```powershell
cd backend
python -m venv venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
venv/Scripts/Activate.ps1
python -m pip install -r requirements.txt

$env:MONGODB_URI = "mongodb+srv://<username>:<password>@<cluster-host>/?retryWrites=true&w=majority"
$env:FLASK_SECRET_KEY = "replace-with-a-long-random-secret"
python server.py
```

The Flask API starts at `http://localhost:5000`.

### 2. Configure and run the frontend

Open a second terminal:

```powershell
cd frontend
Copy-Item .env.example .env
# Replace the placeholder value in .env with a restricted Gemini API key.
npm install
npm start
```

The browser app starts at `http://localhost:3000` and targets the local Flask API.

## Security notes

- Never commit `.env` files, database URIs, API keys, or Flask session secrets.
- Restrict any browser-facing Gemini key to approved origins. For production, send AI requests through a backend endpoint rather than directly from the React client.
- The repository ignores virtual environments, Node modules, Python caches, uploads, and local environment files.

## Demo data

On an empty database, the backend seeds demonstration company and candidate accounts plus a sample job. These are intended only for local demonstration; replace them before deployment.

## Development notes

- The first backend start may download NLTK resources and build a Matplotlib font cache.
- The included emotion model is a legacy Keras `.h5` model; the dependency file pins TensorFlow 2.15.1 for compatibility.
- The included FFmpeg binary is Windows-specific. Use a system FFmpeg installation or a platform-specific alternative when deploying elsewhere.

## Next improvements

- Move AI-provider requests and credentials fully behind the Flask API.
- Add automated tests and a CI workflow.
- Replace development CORS and session settings with production-safe configuration.
- Containerize the frontend, API, and analysis dependencies for reproducible deployment.
