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
    "nav.letters": "voices",
    "nav.daily": "daily",

    // hero
    "hero.title": "차마 하지 못한 말,\n여기에 두고 가세요.",
    "hero.subtitle": "상사에게, 전 연인에게, 세상에게 —\n삼킨 말을 여기에 외치세요.",
    "hero.cta": "외치러 가기",
    "hero.howItWorksTitle": "How it works",
    "hero.step1title": "삼킨 말을 뱉으세요",
    "hero.step1desc":
      "상사에게 하고 싶었던 말, 전 연인에게 보내지 못한 메시지, 사회적 가면 뒤의 진짜 나 — 여기선 무슨 말이든 할 수 있어요.",
    "hero.step2title": "아무도 당신이 누군지 모릅니다",
    "hero.step2desc":
      "모든 글은 완전히 익명입니다. 개인정보는 자동으로 제거됩니다. 임금님 귀는 당나귀 귀, 그 대나무 숲이 여기예요.",
    "hero.step3title": "누군가 공감합니다",
    "hero.step3desc":
      "당신의 글을 읽은 낯선 사람이 위로와 공감을 남깁니다. AI가 아닌 진짜 사람이 당신의 마음에 응답합니다.",
    "hero.step4title": "내뱉는 순간, 가벼워집니다",
    "hero.step4desc":
      "말하지 못한 것을 글로 쓰는 것만으로도 마음이 가벼워집니다. 당신의 이야기는 비슷한 마음을 가진 누군가에게 위로가 됩니다.",
    "hero.sampleTitle": "VOICES FROM THE VOID",
    "hero.tagline": "가입 없이. 익명으로. 지금 바로.",
    "hero.bottomTitle": "당신은 지금\n무슨 말을 삼키고 있나요?",
    "hero.bottomSubtitle":
      "여기선 다 말해도 돼요. 아무도 당신이 누군지 모르니까.",
    "hero.yourTurn": "YOUR TURN",

    // write
    "write.categoryTitle": "누구에게 하고 싶은 말인가요?",
    "write.categorySubtitle": "이 말은 그 사람에게 전달되지 않습니다.",
    "write.recipientTitle": "누구에게 하는 말인지 적어주세요",
    "write.recipientSubtitle": "이름 대신 당신만 아는 호칭으로.",
    "write.recipientPlaceholder": "매일 야근시키는 팀장님에게",
    "write.emotionTitle": "지금 어떤 마음인가요?",
    "write.emotionSubtitle": "비슷한 감정의 글과 연결됩니다.",
    "write.bodyPlaceholder": "하지 못한 말을 여기에 외쳐보세요...",
    "write.back": "뒤로",
    "write.next": "다음",
    "write.send": "외치기",
    "write.sending": "당신의 목소리를 보내는 중...",
    "write.charCount": "/2000",

    // done
    "done.stamp": "shouted into the void",
    "done.title": "외쳤습니다",
    "done.subtitle":
      "당신의 말은 이제 어딘가를 떠다니며, 누군가의 마음에 닿을 거예요.",
    "done.matchedTitle": "비슷한 마음을 가진 누군가의 글",
    "done.writeReply": "공감 남기기",
    "done.writeAnother": "한번 더 외치기",
    "done.readOthers": "다른 외침 읽기",

    // letters
    "letters.allLetters": "ALL VOICES",
    "letters.all": "전체",
    "letters.allEmotions": "모든 감정",
    "letters.noLetters": "아직 외침이 없어요",
    "letters.noLettersDesc": "첫 번째 외침을 남겨보세요.",
    "letters.loadMore": "더 보기",
    "letters.loading": "loading...",
    "letters.replyCount": "개 공감",
    "letters.share": "공유",
    "letters.ago_just": "방금",
    "letters.ago_min": "{n}분 전",
    "letters.ago_hour": "{n}시간 전",
    "letters.ago_day": "{n}일 전",

    // letter (detail)
    "letter.backToAll": "ALL VOICES",
    "letter.notFound": "글을 찾을 수 없어요",
    "letter.notFoundBack": "모든 외침 보기",
    "letter.repliesTitle": "공감한 사람들",
    "letter.noReplies": "아직 공감이 없어요. 첫 번째 공감을 남겨보세요.",
    "letter.replyPlaceholder": "이 마음에 공감한다면, 한마디 남겨주세요",
    "letter.replyLabel": "나는 \"{name}\"이/가 아니지만...",
    "letter.replySend": "공감 보내기",
    "letter.replySending": "보내는 중...",
    "letter.replySent": "당신의 공감이 전해졌습니다.",
    "letter.replyMinLength": "5자 이상 입력해 주세요.",

    // daily
    "daily.title": "오늘의 외침",
    "daily.loading": "오늘의 외침을 찾는 중...",
    "daily.noLetterTitle": "아직 읽을 글이 없어요",
    "daily.noLetterDesc":
      "사람들이 외치기 시작하면, 매일 하나가 당신에게 도착합니다.",
    "daily.noLetterCta": "먼저 외쳐보세요",
    "daily.envelope1": "누군가가 차마 하지 못한 말이",
    "daily.envelope2": "당신에게 도착했습니다.",
    "daily.tapToRead": "탭하여 읽기",
    "daily.tomorrowNote": "내일 새로운 외침이 도착합니다",

    // footer
    "footer.copyright": "2026 deadletter · all voices anonymized",
    "footer.quote": "임금님 귀는 당나귀 귀.",

    // filter (harmful content messages)
    "filter.harmfulProfanity": "욕설이나 비속어가 포함된 글은 보낼 수 없어요.",
    "filter.harmfulSexual": "성적인 내용이 포함된 글은 보낼 수 없어요.",
    "filter.harmfulRecipient": "수신인에 부적절한 표현이 포함되어 있어요.",
    "filter.crisisMessage":
      "당신의 이야기를 들을 수 있어서 다행이에요. 지금 힘드시다면 전문 상담을 받아보세요.\n\n자살예방상담전화: 1393\n정신건강위기상담전화: 1577-0199",

    // translate
    "translate.showTranslation": "번역 보기",
    "translate.showOriginal": "원문만 보기",
    "translate.translating": "번역 중...",

    // categories
    "categories.ex_lover": "전 연인에게",
    "categories.boss": "상사에게",
    "categories.parent": "부모님에게",
    "categories.child": "자녀에게",
    "categories.friend": "친구에게",
    "categories.younger_self": "과거의 나에게",
    "categories.future_self": "미래의 나에게",
    "categories.deceased": "떠난 사람에게",
    "categories.someone_who_hurt": "나를 아프게 한 사람에게",
    "categories.society": "세상에게",
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

    // hero (additional)
    "hero.stamp": "never sent",
    "hero.mockupHeader": "deadletter · anonymous",
    "hero.mockupMsg1":
      "팀장님, 매일 야근시키면서 '가족 같은 회사'래요. 당신 가족은 밤 11시에 퇴근하나요?",
    "hero.mockupReply1":
      "당신의 팀장은 아니지만 — 그 답답함, 충분히 이해해요. 당신의 시간도 소중합니다.",
    "hero.mockupReply2": "당신의 마음에 공감한 누군가.",
    "hero.scroll": "scroll",
    "hero.strangerReplied": "누군가 공감했습니다",
    "hero.sample1to": "매일 야근시키는 팀장님에게",
    "hero.sample1body":
      "'가족 같은 회사'라면서요. 그런데 왜 저는 가족한테도 안 하는 야근을 여기서 매일 하고 있죠? 퇴사하고 싶다는 말, 월급날마다 삼킵니다.",
    "hero.sample1emotion": "분노",
    "hero.sample1reply":
      "당신의 상사는 아니지만 — 그 말을 삼키는 건 약해서가 아니라, 책임감이 있어서예요. 당신은 충분히 잘하고 있어요.",
    "hero.sample2to": "이별 통보한 너에게",
    "hero.sample2body":
      "'친구하자'라고 했을 때, 네가 정말 친구를 원한 건지 아니면 죄책감을 덜고 싶었던 건지. 3년이 지났는데 아직도 모르겠어.",
    "hero.sample2emotion": "그리움",
    "hero.sample2reply":
      "나는 네 전 연인이 아니지만 — '친구하자'는 대부분 '미안해'의 다른 표현이야. 그게 답이 되길 바라.",
    "hero.sample3to": "항상 '괜찮아'라고 하는 나에게",
    "hero.sample3body":
      "사람들 앞에서 웃으면서 '괜찮아'라고 하는 게 습관이 됐어. 근데 집에 돌아오면 아무것도 하고 싶지 않아. 이게 진짜 나인데, 이 모습은 아무도 모르지.",
    "hero.sample3emotion": "고백",
    "hero.sample3reply":
      "나도 그래. '괜찮아'라는 말이 자동으로 나오는 게 가장 괜찮지 않다는 증거더라. 너만 그런 거 아니야.",

    // write (additional)
    "write.errorSend": "글을 보내지 못했어요. 다시 시도해주세요.",
  },

  en: {
    // nav
    "nav.write": "write",
    "nav.letters": "voices",
    "nav.daily": "daily",

    // hero
    "hero.title": "Say what you\nnever could.",
    "hero.subtitle":
      "To your boss, your ex, the world —\nshout what you've been swallowing.",
    "hero.cta": "Let it out",
    "hero.howItWorksTitle": "How it works",
    "hero.step1title": "Spit out what you swallowed",
    "hero.step1desc":
      "What you wanted to tell your boss, the message you couldn't send your ex, the real you behind the social mask — here, you can say anything.",
    "hero.step2title": "Nobody knows who you are",
    "hero.step2desc":
      "Everything is completely anonymous. Personal info is automatically removed. Think of it as your own bamboo grove to shout into.",
    "hero.step3title": "Someone empathizes",
    "hero.step3desc":
      "A stranger who reads your words leaves comfort and empathy. Not AI — a real person who resonates with your heart.",
    "hero.step4title": "The moment you let it out, it gets lighter",
    "hero.step4desc":
      "Just writing down what you couldn't say can lighten your heart. Your story becomes comfort for someone feeling the same way.",
    "hero.sampleTitle": "VOICES FROM THE VOID",
    "hero.tagline": "No signup. Anonymous. Right now.",
    "hero.bottomTitle": "What words are you\nswallowing right now?",
    "hero.bottomSubtitle":
      "You can say it all here. Nobody knows who you are.",
    "hero.yourTurn": "YOUR TURN",

    // write
    "write.categoryTitle": "Who do you have words for?",
    "write.categorySubtitle": "These words will never reach them.",
    "write.recipientTitle": "Who are these words for?",
    "write.recipientSubtitle": "Use a name only you would know.",
    "write.recipientPlaceholder": "To the boss who makes me work overtime",
    "write.emotionTitle": "How are you feeling right now?",
    "write.emotionSubtitle": "You'll be connected with similar feelings.",
    "write.bodyPlaceholder": "Shout what you've been holding in...",
    "write.back": "Back",
    "write.next": "Next",
    "write.send": "Let it out",
    "write.sending": "Sending your voice...",
    "write.charCount": "/2000",

    // done
    "done.stamp": "shouted into the void",
    "done.title": "You've said it",
    "done.subtitle":
      "Your words are floating somewhere, on their way to someone's heart.",
    "done.matchedTitle": "From someone with a similar heart",
    "done.writeReply": "Leave empathy",
    "done.writeAnother": "Shout again",
    "done.readOthers": "Read others' voices",

    // letters
    "letters.allLetters": "ALL VOICES",
    "letters.all": "All",
    "letters.allEmotions": "All emotions",
    "letters.noLetters": "No voices yet",
    "letters.noLettersDesc": "Be the first to shout.",
    "letters.loadMore": "Load more",
    "letters.loading": "loading...",
    "letters.replyCount": " empathies",
    "letters.share": "Share",
    "letters.ago_just": "Just now",
    "letters.ago_min": "{n}m ago",
    "letters.ago_hour": "{n}h ago",
    "letters.ago_day": "{n}d ago",

    // letter (detail)
    "letter.backToAll": "ALL VOICES",
    "letter.notFound": "Voice not found",
    "letter.notFoundBack": "View all voices",
    "letter.repliesTitle": "Those who empathized",
    "letter.noReplies": "No empathy yet. Be the first to respond.",
    "letter.replyPlaceholder":
      "If this resonates with you, leave a word",
    "letter.replyLabel": "I'm not \"{name}\", but...",
    "letter.replySend": "Send empathy",
    "letter.replySending": "Sending...",
    "letter.replySent": "Your empathy has been delivered.",
    "letter.replyMinLength": "Please write at least 5 characters.",

    // daily
    "daily.title": "Today's voice",
    "daily.loading": "Finding today's voice...",
    "daily.noLetterTitle": "No voices to read yet",
    "daily.noLetterDesc":
      "When people start shouting, one will arrive for you every day.",
    "daily.noLetterCta": "Be the first to shout",
    "daily.envelope1": "Words someone couldn't say",
    "daily.envelope2": "have arrived for you.",
    "daily.tapToRead": "Tap to read",
    "daily.tomorrowNote": "A new voice arrives tomorrow",

    // footer
    "footer.copyright": "2026 deadletter · all voices anonymized",
    "footer.quote": "The king's ears are donkey ears.",

    // filter
    "filter.harmfulProfanity":
      "Voices containing profanity or slurs cannot be sent.",
    "filter.harmfulSexual":
      "Voices containing sexual content cannot be sent.",
    "filter.harmfulRecipient":
      "The recipient field contains inappropriate language.",
    "filter.crisisMessage":
      "We're glad you're sharing your story. If you're struggling right now, please reach out for support.\n\nSuicide Prevention Lifeline: 988\nCrisis Text Line: Text HOME to 741741",

    // translate
    "translate.showTranslation": "Show translation",
    "translate.showOriginal": "Show original",
    "translate.translating": "Translating...",

    // categories
    "categories.ex_lover": "To an ex",
    "categories.boss": "To the boss",
    "categories.parent": "To a parent",
    "categories.child": "To my child",
    "categories.friend": "To a friend",
    "categories.younger_self": "To my younger self",
    "categories.future_self": "To my future self",
    "categories.deceased": "To someone who passed",
    "categories.someone_who_hurt": "To someone who hurt me",
    "categories.society": "To the world",
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

    // hero (additional)
    "hero.stamp": "never sent",
    "hero.mockupHeader": "deadletter · anonymous",
    "hero.mockupMsg1":
      "Boss, you make us work overtime every day and call this a 'family company.' Does your family clock out at 11 PM?",
    "hero.mockupReply1":
      "I'm not your boss, but — your frustration is completely valid. Your time matters too.",
    "hero.mockupReply2": "from someone who feels you.",
    "hero.scroll": "scroll",
    "hero.strangerReplied": "someone empathized",
    "hero.sample1to": "To the boss who makes me work overtime",
    "hero.sample1body":
      "You call it a 'family company,' but why am I doing overtime that I wouldn't even do for my own family? Every payday, I swallow the words 'I want to quit.'",
    "hero.sample1emotion": "Anger",
    "hero.sample1reply":
      "I'm not your boss, but — swallowing those words doesn't make you weak. It means you're responsible. You're doing enough.",
    "hero.sample2to": "To you, who said 'let's be friends'",
    "hero.sample2body":
      "When you said 'let's stay friends,' did you really want friendship, or just wanted to ease your guilt? Three years later, I still don't know.",
    "hero.sample2emotion": "Longing",
    "hero.sample2reply":
      "I'm not your ex, but — 'let's be friends' is usually another way of saying 'I'm sorry.' I hope that's the answer you needed.",
    "hero.sample3to": "To myself, who always says 'I'm fine'",
    "hero.sample3body":
      "I've made a habit of smiling and saying 'I'm fine' in front of everyone. But when I get home, I don't want to do anything. This is the real me, and nobody knows.",
    "hero.sample3emotion": "Confession",
    "hero.sample3reply":
      "Me too. The fact that 'I'm fine' comes out automatically is proof that you're anything but fine. You're not alone in this.",

    // write (additional)
    "write.errorSend": "Failed to send. Please try again.",
  },

  ja: {
    // nav
    "nav.write": "write",
    "nav.letters": "voices",
    "nav.daily": "daily",

    // hero
    "hero.title": "言えなかった言葉を\nここに置いていってください。",
    "hero.subtitle":
      "上司に、元恋人に、世界に——\n飲み込んだ言葉をここで叫んでください。",
    "hero.cta": "叫びに行く",
    "hero.howItWorksTitle": "How it works",
    "hero.step1title": "飲み込んだ言葉を吐き出して",
    "hero.step1desc":
      "上司に言いたかったこと、元恋人に送れなかったメッセージ、社会的な仮面の裏の本当の自分——ここでは何でも言えます。",
    "hero.step2title": "誰もあなたが誰か知りません",
    "hero.step2desc":
      "すべて完全に匿名です。個人情報は自動的に削除されます。「王様の耳はロバの耳」と叫べる竹藪がここにあります。",
    "hero.step3title": "誰かが共感します",
    "hero.step3desc":
      "あなたの言葉を読んだ見知らぬ人が慰めと共感を残します。AIではなく、あなたの心に響いた本物の人間が応えます。",
    "hero.step4title": "吐き出した瞬間、軽くなります",
    "hero.step4desc":
      "言えなかったことを書くだけで心が軽くなります。あなたの物語は同じ気持ちを抱えた誰かの慰めになります。",
    "hero.sampleTitle": "VOICES FROM THE VOID",
    "hero.tagline": "登録不要。匿名で。今すぐ。",
    "hero.bottomTitle": "あなたは今\nどんな言葉を飲み込んでいますか？",
    "hero.bottomSubtitle":
      "ここでは何を言っても大丈夫。誰もあなたが誰か知らないから。",
    "hero.yourTurn": "YOUR TURN",

    // write
    "write.categoryTitle": "誰に言いたいことがありますか？",
    "write.categorySubtitle": "この言葉は相手に届きません。",
    "write.recipientTitle": "誰への言葉か書いてください",
    "write.recipientSubtitle": "名前の代わりに、あなただけが分かる呼び方で。",
    "write.recipientPlaceholder": "毎日残業させる課長へ",
    "write.emotionTitle": "今どんな気持ちですか？",
    "write.emotionSubtitle": "似た感情の投稿とつながります。",
    "write.bodyPlaceholder": "言えなかった言葉をここで叫んでみてください...",
    "write.back": "戻る",
    "write.next": "次へ",
    "write.send": "叫ぶ",
    "write.sending": "あなたの声を送っています...",
    "write.charCount": "/2000",

    // done
    "done.stamp": "shouted into the void",
    "done.title": "叫びました",
    "done.subtitle":
      "あなたの言葉はどこかを漂い、いつか誰かの心に届くでしょう。",
    "done.matchedTitle": "似た気持ちの誰かの投稿",
    "done.writeReply": "共感を残す",
    "done.writeAnother": "もう一度叫ぶ",
    "done.readOthers": "他の叫びを読む",

    // letters
    "letters.allLetters": "ALL VOICES",
    "letters.all": "すべて",
    "letters.allEmotions": "すべての感情",
    "letters.noLetters": "まだ叫びがありません",
    "letters.noLettersDesc": "最初の叫びを残してみませんか。",
    "letters.loadMore": "もっと見る",
    "letters.loading": "loading...",
    "letters.replyCount": "件の共感",
    "letters.share": "共有",
    "letters.ago_just": "たった今",
    "letters.ago_min": "{n}分前",
    "letters.ago_hour": "{n}時間前",
    "letters.ago_day": "{n}日前",

    // letter (detail)
    "letter.backToAll": "ALL VOICES",
    "letter.notFound": "投稿が見つかりません",
    "letter.notFoundBack": "すべての叫びを見る",
    "letter.repliesTitle": "共感した人たち",
    "letter.noReplies": "まだ共感がありません。最初の共感を残してみてください。",
    "letter.replyPlaceholder": "この気持ちに共感するなら、一言残してください",
    "letter.replyLabel": "私は「{name}」ではないけれど...",
    "letter.replySend": "共感を送る",
    "letter.replySending": "送信中...",
    "letter.replySent": "あなたの共感が届きました。",
    "letter.replyMinLength": "5文字以上入力してください。",

    // daily
    "daily.title": "今日の叫び",
    "daily.loading": "今日の叫びを探しています...",
    "daily.noLetterTitle": "まだ読める投稿がありません",
    "daily.noLetterDesc":
      "誰かが叫び始めれば、毎日一つがあなたに届きます。",
    "daily.noLetterCta": "まず叫んでみてください",
    "daily.envelope1": "誰かが言えなかった言葉が",
    "daily.envelope2": "あなたに届きました。",
    "daily.tapToRead": "タップして読む",
    "daily.tomorrowNote": "明日、新しい叫びが届きます",

    // footer
    "footer.copyright": "2026 deadletter · all voices anonymized",
    "footer.quote": "王様の耳はロバの耳。",

    // filter
    "filter.harmfulProfanity":
      "暴言や差別的な表現を含む投稿は送れません。",
    "filter.harmfulSexual":
      "性的な内容を含む投稿は送れません。",
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
    "categories.boss": "上司へ",
    "categories.parent": "親へ",
    "categories.child": "子どもへ",
    "categories.friend": "友達へ",
    "categories.younger_self": "昔の自分へ",
    "categories.future_self": "未来の自分へ",
    "categories.deceased": "亡くなった人へ",
    "categories.someone_who_hurt": "自分を傷つけた人へ",
    "categories.society": "世界へ",
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

    // hero (additional)
    "hero.stamp": "never sent",
    "hero.mockupHeader": "deadletter · anonymous",
    "hero.mockupMsg1":
      "課長、毎日残業させておいて「家族のような会社」ですか。あなたの家族は夜11時に退社するんですか？",
    "hero.mockupReply1":
      "あなたの上司ではないけれど——その悔しさ、十分わかります。あなたの時間も大切です。",
    "hero.mockupReply2": "あなたの気持ちに共感した誰かより。",
    "hero.scroll": "scroll",
    "hero.strangerReplied": "誰かが共感しました",
    "hero.sample1to": "毎日残業させる課長へ",
    "hero.sample1body":
      "「家族のような会社」と言いますが、なぜ私は家族にもしない残業を毎日ここでしているのですか？辞めたいという言葉を、給料日のたびに飲み込んでいます。",
    "hero.sample1emotion": "怒り",
    "hero.sample1reply":
      "あなたの上司ではないけれど——その言葉を飲み込むのは弱いからではなく、責任感があるから。あなたは十分頑張っています。",
    "hero.sample2to": "別れを告げた君へ",
    "hero.sample2body":
      "「友達でいよう」と言ったとき、本当に友達が欲しかったの？それとも罪悪感を軽くしたかっただけ？3年経ったけど、まだわからない。",
    "hero.sample2emotion": "恋しさ",
    "hero.sample2reply":
      "私は君の元恋人ではないけれど——「友達でいよう」はたいてい「ごめんね」の別の言い方。それが答えになるといいね。",
    "hero.sample3to": "いつも「大丈夫」と言う自分へ",
    "hero.sample3body":
      "みんなの前で笑いながら「大丈夫」と言うのが癖になった。でも家に帰ると何もしたくない。これが本当の自分なのに、この姿は誰も知らない。",
    "hero.sample3emotion": "告白",
    "hero.sample3reply":
      "私もそう。「大丈夫」が自動的に出てくるのが、一番大丈夫じゃない証拠だった。君だけじゃないよ。",

    // write (additional)
    "write.errorSend": "送信できませんでした。もう一度お試しください。",
  },

  zh: {
    // nav
    "nav.write": "write",
    "nav.letters": "voices",
    "nav.daily": "daily",

    // hero
    "hero.title": "把咽下去的话\n留在这里。",
    "hero.subtitle":
      "对上司、前任、这个世界——\n把说不出口的话在这里喊出来。",
    "hero.cta": "去喊出来",
    "hero.howItWorksTitle": "How it works",
    "hero.step1title": "把咽下去的话吐出来",
    "hero.step1desc":
      "想对上司说的话、没能发给前任的消息、社交面具背后真实的自己——在这里，你什么都可以说。",
    "hero.step2title": "没有人知道你是谁",
    "hero.step2desc":
      "一切都是完全匿名的。个人信息会被自动删除。就像对着竹林喊「皇帝的耳朵是驴耳朵」一样。",
    "hero.step3title": "有人会共鸣",
    "hero.step3desc":
      "读到你文字的陌生人会留下安慰和共鸣。不是AI，而是真正被你触动的人。",
    "hero.step4title": "喊出来的那一刻，就轻松了",
    "hero.step4desc":
      "光是把说不出口的话写下来，心就会轻松很多。你的故事会成为有同样感受的人的慰藉。",
    "hero.sampleTitle": "VOICES FROM THE VOID",
    "hero.tagline": "无需注册。匿名。立刻开始。",
    "hero.bottomTitle": "你现在\n在咽下什么话？",
    "hero.bottomSubtitle":
      "在这里什么都可以说。没有人知道你是谁。",
    "hero.yourTurn": "YOUR TURN",

    // write
    "write.categoryTitle": "你想对谁说？",
    "write.categorySubtitle": "这些话不会传达给对方。",
    "write.recipientTitle": "写下你想对谁说",
    "write.recipientSubtitle": "用只有你自己知道的称呼。",
    "write.recipientPlaceholder": "每天让我加班的领导",
    "write.emotionTitle": "你现在是什么心情？",
    "write.emotionSubtitle": "会匹配到相似情感的投稿。",
    "write.bodyPlaceholder": "把说不出口的话在这里喊出来...",
    "write.back": "返回",
    "write.next": "下一步",
    "write.send": "喊出来",
    "write.sending": "正在发送你的声音...",
    "write.charCount": "/2000",

    // done
    "done.stamp": "shouted into the void",
    "done.title": "喊出来了",
    "done.subtitle": "你的话语正在某处漂浮，终将触动某个人的心。",
    "done.matchedTitle": "来自有同样心情的某个人",
    "done.writeReply": "留下共鸣",
    "done.writeAnother": "再喊一次",
    "done.readOthers": "看看别人的呐喊",

    // letters
    "letters.allLetters": "ALL VOICES",
    "letters.all": "全部",
    "letters.allEmotions": "所有情感",
    "letters.noLetters": "还没有声音",
    "letters.noLettersDesc": "来留下第一声呐喊吧。",
    "letters.loadMore": "加载更多",
    "letters.loading": "loading...",
    "letters.replyCount": "条共鸣",
    "letters.share": "分享",
    "letters.ago_just": "刚刚",
    "letters.ago_min": "{n}分钟前",
    "letters.ago_hour": "{n}小时前",
    "letters.ago_day": "{n}天前",

    // letter (detail)
    "letter.backToAll": "ALL VOICES",
    "letter.notFound": "找不到这条投稿",
    "letter.notFoundBack": "查看所有声音",
    "letter.repliesTitle": "产生共鸣的人们",
    "letter.noReplies": "还没有共鸣。留下第一条共鸣吧。",
    "letter.replyPlaceholder": "如果你感同身受，留一句话吧",
    "letter.replyLabel": "我不是「{name}」，但是...",
    "letter.replySend": "发送共鸣",
    "letter.replySending": "发送中...",
    "letter.replySent": "你的共鸣已送达。",
    "letter.replyMinLength": "请至少输入5个字。",

    // daily
    "daily.title": "今日之声",
    "daily.loading": "正在寻找今天的声音...",
    "daily.noLetterTitle": "还没有可以读的投稿",
    "daily.noLetterDesc": "当有人开始呐喊时，每天会有一条送到你手中。",
    "daily.noLetterCta": "先喊出来吧",
    "daily.envelope1": "某人说不出口的话",
    "daily.envelope2": "到达了你这里。",
    "daily.tapToRead": "点击阅读",
    "daily.tomorrowNote": "明天会有新的声音到来",

    // footer
    "footer.copyright": "2026 deadletter · all voices anonymized",
    "footer.quote": "皇帝的耳朵是驴耳朵。",

    // filter
    "filter.harmfulProfanity": "包含脏话或侮辱性语言的投稿无法发送。",
    "filter.harmfulSexual": "包含色情内容的投稿无法发送。",
    "filter.harmfulRecipient": "收信人中包含不当用语。",
    "filter.crisisMessage":
      "很高兴你愿意说出自己的故事。如果你现在很痛苦，请寻求专业帮助。\n\n心理援助热线：400-161-9995\n24小时危机干预热线：010-82951332",

    // translate
    "translate.showTranslation": "查看翻译",
    "translate.showOriginal": "查看原文",
    "translate.translating": "翻译中...",

    // categories
    "categories.ex_lover": "给前任",
    "categories.boss": "给上司",
    "categories.parent": "给父母",
    "categories.child": "给孩子",
    "categories.friend": "给朋友",
    "categories.younger_self": "给过去的自己",
    "categories.future_self": "给未来的自己",
    "categories.deceased": "给逝去的人",
    "categories.someone_who_hurt": "给伤害过我的人",
    "categories.society": "给这个世界",
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

    // hero (additional)
    "hero.stamp": "never sent",
    "hero.mockupHeader": "deadletter · anonymous",
    "hero.mockupMsg1":
      "领导，每天让我们加班还说这是「像家一样的公司」。您家人也是晚上11点才下班吗？",
    "hero.mockupReply1":
      "我不是你的领导，但——你的委屈完全可以理解。你的时间也很重要。",
    "hero.mockupReply2": "来自一个感同身受的陌生人。",
    "hero.scroll": "scroll",
    "hero.strangerReplied": "有人产生了共鸣",
    "hero.sample1to": "每天让我加班的领导",
    "hero.sample1body":
      "说是「像家一样的公司」，可我为什么在做连家人都不会让我做的加班？每到发薪日，我就把「我想辞职」这句话咽下去。",
    "hero.sample1emotion": "愤怒",
    "hero.sample1reply":
      "我不是你的上司，但——咽下那句话不是因为你软弱，而是因为你有责任感。你已经做得够好了。",
    "hero.sample2to": "说了「我们做朋友吧」的你",
    "hero.sample2body":
      "当你说「我们做朋友吧」的时候，你是真的想做朋友，还是只是想减轻自己的愧疚？三年过去了，我还是不知道。",
    "hero.sample2emotion": "思念",
    "hero.sample2reply":
      "我不是你的前任，但——「做朋友吧」大多是「对不起」的另一种说法。希望这能成为你的答案。",
    "hero.sample3to": "总是说「我没事」的自己",
    "hero.sample3body":
      "在别人面前笑着说「我没事」已经成了习惯。但回到家什么都不想做。这才是真正的我，但这个样子谁也不知道。",
    "hero.sample3emotion": "告白",
    "hero.sample3reply":
      "我也是。「我没事」能自动说出口，恰恰证明你最不没事。你不是一个人。",

    // write (additional)
    "write.errorSend": "发送失败，请重试。",
  },
};
