import { Actor } from 'apify';
import { PlaywrightCrawler, Dataset } from 'crawlee';

await Actor.init();

const input = await Actor.getInput();
const {
    groupUrls = [],
    cookies = [],
    maxPosts = 50,
    includeMeta = true,
    includeComments = false,
    maxComments = 10,
    includeReactions = true,
    scrollDelay = 2000,
    dateFrom = null,
    dateTo = null,
    contentFilter = '',
} = input;

if (!cookies || cookies.length === 0) {
    throw new Error('Musisz podać cookies do autoryzacji!');
}

if (!groupUrls || groupUrls.length === 0) {
    throw new Error('Musisz podać przynajmniej jeden URL grupy!');
}

// Normalizacja cookies - naprawienie formatu dla Playwright
const normalizedCookies = cookies.map(cookie => {
    // Mapowanie sameSite na poprawne wartości
    let sameSite = 'Lax'; // domyślna wartość
    if (cookie.sameSite === 'no_restriction' || cookie.sameSite === 'none') {
        sameSite = 'None';
    } else if (cookie.sameSite === 'lax') {
        sameSite = 'Lax';
    } else if (cookie.sameSite === 'strict') {
        sameSite = 'Strict';
    } else if (!cookie.sameSite) {
        sameSite = 'Lax';
    }

    return {
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path || '/',
        expires: cookie.expirationDate || -1,
        httpOnly: cookie.httpOnly || false,
        secure: cookie.secure || false,
        sameSite: sameSite
    };
});

