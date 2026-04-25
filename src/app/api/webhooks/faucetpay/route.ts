import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const token = formData.get('token');

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 400 });
    }

    // Verify payment with FaucetPay
    const verifyRes = await fetch(`https://faucetpay.io/merchant/get-payment/${token}`, {
      method: 'GET'
    });

    const paymentData = await verifyRes.json();

    if (paymentData.valid) {
      // Payment is valid
      const customData = paymentData.custom; // We sent "orderId_month"
      const [orderId, monthStr] = customData.split('_');
      const month = parseInt(monthStr);

      const docRef = doc(db, 'orders', orderId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const orderData = docSnap.data();
        
        // Update months_paid if it's the next sequential month
        if (month > (orderData.months_paid || 0)) {
          await updateDoc(docRef, {
            months_paid: month
          });
        }

        // Record transaction
        const transactionId = paymentData.transaction_id || token;
        const paymentRecordRef = doc(db, 'payments', String(transactionId));
        await setDoc(paymentRecordRef, {
          order_id: orderId,
          amount: paymentData.amount1,
          currency: paymentData.currency1,
          status: 'completed',
          month_paid: month,
          gateway: 'faucetpay',
          faucetpay_details: paymentData,
          created_at: new Date().toISOString()
        });

        return NextResponse.json({ success: true });
      } else {
        console.error(`Order ${orderId} not found during IPN processing`);
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
    } else {
      console.warn(`Invalid payment token received: ${token}`);
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

  } catch (err: any) {
    console.error('Error processing FaucetPay IPN:', err);
    return NextResponse.json({ error: 'Internal server error', details: err.message }, { status: 500 });
  }
}
