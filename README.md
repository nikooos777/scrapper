Facebook Group Scraper
Profesjonalny scraper do zbierania postów, komentarzy i reakcji z grup na Facebooku.

🚀 Jak używać
1. Pobierz cookies z Facebooka
Krok po kroku:

Zaloguj się na Facebooku w przeglądarce Chrome/Firefox
Przejdź do grupy, którą chcesz scrapować
Otwórz narzędzia deweloperskie (F12)
Przejdź do zakładki "Application" (Chrome) lub "Storage" (Firefox)
Kliknij "Cookies" → "https://www.facebook.com"
Użyj rozszerzenia: Zainstaluj "EditThisCookie" lub "Cookie-Editor" i wyeksportuj cookies jako JSON
Alternatywnie - użyj tego kodu w konsoli:

javascript
copy(JSON.stringify(document.cookie.split('; ').map(c => {
    const [name, value] = c.split('=');
    return {
        name,
        value,
        domain: '.facebook.com',
        path: '/',
        secure: true,
        httpOnly: false
    };
})))
2. Skonfiguruj scraper
W interfejsie Apify wypełnij pola:

URLs grup: Wklej linki do grup (np. https://www.facebook.com/groups/twoja-grupa)
Cookies: Wklej skopiowany JSON z cookies
Maksymalna liczba postów: Ile postów chcesz pobrać (domyślnie 50)
Opcje dodatkowe: Reakcje, komentarze, filtry
3. Uruchom scraper
Kliknij "Start" i czekaj na wyniki!

📊 Co zbiera scraper?
Dla każdego posta:

✅ Treść posta
✅ Autor i link do profilu
✅ Data publikacji
✅ Link do posta
✅ Zdjęcia/media
✅ Liczba komentarzy
✅ Reakcje (opcjonalnie)
✅ Komentarze (opcjonalnie)
⚙️ Konfiguracja
Podstawowe opcje
groupUrls: Lista URLi grup do scrapowania
cookies: Cookies z przeglądarki (WYMAGANE)
maxPosts: Maksymalna liczba postów (1-1000)
Opcje zaawansowane
scrollDelay: Opóźnienie między scrollowaniami (ms) - wyższe = bezpieczniejsze
includeReactions: Zbieraj informacje o reakcjach
includeComments: Zbieraj komentarze pod postami
maxComments: Ile komentarzy na post (jeśli włączone)
contentFilter: Zbieraj tylko posty zawierające konkretne słowo
dateFrom/dateTo: Filtrowanie po dacie (format: YYYY-MM-DD)
🔒 Bezpieczeństwo
⚠️ WAŻNE UWAGI:

Legalność: Scraping Facebooka może naruszać Terms of Service
Rate limiting: Używaj wysokich wartości scrollDelay (2000ms+)
Cookies: Nie udostępniaj swoich cookies nikomu
RODO: Zbierając dane osobowe, przestrzegaj przepisów
Ban: Facebook może zbanować konto za zbyt agresywne scrapowanie
🐛 Troubleshooting
"Nie udało się zalogować"
Sprawdź czy cookies są prawidłowe
Upewnij się, że cookies nie wygasły (zaloguj się ponownie)
Cookies muszą być z tej samej sesji przeglądarki
"Nie znaleziono postów"
Sprawdź czy URL grupy jest prawidłowy
Upewnij się, że masz dostęp do grupy
Zwiększ scrollDelay (Facebook może blokować)
Scraper zatrzymuje się
Zwiększ scrollDelay
Zmniejsz maxPosts
Sprawdź czy cookies nie wygasły
📝 Format outputu
json
{
  "content": "Treść posta...",
  "author": "Jan Kowalski",
  "authorLink": "https://www.facebook.com/jan.kowalski",
  "date": "2 godz.",
  "postLink": "https://www.facebook.com/groups/123/posts/456",
  "images": ["https://..."],
  "commentsCount": 15,
  "reactions": {
    "total": 42,
    "text": "42 osoby polubiły to"
  },
  "comments": [
    {
      "author": "Anna Nowak",
      "content": "Super post!"
    }
  ]
}
📦 Export danych
Dane możesz wyeksportować jako:

JSON
CSV
Excel
XML
Kliknij "Export results" w interfejsie Apify.

🆘 Wsparcie
Jeśli masz problemy:

Sprawdź logi w interfejsie Apify
Upewnij się, że cookies są prawidłowe
Zwiększ opóźnienia między requestami
⚖️ Licencja i odpowiedzialność
Ten scraper jest dostarczany "as is" bez gwarancji. Użytkownik ponosi pełną odpowiedzialność za zgodność z prawem i Terms of Service Facebooka.

USE AT YOUR OWN RISK!

