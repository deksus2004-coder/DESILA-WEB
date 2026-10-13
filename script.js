// Mobile nav toggle
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

menuToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    menuToggle.classList.toggle("active", open);
    menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
});

navLinks.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
        navLinks.classList.remove("open");
        menuToggle.classList.remove("active");
        menuToggle.setAttribute("aria-expanded", "false");
    }),
);

// Nav glass/shadow on scroll + top scroll-progress bar
const navEl = document.querySelector(".nav");
const progressBar = document.createElement("div");
progressBar.className = "scroll-progress";
document.body.appendChild(progressBar);

function syncNavHeight() {
    document.documentElement.style.setProperty(
        "--nav-h",
        navEl.offsetHeight + "px",
    );
}

function onScrollNav() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    navEl.classList.toggle("nav-scrolled", scrollTop > 12);
    syncNavHeight();

    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = pct + "%";
}

window.addEventListener("scroll", onScrollNav, { passive: true });
window.addEventListener("resize", syncNavHeight);
syncNavHeight();
onScrollNav();

// Hero photo card stack
const heroStack = document.getElementById("heroPhotoStack");
const heroCredit = document.getElementById("heroPhotoCredit");

if (heroStack && heroCredit) {
    const heroCards = Array.from(heroStack.querySelectorAll(".hero-photo-card"));

    function updateHeroCredit() {
        const front = heroStack.querySelector('.hero-photo-card[data-pos="0"]');
        if (front) {
            heroCredit.textContent = `Photo: ${front.dataset.credit} — Wikimedia Commons, CC BY-SA`;
        }
    }

    heroCards.forEach((card) => {
        card.addEventListener("click", () => {
            if (card.dataset.pos === "0") return;
            const clickedPos = card.dataset.pos;
            heroCards.forEach((c) => {
                if (c === card) {
                    c.dataset.pos = "0";
                } else if (c.dataset.pos === "0") {
                    c.dataset.pos = clickedPos;
                }
            });
            updateHeroCredit();
        });
    });

    // Arrow buttons
    const heroPrevBtn = document.getElementById("heroPrevBtn");
    const heroNextBtn = document.getElementById("heroNextBtn");

    function rotateHero(direction) {
        const total = heroCards.length;
        heroCards.forEach((c) => {
            const cur = parseInt(c.dataset.pos, 10);
            const next =
                direction === "next" ? (cur - 1 + total) % total : (cur + 1) % total;
            c.dataset.pos = String(next);
        });
        updateHeroCredit();
    }

    if (heroPrevBtn) {
        heroPrevBtn.addEventListener("click", () => rotateHero("prev"));
    }
    if (heroNextBtn) {
        heroNextBtn.addEventListener("click", () => rotateHero("next"));
    }
}

// Reveal on scroll
const revealEls = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
        (entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting) {
                    e.target.classList.add("in");
                    io.unobserve(e.target);
                }
            });
        },
        { threshold: 0.12 },
    );
    revealEls.forEach((el) => io.observe(el));
} else {
    revealEls.forEach((el) => el.classList.add("in"));
}

// Booking calculator
const form = document.getElementById("bookingForm");
const totalDisplay = document.getElementById("totalDisplay");

function formatIDR(n) {
    return "IDR " + Math.round(n).toLocaleString("en-US");
}

// Snorkeling: Sharing and Private are mutually exclusive
const snorkSharing = document.getElementById("snorkSharing");
const snorkPrivate = document.getElementById("snorkPrivate");
const snorkQtyLabel = document.getElementById("snorkQtyLabel");
const snorkQtyHint = document.getElementById("snorkQtyHint");

function updateSnorkQtyLabel() {
    if (snorkPrivate.value !== "0") {
        snorkQtyLabel.textContent = "Total Boat";
        snorkQtyHint.textContent = "Number of private boats you want to charter";
    } else {
        snorkQtyLabel.textContent = "Total People";
        snorkQtyHint.textContent = "Number of people joining the sharing trip";
    }
}

snorkSharing.addEventListener("change", () => {
    if (snorkSharing.value !== "0") snorkPrivate.value = "0";
    updateSnorkQtyLabel();
});

snorkPrivate.addEventListener("change", () => {
    if (snorkPrivate.value !== "0") snorkSharing.value = "0";
    updateSnorkQtyLabel();
});
updateSnorkQtyLabel();

