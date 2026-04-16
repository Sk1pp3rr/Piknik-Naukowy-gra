import http.server
import socketserver
import webbrowser
import os
import sys

# Upewniamy się, że serwer startuje w folderze, w którym jest plik .exe
if getattr(sys, 'frozen', False):
    os.chdir(os.path.dirname(sys.executable))
else:
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

PORT = 8000
Handler = http.server.SimpleHTTPRequestHandler

# Tworzymy serwer
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serwer uruchomiony na porcie {PORT}...")
    print("Zaraz otworzy się przeglądarka. Nie zamykaj konsoli (tego czarnego okna) podczas gry!")
    
    # Automatycznie otwiera przeglądarkę
    webbrowser.open(f"http://localhost:{PORT}")
    
    # Utrzymuje serwer przy życiu
    httpd.serve_forever()