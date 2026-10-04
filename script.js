"use strict";

/* =========================================================
   L'AURA STUDIO
   MAIN JAVASCRIPT
   ========================================================= */


/* =========================================================
   01. HEADER / MENU
========================================================= */

const header = document.getElementById("header");
const nav = document.getElementById("nav");
const menuToggle = document.getElementById("menuToggle");
const year = document.getElementById("year");

if (year) {
  year.textContent = new Date().getFullYear();
}

if (menuToggle && nav) {
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-controls', 'nav');
  menuToggle.addEventListener("click", () => {
    nav.classList.toggle("open");
    menuToggle.setAttribute('aria-expanded', String(nav.classList.contains('open')));
    menuToggle.setAttribute('aria-label', nav.classList.contains('open') ? 'Đóng menu' : 'Mở menu');

    menuToggle.textContent =
      nav.classList.contains("open")
        ? "×"
        : "☰";
  });
}

document.querySelectorAll(".nav a").forEach(link => {
  link.addEventListener("click", () => {
    if (nav) nav.classList.remove("open");
    if (menuToggle) { menuToggle.textContent = "☰"; menuToggle.setAttribute('aria-expanded', 'false'); }
  });
});

document.querySelectorAll('[data-mobile-open]').forEach(button => {
  button.addEventListener('click', () => {
    nav?.classList.remove('open');
    if (menuToggle) { menuToggle.textContent = '☰'; menuToggle.setAttribute('aria-expanded', 'false'); }
    document.getElementById(button.dataset.mobileOpen)?.click();
  });
});

if (header) {
  let headerScrollFrame = 0;
  let headerWasScrolled = window.scrollY > 30;
  header.classList.toggle("scrolled", headerWasScrolled);
  window.addEventListener("scroll", () => {
    if (headerScrollFrame) return;
    headerScrollFrame = requestAnimationFrame(() => {
      headerScrollFrame = 0;
      const isScrolled = window.scrollY > 30;
      if (isScrolled !== headerWasScrolled) {
        header.classList.toggle("scrolled", isScrolled);
        headerWasScrolled = isScrolled;
      }
    });
  }, { passive: true });
}


/* =========================================================
   02. REVEAL ANIMATION
========================================================= */

document.querySelectorAll('.intro-grid, .section-heading, .concept-heading, .concept-grid article, .package-detail, .portfolio-head, .gallery-card, .inner-card, .inner-section-head').forEach((item,index) => {
  item.classList.add('reveal');
  item.style.setProperty('--reveal-delay', `${(index % 3) * 70}ms`);
});

const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {

  const observer =
    new IntersectionObserver(
      entries => {

        entries.forEach(entry => {

          if (entry.isIntersecting) {

            entry.target.classList.add(
              "visible"
            );

            observer.unobserve(
              entry.target
            );
          }

        });

      },
      {
        threshold: 0.12
      }
    );

  revealItems.forEach(item => {
    observer.observe(item);
  });

} else {

  revealItems.forEach(item => {
    item.classList.add("visible");
  });

}


/* =========================================================
   03. PORTFOLIO LIGHTBOX
========================================================= */

const imageModal =
  document.getElementById("imageModal");

const modalImage =
  document.getElementById("modalImage");

const modalClose =
  document.getElementById("modalClose");


function openImageModal(image) {

  if (!imageModal || !modalImage) {
    return;
  }

  modalImage.src = image;

  imageModal.classList.add("open");

  document.body.classList.add(
    "lightbox-open"
  );
}


function closeImageModal() {

  if (!imageModal) {
    return;
  }

  imageModal.classList.remove("open");

  document.body.classList.remove(
    "lightbox-open"
  );

  if (modalImage) {
    setTimeout(() => {
      modalImage.src = "";
    }, 200);
  }
}


document
  .querySelectorAll(".gallery-card")
  .forEach(card => {

    card.addEventListener("click", () => {

      const image =
        card.dataset.image;

      if (image) {
        openImageModal(image);
      }

    });

  });


if (modalClose) {
  modalClose.addEventListener(
    "click",
    closeImageModal
  );
}


if (imageModal) {

  imageModal.addEventListener(
    "click",
    event => {

      if (
        event.target === imageModal
      ) {
        closeImageModal();
      }

    }
  );

}


/* =========================================================
   04. BOOKING
========================================================= */

const bookingForm =
  document.getElementById(
    "bookingForm"
  );

const formNote =
  document.getElementById(
    "formNote"
  );

const bookingServiceSelect =
  bookingForm?.querySelector(
    'select[name="service"]'
  );

const requestedBookingService =
  new URLSearchParams(location.search)
    .get("service");

if (
  bookingServiceSelect &&
  requestedBookingService &&
  [...bookingServiceSelect.options]
    .some(option => option.value === requestedBookingService)
) {
  bookingServiceSelect.value = requestedBookingService;
}

document
  .querySelectorAll("[data-booking-service]")
  .forEach(link => {
    link.addEventListener("click", () => {
      const service =
        link.dataset.bookingService;

      if (bookingServiceSelect && service) {
        bookingServiceSelect.value = service;
      }
    });
  });


function getContacts() {

  try {

    const data =
      localStorage.getItem(
        "ddStudioContacts"
      );

    if (!data) {
      return [];
    }

    const contacts =
      JSON.parse(data);

    return Array.isArray(contacts)
      ? contacts
      : [];

  } catch (error) {

    console.error(
      "Không thể đọc contacts:",
      error
    );

    return [];
  }
}


function saveContacts(contacts) {

  localStorage.setItem(
    "ddStudioContacts",
    JSON.stringify(contacts)
  );
}


if (bookingForm) {

  bookingForm.addEventListener(
    "submit",
    event => {

      event.preventDefault();

      const data =
        new FormData(bookingForm);

      const contact = {

        id:
          "contact-" +
          Date.now(),

        name:
          String(
            data.get("name") || ""
          ).trim(),

        phone:
          String(
            data.get("phone") || ""
          ).trim(),

        service:
          String(
            data.get("service") || ""
          ).trim(),

        date:
          String(
            data.get("date") || ""
          ).trim(),

        message:
          String(
            data.get("message") || ""
          ).trim(),

        createdAt:
          new Date().toLocaleString(
            "vi-VN"
          ),

        status: "new"
      };


      const contacts =
        getContacts();

      contacts.unshift(contact);

      saveContacts(contacts);


      if (formNote) {

        formNote.textContent =
          `Cảm ơn ${contact.name}! Yêu cầu đã được gửi vào hộp thư Admin. Studio sẽ liên hệ lại sớm.`;

      }


      bookingForm.reset();

    }
  );

}


/* =========================================================
   05. SMOOTH SCROLL
========================================================= */

document
  .querySelectorAll('a[href^="#"]')
  .forEach(anchor => {

    anchor.addEventListener(
      "click",
      function (event) {

        const href =
          this.getAttribute("href");

        if (
          !href ||
          href === "#"
        ) {
          return;
        }

        const target =
          document.querySelector(href);

        if (!target) {
          return;
        }

        event.preventDefault();

        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

      }
    );

  });


/* =========================================================
   06. BLOG CMS
========================================================= */

const DEFAULT_POSTS = [

  {
    id: "post-1",

    title:
      "5 nguyên tắc tạo ánh sáng chân dung có chiều sâu",

    category:
      "Photography",

    image:
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=1200&q=85",

    excerpt:
      "Từ hướng sáng, kích thước nguồn sáng đến khoảng cách giữa đèn và chủ thể.",

    content:
      `Ánh sáng là một trong những yếu tố quan trọng nhất quyết định cảm xúc của một bức chân dung.

1. Xác định hướng sáng trước khi chọn modifier.

2. Quan sát vùng highlight và shadow trên khuôn mặt.

3. Điều chỉnh kích thước nguồn sáng để kiểm soát độ chuyển.

4. Kiểm soát khoảng cách đèn với chủ thể.

5. Luôn thử nghiệm bằng chính hình ảnh trên màn hình máy ảnh.

Một setup tốt không nhất thiết phải nhiều đèn. Quan trọng là bạn biết mỗi nguồn sáng đang làm nhiệm vụ gì.`,

    date: "29/09/2026"
  },

  {
    id: "post-2",

    title:
      "Một ngày phía sau camera tại D+Đ Studio",

    category:
      "Behind the scenes",

    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=85",

    excerpt:
      "Từ lúc chuẩn bị concept, set đèn đến những khung hình cuối cùng.",

    content:
      `Một buổi chụp tốt bắt đầu từ trước khi mẫu bước vào studio.

Ekip kiểm tra moodboard, camera, lens, trigger, đèn và modifier.

Sau đó chúng tôi dựng ánh sáng thử, kiểm tra exposure và thống nhất direction.

Trong lúc chụp, photographer tập trung vào ánh sáng và khoảnh khắc; support theo dõi thiết bị, thay đổi modifier và giữ workflow ổn định.`,

    date: "25/09/2026"
  },

  {
    id: "post-3",

    title:
      "Studio nhỏ cần gì để bắt đầu?",

    category:
      "Studio",

    image:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=85",

    excerpt:
      "Không gian, ánh sáng, phông nền và cách ưu tiên ngân sách khi bắt đầu.",

    content:
      `Bạn không cần một studio quá lớn để bắt đầu.

Hãy ưu tiên một không gian có trần đủ cao, điện ổn định, khu vực thay đồ và khoảng cách hợp lý giữa background, chủ thể và đèn.

Sau đó đầu tư theo thứ tự:

Nguồn sáng ổn định → modifier → background → camera/lens → thiết bị phụ trợ.`,

    date: "20/09/2026"
  }

];