function qtyValue(id) {
    return Math.max(1, parseInt(document.getElementById(id).value, 10) || 1);
}

// Room booking variables
const bookRoomCheck = document.getElementById("bookRoomCheck");
const roomOptionsContainer = document.getElementById("roomOptionsContainer");
const checkInDateInput = document.getElementById("checkInDate");
const checkOutDateInput = document.getElementById("checkOutDate");
const roomTypeSelect = document.getElementById("roomType");
const roomQtyInput = document.getElementById("roomQty");

function enforceRoomLimit() {
    const selectedText =
        roomTypeSelect.options[roomTypeSelect.selectedIndex].text;
    let maxLimit = 4;
    if (selectedText.includes("Twin")) {
        maxLimit = 1;
    }
    roomQtyInput.max = maxLimit;
    if (parseInt(roomQtyInput.value, 10) > maxLimit) {
        roomQtyInput.value = maxLimit;
        calcTotal();
    }
}

roomTypeSelect.addEventListener("change", enforceRoomLimit);
roomQtyInput.addEventListener("input", enforceRoomLimit);

bookRoomCheck.addEventListener("change", () => {
    if (bookRoomCheck.checked) {
        roomOptionsContainer.style.display = "block";
        checkInDateInput.required = true;
        checkOutDateInput.required = true;
    } else {
        roomOptionsContainer.style.display = "none";
        checkInDateInput.required = false;
        checkOutDateInput.required = false;
    }
    calcTotal();
});

const tourQtyInput = document.getElementById("tourQty");
const snorkQtyInput = document.getElementById("snorkQty");
const trekQtyInput = document.getElementById("trekQty");
const jukQtyInput = document.getElementById("jukQty");

function syncRequiredQty() {
    tourQtyInput.required = document.getElementById("tourSelect").value !== "0";
    snorkQtyInput.required =
        snorkSharing.value !== "0" || snorkPrivate.value !== "0";
    trekQtyInput.required = document.getElementById("trekSelect").value !== "0";
    jukQtyInput.required =
        document.getElementById("jukungSelect").value.split("|")[0] !== "0";
}

function calcTotal() {
    syncRequiredQty();

    let roomTotal = 0;
    let nights = 0;
    const roomQty = qtyValue("roomQty");

    if (bookRoomCheck.checked) {
        const roomPrice =
            parseInt(document.getElementById("roomType").value, 10) || 450;

        if (checkInDateInput.value && checkOutDateInput.value) {
            const checkIn = new Date(checkInDateInput.value);
            const checkOut = new Date(checkOutDateInput.value);
            const diffTime = checkOut - checkIn;
            nights = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        }

        const calculatedNights = nights > 0 ? nights : 1;
        roomTotal = roomPrice * 1000 * roomQty * calculatedNights;
    }

    const tourQty = qtyValue("tourQty");
    const tourTotal =
        (parseInt(document.getElementById("tourSelect").value) || 0) *
        1000 *
        tourQty;

    const snorkQty = qtyValue("snorkQty");
    const sharingTotal = (parseInt(snorkSharing.value) || 0) * 1000 * snorkQty;
    const privateTotal = (parseInt(snorkPrivate.value) || 0) * 1000 * snorkQty;
    const snorkTotal = sharingTotal + privateTotal;

    const trekQty = qtyValue("trekQty");
    const trekTotal =
        (parseInt(document.getElementById("trekSelect").value) || 0) *
        1000 *
        trekQty;

    const jukQty = qtyValue("jukQty");
    const [jukPrice] = document.getElementById("jukungSelect").value.split("|");
    const jukTotal = (parseInt(jukPrice) || 0) * 1000 * jukQty;

    const total = roomTotal + tourTotal + snorkTotal + trekTotal + jukTotal;
    const newTotalText = formatIDR(total);

    if (totalDisplay.textContent !== newTotalText) {
        totalDisplay.textContent = newTotalText;
        totalDisplay.classList.remove("pulse");
        void totalDisplay.offsetWidth;
        totalDisplay.classList.add("pulse");
    }

    return {
        total,
        roomTotal,
        tourTotal,
        snorkTotal,
        trekTotal,
        jukTotal,
        nights,
        roomQty,
        tourQty,
        snorkQty,
        trekQty,
        jukQty,
    };
}

