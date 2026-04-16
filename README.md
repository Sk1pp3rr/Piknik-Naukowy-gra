# Bałtycka Akademia Odkrywców

Interaktywna aplikacja webowa z grami edukacyjnymi o tematyce morskiej. Projekt łączy naukę fizyki morza (wiry), logiczne myślenie (puzzle) oraz wiedzę ogólną (quiz).

## Struktura plików

Projekt został podzielony na moduły i foldery, aby kod był czysty i łatwy w edycji:

    /Piknik-Naukowy-gra
    ├── start.exe              # Plik startowy (uruchamia lokalny serwer i grę)
    ├── serwer.py              # Skrypt bazowy serwera
    ├── index.html             # Główny szkielet aplikacji
    ├── style.css              # Wygląd i motyw graficzny
    ├── quiz.txt               # Baza pytań do quizu (łatwa edycja)
    ├── README.md              # Instrukcja projektu
    ├── skrypt/                # Folder z logiką gier
    │   ├── main.js            # Rdzeń, nawigacja i system wyników (Arcade)
    │   ├── wiry.js            # Logika fizyki prądów morskich
    │   ├── puzzle.js          # Logika tasowania i układania puzzli
    │   └── quiz.js            # Logika quizu
    └── assets/
        └── images/            # Tu wrzucaj swoje zdjęcia do puzzli
            ├── puzzle1.jpg
            └── puzzle2.jpg
            └── ...


## Jak to uruchomić?

Masz do wyboru trzy sposoby uruchomienia gry, w zależności od tego, do czego jej potrzebujesz:

### Sposób 1: Dla graczy (Zalecany - "Złoty Środek")
Kliknij dwukrotnie w plik **`start.exe`** (lub ten, który wygenerowałeś). W tle uruchomi się lekki serwer, a gra automatycznie otworzy się w Twojej domyślnej przeglądarce. Pobierze wszystkie zdjęcia i pytania z plików.

### Sposób 2: Do edycji
Otwórz folder projektu w edytorze (np. Visual Studio Code) i użyj rozszerzenia **Live Server** na pliku `index.html`. Idealne do testowania zmian w kodzie na żywo.

### Sposób 3: Awaryjny (Bez serwera)
Możesz po prostu kliknąć dwukrotnie w `index.html`. Gra się włączy, ale nie załaduje `quiz.txt`. Gra załaduje wtedy wbudowane w kod pytania awaryjne(słaba opcja bardzo) oraz domyślne zdjęcia. Zawsze działa!

---

## Konfiguracja i modyfikacje

### 1. Jak dodać własne zdjęcia do Puzzli?
1. Wklej swoje zdjęcia do folderu `assets/images/` (zalecane proporcje to 4:3).
2. Otwórz plik **`puzzle.js`** w notatniku lub edytorze kodu.
3. Znajdź listę `myImages` (na samej górze pliku) i dopisz swoje zdjęcia:
   ```javascript
   const myImages = [
       'assets/images/puzzle1.jpg',
       'assets/images/moj_nowy_statek.jpg'
   ];
(bazowo są tam 3 nazwy puzzle1.jpg, puzzle2.jpg, puzzle3.jpg, jeżeli nie chce się nic tam w kodzie zmieniać to wystarczy wrzucić do assets/iamges dokładnie tak nazwane 3 pliki i też będzie gicior)
### 2. Jak edytować pytania w Quizie?
Edytuj plik quiz.txt. Każde pytanie to jedna linijka. Oddzielaj elementy pionową kreską |.
Format: Pytanie | Odp1,Odp2,Odp3,Odp4 | Numer_Poprawnej (od zera!) | Poziom_trudnosci
Przykład: Co pływa po wodzie? | Statek,Samochod,Rower,Ptak | 0 | baby

### 3. Tabela Wyników (Hall of Fame)
Wyniki są zapisywane w pamięci przeglądarki (localStorage). System sam je sortuje:

Quiz: Najpierw wysoki wynik (%), potem najkrótszy czas.

Puzzle: Najpierw najkrótszy czas, potem najmniej ruchów.

Wiry: Najkrótsza trasa (najmniej punktów dystansu).

## Kompliacja do exe
Jeśli edytowałeś plik start_gra.py i chcesz wygenerować nowy plik wykonywalny:

Upewnij się, że masz Pythona i bibliotekę PyInstaller (pip install pyinstaller).

Otwórz konsolę w folderze z grą i wpisz:
python -m pyinstaller --onefile -n start serwer.py
(lub użyj własnej ikonki dodając flagę -i ikona.ico)

Gotowy plik znajdziesz w folderze dist. (a żeby działało to ma być tak jak w **Struktura Plików**)

## Licencja
Projekt udostępniany na licencji **MIT**. Możesz go dowolnie modyfikować i udostępniać dalej, po prostu baw się dobrze i ucz innych!