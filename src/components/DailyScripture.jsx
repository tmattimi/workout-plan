import { useState, useEffect } from "react";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

// ── Liturgical Calendar ───────────────────────────────────────────────────────
function getLiturgicalSeason(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  function getEaster(y) {
    const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,
      f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,
      i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),
      eM=Math.floor((h+l-7*m+114)/31),eD=((h+l-7*m+114)%31)+1;
    return new Date(y,eM-1,eD);
  }

  const D = 864e5;
  const now = new Date(year,month-1,day).getTime();
  const e = getEaster(year).getTime();

  const ash = e - 46*D, palm = e - 7*D, thu = e - 3*D,
    fri = e - 2*D, pent = e + 49*D;
  const xmas = new Date(year,11,25);
  const xDay = xmas.getDay();
  const advent = new Date(year,11,25-(xDay===0?28:xDay+21)).getTime();

  if (now>=advent||(month===1&&day<=6)) return "advent";
  if (month===12&&day===25) return "christmas_day";
  if (month===12&&day>25) return "christmas";
  if (month===1&&day<=6) return "epiphany";
  if (Math.abs(now-ash)<D) return "ash_wednesday";
  if (now>=ash&&now<palm) return "lent";
  if (Math.abs(now-palm)<D) return "palm_sunday";
  if (now>palm&&now<thu) return "holy_week";
  if (Math.abs(now-thu)<D) return "holy_thursday";
  if (Math.abs(now-fri)<D) return "good_friday";
  if (Math.abs(now-e)<D) return "easter_day";
  if (now>e&&now<pent) return "easter_season";
  if (Math.abs(now-pent)<D) return "pentecost";
  return "ordinary";
}

// ── Special date overrides ────────────────────────────────────────────────────
const SPECIAL = {
  "12-25": { v:"For a child is born to us, a son is given to us. And he will be called: Wonderful Counselor, Mighty God, Everlasting Father, Prince of Peace.", r:"Isaiah 9:6", season:"Christmas Day" },
  "01-01": { v:"This means that anyone who belongs to Christ has become a new person. The old life is gone; a new life has begun!", r:"2 Corinthians 5:17", season:"New Year" },
  "01-06": { v:"After Jesus was born in Bethlehem in Judea, during the time of King Herod, Magi from the east came to Jerusalem.", r:"Matthew 2:1", season:"Epiphany" },
};

const SEASONS = {
  ash_wednesday: { v:"Turn to me now, while there is time. Give me your hearts. Come with fasting, weeping, and mourning.", r:"Joel 2:12", season:"Ash Wednesday" },
  lent:          { v:"Create in me a clean heart, O God. Renew a loyal spirit within me.", r:"Psalm 51:10", season:"Lent" },
  palm_sunday:   { v:"Blessed is he who comes in the name of the Lord! Hosanna in the highest heaven!", r:"Matthew 21:9", season:"Palm Sunday" },
  holy_week:     { v:"For even the Son of Man did not come to be served but to serve others and to give his life as a ransom for many.", r:"Mark 10:45", season:"Holy Week" },
  holy_thursday: { v:"He got up from the table, wrapped a towel around his waist, and began to wash the disciples' feet.", r:"John 13:4–5", season:"Holy Thursday" },
  good_friday:   { v:"So they took Jesus, and he went out, bearing his own cross, to the place called The Place of a Skull.", r:"John 19:17", season:"Good Friday" },
  easter_day:    { v:"He is not here! He is risen from the dead, just as he said would happen.", r:"Matthew 28:6", season:"Easter Sunday" },
  easter_season: { v:"I want to know Christ and experience the mighty power that raised him from the dead.", r:"Philippians 3:10", season:"Easter Season" },
  pentecost:     { v:"And everyone present was filled with the Holy Spirit.", r:"Acts 2:4", season:"Pentecost" },
  advent:        { v:"For I know the plans I have for you, says the Lord — plans for good, to give you a future and a hope.", r:"Jeremiah 29:11", season:"Advent" },
  christmas:     { v:"The Word became human and made his home among us. He was full of unfailing love and faithfulness.", r:"John 1:14", season:"Christmas Season" },
  epiphany:      { v:"Arise, Jerusalem! Let your light shine for all to see. For the glory of the Lord rises to shine on you.", r:"Isaiah 60:1", season:"Epiphany" },
};

// ── 365 scriptures by month/day ───────────────────────────────────────────────
// Themes: Jan=New Beginnings, Feb=Identity, Mar=Renewal, Apr=Hope,
//         May=Strength, Jun=Endurance, Jul=Freedom, Aug=Body as Temple,
//         Sep=Discipline, Oct=Gratitude, Nov=Rest, Dec=Light & Reflection

