// ------------------------------------------
// Firestore 초기화
// ------------------------------------------
const db = firebase.firestore();

// ------------------------------------------
// 로그인된 사용자 정보 가져오기
// ------------------------------------------
function getCurrentUser(callback) {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      callback(user);
    } else {
      alert("로그인이 필요합니다.");
      window.location.href = "index.html";
    }
  });
}

// ------------------------------------------
// 1) 프로필 자동 생성
// ------------------------------------------
function createUserProfileIfNeeded(user) {
  const userRef = db.collection("users").doc(user.uid).collection("profile").doc("info");

  userRef.get().then((doc) => {
    if (!doc.exists) {
      userRef.set({
        email: user.email,
        createdAt: new Date(),
        displayName: user.displayName || "",
        provider: user.providerData[0].providerId
      });

      console.log("프로필 생성 완료");
    } else {
      console.log("프로필 이미 존재함");
    }
  });
}

// ------------------------------------------
// 2) 월별 데이터 저장
// ------------------------------------------
function saveMonthlyData(uid, data) {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  db.collection("users")
    .doc(uid)
    .collection("months")
    .doc(yearMonth)
    .set({
      ...data,
      savedAt: new Date()
    }, { merge: true })
    .then(() => {
      alert("월 리스크 데이터 저장 완료!");
    })
    .catch((err) => {
      console.error("월 저장 오류:", err);
    });
}

// ------------------------------------------
// 3) 월 입력 페이지에서 저장 버튼 클릭 시
// ------------------------------------------
function submitMonthlyForm() {
  getCurrentUser((user) => {
    const tesla = Number(document.getElementById("tesla").value);
    const freeCash = Number(document.getElementById("freeCash").value);
    const health = document.getElementById("health").value;
    const runKm = Number(document.getElementById("runKm").value);

    const data = {
      tesla_percent: tesla,
      free_cash: freeCash,
      health_flag: health,
      running_km: runKm
    };

    saveMonthlyData(user.uid, data);
  });
}

// ------------------------------------------
// 4) 대시보드에서 월별 데이터 읽기
// ------------------------------------------
function loadDashboardData() {
  getCurrentUser((user) => {
    const monthsRef = db.collection("users").doc(user.uid).collection("months");

    monthsRef.orderBy("savedAt", "desc").limit(1).get()
      .then((snapshot) => {
        if (snapshot.empty) {
          console.log("월별 기록 없음");
          return;
        }

        const data = snapshot.docs[0].data();
        console.log("대시보드 데이터:", data);

        updateDashboardUI(data);   // UI 업데이트
      });

    drawLineChart(user.uid);       // ★ then() 블록 바깥에서 호출
  });
}


// ------------------------------------------
// 5) 대시보드 업데이트 함수 기본 틀
// ------------------------------------------
function updateDashboardUI(data) {
  document.getElementById("marketScore").innerText = data.tesla_percent + "%";
  document.getElementById("healthStatus").innerText = data.health_flag;
  // 이후 스코어 계산/파이차트 반영은 3단계에서 추가
}

// ----------------------------------
// 6) 리스크 점수 계산
// ----------------------------------
function calculateScores(data) {
  const tesla = data.tesla_percent || 0;
  const free = data.free_cash || 0;
  const health = data.health_flag || "-";
  const km = data.running_km || 0;

  const marketScore = Math.max(0, 100 - tesla); // 테슬라 비중 높을수록 점수 낮음
  const financeScore = free >= 100 ? 100 : free; // 여유자금 100 이상이면 100점
  const healthScore = health === "좋음" ? 100 : health === "보통" ? 70 : 40;
  const runScore = Math.min(100, km * 3); // 달린 km × 3 (최대 100점)

  const total = Math.round((marketScore + financeScore + healthScore + runScore) / 4);

  return { marketScore, financeScore, healthScore, runScore, total };
}

// ----------------------------------
// 7) UI 업데이트
// ----------------------------------
function updateDashboardUI(data) {
  const scores = calculateScores(data);

  document.getElementById("marketScore").innerText = scores.marketScore + "점";
  document.getElementById("financeScore").innerText = scores.financeScore + "점";
  document.getElementById("healthScore").innerText = scores.healthScore + "점";
  document.getElementById("runScore").innerText = scores.runScore + "점";
  document.getElementById("totalScore").innerText = scores.total + "점";

  document.getElementById("alertText").innerText =
    data.tesla_percent > 70 ? "테슬라 비중 과다!" : "안정적입니다.";

  drawAssetChart();
}

// ----------------------------------
// 8) 자산 배분 차트
// ----------------------------------
function drawAssetChart() {
  const ctx = document.getElementById("assetChart").getContext("2d");

  new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["부동산", "주식", "현금"],
      datasets: [{
        data: [80, 15, 5],
        backgroundColor: ["#00E5FF", "#0077FF", "#00AA88"]
      }]
    },
    options: {
      responsive: true,
    }
  });
}

// ----------------------------------
// 9) 월별 리스크 점수 라인 차트
// ----------------------------------
function drawLineChart(uid) {
  const monthsRef = db.collection("users").doc(uid).collection("months");

  monthsRef.orderBy("savedAt", "asc").get()
    .then((snapshot) => {
      const labels = [];
      const values = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        const scores = calculateScores(data);

        labels.push(doc.id);  // YYYY-MM
        values.push(scores.total);
      });

      const ctx = document.getElementById("lineChart").getContext("2d");

      new Chart(ctx, {
        type: "line",
        data: {
          labels: labels,
          datasets: [{
            label: "리스크 점수",
            data: values,
            borderColor: "#00E5FF",
            backgroundColor: "rgba(0, 229, 255, 0.3)",
            borderWidth: 2,
            pointRadius: 4,
            tension: 0.2
          }]
        },
        options: {
          scales: {
            y: {
              min: 0,
              max: 100,
              beginAtZero: true
            }
          }
        }
      });
    });
}