function getPosts() {

  if (window.LAURA_SUPABASE?.publishableKey && !String(window.LAURA_SUPABASE.publishableKey).includes('YOUR_') && !window.lauraPostsLoaded) return [];

  try {

    const saved =
      localStorage.getItem(
        "ddStudioPosts"
      );

    if (!saved) {

      localStorage.setItem(
        "ddStudioPosts",
        JSON.stringify(
          DEFAULT_POSTS
        )
      );

      return DEFAULT_POSTS;
    }

    const posts =
      JSON.parse(saved);

    return Array.isArray(posts)
      ? posts
      : DEFAULT_POSTS;

  } catch (error) {

    return DEFAULT_POSTS;
  }
}


function savePosts(posts) {

  localStorage.setItem(
    "ddStudioPosts",
    JSON.stringify(posts)
  );
}


/* =========================================================
   07. ESCAPE HTML
========================================================= */

function escapeHTML(value) {

  return String(
    value ?? ""
  ).replace(
    /[&<>"']/g,
    character => {

      const map = {

        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"

      };

      return map[character];
    }
  );
}


/* =========================================================
   08. RENDER BLOG
========================================================= */

function renderBlog(
  category = "all"
) {

  const grid =
    document.getElementById(
      "blogGrid"
    );

  const empty =
    document.getElementById(
      "blogEmpty"
    );

  if (!grid) {
    return;
  }

  const posts =
    getPosts().filter(post => {

      return (
        category === "all" ||
        post.category === category
      );

    });


  grid.innerHTML = "";


  if (empty) {

    empty.hidden =
      posts.length > 0;

  }


  posts.forEach(post => {

    const card =
      document.createElement(
        "article"
      );

    card.className =
      "blog-card";


    card.innerHTML = `

      <div class="blog-card-image">

        <img
          src="${escapeHTML(post.image)}"
          alt="${escapeHTML(post.title)}"
          loading="lazy"
        >

      </div>

      <div class="blog-card-body">

        <div class="blog-card-meta">

          <span>
            ${escapeHTML(post.category)}
          </span>

          <span>
            ${escapeHTML(post.date)}
          </span>

        </div>

        <h3>
          ${escapeHTML(post.title)}
        </h3>

        <p>
          ${escapeHTML(post.excerpt)}
        </p>

        <span class="blog-card-more">
          Đọc bài viết ↗
        </span>

      </div>

    `;


    card.addEventListener(
      "click",
      () => openArticle(post)
    );


    grid.appendChild(card);

  });

}


/* =========================================================
   09. ARTICLE + COMMENTS
========================================================= */

const articleModal =
  document.getElementById(
    "articleModal"
  );

const articleClose =
  document.getElementById(
    "articleClose"
  );

let currentArticleId = null;


function openArticle(post) {

  if (!post) {
    return;
  }


  currentArticleId =
    post.id;


  const articleImage =
    document.getElementById(
      "articleImage"
    );

  const articleCategory =
    document.getElementById(
      "articleCategory"
    );

  const articleTitle =
    document.getElementById(
      "articleTitle"
    );

  const articleDate =
    document.getElementById(
      "articleDate"
    );

  const articleContent =
    document.getElementById(
      "articleContent"
    );


  if (articleImage) {

    articleImage.src =
      post.image || "";

    articleImage.alt =
      post.title || "";

  }


  if (articleCategory) {

    articleCategory.textContent =
      post.category || "";

  }


  if (articleTitle) {

    articleTitle.textContent =
      post.title || "";

  }


  if (articleDate) {

    articleDate.textContent =
      post.date || "";

  }


  if (articleContent) {

    articleContent.textContent =
      post.content || "";

  }


  renderComments(
    currentArticleId
  );

  updateCommentUI();


  if (articleModal) {

    articleModal.classList.add(
      "open"
    );

    document.body.classList.add(
      "lightbox-open"
    );

  }

}


if (articleClose) {

  articleClose.addEventListener(
    "click",
    closeArticle
  );

}


function closeArticle() {

  if (!articleModal) {
    return;
  }

  articleModal.classList.remove(
    "open"
  );

  document.body.classList.remove(
    "lightbox-open"
  );

  currentArticleId = null;
}


if (articleModal) {

  articleModal.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        articleModal
      ) {
        closeArticle();
      }

    }
  );

}


/* =========================================================
   10. BLOG FILTER
========================================================= */

document
  .querySelectorAll(".filter-btn")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(
            ".filter-btn"
          )
          .forEach(btn => {

            btn.classList.remove(
              "active"
            );

          });


        button.classList.add(
          "active"
        );


        renderBlog(
          button.dataset.category ||
          "all"
        );

      }
    );

  });


/* =========================================================
   11. ACCOUNT SYSTEM
========================================================= */

const USERS_KEY =
  "ddStudioUsers";

const CURRENT_USER_KEY =
  "ddCurrentUser";


function getUsers() {

  try {

    const saved =
      localStorage.getItem(
        USERS_KEY
      );

    if (!saved) {
      return [];
    }

    const users =
      JSON.parse(saved);

    return Array.isArray(users)
      ? users
      : [];

  } catch (error) {

    console.error(
      "Không thể đọc tài khoản:",
      error
    );

    return [];
  }
}


function saveUsers(users) {

  localStorage.setItem(
    USERS_KEY,
    JSON.stringify(users)
  );
}


function getCurrentUser() {

  try {

    const saved =
      sessionStorage.getItem(
        CURRENT_USER_KEY
      );

    if (!saved) {
      return null;
    }

    return JSON.parse(saved);

  } catch (error) {

    return null;
  }
}


function setCurrentUser(user) {

  sessionStorage.setItem(
    CURRENT_USER_KEY,
    JSON.stringify({

      id: user.id,

      name: user.name,

      email: user.email,

      createdAt:
        user.createdAt

    })
  );
}


function logoutUserAccount() {

  sessionStorage.removeItem(
    CURRENT_USER_KEY
  );

}


/* =========================================================
   12. ACCOUNT ELEMENTS
========================================================= */

const accountOpen =
  document.getElementById(
    "accountOpen"
  );

const accountModal =
  document.getElementById(
    "accountModal"
  );

const accountClose =
  document.getElementById(
    "accountClose"
  );


const loginView =
  document.getElementById(
    "loginView"
  );

const registerView =
  document.getElementById(
    "registerView"
  );

const profileView =
  document.getElementById(
    "profileView"
  );


const loginForm =
  document.getElementById(
    "loginForm"
  );

const registerForm =
  document.getElementById(
    "registerForm"
  );


const loginEmail =
  document.getElementById(
    "loginEmail"
  );

const loginPassword =
  document.getElementById(
    "loginPassword"
  );

const loginError =
  document.getElementById(
    "loginError"
  );


const registerName =
  document.getElementById(
    "registerName"
  );

const registerEmail =
  document.getElementById(
    "registerEmail"
  );

const registerPassword =
  document.getElementById(
    "registerPassword"
  );

const registerError =
  document.getElementById(
    "registerError"
  );


const showRegister =
  document.getElementById(
    "showRegister"
  );

const showLogin =
  document.getElementById(
    "showLogin"
  );


const profileName =
  document.getElementById(
    "profileName"
  );

const profileEmail =
  document.getElementById(
    "profileEmail"
  );

const profileDate =
  document.getElementById(
    "profileDate"
  );

const logoutButton =
  document.getElementById(
    "logoutUser"
  );


/* =========================================================
   13. ACCOUNT VIEWS
========================================================= */

function hideAccountViews() {

  if (loginView) {
    loginView.hidden = true;
  }

  if (registerView) {
    registerView.hidden = true;
  }

  if (profileView) {
    profileView.hidden = true;
  }

}


function showAccountLogin() {

  hideAccountViews();

  if (loginView) {
    loginView.hidden = false;
  }

  if (loginError) {
    loginError.textContent = "";
  }

}


