/**
 * deadletter — 편지 피드 렌더링
 * letters.json을 fetch하여 편지 카드를 렌더링하고 무한 스크롤을 지원한다.
 */

const LETTERS_PER_PAGE = 10;
let allLetters = [];
let displayedCount = 0;
let isLoading = false;

function timeAgo(dateStr) {
  const now = new Date();
  const then = new Date(dateStr);
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function createLetterCard(letter) {
  const article = document.createElement('article');
  article.className = 'letter';
  article.id = 'letter-' + letter.id;

  const liked = isLiked(letter.id);
  const likeClass = liked ? 'letter-stat liked' : 'letter-stat';
  const likeCount = liked ? letter.likes + 1 : letter.likes;

  article.innerHTML =
    '<div class="letter-meta">' +
      '<span class="letter-id"><a href="letter.html?id=' + letter.id + '">' + letter.id + '</a></span>' +
      '<span class="letter-time">' + timeAgo(letter.created) + '</span>' +
    '</div>' +
    '<div class="letter-body">\u201C' + escapeHtml(letter.text) + '\u201D</div>' +
    '<div class="letter-reply">' +
      '<div class="letter-reply-label">deadletter replied</div>' +
      '<p>' + escapeHtml(letter.reply) + '</p>' +
    '</div>' +
    '<div class="letter-stats">' +
      '<button class="' + likeClass + '" onclick="handleLike(\'' + letter.id + '\', this)">\u2665 ' + likeCount + '</button>' +
      '<button class="letter-stat" onclick="shareLetter(\'' + letter.id + '\')">\u2197 share</button>' +
    '</div>';

  return article;
}

function renderNextBatch() {
  if (isLoading || displayedCount >= allLetters.length) return;
  isLoading = true;

  const feed = document.getElementById('feed');
  const end = Math.min(displayedCount + LETTERS_PER_PAGE, allLetters.length);

  for (let i = displayedCount; i < end; i++) {
    feed.appendChild(createLetterCard(allLetters[i]));
  }

  displayedCount = end;
  isLoading = false;
}

function handleLike(id, btn) {
  if (isLiked(id)) return;
  addLike(id);
  btn.classList.add('liked');
  var num = parseInt(btn.textContent.replace(/[^0-9]/g, '')) + 1;
  btn.innerHTML = '\u2665 ' + num;
}

function shareLetter(id) {
  var url = window.location.origin + '/letter.html?id=' + id;
  if (navigator.share) {
    navigator.share({ title: 'deadletter ' + id, url: url });
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(url);
  }
}

async function loadLetters() {
  var feed = document.getElementById('feed');
  try {
    var res = await fetch('data/letters.json');
    var data = await res.json();
    allLetters = data.letters;

    if (allLetters.length === 0) {
      feed.innerHTML = '<div class="empty-state"><h2>No letters yet</h2><p>Be the first to send what you can\'t say.</p></div>';
      return;
    }

    feed.innerHTML = '';
    feed.classList.remove('loading');
    renderNextBatch();

  } catch (e) {
    feed.innerHTML = '<div class="empty-state"><h2>No letters yet</h2><p>Be the first to send what you can\'t say.</p></div>';
  }
}

// 무한 스크롤
window.addEventListener('scroll', function() {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
    renderNextBatch();
  }
});

loadLetters();
