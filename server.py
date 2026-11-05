#!/usr/bin/env python3
"""
Jev Answer Verifier Server:
Provides endpoints to fetch quiz questions and evaluate user answers with Jev.
"""
import json
import os
import sys
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"

from jev_engine import JevEngine

engine = JevEngine()

QUESTIONS = [
    {
        "id": "q1",
        "category": "Geography",
        "question": "What is the capital city of France?",
        "expected": "Paris",
        "hint": "Famous for the Eiffel Tower"
    },
    {
        "id": "q2",
        "category": "Biology",
        "question": "What is the primary function of mitochondria in human cells?",
        "expected": "Powerhouse of the cell, produces energy and ATP",
        "hint": "Cellular energy production"
    },
    {
        "id": "q3",
        "category": "Programming",
        "question": "In Python, which keyword is used to define an asynchronous function?",
        "expected": "async def",
        "hint": "Two words starting with 'a'"
    },
    {
        "id": "q4",
        "category": "Math",
        "question": "What is 15 multiplied by 8?",
        "expected": "120",
        "hint": "15 * 8"
    },
    {
        "id": "q5",
        "category": "Web Protocols",
        "question": "What does HTTP stand for?",
        "expected": "HyperText Transfer Protocol",
        "hint": "The foundation of data communication for the World Wide Web"
    }
]


class JevHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(STATIC_DIR), **kwargs)

    def do_GET(self):
        if self.path == "/api/questions":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(QUESTIONS).encode("utf-8"))
        elif self.path == "/api/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok", "mode": engine.mode}).encode("utf-8"))
        else:
            if self.path == "/" or not self.path:
                self.path = "/index.html"
            super().do_GET()

    def do_POST(self):
        if self.path == "/api/check_answer":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            
            try:
                data = json.loads(body.decode("utf-8"))
                question = data.get("question", "")
                expected = data.get("expected_answer", "")
                user_answer = data.get("user_answer", "")

                start_time = time.perf_counter()
                evaluation = engine.evaluate_answer(question, expected, user_answer)
                elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
                evaluation["latency_ms"] = elapsed_ms

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps(evaluation).encode("utf-8"))
            except Exception as e:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()


def run_server(port: int = 8000):
    server_address = ("127.0.0.1", port)
    httpd = HTTPServer(server_address, JevHandler)
    print(f"\n[+] Jev Answer Verifier active on: http://127.0.0.1:{port}")
    print(f"[+] Mode: {engine.mode.upper()}")
    print("[+] Press Ctrl+C to stop.\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        httpd.server_close()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    run_server(port)
