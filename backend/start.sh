#!/bin/bash

# ChemSafe Backend Startup Script

echo "🚀 Starting ChemSafe Backend..."
echo ""

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "❌ Error: Virtual environment not found!"
    echo "Run: python3 -m venv venv"
    exit 1
fi

# Activate virtual environment
echo "📦 Activating virtual environment..."
source venv/bin/activate

# Check if dependencies installed
if ! python -c "import fastapi" 2>/dev/null; then
    echo "❌ Error: Dependencies not installed!"
    echo "Run: pip install -r requirements.txt"
    exit 1
fi

# Check if opencv installed
if ! python -c "import cv2" 2>/dev/null; then
    echo "⚠️  Warning: OpenCV not installed (needed for camera monitoring)"
    echo "Run: pip install opencv-python==4.10.0.84"
    echo ""
fi

# Check environment variables
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found"
    echo "Make sure SUPABASE_URL and SUPABASE_SERVICE_KEY are set"
    echo ""
fi

echo "✅ All checks passed!"
echo ""
echo "🌐 Starting FastAPI server on http://localhost:8000"
echo "📊 API docs available at http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo "─────────────────────────────────────────────────────"
echo ""

# Start server with uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