function showAccountRegister() {

  hideAccountViews();

  if (registerView) {
    registerView.hidden = false;
  }

  if (registerError) {
    registerError.textContent = "";
  }

}


function showAccountProfile() {

  const user =
    getCurrentUser();


  if (!user) {

    showAccountLogin();

    return;
  }


  hideAccountViews();


  if (profileView) {
    profileView.hidden = false;
  }


  if (profileName) {

    profileName.textContent =
      user.name;

  }


  if (profileEmail) {

    profileEmail.textContent =
      user.email;

  }


  if (profileDate) {

    profileDate.textContent =
      user.createdAt
        ? new Date(
            user.createdAt
          ).toLocaleDateString(
            "vi-VN"
          )
        : "";

  }

}


/* =========================================================
   14. ACCOUNT MODAL
========================================================= */

function openAccountModal() {

  if (!accountModal) {

    console.error(
      "Không tìm thấy #accountModal"
    );

    return;
  }


  accountModal.classList.add(
    "open"
  );


  document.body.classList.add(
    "lightbox-open"
  );


  const user =
    getCurrentUser();


  if (user) {

    showAccountProfile();

  } else {

    showAccountLogin();

  }

}


function closeAccountModal() {

  if (!accountModal) {
    return;
  }


  accountModal.classList.remove(
    "open"
  );


  document.body.classList.remove(
    "lightbox-open"
  );

}


if (accountOpen) {

  accountOpen.addEventListener(
    "click",
    event => {

      event.preventDefault();

      openAccountModal();

    }
  );

}


if (accountClose) {

  accountClose.addEventListener(
    "click",
    closeAccountModal
  );

}


if (accountModal) {

  accountModal.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        accountModal
      ) {

        closeAccountModal();

      }

    }
  );

}


/* =========================================================
   15. SWITCH LOGIN / REGISTER
========================================================= */

if (showRegister) {

  showRegister.addEventListener(
    "click",
    event => {

      event.preventDefault();

      showAccountRegister();

    }
  );

}


if (showLogin) {

  showLogin.addEventListener(
    "click",
    event => {

      event.preventDefault();

      showAccountLogin();

    }
  );

}


/* =========================================================
   16. REGISTER ACCOUNT
========================================================= */

if (registerForm) {

  registerForm.addEventListener(
    "submit",
    event => {

      event.preventDefault();


      const name =
        registerName
          ? registerName.value.trim()
          : "";


      const email =
        registerEmail
          ? registerEmail.value
              .trim()
              .toLowerCase()
          : "";


      const password =
        registerPassword
          ? registerPassword.value
          : "";


      if (registerError) {
        registerError.textContent = "";
      }


      if (name.length < 2) {

        if (registerError) {

          registerError.textContent =
            "Vui lòng nhập họ và tên.";

        }

        return;
      }


      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


      if (!emailRegex.test(email)) {

        if (registerError) {

          registerError.textContent =
            "Email không hợp lệ.";

        }

        return;
      }


      if (password.length < 6) {

        if (registerError) {

          registerError.textContent =
            "Mật khẩu phải có ít nhất 6 ký tự.";

        }

        return;
      }


      const users =
        getUsers();


      const exists =
        users.some(user => {

          return (
            user.email &&
            user.email
              .toLowerCase() ===
            email
          );

        });


      if (exists) {

        if (registerError) {

          registerError.textContent =
            "Email này đã được đăng ký.";

        }

        return;
      }


      const newUser = {

        id:
          "user-" +
          Date.now() +
          "-" +
          Math.random()
            .toString(36)
            .substring(2, 8),

        name,

        email,

        password,

        createdAt:
          new Date().toISOString()

      };


      users.push(
        newUser
      );

      saveUsers(
        users
      );


      setCurrentUser(
        newUser
      );


      registerForm.reset();


      showAccountProfile();


      updateCommentUI();

    }
  );

}


/* =========================================================
   17. LOGIN ACCOUNT
========================================================= */

if (loginForm) {

  loginForm.addEventListener(
    "submit",
    event => {

      event.preventDefault();


      const email =
        loginEmail
          ? loginEmail.value
              .trim()
              .toLowerCase()
          : "";


      const password =
        loginPassword
          ? loginPassword.value
          : "";


      if (loginError) {
        loginError.textContent = "";
      }


      const users =
        getUsers();


      const user =
        users.find(item => {

          return (
            item.email &&
            item.email
              .toLowerCase() ===
            email &&
            item.password ===
            password
          );

        });


      if (!user) {

        if (loginError) {

          loginError.textContent =
            "Email hoặc mật khẩu không chính xác.";

        }

        return;
      }


      setCurrentUser(
        user
      );


      loginForm.reset();


      showAccountProfile();


      updateCommentUI();

    }
  );

}


/* =========================================================
   18. LOGOUT
========================================================= */

if (logoutButton) {

  logoutButton.addEventListener(
    "click",
    () => {

      logoutUserAccount();

      showAccountLogin();

      updateCommentUI();

      closeAccountModal();

    }
  );

}


/* =========================================================
   19. COMMENTS
========================================================= */

const COMMENTS_KEY =
  "ddStudioComments";


function getComments() {

  try {

    const saved =
      localStorage.getItem(
        COMMENTS_KEY
      );

    if (!saved) {
      return [];
    }

    const comments =
      JSON.parse(saved);

    return Array.isArray(comments)
      ? comments
      : [];

  } catch (error) {

    console.error(
      "Không thể đọc bình luận:",
      error
    );

    return [];
  }

}


function saveComments(
  comments
) {

  localStorage.setItem(
    COMMENTS_KEY,
    JSON.stringify(comments)
  );

}


const commentLoginMessage =
  document.getElementById(
    "commentLoginMessage"
  );

const commentForm =
  document.getElementById(
    "commentForm"
  );

const commentText =
  document.getElementById(
    "commentText"
  );

const commentUserName =
  document.getElementById(
    "commentUserName"
  );

const commentList =
  document.getElementById(
    "commentList"
  );


/* =========================================================
   20. COMMENT UI
========================================================= */

function updateCommentUI() {

  const user =
    getCurrentUser();


  if (commentLoginMessage) {

    commentLoginMessage.hidden =
      !!user;

  }


  if (commentForm) {

    commentForm.hidden =
      !user;

  }


  if (commentUserName) {

    commentUserName.textContent =
      user
        ? `Đang bình luận với tư cách: ${user.name}`
        : "";

  }


  if (currentArticleId) {

    renderComments(
      currentArticleId
    );

  }

}


/* =========================================================
   21. RENDER COMMENTS
========================================================= */

function renderComments(
  postId
) {

  if (!commentList) {
    return;
  }


  const comments =
    getComments()
      .filter(comment => {

        return (
          comment.postId ===
          postId
        );

      })
      .sort((a, b) => {

        return (
          new Date(a.createdAt) -
          new Date(b.createdAt)
        );

      });


  commentList.innerHTML = "";


  if (
    comments.length ===
    0
  ) {

    const empty =
      document.createElement(
        "div"
      );

    empty.className =
      "comment-empty";

    empty.textContent =
      "Chưa có bình luận nào. Hãy là người đầu tiên bình luận.";

    commentList.appendChild(
      empty
    );

    return;
  }


  const currentUser =
    getCurrentUser();


  comments.forEach(
    comment => {

      const item =
        document.createElement(
          "div"
        );

      item.className =
        "comment-item";


      const head =
        document.createElement(
          "div"
        );

      head.className =
        "comment-head";


      const author =
        document.createElement(
          "strong"
        );

      author.className =
        "comment-author";

      author.textContent =
        comment.name;


      const date =
        document.createElement(
          "span"
        );

      date.className =
        "comment-date";

      date.textContent =
        new Date(
          comment.createdAt
        ).toLocaleString(
          "vi-VN"
        );


      head.appendChild(
        author
      );

      head.appendChild(
        date
      );


      const body =
        document.createElement(
          "div"
        );

      body.className =
        "comment-body";

      body.textContent =
        comment.text;


      item.appendChild(
        head
      );

      item.appendChild(
        body
      );


      /* Xóa bình luận của chính mình */

      if (
        currentUser &&
        comment.userId ===
          currentUser.id
      ) {

        const deleteButton =
          document.createElement(
            "button"
          );

        deleteButton.type =
          "button";

        deleteButton.className =
          "comment-delete";

        deleteButton.textContent =
          "Xóa bình luận";


        deleteButton.addEventListener(
          "click",
          () => {

            deleteComment(
              comment.id
            );

          }
        );


        item.appendChild(
          deleteButton
        );

      }


      commentList.appendChild(
        item
      );

    }
  );

}


