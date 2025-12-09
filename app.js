// -----------------------------------------
// RiskMan – Firestore Logic (완성본)
// -----------------------------------------

// Save monthly data
function saveMonthlyData() {
  const user = firebase.auth().currentUser;
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

  db.collection("users")
    .doc(user.uid)
    .collection("months")
    .doc(ym)
    .set({
      ym: ym,
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
    })
    .then(() => {
      alert("저장되었습니다!");
      window.location.href = "dashboard.html";
    })
    .catch((err) => alert("저장 오류: " + err.message));
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

// Load dashboard data
function loadDashboard() {
  const user = firebase.auth().currentUser;
  if (!user) return;

  db.collection("users")
    .doc(user.uid)
    .collection("months")
    .orderBy("savedAt", "desc")
    .limit(1)
    .get()
    .then((snap) => {
      if (snap.empty) return;

      const data = snap.docs[0].data();

      document.getElementById("totalAssets").innerText = data.totalAssets.toLocaleString();
      document.getElementById("riskScore").innerText = data.riskScore;
      document.getElementById("exerciseDays").innerText = data.exercise;

      drawAssetPieChart(data);
    });
}

// Chart.js Pie Chart
function drawAssetPieChart(data) {
  const ctx = document.getElementById("assetChart").getContext("2d");

  new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["부동산", "주식", "현금", "기타"],
      datasets: [
        {
          data: [data.realestate, data.stocks, data.cash, data.other],
          backgroundColor: ["#4FC3F7", "#29B6F6", "#0288D1", "#0277BD"],
        },
      ],
    }
  });
}
function loadRiskTrend() {
  const user = firebase.auth().currentUser;
  if (!user) return;

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
