// Pricing
const PRICES = {
    lyric: { first: 80, additional: 40 },
    topic: { first: 60, additional: 30 },
    combo: 120,
    fastDelivery: 20
};

let counts = { lyric: 0, topic: 0 };
let bundleApplied = false;

// Stripe
const stripe = Stripe('pk_live_51SLngBFMBNQFsANi1d0FF4ZyyDohJoovuwdW9NJtk14fBe4FW9Xcrp1aS9MZDVAck0nIcAvkBMGxhY7DNIX8hnPH00ZI8NnzCj');

// Update counter
function updateCount(type, change) {
    counts[type] = Math.max(0, counts[type] + change);
    document.getElementById(`${type}-count`).textContent = counts[type];
    bundleApplied = false;
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

// Calculate price
function calculatePrice() {
    const { lyric, topic } = counts;
    let total = 0;
    let originalPrice = 0;
    let showDiscount = false;
    const totalVideos = lyric + topic;

    if (lyric === 0 && topic === 0) {
        document.getElementById('total-amount').textContent = '$0';
        document.getElementById('checkout-btn').disabled = true;
        document.getElementById('bundle-discount-row').style.display = 'none';
        document.getElementById('original-price').style.display = 'none';
        document.getElementById('estimated-views-row').style.display = 'none';
        document.getElementById('fast-delivery-row').style.display = 'none';
        return;
    }

    // Combo discount
    if (lyric > 0 && topic > 0 && bundleApplied) {
        total += PRICES.combo;
        originalPrice = PRICES.lyric.first + PRICES.topic.first;
        showDiscount = true;
        if (lyric > 1) {
            total += (lyric - 1) * PRICES.lyric.additional;
            originalPrice += (lyric - 1) * PRICES.lyric.additional;
        }
        if (topic > 1) {
            total += (topic - 1) * PRICES.topic.additional;
            originalPrice += (topic - 1) * PRICES.topic.additional;
        }
    } else {
        if (lyric > 0) {
            total += PRICES.lyric.first;
            if (lyric > 1) total += (lyric - 1) * PRICES.lyric.additional;
        }
        if (topic > 0) {
            total += PRICES.topic.first;
            if (topic > 1) total += (topic - 1) * PRICES.topic.additional;
        }
    }

    // Check delivery speed
    const fastDelivery = document.querySelector('input[name="delivery"]:checked')?.value === 'fast';
    if (fastDelivery) {
        total += PRICES.fastDelivery;
        document.getElementById('fast-delivery-row').style.display = 'flex';
    } else {
        document.getElementById('fast-delivery-row').style.display = 'none';
    }

    // Calculate and show estimated views
    const estimatedViews = totalVideos * 30000;
    document.getElementById('estimated-views').textContent = estimatedViews.toLocaleString();
    document.getElementById('estimated-views-row').style.display = 'flex';

    document.getElementById('total-amount').textContent = `$${total}`;
    document.getElementById('checkout-btn').disabled = false;

    // Show/hide discount row and original price
    if (showDiscount) {
        const savings = originalPrice - total;
        document.getElementById('original-price').textContent = `$${originalPrice}`;
        document.getElementById('original-price').style.display = 'inline';
        document.getElementById('bundle-discount-row').style.display = 'flex';
    } else {
        document.getElementById('bundle-discount-row').style.display = 'none';
        document.getElementById('original-price').style.display = 'none';
    }
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

    if (!genre) {
        alert('Please select a genre');
        return;
    }

    const total = parseInt(document.getElementById('total-amount').textContent.replace('$', ''));

    let description = 'PWRD Campaign: ';
    if (lyric > 0 && topic > 0) {
        description += `${lyric} Lyric + ${topic} Topic`;
    } else if (lyric > 0) {
        description += `${lyric} Lyric Post${lyric > 1 ? 's' : ''}`;
    } else {
        description += `${topic} Topic Post${topic > 1 ? 's' : ''}`;
    }
    description += ` | Genre: ${genre} | Song: ${songLink}`;
    description += ` | Delivery: ${fastDelivery ? 'Fast (5 days)' : 'Normal (2 weeks)'}`;

    try {
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lyricCount: lyric,
                topicCount: topic,
                fastDelivery: fastDelivery,
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
