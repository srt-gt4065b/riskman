// ------------------------------
// Firebase Auth 초기화
// ------------------------------
const provider = new firebase.auth.GoogleAuthProvider();

// 로그인 상태 감시
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    console.log("로그인됨:", user.email);
  } else {
    console.log("로그아웃 상태");
  }
});

// ------------------------------
// 1) Google 로그인
// ------------------------------
function loginWithGoogle() {
  firebase.auth().signInWithPopup(provider)
    .then((result) => {
      console.log("Google 로그인 성공:", result.user.email);
      window.location.href = "dashboard.html";
    })
    .catch((error) => {
      alert("로그인 실패: " + error.message);
    });
}

// ------------------------------
// 2) Email 회원가입
// ------------------------------
function signUpEmail() {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;

  firebase.auth().createUserWithEmailAndPassword(email, pass)
    .then((userCredential) => {
      alert("회원가입 완료!");
      window.location.href = "dashboard.html";
    })
    .catch((error) => {
      alert("회원가입 오류: " + error.message);
    });
}

// ------------------------------
// 3) Email 로그인
// ------------------------------
function loginEmail() {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;

  firebase.auth().signInWithEmailAndPassword(email, pass)
    .then((userCredential) => {
      window.location.href = "dashboard.html";
    })
    .catch((error) => {
      alert("로그인 오류: " + error.message);
    });
}

// ------------------------------
// 4) 로그아웃
// ------------------------------
function logout() {
  firebase.auth().signOut().then(() => {
    window.location.href = "index.html";
  });
}

// ------------------------------
// 5) 보호 페이지 접근 제한
// ------------------------------
function requireLogin() {
  firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
      alert("로그인이 필요합니다.");
      window.location.href = "index.html";
    }
  });
}
