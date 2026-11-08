import { getDatabase } from "../src/lib/db";

function main() {
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║           SpeakLife AI — Database Inspector Tool               ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  try {
    const db = getDatabase();

    // 1. Overview of Tables
    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_migrations' AND name NOT LIKE 'sqlite_%'"
      )
      .all() as { name: string }[];

    console.log("📊 1. DANH SÁCH BẢNG & SỐ LƯỢNG BẢN GHI:");
    console.log("────────────────────────────────────────────────────────────────");
    for (const { name } of tables) {
      const row = db.prepare(`SELECT count(*) as count FROM ${name}`).get() as { count: number };
      console.log(`  📁 Bảng: ${name.padEnd(20)} | Số dòng: ${String(row.count).padStart(5)}`);
    }

    // 2. Users Table Summary
    console.log("\n👤 2. DANH SÁCH NGƯỜI DÙNG (USERS):");
    console.log("────────────────────────────────────────────────────────────────");
    const users = db
      .prepare("SELECT id, email, display_name, role, created_at FROM users ORDER BY created_at DESC LIMIT 5")
      .all() as any[];

    if (users.length === 0) {
      console.log("  (Chưa có tài khoản người dùng nào được tạo)");
    } else {
      for (const u of users) {
        console.log(`  • [${u.role.toUpperCase()}] ${u.display_name} (${u.email}) — Ngày tạo: ${u.created_at}`);
      }
    }

    // 3. Rehearsal Sessions Summary
    console.log("\n🎙️ 3. CÁC PHIÊN LUYỆN TẬP GẦN NHẤT (REHEARSAL SESSIONS):");
    console.log("────────────────────────────────────────────────────────────────");
    const sessions = db
      .prepare(
        `SELECT s.id, s.title, s.scenario, s.difficulty, s.status, s.duration_seconds, s.created_at,
                r.total_score, r.tier
         FROM rehearsal_sessions s
         LEFT JOIN reports r ON r.session_id = s.id
         ORDER BY s.created_at DESC LIMIT 5`
      )
      .all() as any[];

    if (sessions.length === 0) {
      console.log("  (Chưa có phiên luyện tập nào)");
    } else {
      for (const s of sessions) {
        const scoreText = s.total_score != null ? `${s.total_score}/100 (${s.tier})` : "Chưa chấm";
        console.log(`  • "${s.title}" [${s.scenario} - ${s.difficulty}]`);
        console.log(`    Trạng thái: ${s.status} | Điểm: ${scoreText} | Thời lượng: ${s.duration_seconds || 0}s | Lúc: ${s.created_at}`);
      }
    }

    // 4. AI Configuration
    console.log("\n🤖 4. CẤU HÌNH AI GIÁM KHẢO (AI_CONFIG):");
    console.log("────────────────────────────────────────────────────────────────");
    const aiConfig = db.prepare("SELECT * FROM ai_config WHERE id = 1").get() as any;
    if (aiConfig) {
      const hasKey = Boolean(aiConfig.api_key || process.env.GEMINI_API_KEY);
      console.log(`  • Nhà cung cấp: ${aiConfig.provider}`);
      console.log(`  • Mô hình:      ${aiConfig.model}`);
      console.log(`  • API Key:      ${hasKey ? "ĐÃ CẤU HÌNH (Sẵn sàng gọi Gemini)" : "CHƯA CẤU HÌNH (Dùng Offline Heuristics)"}`);
      console.log(`  • Trạng thái:   ${aiConfig.last_status || "Chưa kiểm tra"}`);
    }

    console.log("\n✔ Kiểm tra hoàn tất. File database lưu tại: ./data/speaklife.db\n");
  } catch (err: any) {
    console.error("❌ Lỗi khi đọc database:", err.message);
  }
}

main();
