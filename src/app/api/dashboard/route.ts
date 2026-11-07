import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth/session";
import { getSessionsByUser, getUserSessionStats } from "@/lib/db/sessions";
import { getReportsByUser, getUserReportStats } from "@/lib/db/reports";

export async function GET() {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const sessionStats = getUserSessionStats(session.userId);
  const reportStats = getUserReportStats(session.userId);
  const recentSessions = getSessionsByUser(session.userId, 10);
  const recentReports = getReportsByUser(session.userId, 10);

  // Merge sessions with their reports for the history view
  const history = recentSessions.map((ses) => {
    const report = recentReports.find((r) => r.session_id === ses.id);
    return {
      id: ses.id,
      title: ses.title,
      scenario: ses.scenario,
      difficulty: ses.difficulty,
      status: ses.status,
      durationSeconds: ses.duration_seconds,
      createdAt: ses.created_at,
      report: report
        ? {
            id: report.id,
            totalScore: report.total_score,
            tier: report.tier,
            eyeContactRatio: report.eye_contact_ratio,
            wpm: report.wpm,
            fillerCount: report.filler_count,
          }
        : null,
    };
  });

  return NextResponse.json({
    user: {
      displayName: session.displayName,
      email: session.email,
      role: session.role,
    },
    stats: {
      totalSessions: sessionStats.totalSessions,
      completedSessions: sessionStats.completedSessions,
      totalPracticeMinutes: sessionStats.totalPracticeMinutes,
      averageScore: reportStats.averageScore,
      bestScore: reportStats.bestScore,
      avgEyeContact: reportStats.avgEyeContact,
      avgWpm: reportStats.avgWpm,
      totalReports: reportStats.totalReports,
    },
    history,
  });
}
