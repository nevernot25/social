// Pricing
const PRICES = {
    lyric: { first: 40, additional: 20 },
    topic: { first: 30, additional: 15 },
    combo: 60,
    fastDelivery: 20
};

let counts = { lyric: 0, topic: 0 };
let bundleApplied = false;
let voucherApplied = false;
let voucherCode = '';
const VOUCHERS = {
    'FRIENDS10': 0.10,
    'TEST99': 0.99
};
const TAX_RATE = 0.081;

// Stripe
const stripe = Stripe('pk_live_51SLngBFMBNQFsANi1d0FF4ZyyDohJoovuwdW9NJtk14fBe4FW9Xcrp1aS9MZDVAck0nIcAvkBMGxhY7DNIX8hnPH00ZI8NnzCj');

// Update counter
function updateCount(type, change) {
    counts[type] = Math.max(0, counts[type] + change);
    document.getElementById(`${type}-count`).textContent = counts[type];
    // Keep bundle applied if we still have at least 1 lyric and 1 topic
    if (bundleApplied && (counts.lyric === 0 || counts.topic === 0)) {
        bundleApplied = false;
    }
    calculatePrice();
}

// Apply bundle discount
function applyBundle() {
    counts.lyric = 1;
    counts.topic = 1;
    bundleApplied = true;
    document.getElementById('lyric-count').textContent = 1;
    document.getElementById('topic-count').textContent = 1;
    calculatePrice();
}

// Apply voucher
function applyVoucher() {
    const input = document.getElementById('voucher-code');
    const code = input.value.trim().toUpperCase();
    const messageEl = document.getElementById('voucher-message');

    if (!code) {
        messageEl.textContent = 'Please enter a voucher code';
        messageEl.className = 'voucher-message error';
        return;
    }

    if (VOUCHERS[code]) {
        voucherApplied = true;
        voucherCode = code;
        messageEl.textContent = '✓ Voucher applied!';
        messageEl.className = 'voucher-message success';
        input.disabled = true;
        calculatePrice();
    } else {
        messageEl.textContent = 'Invalid voucher code';
        messageEl.className = 'voucher-message error';
        voucherApplied = false;
        voucherCode = '';
    }
}