const BY_MONTH = {
  1: [
    { v:"This means that anyone who belongs to Christ has become a new person. The old life is gone; a new life has begun!", r:"2 Corinthians 5:17" },
    { v:"For I am about to do something new. See, I have already begun! Do you not see it?", r:"Isaiah 43:19" },
    { v:"The faithful love of the Lord never ends! His mercies never cease. Great is his faithfulness; his mercies begin afresh each morning.", r:"Lamentations 3:22–23" },
    { v:"For I know the plans I have for you, says the Lord. They are plans for good and not for disaster, to give you a future and a hope.", r:"Jeremiah 29:11" },
    { v:"I focus on this one thing: forgetting the past and looking forward to what lies ahead.", r:"Philippians 3:13" },
    { v:"And I am certain that God, who began a good work within you, will continue his work until it is finally finished.", r:"Philippians 1:6" },
    { v:"Seek the Kingdom of God above all else, and live righteously, and he will give you everything you need.", r:"Matthew 6:33" },
    { v:"Trust in the Lord with all your heart; do not depend on your own understanding. Seek his will in all you do, and he will show you which path to take.", r:"Proverbs 3:5–6" },
    { v:"Commit your actions to the Lord, and your plans will succeed.", r:"Proverbs 16:3" },
    { v:"Be strong and courageous! Do not be afraid and do not panic. For the Lord your God will personally go ahead of you.", r:"Deuteronomy 31:6" },
    { v:"You didn't choose me. I chose you. I appointed you to go and produce lasting fruit.", r:"John 15:16" },
    { v:"The Lord directs the steps of the godly. He delights in every detail of their lives.", r:"Psalm 37:23" },
    { v:"Look straight ahead, and fix your eyes on what lies before you.", r:"Proverbs 4:25" },
    { v:"Take delight in the Lord, and he will give you your heart's desires.", r:"Psalm 37:4" },
    { v:"But those who trust in the Lord will find new strength. They will soar high on wings like eagles.", r:"Isaiah 40:31" },
    { v:"I can do everything through Christ, who gives me strength.", r:"Philippians 4:13" },
    { v:"Give all your worries and cares to God, for he cares about you.", r:"1 Peter 5:7" },
    { v:"This is the day the Lord has made. We will rejoice and be glad in it.", r:"Psalm 118:24" },
    { v:"Don't be afraid, for I am with you. Don't be discouraged, for I am your God. I will strengthen you and help you.", r:"Isaiah 41:10" },
    { v:"Now all glory to God, who is able to accomplish infinitely more than we might ask or think.", r:"Ephesians 3:20" },
    { v:"The Lord your God is living among you. He is a mighty savior. He will take great delight in you.", r:"Zephaniah 3:17" },
    { v:"The Lord is my shepherd; I have all that I need.", r:"Psalm 23:1" },
    { v:"Taste and see that the Lord is good. Oh, the joys of those who take refuge in him!", r:"Psalm 34:8" },
    { v:"And we know that God causes everything to work together for the good of those who love God.", r:"Romans 8:28" },
    { v:"With man this is impossible, but with God all things are possible.", r:"Matthew 19:26" },
    { v:"So humble yourselves under the mighty power of God, and at the right time he will lift you up in honor.", r:"1 Peter 5:6" },
    { v:"The Lord will work out his plans for my life — for your faithful love, O Lord, endures forever.", r:"Psalm 138:8" },
    { v:"The Lord is my strength and my song; he has given me victory.", r:"Exodus 15:2" },
    { v:"Wait patiently for the Lord. Be brave and courageous. Yes, wait patiently for the Lord.", r:"Psalm 27:14" },
    { v:"He gives power to the weak and strength to the powerless.", r:"Isaiah 40:29" },
    { v:"Be strong, and let your heart take courage, all you who wait for the Lord!", r:"Psalm 31:24" },
  ],
  2: [
    { v:"Thank you for making me so wonderfully complex! Your workmanship is marvelous — how well I know it.", r:"Psalm 139:14" },
    { v:"See how very much our Father loves us, for he calls us his children, and that is what we are!", r:"1 John 3:1" },
    { v:"For we are God's masterpiece. He has created us anew in Christ Jesus, so we can do the good things he planned for us long ago.", r:"Ephesians 2:10" },
    { v:"You are altogether beautiful, my darling, beautiful in every way.", r:"Song of Solomon 4:7" },
    { v:"For you are a holy people, who belong to the Lord your God. The Lord your God has chosen you to be his own special treasure.", r:"Deuteronomy 7:6" },
    { v:"But you are a chosen people. You are royal priests, a holy nation, God's very own possession.", r:"1 Peter 2:9" },
    { v:"You have not received a spirit that makes you fearful slaves. Instead, you received God's Spirit when he adopted you as his own children.", r:"Romans 8:15" },
    { v:"God created human beings in his own image. In the image of God he created them; male and female he created them.", r:"Genesis 1:27" },
    { v:"My old self has been crucified with Christ. It is no longer I who live, but Christ lives in me.", r:"Galatians 2:20" },
    { v:"And because you belong to him, the power of the life-giving Spirit has freed you from the power of sin that leads to death.", r:"Romans 8:2" },
    { v:"Don't copy the behavior and customs of this world, but let God transform you into a new person by changing the way you think.", r:"Romans 12:2" },
    { v:"For God has not given us a spirit of fear and timidity, but of power, love, and self-discipline.", r:"2 Timothy 1:7" },
    { v:"You made all the delicate, inner parts of my body and knit me together in my mother's womb.", r:"Psalm 139:13" },
    { v:"How precious are your thoughts about me, O God. They cannot be numbered!", r:"Psalm 139:17" },
    { v:"People judge by outward appearance, but the Lord looks at the heart.", r:"1 Samuel 16:7" },
    { v:"Charm is deceptive, and beauty does not last; but a woman who fears the Lord will be greatly praised.", r:"Proverbs 31:30" },
    { v:"She is clothed with strength and dignity, and she laughs without fear of the future.", r:"Proverbs 31:25" },
    { v:"For we live by believing and not by seeing.", r:"2 Corinthians 5:7" },
    { v:"I knew you before I formed you in your mother's womb. Before you were born I set you apart.", r:"Jeremiah 1:5" },
    { v:"The Spirit of God, who raised Jesus from the dead, lives in you.", r:"Romans 8:11" },
    { v:"And I am convinced that nothing can ever separate us from God's love.", r:"Romans 8:38" },
    { v:"Even before he made the world, God loved us and chose us in Christ to be holy and without fault in his eyes.", r:"Ephesians 1:4" },
    { v:"So now there is no condemnation for those who belong to Christ Jesus.", r:"Romans 8:1" },
    { v:"Your real life is hidden with Christ in God.", r:"Colossians 3:3" },
    { v:"We are citizens of heaven, where the Lord Jesus Christ lives.", r:"Philippians 3:20" },
    { v:"God saved us and called us to live a holy life — not because we deserved it, but because that was his plan.", r:"2 Timothy 1:9" },
    { v:"Search me, O God, and know my heart; test me and know my anxious thoughts.", r:"Psalm 139:23" },
    { v:"Point out anything in me that offends you, and lead me along the path of everlasting life.", r:"Psalm 139:24" },
  ],
  3: [
    { v:"Create in me a clean heart, O God. Renew a loyal spirit within me.", r:"Psalm 51:10" },
    { v:"Though our bodies are dying, our spirits are being renewed every day.", r:"2 Corinthians 4:16" },
    { v:"The Holy Spirit produces this kind of fruit in our lives: love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, and self-control.", r:"Galatians 5:22–23" },
    { v:"For you know that when your faith is tested, your endurance has a chance to grow.", r:"James 1:3" },
    { v:"So let it grow, for when your endurance is fully developed, you will be perfect and complete, needing nothing.", r:"James 1:4" },
    { v:"No discipline is enjoyable while it is happening — it's painful! But afterward there will be a peaceful harvest of right living.", r:"Hebrews 12:11" },
    { v:"Plant the good seeds of righteousness, and you will harvest a crop of love.", r:"Hosea 10:12" },
    { v:"Work hard to show the results of your salvation, obeying God with deep reverence and fear.", r:"Philippians 2:12" },
    { v:"For God is working in you, giving you the desire and the power to do what pleases him.", r:"Philippians 2:13" },
    { v:"When troubles come your way, consider it an opportunity for great joy.", r:"James 1:2" },
    { v:"If you need wisdom, ask our generous God, and he will give it to you. He will not rebuke you for asking.", r:"James 1:5" },
    { v:"I have hidden your word in my heart, that I might not sin against you.", r:"Psalm 119:11" },
    { v:"Your word is a lamp to guide my feet and a light for my path.", r:"Psalm 119:105" },
    { v:"Since we are living by the Spirit, let us follow the Spirit's leading in every part of our lives.", r:"Galatians 5:25" },
    { v:"Let us not neglect our meeting together, as some people do, but encourage one another.", r:"Hebrews 10:25" },
    { v:"Keep putting into practice all you learned and received. Then the God of peace will be with you.", r:"Philippians 4:9" },
    { v:"Let your roots grow down into him, and let your lives be built on him. Then your faith will grow strong.", r:"Colossians 2:7" },
    { v:"This same God who takes care of me will supply all your needs from his glorious riches.", r:"Philippians 4:19" },
    { v:"Think clearly and exercise self-control. Look forward to the gracious salvation that will come to you.", r:"1 Peter 1:13" },
    { v:"Warn each other every day, while it is still today, so that none of you will be deceived by sin and hardened against God.", r:"Hebrews 3:13" },
    { v:"We are being transformed into his image with ever-increasing glory.", r:"2 Corinthians 3:18" },
    { v:"Those who live to please the Spirit will harvest everlasting life.", r:"Galatians 6:8" },
    { v:"So let's not get tired of doing what is good. At just the right time we will reap a harvest of blessing if we don't give up.", r:"Galatians 6:9" },
    { v:"Just as you accepted Christ Jesus as your Lord, you must continue to follow him.", r:"Colossians 2:6" },
    { v:"Work willingly at whatever you do, as though you were working for the Lord rather than for people.", r:"Colossians 3:23" },
    { v:"God blesses those who patiently endure testing and temptation.", r:"James 1:12" },
    { v:"Don't just listen to God's word. You must do what it says.", r:"James 1:22" },
    { v:"Don't reject the Lord's discipline, and don't be upset when he corrects you. For the Lord corrects those he loves.", r:"Proverbs 3:11–12" },
    { v:"Joyful are those who obey his laws and search for him with all their hearts.", r:"Psalm 119:2" },
    { v:"Be strong and immovable. Always work enthusiastically for the Lord, for nothing you do for the Lord is ever useless.", r:"1 Corinthians 15:58" },
    { v:"After you have suffered a little while, he will restore, support, and strengthen you, and place you on a firm foundation.", r:"1 Peter 5:10" },
  ],
  4: [
    { v:"He is not here! He is risen from the dead, just as he said would happen.", r:"Matthew 28:6" },
    { v:"We are pressed on every side by troubles, but we are not crushed. We are perplexed, but not driven to despair.", r:"2 Corinthians 4:8" },
    { v:"We get knocked down, but we are not destroyed.", r:"2 Corinthians 4:9" },
    { v:"I want to know Christ and experience the mighty power that raised him from the dead.", r:"Philippians 3:10" },
    { v:"Our bodies are buried in weakness, but they will be raised in strength.", r:"1 Corinthians 15:43" },
    { v:"Thanks be to God! He gives us the victory through our Lord Jesus Christ.", r:"1 Corinthians 15:57" },
    { v:"So be strong and immovable. Always work enthusiastically for the Lord.", r:"1 Corinthians 15:58" },
    { v:"Because of our faith, Christ has brought us into this place of undeserved privilege where we now stand.", r:"Romans 5:2" },
    { v:"We can rejoice when we run into problems and trials, for we know that they help us develop endurance.", r:"Romans 5:3" },
    { v:"And endurance develops strength of character, and character strengthens our confident hope of salvation.", r:"Romans 5:4" },
    { v:"And this hope will not lead to disappointment. For we know how dearly God loves us.", r:"Romans 5:5" },
    { v:"I pray that God, the source of hope, will fill you completely with joy and peace because you trust in him.", r:"Romans 15:13" },
    { v:"Let all that I am wait quietly before God, for my hope is in him.", r:"Psalm 62:5" },
    { v:"He alone is my rock and my salvation, my fortress where I will not be shaken.", r:"Psalm 62:6" },
    { v:"Why am I discouraged? Why is my heart so sad? I will put my hope in God!", r:"Psalm 42:11" },
    { v:"O Lord, you alone are my hope. I've trusted you, O Lord, from childhood.", r:"Psalm 71:5" },
    { v:"I will keep on hoping for your help; I will praise you more and more.", r:"Psalm 71:14" },
    { v:"The Lord is good to those who depend on him, to those who search for him.", r:"Lamentations 3:25" },
    { v:"So it is good to wait quietly for salvation from the Lord.", r:"Lamentations 3:26" },
    { v:"Our present troubles are small and won't last very long. Yet they produce for us a glory that vastly outweighs them.", r:"2 Corinthians 4:17" },
    { v:"We fix our gaze on things that cannot be seen. For the things we see now will soon be gone, but the things we cannot see will last forever.", r:"2 Corinthians 4:18" },
    { v:"Always be full of joy in the Lord. I say it again — rejoice!", r:"Philippians 4:4" },
    { v:"I have told you all this so that you may have peace in me. Take heart, because I have overcome the world.", r:"John 16:33" },
    { v:"No, despite all these things, overwhelming victory is ours through Christ, who loved us.", r:"Romans 8:37" },
    { v:"For every child of God defeats this evil world, and we achieve this victory through our faith.", r:"1 John 5:4" },
    { v:"The Spirit who lives in you is greater than the spirit who lives in the world.", r:"1 John 4:4" },
    { v:"For our present troubles are producing for us a glory that vastly outweighs them and will last forever!", r:"2 Corinthians 4:17" },
    { v:"Being confident of this, that he who began a good work in you will carry it on to completion.", r:"Philippians 1:6" },
    { v:"The Lord is my light and my salvation — so why should I be afraid?", r:"Psalm 27:1" },
    { v:"Everything written in the Scriptures was written to teach us, so that we might have hope.", r:"Romans 15:4" },
  ],
  5: [
    { v:"This is my command — be strong and courageous! Do not be afraid or discouraged. For the Lord your God is with you wherever you go.", r:"Joshua 1:9" },
    { v:"Be on guard. Stand firm in the faith. Be courageous. Be strong.", r:"1 Corinthians 16:13" },
    { v:"The Lord is my strength and my song; he has given me victory.", r:"Exodus 15:2" },
    { v:"Be strong in the Lord and in his mighty power.", r:"Ephesians 6:10" },
    { v:"God is our refuge and strength, always ready to help in times of trouble.", r:"Psalm 46:1" },
    { v:"The Lord gives his people strength. The Lord blesses them with peace.", r:"Psalm 29:11" },
    { v:"My health may fail, and my spirit may grow weak, but God remains the strength of my heart.", r:"Psalm 73:26" },
    { v:"The Lord is my strength and my shield. I trust him with all my heart.", r:"Psalm 28:7" },
    { v:"He gives power to the weak and strength to the powerless.", r:"Isaiah 40:29" },
    { v:"Don't be afraid, for I am with you. Don't be discouraged, for I am your God. I will strengthen you and help you.", r:"Isaiah 41:10" },
    { v:"For I hold you by your right hand — I, the Lord your God. And I say to you, Don't be afraid. I am here to help you.", r:"Isaiah 41:13" },
    { v:"The Sovereign Lord is my strength! He makes me as surefooted as a deer, able to tread upon the heights.", r:"Habakkuk 3:19" },
    { v:"Through God we will do valiantly, and it is he who shall tread down our foes.", r:"Psalm 60:12" },
    { v:"I can do everything through Christ, who gives me strength.", r:"Philippians 4:13" },
    { v:"My grace is sufficient for you, for my power is made perfect in weakness.", r:"2 Corinthians 12:9" },
    { v:"Therefore I will boast all the more gladly about my weaknesses, so that Christ's power may rest on me.", r:"2 Corinthians 12:9" },
    { v:"With your help I can advance against a troop; with my God I can scale a wall.", r:"Psalm 18:29" },
    { v:"The Lord will fight for you; you need only to be still.", r:"Exodus 14:14" },
    { v:"No, despite all these things, overwhelming victory is ours through Christ, who loved us.", r:"Romans 8:37" },
    { v:"For every child of God defeats this evil world, and we achieve this victory through our faith.", r:"1 John 5:4" },
    { v:"You belong to God. You have already won a victory, because the Spirit who lives in you is greater than the spirit who lives in the world.", r:"1 John 4:4" },
    { v:"I go before you and will level the mountains; I will break down gates of bronze and cut through bars of iron.", r:"Isaiah 45:2" },
    { v:"Be strong and courageous, for you are the one who will lead these people.", r:"Joshua 1:6" },
    { v:"I have fought the good fight, I have finished the race, and I have remained faithful.", r:"2 Timothy 4:7" },
    { v:"And now the prize awaits me — the crown of righteousness, which the Lord, the righteous Judge, will give me.", r:"2 Timothy 4:8" },
    { v:"I discipline my body like an athlete, training it to do what it should.", r:"1 Corinthians 9:27" },
    { v:"So I run with purpose in every step. I am not just shadowboxing.", r:"1 Corinthians 9:26" },
    { v:"Wait patiently for the Lord. Be brave and courageous. Yes, wait patiently for the Lord.", r:"Psalm 27:14" },
    { v:"What shall we say? If God is for us, who can ever be against us?", r:"Romans 8:31" },
    { v:"The Lord your God is in your midst, a mighty one who will save.", r:"Zephaniah 3:17" },
    { v:"Be strong and courageous! Do not be frightened, and do not be dismayed, for the Lord your God is with you wherever you go.", r:"Joshua 1:9" },
  ],
  6: [
    { v:"Let us run with endurance the race God has set before us.", r:"Hebrews 12:1" },
    { v:"We do this by keeping our eyes on Jesus, the champion who initiates and perfects our faith.", r:"Hebrews 12:2" },
    { v:"Think of all the hostility he endured from sinful people; then you won't become weary and give up.", r:"Hebrews 12:3" },
    { v:"Don't you realize that in a race everyone runs, but only one person gets the prize? So run to win!", r:"1 Corinthians 9:24" },
    { v:"All athletes are disciplined in their training. They do it to win a prize that will fade away, but we do it for an eternal prize.", r:"1 Corinthians 9:25" },
    { v:"So I run with purpose in every step. I am not just shadowboxing.", r:"1 Corinthians 9:26" },
    { v:"I discipline my body like an athlete, training it to do what it should.", r:"1 Corinthians 9:27" },
    { v:"We can rejoice, too, when we run into problems and trials, for we know that they help us develop endurance.", r:"Romans 5:3" },
    { v:"Patient endurance is what you need now, so that you will continue to do God's will.", r:"Hebrews 10:36" },
    { v:"So do not throw away this confident trust in the Lord. Remember the great reward it brings you!", r:"Hebrews 10:35" },
    { v:"Blessed is the one who perseveres under trial because, having stood the test, that person will receive the crown of life.", r:"James 1:12" },
    { v:"But as for you, be strong and courageous, for your work will be rewarded.", r:"2 Chronicles 15:7" },
    { v:"So let's not get tired of doing what is good. At just the right time we will reap a harvest of blessing if we don't give up.", r:"Galatians 6:9" },
    { v:"I press on to reach the end of the race and receive the heavenly prize for which God is calling us.", r:"Philippians 3:14" },
    { v:"I have fought the good fight, I have finished the race, and I have remained faithful.", r:"2 Timothy 4:7" },
    { v:"And now the prize awaits me — the crown of righteousness.", r:"2 Timothy 4:8" },
    { v:"Work willingly at whatever you do, as though you were working for the Lord rather than for people.", r:"Colossians 3:23" },
    { v:"Remember that the Lord will give you an inheritance as your reward, and that the Master you are serving is Christ.", r:"Colossians 3:24" },
    { v:"But the one who endures to the end will be saved.", r:"Matthew 10:22" },
    { v:"Remain faithful even when facing death, and I will give you the crown of life.", r:"Revelation 2:10" },
    { v:"I have told you all this so that you may have peace in me. Take heart, because I have overcome the world.", r:"John 16:33" },
    { v:"In the same way, let your good deeds shine out for all to see, so that everyone will praise your heavenly Father.", r:"Matthew 5:16" },
    { v:"We are pressed on every side by troubles, but we are not crushed. We get knocked down, but we are not destroyed.", r:"2 Corinthians 4:8–9" },
    { v:"Those who trust in the Lord will find new strength. They will soar high on wings like eagles. They will run and not grow weary.", r:"Isaiah 40:31" },
    { v:"For our struggle is not against flesh and blood, but against the rulers, against the powers of this dark world.", r:"Ephesians 6:12" },
    { v:"I will keep on hoping for your help; I will praise you more and more.", r:"Psalm 71:14" },
    { v:"I can do everything through Christ, who gives me strength.", r:"Philippians 4:13" },
    { v:"Even when I walk through the darkest valley, I will not be afraid, for you are close beside me.", r:"Psalm 23:4" },
    { v:"Seek the Kingdom of God above all else, and live righteously, and he will give you everything you need.", r:"Matthew 6:33" },
    { v:"Patient endurance is what you need now, so that you will continue to do God's will. Then you will receive all that he has promised.", r:"Hebrews 10:36" },
  ],
  7: [
    { v:"So if the Son sets you free, you are truly free.", r:"John 8:36" },
    { v:"You have been called to live in freedom. Use your freedom to serve one another in love.", r:"Galatians 5:13" },
    { v:"And you will know the truth, and the truth will set you free.", r:"John 8:32" },
    { v:"Wherever the Spirit of the Lord is, there is freedom.", r:"2 Corinthians 3:17" },
    { v:"Many are the plans in a person's heart, but it is the Lord's purpose that prevails.", r:"Proverbs 19:21" },
    { v:"The Lord will work out his plans for my life — for your faithful love, O Lord, endures forever.", r:"Psalm 138:8" },
    { v:"You didn't choose me. I chose you. I appointed you to go and produce lasting fruit.", r:"John 15:16" },
    { v:"For we are his workmanship, created in Christ Jesus for good works, which God prepared beforehand.", r:"Ephesians 2:10" },
    { v:"If God is for us, who can ever be against us?", r:"Romans 8:31" },
    { v:"Since he did not spare even his own Son but gave him up for us all, won't he also give us everything else?", r:"Romans 8:32" },
    { v:"I am the vine; you are the branches. Those who remain in me, and I in them, will produce much fruit.", r:"John 15:5" },
    { v:"But if you remain in me and my words remain in you, you may ask for anything you want, and it will be granted!", r:"John 15:7" },
    { v:"What does the Lord require of you? To act justly and to love mercy and to walk humbly with your God.", r:"Micah 6:8" },
    { v:"Love the Lord your God with all your heart and with all your soul and with all your mind.", r:"Matthew 22:37" },
    { v:"Love your neighbor as yourself.", r:"Matthew 22:39" },
    { v:"For apart from me you can do nothing.", r:"John 15:5" },
    { v:"God will generously provide all you need. Then you will always have everything you need and plenty left over to share with others.", r:"2 Corinthians 9:8" },
    { v:"For I know the one in whom I trust, and I am sure that he is able to guard what I have entrusted to him.", r:"2 Timothy 1:12" },
    { v:"The Lord himself goes before you and will be with you; he will never leave you nor forsake you.", r:"Deuteronomy 31:8" },
    { v:"Glory to God in highest heaven, and peace on earth to those with whom God is pleased.", r:"Luke 2:14" },
    { v:"When you did it to one of the least of these my brothers and sisters, you were doing it to me.", r:"Matthew 25:40" },
    { v:"Live as people who are free, not using your freedom as a cover-up for evil, but living as servants of God.", r:"1 Peter 2:16" },
    { v:"I am leaving you with a gift — peace of mind and heart. The peace I give is a gift the world cannot give.", r:"John 14:27" },
    { v:"Whatever you do or say, do it as a representative of the Lord Jesus, giving thanks through him to God the Father.", r:"Colossians 3:17" },
    { v:"Work willingly at whatever you do, as though you were working for the Lord rather than for people.", r:"Colossians 3:23" },
    { v:"God saved us and called us to live a holy life — not because we deserved it, but because that was his plan.", r:"2 Timothy 1:9" },
    { v:"You made all the delicate, inner parts of my body and knit me together in my mother's womb.", r:"Psalm 139:13" },
    { v:"Seek the Kingdom of God above all else, and live righteously, and he will give you everything you need.", r:"Matthew 6:33" },
    { v:"For this is how God loved the world: He gave his one and only Son, so that everyone who believes in him will not perish but have eternal life.", r:"John 3:16" },
    { v:"So be strong and courageous! Do not be afraid and do not panic. For the Lord your God will personally go ahead of you.", r:"Deuteronomy 31:6" },
    { v:"I am the vine; you are the branches. Those who remain in me will produce much fruit. For apart from me you can do nothing.", r:"John 15:5" },
  ],
  8: [
    { v:"Don't you realize that your body is the temple of the Holy Spirit, who lives in you and was given to you by God? You do not belong to yourself.", r:"1 Corinthians 6:19" },
    { v:"For God bought you with a high price. So you must honor God with your body.", r:"1 Corinthians 6:20" },
    { v:"So whether you eat or drink, or whatever you do, do it all for the glory of God.", r:"1 Corinthians 10:31" },
    { v:"Dear friend, I hope all is well with you and that you are as healthy in body as you are strong in spirit.", r:"3 John 1:2" },
    { v:"Physical training is good, but training for godliness is much better, promising benefits in this life and in the life to come.", r:"1 Timothy 4:8" },
    { v:"So let the Holy Spirit guide your lives. Then you won't be doing what your sinful nature craves.", r:"Galatians 5:16" },
    { v:"Give your bodies to God because of all he has done for you. Let them be a living and holy sacrifice — the kind he will find acceptable.", r:"Romans 12:1" },
    { v:"Don't let the world around you squeeze you into its own mold, but let God re-make you so that your whole attitude of mind is changed.", r:"Romans 12:2" },
    { v:"The human body has many parts, but the many parts make up one whole body.", r:"1 Corinthians 12:12" },
    { v:"God has put each part just where he wants it.", r:"1 Corinthians 12:18" },
    { v:"Some parts of the body that seem weakest and least important are actually the most necessary.", r:"1 Corinthians 12:22" },
    { v:"All of you together are Christ's body, and each of you is a part of it.", r:"1 Corinthians 12:27" },
    { v:"I praise you because I am fearfully and wonderfully made; your works are wonderful, I know that full well.", r:"Psalm 139:14" },
    { v:"She is energetic and strong, a hard worker.", r:"Proverbs 31:17" },
    { v:"She watches over the affairs of her household and does not eat the bread of idleness.", r:"Proverbs 31:27" },
    { v:"Lazy people want much but get little, but those who work hard will prosper.", r:"Proverbs 13:4" },
    { v:"Work brings profit, but mere talk leads to poverty!", r:"Proverbs 14:23" },
    { v:"Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.", r:"Colossians 3:23" },
    { v:"A peaceful heart leads to a healthy body; jealousy is like cancer in the bones.", r:"Proverbs 14:30" },
    { v:"Kind words are like honey — sweet to the soul and healthy for the body.", r:"Proverbs 16:24" },
    { v:"Don't be deceived: God cannot be mocked. A man reaps what he sows.", r:"Galatians 6:7" },
    { v:"Those who live to please the Spirit will harvest everlasting life.", r:"Galatians 6:8" },
    { v:"The Lord nurses them when they are sick and restores them to health.", r:"Psalm 41:3" },
    { v:"He heals the brokenhearted and bandages their wounds.", r:"Psalm 147:3" },
    { v:"I discipline my body like an athlete, training it to do what it should.", r:"1 Corinthians 9:27" },
    { v:"And I will put a new spirit in you. I will take out your stony, stubborn heart and give you a tender, responsive heart.", r:"Ezekiel 36:26" },
    { v:"All athletes are disciplined in their training. They do it to win a prize that will fade away, but we do it for an eternal prize.", r:"1 Corinthians 9:25" },
    { v:"We are being transformed into his image with ever-increasing glory.", r:"2 Corinthians 3:18" },
    { v:"Do you not know that your body is the temple of the Holy Spirit? Therefore honor God with your body.", r:"1 Corinthians 6:19" },
    { v:"So let the Holy Spirit guide your lives.", r:"Galatians 5:16" },
    { v:"For God bought you with a high price. So you must honor God with your body.", r:"1 Corinthians 6:20" },
  ],
  9: [
    { v:"For God has not given us a spirit of fear and timidity, but of power, love, and self-discipline.", r:"2 Timothy 1:7" },
    { v:"I discipline my body like an athlete, training it to do what it should.", r:"1 Corinthians 9:27" },
    { v:"No discipline is enjoyable while it is happening — it's painful! But afterward there will be a peaceful harvest of right living.", r:"Hebrews 12:11" },
    { v:"For the Lord corrects those he loves, just as a father corrects a child in whom he delights.", r:"Proverbs 3:12" },
    { v:"Don't reject the Lord's discipline, and don't be upset when he corrects you.", r:"Proverbs 3:11" },
    { v:"Look straight ahead, and fix your eyes on what lies before you.", r:"Proverbs 4:25" },
    { v:"Mark out a straight path for your feet; stay on the safe path.", r:"Proverbs 4:26" },
    { v:"Don't get sidetracked; keep your feet from following evil.", r:"Proverbs 4:27" },
    { v:"We capture their rebellious thoughts and teach them to obey Christ.", r:"2 Corinthians 10:5" },
    { v:"Fix your thoughts on what is true, and honorable, and right, and pure, and lovely, and admirable.", r:"Philippians 4:8" },
    { v:"Think about things that are excellent and worthy of praise.", r:"Philippians 4:8" },
    { v:"Don't worry about anything; instead, pray about everything. Tell God what you need, and thank him for all he has done.", r:"Philippians 4:6" },
    { v:"Then you will experience God's peace, which exceeds anything we can understand.", r:"Philippians 4:7" },
    { v:"His peace will guard your hearts and minds as you live in Christ Jesus.", r:"Philippians 4:7" },
    { v:"So humble yourselves before God. Resist the devil, and he will flee from you.", r:"James 4:7" },
    { v:"Come close to God, and God will come close to you.", r:"James 4:8" },
    { v:"Humble yourselves before the Lord, and he will lift you up in honor.", r:"James 4:10" },
    { v:"Stay alert! Watch out for your great enemy, the devil. He prowls around like a roaring lion, looking for someone to devour.", r:"1 Peter 5:8" },
    { v:"Stand firm against him, and be strong in your faith.", r:"1 Peter 5:9" },
    { v:"After you have suffered a little while, he will restore, support, and strengthen you, and place you on a firm foundation.", r:"1 Peter 5:10" },
    { v:"We should live in this evil world with wisdom, righteousness, and devotion to God.", r:"Titus 2:12" },
    { v:"Let everything you say be good and helpful, so that your words will be an encouragement to those who hear them.", r:"Ephesians 4:29" },
    { v:"Get rid of all bitterness, rage, anger, harsh words, and slander.", r:"Ephesians 4:31" },
    { v:"Instead, be kind to each other, tenderhearted, forgiving one another, just as God through Christ has forgiven you.", r:"Ephesians 4:32" },
    { v:"Imitate God, therefore, in everything you do, because you are his dear children.", r:"Ephesians 5:1" },
    { v:"For once you were full of darkness, but now you have light from the Lord. So live as people of light!", r:"Ephesians 5:8" },
    { v:"Warn each other every day, while it is still today, so that none of you will be deceived by sin and hardened against God.", r:"Hebrews 3:13" },
    { v:"Since he did not spare even his own Son, won't he also give us everything else?", r:"Romans 8:32" },
    { v:"Teach the older men to exercise self-control, to be worthy of respect, and to live wisely.", r:"Titus 2:2" },
    { v:"Commit your actions to the Lord, and your plans will succeed.", r:"Proverbs 16:3" },
  ],
  10: [
    { v:"Give thanks to the Lord, for he is good! His faithful love endures forever.", r:"Psalm 107:1" },
    { v:"Always be joyful. Never stop praying. Be thankful in all circumstances.", r:"1 Thessalonians 5:16–18" },
    { v:"Give thanks for everything to God the Father in the name of our Lord Jesus Christ.", r:"Ephesians 5:20" },
    { v:"Enter his gates with thanksgiving; go into his courts with praise. Give thanks to him and praise his name.", r:"Psalm 100:4" },
    { v:"For the Lord is good. His unfailing love continues forever, and his faithfulness continues to each generation.", r:"Psalm 100:5" },
    { v:"I will praise you, Lord, with all my heart; I will tell of all the marvelous things you have done.", r:"Psalm 9:1" },
    { v:"Let all that I am praise the Lord; with my whole heart, I will praise his holy name.", r:"Psalm 103:1" },
    { v:"Let all that I am praise the Lord; may I never forget the good things he does for me.", r:"Psalm 103:2" },
    { v:"He forgives all my sins and heals all my diseases.", r:"Psalm 103:3" },
    { v:"He fills my life with good things. My youth is renewed like the eagle's!", r:"Psalm 103:5" },
    { v:"Give thanks to the Lord and proclaim his greatness. Let the whole world know what he has done.", r:"Psalm 105:1" },
    { v:"I will sing to the Lord because he is good to me.", r:"Psalm 13:6" },
    { v:"The Lord is my strength and shield. I trust him with all my heart. He helps me, and my heart is filled with joy.", r:"Psalm 28:7" },
    { v:"I will bless the Lord who guides me; even at night my heart instructs me.", r:"Psalm 16:7" },
    { v:"I know the Lord is always with me. I will not be shaken, for he is right beside me.", r:"Psalm 16:8" },
    { v:"No wonder my heart is glad, and I rejoice. My body rests in safety.", r:"Psalm 16:9" },
    { v:"You will show me the way of life, granting me the joy of your presence and the pleasures of living with you forever.", r:"Psalm 16:11" },
    { v:"Surely your goodness and unfailing love will pursue me all the days of my life.", r:"Psalm 23:6" },
    { v:"I remain confident of this: I will see the goodness of the Lord in the land of the living.", r:"Psalm 27:13" },
    { v:"Oh, how great is your goodness, which you have stored up for those who fear you.", r:"Psalm 31:19" },
    { v:"The Lord is good, a strong refuge when trouble comes. He is close to those who trust in him.", r:"Nahum 1:7" },
    { v:"Praise the Lord, I tell myself, and never forget the good things he does for me.", r:"Psalm 103:2" },
    { v:"May the God of hope fill you completely with joy and peace because you trust in him.", r:"Romans 15:13" },
    { v:"A peaceful heart leads to a healthy body.", r:"Proverbs 14:30" },
    { v:"Search for the Lord and for his strength; continually seek him.", r:"Psalm 105:4" },
    { v:"Remember the wonders he has performed, his miracles, and the rulings he has given.", r:"Psalm 105:5" },
    { v:"The Lord is good to those who depend on him, to those who search for him.", r:"Lamentations 3:25" },
    { v:"Taste and see that the Lord is good. Oh, the joys of those who take refuge in him!", r:"Psalm 34:8" },
    { v:"Give thanks to the Lord, for he is good! His faithful love endures forever.", r:"Psalm 118:1" },
    { v:"Now may our Lord Jesus Christ himself and God our Father comfort you and strengthen you.", r:"2 Thessalonians 2:16–17" },
    { v:"The Lord is my strength and my shield. I trust him with all my heart.", r:"Psalm 28:7" },
  ],
  11: [
    { v:"Come to me, all of you who are weary and carry heavy burdens, and I will give you rest.", r:"Matthew 11:28" },
    { v:"Take my yoke upon you. Let me teach you, because I am humble and gentle at heart, and you will find rest for your souls.", r:"Matthew 11:29" },
    { v:"For my yoke is easy to bear, and the burden I give you is light.", r:"Matthew 11:30" },
    { v:"The Lord is my shepherd; I have all that I need. He lets me rest in green meadows.", r:"Psalm 23:1–2" },
    { v:"He leads me beside peaceful streams. He renews my strength.", r:"Psalm 23:2–3" },
    { v:"He guides me along right paths, bringing honor to his name.", r:"Psalm 23:3" },
    { v:"Even when I walk through the darkest valley, I will not be afraid, for you are close beside me.", r:"Psalm 23:4" },
    { v:"Trust in the Lord with all your heart; do not depend on your own understanding.", r:"Proverbs 3:5" },
    { v:"Seek his will in all you do, and he will show you which path to take.", r:"Proverbs 3:6" },
    { v:"Then you will have healing for your body and strength for your bones.", r:"Proverbs 3:8" },
    { v:"Give all your worries and cares to God, for he cares about you.", r:"1 Peter 5:7" },
    { v:"Be still, and know that I am God.", r:"Psalm 46:10" },
    { v:"I lay down and slept, yet I woke up in safety, for the Lord was watching over me.", r:"Psalm 3:5" },
    { v:"In peace I will lie down and sleep, for you alone, O Lord, will keep me safe.", r:"Psalm 4:8" },
    { v:"He will not let you stumble; the one who watches over you will not slumber.", r:"Psalm 121:3" },
    { v:"The Lord himself watches over you! The Lord stands beside you as your protective shade.", r:"Psalm 121:5" },
    { v:"The Lord keeps you from all harm and watches over your life.", r:"Psalm 121:7" },
    { v:"The Lord keeps watch over you as you come and go, both now and forever.", r:"Psalm 121:8" },
    { v:"God gives rest to his loved ones.", r:"Psalm 127:2" },
    { v:"Don't worry about anything; instead, pray about everything.", r:"Philippians 4:6" },
    { v:"Tell God what you need, and thank him for all he has done.", r:"Philippians 4:6" },
    { v:"Then you will experience God's peace, which exceeds anything we can understand. His peace will guard your hearts and minds.", r:"Philippians 4:7" },
    { v:"I am leaving you with a gift — peace of mind and heart. The peace I give is a gift the world cannot give.", r:"John 14:27" },
    { v:"Cast your cares on the Lord and he will sustain you; he will never let the righteous be shaken.", r:"Psalm 55:22" },
    { v:"When doubts filled my mind, your comfort gave me renewed hope and cheer.", r:"Psalm 94:19" },
    { v:"The Lord is close to the brokenhearted; he rescues those whose spirits are crushed.", r:"Psalm 34:18" },
    { v:"He heals the brokenhearted and bandages their wounds.", r:"Psalm 147:3" },
    { v:"Morning, noon, and night I cry out in my distress, and the Lord hears my voice.", r:"Psalm 55:17" },
    { v:"Come close to God, and God will come close to you.", r:"James 4:8" },
    { v:"In peace I will lie down and sleep, for you alone, O Lord, will keep me safe.", r:"Psalm 4:8" },
  ],
  12: [
    { v:"Your word is a lamp to guide my feet and a light for my path.", r:"Psalm 119:105" },
    { v:"The Lord is my light and my salvation — so why should I be afraid?", r:"Psalm 27:1" },
    { v:"In the same way, let your good deeds shine out for all to see, so that everyone will praise your heavenly Father.", r:"Matthew 5:16" },
    { v:"You are the light of the world — like a city on a hilltop that cannot be hidden.", r:"Matthew 5:14" },
    { v:"I am the light of the world. If you follow me, you won't have to walk in darkness.", r:"John 8:12" },
    { v:"For everything there is a season, a time for every activity under heaven.", r:"Ecclesiastes 3:1" },
    { v:"Yet God has made everything beautiful for its own time.", r:"Ecclesiastes 3:11" },
    { v:"I know that there is nothing better for people than to be happy and to do good while they live.", r:"Ecclesiastes 3:12" },
    { v:"Here now is my final conclusion: Fear God and obey his commands, for this is everyone's duty.", r:"Ecclesiastes 12:13" },
    { v:"Search me, O God, and know my heart; test me and know my anxious thoughts.", r:"Psalm 139:23" },
    { v:"Point out anything in me that offends you, and lead me along the path of everlasting life.", r:"Psalm 139:24" },
    { v:"How precious are your thoughts about me, O God. They cannot be numbered!", r:"Psalm 139:17" },
    { v:"I can never escape from your Spirit! I can never get away from your presence!", r:"Psalm 139:7" },
    { v:"You go before me and follow me. You place your hand of blessing on my head.", r:"Psalm 139:5" },
    { v:"Such knowledge is too wonderful for me, too great for me to understand!", r:"Psalm 139:6" },
    { v:"For his unfailing love toward those who fear him is as great as the height of the heavens above the earth.", r:"Psalm 103:11" },
    { v:"He has removed our sins as far from us as the east is from the west.", r:"Psalm 103:12" },
    { v:"The Lord is like a father to his children, tender and compassionate to those who fear him.", r:"Psalm 103:13" },
    { v:"For he knows how weak we are; he remembers we are only dust.", r:"Psalm 103:14" },
    { v:"But the love of the Lord remains forever with those who fear him.", r:"Psalm 103:17" },
    { v:"Praise the Lord, I tell myself, and never forget the good things he does for me.", r:"Psalm 103:2" },
    { v:"May the God of hope fill you completely with joy and peace because you trust in him. Then you will overflow with confident hope.", r:"Romans 15:13" },
    { v:"Now may our Lord Jesus Christ himself and God our Father comfort you and strengthen you in every good thing you do and say.", r:"2 Thessalonians 2:16–17" },
    { v:"For a child is born to us, a son is given to us. And he will be called: Wonderful Counselor, Mighty God, Everlasting Father, Prince of Peace.", r:"Isaiah 9:6" },
    { v:"Glory to God in highest heaven, and peace on earth to those with whom God is pleased.", r:"Luke 2:14" },
    { v:"For this is how God loved the world: He gave his one and only Son, so that everyone who believes in him will not perish but have eternal life.", r:"John 3:16" },
    { v:"The night is almost gone; the day of salvation will soon be here. So remove your dark deeds like dirty clothes, and put on the shining armor of right living.", r:"Romans 13:12" },
    { v:"I remain confident of this: I will see the goodness of the Lord in the land of the living.", r:"Psalm 27:13" },
    { v:"This means that anyone who belongs to Christ has become a new person. The old life is gone; a new life has begun!", r:"2 Corinthians 5:17" },
    { v:"Surely your goodness and unfailing love will pursue me all the days of my life, and I will live in the house of the Lord forever.", r:"Psalm 23:6" },
    { v:"And I am certain that God, who began a good work within you, will continue his work until it is finally finished.", r:"Philippians 1:6" },
  ],
};

