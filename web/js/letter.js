/**
 * deadletter — 개별 편지 상세 페이지
 * URL 파라미터에서 letter ID를 읽어 해당 편지를 렌더링한다.
 */

function timeAgo(dateStr) {
  var now = new Date();
  var then = new Date(dateStr);
  var diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

function escapeHtml(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function handleLike(id, btn) {
  if (isLiked(id)) return;
  addLike(id);
  btn.classList.add('liked');
  var num = parseInt(btn.textContent.replace(/[^0-9]/g, '')) + 1;
  btn.innerHTML = '\u2665 ' + num;
}

function shareLetter(id) {
  var url = window.location.href;
  if (navigator.share) {
    navigator.share({ title: 'deadletter ' + id, url: url });
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(url);
  }
}

async function loadLetter() {
  var container = document.getElementById('letter-content');
  var params = new URLSearchParams(window.location.search);
  var letterId = params.get('id');

  if (!letterId) {
    container.innerHTML = '<div class="empty-state"><h2>Letter not found</h2><p><a href="letters.html" class="back-link">View all letters</a></p></div>';
    return;
  }

  try {
    var res = await fetch('data/letters.json');
    var data = await res.json();
    var letter = data.letters.find(function(l) { return l.id === letterId; });

    if (!letter) {
      container.innerHTML = '<div class="empty-state"><h2>Letter not found</h2><p><a href="letters.html" class="back-link">View all letters</a></p></div>';
      return;
    }

    // OG 태그 업데이트
    document.title = letter.id + ' \u2014 deadletter';
    var ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.content = letter.text.substring(0, 150);
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = letter.id + ' \u2014 deadletter';

    var liked = isLiked(letter.id);
    var likeClass = liked ? 'letter-stat liked' : 'letter-stat';
    var likeCount = liked ? letter.likes + 1 : letter.likes;

    container.innerHTML =
      '<div class="letter-meta">' +
        '<span class="letter-id">' + letter.id + '</span>' +
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

    container.classList.remove('loading');

  } catch (e) {
    container.innerHTML = '<div class="empty-state"><h2>Could not load letter</h2><p>Please try again later.</p></div>';
  }
}

loadLetter();