/* =========================================================
   22. SUBMIT COMMENT
========================================================= */

if (commentForm) {

  commentForm.addEventListener(
    "submit",
    event => {

      event.preventDefault();


      const user =
        getCurrentUser();


      if (!user) {

        openAccountModal();

        return;
      }


      if (!currentArticleId) {

        alert(
          "Không xác định được bài viết."
        );

        return;
      }


      const text =
        commentText
          ? commentText.value.trim()
          : "";


      if (!text) {

        alert(
          "Vui lòng nhập bình luận."
        );

        return;
      }


      if (text.length > 1000) {

        alert(
          "Bình luận tối đa 1000 ký tự."
        );

        return;
      }


      const comments =
        getComments();


      const comment = {

        id:
          "comment-" +
          Date.now() +
          "-" +
          Math.random()
            .toString(36)
            .substring(2, 8),

        postId:
          currentArticleId,

        userId:
          user.id,

        name:
          user.name,

        email:
          user.email,

        text,

        createdAt:
          new Date().toISOString()

      };


      comments.push(
        comment
      );


      saveComments(
        comments
      );


      if (commentText) {
        commentText.value = "";
      }


      renderComments(
        currentArticleId
      );

    }
  );

}


/* =========================================================
   23. DELETE COMMENT
========================================================= */

function deleteComment(
  commentId
) {

  const user =
    getCurrentUser();


  if (!user) {
    return;
  }


  const comments =
    getComments();


  const comment =
    comments.find(
      item =>
        item.id ===
        commentId
    );


  if (!comment) {
    return;
  }


  if (
    comment.userId !==
    user.id
  ) {

    return;
  }


  const confirmed =
    confirm(
      "Bạn có chắc muốn xóa bình luận này?"
    );


  if (!confirmed) {
    return;
  }


  const newComments =
    comments.filter(
      item =>
        item.id !==
        commentId
    );


  saveComments(
    newComments
  );


  renderComments(
    currentArticleId
  );

  if (typeof renderAdminComments === "function") {
    renderAdminComments();
  }

}


/* =========================================================
   24. CLICK "ĐĂNG NHẬP ĐỂ BÌNH LUẬN"
========================================================= */

if (commentLoginMessage) {

  commentLoginMessage.addEventListener(
    "click",
    () => {

      openAccountModal();

    }
  );

}


/* =========================================================
   25. ADMIN CMS
========================================================= */

const adminModal =
  document.getElementById(
    "adminModal"
  );

const adminOpen =
  document.getElementById(
    "adminOpen"
  );

const adminClose =
  document.getElementById(
    "adminClose"
  );

const adminLogin =
  document.getElementById(
    "adminLogin"
  );

const adminDashboard =
  document.getElementById(
    "adminDashboard"
  );

/*
 * Admin session helpers
 * Login trước đây lưu "1" nhưng một số chức năng lại kiểm tra "true",
 * khiến Admin bị báo hết phiên ngay cả khi vừa đăng nhập.
 */
const ADMIN_SESSION_KEY = "ddAdmin";

function isAdminAuthenticated() {
  const value = sessionStorage.getItem(ADMIN_SESSION_KEY);
  return value === "1" || value === "true";
}

function setAdminAuthenticated() {
  sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
}

function clearAdminAuthenticated() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

function openAdmin() {

  if (!adminModal) {
    return;
  }


  adminModal.classList.add(
    "open"
  );


  document.body.classList.add(
    "lightbox-open"
  );


  if (isAdminAuthenticated()) {

    showDashboard();

  } else {

    showAdminLogin();

  }

}


if (adminOpen) {

  adminOpen.addEventListener(
    "click",
    openAdmin
  );

}


if (adminClose) {

  adminClose.addEventListener(
    "click",
    closeAdmin
  );

}


function closeAdmin() {

  if (!adminModal) {
    return;
  }

  adminModal.classList.remove(
    "open"
  );

  document.body.classList.remove(
    "lightbox-open"
  );

}


if (adminModal) {

  adminModal.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        adminModal
      ) {

        closeAdmin();

      }

    }
  );

}


/* =========================================================
   26. ADMIN LOGIN
========================================================= */

const adminLoginForm =
  document.getElementById(
    "adminLoginForm"
  );


if (adminLoginForm) {

  adminLoginForm.addEventListener(
    "submit",
    event => {

      event.preventDefault();


      const email =
        document
          .getElementById(
            "adminEmail"
          )
          ?.value
          .trim();


      const password =
        document
          .getElementById(
            "adminPassword"
          )
          ?.value;


      const error =
        document.getElementById(
          "adminError"
        );


      /* backend-sync.js xử lý đăng nhập an toàn qua Supabase Auth. */
      if (error) {
        error.textContent =
          "Supabase chưa được cấu hình. Hãy kiểm tra file supabase-config.js.";
      }

    }
  );

}


/* =========================================================
   27. ADMIN DASHBOARD
========================================================= */

function showDashboard() {

  if (adminLogin) {
    adminLogin.hidden = true;
  }

  if (adminDashboard) {
    adminDashboard.hidden = false;
  }

  renderAdminPosts();

  renderAdminContacts();

  if (typeof renderAdminPortfolio === "function") {
    renderAdminPortfolio();
  }

  if (typeof renderAdminConcepts === "function") {
    renderAdminConcepts();
  }

  if (typeof renderAdminComments === "function") {
    renderAdminComments();
  }

  if (typeof renderAdminUsers === "function") {
    renderAdminUsers();
  }

}


function showAdminLogin() {

  if (adminLogin) {
    adminLogin.hidden = false;
  }

  if (adminDashboard) {
    adminDashboard.hidden = true;
  }

}


const adminLogout =
  document.getElementById(
    "adminLogout"
  );


if (adminLogout) {

  adminLogout.addEventListener(
    "click",
    () => {

      clearAdminAuthenticated();

      showAdminLogin();

    }
  );

}


/* =========================================================
   28. ADMIN TABS
========================================================= */

document
  .querySelectorAll(".admin-tab")
  .forEach(tab => {

    tab.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(
            ".admin-tab"
          )
          .forEach(item => {

            item.classList.remove(
              "active"
            );

          });


        document
          .querySelectorAll(
            ".admin-tab-content"
          )
          .forEach(item => {

            item.classList.remove(
              "active"
            );

          });


        tab.classList.add(
          "active"
        );


        const target =
          {

            posts:
              "adminPostsTab",

            new:
              "adminNewTab",

            contacts:
              "adminContactsTab",

            portfolio:
              "adminPortfolioTab",

            concepts:
              "adminConceptsTab",

            comments:
              "adminCommentsTab"

          }[
            tab.dataset.adminTab
          ];


        const targetElement =
          document.getElementById(
            target
          );


        if (targetElement) {

          targetElement.classList.add(
            "active"
          );

        }


        if (
          tab.dataset.adminTab ===
          "contacts"
        ) {

          renderAdminContacts();

        }

        if (
          tab.dataset.adminTab ===
          "comments"
        ) {
          renderAdminComments();
        }

      }
    );

  });


/* =========================================================
   29. ADMIN CONTACTS
========================================================= */

function renderAdminContacts() {

  const contacts =
    getContacts();


  const list =
    document.getElementById(
      "adminContactList"
    );

  const count =
    document.getElementById(
      "contactCount"
    );

  const newCount =
    document.getElementById(
      "newContactCount"
    );


  if (
    !list ||
    !count ||
    !newCount
  ) {
    return;
  }


  count.textContent =
    contacts.length;


  newCount.textContent =
    contacts.filter(
      contact =>
        contact.status ===
        "new"
    ).length;


  list.innerHTML = "";


  if (
    contacts.length ===
    0
  ) {

    list.innerHTML =
      `<p style="color:#777;padding:30px 0;">
        Chưa có yêu cầu liên hệ nào.
      </p>`;

    return;
  }


  contacts.forEach(
    contact => {

      const row =
        document.createElement(
          "div"
        );

      row.className =
        "admin-contact-row";


      row.innerHTML = `

        <div class="admin-contact-head">

          <div>

            <h4>
              ${escapeHTML(
                contact.name
              )}
            </h4>

            <small>
              ${escapeHTML(
                contact.createdAt
              )}
              ·
              ${
                contact.status ===
                "new"
                  ? "Chưa xử lý"
                  : "Đã xem"
              }
            </small>

          </div>

        </div>


        <div class="admin-contact-info">

          <div>
            <strong>SĐT:</strong>
            ${escapeHTML(
              contact.phone
            )}
          </div>

          <div>
            <strong>Dịch vụ:</strong>
            ${escapeHTML(
              contact.service
            )}
          </div>

          <div>
            <strong>Ngày:</strong>
            ${escapeHTML(
              contact.date ||
              "Chưa chọn"
            )}
          </div>

        </div>


        <div class="admin-contact-message">

          <strong>Nội dung:</strong><br>

          ${escapeHTML(
            contact.message ||
            "Không có nội dung thêm."
          )}

        </div>


        <div class="admin-contact-actions">

          <button
            class="contact-new"
            data-read="${contact.id}"
          >
            ${
              contact.status ===
              "new"
                ? "Đánh dấu đã xem"
                : "Đã xem"
            }
          </button>

          <button
            data-delete-contact="${contact.id}"
          >
            Xóa
          </button>

        </div>

      `;


      const readButton =
        row.querySelector(
          "[data-read]"
        );


      if (readButton) {

        readButton.addEventListener(
          "click",
          () => {

            const updated =
              getContacts()
                .map(item => {

                  if (
                    item.id ===
                    contact.id
                  ) {

                    return {
                      ...item,
                      status: "read"
                    };

                  }

                  return item;

                });


            saveContacts(
              updated
            );


            renderAdminContacts();

          }
        );

      }


      const deleteButton =
        row.querySelector(
          "[data-delete-contact]"
        );


      if (deleteButton) {

        deleteButton.addEventListener(
          "click",
          () => {

            if (
              !confirm(
                "Bạn có chắc muốn xóa yêu cầu này?"
              )
            ) {
              return;
            }


            saveContacts(
              getContacts()
                .filter(
                  item =>
                    item.id !==
                    contact.id
                )
            );


            renderAdminContacts();

          }
        );

      }


      list.appendChild(
        row
      );

    }
  );

}