// Calculate price
function calculatePrice() {
    const { lyric, topic } = counts;
    let subtotal = 0;
    let originalPrice = 0;
    let showBundleDiscount = false;

    if (lyric === 0 && topic === 0) {
        document.getElementById('total-amount').textContent = '$0';
        document.getElementById('subtotal-amount').textContent = '$0';
        document.getElementById('tax-amount').textContent = '$0';
        document.getElementById('checkout-btn').disabled = true;
        document.getElementById('bundle-discount-row').style.display = 'none';
        document.getElementById('voucher-discount-row').style.display = 'none';
        document.getElementById('original-price').style.display = 'none';
        document.getElementById('estimated-reach').style.display = 'none';
        document.getElementById('fast-delivery-row').style.display = 'none';
        return;
    }

    // Calculate subtotal with bundle discount
    if (lyric > 0 && topic > 0 && bundleApplied) {
        subtotal += PRICES.combo;
        originalPrice = PRICES.lyric.first + PRICES.topic.first;
        showBundleDiscount = true;
        if (lyric > 1) {
            subtotal += (lyric - 1) * PRICES.lyric.additional;
            originalPrice += (lyric - 1) * PRICES.lyric.additional;
        }
        if (topic > 1) {
            subtotal += (topic - 1) * PRICES.topic.additional;
            originalPrice += (topic - 1) * PRICES.topic.additional;
        }
    } else {
        if (lyric > 0) {
            subtotal += PRICES.lyric.first;
            if (lyric > 1) subtotal += (lyric - 1) * PRICES.lyric.additional;
        }
        if (topic > 0) {
            subtotal += PRICES.topic.first;
            if (topic > 1) subtotal += (topic - 1) * PRICES.topic.additional;
        }
    }

    // Add fast delivery
    const fastDelivery = document.querySelector('input[name="delivery"]:checked')?.value === 'fast';
    if (fastDelivery) {
        subtotal += PRICES.fastDelivery;
        document.getElementById('fast-delivery-row').style.display = 'flex';
    } else {
        document.getElementById('fast-delivery-row').style.display = 'none';
    }

    // Apply voucher discount
    let voucherDiscount = 0;
    if (voucherApplied && VOUCHERS[voucherCode]) {
        voucherDiscount = subtotal * VOUCHERS[voucherCode];
        document.getElementById('voucher-discount-amount').textContent = `−$${voucherDiscount.toFixed(2)}`;
        document.getElementById('voucher-discount-row').style.display = 'flex';
        subtotal -= voucherDiscount;
    } else {
        document.getElementById('voucher-discount-row').style.display = 'none';
    }

    // Show bonus posts if subtotal >= $100
    const subtotalBeforeTax = subtotal + (voucherApplied ? voucherDiscount : 0);
    if (subtotalBeforeTax >= 100) {
        document.getElementById('bonus-posts-row').style.display = 'flex';
    } else {
        document.getElementById('bonus-posts-row').style.display = 'none';
    }

    // Calculate tax
    const tax = subtotal * TAX_RATE;

    // Calculate final total
    const total = subtotal + tax;

    // Update display
    document.getElementById('subtotal-amount').textContent = `$${subtotalBeforeTax.toFixed(2)}`;
    document.getElementById('tax-amount').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('total-amount').textContent = `$${total.toFixed(2)}`;
    document.getElementById('checkout-btn').disabled = false;

    // Show/hide bundle discount
    if (showBundleDiscount) {
        const bundleDiscount = originalPrice - (subtotal + (voucherApplied ? voucherDiscount : 0) - (fastDelivery ? PRICES.fastDelivery : 0));
        document.getElementById('bundle-discount-amount').textContent = `−$${bundleDiscount.toFixed(2)}`;
        document.getElementById('bundle-discount-row').style.display = 'flex';
    } else {
        document.getElementById('bundle-discount-row').style.display = 'none';
    }

    // Calculate and show estimated views as range
    const minViews = (lyric * 30000) + (topic * 25000);
    const maxViews = (lyric * 100000) + (topic * 70000);
    document.getElementById('reach-value').textContent = `${minViews.toLocaleString()}-${maxViews.toLocaleString()} views`;
    document.getElementById('estimated-reach').style.display = 'flex';
}

// Checkout
async function checkout() {
    const { lyric, topic } = counts;
    const songLink = document.getElementById('song-link').value;
    const genre = document.getElementById('genre-select').value;
    const fastDelivery = document.querySelector('input[name="delivery"]:checked')?.value === 'fast';

    if (lyric === 0 && topic === 0) {
        alert('Please select at least one post type');
        return;
    }

    if (!songLink) {
        alert('Please add your song link');
        return;
    }

    // Validate TikTok URL
    if (!songLink.includes('tiktok.com')) {
        alert('Please enter a valid TikTok link (must contain tiktok.com)');
        return;
    }

    if (!genre) {
        alert('Please select a genre');
        return;
    }

    const total = parseFloat(document.getElementById('total-amount').textContent.replace('$', ''));

    let description = 'PWRD Campaign: ';
    if (lyric > 0 && topic > 0) {
        description += `${lyric} Lyric + ${topic} Topic`;
    } else if (lyric > 0) {
        description += `${lyric} Lyric Post${lyric > 1 ? 's' : ''}`;
    } else {
        description += `${topic} Topic Post${topic > 1 ? 's' : ''}`;
    }
    description += ` | Genre: ${genre} | Song: ${songLink}`;
    description += ` | Delivery: ${fastDelivery ? 'Fast (4 days)' : 'Normal (8 days)'}`;
    if (voucherApplied) {
        description += ` | Voucher: ${voucherCode}`;
    }

    try {
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lyricCount: lyric,
                topicCount: topic,
                fastDelivery: fastDelivery,
                voucherCode: voucherApplied ? voucherCode : null,
                total,
                description,
                songLink,
                genre
            })
        });

        const session = await response.json();
        const result = await stripe.redirectToCheckout({ sessionId: session.id });

        if (result.error) alert(result.error.message);
    } catch (error) {
        console.error('Error:', error);
        alert('Payment system not configured. Contact us directly.');
        window.location.href = `mailto:get@pwrd.live?subject=Booking&body=${encodeURIComponent(description + ' · Total: $' + total)}`;
    }
}

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});
