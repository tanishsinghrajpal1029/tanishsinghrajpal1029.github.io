(() => {
  const script = document.currentScript;
  if (!script || document.querySelector('.site-guide')) return;
  const root = new URL('../', script.src);
  const asset = path => new URL(path, root).href;
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = asset('assets/site-assistant.css?v=1');
  document.head.append(stylesheet);

  const guide = document.createElement('aside');
  guide.className = 'site-guide';
  guide.setAttribute('aria-label', 'Website guide');
  guide.innerHTML = `
    <section class="site-guide__panel" id="site-guide-panel" aria-label="Website guide conversation" hidden>
      <div class="site-guide__header">
        <img src="${asset('assets/site-guide-mascot.png')}" alt="" aria-hidden="true">
        <div class="site-guide__identity"><strong>Site guide</strong><span>Answers from the site and linked sources</span></div>
        <button class="site-guide__close" type="button" aria-label="Close site guide">×</button>
      </div>
      <div class="site-guide__messages" role="log" aria-live="polite" aria-relevant="additions text"></div>
      <div class="site-guide__prompts" aria-label="Suggested questions"></div>
      <form class="site-guide__form">
        <input type="text" aria-label="Ask about this website" placeholder="Ask about the work…" maxlength="200" autocomplete="off" required>
        <button type="submit">Ask</button>
      </form>
      <p class="site-guide__note">Uses published content and selected linked sources. No AI service or chat history storage.</p>
    </section>
    <button class="site-guide__launcher" type="button" aria-controls="site-guide-panel" aria-expanded="false" aria-label="Open website guide">
      <img src="${asset('assets/site-guide-mascot.png')}" alt="" aria-hidden="true"><span>Ask about this site</span>
    </button>`;
  document.body.append(guide);

  const panel = guide.querySelector('.site-guide__panel');
  const launcher = guide.querySelector('.site-guide__launcher');
  const close = guide.querySelector('.site-guide__close');
  const messages = guide.querySelector('.site-guide__messages');
  const prompts = guide.querySelector('.site-guide__prompts');
  const form = guide.querySelector('.site-guide__form');
  const input = form.querySelector('input');
  let indexPromise;
  let initialized = false;

  const stop = new Set('a about an and are at by can did do does explain find for from how i in info is know me my of on or our please say show tell the this to what where who with you your tanish rajpal singh'.split(' '));
  const normalize = word => {
    if (/^chem/u.test(word)) return 'chem';
    if (/^entang/u.test(word)) return 'entangl';
    if (/^correct/u.test(word)) return 'correct';
    if (/^network/u.test(word)) return 'network';
    if (/^quant/u.test(word)) return 'quantum';
    return word.replace(/(ing|ions|ies|s)$/u, '');
  };
  const words = value => (value.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [])
    .filter(word => word.length > 2 && !stop.has(word))
    .map(normalize);
  const compact = value => value.replace(/\s+/g, ' ').trim();
  const excerpt = (value, length = 165) => {
    const text = compact(value);
    return text.length > length ? `${text.slice(0, length).replace(/\s+\S*$/, '')}…` : text;
  };
  const linkedSources = element => [...element.querySelectorAll('a[href^="https://"]')]
    .map(link => ({ title: compact(link.textContent) || new URL(link.href).hostname, href: link.href }))
    .filter((link, index, links) => links.findIndex(other => other.href === link.href) === index);
  const passagesFrom = (container, selector) => [...container.querySelectorAll(selector)]
    .map(element => ({ text: compact(element.textContent), links: linkedSources(element) }))
    .filter(passage => passage.text.length > 25);

  async function loadIndex() {
    const [homeResponse, postsResponse] = await Promise.all([
      fetch(asset('index.html')),
      fetch(asset('Posts/index.html'))
    ]);
    if (!homeResponse.ok || !postsResponse.ok) throw new Error('Website index unavailable');
    const parser = new DOMParser();
    const home = parser.parseFromString(await homeResponse.text(), 'text/html');
    const posts = parser.parseFromString(await postsResponse.text(), 'text/html');
    const entries = [];
    const sectionNames = ['about', 'research', 'publications', 'projects', 'experience', 'recognition'];
    sectionNames.forEach(id => {
      const section = home.getElementById(id);
      if (!section) return;
      const itemTitles = [...section.querySelectorAll('article.entry h3, .row h3, article.publication .citation')]
        .map(heading => compact(heading.textContent));
      entries.push({
        title: section.querySelector('h2')?.textContent || id,
        summary: excerpt(itemTitles.length ? itemTitles.join(' · ') : section.querySelector('.lede, p')?.textContent || section.textContent),
        search: section.textContent,
        href: asset(`index.html#${id}`),
        kind: 'section',
        links: linkedSources(section),
        passages: passagesFrom(section, id === 'about' ? '.about-copy p' : 'article.entry p, .row p, article.publication p')
      });
      section.querySelectorAll('article.entry, article.publication, .row').forEach(item => {
        const citation = item.querySelector('.citation');
        const title = citation
          ? compact(citation.textContent).replace(/^.*?\(\d{4}\)\.\s*/u, '').split(/\.\s/u)[0]
          : compact(item.querySelector('h3')?.textContent || '');
        if (!title) return;
        entries.push({
          title,
          summary: excerpt(item.querySelector('p:not(.kicker):not(.research-dek)')?.textContent || item.textContent),
          search: item.textContent,
          href: asset(`index.html#${id}`),
          kind: citation ? 'publication' : id,
          links: linkedSources(item),
          passages: passagesFrom(item, 'p, li')
        });
      });
    });
    const postEntries = [];
    posts.querySelectorAll('.post-card').forEach(card => {
      const link = card.querySelector('h2 a');
      if (!link) return;
      postEntries.push({
        title: compact(link.textContent),
        summary: excerpt(card.querySelector('.card-body > p')?.textContent || ''),
        search: card.textContent,
        href: new URL(link.getAttribute('href'), asset('Posts/index.html')).href,
        kind: 'post',
        links: [],
        passages: []
      });
    });
    await Promise.all(postEntries.map(async entry => {
      try {
        const response = await fetch(entry.href);
        if (!response.ok) return;
        const page = parser.parseFromString(await response.text(), 'text/html');
        const prose = page.querySelector('.prose');
        if (!prose) return;
        entry.passages = passagesFrom(prose, 'p, li');
        entry.links = linkedSources(prose);
        entry.search += ` ${prose.textContent}`;
      } catch { /* A single missing post must not break the guide. */ }
    }));
    entries.push(...postEntries);
    const linkedNotes = [
      {
        title: 'Hengyun (Harry) Zhou’s Q-FARM seminar abstract',
        href: 'https://qfarm.stanford.edu/events/q-farm-seminars/hengyun-harry-zhou-mit',
        text: 'Stanford Q-FARM describes Zhou’s October 7, 2026 seminar on ultra-high-rate quantum error correction. Its abstract covers tradeoffs among encoding rate, distance, check weight, and blocklength, then discusses code designs with rates above one half, efficient syndrome extraction, neutral-atom rearrangement, and hierarchical decoding.'
      },
      {
        title: 'Stanford DEFCON 2026 program',
        href: 'https://www.stanforddefcon.org/',
        text: 'Stanford DEFCON lists its conference on October 7, 2026 at Stanford University and identifies former Taiwan President Tsai Ing-wen as a keynote speaker. The program page does not provide a transcript of her remarks.'
      },
      {
        title: 'Prof. David Yaron’s CMU Chemistry profile',
        href: 'https://www.cmu.edu/chemistry/people/faculty/yaron.html',
        text: 'Carnegie Mellon describes Prof. David Yaron’s work on machine learning for quantum-chemical models. His group develops physically grounded semiempirical models to reduce computational cost while retaining interpretable chemical structure. The profile lists electronic structure theory, machine learning, materials theory, photophysics, and spectroscopy among his research areas.'
      }
    ];
    entries.push(...linkedNotes.map(note => ({
      title: note.title,
      summary: excerpt(note.text),
      search: `${note.title} ${note.text}`,
      href: note.href,
      kind: 'linked-source',
      links: [],
      passages: [{ text: note.text, links: [] }]
    })));
    return entries;
  }

  function message(text, from = 'bot') {
    const item = document.createElement('div');
    item.className = `site-guide__message site-guide__message--${from}`;
    item.textContent = text;
    messages.append(item);
    messages.scrollTop = messages.scrollHeight;
    return item;
  }

  function results(text, matches) {
    const item = message(text);
    matches.forEach(match => {
      const link = document.createElement('a');
      link.className = 'site-guide__result';
      link.href = match.href;
      const title = document.createElement('strong');
      title.textContent = `${match.title} ↗`;
      const summary = document.createElement('span');
      summary.textContent = match.summary;
      link.append(title, summary);
      item.append(link);
    });
    messages.scrollTop = messages.scrollHeight;
  }

  function sourcedAnswer(entry, passage, related) {
    const linkedSource = entry.kind === 'linked-source';
    const item = message(linkedSource ? 'Here is what the linked source says:' : 'Here is what Tanish’s published page says:');
    const quote = document.createElement('p');
    quote.className = 'site-guide__quote';
    quote.textContent = excerpt(passage.text, 420);
    item.append(quote);
    const sources = [
      { title: `Read: ${entry.title}`, summary: linkedSource ? 'Original source' : 'Tanish’s website', href: entry.href },
      ...(passage.links.length ? passage.links : entry.links).slice(0, 2)
        .map(link => ({ ...link, summary: passage.links.length ? 'Linked source' : 'Related link on this page' }))
    ];
    if (related && related.href !== entry.href) {
      sources.push({ title: `Related: ${related.title}`, summary: related.summary, href: related.href });
    }
    sources.forEach(source => {
      const link = document.createElement('a');
      link.className = 'site-guide__result';
      link.href = source.href;
      const title = document.createElement('strong');
      title.textContent = `${source.title} ↗`;
      const summary = document.createElement('span');
      summary.textContent = source.summary;
      link.append(title, summary);
      item.append(link);
    });
    messages.scrollTop = messages.scrollHeight;
  }

  const direct = {
    cv: { title: 'Download CV', summary: 'The current PDF on this website.', href: asset('Tanish_Rajpal_CV.pdf') },
    contact: { title: 'Reach out to Tanish', summary: 'Contact details and ways to start a conversation.', href: asset('contact.html') },
    posts: { title: 'Browse all posts', summary: 'Search and filter research notes, visits, and talks.', href: asset('Posts/index.html') }
  };
  const includesAny = (text, terms) => terms.some(term => text.includes(term));

  async function answer(raw) {
    const query = compact(raw).toLowerCase();
    if (!query) return;
    message(raw, 'user');
    if (includesAny(query, ['cv', 'resume', 'résumé', 'curriculum vitae'])) {
      results('Here is Tanish’s current CV.', [direct.cv]); return;
    }
    if (includesAny(query, ['contact', 'email', 'reach out', 'get in touch'])) {
      results('You can contact Tanish here.', [direct.contact]); return;
    }
    if (includesAny(query, ['all posts', 'all articles', 'browse posts'])) {
      results('You can search or filter every post here.', [direct.posts]); return;
    }
    if (includesAny(query, ['my application', 'application status', 'track application', 'track my', 'to-do', 'todo', 'task list'])) {
      results('I can check published research updates, but I don’t have access to private application or task records. You can ask Tanish directly.', [direct.contact]);
      return;
    }
    let entries;
    try {
      indexPromise ||= loadIndex();
      entries = await indexPromise;
    } catch {
      indexPromise = undefined;
      results('I couldn’t load the site index just now. These pages are still available:', [direct.posts, direct.contact]);
      return;
    }
    if (includesAny(query, ['latest posts', 'recent posts', 'newest posts', 'what is new'])) {
      results('The newest posts on the site are:', entries.filter(entry => entry.kind === 'post').slice(0, 3));
      return;
    }
    if (includesAny(query, ['current research', 'research projects', 'what are you working on', 'what is tanish working on'])) {
      results('These are the research projects currently described on the site:', entries.filter(entry => entry.kind === 'research').slice(0, 3));
      return;
    }
    const queryWords = [...new Set(words(query))];
    const ranked = entries.map(entry => {
      const title = new Set(words(entry.title));
      const summary = new Set(words(entry.summary));
      const body = new Set(words(entry.search));
      const coverage = queryWords.filter(word => title.has(word) || summary.has(word) || body.has(word)).length;
      const score = queryWords.reduce((total, word) => total + (title.has(word) ? 6 : 0) + (summary.has(word) ? 2 : 0) + (body.has(word) ? 1 : 0), 0);
      return { entry, coverage, score };
    }).filter(result => result.score > 0).sort((a, b) => b.coverage - a.coverage || b.score - a.score);
    if (ranked.length && ranked[0].coverage >= Math.max(1, Math.ceil(queryWords.length * .6))) {
      const best = ranked[0].entry;
      const passages = best.passages || [];
      const match = passages.map(passage => {
        const terms = new Set(words(passage.text));
        const coverage = queryWords.filter(word => terms.has(word)).length;
        const score = queryWords.reduce((total, word) => total + (terms.has(word) ? 1 : 0), 0)
          + (passage.text.length > 120 ? .5 : 0);
        return { passage, coverage, score };
      }).sort((a, b) => b.coverage - a.coverage || b.score - a.score)[0];
      const publicationSummary = best.kind === 'publication'
        && queryWords.every(word => new Set(words(best.title)).has(word))
        ? passages[1] : null;
      if (match && match.coverage) {
        sourcedAnswer(best, publicationSummary || match.passage, ranked[1]?.entry);
      } else {
        results('This is the closest page I found on Tanish’s website:', [best]);
      }
    } else {
      results('I couldn’t find that in the published site. You can browse the posts or ask Tanish directly.', [direct.posts, direct.contact]);
    }
  }

  const suggestions = ['Current research', 'Latest posts', 'CV', 'Contact'];
  suggestions.forEach(text => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'site-guide__prompt';
    button.textContent = text;
    button.addEventListener('click', () => answer(text));
    prompts.append(button);
  });

  function toggle(open) {
    panel.hidden = !open;
    launcher.setAttribute('aria-expanded', String(open));
    launcher.setAttribute('aria-label', open ? 'Hide website guide' : 'Open website guide');
    if (open) {
      if (!initialized) {
        message('Hi! I can help you find Tanish’s research, recent posts, CV, or contact page. What are you looking for?');
        initialized = true;
      }
      input.focus();
    } else launcher.focus();
  }
  launcher.addEventListener('click', () => toggle(panel.hidden));
  close.addEventListener('click', () => toggle(false));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) toggle(false);
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const query = input.value.trim();
    if (!query) return;
    input.value = '';
    answer(query);
  });
})();
