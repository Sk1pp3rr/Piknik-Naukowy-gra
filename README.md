# 🌊 Bałtycka Akademia Odkrywców

Interaktywna aplikacja webowa z grami edukacyjnymi o tematyce morskiej. Projekt łączy naukę fizyki morza (wiry), logiczne myślenie (puzzle) oraz wiedzę ogólną (quiz).

## 📁 Struktura plików

Aby aplikacja działała poprawnie, zachowaj poniższy układ:

    /Projekt
    ├── index.html             # Główny kod aplikacji
    ├── quiz.txt               # Opcjonalny plik z Twoimi pytaniami
    └── assets/
        └── images/            # Tu wrzucaj zdjęcia do puzzli
            ├── puzzle1.jpg
            ├── puzzle2.jpg
            └── ...


## ⚙️ Konfiguracja i dostosowanie

### 1. Zdjęcia w Puzzlach
* **Gdzie wrzucać:** Do folderu `assets/images/`.
* **Nazewnictwo:** Pliki najlepiej nazywać `puzzle1.jpg`, `puzzle2.jpg` itd. (nominalnie są 3, można dodać lub usunąć w kodzie)
* **Zmiana w kodzie:** Jeśli zmienisz nazwy plików lub dodasz nowe, zaktualizuj tablicę `myImages` w sekcji JavaScript w pliku `index.html`.

### 2. Quiz – Plik vs Kod (Hardcoded)
Aplikacja jest inteligentna i posiada dwa tryby działania:
* **Tryb Serwerowy (Zalecany):** Jeśli uruchamiasz grę przez lokalny serwer (np. Live Server w VS Code), gra pobierze pytania z pliku `quiz.txt`. Pozwala to na łatwą edycję pytań bez dotykania kodu HTML.
* **Tryb Offline / Hardcoded:** Jeśli otwierasz plik `index.html` bezpośrednio podwójnym kliknięciem (bez serwera), przeglądarka zablokuje dostęp do pliku `.txt`. Wtedy gra automatycznie użyje **pytań zaszytych na sztywno w kodzie** (`fallbackQuestions`). Dzięki temu gra nigdy się nie psuje.

### 3. Tabela Wyników (Hall of Fame)
* Wyniki są zapisywane w pamięci przeglądarki (`localStorage`). 
* Sortowanie odbywa się automatycznie:
    * **Quiz:** Najpierw punkty (%), potem najkrótszy czas.
    * **Puzzle:** Najpierw najkrótszy czas, potem liczba ruchów.
    * **Wiry:** Najkrótsza trasa (najmniej punktów dystansu).

## 🚀 Uruchomienie

1. **Szybki start:** Otwórz `index.html` w dowolnej przeglądarce (zadziałają funkcje podstawowe i pytania wbudowane).
2. **Pełna funkcjonalność:** Uruchom projekt przez **Live Server** w edytorze takim jak Visual Studio Code, aby móc wczytywać własny plik `quiz.txt` oraz dynamicznie losować zdjęcia z folderu.

## 📜 Licencja
Projekt udostępniany na licencji **MIT**. Możesz go dowolnie modyfikować i udostępniać dalej, po prostu baw się dobrze i ucz innych! ⚓