/**
 * deadletter — 공감(좋아요) 기능
 * localStorage를 사용하여 클라이언트 사이드 좋아요를 관리한다.
 */

var LIKES_KEY = 'deadletter_likes';

function getLikedIds() {
  try {
    return JSON.parse(localStorage.getItem(LIKES_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function isLiked(letterId) {
  return getLikedIds().indexOf(letterId) !== -1;
}

function addLike(letterId) {
  var liked = getLikedIds();
  if (liked.indexOf(letterId) === -1) {
    liked.push(letterId);
    localStorage.setItem(LIKES_KEY, JSON.stringify(liked));
  }
}
