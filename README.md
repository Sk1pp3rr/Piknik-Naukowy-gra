# 🌊 Morska Przygoda Pro

Interaktywna aplikacja desktopowa (typu Kiosk) z grami edukacyjnymi o tematyce morskiej. Projekt łączy naukę fizyki morza (wiry), logiczne myślenie (puzzle) oraz wiedzę ogólną (quiz). Aplikacja jest zbudowana w technologii React i opakowana w Electron, co czyni ją odporną na przypadkowe zamknięcia podczas pikników naukowych.

---

## 📂 Struktura plików

Projekt został podzielony na moduły, aby kod był czysty i łatwy w edycji:

    /morska-przygoda-pro
    ├── electron.cjs           # Plik startowy aplikacji desktopowej (Electron - blokady klawiszy)
    ├── package.json           # Konfiguracja projektu i skrypty startowe
    ├── public/                # Folder na pliki statyczne (czytane prosto z dysku)
    │   ├── quiz.txt           # Baza pytań do quizu (łatwa edycja w notatniku)
    │   └── puzzle/            # Tu wrzucaj swoje zdjęcia do puzzli
    │       ├── 1.jpg
    │       ├── 2.jpg
    │       └── 3.jpg
    └── src/                   # Główny kod gry (React)
        ├── App.tsx            # Menu główne, Hall of Fame, system wyników i nakładka Admina
        ├── index.css          # Style CSS i animacje
        └── components/        # Logika poszczególnych gier
            ├── Wiry.tsx       # Fizyka prądów morskich
            ├── Puzzle.tsx     # Tasowanie i inteligentne kadrowanie zdjęć
            └── Quiz.tsx       # Silnik quizu i neonowe podświetlenia

---

## 🚀 Jak to uruchomić?

Masz do wyboru trzy sposoby, w zależności od tego, co chcesz osiągnąć:

### Sposób 1: Złoty standard (Tryb Arcade - Pełny ekran)
Aby przetestować grę dokładnie tak, jak będzie działać na automacie (pełny ekran, blokady klawiszy):
1. Otwórz terminal (konsolę) w folderze projektu.
2. Wpisz: `npm run build` (zbuduje najnowszą wersję).
3. Wpisz: `npm run electron:start` (uruchomi okno gry).

### Sposób 2: Szybki podgląd zmian (Tryb Webowy)
Jeśli edytujesz kod i chcesz od razu widzieć zmiany w przeglądarce:
Wpisz w terminalu: `npm run dev`

### Sposób 3: Odpalenie gotowego stanowiska (Dla graczy)
Po skompilowaniu projektu do pliku `.exe` (szczegóły niżej), wystarczy dwukrotnie kliknąć instalator / plik gry. Gra od razu uruchomi się w trybie automatu.

---

## ⚙️ Konfiguracja i modyfikacje

### 1. Jak dodać własne zdjęcia do Puzzli?
1. Wklej swoje zdjęcia (w formacie `.jpg`) do folderu `public/puzzle/`.
2. Zmień ich nazwy na np. `1.jpg`, `2.jpg`, `3.jpg`.
3. Jeśli zmienisz nazwy lub dodasz więcej plików (np. `4.jpg`), otwórz plik **`src/components/Puzzle.tsx`** i dopisz je do listy `myImages` na samej górze kodu.
*(Gra sama sprawdzi, czy zdjęcie jest pionowe czy poziome i odpowiednio obróci siatkę kafelków!)*

### 2. Jak edytować pytania w Quizie?
Edytuj plik `public/quiz.txt`. Każde pytanie to jedna linijka. Oddzielaj elementy pionową kreską `|`.
Format: `Pytanie | Odp1, Odp2, Odp3, Odp4 | Numer_Poprawnej (od zera!) | Poziom_trudnosci`
Przykład: `Co pływa po wodzie? | Statek, Samochód, Rower, Ptak | 0 | baby`

### 3. Tabela Wyników (Hall of Fame)
Wyniki są zapisywane i sortowane w pełni automatycznie:
- **Quiz:** Najpierw wysoki wynik (%), potem najkrótszy czas.
- **Puzzle:** Najpierw najkrótszy czas, potem najmniej ruchów.
- **Wiry:** Najkrótsza trasa (najmniej punktów dystansu).

---

## 🔑 Tryb Administratora i Bezpieczeństwo

Aby nikt przypadkiem nie wyłączył gry na stoisku, **skróty takie jak `Alt+F4` oraz `F11` są całkowicie zablokowane**.

Aby wyjść z gry lub zmniejszyć okno, musisz użyć ukrytego skrótu:
**Wciśnij jednocześnie: `Ctrl + Shift + L`**
Spowoduje to wysunięcie Menu Administratora, z którego możesz bezpiecznie wyłączyć aplikację lub zwinąć pełny ekran.

### Jak zresetować tabele wyników na czysto?
Wyniki w wersji z Electronem zapisują się w plikach systemowych Windowsa. Aby je wyczyścić przed nowym dniem pikniku:
1. Wciśnij na klawiaturze `Win + R`.
2. Wpisz `%APPDATA%` i wciśnij Enter.
3. Wejdź do folderu `morska-przygoda-pro` i usuń folder **`Local Storage`**.
4. Przy następnym uruchomieniu gry, tabele będą puste!

---

## 📦 Kompilacja do gotowego pliku .exe

Kiedy gra jest w 100% gotowa, możesz spakować ją do jednego pliku instalacyjnego `.exe`, który bez problemu przeniesiesz na pendrive na dowolnego laptopa.

1. Otwórz terminal w folderze projektu.
2. Wpisz komendę:
   `npm run electron:build`
3. Poczekaj kilka minut. Gotowy instalator pojawi się w nowo utworzonym folderze **`release/`**.

---

## 📜 Licencja
Projekt udostępniany na licencji **MIT**. Pracownia Modelowania Procesów Fizycznych w Morzu i Atmosferze, Zakład Dynamiki Morza IOPAN. Baw się dobrze i ucz innych!
