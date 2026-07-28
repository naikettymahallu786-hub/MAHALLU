import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { PERMISSIONS, ROLE_PERMISSIONS } from '@mahallu/shared-config';
import { Payment } from '../models/Payment';
import { Receipt } from '../models/Receipt';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { PaymentStatus } from '@mahallu/shared-types';

const router = Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_TEgC71zlAgHt9w',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'Q7eUlKyyGO7dV2JRpyU1N0sP',
});

// Helper to decrement family balance and mark pending donations as paid
export async function processPaymentDues(payment: any) {
  if (!payment.paidForId) return;

  const { Member } = await import('../models/Member');
  const { Family } = await import('../models/Family');
  const { Donation } = await import('../models/Donation');

  const member = await Member.findById(payment.paidForId).lean();
  if (!member?.familyId) return;

  let remainingAmount = payment.amount;

  // Find pending donations in chronological order
  const pendingDonations = await Donation.find({
    familyId: member.familyId,
    status: 'pending'
  }).sort({ createdAt: 1 });

  for (const donation of pendingDonations) {
    if (remainingAmount <= 0) break;

    if (remainingAmount >= donation.amount) {
      await Donation.findByIdAndUpdate(donation._id, { status: 'paid', paymentId: payment._id });
      remainingAmount -= donation.amount;
    }
  }

  // Decrement the family's outstanding balance
  await Family.findByIdAndUpdate(member.familyId, {
    $inc: { outstandingBalance: -payment.amount }
  });
}

// Public Checkout UI Page for Mobile Browser
router.get('/checkout', async (req, res) => {
  const { orderId, paymentId, amount, name, email, phone, redirectUrl } = req.query;
  const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_TEgC71zlAgHt9w';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Mahallu Payment Checkout</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background-color: #FBF8F2;
            color: #0B4A42;
          }
          .loader {
            border: 4px solid #E2E8F0;
            border-top: 4px solid #C9972E;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .sub {
            font-size: 14px;
            color: #64748B;
            margin-bottom: 15px;
          }
          .button {
            display: inline-block;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 12px;
            font-weight: bold;
            font-size: 14px;
            margin-top: 15px;
            transition: opacity 0.2s;
          }
          .button:active {
            opacity: 0.8;
          }
        </style>
      </head>
      <body>
        <div id="loading" style="display: flex; flex-direction: column; align-items: center;">
          <div class="loader"></div>
          <div class="title">Initiating Secure Payment...</div>
          <div class="sub">Do not close this page or press back.</div>
        </div>

        <div id="success" style="display: none; flex-direction: column; align-items: center; text-align: center; padding: 20px;">
          <div style="font-size: 60px; color: #16A34A; margin-bottom: 15px;">✅</div>
          <div class="title" style="color: #16A34A; font-size: 22px;">Payment Successful!</div>
          <div class="sub" style="margin-bottom: 25px;">Your transaction has been verified successfully.</div>
          <a id="btn-success" href="#" class="button" style="background-color: #0B4A42;">Return to Mahallu App</a>
        </div>

        <div id="failure" style="display: none; flex-direction: column; align-items: center; text-align: center; padding: 20px;">
          <div style="font-size: 60px; color: #DC2626; margin-bottom: 15px;">❌</div>
          <div class="title" style="color: #DC2626; font-size: 22px;">Payment Failed</div>
          <div id="error-message" class="sub" style="margin-bottom: 25px;">Verification failed.</div>
          <a id="btn-failure" href="#" class="button" style="background-color: #DC2626;">Return to Mahallu App</a>
        </div>

        <script>
          let retryCount = 0;
          const customRedirectUrl = "${redirectUrl || 'mahallu://payments'}";
          
          function startCheckout() {
            try {
              if (typeof Razorpay === 'undefined') {
                if (retryCount > 100) { // Timeout after 10 seconds of retries
                  alert('Razorpay SDK failed to load. Please check your internet connection or reload the page.');
                  window.location.href = customRedirectUrl + "?status=failure&error=SDK+failed+to+load";
                  return;
                }
                retryCount++;
                setTimeout(startCheckout, 100);
                return;
              }

              const options = {
                key: "${key_id}",
                amount: ${amount},
                currency: "INR",
                name: "Mahallu ERP",
                description: "Dues & Donations Payment",
                order_id: "${orderId}",
                handler: async function (response) {
                  document.getElementById('loading').style.display = 'none';
                  try {
                    // Verify the payment signature on the backend
                    const verifyRes = await fetch('https://mahallu-backend-clae.onrender.com/api/v1/payments/verify', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        paymentId: "${paymentId}"
                      })
                    });
                    const verifyData = await verifyRes.json();
                    if (verifyData.success) {
                      const target = customRedirectUrl + "?status=success&paymentId=${paymentId}";
                      document.getElementById('btn-success').href = target;
                      document.getElementById('success').style.display = 'flex';
                      window.location.href = target;
                    } else {
                      const errMsg = verifyData.message || 'Verification failed';
                      const target = customRedirectUrl + "?status=failure&error=" + encodeURIComponent(errMsg);
                      document.getElementById('error-message').textContent = errMsg;
                      document.getElementById('btn-failure').href = target;
                      document.getElementById('failure').style.display = 'flex';
                      window.location.href = target;
                    }
                  } catch (e) {
                    const target = customRedirectUrl + "?status=failure&error=" + encodeURIComponent(e.message);
                    document.getElementById('error-message').textContent = e.message;
                    document.getElementById('btn-failure').href = target;
                    document.getElementById('failure').style.display = 'flex';
                    window.location.href = target;
                  }
                },
                prefill: {
                  name: "${name || ''}",
                  email: "${email || ''}",
                  contact: "${phone || ''}"
                },
                theme: {
                  color: "#0B4A42"
                },
                modal: {
                  ondismiss: function() {
                    window.location.href = customRedirectUrl + "?status=cancelled";
                  }
                }
              };
              const rzp = new Razorpay(options);
              rzp.open();
            } catch (err) {
              document.getElementById('loading').style.display = 'none';
              document.getElementById('error-message').textContent = err.message;
              document.getElementById('failure').style.display = 'flex';
              window.location.href = customRedirectUrl + "?status=failure&error=" + encodeURIComponent(err.message);
            }
          }
          startCheckout();
        </script>
      </body>
    </html>
  `;
  res.send(html);
});

// Verify payment signature
router.post('/verify', async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId } = req.body;
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'Q7eUlKyyGO7dV2JRpyU1N0sP')
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      throw new AppError('Invalid payment signature', 400);
    }

    const payment = await Payment.findByIdAndUpdate(paymentId, {
      status: PaymentStatus.SUCCESS,
      gatewayPaymentId: razorpay_payment_id,
      gatewaySignature: razorpay_signature,
    }, { new: true });

    // Auto-generate receipt
    if (payment) {
      const count = await Receipt.countDocuments({ tenantId: payment.tenantId });
      const receiptNo = `RCP-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;
      const receipt = await Receipt.create({ tenantId: payment.tenantId, receiptNo, paymentId: payment._id });
      await Payment.findByIdAndUpdate(payment._id, { receiptId: receipt._id });
      
      await processPaymentDues(payment);
    }

    res.json({ success: true, message: 'Payment verified', data: payment });
  } catch (e) { next(e); }
});

