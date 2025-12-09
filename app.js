// -----------------------------------------
// RiskMan – Firestore Logic (완성본)
// -----------------------------------------

// ========== 월 데이터 저장 ==========
async function submitMonthlyForm() {
  const user = auth.currentUser;
  if (!user) {
    alert("로그인이 필요합니다.");
    return;
  }

  const today = new Date();
  const ym = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const realestate = Number(document.getElementById("realestate").value || 0);
  const stocks = Number(document.getElementById("stocks").value || 0);
  const cash = Number(document.getElementById("cash").value || 0);
  const other = Number(document.getElementById("other").value || 0);

  const exercise = Number(document.getElementById("exercise").value || 0);
  const sleep = Number(document.getElementById("sleep").value || 0);
  const stress = Number(document.getElementById("stress").value || 0);

  const totalAssets = realestate + stocks + cash + other;

  const riskScore = calculateRiskScore(stocks, totalAssets, exercise, sleep, stress);

  try {
    await setDoc(
      doc(db, "users", user.uid, "months", ym),
      {
        ym,
        realestate,
        stocks,
        cash,
        other,
        totalAssets,
        exercise,
        sleep,
        stress,
        riskScore,
        savedAt: new Date()
      }
    );

    alert("저장되었습니다!");
    window.location.href = "dashboard.html";

  } catch (err) {
    console.error("저장 오류:", err);
    alert("저장 오류: " + err.message);
  }
}

// Risk calculation
function calculateRiskScore(stocks, total, exercise, sleep, stress) {
  let score = 50;

  // Tesla-heavy portfolio → 위험 증가
  if (total > 0) {
    const ratio = stocks / total;
    score += ratio * 40;
  }

  // 건강 지표 반영
  score -= exercise * 0.8;
  score -= sleep * 0.5;
  score += stress * 2;

  return Math.max(1, Math.min(100, Math.round(score)));
}

async function loadDashboard() {
    const user = firebase.auth().currentUser;
    if (!user) {
        console.log("로그인 필요");
        return;
    }

    console.log("로그인 사용자:", user.uid);

    // 🔥 1) savedAt 대신 ym(yyyy-mm 문자열) 기준으로 최신월을 로드
    const snap = await db
        .collection("users")
        .doc(user.uid)
        .collection("months")
        .orderBy("ym", "desc")   // 문자열 정렬만으로 최신순 OK
        .limit(1)
        .get();

    if (snap.empty) {
        console.log("월간 데이터 없음");
        return;
    }

    const data = snap.docs[0].data();

    // 🔥 2) 기본 데이터 표시
    document.getElementById("totalAssets").innerText =
        data.totalAssets ? data.totalAssets.toLocaleString() : "-";

    document.getElementById("riskScore").innerText =
        data.riskScore ?? "-";

    document.getElementById("exerciseDays").innerText =
        data.exercise ?? "-";

    // 🔥 3) 리스크 메시지
    document.getElementById("riskMessage").innerText =
        getRiskMessage(data.riskScore);

    // 🔥 4) 목표 자산 시뮬레이션
    const targetAsset = data.totalAssets * 1.2; // 예: 20% 성장 목표
    document.getElementById("goalSim").innerText =
        `현재 자산 대비 20% 증가 목표는 ${targetAsset.toLocaleString()}원입니다.`;

    // 🔥 5) 자산 차트
    drawAssetPieChart({
        realestate: data.realestate,
        stocks: data.stocks,
        cash: data.cash,
        other: data.other
    });

    // 🔥 6) 레이더 차트
    drawRadarChart({
        exercise: data.exercise,
        sleep: data.sleep,
        stress: data.stress
    });

    console.log("대시보드 로딩 완료:", data);
}


// Chart.js Pie Chart
function drawAssetPieChart(data) {
    const ctx = document.getElementById("assetChart").getContext("2d");

    if (window.assetChartInstance) {
        window.assetChartInstance.destroy();
    }

    window.assetChartInstance = new Chart(ctx, {
        type: "pie",
        data: {
            labels: ["부동산", "주식", "현금", "기타"],
            datasets: [{
                data: [
                    data.realestate,
                    data.stocks,
                    data.cash,
                    data.other
                ],
                backgroundColor: [
                    "#4e79a7",  // 부동산
                    "#f28e2b",  // 주식
                    "#e15759",  // 현금
                    "#76b7b2"   // 기타
                ],
                borderWidth: 2,
                borderColor: "#ffffff"
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: "#fff",
                        font: { size: 14 }
                    }
                }
            }
        }
    });
}

function loadRiskTrend() {
  const user = firebase.auth().currentUser;
  if (!user) return;
  const pred = predictNextYearRisk(scores);
  document.getElementById("predictRisk").innerText = `예상 점수: ${pred}`;


  db.collection("users")
    .doc(user.uid)
    .collection("months")
    .orderBy("ym", "asc")
    .get()
    .then(snap => {
      const labels = [];
      const scores = [];

      snap.forEach(doc => {
        labels.push(doc.id);
        scores.push(doc.data().riskScore);
      });

      drawRiskLineChart(labels, scores);
    });
}

function drawRiskLineChart(labels, scores) {
  const ctx = document.getElementById("riskTrendChart").getContext("2d");

  new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "월별 리스크 점수",
        data: scores,
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59,130,246,0.3)",
        tension: 0.3
      }]
    }
  });
}
function getRiskMessage(score) {
  if (score < 30) return "매우 안정적인 상태입니다. 현 수준 유지가 중요합니다.";
  if (score < 50) return "대체로 안정적입니다. 포트폴리오 분산을 신경쓰면 좋습니다.";
  if (score < 70) return "중간 수준의 리스크입니다. 자산 비중 조정이 필요합니다.";
  if (score < 85) return "리스크가 높습니다. 주식 비중이 과도할 수 있습니다.";
  return "⚠️ 매우 높은 리스크입니다! 즉각적인 자산 구조 조정이 필요합니다.";
}
function calculateInvestmentPlan(currentAssets, targetAssets, annualReturn = 0.05) {
  let years = 0;
  let value = currentAssets;

  while (value < targetAssets) {
    value *= (1 + annualReturn);
    years++;
  }

  return years;
}
function drawRadarChart(data) {
  const ctx = document.getElementById("radarChart").getContext("2d");

  new Chart(ctx, {
    type: "radar",
    data: {
      labels: ["운동", "수면", "스트레스", "주식비중", "총자산 안정도"],
      datasets: [{
        label: "리스크 프로파일",
        data: [
          data.exercise,
          data.sleep,
          10 - data.stress,
          (data.stocks / data.totalAssets) * 10,
          Math.min(10, data.totalAssets / 100000)
        ],
        borderColor: "rgba(255,99,132,0.8)",
        backgroundColor: "rgba(255,99,132,0.25)",
        pointBackgroundColor: "#fff",

      }]
    }
  });
}
function predictNextYearRisk(scores) {
  if (scores.length < 3) return "데이터 부족";

  const last = scores[scores.length - 1];
  const prev = scores[scores.length - 3];

  const trend = (last - prev) / 3;
  const predicted = last + (trend * 12);

  return Math.round(Math.max(1, Math.min(predicted, 100)));
}

// 대시보드 데이터 불러온 후 차트 실행
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        loadDashboard();
        loadRiskTrend();   // ✔ 데이터를 다 불러온 후 실행됨
    }
});