/* =========================================================
   30. ADMIN POSTS
========================================================= */

function renderAdminPosts() {

  const posts =
    getPosts();


  const postCount =
    document.getElementById(
      "postCount"
    );

  const publishedCount =
    document.getElementById(
      "publishedCount"
    );

  const list =
    document.getElementById(
      "adminPostList"
    );


  if (!list) {
    return;
  }


  if (postCount) {
    postCount.textContent =
      posts.length;
  }


  if (publishedCount) {
    publishedCount.textContent =
      posts.length;
  }


  list.innerHTML = "";


  posts.forEach(post => {

    const row =
      document.createElement(
        "div"
      );

    row.className =
      "admin-post-row";


    row.innerHTML = `

      <img
        src="${escapeHTML(post.image)}"
        alt=""
      >

      <div>

        <h4>
          ${escapeHTML(post.title)}
        </h4>

        <p>
          ${escapeHTML(post.category)}
          ·
          ${escapeHTML(post.date)}
        </p>

      </div>

      <div class="admin-row-actions">

        <button
          data-edit="${post.id}"
        >
          Sửa
        </button>

        <button
          data-delete="${post.id}"
        >
          Xóa
        </button>

      </div>

    `;


    const editButton =
      row.querySelector(
        "[data-edit]"
      );


    if (editButton) {

      editButton.addEventListener(
        "click",
        () => {

          editPost(
            post.id
          );

        }
      );

    }


    const deleteButton =
      row.querySelector(
        "[data-delete]"
      );


    if (deleteButton) {

      deleteButton.addEventListener(
        "click",
        () => {

          deletePost(
            post.id
          );

        }
      );

    }


    list.appendChild(
      row
    );

  });

}


/* =========================================================
   31. ADMIN POST FORM
========================================================= */

function resetPostForm() {

  const form =
    document.getElementById(
      "postForm"
    );

  const editId =
    document.getElementById(
      "editPostId"
    );

  const submit =
    document.getElementById(
      "postSubmit"
    );


  if (form) {
    form.reset();
  }


  if (editId) {
    editId.value = "";
  }


  if (submit) {

    submit.innerHTML =
      'Đăng bài <span>↗</span>';

  }

}


function editPost(id) {

  const post =
    getPosts().find(
      item =>
        item.id === id
    );


  if (!post) {
    return;
  }


  const editId =
    document.getElementById(
      "editPostId"
    );

  const title =
    document.getElementById(
      "postTitle"
    );

  const category =
    document.getElementById(
      "postCategory"
    );

  const image =
    document.getElementById(
      "postImage"
    );

  const excerpt =
    document.getElementById(
      "postExcerpt"
    );

  const content =
    document.getElementById(
      "postContent"
    );

  const submit =
    document.getElementById(
      "postSubmit"
    );


  if (editId) {
    editId.value = post.id;
  }

  if (title) {
    title.value = post.title;
  }

  if (category) {
    category.value = post.category;
  }

  if (image) {
    image.value = post.image;
  }

  if (excerpt) {
    excerpt.value = post.excerpt;
  }

  if (content) {
    content.value = post.content;
  }

  if (submit) {

    submit.innerHTML =
      'Cập nhật bài <span>↗</span>';

  }


  const newTab =
    document.querySelector(
      '[data-admin-tab="new"]'
    );


  if (newTab) {
    newTab.click();
  }

}


async function deletePost(id) {

  if (
    !confirm(
      "Bạn có chắc muốn xóa bài viết này?"
    )
  ) {
    return;
  }

  if (window.lauraCloud) {
    try { await window.lauraCloud.deletePost(id); } catch (error) { alert(error.message); }
    return;
  }


  savePosts(
    getPosts().filter(
      post =>
        post.id !== id
    )
  );


  renderAdminPosts();


  const activeFilter =
    document.querySelector(
      ".filter-btn.active"
    );


  renderBlog(
    activeFilter
      ?.dataset.category ||
    "all"
  );

}


const postCancel =
  document.getElementById(
    "postCancel"
  );


if (postCancel) {

  postCancel.addEventListener(
    "click",
    () => {

      resetPostForm();


      const postsTab =
        document.querySelector(
          '[data-admin-tab="posts"]'
        );


      if (postsTab) {
        postsTab.click();
      }

    }
  );

}


const postForm =
  document.getElementById(
    "postForm"
  );


if (postForm) {

  postForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const posts =
        getPosts();


      const editId =
        document.getElementById(
          "editPostId"
        )?.value;


      const payload = {

        title:
          document.getElementById(
            "postTitle"
          )?.value.trim() || "",

        category:
          document.getElementById(
            "postCategory"
          )?.value || "Photography",

        image:
          document.getElementById(
            "postImage"
          )?.value.trim() ||
          "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=85",

        excerpt:
          document.getElementById(
            "postExcerpt"
          )?.value.trim() || "",

        content:
          document.getElementById(
            "postContent"
          )?.value.trim() || "",

        date:
          new Date().toLocaleDateString(
            "vi-VN"
          )

      };

      if (window.lauraCloud) {
        try {
          await window.lauraCloud.savePost(payload, editId, document.getElementById('postImageFile')?.files?.[0]);
          resetPostForm();
          document.querySelector('[data-admin-tab="posts"]')?.click();
        } catch (error) { alert(error.message); }
        return;
      }


      if (editId) {

        const index =
          posts.findIndex(
            post =>
              post.id ===
              editId
          );


        if (index !== -1) {

          posts[index] = {

            ...posts[index],

            ...payload

          };

        }

      } else {

        posts.unshift({

          id:
            "post-" +
            Date.now(),

          ...payload

        });

      }


      savePosts(
        posts
      );


      resetPostForm();


      renderAdminPosts();

      renderBlog();


      const postsTab =
        document.querySelector(
          '[data-admin-tab="posts"]'
        );


      if (postsTab) {
        postsTab.click();
      }

    }
  );

}


/* =========================================================
   32. ESC KEY
========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key !==
      "Escape"
    ) {
      return;
    }


    closeImageModal();

    closeArticle();

    closeAccountModal();

    closeAdmin();

  }
);


/* =========================================================
   33. INITIALIZE
========================================================= */

renderBlog();

updateCommentUI();

/* =========================
   ADMIN COMMENT MANAGEMENT
========================= */

function getPostTitleById(postId) {
  const post = getPosts().find(item => item.id === postId);
  return post ? post.title : "Bài viết không xác định";
}

function renderAdminComments() {
  const container = document.getElementById("adminCommentList");
  const count = document.getElementById("adminCommentCount");

  if (!container) return;

  const comments = getComments()
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  if (count) count.textContent = comments.length;

  if (!comments.length) {
    container.innerHTML = `<div class="admin-comment-row"><p class="admin-muted">Chưa có bình luận nào.</p></div>`;
    return;
  }

  container.innerHTML = comments.map(comment => {
    const createdAt = comment.createdAt
      ? new Date(comment.createdAt).toLocaleString("vi-VN")
      : "Không rõ thời gian";

    return `
      <div class="admin-comment-row">
        <div class="admin-comment-head">
          <div>
            <div class="admin-comment-author">${escapeHTML(comment.name || "Người dùng")}</div>
            <div class="admin-comment-meta">${escapeHTML(comment.email || "")} · ${escapeHTML(createdAt)}</div>
          </div>
          <button type="button" class="admin-danger" data-admin-delete-comment="${escapeHTML(comment.id)}">Xóa</button>
        </div>
        <div class="admin-comment-article">Bài viết: ${escapeHTML(getPostTitleById(comment.postId))}</div>
        <div class="admin-comment-text">${escapeHTML(comment.text || "")}</div>
      </div>`;
  }).join("");

  container.querySelectorAll("[data-admin-delete-comment]").forEach(button => {
    button.addEventListener("click", () => adminDeleteComment(button.dataset.adminDeleteComment));
  });
}