// Authenticated Routes
router.use(authenticate);

router.post('/create-order', async (req: AuthRequest, res, next) => {
  try {
    const userPermissions = ROLE_PERMISSIONS[req.user!.role] || [];
    const hasAccess = userPermissions.includes(PERMISSIONS.PAYMENT_CREATE) || 
                      userPermissions.includes(PERMISSIONS.PAYMENT_SELF);

    if (!hasAccess) {
      throw new AppError('Insufficient permissions', 403);
    }

    const { amount, type, paidForId, description, gateway = 'razorpay' } = req.body;
    const tenantId = req.user!.tenantId;

    const count = await Payment.countDocuments({ tenantId });
    const paymentNo = `PAY-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;

    if (gateway === 'cash' || gateway === 'bank_transfer' || gateway === 'upi') {
      const payment = await Payment.create({
        tenantId, paymentNo, type, amount,
        paidById: req.user!.userId, paidForId,
        gateway,
        status: PaymentStatus.SUCCESS, description,
      });

      // Auto-generate receipt
      const receiptCount = await Receipt.countDocuments({ tenantId });
      const receiptNo = `RCP-${new Date().getFullYear()}-${String(receiptCount + 1).padStart(6, '0')}`;
      const receipt = await Receipt.create({ tenantId, receiptNo, paymentId: payment._id });
      await Payment.findByIdAndUpdate(payment._id, { receiptId: receipt._id });

      await processPaymentDues(payment);

      return res.status(201).json({ success: true, message: 'Payment recorded successfully', data: { payment, receipt } });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // in paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: { tenantId, type, paidForId, description },
    });

    const payment = await Payment.create({
      tenantId, paymentNo, type, amount,
      paidById: req.user!.userId, paidForId,
      gateway: 'razorpay',
      gatewayOrderId: order.id,
      status: 'pending', description,
    });

    res.json({ success: true, data: { order, payment } });
  } catch (e) { next(e); }
});

router.get('/', authorize(PERMISSIONS.PAYMENT_VIEW), async (req: AuthRequest, res, next) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;
    const filter: Record<string, unknown> = { tenantId: req.user!.tenantId };
    if (type) filter.type = type;
    if (status) filter.status = status;
    const pageNum = parseInt(page as string), limitNum = parseInt(limit as string);
    const [payments, total] = await Promise.all([
      Payment.find(filter).populate('paidById paidForId', 'name phone').sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
      Payment.countDocuments(filter),
    ]);
    res.json({ success: true, data: payments, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } });
  } catch (e) { next(e); }
});

export default router;
