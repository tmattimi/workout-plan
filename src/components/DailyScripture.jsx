import { useState, useEffect } from "react";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

// 31 scriptures — one per day of month, cycles through
const SCRIPTURES = [
  { verse: "I can do all things through Christ who strengthens me.", ref: "Philippians 4:13" },
  { verse: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.", ref: "Joshua 1:9" },
  { verse: "Do you not know that your bodies are temples of the Holy Spirit? Therefore honor God with your bodies.", ref: "1 Corinthians 6:19–20" },
  { verse: "The Lord is my strength and my shield; my heart trusts in him, and he helps me.", ref: "Psalm 28:7" },
  { verse: "She is clothed with strength and dignity; she can laugh at the days to come.", ref: "Proverbs 31:25" },
  { verse: "But those who hope in the Lord will renew their strength. They will soar on wings like eagles.", ref: "Isaiah 40:31" },
  { verse: "For God gave us a spirit not of fear but of power and love and self-control.", ref: "2 Timothy 1:7" },
  { verse: "No discipline seems pleasant at the time, but painful. Later on, however, it produces a harvest of righteousness and peace.", ref: "Hebrews 12:11" },
  { verse: "Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.", ref: "Colossians 3:23" },
  { verse: "Train yourself to be godly. For physical training is of some value, but godliness has value for all things.", ref: "1 Timothy 4:7–8" },
  { verse: "The Lord will fight for you; you need only to be still.", ref: "Exodus 14:14" },
  { verse: "Have I not commanded you? Be strong and courageous. Do not be terrified; do not be discouraged.", ref: "Joshua 1:9" },
  { verse: "I have learned, in whatever situation I am, to be content. I can do all things through him who strengthens me.", ref: "Philippians 4:11,13" },
  { verse: "Even youths grow tired and weary, and young men stumble and fall; but those who hope in the Lord will renew their strength.", ref: "Isaiah 40:30–31" },
  { verse: "Do not grow weary in doing good, for at the proper time we will reap a harvest if we do not give up.", ref: "Galatians 6:9" },
  { verse: "The Lord is my strength and my song; he has given me victory.", ref: "Psalm 118:14" },
  { verse: "Consider it pure joy whenever you face trials of many kinds, because you know that the testing of your faith produces perseverance.", ref: "James 1:2–3" },
  { verse: "You are altogether beautiful, my darling; there is no flaw in you.", ref: "Song of Solomon 4:7" },
  { verse: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.", ref: "Jeremiah 29:11" },
  { verse: "Being confident of this, that he who began a good work in you will carry it on to completion.", ref: "Philippians 1:6" },
  { verse: "My flesh and my heart may fail, but God is the strength of my heart and my portion forever.", ref: "Psalm 73:26" },
  { verse: "Run in such a way as to get the prize. Everyone who competes in the games goes into strict training.", ref: "1 Corinthians 9:24–25" },
  { verse: "He gives strength to the weary and increases the power of the weak.", ref: "Isaiah 40:29" },
  { verse: "Therefore, since we are surrounded by such a great cloud of witnesses, let us run with perseverance the race marked out for us.", ref: "Hebrews 12:1" },
  { verse: "Blessed is the one who perseveres under trial because, having stood the test, that person will receive the crown of life.", ref: "James 1:12" },
  { verse: "You were made for more. The Lord has set eternity in your heart.", ref: "Ecclesiastes 3:11" },
  { verse: "Be on your guard; stand firm in the faith; be courageous; be strong.", ref: "1 Corinthians 16:13" },
  { verse: "May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope.", ref: "Romans 15:13" },
  { verse: "I press on toward the goal to win the prize for which God has called me heavenward in Christ Jesus.", ref: "Philippians 3:14" },
  { verse: "Create in me a pure heart, O God, and renew a steadfast spirit within me.", ref: "Psalm 51:10" },
  { verse: "The Lord your God is with you, the Mighty Warrior who saves. He will take great delight in you.", ref: "Zephaniah 3:17" },
];

function getTodayScripture() {
  const day = new Date().getDate(); // 1–31
  return SCRIPTURES[(day - 1) % SCRIPTURES.length];
}

export default function DailyScripture({ accent = "#1a1a1a", color = "#f7f6f3" }) {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const scripture = getTodayScripture();

  // Check if already dismissed today
  useEffect(() => {
    try {
      const stored = localStorage.getItem("scripture_dismissed");
      if (stored === new Date().toISOString().slice(0, 10)) {
        setDismissed(true);
      }
    } catch {}
  }, []);

  function dismiss() {
    try {
      localStorage.setItem("scripture_dismissed", new Date().toISOString().slice(0, 10));
    } catch {}
    setDismissed(true);
  }

  if (dismissed) return null;

  return (
    <div style={{
      margin: "10px 14px",
      background: "linear-gradient(135deg, #111 0%, #1a1208 100%)",
      borderRadius: "10px",
      border: `1px solid ${accent}44`,
      overflow: "hidden",
    }}>
      <button
        onClick={() => setExpanded(p => !p)}
        style={{
          width: "100%", background: "none", border: "none", cursor: "pointer",
          padding: "11px 14px", display: "flex", alignItems: "center", gap: "10px",
          textAlign: "left", ...F,
        }}
      >
        <span style={{ fontSize: "18px", flexShrink: 0 }}>✝️</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: accent, marginBottom: "3px" }}>
            Today's Word
          </div>
          <div style={{
            fontSize: "12px", color: "#e8e0cc", lineHeight: "1.5",
            display: expanded ? "block" : "-webkit-box",
            WebkitLineClamp: expanded ? "unset" : 2,
            WebkitBoxOrient: "vertical",
            overflow: expanded ? "visible" : "hidden",
            fontStyle: "italic",
          }}>
            "{scripture.verse}"
          </div>
          {expanded && (
            <div style={{ fontSize: "10px", color: accent, marginTop: "6px", letterSpacing: "0.05em" }}>
              — {scripture.ref}
            </div>
          )}
        </div>
        <span style={{ color: "#555", fontSize: "11px", flexShrink: 0 }}>{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div style={{ borderTop: "1px solid #222", padding: "10px 14px", display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={dismiss}
            style={{
              background: "none", border: "1px solid #333", color: "#555",
              borderRadius: "20px", padding: "4px 12px", fontSize: "10px",
              cursor: "pointer", ...F,
            }}
          >
            Dismiss for today
          </button>
        </div>
      )}
    </div>
  );
}