function adminDeleteComment(commentId) {
  /* Chỉ cho phép thao tác này khi phiên Admin đang đăng nhập. */
  if (!isAdminAuthenticated()) {
    alert("Phiên Admin không hợp lệ. Vui lòng đăng nhập lại.");
    showAdminLogin();
    return;
  }

  const comments = getComments();
  const comment = comments.find(item => String(item.id) === String(commentId));
  if (!comment) return;

  const confirmed = confirm(`Xóa bình luận của "${comment.name || "Người dùng"}"?`);
  if (!confirmed) return;

  saveComments(comments.filter(item => String(item.id) !== String(commentId)));
  renderAdminComments();

  if (currentArticleId) {
    renderComments(currentArticleId);
  }
}

/* =========================
   ADMIN USER MANAGEMENT
========================= */

function renderAdminUsers() {

  const container =
    document.getElementById("adminUserList");

  const count =
    document.getElementById("adminUserCount");

  if (!container) return;

  const users = getUsers();

  if (count) {
    count.textContent = users.length;
  }

  if (!users.length) {

    container.innerHTML = `
      <div class="admin-user-row">
        <p style="color:#777">
          Chưa có tài khoản nào.
        </p>
      </div>
    `;

    return;
  }

  container.innerHTML = users.map(user => {

    const blocked = user.blocked === true;

    return `
      <div class="admin-user-row">

        <div class="admin-user-head">

          <div>

            <div class="admin-user-name">
              ${escapeHTML(user.name || "Không tên")}
            </div>

            <div class="admin-user-email">
              ${escapeHTML(user.email || "")}
            </div>

            <div class="admin-user-status ${blocked ? "blocked" : ""}">
              ${blocked ? "Đã khóa" : "Đang hoạt động"}
            </div>

          </div>

          <div class="admin-row-actions">

            <button
              class="admin-warning"
              onclick="adminToggleUser('${user.id}')">
              ${blocked ? "Mở khóa" : "Khóa"}
            </button>

            <button
              class="admin-danger"
              onclick="adminDeleteUser('${user.id}')">
              Xóa
            </button>

          </div>

        </div>

      </div>
    `;

  }).join("");
}


/* =========================
   BLOCK / UNBLOCK USER
========================= */

function adminToggleUser(userId) {

  const users = getUsers();

  const user =
    users.find(u => String(u.id) === String(userId));

  if (!user) return;

  user.blocked = !user.blocked;

  saveUsers(users);

  renderAdminUsers();

  alert(
    user.blocked
      ? "Đã khóa tài khoản."
      : "Đã mở khóa tài khoản."
  );
}


/* =========================
   DELETE USER
========================= */

function adminDeleteUser(userId) {

  const users = getUsers();

  const user =
    users.find(u => String(u.id) === String(userId));

  if (!user) return;

  const confirmed = confirm(
    `Xóa tài khoản "${user.name}"?`
  );

  if (!confirmed) return;

  const updated =
    users.filter(
      u => String(u.id) !== String(userId)
    );

  saveUsers(updated);

  renderAdminUsers();
}


/* =========================================================
   2026 PREMIUM UPGRADE — SIGNATURE CONCEPT ALBUMS CMS
   Keeps backward compatibility with the former one-image
   format while allowing an album for every concept.
========================================================= */
const CONCEPT_IMAGE_KEY = "lauraStudioConceptImages";
const MAX_CONCEPT_PHOTOS = 20;
const CONCEPT_CATALOG = [
  { id: "angelic", title: "Angelic / Ethereal", label: "Thiên thần / Thần thoại" },
  { id: "dark-gothic", title: "Dark / Gothic", label: "Bóng tối / Huyền bí" },
  { id: "floral-muse", title: "Floral / Muse", label: "Nàng thơ / Hoa cỏ" },
  { id: "fairy-pastoral", title: "Fairy / Pastoral", label: "Cổ tích / Dã ngoại" },
  { id: "high-fashion", title: "High Fashion / Glamour", label: "Thời trang cao cấp" },
  { id: "oriental-period", title: "Oriental / Period", label: "Cổ trang / Cổ phục" }
];

