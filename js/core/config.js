'use strict';
/* Supabase 연결 설정 */
/* ══════════════════════════════════════════════════════════════
   ▼▼▼  Supabase 연결 설정  ▼▼▼  (URL과 KEY를 여기서 수정하세요)
══════════════════════════════════════════════════════════════ */

const SUPABASE_URL='https://swecejgbnlulcqmfffvv.supabase.co';
const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3ZWNlamdibmx1bGNxbWZmZnZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxOTI2MDcsImV4cCI6MjA5MDc2ODYwN30.nFeiYalxzheU5Os9eD1oLD4_ftkIEl16c0PnKYD7EjY';
/* ══════════════════════════════════════════════════════════════
   ▲▲▲  여기까지  ▲▲▲
══════════════════════════════════════════════════════════════ */
const SB=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
let _dbConnected=false,_reloadTimer=null;