function getTodayScripture() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const mm = String(month).padStart(2,"0");
  const dd = String(day).padStart(2,"0");

  // Special dates first
  if (SPECIAL[`${mm}-${dd}`]) return { ...SPECIAL[`${mm}-${dd}`], isSpecial: true };

  // Liturgical season overrides
  const season = getLiturgicalSeason(now);
  if (SEASONS[season]) return { ...SEASONS[season], isSpecial: true };

  // Pick from monthly array by day
  const arr = BY_MONTH[month] || BY_MONTH[1];
  const entry = arr[(day - 1) % arr.length];
  return { v: entry.v, r: entry.r, season: null, isSunday: now.getDay() === 0 };
}

// ── Sunday reflection prompts ─────────────────────────────────────────────────
const SUNDAY_PROMPTS = [
  "What is one thing your body did this week that you are grateful for?",
  "Where did you feel God's strength most clearly in your training this week?",
  "What would it look like to honor God with your body more fully this coming week?",
  "What is one area of your health you want to bring to God in prayer today?",
  "Where did you hold back this week — in training, in rest, or in trusting God?",
  "What did this week's effort reveal about your character? What do you want to build on?",
  "How can the strength you are building serve the people around you this week?",
  "What do you need to release — a comparison, a shame, a fear — before the new week begins?",
];