function getConceptImages() {
  try {
    const value = JSON.parse(localStorage.getItem(CONCEPT_IMAGE_KEY) || "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};

    return Object.fromEntries(Object.entries(value).map(([id, entry]) => {
      const images = Array.isArray(entry?.images)
        ? entry.images.filter(source => typeof source === "string" && source.trim())
        : typeof entry?.image === "string" && entry.image.trim()
          ? [entry.image]
          : [];
      return [id, { images, updatedAt: entry?.updatedAt || "" }];
    }));
  } catch (_) {
    return {};
  }
}

function saveConceptImages(items) {
  localStorage.setItem(CONCEPT_IMAGE_KEY, JSON.stringify(items));
}

function renderConceptImages() {
  const items = getConceptImages();

  CONCEPT_CATALOG.forEach(concept => {
    const card = document.querySelector(`[data-concept-id="${concept.id}"]`);
    const button = card?.querySelector(".concept-image-button");
    const album = items[concept.id]?.images || [];
    const source = album[0] || "";

    if (!button) return;

    if (source) {
      const preview = album.slice(0, 3);
      button.innerHTML = `<span class="concept-home-album concept-home-album-${preview.length}">${preview.map((imageSource, index) => `<img src="${escapeHTML(imageSource)}" data-image="${escapeHTML(imageSource)}" alt="${escapeHTML(concept.title)} — ảnh ${index + 1}" loading="lazy">`).join("")}</span><b class="concept-album-count">${album.length} ảnh</b><i>Xem album ↗</i>`;
      button.dataset.image = source;
      button.hidden = false;
    } else {
      delete button.dataset.image;
      button.hidden = true;
    }
  });
}

function renderConceptDetailImage() {
  const conceptId = document.body.dataset.conceptPage;
  const gallery = document.getElementById("conceptDetailGallery");
  const placeholder = document.getElementById("conceptDetailPlaceholder");
  const count = document.getElementById("conceptAlbumCount");
  if (!conceptId || !gallery || !placeholder) return;

  const concept = CONCEPT_CATALOG.find(item => item.id === conceptId);
  const album = getConceptImages()[conceptId]?.images || [];
  gallery.innerHTML = album.map((source, index) => `
    <button type="button" class="concept-album-item${index === 0 ? " featured" : ""}" data-image="${escapeHTML(source)}" aria-label="Xem ảnh ${index + 1} trong album ${escapeHTML(concept?.title || "concept")}">
      <img src="${escapeHTML(source)}" alt="${escapeHTML(concept?.title || "Concept")} — ảnh ${index + 1}" loading="lazy">
      <span>${String(index + 1).padStart(2, "0")}</span>
    </button>`).join("");

  if (count) count.textContent = album.length ? `${album.length} hình ảnh` : "Album đang cập nhật";
  if (!album.length) {
    gallery.hidden = true;
    placeholder.hidden = false;
    return;
  }

  gallery.hidden = false;
  placeholder.hidden = true;
}

function renderAdminConcepts() {
  const list = document.getElementById("conceptAdminList");
  const count = document.getElementById("conceptImageCount");
  const photoCount = document.getElementById("conceptPhotoCount");
  if (!list) return;

  const items = getConceptImages();
  if (count) {
    count.textContent = CONCEPT_CATALOG.filter(concept => items[concept.id]?.images?.length).length;
  }
  if (photoCount) photoCount.textContent = CONCEPT_CATALOG.reduce((sum, concept) => sum + (items[concept.id]?.images?.length || 0), 0);

  list.innerHTML = CONCEPT_CATALOG.map(concept => {
    const album = items[concept.id]?.images || [];
    const source = album[0] || "";
    const thumbnail = source
      ? `<img src="${escapeHTML(source)}" alt="Ảnh bìa ${escapeHTML(concept.title)}"><b>${album.length}</b>`
      : "<span>Chưa có album</span>";
    const remove = source
      ? `<button type="button" class="danger" data-concept-remove="${concept.id}">Xóa album</button>`
      : "";

    return `<div class="concept-admin-row">
      <div class="concept-admin-thumb">${thumbnail}</div>
      <div class="concept-admin-copy">
        <h4>${escapeHTML(concept.title)}</h4>
        <p>${escapeHTML(concept.label)} · ${album.length} ảnh</p>
        <div class="admin-row-actions">
          <button type="button" data-concept-edit="${concept.id}">${source ? "Quản lý album" : "Tạo album"}</button>
          ${remove}
        </div>
      </div>
    </div>`;
  }).join("");
}

let pendingConceptImages = [];

function showConceptPreview() {
  const box = document.getElementById("conceptAlbumPreview");
  if (!box) return;
  if (!pendingConceptImages.length) {
    box.hidden = true;
    box.innerHTML = "";
    return;
  }

  box.innerHTML = pendingConceptImages.map((source, index) => `
    <figure>
      <img src="${escapeHTML(source)}" alt="Ảnh ${index + 1} trong album">
      <figcaption>${String(index + 1).padStart(2, "0")}</figcaption>
      <button type="button" data-concept-preview-remove="${index}" aria-label="Loại ảnh ${index + 1} khỏi album">×</button>
    </figure>`).join("");
  box.hidden = false;
}

function closeConceptEditor() {
  const form = document.getElementById("conceptAdminForm");
  form?.reset();
  if (form) form.hidden = true;
  pendingConceptImages = [];
  showConceptPreview();
  const note = document.getElementById("conceptAdminNote");
  if (note) note.textContent = "";
}

function openConceptEditor(conceptId) {
  const concept = CONCEPT_CATALOG.find(item => item.id === conceptId);
  const form = document.getElementById("conceptAdminForm");
  if (!concept || !form) return;

  const current = getConceptImages()[conceptId]?.images || [];
  document.getElementById("conceptEditId").value = conceptId;
  document.getElementById("conceptEditTitle").textContent = concept.title;
  document.getElementById("conceptImageUrls").value = "";
  document.getElementById("conceptImageFile").value = "";
  pendingConceptImages = [...current];
  showConceptPreview();
  form.hidden = false;
  form.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function optimizeConceptImage(file) {
  return new Promise((resolve, reject) => {
    if (!file?.type?.startsWith("image/")) {
      reject(new Error("Vui lòng chọn đúng định dạng ảnh."));
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      reject(new Error("Ảnh vượt quá 12 MB. Vui lòng chọn ảnh nhỏ hơn."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Không thể đọc file ảnh."));
    reader.onload = () => {
      const sourceImage = new Image();
      sourceImage.onerror = () => reject(new Error("File ảnh không hợp lệ."));
      sourceImage.onload = () => {
        const maxWidth = 1000;
        const maxHeight = 1000;
        const ratio = Math.min(1, maxWidth / sourceImage.width, maxHeight / sourceImage.height);
        const width = Math.max(1, Math.round(sourceImage.width * ratio));
        const height = Math.max(1, Math.round(sourceImage.height * ratio));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        context.drawImage(sourceImage, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", .74));
      };
      sourceImage.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

document.getElementById("conceptAdminList")?.addEventListener("click", event => {
  const edit = event.target.closest("[data-concept-edit]");
  const remove = event.target.closest("[data-concept-remove]");

  if (edit) {
    openConceptEditor(edit.dataset.conceptEdit);
  }

  if (remove && confirm("Xóa toàn bộ album ảnh của concept này?")) {
    const items = getConceptImages();
    delete items[remove.dataset.conceptRemove];
    saveConceptImages(items);
    renderConceptImages();
    renderConceptDetailImage();
    renderAdminConcepts();
    closeConceptEditor();
  }
});

document.getElementById("conceptImageFile")?.addEventListener("change", async event => {
  const files = [...(event.target.files || [])];
  const note = document.getElementById("conceptAdminNote");
  if (!files.length) return;
  if (pendingConceptImages.length + files.length > MAX_CONCEPT_PHOTOS) {
    if (note) note.textContent = `Mỗi album tối đa ${MAX_CONCEPT_PHOTOS} ảnh.`;
    event.target.value = "";
    return;
  }

  if (note) note.textContent = `Đang tối ưu ${files.length} ảnh...`;
  try {
    const optimized = [];
    for (const file of files) optimized.push(await optimizeConceptImage(file));
    pendingConceptImages.push(...optimized);
    showConceptPreview();
    if (note) note.textContent = `${pendingConceptImages.length} ảnh đã sẵn sàng để lưu.`;
  } catch (error) {
    if (note) note.textContent = error.message;
  }
  event.target.value = "";
});

document.getElementById("conceptAlbumPreview")?.addEventListener("click", event => {
  const remove = event.target.closest("[data-concept-preview-remove]");
  if (!remove) return;
  pendingConceptImages.splice(Number(remove.dataset.conceptPreviewRemove), 1);
  showConceptPreview();
  const note = document.getElementById("conceptAdminNote");
  if (note) note.textContent = `${pendingConceptImages.length} ảnh trong album.`;
});

document.getElementById("cancelConceptBtn")?.addEventListener("click", closeConceptEditor);

document.getElementById("conceptAdminForm")?.addEventListener("submit", event => {
  event.preventDefault();
  const conceptId = document.getElementById("conceptEditId").value;
  const urls = document.getElementById("conceptImageUrls").value
    .split(/\n+/)
    .map(value => value.trim())
    .filter(Boolean);
  const note = document.getElementById("conceptAdminNote");
  const invalidUrl = urls.find(value => {
    try {
      const parsed = new URL(value);
      return !["http:", "https:"].includes(parsed.protocol);
    } catch (_) {
      return true;
    }
  });

  if (invalidUrl) {
    if (note) note.textContent = `URL không hợp lệ: ${invalidUrl}`;
    return;
  }

  const album = [...new Set([...pendingConceptImages, ...urls])];

  if (!conceptId || !album.length) {
    if (note) note.textContent = "Vui lòng chọn ít nhất một ảnh hoặc nhập URL hình ảnh.";
    return;
  }
  if (album.length > MAX_CONCEPT_PHOTOS) {
    if (note) note.textContent = `Mỗi album tối đa ${MAX_CONCEPT_PHOTOS} ảnh.`;
    return;
  }

  try {
    const items = getConceptImages();
    items[conceptId] = { images: album, updatedAt: new Date().toISOString() };
    saveConceptImages(items);
    renderConceptImages();
    renderConceptDetailImage();
    renderAdminConcepts();
    closeConceptEditor();
  } catch (error) {
    if (note) note.textContent = "Không đủ bộ nhớ trình duyệt. Hãy chọn ảnh nhỏ hơn hoặc dùng URL ảnh.";
  }
});

document.querySelector(".concept-grid")?.addEventListener("click", event => {
  const button = event.target.closest(".concept-image-button");
  const selectedImage = event.target.closest("[data-image]")?.dataset.image;
  if (button?.dataset.image) {
    openImageModal(selectedImage || button.dataset.image);
  }
});

document.getElementById("conceptDetailGallery")?.addEventListener("click", event => {
  const button = event.target.closest("[data-image]");
  if (button?.dataset.image) openImageModal(button.dataset.image);
});

renderConceptImages();
renderConceptDetailImage();

/* =========================================================
   2026 PREMIUM UPGRADE — PORTFOLIO CMS
========================================================= */
const PORTFOLIO_KEY = "lauraStudioPortfolio";

function seedPortfolioFromMarkup(){
  if (window.LAURA_SUPABASE?.publishableKey && !String(window.LAURA_SUPABASE.publishableKey).includes('YOUR_')) return;
  if(localStorage.getItem(PORTFOLIO_KEY)!==null) return;
  const cards=[...document.querySelectorAll("#portfolio .gallery-card")];
  if(!cards.length) return;
  const items=cards.map((card,index)=>({
    id:`portfolio-${Date.now()}-${index}`,
    title:card.querySelector("img")?.alt || `Portfolio ${index+1}`,
    category:(card.querySelector("span")?.textContent || "Portfolio").split("/")[0].trim(),
    page:"portfolio",
    layout:["large","tall","wide"].find(c=>card.classList.contains(c)) || "normal",
    image:card.dataset.image || card.querySelector("img")?.src || ""
  }));
  localStorage.setItem(PORTFOLIO_KEY,JSON.stringify(items));
}
function getPortfolioItems(){if(window.LAURA_SUPABASE?.publishableKey && !String(window.LAURA_SUPABASE.publishableKey).includes('YOUR_') && !window.lauraPortfolioLoaded)return [];try{const v=JSON.parse(localStorage.getItem(PORTFOLIO_KEY)||"[]");return Array.isArray(v)?v:[]}catch{return []}}
function savePortfolioItems(items){localStorage.setItem(PORTFOLIO_KEY,JSON.stringify(items))}
function currentPortfolioPage(){
  const file=(location.pathname.split("/").pop()||"index.html").toLowerCase();
  return ({"index.html":"portfolio","":"portfolio","service-concept.html":"concept","service-costume.html":"costume","service-portrait.html":"portrait","service-fashion.html":"fashion","service-wedding.html":"wedding","service-brand.html":"brand"})[file]||"portfolio";
}
function renderDynamicPortfolio(){
  const gallery=document.querySelector("#portfolio .gallery"); if(!gallery)return;
  const items=getPortfolioItems().filter(x=>x.page===currentPortfolioPage());
  gallery.innerHTML=items.map((x,i)=>`<button type="button" class="gallery-card ${escapeHTML(x.layout||"normal")}" data-image="${escapeHTML(x.image)}" aria-label="Mở ảnh ${escapeHTML(x.title)}"><img src="${escapeHTML(x.image)}" alt="${escapeHTML(x.title)}" loading="lazy" decoding="async"><span>${escapeHTML(x.category)} / ${String(i+1).padStart(2,"0")}</span></button>`).join("");
}
function renderAdminPortfolio(){
  const list=document.getElementById("portfolioAdminList"); if(!list)return;
  const items=getPortfolioItems();
  const total=document.getElementById("portfolioCount"), main=document.getElementById("portfolioPageCount");
  if(total)total.textContent=items.length;if(main)main.textContent=items.filter(x=>x.page==="portfolio").length;
  list.innerHTML=items.length?items.map(x=>`<div class="portfolio-admin-row"><img src="${escapeHTML(x.image)}" alt=""><div><h4>${escapeHTML(x.title)}</h4><p>${escapeHTML(x.category)} · ${escapeHTML(x.page)} · ${escapeHTML(x.layout)}</p></div><div class="admin-row-actions"><button type="button" data-portfolio-edit="${escapeHTML(x.id)}">Sửa</button><button type="button" data-portfolio-delete="${escapeHTML(x.id)}">Xóa</button></div></div>`).join(""):'<p class="admin-muted">Chưa có hình ảnh.</p>';
}
function resetPortfolioForm(){
  const f=document.getElementById("portfolioAdminForm");if(!f)return;f.reset();document.getElementById("portfolioEditId").value="";document.getElementById("portfolioImagePreview").hidden=true;
}
function openPortfolioForm(item=null){
  const f=document.getElementById("portfolioAdminForm");if(!f)return;resetPortfolioForm();f.hidden=false;
  if(item){document.getElementById("portfolioEditId").value=item.id;document.getElementById("portfolioTitle").value=item.title;document.getElementById("portfolioCategory").value=item.category;document.getElementById("portfolioPage").value=item.page;document.getElementById("portfolioLayout").value=item.layout;document.getElementById("portfolioImage").value=item.image;showPortfolioPreview(item.image)}
  document.getElementById("portfolioTitle")?.focus();
}
function showPortfolioPreview(url){const box=document.getElementById("portfolioImagePreview"),img=document.getElementById("portfolioPreviewImg");if(!box||!img)return;if(!url){box.hidden=true;return}img.src=url;box.hidden=false}

seedPortfolioFromMarkup();
renderDynamicPortfolio();

document.getElementById("addPortfolioBtn")?.addEventListener("click",()=>openPortfolioForm());
document.getElementById("cancelPortfolioBtn")?.addEventListener("click",()=>{resetPortfolioForm();document.getElementById("portfolioAdminForm").hidden=true});
document.getElementById("portfolioImage")?.addEventListener("input",e=>showPortfolioPreview(e.target.value.trim()));
document.getElementById("portfolioAdminForm")?.addEventListener("submit",async e=>{
  e.preventDefault();const items=getPortfolioItems(),id=document.getElementById("portfolioEditId").value;
  const item={id:id||`portfolio-${Date.now()}`,title:document.getElementById("portfolioTitle").value.trim(),category:document.getElementById("portfolioCategory").value.trim(),page:document.getElementById("portfolioPage").value,layout:document.getElementById("portfolioLayout").value,image:document.getElementById("portfolioImage").value.trim()};
  if(window.lauraCloud){try{await window.lauraCloud.savePortfolio(item,document.getElementById('portfolioImageFile')?.files?.[0]);resetPortfolioForm();e.target.hidden=true}catch(error){alert(error.message)}return}
  const i=items.findIndex(x=>x.id===id);if(i>=0)items[i]=item;else items.unshift(item);savePortfolioItems(items);renderAdminPortfolio();renderDynamicPortfolio();resetPortfolioForm();e.target.hidden=true;
});
document.getElementById("portfolioAdminList")?.addEventListener("click",async e=>{
  const edit=e.target.closest("[data-portfolio-edit]"),del=e.target.closest("[data-portfolio-delete]");
  if(edit){const item=getPortfolioItems().find(x=>x.id===edit.dataset.portfolioEdit);if(item)openPortfolioForm(item)}
  if(del&&confirm("Bạn có chắc muốn xóa ảnh này?")){if(window.lauraCloud){try{await window.lauraCloud.deletePortfolio(del.dataset.portfolioDelete)}catch(error){alert(error.message)}return}savePortfolioItems(getPortfolioItems().filter(x=>x.id!==del.dataset.portfolioDelete));renderAdminPortfolio();renderDynamicPortfolio()}
});
// Delegation keeps lightbox working for images created by Admin after page load.
document.querySelector("#portfolio .gallery")?.addEventListener("click",e=>{const card=e.target.closest(".gallery-card");if(card?.dataset.image)openImageModal(card.dataset.image)});

/* =========================================================
   LIGHT / DARK THEME
   ========================================================= */
const themeToggle=document.getElementById("themeToggle");
const themeIcon=document.getElementById("themeIcon");
const themeMeta=document.querySelector('meta[name="theme-color"]');
if(themeToggle && !themeToggle.querySelector('.theme-toggle-label')){
  const label=document.createElement('span');
  label.className='theme-toggle-label';
  label.setAttribute('aria-hidden','true');
  themeToggle.append(label);
}
let activeLauraTheme=document.documentElement.dataset.theme||"light";
let themeFrame=0;
let themeCleanup=0;
function commitLauraTheme(next,persist){
  document.documentElement.dataset.theme=next;
  if(persist){try{localStorage.setItem("lauraTheme",next)}catch(_){}}
  if(themeIcon)themeIcon.textContent=next==="dark"?"☀":"☾";
  if(themeToggle){
    const label=next==="dark"?"Chuyển sang chế độ sáng":"Chuyển sang chế độ tối";
    themeToggle.setAttribute("aria-label",label);themeToggle.title=label;
    themeToggle.setAttribute('aria-pressed',String(next==='dark'));
    const visibleLabel=themeToggle.querySelector('.theme-toggle-label');
    if(visibleLabel)visibleLabel.textContent=next==='dark'?'Sáng':'Tối';
  }
  if(themeMeta)themeMeta.setAttribute("content",next==="dark"?"#111315":"#f7f3eb");
}
function applyLauraTheme(theme,{persist=true,animate=false}={}){
  const next=theme==="dark"?"dark":"light";
  activeLauraTheme=next;
  if(themeFrame)cancelAnimationFrame(themeFrame);
  if(themeCleanup)clearTimeout(themeCleanup);
  const shouldAnimate=animate
    && next!==document.documentElement.dataset.theme
    && !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if(!shouldAnimate){
    document.documentElement.classList.remove("theme-switching");
    commitLauraTheme(next,persist);
    return;
  }
  document.documentElement.classList.add("theme-switching");
  // Apply the transition rule before changing the palette on the next frame.
  void window.getComputedStyle(document.body).backgroundColor;
  themeFrame=requestAnimationFrame(()=>{
    themeFrame=0;
    commitLauraTheme(next,persist);
    themeCleanup=window.setTimeout(()=>{
      document.documentElement.classList.remove("theme-switching");
      themeCleanup=0;
    },300);
  });
}
function initialLauraTheme(){
  let saved=null;try{saved=localStorage.getItem("lauraTheme")}catch(_){}
  if(saved==="dark"||saved==="light")return saved;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches?"dark":"light";
}
applyLauraTheme(document.documentElement.dataset.theme||initialLauraTheme(),{persist:false});
themeToggle?.addEventListener("click",()=>applyLauraTheme(activeLauraTheme==="dark"?"light":"dark",{animate:true}));
const systemTheme=window.matchMedia?.("(prefers-color-scheme: dark)");
systemTheme?.addEventListener?.("change",event=>{let saved=null;try{saved=localStorage.getItem("lauraTheme")}catch(_){}if(!saved)applyLauraTheme(event.matches?"dark":"light",{persist:false,animate:true})});