const crawler = new PlaywrightCrawler({
    launchContext: {
        launchOptions: {
            headless: true,
        },
    },
    async requestHandler({ page, request, log }) {
        log.info(`Scrapowanie: ${request.url}`);

        // Wstrzykiwanie cookies
        await page.context().addCookies(normalizedCookies);
        
        await page.goto(request.url, { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);

        // Sprawdzenie czy jesteśmy zalogowani
        const isLoggedIn = await page.evaluate(() => {
            return !document.body.innerText.includes('Zaloguj się') && 
                   !document.body.innerText.includes('Log In');
        });

        if (!isLoggedIn) {
            log.warning('Nie udało się zalogować. Sprawdź cookies!');
            return;
        }

        log.info('Zalogowano pomyślnie. Rozpoczynam zbieranie postów...');

        const posts = [];
        let scrollCount = 0;
        const maxScrolls = Math.ceil(maxPosts / 10);

        // Scrollowanie i zbieranie postów
        while (scrollCount < maxScrolls && posts.length < maxPosts) {
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await page.waitForTimeout(scrollDelay);

            const newPosts = await page.evaluate((options) => {
                const postsData = [];
                const postElements = document.querySelectorAll('[role="article"]');

                postElements.forEach((post) => {
                    try {
                        // Treść posta
                        const contentEl = post.querySelector('[data-ad-preview="message"]') || 
                                        post.querySelector('[data-ad-comet-preview="message"]') ||
                                        post.querySelector('div[dir="auto"]');
                        const content = contentEl ? contentEl.innerText : '';

                        // Pomijanie jeśli jest filtr treści
                        if (options.contentFilter && !content.toLowerCase().includes(options.contentFilter.toLowerCase())) {
                            return;
                        }

                        // Autor
                        const authorEl = post.querySelector('a[role="link"] span');
                        const author = authorEl ? authorEl.innerText : 'Nieznany';

                        // Link do autora
                        const authorLinkEl = post.querySelector('a[role="link"]');
                        const authorLink = authorLinkEl ? authorLinkEl.href : '';

                        // Data
                        const dateEl = post.querySelector('a[href*="posts"] span') || 
                                     post.querySelector('a[href*="permalink"] span');
                        const dateText = dateEl ? dateEl.innerText : '';

                        // Link do posta
                        const postLinkEl = post.querySelector('a[href*="/posts/"]') ||
                                         post.querySelector('a[href*="/permalink/"]');
                        const postLink = postLinkEl ? postLinkEl.href : '';

                        // Reakcje
                        let reactions = {};
                        if (options.includeReactions) {
                            const reactionsEl = post.querySelector('[aria-label*="reakcj"]') ||
                                              post.querySelector('[aria-label*="reaction"]');
                            const reactionsText = reactionsEl ? reactionsEl.getAttribute('aria-label') : '';
                            
                            // Wyciąganie liczby reakcji
                            const reactionsMatch = reactionsText.match(/\d+/);
                            reactions = {
                                total: reactionsMatch ? parseInt(reactionsMatch[0]) : 0,
                                text: reactionsText
                            };
                        }

                        // Liczba komentarzy
                        let commentsCount = 0;
                        const commentsEl = post.querySelector('[aria-label*="komentarz"]') ||
                                         post.querySelector('[aria-label*="comment"]');
                        if (commentsEl) {
                            const commentsMatch = commentsEl.innerText.match(/\d+/);
                            commentsCount = commentsMatch ? parseInt(commentsMatch[0]) : 0;
                        }

                        // Zdjęcia/media
                        const images = [];
                        const imgElements = post.querySelectorAll('img[src*="scontent"]');
                        imgElements.forEach(img => {
                            if (img.src && !img.src.includes('emoji')) {
                                images.push(img.src);
                            }
                        });

                        const postData = {
                            content,
                            author,
                            authorLink,
                            date: dateText,
                            postLink,
                            images,
                            commentsCount,
                        };

                        if (options.includeReactions) {
                            postData.reactions = reactions;
                        }

                        if (content || images.length > 0) {
                            postsData.push(postData);
                        }
                    } catch (err) {
                        console.error('Błąd przy przetwarzaniu posta:', err);
                    }
                });

                return postsData;
            }, { includeReactions, contentFilter });

            // Dodawanie nowych postów (unikanie duplikatów)
            newPosts.forEach(newPost => {
                if (!posts.find(p => p.postLink === newPost.postLink)) {
                    posts.push(newPost);
                }
            });

            log.info(`Zebrano ${posts.length} postów...`);
            scrollCount++;

            if (posts.length >= maxPosts) break;
        }

        // Filtrowanie po dacie jeśli podano
        let filteredPosts = posts.slice(0, maxPosts);

        // Zbieranie komentarzy jeśli włączone
        if (includeComments && filteredPosts.length > 0) {
            log.info('Zbieranie komentarzy...');
            
            for (let i = 0; i < Math.min(filteredPosts.length, 5); i++) {
                const post = filteredPosts[i];
                if (post.postLink) {
                    try {
                        await page.goto(post.postLink, { waitUntil: 'networkidle' });
                        await page.waitForTimeout(2000);

                        const comments = await page.evaluate((max) => {
                            const commentsData = [];
                            const commentElements = document.querySelectorAll('[role="article"]');

                            for (let i = 0; i < Math.min(commentElements.length, max); i++) {
                                const comment = commentElements[i];
                                const authorEl = comment.querySelector('a[role="link"] span');
                                const contentEl = comment.querySelector('div[dir="auto"]');

                                if (authorEl && contentEl) {
                                    commentsData.push({
                                        author: authorEl.innerText,
                                        content: contentEl.innerText,
                                    });
                                }
                            }

                            return commentsData;
                        }, maxComments);

                        post.comments = comments;
                    } catch (err) {
                        log.warning(`Nie udało się pobrać komentarzy dla posta: ${err.message}`);
                    }
                }
            }
        }

        // Zapisywanie do datasetu
        await Dataset.pushData(filteredPosts);
        log.info(`Zapisano ${filteredPosts.length} postów do datasetu`);
    },

    maxRequestsPerCrawl: groupUrls.length,
    maxConcurrency: 1,
});

await crawler.run(groupUrls);

await Actor.exit();
