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

        // TODO: 여기서 카드 UI 업데이트 / 파이차트 데이터 반영
        updateDashboardUI(data);
      });
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