function getSundayPrompt() {
  const week = Math.floor(new Date().getDate() / 7);
  return SUNDAY_PROMPTS[week % SUNDAY_PROMPTS.length];
}

// ── AI-powered devotional ─────────────────────────────────────────────────────
async function fetchDevotion(verse, ref, season) {
  const systemPrompt = `You are a warm, pastoral voice writing daily devotionals for a Christian fitness app called Tara Mattimiro Fitness. Write in NLT-adjacent language — accessible, modern, sincere. Never preachy. Never cheesy. Your voice should feel like a wise friend who loves God and understands the physical and spiritual life intimately.

Write a devotional of 120–160 words that:
- Opens by grounding the verse in its original context (briefly)
- Draws a genuine, non-forced connection to the reader's physical training or body
- Ends with a single sentence that is a quiet, honest challenge or invitation for today

Do not use emojis. Do not use headers. Write in plain paragraphs. No bullet points.`;

  const userMsg = `Write a devotional for this verse${season ? ` (liturgical season: ${season})` : ""}:\n\n"${verse}" — ${ref}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMsg }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || null;
}

// ── Cross SVG ─────────────────────────────────────────────────────────────────
function CrossMark({ color = "#555" }) {
  return (
    <svg width="13" height="15" viewBox="0 0 13 15" fill="none" style={{ flexShrink: 0, marginTop: "2px" }}>
      <rect x="5.5" y="0" width="2" height="15" rx="1" fill={color} />
      <rect x="0" y="5" width="13" height="2" rx="1" fill={color} />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function DailyScripture({ accent = "#2563a8" }) {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showDevotion, setShowDevotion] = useState(false);
  const [devotion, setDevotion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const scripture = getTodayScripture();
  const isSunday = new Date().getDay() === 0;
  const sundayPrompt = isSunday ? getSundayPrompt() : null;

  useEffect(() => {
    try {
      const stored = localStorage.getItem("scripture_dismissed");
      if (stored === new Date().toISOString().slice(0, 10)) setDismissed(true);
    } catch {}
  }, []);

  async function handleDevotion() {
    if (showDevotion) { setShowDevotion(false); return; }
    setShowDevotion(true);
    if (devotion) return;

    // Check cache
    const cacheKey = `devotion_${new Date().toISOString().slice(0, 10)}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) { setDevotion(cached); return; }
    } catch {}

    setLoading(true);
    setError(false);
    try {
      const text = await fetchDevotion(scripture.v, scripture.r, scripture.season);
      if (text) {
        setDevotion(text);
        try { localStorage.setItem(cacheKey, text); } catch {}
      } else { setError(true); }
    } catch { setError(true); }
    setLoading(false);
  }

  function dismiss() {
    try { localStorage.setItem("scripture_dismissed", new Date().toISOString().slice(0, 10)); } catch {}
    setDismissed(true);
  }

  if (dismissed) return null;

  const seasonLabel = scripture.season || (isSunday ? "Sunday · Rest & Reflection" : "Today's Word");

  return (
    <div style={{ margin: "10px 14px", borderRadius: "10px", overflow: "hidden", border: "1px solid #222", background: "#111" }}>

      {/* Header */}
      <button onClick={() => setExpanded(p => !p)} style={{
        width: "100%", background: "none", border: "none", cursor: "pointer",
        padding: "13px 15px", display: "flex", alignItems: "flex-start", gap: "12px", textAlign: "left", ...F,
      }}>
        <CrossMark color={accent} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: accent, marginBottom: "5px" }}>
            {seasonLabel}
          </div>
          <div style={{
            fontSize: "13px", color: "#e8e0cc", lineHeight: "1.65", fontStyle: "italic",
            display: expanded ? "block" : "-webkit-box",
            WebkitLineClamp: expanded ? "unset" : 2,
            WebkitBoxOrient: "vertical",
            overflow: expanded ? "visible" : "hidden",
          }}>
            "{scripture.v}"
          </div>
          {expanded && (
            <div style={{ fontSize: "10px", color: accent, marginTop: "7px", letterSpacing: "0.06em" }}>
              — {scripture.r}
            </div>
          )}
        </div>
        <span style={{ color: "#444", fontSize: "10px", flexShrink: 0, paddingTop: "2px" }}>
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded && (
        <div style={{ borderTop: "1px solid #1a1a1a" }}>

          {/* Sunday reflection prompt */}
          {isSunday && sundayPrompt && (
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #1a1a1a" }}>
              <div style={{ fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#555", marginBottom: "8px" }}>
                Reflection for today
              </div>
              <div style={{ fontSize: "13px", color: "#c8c0b0", lineHeight: "1.75", fontStyle: "italic" }}>
                {sundayPrompt}
              </div>
            </div>
          )}

          {/* Devotional button */}
          <div style={{ padding: "12px 15px", borderBottom: showDevotion ? "1px solid #1a1a1a" : "none" }}>
            <button onClick={handleDevotion} style={{
              background: "none", border: `1px solid ${accent}55`, color: accent,
              borderRadius: "5px", padding: "8px 14px", fontSize: "11px", cursor: "pointer",
              ...F, letterSpacing: "0.05em", width: "100%", textAlign: "left",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span>{showDevotion ? "Close reflection" : "Read the reflection"}</span>
              <span style={{ fontSize: "10px", color: "#444" }}>{showDevotion ? "▲" : "▼"}</span>
            </button>
          </div>

          {/* Devotional content */}
          {showDevotion && (
            <div style={{ padding: "16px 15px", borderBottom: "1px solid #1a1a1a" }}>
              <div style={{ fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#444", marginBottom: "12px" }}>
                {scripture.r}
              </div>
              {loading && (
                <div style={{ fontSize: "12px", color: "#555", fontStyle: "italic", lineHeight: "1.6" }}>
                  Preparing today's reflection...
                </div>
              )}
              {error && (
                <div style={{ fontSize: "12px", color: "#666", lineHeight: "1.6" }}>
                  Reflection unavailable — sit with the verse on its own today.
                </div>
              )}
              {devotion && (
                <div style={{ fontSize: "13px", color: "#c8c0b0", lineHeight: "1.85" }}>
                  {devotion}
                </div>
              )}
            </div>
          )}

          {/* Dismiss */}
          <div style={{ padding: "10px 15px", display: "flex", justifyContent: "flex-end" }}>
            <button onClick={dismiss} style={{
              background: "none", border: "none", color: "#3a3a3a",
              fontSize: "10px", cursor: "pointer", ...F, letterSpacing: "0.05em",
            }}>
              Dismiss for today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
