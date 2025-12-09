// ---------------------------
// Firebase Authentication Logic
// ---------------------------

// 이메일 로그인
function loginEmail() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("이메일과 비밀번호를 입력해주세요.");
    return;
  }

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(() => {
      window.location.href = "dashboard.html";
    })
    .catch(error => {
      alert("로그인 실패: " + error.message);
    });
}

// 회원가입
function signUpEmail() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("이메일과 비밀번호를 입력해주세요.");
    return;
  }

  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(userCredential => {
      const user = userCredential.user;

      // Firestore에 기본 profile 문서 생성
      db.collection("users").doc(user.uid).collection("profile").doc("info").set({
        createdAt: new Date(),
        email: user.email
      });

      alert("회원가입 성공! 자동 로그인됩니다.");
      window.location.href = "dashboard.html";
    })
    .catch(error => {
      alert("회원가입 실패: " + error.message);
    });
}

// Google 로그인
function loginWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();

  firebase.auth().signInWithPopup(provider)
    .then(() => {
      window.location.href = "dashboard.html";
    })
    .catch(error => {
      alert("구글 로그인 실패: " + error.message);
    });
}

// 로그아웃
function logoutUser() {
  firebase.auth().signOut().then(() => {
    window.location.href = "index.html";
  });
}

// 인증 상태 확인 (보안)
firebase.auth().onAuthStateChanged(user => {
  const securePages = ["dashboard.html", "input.html"];

  const currentPage = window.location.pathname.split("/").pop();

  if (!user && securePages.includes(currentPage)) {
    window.location.href = "index.html"; 
  }
});
