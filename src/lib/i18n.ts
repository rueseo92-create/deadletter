export type Lang = "ko" | "en" | "ja" | "zh";

export const LANGUAGES: { label: string; value: Lang }[] = [
  { label: "한국어", value: "ko" },
  { label: "English", value: "en" },
  { label: "日本語", value: "ja" },
  { label: "中文", value: "zh" },
];

export const T: Record<Lang, Record<string, string>> = {
  ko: {
    // nav
    "nav.write": "write",
    "nav.letters": "letters",
    "nav.daily": "daily",

    // hero
    "hero.title": "보내지 못한 편지를\n여기에 보내세요.",
    "hero.subtitle": "절대 전달되지 않을 편지를 쓰세요.\n대신, 낯선 사람이 읽고 답장합니다.",
    "hero.cta": "편지 쓰기",
    "hero.howItWorksTitle": "How it works",
    "hero.step1title": "편지를 쓰세요",
    "hero.step1desc":
      "전 연인에게, 부모님에게, 과거의 나에게 — 말하지 못한 것을 적어주세요. 이 편지는 그 사람에게 전달되지 않습니다.",
    "hero.step2title": "비슷한 편지가 도착합니다",
    "hero.step2desc":
      "당신과 비슷한 감정의 편지가 매칭됩니다. 부모님에게 쓴 편지는 자녀에게 쓴 편지와 만납니다. 나만 이런 게 아니라는 걸 느낄 수 있어요.",
    "hero.step3title": "낯선 사람이 답장합니다",
    "hero.step3desc":
      "'나는 네 엄마가 아니지만, 엄마로서 말해줄게...' — AI가 아닌, 진짜 사람이 수신인의 입장에서 답장을 써줍니다.",
    "hero.step4title": "당신의 말이 누군가의 위로가 됩니다",
    "hero.step4desc":
      "익명화된 편지들은 아카이브에 남아, 비슷한 고민을 가진 사람들에게 위로가 됩니다.",
    "hero.sampleTitle": "LETTERS FROM STRANGERS",
    "hero.tagline": "가입 없이. 익명으로. 지금 바로.",
    "hero.bottomTitle": "당신은 누구에게\n무슨 말을 못 했나요?",
    "hero.bottomSubtitle":
      "적어보세요. 보내보세요. 그 말이 누군가에게 닿게 해주세요.",
    "hero.yourTurn": "YOUR TURN",

    // write
    "write.categoryTitle": "누구에게 쓰나요?",
    "write.categorySubtitle": "이 편지는 전달되지 않습니다.",
    "write.recipientTitle": "편지의 수신인을 적어주세요",
    "write.recipientSubtitle": "이름 대신 당신만 아는 호칭으로.",
    "write.recipientPlaceholder": "3년 전 헤어진 너에게",
    "write.emotionTitle": "어떤 마음인가요?",
    "write.emotionSubtitle": "비슷한 감정의 편지와 연결됩니다.",
    "write.bodyPlaceholder": "보내지 못한 말을 여기에 적어주세요...",
    "write.back": "뒤로",
    "write.next": "다음",
    "write.send": "편지 보내기",
    "write.sending": "편지를 보내는 중...",
    "write.charCount": "/2000",

    // done
    "done.stamp": "delivered to the void",
    "done.title": "편지가 떠났습니다",
    "done.subtitle":
      "당신의 말은 이제 바다 위를 떠다니다 누군가에게 닿을 거예요.",
    "done.matchedTitle": "당신에게 도착한 편지",
    "done.writeReply": "답장 쓰기",
    "done.writeAnother": "한 통 더 쓰기",
    "done.readOthers": "다른 편지 읽기",

    // letters
    "letters.allLetters": "ALL LETTERS",
    "letters.all": "전체",
    "letters.allEmotions": "모든 감정",
    "letters.noLetters": "아직 편지가 없어요",
    "letters.noLettersDesc": "첫 번째 편지를 써보세요.",
    "letters.loadMore": "더 보기",
    "letters.loading": "loading...",
    "letters.replyCount": "개 답장",
    "letters.share": "공유",
    "letters.ago_just": "방금",
    "letters.ago_min": "{n}분 전",
    "letters.ago_hour": "{n}시간 전",
    "letters.ago_day": "{n}일 전",

    // letter (detail)
    "letter.backToAll": "ALL LETTERS",
    "letter.notFound": "편지를 찾을 수 없어요",
    "letter.notFoundBack": "모든 편지 보기",
    "letter.repliesTitle": "Replies from strangers",
    "letter.noReplies": "아직 답장이 없어요. 첫 번째 답장을 남겨보세요.",
    "letter.replyPlaceholder": "낯선 사람으로서, 이 편지에 답장을 써주세요",
    "letter.replyLabel": "나는 \"{name}\"이/가 아니지만...",
    "letter.replySend": "답장 보내기",
    "letter.replySending": "보내는 중...",
    "letter.replySent": "답장이 전해졌습니다.",
    "letter.replyMinLength": "5자 이상 입력해 주세요.",

    // daily
    "daily.title": "오늘의 편지",
    "daily.loading": "오늘의 편지를 찾는 중...",
    "daily.noLetterTitle": "아직 읽을 편지가 없어요",
    "daily.noLetterDesc":
      "사람들이 편지를 쓰면, 매일 아침 한 통이 당신에게 도착합니다.",
    "daily.noLetterCta": "먼저 편지를 써보세요",
    "daily.envelope1": "누군가가 보내지 못한 편지가",
    "daily.envelope2": "당신에게 도착했습니다.",
    "daily.tapToRead": "탭하여 읽기",
    "daily.tomorrowNote": "내일 새로운 편지가 도착합니다",

    // footer
    "footer.copyright": "2026 deadletter · all letters anonymized",
    "footer.quote": "Some letters are meant to be lost.",

    // filter (harmful content messages)
    "filter.harmfulProfanity": "욕설이나 비속어가 포함된 편지는 보낼 수 없어요.",
    "filter.harmfulSexual": "성적인 내용이 포함된 편지는 보낼 수 없어요.",
    "filter.harmfulRecipient": "수신인에 부적절한 표현이 포함되어 있어요.",
    "filter.crisisMessage":
      "당신의 이야기를 들을 수 있어서 다행이에요. 지금 힘드시다면 전문 상담을 받아보세요.\n\n자살예방상담전화: 1393\n정신건강위기상담전화: 1577-0199",

    // translate
    "translate.showTranslation": "번역 보기",
    "translate.showOriginal": "원문만 보기",
    "translate.translating": "번역 중...",

    // categories
    "categories.ex_lover": "전 연인에게",
    "categories.parent": "부모님에게",
    "categories.child": "자녀에게",
    "categories.friend": "친구에게",
    "categories.younger_self": "과거의 나에게",
    "categories.future_self": "미래의 나에게",
    "categories.deceased": "떠난 사람에게",
    "categories.someone_who_hurt": "나를 아프게 한 사람에게",
    "categories.mentor": "은사님에게",
    "categories.stranger": "모르는 누군가에게",
    "categories.other": "그 밖의 누군가에게",

    // emotions
    "emotions.regret": "후회",
    "emotions.gratitude": "감사",
    "emotions.anger": "분노",
    "emotions.longing": "그리움",
    "emotions.forgiveness": "용서",
    "emotions.confession": "고백",
    "emotions.grief": "슬픔",
    "emotions.hope": "희망",
    "emotions.apology": "사과",
    "emotions.love": "사랑",
  },

  en: {
    // nav
    "nav.write": "write",
    "nav.letters": "letters",
    "nav.daily": "daily",

    // hero
    "hero.title": "Send the letter\nyou never could.",
    "hero.subtitle":
      "Write a letter that will never be delivered.\nInstead, a stranger reads it and writes back.",
    "hero.cta": "Write a letter",
    "hero.howItWorksTitle": "How it works",
    "hero.step1title": "Write your letter",
    "hero.step1desc":
      "To an ex, a parent, your younger self — write what you never said. This letter will never reach them.",
    "hero.step2title": "A matching letter arrives",
    "hero.step2desc":
      "You're matched with a letter carrying a similar emotion. A letter to a parent meets one from a child. You realize you're not alone.",
    "hero.step3title": "A stranger writes back",
    "hero.step3desc":
      "'I'm not your mother, but as a mother, let me say this...' — A real person, not AI, replies as the recipient would.",
    "hero.step4title": "Your words become someone's comfort",
    "hero.step4desc":
      "Anonymized letters live on in the archive, offering solace to those with similar struggles.",
    "hero.sampleTitle": "LETTERS FROM STRANGERS",
    "hero.tagline": "No signup. Anonymous. Right now.",
    "hero.bottomTitle": "Who do you have\nunfinished words for?",
    "hero.bottomSubtitle":
      "Write it down. Send it off. Let your words reach someone.",
    "hero.yourTurn": "YOUR TURN",

    // write
    "write.categoryTitle": "Who is this letter for?",
    "write.categorySubtitle": "This letter will never be delivered.",
    "write.recipientTitle": "Address your letter",
    "write.recipientSubtitle": "Use a name only you would know.",
    "write.recipientPlaceholder": "To the one I let go three years ago",
    "write.emotionTitle": "How are you feeling?",
    "write.emotionSubtitle": "You'll be matched with a letter that shares this emotion.",
    "write.bodyPlaceholder": "Write the words you never got to say...",
    "write.back": "Back",
    "write.next": "Next",
    "write.send": "Send letter",
    "write.sending": "Sending your letter...",
    "write.charCount": "/2000",

    // done
    "done.stamp": "delivered to the void",
    "done.title": "Your letter has sailed away",
    "done.subtitle":
      "Your words are now drifting across the sea, on their way to someone.",
    "done.matchedTitle": "A letter arrived for you",
    "done.writeReply": "Write a reply",
    "done.writeAnother": "Write another",
    "done.readOthers": "Read other letters",

    // letters
    "letters.allLetters": "ALL LETTERS",
    "letters.all": "All",
    "letters.allEmotions": "All emotions",
    "letters.noLetters": "No letters yet",
    "letters.noLettersDesc": "Be the first to write one.",
    "letters.loadMore": "Load more",
    "letters.loading": "loading...",
    "letters.replyCount": " replies",
    "letters.share": "Share",
    "letters.ago_just": "Just now",
    "letters.ago_min": "{n}m ago",
    "letters.ago_hour": "{n}h ago",
    "letters.ago_day": "{n}d ago",

    // letter (detail)
    "letter.backToAll": "ALL LETTERS",
    "letter.notFound": "Letter not found",
    "letter.notFoundBack": "View all letters",
    "letter.repliesTitle": "Replies from strangers",
    "letter.noReplies": "No replies yet. Be the first to reply.",
    "letter.replyPlaceholder":
      "As a stranger, write a reply to this letter",
    "letter.replyLabel": "I'm not \"{name}\", but...",
    "letter.replySend": "Send reply",
    "letter.replySending": "Sending...",
    "letter.replySent": "Your reply has been delivered.",
    "letter.replyMinLength": "Please write at least 5 characters.",

    // daily
    "daily.title": "Today's letter",
    "daily.loading": "Finding today's letter...",
    "daily.noLetterTitle": "No letters to read yet",
    "daily.noLetterDesc":
      "When people write letters, one will arrive for you every morning.",
    "daily.noLetterCta": "Write a letter first",
    "daily.envelope1": "A letter someone couldn't send",
    "daily.envelope2": "has arrived for you.",
    "daily.tapToRead": "Tap to read",
    "daily.tomorrowNote": "A new letter arrives tomorrow",

    // footer
    "footer.copyright": "2026 deadletter · all letters anonymized",
    "footer.quote": "Some letters are meant to be lost.",

    // filter
    "filter.harmfulProfanity":
      "Letters containing profanity or slurs cannot be sent.",
    "filter.harmfulSexual":
      "Letters containing sexual content cannot be sent.",
    "filter.harmfulRecipient":
      "The recipient field contains inappropriate language.",
    "filter.crisisMessage":
      "We're glad you're sharing your story. If you're struggling right now, please reach out for support.\n\nSuicide Prevention Lifeline: 988\nCrisis Text Line: Text HOME to 741741",

    // translate
    "translate.showTranslation": "Show translation",
    "translate.showOriginal": "Show original",
    "translate.translating": "Translating...",

    // categories
    "categories.ex_lover": "To an ex-lover",
    "categories.parent": "To a parent",
    "categories.child": "To my child",
    "categories.friend": "To a friend",
    "categories.younger_self": "To my younger self",
    "categories.future_self": "To my future self",
    "categories.deceased": "To someone who passed",
    "categories.someone_who_hurt": "To someone who hurt me",
    "categories.mentor": "To a mentor",
    "categories.stranger": "To a stranger",
    "categories.other": "To someone else",

    // emotions
    "emotions.regret": "Regret",
    "emotions.gratitude": "Gratitude",
    "emotions.anger": "Anger",
    "emotions.longing": "Longing",
    "emotions.forgiveness": "Forgiveness",
    "emotions.confession": "Confession",
    "emotions.grief": "Grief",
    "emotions.hope": "Hope",
    "emotions.apology": "Apology",
    "emotions.love": "Love",
  },

  ja: {
    // nav
    "nav.write": "write",
    "nav.letters": "letters",
    "nav.daily": "daily",

    // hero
    "hero.title": "届けられなかった手紙を\nここに届けてください。",
    "hero.subtitle":
      "届くことのない手紙を書いてください。\nその代わり、見知らぬ誰かが読んで返事をくれます。",
    "hero.cta": "手紙を書く",
    "hero.howItWorksTitle": "How it works",
    "hero.step1title": "手紙を書く",
    "hero.step1desc":
      "元恋人へ、親へ、昔の自分へ——言えなかったことを書いてください。この手紙が本人に届くことはありません。",
    "hero.step2title": "似た手紙が届きます",
    "hero.step2desc":
      "あなたと似た感情の手紙がマッチングされます。親への手紙は子どもからの手紙と出会います。自分だけじゃないと感じられるはずです。",
    "hero.step3title": "見知らぬ誰かが返事をくれます",
    "hero.step3desc":
      "「私はあなたのお母さんじゃないけど、母として言わせてね」——AIではなく、本物の人間が受取人の立場で返事を書いてくれます。",
    "hero.step4title": "あなたの言葉が誰かの救いになります",
    "hero.step4desc":
      "匿名化された手紙はアーカイブに残り、同じ悩みを抱える人たちの支えになります。",
    "hero.sampleTitle": "LETTERS FROM STRANGERS",
    "hero.tagline": "登録不要。匿名で。今すぐ。",
    "hero.bottomTitle": "あなたは誰に\n何を言えなかったですか？",
    "hero.bottomSubtitle":
      "書いてみてください。送ってみてください。その言葉を誰かに届けてください。",
    "hero.yourTurn": "YOUR TURN",

    // write
    "write.categoryTitle": "誰に書きますか？",
    "write.categorySubtitle": "この手紙は届けられません。",
    "write.recipientTitle": "手紙の宛先を書いてください",
    "write.recipientSubtitle": "名前の代わりに、あなただけが分かる呼び方で。",
    "write.recipientPlaceholder": "3年前に別れたあなたへ",
    "write.emotionTitle": "どんな気持ちですか？",
    "write.emotionSubtitle": "似た感情の手紙とつながります。",
    "write.bodyPlaceholder": "伝えられなかった言葉をここに書いてください...",
    "write.back": "戻る",
    "write.next": "次へ",
    "write.send": "手紙を送る",
    "write.sending": "手紙を送っています...",
    "write.charCount": "/2000",

    // done
    "done.stamp": "delivered to the void",
    "done.title": "手紙は旅立ちました",
    "done.subtitle":
      "あなたの言葉は海を漂い、いつか誰かのもとに届くでしょう。",
    "done.matchedTitle": "あなたに届いた手紙",
    "done.writeReply": "返事を書く",
    "done.writeAnother": "もう一通書く",
    "done.readOthers": "他の手紙を読む",

    // letters
    "letters.allLetters": "ALL LETTERS",
    "letters.all": "すべて",
    "letters.allEmotions": "すべての感情",
    "letters.noLetters": "まだ手紙がありません",
    "letters.noLettersDesc": "最初の手紙を書いてみませんか。",
    "letters.loadMore": "もっと見る",
    "letters.loading": "loading...",
    "letters.replyCount": "件の返信",
    "letters.share": "共有",
    "letters.ago_just": "たった今",
    "letters.ago_min": "{n}分前",
    "letters.ago_hour": "{n}時間前",
    "letters.ago_day": "{n}日前",

    // letter (detail)
    "letter.backToAll": "ALL LETTERS",
    "letter.notFound": "手紙が見つかりません",
    "letter.notFoundBack": "すべての手紙を見る",
    "letter.repliesTitle": "Replies from strangers",
    "letter.noReplies": "まだ返信がありません。最初の返信を書いてみてください。",
    "letter.replyPlaceholder": "見知らぬ者として、この手紙に返事を書いてください",
    "letter.replyLabel": "私は「{name}」ではないけれど...",
    "letter.replySend": "返信を送る",
    "letter.replySending": "送信中...",
    "letter.replySent": "返信が届けられました。",
    "letter.replyMinLength": "5文字以上入力してください。",

    // daily
    "daily.title": "今日の手紙",
    "daily.loading": "今日の手紙を探しています...",
    "daily.noLetterTitle": "まだ読める手紙がありません",
    "daily.noLetterDesc":
      "誰かが手紙を書けば、毎朝一通があなたに届きます。",
    "daily.noLetterCta": "まず手紙を書いてみてください",
    "daily.envelope1": "誰かが届けられなかった手紙が",
    "daily.envelope2": "あなたに届きました。",
    "daily.tapToRead": "タップして読む",
    "daily.tomorrowNote": "明日、新しい手紙が届きます",

    // footer
    "footer.copyright": "2026 deadletter · all letters anonymized",
    "footer.quote": "届かなくていい手紙もある。",

    // filter
    "filter.harmfulProfanity":
      "暴言や差別的な表現を含む手紙は送れません。",
    "filter.harmfulSexual":
      "性的な内容を含む手紙は送れません。",
    "filter.harmfulRecipient":
      "宛先に不適切な表現が含まれています。",
    "filter.crisisMessage":
      "あなたの気持ちを聞かせてくれてありがとうございます。今つらい状況にあるなら、専門の相談窓口に連絡してください。\n\nいのちの電話: 0570-783-556\nよりそいホットライン: 0120-279-338",

    // translate
    "translate.showTranslation": "翻訳を表示",
    "translate.showOriginal": "原文を表示",
    "translate.translating": "翻訳中...",

    // categories
    "categories.ex_lover": "元恋人へ",
    "categories.parent": "親へ",
    "categories.child": "子どもへ",
    "categories.friend": "友達へ",
    "categories.younger_self": "昔の自分へ",
    "categories.future_self": "未来の自分へ",
    "categories.deceased": "亡くなった人へ",
    "categories.someone_who_hurt": "自分を傷つけた人へ",
    "categories.mentor": "恩師へ",
    "categories.stranger": "見知らぬ誰かへ",
    "categories.other": "その他の誰かへ",

    // emotions
    "emotions.regret": "後悔",
    "emotions.gratitude": "感謝",
    "emotions.anger": "怒り",
    "emotions.longing": "恋しさ",
    "emotions.forgiveness": "赦し",
    "emotions.confession": "告白",
    "emotions.grief": "悲しみ",
    "emotions.hope": "希望",
    "emotions.apology": "謝罪",
    "emotions.love": "愛",
  },

  zh: {
    // nav
    "nav.write": "write",
    "nav.letters": "letters",
    "nav.daily": "daily",

    // hero
    "hero.title": "把寄不出的信\n寄到这里。",
    "hero.subtitle":
      "写一封永远不会被送达的信。\n然后，一个陌生人会读到它，并给你回信。",
    "hero.cta": "写一封信",
    "hero.howItWorksTitle": "How it works",
    "hero.step1title": "写下你的信",
    "hero.step1desc":
      "写给前任、父母、过去的自己——把说不出口的话写下来。这封信永远不会被送到对方手中。",
    "hero.step2title": "一封相似的信会到来",
    "hero.step2desc":
      "你会收到一封情感相似的信。写给父母的信会遇上写给孩子的信。你会发现，原来不只是你一个人。",
    "hero.step3title": "一个陌生人会回信",
    "hero.step3desc":
      "「我不是你的妈妈，但作为一个母亲，我想对你说……」——不是AI，而是真实的人以收信人的身份写下回信。",
    "hero.step4title": "你的话会成为某个人的慰藉",
    "hero.step4desc":
      "匿名化的信件留存在档案中，为有着相似困扰的人带去温暖。",
    "hero.sampleTitle": "LETTERS FROM STRANGERS",
    "hero.tagline": "无需注册。匿名。立刻开始。",
    "hero.bottomTitle": "你对谁\n还有没说出口的话？",
    "hero.bottomSubtitle":
      "写下来吧。寄出去吧。让你的话语抵达某个人。",
    "hero.yourTurn": "YOUR TURN",

    // write
    "write.categoryTitle": "你要写给谁？",
    "write.categorySubtitle": "这封信不会被送达。",
    "write.recipientTitle": "写下收信人",
    "write.recipientSubtitle": "用只有你自己知道的称呼。",
    "write.recipientPlaceholder": "三年前分手的你",
    "write.emotionTitle": "你现在是什么心情？",
    "write.emotionSubtitle": "会匹配到相似情感的信件。",
    "write.bodyPlaceholder": "把没能说出口的话写在这里...",
    "write.back": "返回",
    "write.next": "下一步",
    "write.send": "寄出信件",
    "write.sending": "正在寄出...",
    "write.charCount": "/2000",

    // done
    "done.stamp": "delivered to the void",
    "done.title": "信已寄出",
    "done.subtitle": "你的话语正漂浮在海面上，终将抵达某个人的身边。",
    "done.matchedTitle": "一封信到达了你这里",
    "done.writeReply": "写回信",
    "done.writeAnother": "再写一封",
    "done.readOthers": "看看其他信件",

    // letters
    "letters.allLetters": "ALL LETTERS",
    "letters.all": "全部",
    "letters.allEmotions": "所有情感",
    "letters.noLetters": "还没有信件",
    "letters.noLettersDesc": "来写第一封信吧。",
    "letters.loadMore": "加载更多",
    "letters.loading": "loading...",
    "letters.replyCount": "条回信",
    "letters.share": "分享",
    "letters.ago_just": "刚刚",
    "letters.ago_min": "{n}分钟前",
    "letters.ago_hour": "{n}小时前",
    "letters.ago_day": "{n}天前",

    // letter (detail)
    "letter.backToAll": "ALL LETTERS",
    "letter.notFound": "找不到这封信",
    "letter.notFoundBack": "查看所有信件",
    "letter.repliesTitle": "Replies from strangers",
    "letter.noReplies": "还没有回信。写下第一封回信吧。",
    "letter.replyPlaceholder": "作为一个陌生人，给这封信写一封回信",
    "letter.replyLabel": "我不是「{name}」，但是...",
    "letter.replySend": "发送回信",
    "letter.replySending": "发送中...",
    "letter.replySent": "你的回信已送达。",
    "letter.replyMinLength": "请至少输入5个字。",

    // daily
    "daily.title": "今日信件",
    "daily.loading": "正在寻找今天的信...",
    "daily.noLetterTitle": "还没有可以读的信",
    "daily.noLetterDesc": "当有人写信时，每天早上会有一封信送到你手中。",
    "daily.noLetterCta": "先写一封信吧",
    "daily.envelope1": "一封某人无法寄出的信",
    "daily.envelope2": "到达了你这里。",
    "daily.tapToRead": "点击阅读",
    "daily.tomorrowNote": "明天会有新的信件到来",

    // footer
    "footer.copyright": "2026 deadletter · all letters anonymized",
    "footer.quote": "有些信，注定不会被寄出。",

    // filter
    "filter.harmfulProfanity": "包含脏话或侮辱性语言的信件无法发送。",
    "filter.harmfulSexual": "包含色情内容的信件无法发送。",
    "filter.harmfulRecipient": "收信人中包含不当用语。",
    "filter.crisisMessage":
      "很高兴你愿意说出自己的故事。如果你现在很痛苦，请寻求专业帮助。\n\n心理援助热线：400-161-9995\n24小时危机干预热线：010-82951332",

    // translate
    "translate.showTranslation": "查看翻译",
    "translate.showOriginal": "查看原文",
    "translate.translating": "翻译中...",

    // categories
    "categories.ex_lover": "给前任",
    "categories.parent": "给父母",
    "categories.child": "给孩子",
    "categories.friend": "给朋友",
    "categories.younger_self": "给过去的自己",
    "categories.future_self": "给未来的自己",
    "categories.deceased": "给逝去的人",
    "categories.someone_who_hurt": "给伤害过我的人",
    "categories.mentor": "给恩师",
    "categories.stranger": "给某个陌生人",
    "categories.other": "给其他某个人",

    // emotions
    "emotions.regret": "后悔",
    "emotions.gratitude": "感恩",
    "emotions.anger": "愤怒",
    "emotions.longing": "思念",
    "emotions.forgiveness": "宽恕",
    "emotions.confession": "告白",
    "emotions.grief": "悲伤",
    "emotions.hope": "希望",
    "emotions.apology": "道歉",
    "emotions.love": "爱",
  },
};
