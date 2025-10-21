#!/bin/bash
echo "================================"
echo "   Starting Arena Shooter Game"
echo "================================"
echo ""
echo "Opening game in your browser..."
echo ""

# Try to open in browser
if command -v xdg-open > /dev/null; then
    xdg-open index.html
elif command -v open > /dev/null; then
    open index.html
elif command -v start > /dev/null; then
    start index.html
else
    echo "Starting local server..."
    echo "Open your browser and go to: http://localhost:8000"
    python3 -m http.server 8000
fi