document.addEventListener("DOMContentLoaded", () => {
    const pillButtons = document.querySelectorAll(".pill-btn");
    const contentSections = document.querySelectorAll(".content-section");

    pillButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            pillButtons.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");

            const targetId = btn.getAttribute("data-target");

            contentSections.forEach((section) => {
                section.style.display = section.id === targetId ? "block" : "none";
            });
        });
    });
});

form.addEventListener("input", calcTotal);
form.addEventListener("change", calcTotal);
calcTotal();

form.addEventListener("submit", function (e) {
    e.preventDefault();

    const travelDateInput = document.getElementById("travelDate");
    if (!travelDateInput.value) {
        alert("Please select a Travel Date before sending your booking.");
        travelDateInput.focus();
        return;
    }

    if (bookRoomCheck.checked) {
        if (!checkInDateInput.value || !checkOutDateInput.value) {
            alert(
                "Please select both Check-In and Check-Out dates for your room booking.",
            );
            return;
        }
        if (new Date(checkOutDateInput.value) <= new Date(checkInDateInput.value)) {
            alert("Check-Out date must be after Check-In date.");
            return;
        }
    }

    const validations = [
        {
            cond: document.getElementById("tourSelect").value !== "0",
            input: tourQtyInput,
            label: "Total Cars for the Island Tour",
        },
        {
            cond: snorkSharing.value !== "0" || snorkPrivate.value !== "0",
            input: snorkQtyInput,
            label:
                snorkPrivate.value !== "0"
                    ? "Total Boat for Snorkeling"
                    : "Total People for Snorkeling",
        },

        {
            cond: document.getElementById("jukungSelect").value.split("|")[0] !== "0",
            input: jukQtyInput,
            label: "Total Jukung",
        },
    ];

    for (const v of validations) {
        if (v.cond) {
            const val = parseInt(v.input.value, 10);
            if (!v.input.value || isNaN(val) || val < 1) {
                alert(`Please enter the ${v.label} before sending your booking.`);
                v.input.focus();
                return;
            }
        }
    }

    const name =
        document.getElementById("fullName").value || "(name not provided)";
    const wa =
        document.getElementById("waNumber").value || "(number not provided)";

    const tourText =
        document.getElementById("tourSelect").selectedOptions[0].text;
    const sharingText = snorkSharing.selectedOptions[0].text;
    const privateText = snorkPrivate.selectedOptions[0].text;
    const trekText =
        document.getElementById("trekSelect").selectedOptions[0].text;
    const jukText =
        document.getElementById("jukungSelect").selectedOptions[0].text;

    const { total, nights, roomQty, tourQty, snorkQty, trekQty, jukQty } =
        calcTotal();

    const travelDate =
        document.getElementById("travelDate").value || "(travel date not set)";

    let msg = `Hi DESILA Beach House, I'd like to book:%0A`;
    msg += `*Name:* ${name}%0A`;
    msg += `*WhatsApp:* ${wa}%0A`;
    msg += `*Travel Date:* ${travelDate}%0A%0A`;

    if (bookRoomCheck.checked) {
        const roomType = document
            .getElementById("roomType")
            .selectedOptions[0].text.split("(")[0]
            .trim();
        msg += `*Room Booking:* ${roomType} (x${roomQty} room(s), ${nights} night(s): ${checkInDateInput.value} to ${checkOutDateInput.value})%0A`;
    }

    if (document.getElementById("tourSelect").value !== "0") {
        msg += `*Tour:* ${tourText} (x${tourQty} cars)%0A`;
    }

    if (snorkSharing.value !== "0") {
        msg += `*Snorkeling Sharing:* ${sharingText} (x${snorkQty} people)%0A`;
    }

    if (snorkPrivate.value !== "0") {
        msg += `*Snorkeling Private:* ${privateText} (x${snorkQty} boat(s))%0A`;
    }



    if (document.getElementById("jukungSelect").value.split("|")[0] !== "0") {
        msg += `*Jukung Fishing:* ${jukText} (x${jukQty} jukung)%0A`;
    }

    msg += `%0A*Estimated Total:* ${formatIDR(total)}`;

    window.open(`https://wa.me/6282323223811?text=${msg}`, "_blank");
});
