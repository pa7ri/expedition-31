-- Expedition 31 — seed the 20 (+1 portal) tags.
-- Run after schema.sql. Codes must match src/game/tags.ts exactly.
-- Safe to re-run.

insert into tags (code, type, title, active) values
  ('A11F','ENERGY','💎 Elemental Crystal', true),
  ('A22E','ENERGY','🔥 Ember Cache', true),
  ('A33S','ENERGY','💧 Hidden Spring', true),
  ('A44Z','ENERGY','🌪️ Zephyr Font', true),
  ('B01D','BATTLE','⚔️ Elemental Battle', true),
  ('B02D','BATTLE','⚔️ Elemental Battle', true),
  ('B03D','BATTLE','⚔️ Elemental Duel', true),
  ('C01R','ALLIANCE','🌈 Elemental Balance', true),
  ('C02R','ALLIANCE','🌈 Elemental Balance', true),
  ('C03R','ALLIANCE','🌈 Elemental Harmony', true),
  ('D01A','ARTIFACT','🔥 Flame of Rage', true),
  ('D02A','ARTIFACT','💧 Heart of the Ocean', true),
  ('D03A','ARTIFACT','🌿 Ancient Root', true),
  ('E01T','MYSTERY','🗿 The Ancient Temple', true),
  ('E02M','MYSTERY','📜 Forgotten Scroll', true),
  ('E03M','MYSTERY','🕯️ Whispering Shrine', true),
  ('F01C','LEGENDARY','⚡ Elemental Convergence', true),
  ('F02X','LEGENDARY','☄️ The Collapse', true),
  ('G01H','CHAOS','🌀 Chaos', true),
  ('P0RT','PORTAL','🌑 The Portal', true)
on conflict (code) do update set type = excluded.type, title = excluded.title;
